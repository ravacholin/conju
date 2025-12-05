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
    if (!ids || ids.length === 0) return

    const db = await initDB()
    const tx = db.transaction(storeName, 'readwrite')
    const store = tx.objectStore(storeName)

    for (const id of ids) {
      if (!id) continue
      try {
        const existing = await store.get(id)
        if (!existing) continue
        // Update syncedAt to now
        // Also ensure userId is correct if we just claimed it
        const updated = { ...existing, syncedAt: new Date() }
        await store.put(updated)
      } catch (err) {
        // Ignore individual errors
      }
    }
    await tx.done
  } catch (error) {
    safeLogger.warn('markSynced: error marking items as synced', {
      storeName,
      count: ids.length,
      error: error?.message
    })
  }
}

/**
 * Helper to find unsynced items and "claim" them if they belong to an old/anonymous user.
 * This fixes the issue where migration might have failed or been skipped, leaving "orphan" data.
 */
async function claimAndGetUnsynced(storeName, currentUserId) {
  if (!currentUserId) return []

  try {
    // Get all unsynced items (limit 500 to be safe and avoid 2MB server limit)
    // Passing null as userId gets ALL unsynced items regardless of owner
    const allUnsynced = await getUnsyncedItems(storeName, null, 500)
    const validItems = []

    for (const item of allUnsynced) {
      if (!item) continue

      // If item belongs to current user, it's valid
      if (item.userId === currentUserId) {
        validItems.push(item)
      }
      // If item has a different user ID (orphan/anonymous), claim it
      else if (item.userId) {
        try {
          // Update locally to claim ownership
          const updatedItem = { ...item, userId: currentUserId, updatedAt: new Date() }

          const db = await initDB()
          const tx = db.transaction(storeName, 'readwrite')
          const store = tx.objectStore(storeName)
          await store.put(updatedItem)
          await tx.done

          safeLogger.info(`Auto-claimed orphan item in ${storeName}`, {
            itemId: item.id,
            oldUserId: item.userId,
            newUserId: currentUserId
          })

          validItems.push(updatedItem)
        } catch (e) {
          safeLogger.warn(`Failed to claim item ${item.id}`, { error: e.message })
          // Still try to upload it with the new userId even if local save failed
          validItems.push({ ...item, userId: currentUserId })
        }
      }
    }
    return validItems
  } catch (error) {
    safeLogger.error(`claimAndGetUnsynced: error processing ${storeName}`, { error: error?.message })
    return []
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

  // CRITICAL DEBUG: Log full auth state for debugging
  console.log('🔑 SYNC DEBUG: Auth state check:', {
    authenticated,
    hasToken: !!token,
    tokenLength: token?.length || 0,
    hasUser: !!user,
    userId: user?.id,
    userIdType: typeof user?.id,
    hasAccount: !!account,
    accountId: account?.id,
    isOnline: isBrowserOnline(),
    syncEnabled: isSyncEnabled(),
    syncEndpoint: getSyncEndpoint()
  })

  if (!authenticated) {
    safeLogger.warn('syncAccountData: usuario no autenticado')
    safeLogger.debug('syncAccountData: detalles de autenticación fallida', {
      hasToken: !!token,
      hasUser: !!user,
      hasAccount: !!account
    })
    console.error('❌ SYNC FAILED: Not authenticated!')
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

  // CRITICAL: Ensure userId migration completes before syncing
  // This prevents uploading data with wrong/stale userId
  try {
    safeLogger.info('syncAccountData: waiting for userId migration to complete...')
    const authModule = await import('../auth/authService.js')
    const authService = authModule.default
    if (authService && typeof authService.ensureAnonymousProgressMigration === 'function') {
      const migrationResult = await authService.ensureAnonymousProgressMigration()
      if (migrationResult) {
        safeLogger.info('syncAccountData: userId migration completed', {
          anonymousId: migrationResult.anonymousUserId,
          authenticatedId: migrationResult.authenticatedUserId,
          migrationSuccess: !!migrationResult.localMigration
        })
      } else {
        safeLogger.info('syncAccountData: no migration needed (already completed or no anonymous data)')
      }
    }
  } catch (migrationError) {
    safeLogger.warn('syncAccountData: migration check failed (continuing sync)', {
      message: migrationError?.message || String(migrationError)
    })
  }

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
        // Secondary fallback: GET /auth/me to retrieve merged data
        try {
          safeLogger.info('syncAccountData: intentando fallback GET /auth/me')
          const headers = { Accept: 'application/json' }
          const authToken = getAuthToken()
          const headerName = getSyncAuthHeaderName() || 'Authorization'
          if (authToken) headers[headerName] = headerName.toLowerCase() === 'authorization' ? `Bearer ${authToken}` : authToken
          const res = await fetch(`${getSyncEndpoint()}/auth/me`, { method: 'GET', headers })
          if (!res.ok) {
            const text = await res.text().catch(() => '')
            throw new Error(`HTTP ${res.status}: ${text}`)
          }
          const me = await res.json().catch(() => ({}))
          response = { success: true, data: me?.data || {} }
        } catch (meErr) {
          safeLogger.error('syncAccountData: fallback GET /auth/me también falló', {
            message: meErr?.message || String(meErr),
            errorName: meErr?.name
          })
          throw fallbackErr
        }
      }
    }

    safeLogger.debug('syncAccountData: respuesta del servidor', {
      success: response?.success || false,
      hasData: !!response?.data,
      responseKeys: Object.keys(response || {})
    })

    // CRITICAL DEBUG: Log raw server response
    console.log('📦 SYNC DEBUG: Raw server response:', {
      success: response?.success,
      hasData: !!response?.data,
      dataKeys: response?.data ? Object.keys(response.data) : [],
      attemptsCount: response?.data?.attempts?.length || 0,
      masteryCount: response?.data?.mastery?.length || 0,
      schedulesCount: response?.data?.schedules?.length || 0,
      sessionsCount: response?.data?.sessions?.length || 0,
      hasSettings: !!response?.data?.settings,
      challengesCount: response?.data?.challenges?.length || 0,
      eventsCount: response?.data?.events?.length || 0,
      rawResponse: response
    })

    const accountData = response.data || {}

    // CRITICAL: Log download data for debugging sync issues
    console.log('📥 SYNC: Downloaded data from server:', {
      attempts: accountData.attempts?.length || 0,
      mastery: accountData.mastery?.length || 0,
      schedules: accountData.schedules?.length || 0,
      sessions: accountData.sessions?.length || 0,
      hasSettings: !!accountData.settings,
      settingsPreview: accountData.settings ? {
        hasNestedSettings: !!accountData.settings?.settings,
        userLevel: accountData.settings?.settings?.userLevel || accountData.settings?.userLevel,
        updatedAt: accountData.settings?.updatedAt
      } : null
    })

    safeLogger.debug('syncAccountData: resumen de datos descargados', {
      attempts: accountData.attempts?.length || 0,
      mastery: accountData.mastery?.length || 0,
      schedules: accountData.schedules?.length || 0,
      sessions: accountData.sessions?.length || 0
    })

    const mergeResults = await mergeAccountDataLocally(accountData)

    console.log('🔀 SYNC: Merge results:', {
      aborted: mergeResults?.aborted,
      userId: mergeResults?.userId,
      source: mergeResults?.source,
      merged: {
        attempts: mergeResults?.merged?.attempts || mergeResults?.attempts || 0,
        mastery: mergeResults?.merged?.mastery || mergeResults?.mastery || 0,
        schedules: mergeResults?.merged?.schedules || mergeResults?.schedules || 0,
        sessions: mergeResults?.merged?.sessions || mergeResults?.sessions || 0,
        settings: mergeResults?.merged?.settings || mergeResults?.settings || 0
      }
    })

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

    // Optional upload step: push local unsynced data to server (compatible con tests)
    const resolvedUserId = getAuthenticatedUser()?.id || getCurrentUserId()
    let anyUploadFailed = false
    let uploaded = { attempts: 0, mastery: 0, schedules: 0, sessions: 0, settings: 0, challenges: 0, events: 0 }

    try {
      // Attempts
      try {
        // CRITICAL FIX: Use auto-claim logic to find and migrate orphan data
        const unsyncedAttempts = await claimAndGetUnsynced(STORAGE_CONFIG.STORES.ATTEMPTS, resolvedUserId)
        if (unsyncedAttempts.length > 0) {
          safeLogger.info('syncAccountData: uploading attempts', { count: unsyncedAttempts.length })
          const res = await tryBulk('attempts', unsyncedAttempts)
          await markSynced(STORAGE_CONFIG.STORES.ATTEMPTS, unsyncedAttempts.map((a) => a.id))
          uploaded.attempts = unsyncedAttempts.length
          safeLogger.info('syncAccountData: attempts uploaded successfully', { count: unsyncedAttempts.length, server: res })
        }
      } catch (e) {
        anyUploadFailed = true
        safeLogger.error('syncAccountData: attempts upload failed', { message: e?.message || String(e), stack: e?.stack })
      }

      // Mastery
      try {
        // CRITICAL FIX: Use auto-claim logic
        const unsyncedMastery = await claimAndGetUnsynced(STORAGE_CONFIG.STORES.MASTERY, resolvedUserId)
        if (unsyncedMastery.length > 0) {
          safeLogger.info('syncAccountData: uploading mastery', { count: unsyncedMastery.length })
          const res = await tryBulk('mastery', unsyncedMastery)
          await markSynced(STORAGE_CONFIG.STORES.MASTERY, unsyncedMastery.map((m) => m.id))
          uploaded.mastery = unsyncedMastery.length
          safeLogger.info('syncAccountData: mastery uploaded successfully', { count: unsyncedMastery.length, server: res })
        }
      } catch (e) {
        anyUploadFailed = true
        safeLogger.error('syncAccountData: mastery upload failed', { message: e?.message || String(e), stack: e?.stack })
      }

      // Schedules
      try {
        // CRITICAL FIX: Use auto-claim logic
        const unsyncedSchedules = await claimAndGetUnsynced(STORAGE_CONFIG.STORES.SCHEDULES, resolvedUserId)
        if (unsyncedSchedules.length > 0) {
          safeLogger.info('syncAccountData: uploading schedules', { count: unsyncedSchedules.length })
          const res = await tryBulk('schedules', unsyncedSchedules)
          await markSynced(STORAGE_CONFIG.STORES.SCHEDULES, unsyncedSchedules.map((s) => s.id))
          uploaded.schedules = unsyncedSchedules.length
          safeLogger.info('syncAccountData: schedules uploaded successfully', { count: unsyncedSchedules.length, server: res })
        }
      } catch (e) {
        anyUploadFailed = true
        safeLogger.error('syncAccountData: schedules upload failed', { message: e?.message || String(e), stack: e?.stack })
      }

      // Sessions
      try {
        // CRITICAL FIX: Use auto-claim logic
        const unsyncedSessions = await claimAndGetUnsynced(STORAGE_CONFIG.STORES.LEARNING_SESSIONS, resolvedUserId)
        if (unsyncedSessions.length > 0) {
          safeLogger.info('syncAccountData: uploading sessions', { count: unsyncedSessions.length })
          const res = await tryBulk('sessions', unsyncedSessions)
          await markSynced(STORAGE_CONFIG.STORES.LEARNING_SESSIONS, unsyncedSessions.map((s) => s.id))
          uploaded.sessions = unsyncedSessions.length
          safeLogger.info('syncAccountData: sessions uploaded successfully', { count: unsyncedSessions.length, server: res })
        }
      } catch (e) {
        anyUploadFailed = true
        safeLogger.error('syncAccountData: sessions upload failed', { message: e?.message || String(e), stack: e?.stack })
      }

      // Settings - flush first to ensure all pending changes are saved
      try {
        // Force immediate save of settings to IndexedDB, bypassing debounce
        const { flushSettings } = await import('../../state/settings.js')
        await flushSettings()

        const unsyncedSettings = await claimAndGetUnsynced(STORAGE_CONFIG.STORES.USER_SETTINGS, resolvedUserId)

        console.log('📤 SYNC: Settings upload check:', {
          unsyncedCount: unsyncedSettings.length,
          userId: resolvedUserId,
          settingsPreview: unsyncedSettings.length > 0 ? {
            id: unsyncedSettings[0]?.id,
            hasSettings: !!unsyncedSettings[0]?.settings,
            userLevel: unsyncedSettings[0]?.settings?.userLevel,
            lastUpdated: unsyncedSettings[0]?.settings?.lastUpdated
          } : null
        })

        if (unsyncedSettings.length > 0) {
          safeLogger.info('syncAccountData: uploading settings', { count: unsyncedSettings.length })
          const res = await tryBulk('settings', unsyncedSettings)
          await markSynced(STORAGE_CONFIG.STORES.USER_SETTINGS, unsyncedSettings.map((s) => s.id))
          uploaded.settings = unsyncedSettings.length
          safeLogger.info('syncAccountData: settings uploaded successfully', { count: unsyncedSettings.length, server: res })
          console.log('✅ SYNC: Settings uploaded successfully')
        } else {
          console.log('ℹ️ SYNC: No unsynced settings to upload')
        }
      } catch (e) {
        anyUploadFailed = true
        safeLogger.error('syncAccountData: settings upload failed', { message: e?.message || String(e), stack: e?.stack })
        console.error('❌ SYNC: Settings upload failed:', e)
      }

      // Challenges
      try {
        const unsyncedChallenges = await claimAndGetUnsynced(STORAGE_CONFIG.STORES.CHALLENGES, resolvedUserId)
        if (unsyncedChallenges.length > 0) {
          safeLogger.info('syncAccountData: uploading challenges', { count: unsyncedChallenges.length })
          const res = await tryBulk('challenges', unsyncedChallenges)
          await markSynced(STORAGE_CONFIG.STORES.CHALLENGES, unsyncedChallenges.map((c) => c.id))
          uploaded.challenges = unsyncedChallenges.length
          safeLogger.info('syncAccountData: challenges uploaded successfully', { count: unsyncedChallenges.length, server: res })
        }
      } catch (e) {
        anyUploadFailed = true
        safeLogger.error('syncAccountData: challenges upload failed', { message: e?.message || String(e), stack: e?.stack })
      }

      // Events
      try {
        const unsyncedEvents = await claimAndGetUnsynced(STORAGE_CONFIG.STORES.EVENTS, resolvedUserId)
        if (unsyncedEvents.length > 0) {
          safeLogger.info('syncAccountData: uploading events', { count: unsyncedEvents.length })
          const res = await tryBulk('events', unsyncedEvents)
          await markSynced(STORAGE_CONFIG.STORES.EVENTS, unsyncedEvents.map((e) => e.id))
          uploaded.events = unsyncedEvents.length
          safeLogger.info('syncAccountData: events uploaded successfully', { count: unsyncedEvents.length, server: res })
        }
      } catch (e) {
        anyUploadFailed = true
        safeLogger.error('syncAccountData: events upload failed', { message: e?.message || String(e), stack: e?.stack })
      }
    } catch (uploadErr) {
      anyUploadFailed = true
      safeLogger.error('syncAccountData: unexpected error during upload step', { message: uploadErr?.message || String(uploadErr), stack: uploadErr?.stack })
    }

    if (anyUploadFailed) {
      safeLogger.error('syncAccountData: sync completed with upload failures', {
        mergedSummary,
        uploadedAttempts: uploaded.attempts,
        uploadedMastery: uploaded.mastery,
        uploadedSchedules: uploaded.schedules,
        uploadedSessions: uploaded.sessions,
        uploadedSettings: uploaded.settings,
        uploadedChallenges: uploaded.challenges,
        uploadedEvents: uploaded.events
      })
    } else {
      safeLogger.info('syncAccountData: sincronización de cuenta completada exitosamente', {
        mergedSummary,
        uploadedAttempts: uploaded.attempts,
        uploadedMastery: uploaded.mastery,
        uploadedSchedules: uploaded.schedules,
        uploadedSessions: uploaded.sessions,
        uploadedSettings: uploaded.settings,
        uploadedChallenges: uploaded.challenges,
        uploadedEvents: uploaded.events
      })
    }

    const finalResult = {
      success: !anyUploadFailed,
      merged: mergeResults,
      uploaded,
      downloaded: {
        attempts: accountData.attempts?.length || 0,
        mastery: accountData.mastery?.length || 0,
        schedules: accountData.schedules?.length || 0,
        sessions: accountData.sessions?.length || 0
      },
      ...(anyUploadFailed && { uploadFailed: true })
    }

    safeLogger.debug('syncAccountData: resultado final', {
      success: finalResult.success,
      mergedSummary,
      downloaded: finalResult.downloaded,
      uploadFailed: anyUploadFailed
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
      flushSyncQueueFromService().catch((error) => {
        safeLogger.warn('event:online', 'Failed to flush sync queue on online event', {
          message: error?.message || String(error)
        })
      })
      syncNow().catch((error) => {
        safeLogger.warn('event:online', 'Failed to sync on online event', {
          message: error?.message || String(error)
        })
      })
    })
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        setTimeout(() => {
          syncNow().catch((error) => {
            safeLogger.warn('event:visibilitychange', 'Failed to sync on visibility change', {
              message: error?.message || String(error)
            })
          })
        }, 500)
      }
    })
  } catch (error) {
    // Log listener setup errors (unlikely but possible)
    safeLogger.warn('event-listeners', 'Failed to setup sync event listeners', {
      message: error?.message || String(error)
    })
  }
}

export default {
  syncAccountData,
  syncNow,
  flushSyncQueue,
  enqueue,
  wakeUpServer,
  isLocalSyncMode
}

export const __testing = {
  wakeUpServer,
  enqueue
}
