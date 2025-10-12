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
  getLearningSessionsByUser,
  batchSaveToDB,
  batchUpdateInDB
} from './database.js'
import { PROGRESS_CONFIG, STORAGE_CONFIG } from './config.js'
import authService from '../auth/authService.js'
import { progressDataCache } from '../cache/ProgressDataCache.js'
import { getSyncConfigDebug } from '../config/syncConfig.js'
import { createLogger } from '../utils/logger.js'
import AuthTokenManager from './AuthTokenManager.js'
import SyncService from './SyncService.js'

const logger = createLogger('progress:userManager')

const env = (typeof import.meta !== 'undefined' && import.meta?.env) || (typeof process !== 'undefined' ? {
  DEV: process.env?.NODE_ENV !== 'production',
  PROD: process.env?.NODE_ENV === 'production'
} : { DEV: true, PROD: false })

const isDevEnvironment = !!env?.DEV && !env?.PROD

const SENSITIVE_PATTERNS = ['token', 'authorization', 'auth', 'email', 'cookie', 'password', 'secret']

function maskSensitiveValue(value) {
  if (value == null) return value
  if (typeof value === 'boolean' || typeof value === 'number') return value
  if (typeof value === 'string') {
    return { redacted: true, length: value.length }
  }
  if (Array.isArray(value)) {
    return { redacted: true, items: value.length }
  }
  if (typeof value === 'object') {
    return { redacted: true, keys: Object.keys(value).length }
  }
  return { redacted: true }
}

function sanitizeMeta(meta, depth = 0) {
  if (meta == null || depth > 5) return meta
  if (Array.isArray(meta)) {
    return meta.map((item) => sanitizeMeta(item, depth + 1))
  }
  if (typeof meta === 'object') {
    return Object.entries(meta).reduce((acc, [key, value]) => {
      const lowerKey = key.toLowerCase()
      if (SENSITIVE_PATTERNS.some((pattern) => lowerKey.includes(pattern))) {
        acc[key] = maskSensitiveValue(value)
      } else if (typeof value === 'object' && value !== null) {
        acc[key] = sanitizeMeta(value, depth + 1)
      } else if (typeof value === 'string' && /[\w.+-]+@[\w.-]+\.[a-z]{2,}/i.test(value)) {
        acc[key] = '[redacted-email]'
      } else {
        acc[key] = value
      }
      return acc
    }, Array.isArray(meta) ? [] : {})
  }
  if (typeof meta === 'string' && /[\w.+-]+@[\w.-]+\.[a-z]{2,}/i.test(meta)) {
    return '[redacted-email]'
  }
  return meta
}

function formatMeta(meta) {
  if (meta == null) return undefined
  const sanitized = sanitizeMeta(meta)
  if (isDevEnvironment) {
    return sanitized
  }

  if (typeof sanitized === 'object' && !Array.isArray(sanitized)) {
    const summary = {}
    if (typeof sanitized.status === 'number') summary.status = sanitized.status
    if (typeof sanitized.statusCode === 'number') summary.statusCode = sanitized.statusCode
    if (typeof sanitized.statusText === 'string') summary.statusText = sanitized.statusText
    if (typeof sanitized.errorName === 'string') summary.errorName = sanitized.errorName
    if (typeof sanitized.errorMessage === 'string') summary.errorMessage = sanitized.errorMessage
    if (typeof sanitized.message === 'string') summary.message = sanitized.message
    return Object.keys(summary).length > 0 ? summary : undefined
  }

  return undefined
}

const safeLogger = {
  debug(message, meta) {
    logger.debug(message, formatMeta(meta))
  },
  info(message, meta) {
    logger.info(message, formatMeta(meta))
  },
  warn(message, meta) {
    logger.warn(message, formatMeta(meta))
  },
  error(message, meta) {
    logger.error(message, formatMeta(meta))
  }
}

const LS_KEY = 'progress-user-settings'
const USER_ID_STORAGE_KEY = 'progress-system-user-id'

// Re-export auth functions from AuthTokenManager for backward compatibility
export const setSyncEndpoint = AuthTokenManager.setSyncEndpoint
export const getSyncEndpoint = AuthTokenManager.getSyncEndpoint
export const isSyncEnabled = AuthTokenManager.isSyncEnabled
export const isLocalSyncMode = AuthTokenManager.isLocalSyncMode
export const setSyncAuthToken = AuthTokenManager.setSyncAuthToken
export const getSyncAuthToken = AuthTokenManager.getSyncAuthToken
export const clearSyncAuthToken = AuthTokenManager.clearSyncAuthToken
export const setSyncAuthHeaderName = AuthTokenManager.setSyncAuthHeaderName

// Helper function to get header name (with fallback)
function getSyncAuthHeaderName() {
  return AuthTokenManager.getSyncAuthHeaderName()
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
    safeLogger.warn('Fallo leyendo user settings; usando valores por defecto', {
      message: error?.message || String(error),
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
      safeLogger.warn('No se pudo emitir evento de actualización de settings', {
        message: eventError?.message || String(eventError),
        name: eventError?.name
      })
    }

    return persisted
  } catch (error) {
    safeLogger.warn('Fallo actualizando user settings; conservando valores actuales', {
      message: error?.message || String(error),
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
// Delegated to SyncService module
// --------------------------

// Re-export and destructure sync functions from SyncService for internal use
const {
  isBrowserOnline,
  enqueue,
  getSyncSuccessMessage,
  postJSON,
  tryBulk,
  wakeUpServer,
  flushSyncQueue: flushSyncQueueFromService
} = SyncService

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
    safeLogger.warn('No se pudo marcar como sincronizado', {
      message: e?.message || String(e),
      name: e?.name
    })
  }
}

// --------------------------
// Account Sync
// --------------------------

/**
 * Downloads and merges data from all devices of the authenticated account
 */
export async function syncAccountData() {
  safeLogger.debug('syncAccountData: inicio')

  // Debug sync configuration
  const syncConfig = getSyncConfigDebug()
  safeLogger.debug('syncAccountData: configuración detectada', {
    apiBase: syncConfig.apiBase,
    authHeaderName: syncConfig.authHeaderName,
    isDev: !!syncConfig.isDev,
    isProd: !!syncConfig.isProd
  })

  // Debug authentication state
  const isAuthenticated = authService.isLoggedIn()
  const token = authService.getToken()
  const user = authService.getUser()
  const account = authService.getAccount()

  safeLogger.debug('syncAccountData: estado de autenticación', {
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
    safeLogger.warn('syncAccountData: usuario no autenticado')
    safeLogger.debug('syncAccountData: detalles de autenticación fallida', {
      hasToken: !!token,
      hasUser: !!user,
      hasAccount: !!account
    })
    return { success: false, reason: 'not_authenticated' }
  }

  if (!isSyncEnabled()) {
    safeLogger.warn('syncAccountData: sincronización deshabilitada', {
      hasEndpoint: !!getSyncEndpoint()
    })
    return { success: false, reason: 'sync_disabled' }
  }

  if (!isBrowserOnline()) {
    safeLogger.warn('syncAccountData: navegador sin conexión')
    return { success: false, reason: 'offline' }
  }

  safeLogger.info('syncAccountData: iniciando sincronización multi-dispositivo')
  safeLogger.debug('syncAccountData: configuración de sincronización', {
    hasSyncUrl: !!getSyncEndpoint(),
    tokenLength: token ? token.length : 0
  })

  // Wake up server first
  await wakeUpServer()

  try {
    safeLogger.debug('syncAccountData: llamando a /auth/sync/download')

    // Get merged data from all account devices (POST preferred, fallback to GET)
    let response = null
    try {
      response = await postJSON('/auth/sync/download', {})
    } catch (err) {
      safeLogger.warn('syncAccountData: POST /auth/sync/download falló, intentando GET', {
        message: err?.message || String(err),
        name: err?.name
      })
      try {
        const headers = { 'Accept': 'application/json' }
        const authToken = authService.getToken?.()
        const resolvedUserId = (authService.getUser?.()?.id) || getCurrentUserId()
        if (authToken) headers.Authorization = `Bearer ${authToken}`
        if (resolvedUserId) headers['X-User-Id'] = resolvedUserId
        const res = await fetch(`${getSyncEndpoint()}/auth/sync/download`, { method: 'GET', headers })
        if (!res.ok) {
          const text = await res.text().catch(() => '')
          throw new Error(`HTTP ${res.status}: ${text}`)
        }
        response = await res.json().catch(() => ({}))
      } catch (fallbackErr) {
        safeLogger.error('syncAccountData: fallback GET /auth/sync/download también falló', {
          message: fallbackErr?.message || String(fallbackErr),
          errorName: fallbackErr?.name
        })
        throw fallbackErr
      }
    }

    safeLogger.debug('syncAccountData: respuesta del servidor', {
      success: response?.success || false,
      hasData: !!response?.data,
      responseKeys: Object.keys(response || {})
    })

    const accountData = response.data || {}

    safeLogger.debug('syncAccountData: resumen de datos descargados', {
      attempts: accountData.attempts?.length || 0,
      mastery: accountData.mastery?.length || 0,
      schedules: accountData.schedules?.length || 0,
      sessions: accountData.sessions?.length || 0
    })

    safeLogger.debug('syncAccountData: estructura de accountData', {
      hasAttempts: Array.isArray(accountData.attempts),
      hasMastery: Array.isArray(accountData.mastery),
      hasSchedules: Array.isArray(accountData.schedules),
      totalObjects: Object.keys(accountData).length
    })

    // Merge with local data
    const mergeResults = await mergeAccountDataLocally(accountData)

    if (mergeResults?.aborted) {
      safeLogger.warn('syncAccountData: abortado por falta de userId confiable')
      return {
        success: false,
        reason: mergeResults.reason || 'missing_user_id',
        message: mergeResults.message,
        merged: mergeResults,
        downloaded: {
          attempts: accountData.attempts?.length || 0,
          mastery: accountData.mastery?.length || 0,
          schedules: accountData.schedules?.length || 0,
          sessions: accountData.sessions?.length || 0
        }
      }
    }

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
      safeLogger.warn('syncAccountData: fallo invalidando caché tras la sync', {
        message: cacheError?.message || String(cacheError),
        name: cacheError?.name
      })
    }

    const mergedSummary = {
      attempts: mergeResults?.merged?.attempts || 0,
      mastery: mergeResults?.merged?.mastery || 0,
      schedules: mergeResults?.merged?.schedules || 0,
      sessions: mergeResults?.merged?.sessions || 0
    }

    safeLogger.info('syncAccountData: sincronización de cuenta completada', {
      mergedSummary,
      uploadedAttempts: mergeResults?.attempts?.uploaded || 0,
      uploadedMastery: mergeResults?.mastery?.uploaded || 0,
      uploadedSchedules: mergeResults?.schedules?.uploaded || 0,
      uploadedSessions: mergeResults?.sessions?.uploaded || 0
    })

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

    safeLogger.debug('syncAccountData: resultado final', {
      success: finalResult.success,
      mergedSummary,
      downloaded: finalResult.downloaded
    })
    return finalResult
  } catch (error) {
    safeLogger.error('syncAccountData: error durante sincronización de cuenta', {
      message: error?.message,
      errorName: error?.name,
      status: error?.status
    })
    safeLogger.debug('syncAccountData: detalles de error', {
      message: error?.message || 'No message',
      stack: error?.stack || 'No stack',
      name: error?.name || 'No name',
      status: error?.status || 'No status'
    })

    // Si es error de autenticación, limpiar auth state
    if (error?.status === 401 || error?.message?.includes('401') || error?.message?.includes('Unauthorized')) {
      safeLogger.debug('syncAccountData: error 401 detectado, limpiando estado de autenticación')
      authService.clearAuth()
    }

    return { success: false, error: String(error) }
  }
}

const TEMP_USER_ID_PATTERN = /^user-temp-/i

function isReliableUserId(userId) {
  return typeof userId === 'string' && userId.trim().length > 0 && !TEMP_USER_ID_PATTERN.test(userId)
}

function extractUserIdFromAccountData(accountData) {
  if (!accountData || typeof accountData !== 'object') return null

  const directCandidates = [
    accountData.userId,
    accountData.user?.id,
    accountData.account?.id,
    accountData.account?.userId,
    accountData.profile?.id,
    accountData.metadata?.userId,
    accountData.meta?.userId
  ]

  for (const candidate of directCandidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate
    }
  }

  const collectionKeys = ['attempts', 'mastery', 'schedules', 'sessions']
  for (const key of collectionKeys) {
    const collection = Array.isArray(accountData[key]) ? accountData[key] : []
    for (const item of collection) {
      const candidate = item?.userId || item?.ownerId || item?.accountId
      if (typeof candidate === 'string' && candidate.trim()) {
        return candidate
      }
    }
  }

  return null
}

function resolveMergeUserId(accountData) {
  const authenticatedId = authService.getUser?.()?.id || null
  if (isReliableUserId(authenticatedId)) {
    return { userId: authenticatedId, source: 'auth', attempted: { authenticatedId } }
  }

  const remoteId = extractUserIdFromAccountData(accountData)
  if (isReliableUserId(remoteId)) {
    return {
      userId: remoteId,
      source: 'remote',
      attempted: { authenticatedId, remoteId }
    }
  }

  const fallbackId = getCurrentUserId()
  if (isReliableUserId(fallbackId)) {
    return {
      userId: fallbackId,
      source: 'fallback',
      attempted: { authenticatedId, remoteId, fallbackId }
    }
  }

  return {
    userId: null,
    source: null,
    attempted: { authenticatedId, remoteId, fallbackId }
  }
}

function notifySyncIssue(reason, message) {
  if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') {
    return
  }

  try {
    window.dispatchEvent(
      new CustomEvent('progress:syncError', {
        detail: {
          reason,
          message,
          timestamp: new Date().toISOString()
        }
      })
    )
  } catch (error) {
    safeLogger.warn('syncAccountData: no se pudo notificar al usuario sobre el fallo de sincronización', {
      message: error?.message || String(error),
      name: error?.name
    })
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
  const resolution = resolveMergeUserId(accountData)
  const currentUserId = resolution.userId

  if (!currentUserId) {
    const warningMessage = 'No pudimos determinar un usuario fiable para fusionar los datos. Inicia sesión nuevamente e intenta sincronizar.'
    safeLogger.warn('mergeAccountDataLocally: abortado por falta de userId confiable', {
      attemptedSources: resolution.attempted
    })
    notifySyncIssue('missing_user_id', warningMessage)
    return {
      ...results,
      userId: null,
      aborted: true,
      reason: 'missing_user_id',
      message: warningMessage,
      attempted: resolution.attempted
    }
  }

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

  // Merge attempts using map lookups (batch operation)
  if (accountData.attempts) {
    const attemptsToSave = []

    for (const remoteAttempt of accountData.attempts) {
      try {
        const createdTime = Math.floor(new Date(remoteAttempt.createdAt).getTime() / 5000) * 5000
        const key = `${remoteAttempt.verbId}|${remoteAttempt.mood}|${remoteAttempt.tense}|${remoteAttempt.person}|${createdTime}`
        const existing = attemptMap.get(key)

        if (!existing) {
          // Prepare new attempt with current user ID
          const localAttempt = {
            ...remoteAttempt,
            userId: currentUserId,
            id: remoteAttempt.id || `attempt-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
            syncedAt: new Date()
          }
          attemptsToSave.push(localAttempt)
          // Update in-memory map to maintain consistency
          attemptMap.set(key, localAttempt)
        }
      } catch (error) {
        safeLogger.warn('mergeAccountDataLocally: error al fusionar attempt', {
          message: error?.message || String(error),
          name: error?.name
        })
        results.conflicts++
      }
    }

    // Batch save all new attempts in a single transaction
    if (attemptsToSave.length > 0) {
      try {
        const batchResult = await batchSaveToDB(STORAGE_CONFIG.STORES.ATTEMPTS, attemptsToSave, { skipTimestamps: true })
        results.attempts = batchResult.saved
        if (batchResult.errors.length > 0) {
          results.conflicts += batchResult.errors.length
        }
      } catch (error) {
        safeLogger.warn('mergeAccountDataLocally: error en batch save de attempts', {
          message: error?.message || String(error),
          name: error?.name
        })
        results.conflicts += attemptsToSave.length
      }
    }
  }

  // Merge learning sessions by sessionId (keep most recent updatedAt) - batch operation
  if (Array.isArray(accountData.sessions)) {
    const sessionsToSave = []
    const sessionsToUpdate = []

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
          sessionsToSave.push(localSession)
          sessionMap.set(key, localSession)
        } else if (remoteSession.updatedAt && new Date(remoteSession.updatedAt) > new Date(existing.updatedAt || 0)) {
          const updatedSession = {
            ...existing,
            ...remoteSession,
            sessionId: key,
            userId: currentUserId,
            syncedAt: new Date()
          }
          sessionsToUpdate.push({ id: existing.sessionId || key, updates: updatedSession })
          sessionMap.set(key, updatedSession)
        }
      } catch (error) {
        safeLogger.warn('mergeAccountDataLocally: error al fusionar session', {
          message: error?.message || String(error),
          name: error?.name
        })
        results.conflicts++
      }
    }

    // Batch save new sessions
    if (sessionsToSave.length > 0) {
      try {
        const batchResult = await batchSaveToDB(STORAGE_CONFIG.STORES.LEARNING_SESSIONS, sessionsToSave, { skipTimestamps: true })
        results.sessions += batchResult.saved
        if (batchResult.errors.length > 0) {
          results.conflicts += batchResult.errors.length
        }
      } catch (error) {
        safeLogger.warn('mergeAccountDataLocally: error en batch save de sessions', {
          message: error?.message || String(error),
          name: error?.name
        })
        results.conflicts += sessionsToSave.length
      }
    }

    // Batch update existing sessions
    if (sessionsToUpdate.length > 0) {
      try {
        const batchResult = await batchUpdateInDB(STORAGE_CONFIG.STORES.LEARNING_SESSIONS, sessionsToUpdate)
        results.sessions += batchResult.updated
        if (batchResult.errors.length > 0) {
          results.conflicts += batchResult.errors.length
        }
      } catch (error) {
        safeLogger.warn('mergeAccountDataLocally: error en batch update de sessions', {
          message: error?.message || String(error),
          name: error?.name
        })
        results.conflicts += sessionsToUpdate.length
      }
    }
  }

  // Merge mastery using map lookups (keep best scores) - batch operation
  if (accountData.mastery) {
    const masteryToSave = []
    const masteryToUpdate = []

    for (const remoteMastery of accountData.mastery) {
      try {
        const key = `${remoteMastery.verbId}|${remoteMastery.mood}|${remoteMastery.tense}|${remoteMastery.person}`
        const existing = masteryMap.get(key)

        if (!existing) {
          // Prepare new mastery record
          const localMastery = {
            ...remoteMastery,
            userId: currentUserId,
            id: remoteMastery.id || `mastery-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
            syncedAt: new Date()
          }
          masteryToSave.push(localMastery)
          // Update in-memory map to maintain consistency
          masteryMap.set(key, localMastery)
        } else if (new Date(remoteMastery.updatedAt) > new Date(existing.updatedAt)) {
          // Prepare update with more recent score
          const updatedMastery = {
            ...existing,
            ...remoteMastery,
            userId: currentUserId,
            syncedAt: new Date()
          }
          masteryToUpdate.push({ id: existing.id, updates: updatedMastery })
          // Update in-memory map to maintain consistency
          masteryMap.set(key, updatedMastery)
        }
      } catch (error) {
        safeLogger.warn('mergeAccountDataLocally: error al fusionar mastery', {
          message: error?.message || String(error),
          name: error?.name
        })
        results.conflicts++
      }
    }

    // Batch save new mastery records
    if (masteryToSave.length > 0) {
      try {
        const batchResult = await batchSaveToDB(STORAGE_CONFIG.STORES.MASTERY, masteryToSave, { skipTimestamps: true })
        results.mastery += batchResult.saved
        if (batchResult.errors.length > 0) {
          results.conflicts += batchResult.errors.length
        }
      } catch (error) {
        safeLogger.warn('mergeAccountDataLocally: error en batch save de mastery', {
          message: error?.message || String(error),
          name: error?.name
        })
        results.conflicts += masteryToSave.length
      }
    }

    // Batch update existing mastery records
    if (masteryToUpdate.length > 0) {
      try {
        const batchResult = await batchUpdateInDB(STORAGE_CONFIG.STORES.MASTERY, masteryToUpdate)
        results.mastery += batchResult.updated
        if (batchResult.errors.length > 0) {
          results.conflicts += batchResult.errors.length
        }
      } catch (error) {
        safeLogger.warn('mergeAccountDataLocally: error en batch update de mastery', {
          message: error?.message || String(error),
          name: error?.name
        })
        results.conflicts += masteryToUpdate.length
      }
    }
  }

  // Merge schedules using map lookups (keep most recent) - batch operation
  if (accountData.schedules) {
    const schedulesToSave = []
    const schedulesToUpdate = []

    for (const remoteSchedule of accountData.schedules) {
      try {
        const key = `${remoteSchedule.verbId}|${remoteSchedule.mood}|${remoteSchedule.tense}|${remoteSchedule.person}`
        const existing = scheduleMap.get(key)

        if (!existing) {
          // Prepare new schedule
          const localSchedule = {
            ...remoteSchedule,
            userId: currentUserId,
            id: remoteSchedule.id || `schedule-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
            syncedAt: new Date()
          }
          schedulesToSave.push(localSchedule)
          // Update in-memory map to maintain consistency
          scheduleMap.set(key, localSchedule)
        } else if (new Date(remoteSchedule.updatedAt) > new Date(existing.updatedAt)) {
          // Prepare update with more recent schedule
          const updatedSchedule = {
            ...existing,
            ...remoteSchedule,
            userId: currentUserId,
            syncedAt: new Date()
          }
          schedulesToUpdate.push({ id: existing.id, updates: updatedSchedule })
          // Update in-memory map to maintain consistency
          scheduleMap.set(key, updatedSchedule)
        }
      } catch (error) {
        safeLogger.warn('mergeAccountDataLocally: error al fusionar schedule', {
          message: error?.message || String(error),
          name: error?.name
        })
        results.conflicts++
      }
    }

    // Batch save new schedules
    if (schedulesToSave.length > 0) {
      try {
        const batchResult = await batchSaveToDB(STORAGE_CONFIG.STORES.SCHEDULES, schedulesToSave, { skipTimestamps: true })
        results.schedules += batchResult.saved
        if (batchResult.errors.length > 0) {
          results.conflicts += batchResult.errors.length
        }
      } catch (error) {
        safeLogger.warn('mergeAccountDataLocally: error en batch save de schedules', {
          message: error?.message || String(error),
          name: error?.name
        })
        results.conflicts += schedulesToSave.length
      }
    }

    // Batch update existing schedules
    if (schedulesToUpdate.length > 0) {
      try {
        const batchResult = await batchUpdateInDB(STORAGE_CONFIG.STORES.SCHEDULES, schedulesToUpdate)
        results.schedules += batchResult.updated
        if (batchResult.errors.length > 0) {
          results.conflicts += batchResult.errors.length
        }
      } catch (error) {
        safeLogger.warn('mergeAccountDataLocally: error en batch update de schedules', {
          message: error?.message || String(error),
          name: error?.name
        })
        results.conflicts += schedulesToUpdate.length
      }
    }
  }

  return { ...results, userId: currentUserId, source: resolution.source, attempted: resolution.attempted, merged: results }
}

/**
 * Sincroniza intentos, mastery y schedules del usuario actual.
 * Envia solo registros sin syncedAt.
 */
export async function syncNow({ include = ['attempts','mastery','schedules','sessions'] } = {}) {
  const userId = getCurrentUserId()

  safeLogger.debug('syncNow: iniciando proceso de sincronización manual')
  safeLogger.debug('syncNow: userId resuelto', {
    hasUserId: !!userId,
    userIdLength: userId ? userId.length : 0
  })

  if (!userId) {
    safeLogger.warn('syncNow: sincronización cancelada, no hay userId disponible')
    return { success: false, reason: 'no_user' }
  }

  if (!isSyncEnabled()) {
    safeLogger.warn('syncNow: sincronización deshabilitada', {
      hasEndpoint: !!getSyncEndpoint()
    })
    return { success: false, reason: 'sync_disabled' }
  }

  if (!isBrowserOnline()) {
    safeLogger.warn('syncNow: navegador sin conexión')
    return { success: false, reason: 'offline' }
  }

  safeLogger.info('syncNow: iniciando sincronización para usuario actual', {
    hasUserId: !!userId,
    userIdLength: userId.length
  })
  safeLogger.debug('syncNow: endpoint configurado', {
    hasEndpoint: !!getSyncEndpoint()
  })
  safeLogger.debug('syncNow: colecciones a sincronizar', {
    include
  })

  // Wake up server first (Render free tier issue)
  safeLogger.info('syncNow: despertando servidor antes de sincronizar')
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
    safeLogger.info('syncNow: usuario autenticado, intentando sincronización de cuenta multi-dispositivo')
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
          safeLogger.info('syncNow: account sync exitoso con datos', {
            downloaded: downloadedCounts
          })
        } else {
          safeLogger.info('syncNow: account sync sin datos nuevos, continuando con subida de cambios locales')
        }
      } else {
        safeLogger.warn('syncNow: account sync falló', {
          reason: accountSyncResult.reason,
          error: accountSyncResult.error
        })
        safeLogger.info('syncNow: fallback a sincronización legacy')
        syncStrategy = 'legacy-fallback'
      }
    } catch (error) {
      safeLogger.warn('syncNow: error durante account sync', {
        message: error?.message,
        name: error?.name
      })
      safeLogger.info('syncNow: fallback a sincronización legacy por error')
      accountSyncResult = { success: false, error: error.message }
      syncStrategy = 'legacy-fallback'
    }
  } else {
    safeLogger.info('syncNow: usuario no autenticado, usando legacy sync')
  }

  try {
    if (include.includes('attempts')) {
      safeLogger.debug('syncNow: obteniendo attempts para usuario actual')
      const all = await getAttemptsByUser(userId)
      safeLogger.debug('syncNow: attempts encontrados', { total: all.length })

      let unsynced = all.filter(a => !a.syncedAt)
      // Prioritize migrated records
      unsynced.sort((a, b) => (b?.syncPriority ? 1 : 0) - (a?.syncPriority ? 1 : 0))
      safeLogger.debug('syncNow: attempts sin sincronizar', { pending: unsynced.length })

      if (unsynced.length > 0) {
        safeLogger.info('syncNow: subiendo attempts al servidor', { count: unsynced.length })
        legacyUploadsPerformed = true
        const res = await tryBulk('attempts', unsynced)
        await markSynced(STORAGE_CONFIG.STORES.ATTEMPTS, unsynced.map(a => a.id))
        results.attempts = { uploaded: unsynced.length, server: res }
        safeLogger.info('syncNow: attempts subidos exitosamente', { count: unsynced.length })
      } else {
        safeLogger.debug('syncNow: no hay attempts pendientes de sincronizar')
      }
    }

    if (include.includes('mastery')) {
      safeLogger.debug('syncNow: obteniendo mastery para usuario actual')
      const all = await getMasteryByUser(userId)
      safeLogger.debug('syncNow: mastery encontrados', { total: all.length })

      let unsynced = all.filter(m => !m.syncedAt)
      unsynced.sort((a, b) => (b?.syncPriority ? 1 : 0) - (a?.syncPriority ? 1 : 0))
      safeLogger.debug('syncNow: mastery sin sincronizar', { pending: unsynced.length })

      if (unsynced.length > 0) {
        safeLogger.info('syncNow: subiendo mastery al servidor', { count: unsynced.length })
        legacyUploadsPerformed = true
        const res = await tryBulk('mastery', unsynced)
        await markSynced(STORAGE_CONFIG.STORES.MASTERY, unsynced.map(m => m.id))
        results.mastery = { uploaded: unsynced.length, server: res }
        safeLogger.info('syncNow: mastery subidos exitosamente', { count: unsynced.length })
      } else {
        safeLogger.debug('syncNow: no hay mastery pendientes de sincronizar')
      }
    }

    if (include.includes('schedules')) {
      safeLogger.debug('syncNow: obteniendo schedules para usuario actual')
      // Without a direct getter by user for all schedules, fetch all and filter
      const allSchedules = await getAllFromDB(STORAGE_CONFIG.STORES.SCHEDULES)
      const userSchedules = allSchedules.filter(s => s.userId === userId)
      safeLogger.debug('syncNow: schedules encontrados', { total: userSchedules.length })

      let unsynced = userSchedules.filter(s => !s.syncedAt)
      unsynced.sort((a, b) => (b?.syncPriority ? 1 : 0) - (a?.syncPriority ? 1 : 0))
      safeLogger.debug('syncNow: schedules sin sincronizar', { pending: unsynced.length })

      if (unsynced.length > 0) {
        safeLogger.info('syncNow: subiendo schedules al servidor', { count: unsynced.length })
        legacyUploadsPerformed = true
        const res = await tryBulk('schedules', unsynced)
        await markSynced(STORAGE_CONFIG.STORES.SCHEDULES, unsynced.map(s => s.id))
        results.schedules = { uploaded: unsynced.length, server: res }
        safeLogger.info('syncNow: schedules subidos exitosamente', { count: unsynced.length })
      } else {
        safeLogger.debug('syncNow: no hay schedules pendientes de sincronizar')
      }
    }

    if (include.includes('sessions')) {
      safeLogger.debug('syncNow: obteniendo sesiones para usuario actual')
      const allSessions = await getLearningSessionsByUser(userId)
      safeLogger.debug('syncNow: sesiones encontradas', { total: allSessions.length })

      let unsynced = allSessions.filter((s) => !s.syncedAt)
      unsynced.sort((a, b) => (b?.syncPriority ? 1 : 0) - (a?.syncPriority ? 1 : 0))
      safeLogger.debug('syncNow: sesiones sin sincronizar', { pending: unsynced.length })

      if (unsynced.length > 0) {
        safeLogger.info('syncNow: subiendo sesiones al servidor', { count: unsynced.length })
        legacyUploadsPerformed = true
        const res = await tryBulk('sessions', unsynced)
        await markSynced(
          STORAGE_CONFIG.STORES.LEARNING_SESSIONS,
          unsynced.map((s) => s.sessionId || s.id)
        )
        results.sessions = { uploaded: unsynced.length, server: res }
        safeLogger.info('syncNow: sesiones subidas exitosamente', { count: unsynced.length })
      } else {
        safeLogger.debug('syncNow: no hay sesiones pendientes de sincronizar')
      }
    }

    // Procesar cola offline (si hubiera)
    await flushSyncQueueFromService()

    if (usedAccountSync && legacyUploadsPerformed && syncStrategy !== 'legacy-fallback') {
      syncStrategy = 'account+legacy'
    } else if (usedAccountSync && syncStrategy !== 'legacy-fallback') {
      syncStrategy = 'account'
    }

    safeLogger.info('syncNow: sincronización completada', { strategy: syncStrategy })

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

    safeLogger.debug('syncNow: respuesta final', {
      strategy: response.strategy,
      success: response.success,
      uploaded: {
        attempts: response.attempts?.uploaded || 0,
        mastery: response.mastery?.uploaded || 0,
        schedules: response.schedules?.uploaded || 0,
        sessions: response.sessions?.uploaded || 0
      }
    })
    return response
  } catch (error) {
    safeLogger.warn('syncNow: fallo durante sincronización, encolando para más tarde', {
      message: error?.message,
      name: error?.name
    })
    // Encolar lotes para reintentar
    return { success: false, error: String(error) }
  }
}

// Re-export flushSyncQueue from SyncService for backward compatibility
export const flushSyncQueue = flushSyncQueueFromService

// Intento de auto-flush cuando vuelve la conectividad
if (typeof window !== 'undefined') {
  try {
    window.addEventListener('online', () => {
      flushSyncQueueFromService().catch(() => {})
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
  mergeAccountDataLocally,
  resolveMergeUserId,
  isReliableUserId
}
