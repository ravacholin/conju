// Gestor de usuario y ajustes persistentes en el cliente

import { getCurrentUserId as getIdFromProgress } from './index.js'
import {
  getAttemptsByUser,
  getMasteryByUser,
  updateInDB,
  getFromDB,
  getAllFromDB,
  initDB,
  saveAttempt,
  saveMastery,
  saveSchedule,
  saveLearningSession,
  updateLearningSession,
  getLearningSessionsByUser
} from './database.js'
import { PROGRESS_CONFIG, STORAGE_CONFIG } from './config.js'
import authService from '../auth/authService.js'
import { progressDataCache } from '../cache/ProgressDataCache.js'
import { getSyncApiBase, getSyncAuthHeaderName, getSyncConfigDebug } from '../config/syncConfig.js'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('ProgressUserManager')

const SENSITIVE_KEY_PATTERNS = ['token', 'secret', 'authorization', 'auth', 'email', 'useremail', 'userid']
const SENSITIVE_VALUE_PATTERNS = [
  /bearer\s+\S+/i,
  /\S+@\S+/, // email
  /eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/ // JWT-like
]
const ALLOWED_PROD_KEYS = ['status', 'statusCode', 'statusText', 'code', 'reason', 'message', 'success']

function toBooleanEnv(value) {
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true'
  }
  return Boolean(value)
}

function sanitizeLogValue(key, value) {
  if (value === null || value === undefined) return value

  if (typeof value === 'string') {
    const lowerKey = key.toLowerCase()
    if (SENSITIVE_KEY_PATTERNS.some(pattern => lowerKey.includes(pattern))) {
      return '[REDACTED]'
    }

    if (SENSITIVE_VALUE_PATTERNS.some(regex => regex.test(value))) {
      return '[REDACTED]'
    }

    return value
  }

  if (Array.isArray(value)) {
    return value.map((entry, index) => sanitizeLogValue(`${key}[${index}]`, entry))
  }

  if (typeof value === 'object') {
    return sanitizeLogMetadata(value)
  }

  return value
}

function sanitizeLogMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object') return metadata

  const sanitized = Array.isArray(metadata) ? [] : {}

  Object.entries(metadata).forEach(([key, value]) => {
    sanitized[key] = sanitizeLogValue(key, value)
  })

  return sanitized
}

function filterProductionMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object') return undefined

  const filtered = {}

  Object.entries(metadata).forEach(([key, value]) => {
    const lowerKey = key.toLowerCase()
    const isAllowed =
      ALLOWED_PROD_KEYS.includes(key) ||
      lowerKey === 'code' ||
      lowerKey === 'reason' ||
      lowerKey === 'message' ||
      lowerKey.includes('status')

    if (!isAllowed) {
      return
    }

    if (value && typeof value === 'object') {
      return
    }

    filtered[key] = value
  })

  return Object.keys(filtered).length > 0 ? filtered : undefined
}

function isDevEnvironment() {
  return toBooleanEnv(import.meta?.env?.DEV)
}

function isProdEnvironment() {
  return toBooleanEnv(import.meta?.env?.PROD)
}

function prepareLogMetadata(metadata) {
  if (metadata === undefined) return undefined

  const sanitized = sanitizeLogMetadata(metadata)
  if (!sanitized || typeof sanitized !== 'object') {
    return sanitized
  }

  const prod = isProdEnvironment()
  const dev = isDevEnvironment()

  if (prod && !dev) {
    return filterProductionMetadata(sanitized)
  }

  return sanitized
}

function logWith(level, message, metadata) {
  const prepared = prepareLogMetadata(metadata)
  if (prepared !== undefined) {
    logger[level](message, prepared)
  } else {
    logger[level](message)
  }
}

const log = {
  debug: (message, metadata) => logWith('debug', message, metadata),
  info: (message, metadata) => logWith('info', message, metadata),
  warn: (message, metadata) => logWith('warn', message, metadata),
  error: (message, metadata) => logWith('error', message, metadata)
}

const LS_KEY = 'progress-user-settings'
const USER_ID_STORAGE_KEY = 'progress-system-user-id'
const SYNC_QUEUE_KEY = 'progress-sync-queue-v1'
const SYNC_ENDPOINT_KEY = 'progress-sync-endpoint'
const SYNC_AUTH_TOKEN_KEY = 'progress-sync-auth-token'
const SYNC_AUTH_HEADER_NAME_KEY = 'progress-sync-auth-header-name'

// Resolve sync base URL using intelligent environment detection
function resolveSyncBaseUrl() {
  try {
    // Check for localStorage override first
    if (typeof window !== 'undefined') {
      const override = window.localStorage.getItem(SYNC_ENDPOINT_KEY)
      if (override) {
        log.debug('Using sync URL override from localStorage', { override })
        return override
      }
    }
  } catch {}

  // Use the intelligent environment detection
  return getSyncApiBase()
}

let SYNC_BASE_URL = resolveSyncBaseUrl()
let SYNC_AUTH_TOKEN = null
let SYNC_AUTH_HEADER_NAME = getSyncAuthHeaderName()

export function setSyncEndpoint(url) {
  SYNC_BASE_URL = url || null
  try {
    if (typeof window !== 'undefined') {
      if (url) window.localStorage.setItem(SYNC_ENDPOINT_KEY, url)
      else window.localStorage.removeItem(SYNC_ENDPOINT_KEY)
    }
  } catch {}
}

export function getSyncEndpoint() {
  return SYNC_BASE_URL
}

// Helper to detect if a URL is a local development placeholder
function isLocalPlaceholderUrl(url) {
  if (!url) return false
  return url.includes('localhost:') || url.includes('127.0.0.1:') || url.includes('0.0.0.0:')
}

export function isSyncEnabled() {
  // Sync is enabled if there's a URL configured
  return !!SYNC_BASE_URL
}

// Helper function to check if we're in development mode with local server
export function isLocalSyncMode() {
  return !!SYNC_BASE_URL && isLocalPlaceholderUrl(SYNC_BASE_URL)
}

export function setSyncAuthToken(token, { persist = false } = {}) {
  SYNC_AUTH_TOKEN = token || null
  try {
    if (typeof window !== 'undefined') {
      if (persist && token) window.localStorage.setItem(SYNC_AUTH_TOKEN_KEY, token)
      else if (!persist) window.localStorage.removeItem(SYNC_AUTH_TOKEN_KEY)
    }
  } catch {}
}

export function getSyncAuthToken() {
  // Priority 1: Use auth service token if user is authenticated
  const authToken = authService.getToken()
  if (authToken) {
    return authToken
  }

  // Priority 2: Use manually set token
  if (SYNC_AUTH_TOKEN) return SYNC_AUTH_TOKEN

  // Priority 3: Use stored token
  try {
    if (typeof window !== 'undefined') {
      const t = window.localStorage.getItem(SYNC_AUTH_TOKEN_KEY)
      if (t) return t
    }
  } catch {}

  // Priority 4: Use environment token
  const envToken = (typeof import.meta !== 'undefined' && import.meta?.env?.VITE_PROGRESS_SYNC_TOKEN) ||
                   (typeof process !== 'undefined' && process?.env?.VITE_PROGRESS_SYNC_TOKEN) ||
                   null
  return envToken || null
}

export function clearSyncAuthToken() {
  SYNC_AUTH_TOKEN = null
  try {
    if (typeof window !== 'undefined') window.localStorage.removeItem(SYNC_AUTH_TOKEN_KEY)
  } catch {}
}

export function setSyncAuthHeaderName(name) {
  SYNC_AUTH_HEADER_NAME = name || 'Authorization'
  try {
    if (typeof window !== 'undefined') {
      if (name) window.localStorage.setItem(SYNC_AUTH_HEADER_NAME_KEY, name)
      else window.localStorage.removeItem(SYNC_AUTH_HEADER_NAME_KEY)
    }
  } catch {}
}


/**
 * Obtiene un ID de usuario robusto para usar en tracking/analytics.
 * Prioriza el ID del sistema de progreso; si no existe aún, intenta
 * recuperar o crear uno persistente en localStorage. Como último
 * recurso (SSR o storage inaccesible), genera un ID temporal.
 *
 * @returns {string} userId (persistente si es posible)
 */
export function getCurrentUserId() {
  // 1) Intentar usar el ID del sistema de progreso (si ya está inicializado)
  try {
    const id = getIdFromProgress()
    if (id && typeof id === 'string') return id
  } catch {
    // Continuar con fallbacks sin interrumpir flujo
  }

  // 2) Recuperar o crear un ID persistente en localStorage
  try {
    if (typeof window !== 'undefined' && window?.localStorage) {
      let userId = window.localStorage.getItem(USER_ID_STORAGE_KEY)
      if (!userId || typeof userId !== 'string') {
        userId = `user-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
        window.localStorage.setItem(USER_ID_STORAGE_KEY, userId)
      }
      return userId
    }
  } catch {
    // Si localStorage falla (modo privado, permisos, etc.), continuar al fallback temporal
  }

  // 3) Fallback temporal (no persistente) para entornos sin window/localStorage
  return `user-temp-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

export function getUserSettings(userId) {
  try {
    if (typeof window === 'undefined') {
      return defaultSettings()
    }
    const raw = window.localStorage.getItem(LS_KEY)
    const store = raw ? JSON.parse(raw) : {}
    const key = userId || getCurrentUserId() || 'default'
    const userCfg = store[key] || {}
    return { ...defaultSettings(), ...userCfg }
  } catch (error) {
    log.warn('Fallo leyendo user settings; usando valores por defecto', {
      message: error?.message,
      name: error?.name
    })
    return defaultSettings()
  }
}

function defaultSettings() {
  return {
    totalSessions: 0,
    createdAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    weeklyGoals: {
      CELLS_TO_IMPROVE: 3,
      MIN_SCORE: 75,
      SESSIONS: 5
    },
    expertMode: {
      enabled: PROGRESS_CONFIG?.EXPERT_MODE?.DEFAULT_ENABLED ?? false,
      overrides: {
        srs: { ...(PROGRESS_CONFIG?.EXPERT_MODE?.SRS || {}) },
        fsrs: { ...(PROGRESS_CONFIG?.EXPERT_MODE?.FSRS || {}) },
        customIntervals: PROGRESS_CONFIG?.EXPERT_MODE?.CUSTOM_INTERVALS || null
      },
      lastUpdatedAt: null
    },
    personalizationProfile: {
      style: 'balanced',
      intensity: 'standard',
      goalFocus: 'mixed'
    },
    socialPreferences: {
      communityChallenges: true,
      shareProgress: false
    },
    offlinePreferences: {
      prefetchReviews: true
    }
  }
}

export function updateUserSettings(userId, updater) {
  try {
    if (typeof window === 'undefined') {
      return defaultSettings()
    }

    const key = userId || getCurrentUserId() || 'default'
    const raw = window.localStorage.getItem(LS_KEY)
    const store = raw ? JSON.parse(raw) : {}
    const current = { ...defaultSettings(), ...(store[key] || {}) }
    const nextState = typeof updater === 'function'
      ? { ...current, ...updater(current) }
      : { ...current, ...updater }

    const persisted = {
      ...defaultSettings(),
      ...nextState,
      lastActiveAt: nextState.lastActiveAt || new Date().toISOString()
    }

    store[key] = persisted
    window.localStorage.setItem(LS_KEY, JSON.stringify(store))

    try {
      window.dispatchEvent(new CustomEvent('progress:user-settings-updated', {
        detail: { userId: key, settings: persisted }
      }))
    } catch (eventError) {
      log.warn('No se pudo emitir evento de actualización de settings', {
        message: eventError?.message,
        name: eventError?.name
      })
    }

    return persisted
  } catch (error) {
    log.warn('Fallo actualizando user settings; conservando valores actuales', {
      message: error?.message,
      name: error?.name
    })
    return defaultSettings()
  }
}

export function incrementSessionCount(userId) {
  try {
    if (typeof window === 'undefined') return
    const raw = window.localStorage.getItem(LS_KEY)
    const store = raw ? JSON.parse(raw) : {}
    const key = userId || getCurrentUserId() || 'default'
    const base = store[key] || defaultSettings()
    store[key] = {
      ...base,
      totalSessions: (base.totalSessions || 0) + 1,
      lastActiveAt: new Date().toISOString()
    }
    window.localStorage.setItem(LS_KEY, JSON.stringify(store))
  } catch {
    // Silencioso en producción; no bloquear UX
  }
}

// --------------------------
// Remote Sync Service (REST)
// --------------------------

function isBrowserOnline() {
  try {
    return typeof navigator === 'undefined' ? true : !!navigator.onLine
  } catch {
    return true
  }
}

function getQueue() {
  try {
    if (typeof window === 'undefined') return []
    const raw = window.localStorage.getItem(SYNC_QUEUE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function setQueue(q) {
  try {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(q))
  } catch {}
}

function enqueue(type, payload) {
  const q = getQueue()
  q.push({ type, payload, enqueuedAt: Date.now() })
  setQueue(q)
}

function getSyncSuccessMessage(strategy, results, accountSyncResult) {
  const legacyUploaded = (results.attempts?.uploaded || 0) +
                        (results.mastery?.uploaded || 0) +
                        (results.schedules?.uploaded || 0) +
                        (results.sessions?.uploaded || 0)

  const accountDownloaded = accountSyncResult?.downloaded ?
    (accountSyncResult.downloaded.attempts || 0) +
    (accountSyncResult.downloaded.mastery || 0) +
    (accountSyncResult.downloaded.schedules || 0) +
    (accountSyncResult.downloaded.sessions || 0) : 0

  const accountMerged = accountSyncResult?.merged ?
    (accountSyncResult.merged.attempts || 0) +
    (accountSyncResult.merged.mastery || 0) +
    (accountSyncResult.merged.schedules || 0) +
    (accountSyncResult.merged.sessions || 0) : 0

  switch (strategy) {
    case 'account+legacy': {
      const uploadsSummary = `${results.attempts?.uploaded || 0} intentos, ${results.mastery?.uploaded || 0} mastery, ${results.schedules?.uploaded || 0} srs, ${results.sessions?.uploaded || 0} sesiones`
      return `✅ Sincronización completa (descargados: ${accountSyncResult?.downloaded?.attempts || 0} intentos, ${accountSyncResult?.downloaded?.mastery || 0} mastery, ${accountSyncResult?.downloaded?.schedules || 0} srs, ${accountSyncResult?.downloaded?.sessions || 0} sesiones | subidos: ${uploadsSummary}). Datos alineados entre todos tus dispositivos.`
    }
    case 'account':
      if (accountDownloaded > 0) {
        return `✅ Sincronización completa (descargados: ${accountSyncResult.downloaded.attempts} intentos, ${accountSyncResult.downloaded.mastery} mastery, ${accountSyncResult.downloaded.schedules} srs, ${accountSyncResult.downloaded.sessions || 0} sesiones | aplicados: ${accountMerged} nuevos registros). Datos sincronizados desde tu cuenta Google.`
      } else {
        return `ℹ️ Sincronización completa (descargados: 0 intentos, 0 mastery, 0 srs, 0 sesiones). No hay datos nuevos en tu cuenta Google. Asegúrate de haber practicado en otros dispositivos.`
      }

    case 'legacy-fallback':
      if (legacyUploaded > 0) {
        return `⚠️ Account sync falló, pero legacy sync exitoso (subidos: ${results.attempts?.uploaded || 0} intentos, ${results.mastery?.uploaded || 0} mastery, ${results.schedules?.uploaded || 0} srs, ${results.sessions?.uploaded || 0} sesiones). Datos locales enviados al servidor.`
      } else {
        return `⚠️ Account sync falló y no hay datos locales para subir. Intenta practicar algo primero o verifica tu conexión.`
      }

    case 'legacy':
    default:
      if (legacyUploaded > 0) {
        return `✅ Sincronización legacy completa (subidos: ${results.attempts?.uploaded || 0} intentos, ${results.mastery?.uploaded || 0} mastery, ${results.schedules?.uploaded || 0} srs, ${results.sessions?.uploaded || 0} sesiones). Para sincronización entre dispositivos, haz login con Google.`
      } else {
        return `ℹ️ Sincronización legacy completa (subidos: 0). No hay datos locales nuevos para enviar. Para sincronización entre dispositivos, haz login con Google.`
      }
  }
}

async function postJSON(path, body, timeoutMs = 30000) {
  if (!SYNC_BASE_URL || typeof fetch === 'undefined') {
    throw new Error('Sync endpoint not configured')
  }

  const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null
  const t = ctrl ? setTimeout(() => {
    log.warn('Timeout alcanzado para solicitud de sincronización', { path, timeoutMs })
    ctrl.abort()
  }, timeoutMs) : null

  try {
    const headers = { 'Content-Type': 'application/json' }
    const token = getSyncAuthToken()
    const headerName = getSyncAuthHeaderName()
    const authToken = typeof authService?.getToken === 'function' ? authService.getToken() : null
    const isJwt = typeof authToken === 'string' && authToken.split('.').length === 3
    const resolvedUserId =
      (typeof authService?.getUser === 'function' && authService.getUser()?.id) ||
      getCurrentUserId()

    log.debug(`Configurando headers para ${path}`, {
      path,
      hasToken: !!token,
      tokenLength: token ? token.length : 0,
      headerName,
      hasJwt: isJwt,
      hasUserId: !!resolvedUserId
    })

    if (isJwt) {
      headers.Authorization = `Bearer ${authToken}`

      if (headerName && headerName.toLowerCase() !== 'authorization') {
        if (headerName.toLowerCase() === 'x-user-id' && resolvedUserId) {
          headers[headerName] = resolvedUserId
        } else if (token) {
          headers[headerName] = token
        }
      }

      if (!headers['X-User-Id'] && resolvedUserId) {
        headers['X-User-Id'] = resolvedUserId
      }
    } else if (token && headerName) {
      const normalizedHeader = headerName.toLowerCase()
      headers[headerName] = normalizedHeader === 'authorization' ? `Bearer ${token}` : token

      if (!headers['X-User-Id'] && normalizedHeader !== 'x-user-id' && resolvedUserId) {
        headers['X-User-Id'] = resolvedUserId
      }
    } else if (resolvedUserId) {
      headers['X-User-Id'] = resolvedUserId
      log.debug('Sin token, usando encabezado X-User-Id', {
        hasUserId: !!resolvedUserId
      })
    }

    log.debug('Enviando solicitud de sincronización', { path, timeoutMs })
    log.debug('Encabezados finales de la solicitud', { keys: Object.keys(headers) })

    const startTime = Date.now()

    const res = await fetch(`${SYNC_BASE_URL}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: ctrl?.signal
    })

    const elapsed = Date.now() - startTime
    log.info('Solicitud de sincronización completada', { path, status: res.status, elapsed })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      log.warn('Respuesta no exitosa del servicio de sincronización', {
        path,
        status: res.status,
        statusText: res.statusText,
        bodyLength: text?.length || 0
      })
      throw new Error(`HTTP ${res.status}: ${text}`)
    }

    const jsonResponse = await res.json().catch(() => ({}))
    log.debug('Respuesta JSON del servicio recibida', {
      path,
      keys: Object.keys(jsonResponse || {})
    })

    return jsonResponse
  } catch (error) {
    log.error('Error en solicitud de sincronización', {
      path,
      message: error?.message,
      status: error?.status
    })
    log.debug('Detalles del error en postJSON', {
      url: `${SYNC_BASE_URL}${path}`,
      errorName: error?.name,
      errorMessage: error?.message,
      errorStack: error?.stack?.split('\n')?.[0]
    })
    throw error
  } finally {
    if (t) clearTimeout(t)
  }
}

async function tryBulk(type, records) {
  if (!records || records.length === 0) return { success: true, count: 0 }
  const path = `/progress/${type}/bulk`
  // Strip local-only fields before upload
  const sanitize = (obj) => {
    if (!obj || typeof obj !== 'object') return obj
    const { syncPriority: _SYNC_PRIORITY, migratedAt: _MIGRATED_AT, ...rest } = obj
    return rest
  }
  const body = { records: records.map(sanitize) }
  const res = await postJSON(path, body)
  return { success: true, ...res }
}

async function markSynced(storeName, ids) {
  try {
    for (const id of ids) {
      if (!id) continue
      const existing = await getFromDB(storeName, id)
      if (!existing) continue
      const updated = { ...existing, syncedAt: new Date() }
      const db = await initDB()
      const tx = db.transaction(storeName, 'readwrite')
      const store = tx.objectStore(storeName)
      await store.put(updated)
      await tx.done
    }
  } catch (e) {
    log.warn('No se pudo marcar como sincronizado', {
      storeName,
      message: e?.message
    })
  }
}

/**
 * Wake up the server (Render free tier sleeps after 15 min)
 */
async function wakeUpServer() {
  if (!SYNC_BASE_URL) return false
  try {
    log.debug('Intentando despertar servidor de sincronización', {
      baseUrl: SYNC_BASE_URL
    })
    let requestUrl = SYNC_BASE_URL

    try {
      const syncUrl = new URL(SYNC_BASE_URL)

      // Remove query/hash noise so we ping the actual host
      syncUrl.search = ''
      syncUrl.hash = ''

      const trimmedPath = syncUrl.pathname.replace(/\/$/, '')
      if (trimmedPath.endsWith('/api')) {
        const segments = trimmedPath.split('/')
        segments.pop()
        const newPath = segments.join('/') || '/'
        syncUrl.pathname = newPath || '/'
      }

      requestUrl = syncUrl.toString()
      if (requestUrl.endsWith('/')) {
        requestUrl = requestUrl.slice(0, -1)
      }
    } catch (urlError) {
      log.warn('URL de sincronización inválida, usando fallback', {
        message: urlError?.message
      })
      requestUrl = SYNC_BASE_URL.replace(/\/api\/?$/, '')
    }

    // Mobile-compatible timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 25000)

    const response = await fetch(requestUrl, {
      method: 'GET',
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (response.status === 404) {
      log.warn('Servidor de sincronización respondió 404', {
        url: requestUrl,
        status: 404
      })
      return false
    }

    if (response.ok) {
      log.info('Servidor de sincronización despierto')
      return true
    }

    log.warn('No se pudo despertar el servidor', {
      status: response.status,
      statusText: response.statusText
    })
    return false
  } catch (error) {
    log.warn('Excepción al despertar el servidor', {
      message: error?.message
    })
    // Even if wake-up fails, continue with sync attempt
    return false
  }
}

/**
 * Downloads and merges data from all devices of the authenticated account
 */
export async function syncAccountData() {
  log.debug('Iniciando syncAccountData')

  // Debug sync configuration
  const syncConfig = getSyncConfigDebug()
  log.debug('Configuración de sincronización resuelta', syncConfig)

  // Debug authentication state
  const isAuthenticated = authService.isLoggedIn()
  const token = authService.getToken()
  const user = authService.getUser()
  const account = authService.getAccount()

  log.debug('Estado de autenticación para sync', {
    isAuthenticated,
    hasToken: !!token,
    tokenLength: token ? token.length : 0,
    hasUser: !!user,
    hasAccount: !!account,
    hasAccountEmail: !!account?.email,
    syncApiBase: syncConfig.apiBase,
    environment: syncConfig.isDev ? 'development' : (syncConfig.isProd ? 'production' : 'unknown')
  })

  if (!isAuthenticated) {
    log.warn('Account sync failed: user not authenticated')
    log.debug('Detalles de autenticación fallida', {
      hasToken: !!token,
      hasUser: !!user,
      hasAccount: !!account
    })
    return { success: false, reason: 'not_authenticated' }
  }

  if (!isSyncEnabled()) {
    log.warn('Account sync failed: sync not enabled', {
      hasEndpoint: !!SYNC_BASE_URL
    })
    return { success: false, reason: 'sync_disabled' }
  }

  if (!isBrowserOnline()) {
    log.warn('Account sync failed: browser offline')
    return { success: false, reason: 'offline' }
  }

  log.info('Iniciando sincronización de cuenta multi-dispositivo')
  log.debug('Resumen de configuración de sync', {
    hasEndpoint: !!SYNC_BASE_URL,
    tokenLength: token ? token.length : 0
  })

  // Wake up server first
  await wakeUpServer()

  try {
    log.debug('Llamando a /auth/sync/download')

    // Get merged data from all account devices (POST preferred, fallback to GET)
    let response = null
    try {
      response = await postJSON('/auth/sync/download', {})
    } catch (err) {
      log.warn('POST /auth/sync/download falló, intentando GET', {
        message: err?.message
      })
      try {
        const headers = { 'Accept': 'application/json' }
        const authToken = authService.getToken?.()
        const resolvedUserId = (authService.getUser?.()?.id) || getCurrentUserId()
        if (authToken) headers.Authorization = `Bearer ${authToken}`
        if (resolvedUserId) headers['X-User-Id'] = resolvedUserId
        const res = await fetch(`${SYNC_BASE_URL}/auth/sync/download`, { method: 'GET', headers })
        if (!res.ok) {
          const text = await res.text().catch(() => '')
          throw new Error(`HTTP ${res.status}: ${text}`)
        }
        response = await res.json().catch(() => ({}))
      } catch (fallbackErr) {
        log.error('Fallback GET /auth/sync/download también falló', {
          message: fallbackErr?.message
        })
        throw fallbackErr
      }
    }

    log.debug('Respuesta del servidor para syncAccountData', {
      success: response?.success || false,
      hasData: !!response?.data,
      responseKeys: Object.keys(response || {})
    })

    const accountData = response.data || {}

    log.debug('Datos recibidos de la cuenta', {
      attempts: accountData.attempts?.length || 0,
      mastery: accountData.mastery?.length || 0,
      schedules: accountData.schedules?.length || 0,
      sessions: accountData.sessions?.length || 0
    })

    log.debug('Estructura de accountData', {
      hasAttempts: Array.isArray(accountData.attempts),
      hasMastery: Array.isArray(accountData.mastery),
      hasSchedules: Array.isArray(accountData.schedules),
      totalObjects: Object.keys(accountData).length
    })

    // Merge with local data
    const mergeResults = await mergeAccountDataLocally(accountData)

    // Invalidate cached dashboard data so UI reflects freshly merged records
    try {
      if (mergeResults.userId) {
        progressDataCache.invalidateUser(mergeResults.userId)
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('progress:dataUpdated', {
              detail: { userId: mergeResults.userId, type: 'sync' }
            })
          )
        }
      }
    } catch (cacheError) {
      log.warn('No se pudo invalidar el caché tras la sync', {
        message: cacheError?.message
      })
    }

    log.info('Sincronización de cuenta completada', mergeResults)

    const finalResult = {
      success: true,
      merged: mergeResults,
      downloaded: {
        attempts: accountData.attempts?.length || 0,
        mastery: accountData.mastery?.length || 0,
        schedules: accountData.schedules?.length || 0,
        sessions: accountData.sessions?.length || 0
      }
    }

    log.debug('Resultado final de sync', finalResult)
    return finalResult
  } catch (error) {
    log.error('Error en sincronización de cuenta', {
      message: error?.message,
      status: error?.status
    })
    log.debug('Detalles del error de syncAccountData', {
      message: error?.message || 'No message',
      stack: error?.stack || 'No stack',
      name: error?.name || 'No name',
      status: error?.status || 'No status'
    })

    // Si es error de autenticación, limpiar auth state
    if (error?.status === 401 || error?.message?.includes('401') || error?.message?.includes('Unauthorized')) {
      log.debug('Error 401 detectado, limpiando auth state')
      authService.clearAuth()
    }

    return { success: false, error: String(error) }
  }
}

/**
 * Merges account data with local data, resolving conflicts intelligently
 *
 * Optimized merge strategy to avoid O(n²) complexity:
 * - Pre-loads all local collections once
 * - Builds maps with composite keys for O(1) lookups
 * - Updates in-memory structures during merge to maintain consistency
 * - Maintains linear O(n) complexity for large sync operations
 */
async function mergeAccountDataLocally(accountData) {
  const results = { attempts: 0, mastery: 0, schedules: 0, sessions: 0, conflicts: 0 }
  const currentUserId = getCurrentUserId()

  // Pre-load all local collections once to avoid repeated queries
  const allAttempts = await getAllFromDB(STORAGE_CONFIG.STORES.ATTEMPTS)
  const allMastery = await getAllFromDB(STORAGE_CONFIG.STORES.MASTERY)
  const allSchedules = await getAllFromDB(STORAGE_CONFIG.STORES.SCHEDULES)
  const allSessions = await getAllFromDB(STORAGE_CONFIG.STORES.LEARNING_SESSIONS)

  // Build lookup maps for O(1) access using composite keys
  const attemptMap = new Map()
  const masteryMap = new Map()
  const scheduleMap = new Map()
  const sessionMap = new Map()

  // Populate attempt map: key = "verbId|mood|tense|person|truncatedCreatedAt"
  allAttempts.forEach(attempt => {
    const createdTime = Math.floor(new Date(attempt.createdAt).getTime() / 5000) * 5000 // 5s truncation
    const key = `${attempt.verbId}|${attempt.mood}|${attempt.tense}|${attempt.person}|${createdTime}`
    attemptMap.set(key, attempt)
  })

  // Populate mastery map: key = "verbId|mood|tense|person"
  allMastery.forEach(mastery => {
    const key = `${mastery.verbId}|${mastery.mood}|${mastery.tense}|${mastery.person}`
    masteryMap.set(key, mastery)
  })

  // Populate schedule map: key = "verbId|mood|tense|person"
  allSchedules.forEach(schedule => {
    const key = `${schedule.verbId}|${schedule.mood}|${schedule.tense}|${schedule.person}`
    scheduleMap.set(key, schedule)
  })

  allSessions.forEach(session => {
    if (!session || !session.sessionId) return
    const key = session.sessionId
    sessionMap.set(key, session)
  })

  // Merge attempts using map lookups
  if (accountData.attempts) {
    for (const remoteAttempt of accountData.attempts) {
      try {
        const createdTime = Math.floor(new Date(remoteAttempt.createdAt).getTime() / 5000) * 5000
        const key = `${remoteAttempt.verbId}|${remoteAttempt.mood}|${remoteAttempt.tense}|${remoteAttempt.person}|${createdTime}`
        const existing = attemptMap.get(key)

        if (!existing) {
          // Add new attempt with current user ID
          const localAttempt = {
            ...remoteAttempt,
            userId: currentUserId,
            id: remoteAttempt.id || `attempt-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
            syncedAt: new Date()
          }
          await saveAttempt(localAttempt)
          // Update in-memory map to maintain consistency
          attemptMap.set(key, localAttempt)
          results.attempts++
        }
      } catch (error) {
        log.warn('Error merging attempt', {
          message: error?.message
        })
        results.conflicts++
      }
    }
  }

  // Merge learning sessions by sessionId (keep most recent updatedAt)
  if (Array.isArray(accountData.sessions)) {
    for (const remoteSession of accountData.sessions) {
      try {
        const key = remoteSession.sessionId || remoteSession.id
        if (!key) continue
        const existing = sessionMap.get(key)

        if (!existing) {
          const localSession = {
            ...remoteSession,
            sessionId: key,
            userId: currentUserId,
            updatedAt: remoteSession.updatedAt || new Date().toISOString(),
            syncedAt: new Date()
          }
          await saveLearningSession(localSession)
          sessionMap.set(key, localSession)
          results.sessions++
        } else if (remoteSession.updatedAt && new Date(remoteSession.updatedAt) > new Date(existing.updatedAt || 0)) {
          const updatedSession = {
            ...existing,
            ...remoteSession,
            sessionId: key,
            userId: currentUserId,
            syncedAt: new Date()
          }
          await updateLearningSession(existing.sessionId || key, updatedSession)
          sessionMap.set(key, updatedSession)
          results.sessions++
        }
      } catch (error) {
        log.warn('Error merging session', {
          message: error?.message
        })
        results.conflicts++
      }
    }
  }

  // Merge mastery using map lookups (keep best scores)
  if (accountData.mastery) {
    for (const remoteMastery of accountData.mastery) {
      try {
        const key = `${remoteMastery.verbId}|${remoteMastery.mood}|${remoteMastery.tense}|${remoteMastery.person}`
        const existing = masteryMap.get(key)

        if (!existing) {
          // Add new mastery record
          const localMastery = {
            ...remoteMastery,
            userId: currentUserId,
            id: remoteMastery.id || `mastery-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
            syncedAt: new Date()
          }
          await saveMastery(localMastery)
          // Update in-memory map to maintain consistency
          masteryMap.set(key, localMastery)
          results.mastery++
        } else if (new Date(remoteMastery.updatedAt) > new Date(existing.updatedAt)) {
          // Update with more recent score
          const updatedMastery = {
            ...existing,
            ...remoteMastery,
            userId: currentUserId,
            syncedAt: new Date()
          }
          await updateInDB(STORAGE_CONFIG.STORES.MASTERY, existing.id, updatedMastery)
          // Update in-memory map to maintain consistency
          masteryMap.set(key, updatedMastery)
          results.mastery++
        }
      } catch (error) {
        log.warn('Error merging mastery', {
          message: error?.message
        })
        results.conflicts++
      }
    }
  }

  // Merge schedules using map lookups (keep most recent)
  if (accountData.schedules) {
    for (const remoteSchedule of accountData.schedules) {
      try {
        const key = `${remoteSchedule.verbId}|${remoteSchedule.mood}|${remoteSchedule.tense}|${remoteSchedule.person}`
        const existing = scheduleMap.get(key)

        if (!existing) {
          // Add new schedule
          const localSchedule = {
            ...remoteSchedule,
            userId: currentUserId,
            id: remoteSchedule.id || `schedule-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
            syncedAt: new Date()
          }
          await saveSchedule(localSchedule)
          // Update in-memory map to maintain consistency
          scheduleMap.set(key, localSchedule)
          results.schedules++
        } else if (new Date(remoteSchedule.updatedAt) > new Date(existing.updatedAt)) {
          // Update with more recent schedule
          const updatedSchedule = {
            ...existing,
            ...remoteSchedule,
            userId: currentUserId,
            syncedAt: new Date()
          }
          await updateInDB(STORAGE_CONFIG.STORES.SCHEDULES, existing.id, updatedSchedule)
          // Update in-memory map to maintain consistency
          scheduleMap.set(key, updatedSchedule)
          results.schedules++
        }
      } catch (error) {
        log.warn('Error merging schedule', {
          message: error?.message
        })
        results.conflicts++
      }
    }
  }

  return { ...results, userId: currentUserId }
}

/**
 * Sincroniza intentos, mastery y schedules del usuario actual.
 * Envia solo registros sin syncedAt.
 */
export async function syncNow({ include = ['attempts','mastery','schedules','sessions'] } = {}) {
  const userId = getCurrentUserId()

  log.debug('syncNow: iniciando proceso de sincronización')
  log.debug('syncNow: resultado de getCurrentUserId', { hasUserId: !!userId })

  if (!userId) {
    log.warn('Sync failed: no user ID disponible')
    return { success: false, reason: 'no_user' }
  }

  if (!isSyncEnabled()) {
    log.warn('Sync failed: not enabled', { hasEndpoint: !!SYNC_BASE_URL })
    return { success: false, reason: 'sync_disabled' }
  }

  if (!isBrowserOnline()) {
    log.warn('Sync failed: browser offline')
    return { success: false, reason: 'offline' }
  }

  log.info('Iniciando sincronización para usuario actual')
  log.debug('URL del servidor de sincronización', { syncUrl: SYNC_BASE_URL })
  log.debug('Colecciones a sincronizar', { include })

  // Wake up server first (Render free tier issue)
  log.debug('Despertando servidor antes de sincronizar')
  await wakeUpServer()

  // Track what we actually push to la nube; defaults remain en cero hasta que haya cambios
  const results = {
    attempts: { uploaded: 0 },
    mastery: { uploaded: 0 },
    schedules: { uploaded: 0 },
    sessions: { uploaded: 0 }
  }

  let accountSyncResult = null
  let syncStrategy = 'legacy'
  let usedAccountSync = false
  let legacyUploadsPerformed = false

  // Try account sync first if user is authenticated
  if (authService.isLoggedIn()) {
    log.debug('Usuario autenticado: intentando sincronización de cuenta multi-dispositivo')
    syncStrategy = 'account'

    try {
      accountSyncResult = await syncAccountData()

      if (accountSyncResult.success) {
        usedAccountSync = true
        const downloadedCounts = accountSyncResult.downloaded || {}
        const totalDownloaded = (downloadedCounts.attempts || 0) +
                                (downloadedCounts.mastery || 0) +
                                (downloadedCounts.schedules || 0)
        if (totalDownloaded > 0) {
          log.info('Account sync exitoso con datos', accountSyncResult.downloaded)
        } else {
          log.info('Account sync exitoso sin datos nuevos; continuando con sincronización local')
        }
      } else {
        log.warn('Account sync falló', {
          reason: accountSyncResult.reason || accountSyncResult.error
        })
        log.info('Fallback: intentando legacy sync')
        syncStrategy = 'legacy-fallback'
      }
    } catch (error) {
      log.warn('Error en account sync', { message: error?.message })
      log.info('Fallback: intentando legacy sync tras error')
      accountSyncResult = { success: false, error: error.message }
      syncStrategy = 'legacy-fallback'
    }
  } else {
    log.debug('Usuario no autenticado: usando legacy sync')
  }

  try {
    if (include.includes('attempts')) {
      log.debug('Obteniendo attempts para sincronización', { hasUserId: !!userId })
      const all = await getAttemptsByUser(userId)
      log.debug('Total de attempts del usuario', { count: all.length })

      let unsynced = all.filter(a => !a.syncedAt)
      // Prioritize migrated records
      unsynced.sort((a, b) => (b?.syncPriority ? 1 : 0) - (a?.syncPriority ? 1 : 0))
      log.debug('Attempts sin sincronizar', { count: unsynced.length })

      if (unsynced.length > 0) {
        log.debug('Subiendo attempts al servidor', { count: unsynced.length })
        legacyUploadsPerformed = true
        const res = await tryBulk('attempts', unsynced)
        await markSynced(STORAGE_CONFIG.STORES.ATTEMPTS, unsynced.map(a => a.id))
        results.attempts = { uploaded: unsynced.length, server: res }
        log.info('Attempts subidos exitosamente', { count: unsynced.length })
      } else {
        log.debug('No hay attempts sin sincronizar')
      }
    }

    if (include.includes('mastery')) {
      log.debug('Obteniendo mastery para sincronización', { hasUserId: !!userId })
      const all = await getMasteryByUser(userId)
      log.debug('Total de registros mastery del usuario', { count: all.length })

      let unsynced = all.filter(m => !m.syncedAt)
      unsynced.sort((a, b) => (b?.syncPriority ? 1 : 0) - (a?.syncPriority ? 1 : 0))
      log.debug('Mastery sin sincronizar', { count: unsynced.length })

      if (unsynced.length > 0) {
        log.debug('Subiendo mastery al servidor', { count: unsynced.length })
        legacyUploadsPerformed = true
        const res = await tryBulk('mastery', unsynced)
        await markSynced(STORAGE_CONFIG.STORES.MASTERY, unsynced.map(m => m.id))
        results.mastery = { uploaded: unsynced.length, server: res }
        log.info('Mastery subidos exitosamente', { count: unsynced.length })
      } else {
        log.debug('No hay mastery sin sincronizar')
      }
    }

    if (include.includes('schedules')) {
      log.debug('Obteniendo schedules para sincronización', { hasUserId: !!userId })
      // Without a direct getter by user for all schedules, fetch all and filter
      const allSchedules = await getAllFromDB(STORAGE_CONFIG.STORES.SCHEDULES)
      const userSchedules = allSchedules.filter(s => s.userId === userId)
      log.debug('Total de schedules del usuario', { count: userSchedules.length })

      let unsynced = userSchedules.filter(s => !s.syncedAt)
      unsynced.sort((a, b) => (b?.syncPriority ? 1 : 0) - (a?.syncPriority ? 1 : 0))
      log.debug('Schedules sin sincronizar', { count: unsynced.length })

      if (unsynced.length > 0) {
        log.debug('Subiendo schedules al servidor', { count: unsynced.length })
        legacyUploadsPerformed = true
        const res = await tryBulk('schedules', unsynced)
        await markSynced(STORAGE_CONFIG.STORES.SCHEDULES, unsynced.map(s => s.id))
        results.schedules = { uploaded: unsynced.length, server: res }
        log.info('Schedules subidos exitosamente', { count: unsynced.length })
      } else {
        log.debug('No hay schedules sin sincronizar')
      }
    }

    if (include.includes('sessions')) {
      log.debug('Obteniendo sesiones para sincronización', { hasUserId: !!userId })
      const allSessions = await getLearningSessionsByUser(userId)
      log.debug('Total de sesiones del usuario', { count: allSessions.length })

      let unsynced = allSessions.filter((s) => !s.syncedAt)
      unsynced.sort((a, b) => (b?.syncPriority ? 1 : 0) - (a?.syncPriority ? 1 : 0))
      log.debug('Sesiones sin sincronizar', { count: unsynced.length })

      if (unsynced.length > 0) {
        log.debug('Subiendo sesiones al servidor', { count: unsynced.length })
        legacyUploadsPerformed = true
        const res = await tryBulk('sessions', unsynced)
        await markSynced(
          STORAGE_CONFIG.STORES.LEARNING_SESSIONS,
          unsynced.map((s) => s.sessionId || s.id)
        )
        results.sessions = { uploaded: unsynced.length, server: res }
        log.info('Sesiones subidas exitosamente', { count: unsynced.length })
      } else {
        log.debug('No hay sesiones sin sincronizar')
      }
    }

    // Procesar cola offline (si hubiera)
    await flushSyncQueue()

    if (usedAccountSync && legacyUploadsPerformed && syncStrategy !== 'legacy-fallback') {
      syncStrategy = 'account+legacy'
    } else if (usedAccountSync && syncStrategy !== 'legacy-fallback') {
      syncStrategy = 'account'
    }

    log.info('Sync completado', { strategy: syncStrategy })

    const response = {
      success: true,
      ...results,
      strategy: syncStrategy,
      message: getSyncSuccessMessage(syncStrategy, results, accountSyncResult)
    }

    if (accountSyncResult) {
      response.accountSync = accountSyncResult
      // Don't mark as failed if legacy sync worked
      if (accountSyncResult.success === false && syncStrategy === 'account') {
        response.success = false
      }
    }

    log.debug('Respuesta final de syncNow', response)
    return response
  } catch (error) {
    log.warn('Fallo de sincronización, encolando para más tarde', {
      message: error?.message
    })
    // Encolar lotes para reintentar
    return { success: false, error: String(error) }
  }
}

export async function flushSyncQueue() {
  if (!isSyncEnabled() || !isBrowserOnline()) return { flushed: 0 }
  const q = getQueue()
  if (q.length === 0) return { flushed: 0 }
  const pending = [...q]
  setQueue([])
  let ok = 0
  for (const entry of pending) {
    try {
      await postJSON(`/progress/${entry.type}`, entry.payload)
      ok++
    } catch {
      // Re-encolar si vuelve a fallar
      enqueue(entry.type, entry.payload)
    }
  }
  return { flushed: ok }
}

// Intento de auto-flush cuando vuelve la conectividad
if (typeof window !== 'undefined') {
  try {
    window.addEventListener('online', () => {
      flushSyncQueue().catch(() => {})
      // Intentar sync completo en background
      syncNow().catch(() => {})
    })
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        // Al volver a la app, intentar sincronizar en background
        setTimeout(() => { syncNow().catch(() => {}) }, 500)
      }
    })
  } catch {}
}

export default {
  getCurrentUserId,
  getUserSettings,
  incrementSessionCount,
  setSyncEndpoint,
  getSyncEndpoint,
  isSyncEnabled,
  isLocalSyncMode,
  syncNow,
  syncAccountData,
  flushSyncQueue,
  setSyncAuthToken,
  getSyncAuthToken,
  clearSyncAuthToken,
  setSyncAuthHeaderName
}

export const __testing = {
  wakeUpServer,
  sanitizeLogMetadata,
  filterProductionMetadata,
  prepareLogMetadata,
  isDevEnvironment,
  isProdEnvironment
}
