// Gestor de usuario y ajustes persistentes en el cliente

import { getCurrentUserId as getIdFromProgress } from './index.js'
import {
  getAttemptsByUser,
  getMasteryByUser,
  updateInDB,
  getAllFromDB,
  saveAttempt,
  saveMastery,
  saveSchedule
} from './database.js'
import { STORAGE_CONFIG } from './config.js'
import authService from '../auth/authService.js'
import { progressDataCache } from '../cache/ProgressDataCache.js'

const LS_KEY = 'progress-user-settings'
const USER_ID_STORAGE_KEY = 'progress-system-user-id'
const SYNC_QUEUE_KEY = 'progress-sync-queue-v1'
const SYNC_ENDPOINT_KEY = 'progress-sync-endpoint'
const SYNC_AUTH_TOKEN_KEY = 'progress-sync-auth-token'
const SYNC_AUTH_HEADER_NAME_KEY = 'progress-sync-auth-header-name'

// Resolve sync base URL from env or localStorage override
// Returns null if no real endpoint is configured (instead of falling back to localhost)
function resolveSyncBaseUrl() {
  try {
    if (typeof window !== 'undefined') {
      const override = window.localStorage.getItem(SYNC_ENDPOINT_KEY)
      if (override) return override
    }
  } catch {}
  // Vite-style env or generic
  const envUrl = (typeof import.meta !== 'undefined' && import.meta?.env?.VITE_PROGRESS_SYNC_URL) ||
                 (typeof process !== 'undefined' && process?.env?.VITE_PROGRESS_SYNC_URL) ||
                 null
  // Return null if no real endpoint configured (no fallback to localhost)
  return envUrl
}

let SYNC_BASE_URL = resolveSyncBaseUrl()
let SYNC_AUTH_TOKEN = null
let SYNC_AUTH_HEADER_NAME = (typeof import.meta !== 'undefined' && import.meta?.env?.VITE_PROGRESS_SYNC_AUTH_HEADER_NAME) || 'Authorization'

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

export function getSyncAuthHeaderName() {
  try {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem(SYNC_AUTH_HEADER_NAME_KEY)
      if (saved) return saved
    }
  } catch {}
  return SYNC_AUTH_HEADER_NAME
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
    console.warn('Fallo leyendo user settings; usando valores por defecto', error)
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
    }
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
                        (results.schedules?.uploaded || 0)

  const accountDownloaded = accountSyncResult?.downloaded ?
    (accountSyncResult.downloaded.attempts || 0) +
    (accountSyncResult.downloaded.mastery || 0) +
    (accountSyncResult.downloaded.schedules || 0) : 0

  const accountMerged = accountSyncResult?.merged ?
    (accountSyncResult.merged.attempts || 0) +
    (accountSyncResult.merged.mastery || 0) +
    (accountSyncResult.merged.schedules || 0) : 0

  switch (strategy) {
    case 'account':
      if (accountDownloaded > 0) {
        return `✅ Sincronización completa (descargados: ${accountSyncResult.downloaded.attempts} intentos, ${accountSyncResult.downloaded.mastery} mastery, ${accountSyncResult.downloaded.schedules} srs | aplicados: ${accountMerged} nuevos registros). Datos sincronizados desde tu cuenta Google.`
      } else {
        return `ℹ️ Sincronización completa (descargados: 0 intentos, 0 mastery, 0 srs). No hay datos nuevos en tu cuenta Google. Asegúrate de haber practicado en otros dispositivos.`
      }

    case 'legacy-fallback':
      if (legacyUploaded > 0) {
        return `⚠️ Account sync falló, pero legacy sync exitoso (subidos: ${results.attempts?.uploaded || 0} intentos, ${results.mastery?.uploaded || 0} mastery, ${results.schedules?.uploaded || 0} srs). Datos locales enviados al servidor.`
      } else {
        return `⚠️ Account sync falló y no hay datos locales para subir. Intenta practicar algo primero o verifica tu conexión.`
      }

    case 'legacy':
    default:
      if (legacyUploaded > 0) {
        return `✅ Sincronización legacy completa (subidos: ${results.attempts?.uploaded || 0} intentos, ${results.mastery?.uploaded || 0} mastery, ${results.schedules?.uploaded || 0} srs). Para sincronización entre dispositivos, haz login con Google.`
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
    console.log(`⏰ Timeout de ${timeoutMs}ms alcanzado para ${path}`)
    ctrl.abort()
  }, timeoutMs) : null

  try {
    const headers = { 'Content-Type': 'application/json' }
    const token = getSyncAuthToken()
    const headerName = getSyncAuthHeaderName()

    console.log(`🔍 DEBUG postJSON: Configurando headers para ${path}`, {
      hasToken: !!token,
      tokenLength: token ? token.length : 0,
      headerName,
      tokenPreview: token ? `${token.slice(0, 15)}...` : 'NO_TOKEN'
    })

    if (token && headerName) {
      headers[headerName] = headerName.toLowerCase() === 'authorization' ? `Bearer ${token}` : token
    } else {
      // Sin token configurado: enviar userId local como X-User-Id
      const uid = getCurrentUserId()
      if (uid) headers['X-User-Id'] = uid
      console.log(`🔍 DEBUG postJSON: Sin token, usando X-User-Id: ${uid}`)
    }

    console.log(`📡 Enviando ${path} con timeout ${timeoutMs}ms`)
    console.log(`🔍 DEBUG postJSON: Headers finales:`, Object.keys(headers))

    const startTime = Date.now()

    const res = await fetch(`${SYNC_BASE_URL}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: ctrl?.signal
    })

    const elapsed = Date.now() - startTime
    console.log(`✅ ${path} completado en ${elapsed}ms con status ${res.status}`)

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      console.log(`🔍 DEBUG postJSON: Error response:`, {
        status: res.status,
        statusText: res.statusText,
        responseText: text,
        url: `${SYNC_BASE_URL}${path}`
      })
      throw new Error(`HTTP ${res.status}: ${text}`)
    }

    const jsonResponse = await res.json().catch(() => ({}))
    console.log(`🔍 DEBUG postJSON: Success response keys:`, Object.keys(jsonResponse))

    return jsonResponse
  } catch (error) {
    console.error(`❌ Error en ${path}:`, error.message)
    console.log(`🔍 DEBUG postJSON: Error detalles:`, {
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
  const body = { records }
  const res = await postJSON(path, body)
  return { success: true, ...res }
}

async function markSynced(storeName, ids) {
  try {
    for (const id of ids) {
      await updateInDB(storeName, id, { syncedAt: new Date() })
    }
  } catch (e) {
    console.warn('No se pudo marcar como sincronizado:', e)
  }
}

/**
 * Wake up the server (Render free tier sleeps after 15 min)
 */
async function wakeUpServer() {
  if (!SYNC_BASE_URL) return false
  try {
    console.log('☁️ Despertando servidor...')
    const baseUrl = SYNC_BASE_URL.replace('/api', '')

    // Mobile-compatible timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 25000)

    const response = await fetch(baseUrl, {
      method: 'GET',
      signal: controller.signal
    })

    clearTimeout(timeoutId)
    console.log('✅ Servidor despierto')
    return response.ok
  } catch (error) {
    console.warn('⚠️ No se pudo despertar el servidor:', error.message)
    // Even if wake-up fails, continue with sync attempt
    return false
  }
}

/**
 * Downloads and merges data from all devices of the authenticated account
 */
export async function syncAccountData() {
  console.log('🔍 DEBUG: Iniciando syncAccountData()')

  // Debug authentication state
  const isAuthenticated = authService.isLoggedIn()
  const token = authService.getToken()
  const user = authService.getUser()
  const account = authService.getAccount()

  console.log('🔍 DEBUG: Estado de autenticación:', {
    isAuthenticated,
    hasToken: !!token,
    tokenLength: token ? token.length : 0,
    hasUser: !!user,
    hasAccount: !!account,
    userEmail: account?.email || 'N/A'
  })

  if (!isAuthenticated) {
    console.log('❌ Account sync failed: user not authenticated')
    console.log('🔍 DEBUG: Detalles de auth fallida:', { token: !!token, user: !!user, account: !!account })
    return { success: false, reason: 'not_authenticated' }
  }

  if (!isSyncEnabled()) {
    console.log('❌ Account sync failed: not enabled. URL:', SYNC_BASE_URL)
    return { success: false, reason: 'sync_disabled' }
  }

  if (!isBrowserOnline()) {
    console.log('❌ Account sync failed: browser offline')
    return { success: false, reason: 'offline' }
  }

  console.log('🔄 Iniciando sincronización de cuenta multi-dispositivo...')
  console.log('🔍 DEBUG: Configuración sync:', {
    syncUrl: SYNC_BASE_URL,
    tokenPreview: token ? `${token.slice(0, 20)}...` : 'NO_TOKEN'
  })

  // Wake up server first
  await wakeUpServer()

  try {
    console.log('🔍 DEBUG: Llamando a /auth/sync/download...')

    // Get merged data from all account devices
    const response = await postJSON('/auth/sync/download', {})

    console.log('🔍 DEBUG: Respuesta del servidor:', {
      success: response?.success || false,
      hasData: !!response?.data,
      responseKeys: Object.keys(response || {})
    })

    const accountData = response.data || {}

    console.log('📥 Datos recibidos de la cuenta:', {
      attempts: accountData.attempts?.length || 0,
      mastery: accountData.mastery?.length || 0,
      schedules: accountData.schedules?.length || 0
    })

    console.log('🔍 DEBUG: Estructura de accountData:', {
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
      console.warn('No se pudo invalidar el caché tras la sync:', cacheError?.message || cacheError)
    }

    console.log('✅ Sincronización de cuenta completada:', mergeResults)

    const finalResult = {
      success: true,
      merged: mergeResults,
      downloaded: {
        attempts: accountData.attempts?.length || 0,
        mastery: accountData.mastery?.length || 0,
        schedules: accountData.schedules?.length || 0
      }
    }

    console.log('🔍 DEBUG: Resultado final de sync:', finalResult)
    return finalResult
  } catch (error) {
    console.error('❌ Error en sincronización de cuenta:', error)
    console.log('🔍 DEBUG: Error detalles:', {
      message: error?.message || 'No message',
      stack: error?.stack || 'No stack',
      name: error?.name || 'No name',
      status: error?.status || 'No status'
    })

    // Si es error de autenticación, limpiar auth state
    if (error?.status === 401 || error?.message?.includes('401') || error?.message?.includes('Unauthorized')) {
      console.log('🔍 DEBUG: Error 401 detectado, limpiando auth state...')
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
  const results = { attempts: 0, mastery: 0, schedules: 0, conflicts: 0 }
  const currentUserId = getCurrentUserId()

  // Pre-load all local collections once to avoid repeated queries
  const existingAttempts = await getAttemptsByUser(currentUserId)
  const existingMastery = await getMasteryByUser(currentUserId)
  const allSchedules = await getAllFromDB(STORAGE_CONFIG.STORES.SCHEDULES)
  const existingSchedules = allSchedules.filter(s => s.userId === currentUserId)

  // Build lookup maps for O(1) access using composite keys
  const attemptMap = new Map()
  const masteryMap = new Map()
  const scheduleMap = new Map()

  // Populate attempt map: key = "verbId|mood|tense|truncatedCreatedAt"
  existingAttempts.forEach(attempt => {
    const createdTime = Math.floor(new Date(attempt.createdAt).getTime() / 5000) * 5000 // 5s truncation
    const key = `${attempt.verbId}|${attempt.mood}|${attempt.tense}|${createdTime}`
    attemptMap.set(key, attempt)
  })

  // Populate mastery map: key = "verbId|mood|tense"
  existingMastery.forEach(mastery => {
    const key = `${mastery.verbId}|${mastery.mood}|${mastery.tense}`
    masteryMap.set(key, mastery)
  })

  // Populate schedule map: key = "verbId|mood|tense"
  existingSchedules.forEach(schedule => {
    const key = `${schedule.verbId}|${schedule.mood}|${schedule.tense}`
    scheduleMap.set(key, schedule)
  })

  // Merge attempts using map lookups
  if (accountData.attempts) {
    for (const remoteAttempt of accountData.attempts) {
      try {
        const createdTime = Math.floor(new Date(remoteAttempt.createdAt).getTime() / 5000) * 5000
        const key = `${remoteAttempt.verbId}|${remoteAttempt.mood}|${remoteAttempt.tense}|${createdTime}`
        const existing = attemptMap.get(key)

        if (!existing) {
          // Add new attempt with current user ID
          const localAttempt = {
            ...remoteAttempt,
            userId: currentUserId,
            id: `attempt-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
            syncedAt: new Date()
          }
          await saveAttempt(localAttempt)
          // Update in-memory map to maintain consistency
          attemptMap.set(key, localAttempt)
          results.attempts++
        }
      } catch (error) {
        console.warn('Error merging attempt:', error)
        results.conflicts++
      }
    }
  }

  // Merge mastery using map lookups (keep best scores)
  if (accountData.mastery) {
    for (const remoteMastery of accountData.mastery) {
      try {
        const key = `${remoteMastery.verbId}|${remoteMastery.mood}|${remoteMastery.tense}`
        const existing = masteryMap.get(key)

        if (!existing) {
          // Add new mastery record
          const localMastery = {
            ...remoteMastery,
            userId: currentUserId,
            id: `mastery-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
            syncedAt: new Date()
          }
          await saveMastery(localMastery)
          // Update in-memory map to maintain consistency
          masteryMap.set(key, localMastery)
          results.mastery++
        } else if (remoteMastery.score > existing.score) {
          // Update with better score
          const updatedMastery = {
            ...existing,
            score: remoteMastery.score,
            attempts: Math.max(existing.attempts || 0, remoteMastery.attempts || 0),
            lastPracticed: new Date(Math.max(
              new Date(existing.lastPracticed || 0).getTime(),
              new Date(remoteMastery.lastPracticed || 0).getTime()
            )),
            syncedAt: new Date()
          }
          await updateInDB(STORAGE_CONFIG.STORES.MASTERY, existing.id, updatedMastery)
          // Update in-memory map to maintain consistency
          masteryMap.set(key, updatedMastery)
          results.mastery++
        }
      } catch (error) {
        console.warn('Error merging mastery:', error)
        results.conflicts++
      }
    }
  }

  // Merge schedules using map lookups (keep most recent)
  if (accountData.schedules) {
    for (const remoteSchedule of accountData.schedules) {
      try {
        const key = `${remoteSchedule.verbId}|${remoteSchedule.mood}|${remoteSchedule.tense}`
        const existing = scheduleMap.get(key)

        if (!existing) {
          // Add new schedule
          const localSchedule = {
            ...remoteSchedule,
            userId: currentUserId,
            id: `schedule-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
            syncedAt: new Date()
          }
          await saveSchedule(localSchedule)
          // Update in-memory map to maintain consistency
          scheduleMap.set(key, localSchedule)
          results.schedules++
        } else if (new Date(remoteSchedule.updatedAt || 0) > new Date(existing.updatedAt || 0)) {
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
        console.warn('Error merging schedule:', error)
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
export async function syncNow({ include = ['attempts','mastery','schedules'] } = {}) {
  const userId = getCurrentUserId()
  if (!userId) {
    console.log('❌ Sync failed: no user ID')
    return { success: false, reason: 'no_user' }
  }

  if (!isSyncEnabled()) {
    console.log('❌ Sync failed: not enabled. URL:', SYNC_BASE_URL)
    return { success: false, reason: 'sync_disabled' }
  }

  if (!isBrowserOnline()) {
    console.log('❌ Sync failed: browser offline')
    return { success: false, reason: 'offline' }
  }

  console.log('🔄 Iniciando sincronización para usuario:', userId)
  console.log('🌐 URL del servidor:', SYNC_BASE_URL)

  // Wake up server first (Render free tier issue)
  console.log('⏰ Despertando servidor antes de sincronizar...')
  await wakeUpServer()

  let accountSyncResult = null
  let syncStrategy = 'legacy'

  // Try account sync first if user is authenticated
  if (authService.isLoggedIn()) {
    console.log('🔑 Usuario autenticado: intentando sincronización de cuenta multi-dispositivo')
    syncStrategy = 'account'

    try {
      accountSyncResult = await syncAccountData()

      if (accountSyncResult.success && accountSyncResult.downloaded) {
        const totalDownloaded = accountSyncResult.downloaded.attempts +
                                accountSyncResult.downloaded.mastery +
                                accountSyncResult.downloaded.schedules

        if (totalDownloaded > 0) {
          console.log('✅ Account sync exitoso con datos:', accountSyncResult.downloaded)
          // Account sync successful with data, skip legacy sync
          const response = { success: true, ...results, strategy: 'account' }
          response.accountSync = accountSyncResult
          return response
        } else {
          console.log('ℹ️ Account sync exitoso pero sin datos nuevos, continuando con legacy sync')
        }
      } else {
        console.warn('⚠️ Account sync falló:', accountSyncResult.reason || accountSyncResult.error)
        console.log('🔄 Fallback: intentando legacy sync...')
        syncStrategy = 'legacy-fallback'
      }
    } catch (error) {
      console.warn('⚠️ Error en account sync:', error.message)
      console.log('🔄 Fallback: intentando legacy sync...')
      accountSyncResult = { success: false, error: error.message }
      syncStrategy = 'legacy-fallback'
    }
  } else {
    console.log('🔓 Usuario no autenticado: usando legacy sync')
  }

  const results = {}
  try {
    if (include.includes('attempts')) {
      const all = await getAttemptsByUser(userId)
      const unsynced = all.filter(a => !a.syncedAt)
      if (unsynced.length) {
        const res = await tryBulk('attempts', unsynced)
        await markSynced(STORAGE_CONFIG.STORES.ATTEMPTS, unsynced.map(a => a.id))
        results.attempts = { uploaded: unsynced.length, server: res }
      } else {
        results.attempts = { uploaded: 0 }
      }
    }

    if (include.includes('mastery')) {
      const all = await getMasteryByUser(userId)
      const unsynced = all.filter(m => !m.syncedAt)
      if (unsynced.length) {
        const res = await tryBulk('mastery', unsynced)
        await markSynced(STORAGE_CONFIG.STORES.MASTERY, unsynced.map(m => m.id))
        results.mastery = { uploaded: unsynced.length, server: res }
      } else {
        results.mastery = { uploaded: 0 }
      }
    }

    if (include.includes('schedules')) {
      // Without a direct getter by user for all schedules, fetch all and filter
      const allSchedules = await getAllFromDB(STORAGE_CONFIG.STORES.SCHEDULES)
      const userSchedules = allSchedules.filter(s => s.userId === userId)
      const unsynced = userSchedules.filter(s => !s.syncedAt)
      if (unsynced.length) {
        const res = await tryBulk('schedules', unsynced)
        await markSynced(STORAGE_CONFIG.STORES.SCHEDULES, unsynced.map(s => s.id))
        results.schedules = { uploaded: unsynced.length, server: res }
      } else {
        results.schedules = { uploaded: 0 }
      }
    }

    // Procesar cola offline (si hubiera)
    await flushSyncQueue()

    console.log(`🎯 Sync completado usando estrategia: ${syncStrategy}`)

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

    console.log('🔍 DEBUG: Respuesta final de syncNow:', response)
    return response
  } catch (error) {
    console.warn('Fallo de sincronización, encolando para más tarde:', error?.message)
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
  setSyncAuthHeaderName,
  getSyncAuthHeaderName
}
