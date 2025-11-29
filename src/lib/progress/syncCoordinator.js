import {
  getAttemptsByUser,
  getMasteryByUser,
  getFromDB,
  getAllFromDB,
  initDB,
  getLearningSessionsByUser,
  getUnsyncedItems
} from './database.js'
import { STORAGE_CONFIG } from './config.js'
import { getSyncConfigDebug } from '../config/syncConfig.js'
import { progressDataCache } from '../cache/ProgressDataCache.js'
import { createSafeLogger } from './safeLogger.js'
import { mergeAccountDataLocally } from './dataMerger.js'
import {
  getSyncEndpoint,
  isSyncEnabled,
  isLocalSyncMode,
  setSyncEndpoint,
  setSyncAuthToken,
  setSyncAuthHeaderName,
  getSyncAuthToken,
  clearSyncAuthToken,
  getSyncAuthHeaderName,
  isAuthenticated,
  getAuthToken,
  getAuthenticatedUser,
  getAuthenticatedAccount,
  clearAuthState
} from './authBridge.js'
import { getCurrentUserId } from './userSettingsStore.js'
import SyncService from './SyncService.js'

const safeLogger = createSafeLogger('progress:userManager')

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
  } catch (error) {
    safeLogger.warn('markSynced: no se pudo marcar como sincronizado', {
      message: error?.message || String(error),
      name: error?.name
    })
  }
}

export async function syncAccountData() {
  safeLogger.debug('syncAccountData: inicio')

  const syncConfig = getSyncConfigDebug()
  safeLogger.debug('syncAccountData: configuración detectada', {
    apiBase: syncConfig.apiBase,
    authHeaderName: syncConfig.authHeaderName,
    isDev: !!syncConfig.isDev,
    isProd: !!syncConfig.isProd
  })

  const authenticated = isAuthenticated()
  const token = getAuthToken()
  const user = getAuthenticatedUser()
  const account = getAuthenticatedAccount()

  safeLogger.debug('syncAccountData: estado de autenticación', {
    isAuthenticated: authenticated,
    hasToken: !!token,
    tokenLength: token ? token.length : 0,
    hasUser: !!user,
    hasAccount: !!account,
    hasAccountEmail: !!account?.email,
    syncApiBase: syncConfig.apiBase,
    environment: syncConfig.isDev ? 'development' : (syncConfig.isProd ? 'production' : 'unknown')
  })

  if (!authenticated) {
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

  await wakeUpServer()

  try {
    safeLogger.debug('syncAccountData: llamando a /auth/sync/download')

    let response = null
    try {
      response = await postJSON('/auth/sync/download', {})
    } catch (err) {
      safeLogger.warn('syncAccountData: POST /auth/sync/download falló, intentando GET', {
        message: err?.message || String(err),
        name: err?.name
      })
      try {
        const headers = { Accept: 'application/json' }
        const authToken = getAuthToken()
        const resolvedUserId = getAuthenticatedUser()?.id || getCurrentUserId()
        const headerName = getSyncAuthHeaderName() || 'Authorization'
        if (authToken) headers[headerName] = headerName.toLowerCase() === 'authorization' ? `Bearer ${authToken}` : authToken
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
      status: error?.status,
      stack: error?.stack
    })
    safeLogger.debug('syncAccountData: detalles de error', {
      message: error?.message || 'No message',
      stack: error?.stack || 'No stack',
      name: error?.name || 'No name',
      status: error?.status || 'No status'
    })

    if (error?.status === 401 || error?.message?.includes('401') || error?.message?.includes('Unauthorized')) {
      safeLogger.debug('syncAccountData: error 401 detectado, limpiando estado de autenticación')
      clearAuthState()
    }

    return { success: false, error: String(error) }
  }
}

export async function syncNow({ include = ['attempts', 'mastery', 'schedules', 'sessions'] } = {}) {
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

  safeLogger.info('syncNow: despertando servidor antes de sincronizar')
  await wakeUpServer()

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

  if (isAuthenticated()) {
    safeLogger.info('syncNow: usuario autenticado, intentando sincronización de cuenta multi-dispositivo')
    syncStrategy = 'account'
    try {
      accountSyncResult = await syncAccountData()
      usedAccountSync = true
      if (accountSyncResult?.success === false) {
        safeLogger.warn('syncNow: sincronización de cuenta falló, continuando con legacy', {
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
      // Optimized: fetch only unsynced items
      const unsynced = await getUnsyncedItems(STORAGE_CONFIG.STORES.ATTEMPTS, userId)
      safeLogger.debug('syncNow: attempts sin sincronizar encontrados', { count: unsynced.length })

      unsynced.sort((a, b) => (b?.syncPriority ? 1 : 0) - (a?.syncPriority ? 1 : 0))
      safeLogger.debug('syncNow: attempts sin sincronizar', { pending: unsynced.length })

      if (unsynced.length > 0) {
        safeLogger.info('syncNow: subiendo attempts al servidor', { count: unsynced.length })
        legacyUploadsPerformed = true
        const res = await tryBulk('attempts', unsynced)
        await markSynced(STORAGE_CONFIG.STORES.ATTEMPTS, unsynced.map((a) => a.id))
        results.attempts = { uploaded: unsynced.length, server: res }
        safeLogger.info('syncNow: attempts subidos exitosamente', { count: unsynced.length })
      } else {
        safeLogger.debug('syncNow: no hay attempts pendientes de sincronizar')
      }
    }

    if (include.includes('mastery')) {
      safeLogger.debug('syncNow: obteniendo mastery para usuario actual')
      // Optimized: fetch only unsynced items
      const unsynced = await getUnsyncedItems(STORAGE_CONFIG.STORES.MASTERY, userId)
      safeLogger.debug('syncNow: mastery sin sincronizar encontrados', { count: unsynced.length })

      unsynced.sort((a, b) => (b?.syncPriority ? 1 : 0) - (a?.syncPriority ? 1 : 0))
      safeLogger.debug('syncNow: mastery sin sincronizar', { pending: unsynced.length })

      if (unsynced.length > 0) {
        safeLogger.info('syncNow: subiendo mastery al servidor', { count: unsynced.length })
        legacyUploadsPerformed = true
        const res = await tryBulk('mastery', unsynced)
        await markSynced(STORAGE_CONFIG.STORES.MASTERY, unsynced.map((m) => m.id))
        results.mastery = { uploaded: unsynced.length, server: res }
        safeLogger.info('syncNow: mastery subidos exitosamente', { count: unsynced.length })
      } else {
        safeLogger.debug('syncNow: no hay mastery pendientes de sincronizar')
      }
    }

    if (include.includes('schedules')) {
      safeLogger.debug('syncNow: obteniendo schedules para usuario actual')
      // Optimized: fetch only unsynced items
      const unsynced = await getUnsyncedItems(STORAGE_CONFIG.STORES.SCHEDULES, userId)
      safeLogger.debug('syncNow: schedules sin sincronizar encontrados', { count: unsynced.length })

      unsynced.sort((a, b) => (b?.syncPriority ? 1 : 0) - (a?.syncPriority ? 1 : 0))
      safeLogger.debug('syncNow: schedules sin sincronizar', { pending: unsynced.length })

      if (unsynced.length > 0) {
        safeLogger.info('syncNow: subiendo schedules al servidor', { count: unsynced.length })
        legacyUploadsPerformed = true
        const res = await tryBulk('schedules', unsynced)
        await markSynced(STORAGE_CONFIG.STORES.SCHEDULES, unsynced.map((s) => s.id))
        results.schedules = { uploaded: unsynced.length, server: res }
        safeLogger.info('syncNow: schedules subidos exitosamente', { count: unsynced.length })
      } else {
        safeLogger.debug('syncNow: no hay schedules pendientes de sincronizar')
      }
    }

    if (include.includes('sessions')) {
      safeLogger.debug('syncNow: obteniendo sesiones para usuario actual')
      // Optimized: fetch only unsynced items
      const unsynced = await getUnsyncedItems(STORAGE_CONFIG.STORES.LEARNING_SESSIONS, userId)
      safeLogger.debug('syncNow: sesiones sin sincronizar encontradas', { count: unsynced.length })

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
      name: error?.name,
      stack: error?.stack
    })
    return { success: false, error: String(error) }
  }
}

export const flushSyncQueue = flushSyncQueueFromService

if (typeof window !== 'undefined') {
  try {
    window.addEventListener('online', () => {
      flushSyncQueueFromService().catch(() => { })
      syncNow().catch(() => { })
    })
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        setTimeout(() => {
          syncNow().catch(() => { })
        }, 500)
      }
    })
  } catch {
    // Ignore listener errors
  }
}

export default {
  syncAccountData,
  syncNow,
  flushSyncQueue,
  enqueue,
  wakeUpServer,
  setSyncEndpoint,
  setSyncAuthToken,
  setSyncAuthHeaderName,
  getSyncAuthToken,
  clearSyncAuthToken,
  isLocalSyncMode
}

export const __testing = {
  wakeUpServer,
  enqueue
}

