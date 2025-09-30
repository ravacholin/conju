// Offline-first helpers for Phase 3 improvements

import { PROGRESS_CONFIG } from './config.js'
import { getSyncStatus, hasPendingSyncData } from './cloudSync.js'
import { getDueItems } from './srs.js'
import { getCurrentUserId } from './userManager.js'
import { getAttemptsByUser, getMasteryByUser, getAllFromDB, getLearningSessionsByUser } from './database.js'
import { STORAGE_CONFIG } from './config.js'
import logger from './logger.js'

const statusCache = {
  timestamp: 0,
  data: null
}

const listeners = new Set()

function isNavigatorOffline() {
  if (typeof navigator === 'undefined') {
    return false
  }
  return navigator.onLine === false
}

async function collectQueueSize() {
  try {
    const userId = getCurrentUserId()
    if (!userId) return 0

    const [attempts, mastery, schedulesStore, sessions] = await Promise.all([
      getAttemptsByUser(userId),
      getMasteryByUser(userId),
      getAllFromDB(STORAGE_CONFIG.STORES.SCHEDULES),
      getLearningSessionsByUser(userId)
    ])

    const schedules = schedulesStore.filter((item) => item.userId === userId)

    const unsyncedAttempts = attempts.filter((a) => !a.syncedAt)
    const unsyncedMastery = mastery.filter((m) => !m.syncedAt)
    const unsyncedSchedules = schedules.filter((s) => !s.syncedAt)
    const unsyncedSessions = sessions.filter((s) => !s.syncedAt)

    const totalPending = unsyncedAttempts.length + unsyncedMastery.length + unsyncedSchedules.length + unsyncedSessions.length

    console.log(`🔍 DEBUG collectQueueSize: attempts: ${unsyncedAttempts.length}, mastery: ${unsyncedMastery.length}, schedules: ${unsyncedSchedules.length}, sessions: ${unsyncedSessions.length}, total: ${totalPending}`)

    return totalPending
  } catch (error) {
    logger.warn('No se pudo contar elementos pendientes de sincronización', error)
    return 0
  }
}

async function buildStatus(forceRefresh = false) {
  const pollInterval = PROGRESS_CONFIG.OFFLINE?.STATUS_POLL_INTERVAL || 15000
  const now = Date.now()
  if (!forceRefresh && statusCache.data && now - statusCache.timestamp < pollInterval) {
    return statusCache.data
  }

  const syncStatus = getSyncStatus()
  const pendingSync = await hasPendingSyncData()
  const queueSize = await collectQueueSize()

  const status = {
    isOffline: isNavigatorOffline(),
    pendingSync,
    lastSyncTime: syncStatus?.lastSyncTime || null,
    syncError: syncStatus?.syncError || null,
    incognitoMode: syncStatus?.isIncognitoMode || false,
    syncEnabled: syncStatus?.syncEnabled ?? false,
    isLocalSync: syncStatus?.isLocalSync ?? false,
    queueSize,
    checkedAt: new Date().toISOString()
  }

  statusCache.data = status
  statusCache.timestamp = now
  return status
}

function notify(status) {
  listeners.forEach(listener => {
    try {
      listener(status)
    } catch (error) {
      logger.warn('Error notificando estado offline', error)
    }
  })
}

export async function getOfflineStatus(forceRefresh = false) {
  const status = await buildStatus(forceRefresh)
  return { ...status }
}

export async function getOfflinePlanSummary(limit = PROGRESS_CONFIG.OFFLINE?.PREFETCH_REVIEWS_LIMIT || 50) {
  const userId = getCurrentUserId()
  if (!userId) return []
  try {
    const dueItems = await getDueItems(userId)
    return dueItems.slice(0, limit)
  } catch (error) {
    logger.warn('No se pudo obtener prefetch de items offline', error)
    return []
  }
}

export function onOfflineStatusChange(listener, { immediate = false } = {}) {
  if (typeof listener !== 'function') {
    throw new Error('Offline listener debe ser una función')
  }
  listeners.add(listener)
  if (immediate) {
    getOfflineStatus().then(listener).catch(error => logger.warn('No se pudo entregar estado offline inmediato', error))
  }
  return () => listeners.delete(listener)
}

function handleNetworkEvent() {
  buildStatus(true).then(status => {
    notify(status)
  }).catch(error => logger.warn('No se pudo actualizar estado offline tras evento', error))
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', handleNetworkEvent)
  window.addEventListener('offline', handleNetworkEvent)
}

export function clearOfflineCache() {
  statusCache.data = null
  statusCache.timestamp = 0
}
