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
} from './userManager.js'

const SYNC_QUEUE_KEY = 'progress-sync-queue-v1'

let isSyncing = false
let lastSyncTime = null
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
    : ['attempts', 'mastery', 'schedules', 'sessions']

  console.log(' DEBUG cloudSync: Iniciando syncWithCloud con opciones:', { include: collections, bypassIncognito })

  if (isIncognitoMode && !bypassIncognito) {
    console.log(' Modo incógnito activo, omitiendo sincronización')
    recordSyncOutcome({ success: true, skipped: 'incognito' })
    return true
  }

  if (!isSyncEnabled()) {
    console.log('️ Sincronización no habilitada. Configurá VITE_PROGRESS_SYNC_URL o setSyncEndpoint().')
    recordSyncOutcome({ success: false, reason: 'sync_disabled' })
    return false
  }

  if (isSyncing) {
    console.log(' Sincronización ya en progreso, reutilizando estado actual')
    return false
  }

  console.log(' DEBUG cloudSync: getCurrentUserId al inicio:', getCurrentUserId())

  isSyncing = true
  syncError = null

  try {
    const result = await syncNow({ include: collections })
    recordSyncOutcome(result)

    if (!result?.success) {
      console.warn('❌ Error durante la sincronización con la nube:', result?.reason || result?.error)
      return false
    }

    await flushSyncQueue()
    return true
  } catch (error) {
    syncError = error?.message || String(error)
    console.error('❌ Excepción durante la sincronización con la nube:', syncError)
    recordSyncOutcome({ success: false, error: syncError })
    return false
  } finally {
    isSyncing = false
  }
}

/**
 * Obtiene el estado de sincronización
 * @returns {Object} Estado de sincronización
 */
export function getSyncStatus() {
  return {
    isSyncing,
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
  console.log(` Modo incógnito ${enabled ? 'activado' : 'desactivado'}`)
}

/**
 * Verifica si hay datos pendientes de sincronización
 * @returns {Promise<boolean>} Si hay datos pendientes
 */
export async function hasPendingSyncData() {
  if (!isSyncEnabled()) {
    console.log(' DEBUG hasPendingSyncData: Sync no habilitado')
    return false
  }

  const userId = getCurrentUserId()
  if (!userId) {
    console.log(' DEBUG hasPendingSyncData: No hay userId')
    return false
  }

  console.log(` DEBUG hasPendingSyncData: Verificando datos pendientes para userId: ${userId}`)

  try {
    const [attempts, mastery, schedulesStore, sessions] = await Promise.all([
      getAttemptsByUser(userId),
      getMasteryByUser(userId),
      getAllFromDB(STORAGE_CONFIG.STORES.SCHEDULES),
      getLearningSessionsByUser(userId)
    ])

    const schedules = schedulesStore.filter((item) => item.userId === userId)

    console.log(` DEBUG hasPendingSyncData: Datos encontrados - attempts: ${attempts.length}, mastery: ${mastery.length}, schedules: ${schedules.length}, sessions: ${sessions.length}`)

    const unsyncedAttempts = attempts.filter((a) => !a.syncedAt)
    const unsyncedMastery = mastery.filter((m) => !m.syncedAt)
    const unsyncedSchedules = schedules.filter((s) => !s.syncedAt)
    const unsyncedSessions = sessions.filter((s) => !s.syncedAt)

    console.log(` DEBUG hasPendingSyncData: Sin sincronizar - attempts: ${unsyncedAttempts.length}, mastery: ${unsyncedMastery.length}, schedules: ${unsyncedSchedules.length}, sessions: ${unsyncedSessions.length}`)

    const pending = unsyncedAttempts.length > 0 || unsyncedMastery.length > 0 || unsyncedSchedules.length > 0 || unsyncedSessions.length > 0

    if (pending) {
      console.log(' DEBUG hasPendingSyncData: HAY datos pendientes de sincronización')
      return true
    }

    const queuedBatches = hasQueuedBatches()
    console.log(' DEBUG hasPendingSyncData: Batches en cola:', queuedBatches)

    return queuedBatches
  } catch (error) {
    console.warn('️ No se pudo verificar datos pendientes de sincronización:', error)
    return false
  }
}

/**
 * Forza una sincronización completa ignorando el modo incógnito
 * @param {Object} [options]
 * @returns {Promise<boolean>} Si la sincronización fue exitosa
 */
export async function forceSync(options = {}) {
  console.log(' Forzando sincronización completa (ignorando modo incógnito)...')
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
    console.error('❌ Error al exportar datos:', error)
    throw error
  }
}

/**
 * Importa datos desde un respaldo (no implementado completamente)
 * @returns {Promise<void>}
 */
export async function importDataFromBackup() {
  console.warn('️ importDataFromBackup aún no implementado. Usa setSchedule() y helpers dedicados para restaurar datos.')
}

/**
 * Maneja cambios en la conectividad
 * @param {boolean} online - Si hay conexión a internet
 */
export function handleConnectivityChange(online) {
  isOnline = !!online
  console.log(` Conectividad: ${online ? 'Conectado' : 'Desconectado'}`)
  if (online) {
    flushSyncQueue().then(() => syncWithCloud()).catch(() => {})
  }
}

/**
 * Ejecuta una sincronización diferencial (subset de colecciones)
 * @param {string[]} [include]
 * @returns {Promise<boolean>}
 */
export async function syncDifferential(include = ['attempts', 'mastery']) {
  try {
    console.log(' Iniciando sincronización diferencial:', include)
    return await syncWithCloud({ include })
  } catch (error) {
    console.error('Error en sincronización diferencial:', error)
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
    console.warn(' No se pudo programar sincronización automática: setInterval no disponible')
    return
  }

  if (intervalMs <= 0) {
    return
  }

  autoSyncTimerId = timerApi.setInterval(() => {
    if (isIncognitoMode) return
    syncWithCloud().catch(() => {})
  }, intervalMs)

  console.log(` Programando sincronización automática cada ${Math.round(intervalMs / 60000)} minutos`)
}

/**
 * Cancela la sincronización programada
 */
export function cancelScheduledSync() {
  const timerApi = typeof globalThis !== 'undefined' ? globalThis : undefined
  if (autoSyncTimerId && timerApi?.clearInterval) {
    timerApi.clearInterval(autoSyncTimerId)
  }
  autoSyncTimerId = null
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
