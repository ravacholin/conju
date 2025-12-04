// Sincronización con la nube para el sistema de progreso

import {
  getAttemptsByUser,
  getMasteryByUser,
  getAllFromDB,
  getLearningSessionsByUser
} from './database.js'
import { STORAGE_CONFIG } from './config.js'
import {
  getCurrentUserId,
  syncNow,
  flushSyncQueue,
  isSyncEnabled,
  isLocalSyncMode
} from './userManager/index.js'
import { createLogger } from '../utils/logger.js'
import { withMutex, globalMutex } from './SyncMutex.js'

const logger = createLogger('progress:cloudSync')
const isDev = import.meta?.env?.DEV

const SYNC_QUEUE_KEY = 'progress-sync-queue-v1'
const LAST_SYNC_TIME_KEY = 'progress-last-sync-time'

let lastSyncTime = null
try {
  if (typeof window !== 'undefined') {
    const stored = window.localStorage.getItem(LAST_SYNC_TIME_KEY)
    if (stored) {
      lastSyncTime = new Date(stored)
    }
  }
} catch (e) {
  // Ignore storage errors
}
let syncError = null
let lastSyncResult = null
let isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true
let isIncognitoMode = false
let autoSyncTimerId = null

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    isOnline = true
  })
  window.addEventListener('offline', () => {
    isOnline = false
  })

  // Trigger initial sync if online
  if (isOnline) {
    // Small delay to allow auth to initialize
    setTimeout(() => {
      syncWithCloud({ bypassIncognito: false }).catch((error) => {
        // Log initial sync failures for debugging
        logger.warn('initial-sync', 'Initial sync failed (non-critical)', error)
      })
    }, 2000)
  }
}

function hasQueuedBatches() {
  if (typeof window === 'undefined') return false
  try {
    const raw = window.localStorage.getItem(SYNC_QUEUE_KEY)
    if (!raw) return false
    const queue = JSON.parse(raw)
    return Array.isArray(queue) && queue.length > 0
  } catch {
    return false
  }
}

function recordSyncOutcome(result) {
  lastSyncResult = result
  if (result?.success) {
    lastSyncTime = new Date()
    syncError = null
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(LAST_SYNC_TIME_KEY, lastSyncTime.toISOString())
      } catch (e) {
        // Ignore storage errors
      }
      window.dispatchEvent(new CustomEvent('progress:cloud-sync', {
        detail: { result }
      }))
    }
  } else if (result) {
    syncError = result.reason || result.error || 'unknown_sync_error'
  }
}

/**
 * Sincroniza los datos locales con la nube utilizando userManager.syncNow
 * @param {Object} [options]
 * @param {string[]} [options.include] - Colecciones a incluir (attempts, mastery, schedules)
 * @param {boolean} [options.bypassIncognito=false] - Forzar la sincronización incluso en modo incógnito
 * @returns {Promise<boolean>} Si la sincronización fue exitosa
 */
export async function syncWithCloud(options = {}) {
  const { include, bypassIncognito = false } = options
  const collections = Array.isArray(include) && include.length > 0
    ? include
    : ['attempts', 'mastery', 'schedules', 'sessions', 'settings', 'challenges', 'events']

  if (isDev) logger.debug('syncWithCloud', 'Iniciando con opciones', { include: collections, bypassIncognito })

  if (isIncognitoMode && !bypassIncognito) {
    if (isDev) logger.info('syncWithCloud', 'Modo incógnito activo, omitiendo sincronización')
    recordSyncOutcome({ success: true, skipped: 'incognito' })
    return true
  }

  if (!isSyncEnabled()) {
    if (isDev) logger.warn('syncWithCloud', 'Sincronización no habilitada. Configurá VITE_PROGRESS_SYNC_URL o setSyncEndpoint')
    recordSyncOutcome({ success: false, reason: 'sync_disabled' })
    return false
  }

  if (isDev) logger.debug('syncWithCloud', 'getCurrentUserId al inicio', { userId: getCurrentUserId() })

  // Use SyncMutex to prevent race conditions across tabs/devices
  const result = await withMutex(async () => {
    syncError = null

    try {
      const syncResult = await syncNow({ include: collections })
      recordSyncOutcome(syncResult)

      if (!syncResult?.success) {
        logger.warn('syncWithCloud', 'Error durante la sincronización con la nube', { reason: syncResult?.reason || syncResult?.error })
        return false
      }

      await flushSyncQueue()
      return true
    } catch (error) {
      syncError = error?.message || String(error)
      logger.error('syncWithCloud', 'Excepción durante la sincronización con la nube', error)
      recordSyncOutcome({ success: false, error: syncError })
      return false
    }
  }, { retries: 2, retryDelay: 500 })

  // If mutex failed to acquire after retries, return false
  if (result === null) {
    if (isDev) logger.info('syncWithCloud', 'Sincronización ya en progreso en otra tab/dispositivo')
    return false
  }

  return result
}

/**
 * Obtiene el estado de sincronización
 * @returns {Object} Estado de sincronización
 */
export function getSyncStatus() {
  return {
    isSyncing: globalMutex.hasLock(),
    lastSyncTime,
    syncError,
    isOnline,
    isIncognitoMode,
    lastResult: lastSyncResult,
    syncEnabled: isSyncEnabled(),
    isLocalSync: isLocalSyncMode()
  }
}

/**
 * Habilita o deshabilita el modo incógnito (sin conexión al servidor)
 * @param {boolean} enabled - Si el modo incógnito está habilitado
 */
export function setIncognitoMode(enabled) {
  isIncognitoMode = !!enabled
  if (isIncognitoMode) {
    cancelScheduledSync()
  }
  if (isDev) logger.info('setIncognitoMode', `Modo incógnito ${enabled ? 'activado' : 'desactivado'}`)
}

/**
 * Verifica si hay datos pendientes de sincronización
 * @returns {Promise<boolean>} Si hay datos pendientes
 */
export async function hasPendingSyncData() {
  if (!isSyncEnabled()) {
    if (isDev) logger.debug('hasPendingSyncData', 'Sync no habilitado')
    return false
  }

  const userId = getCurrentUserId()
  if (!userId) {
    if (isDev) logger.debug('hasPendingSyncData', 'No hay userId')
    return false
  }

  if (isDev) logger.debug('hasPendingSyncData', `Verificando datos pendientes para userId: ${userId}`)

  try {
    const [attempts, mastery, schedulesStore, sessions] = await Promise.all([
      getAttemptsByUser(userId),
      getMasteryByUser(userId),
      getAllFromDB(STORAGE_CONFIG.STORES.SCHEDULES),
      getLearningSessionsByUser(userId)
    ])

    const schedules = schedulesStore.filter((item) => item.userId === userId)

    if (isDev) logger.debug('hasPendingSyncData', 'Datos encontrados', {
      attempts: attempts.length,
      mastery: mastery.length,
      schedules: schedules.length,
      sessions: sessions.length
    })

    const unsyncedAttempts = attempts.filter((a) => !a.syncedAt)
    const unsyncedMastery = mastery.filter((m) => !m.syncedAt)
    const unsyncedSchedules = schedules.filter((s) => !s.syncedAt)
    const unsyncedSessions = sessions.filter((s) => !s.syncedAt)

    if (isDev) logger.debug('hasPendingSyncData', 'Sin sincronizar', {
      attempts: unsyncedAttempts.length,
      mastery: unsyncedMastery.length,
      schedules: unsyncedSchedules.length,
      sessions: unsyncedSessions.length
    })

    const pending = unsyncedAttempts.length > 0 || unsyncedMastery.length > 0 || unsyncedSchedules.length > 0 || unsyncedSessions.length > 0

    if (pending) {
      if (isDev) logger.debug('hasPendingSyncData', 'HAY datos pendientes de sincronización')
      return true
    }

    const queuedBatches = hasQueuedBatches()
    if (isDev) logger.debug('hasPendingSyncData', 'Batches en cola', { queuedBatches })

    return queuedBatches
  } catch (error) {
    logger.warn('hasPendingSyncData', 'No se pudo verificar datos pendientes de sincronización', error)
    return false
  }
}

/**
 * Forza una sincronización completa ignorando el modo incógnito
 * @param {Object} [options]
 * @returns {Promise<boolean>} Si la sincronización fue exitosa
 */
export async function forceSync(options = {}) {
  if (isDev) logger.info('forceSync', 'Forzando sincronización completa (ignorando modo incógnito)')
  return await syncWithCloud({ ...options, bypassIncognito: true })
}

/**
 * Exporta datos para respaldo
 * @returns {Promise<Object>} Datos exportados
 */
export async function exportDataForBackup() {
  try {
    const userId = getCurrentUserId()
    const [attempts, mastery, schedules, users, verbs, items] = await Promise.all([
      userId ? getAttemptsByUser(userId) : [],
      userId ? getMasteryByUser(userId) : [],
      getAllFromDB(STORAGE_CONFIG.STORES.SCHEDULES),
      getAllFromDB(STORAGE_CONFIG.STORES.USERS),
      getAllFromDB(STORAGE_CONFIG.STORES.VERBS),
      getAllFromDB(STORAGE_CONFIG.STORES.ITEMS)
    ])

    return {
      users,
      verbs,
      items,
      attempts,
      mastery,
      schedules,
      exportDate: new Date().toISOString(),
      version: '1.1'
    }
  } catch (error) {
    logger.error('exportDataForBackup', 'Error al exportar datos', error)
    throw error
  }
}

/**
 * Importa datos desde un respaldo (no implementado completamente)
 * @returns {Promise<void>}
 */
export async function importDataFromBackup() {
  logger.warn('importDataFromBackup', 'importDataFromBackup aún no implementado. Usa setSchedule() y helpers dedicados para restaurar datos')
}

/**
 * Maneja cambios en la conectividad
 * @param {boolean} online - Si hay conexión a internet
 */
export function handleConnectivityChange(online) {
  isOnline = !!online
  if (isDev) logger.info('handleConnectivityChange', `Conectividad: ${online ? 'Conectado' : 'Desconectado'}`)
  if (online) {
    flushSyncQueue()
      .then(() => syncWithCloud())
      .catch((error) => {
        // Log connectivity-related sync failures
        logger.warn('connectivity-sync', 'Sync after connectivity change failed', error)
        // Update sync status so UI can show the error
        recordSyncOutcome({ success: false, error: error?.message || String(error) })
      })
  }
}

/**
 * Ejecuta una sincronización diferencial (subset de colecciones)
 * @param {string[]} [include]
 * @returns {Promise<boolean>}
 */
export async function syncDifferential(include = ['attempts', 'mastery']) {
  try {
    if (isDev) logger.info('syncDifferential', 'Iniciando sincronización diferencial', { include })
    return await syncWithCloud({ include })
  } catch (error) {
    logger.error('syncDifferential', 'Error en sincronización diferencial', error)
    return false
  }
}

/**
 * Programa sincronización automática
 * @param {number} intervalMs - Intervalo en milisegundos
 */
export function scheduleAutoSync(intervalMs = 300000) {
  cancelScheduledSync()

  const timerApi = typeof globalThis !== 'undefined' ? globalThis : undefined
  if (!timerApi?.setInterval) {
    logger.warn('scheduleAutoSync', 'No se pudo programar sincronización automática: setInterval no disponible')
    return
  }

  if (intervalMs <= 0) {
    return
  }

  autoSyncTimerId = timerApi.setInterval(() => {
    if (isIncognitoMode) return
    syncWithCloud().catch((error) => {
      // Log auto-sync failures (non-critical, will retry on next interval)
      logger.warn('auto-sync', 'Scheduled auto-sync failed (will retry)', error)
    })
  }, intervalMs)

  if (isDev) logger.info('scheduleAutoSync', `Programando sincronización automática cada ${Math.round(intervalMs / 60000)} minutos`)
}

/**
 * Cancela la sincronización programada
 */
export function cancelScheduledSync() {
  const timerApi = typeof globalThis !== 'undefined' ? globalThis : undefined
  if (autoSyncTimerId && timerApi?.clearInterval) {
    timerApi.clearInterval(autoSyncTimerId)
    if (isDev) logger.debug('cancelScheduledSync', 'Auto-sync timer cancelado', { timerId: autoSyncTimerId })
  }
  autoSyncTimerId = null

  // Also release mutex if we're holding it
  if (globalMutex.hasLock()) {
    globalMutex.release()
    if (isDev) logger.debug('cancelScheduledSync', 'Mutex liberado durante cancelación')
  }
}

const cloudSyncModule = {
  syncWithCloud,
  getSyncStatus,
  setIncognitoMode,
  hasPendingSyncData,
  forceSync,
  exportDataForBackup,
  importDataFromBackup,
  handleConnectivityChange,
  syncDifferential,
  scheduleAutoSync,
  cancelScheduledSync
}

// Expose cloudSync globally for debugging
if (typeof window !== 'undefined') {
  window.cloudSync = cloudSyncModule
}

export default cloudSyncModule
