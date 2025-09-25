// Offline-first helpers for Phase 3 improvements

import { PROGRESS_CONFIG } from './config.js'
import { getSyncStatus, hasPendingSyncData } from './cloudSync.js'
import { getDueItems } from './srs.js'
import { getCurrentUserId } from './userManager.js'
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

function collectQueueSize() {
  if (typeof window === 'undefined') return 0
  try {
    const key = PROGRESS_CONFIG.OFFLINE?.STORAGE_KEYS?.OFFLINE_QUEUE
    if (!key) return 0
    const raw = window.localStorage.getItem(key)
    if (!raw) return 0
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed.length
    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.queue)) return parsed.queue.length
    return 0
  } catch (error) {
    logger.warn('No se pudo inspeccionar cola offline', error)
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
  const queueSize = collectQueueSize()

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
