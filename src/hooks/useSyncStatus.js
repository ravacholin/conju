import { useState, useEffect, useCallback } from 'react'
import { getSyncStatus } from '../lib/progress/cloudSync.js'

const FALLBACK_POLL_MS = 2 * 60 * 1000

let subscribers = new Set()
let listenersAttached = false
let fallbackIntervalId = null

function notifySubscribers() {
  for (const notify of subscribers) {
    notify()
  }
}

function pollIfVisible() {
  if (typeof document !== 'undefined' && document.hidden) {
    return
  }
  notifySubscribers()
}

function attachGlobalListeners() {
  if (listenersAttached || typeof window === 'undefined') {
    return
  }

  const handleSyncEvent = () => notifySubscribers()
  const handleNetworkChange = () => notifySubscribers()
  const handleFocus = () => notifySubscribers()
  const handleVisibility = () => {
    if (!document.hidden) {
      notifySubscribers()
    }
  }

  window.__CONJU_SYNC_STATUS_HANDLERS__ = {
    handleSyncEvent,
    handleNetworkChange,
    handleFocus,
    handleVisibility
  }

  window.addEventListener('progress:cloud-sync', handleSyncEvent)
  window.addEventListener('online', handleNetworkChange)
  window.addEventListener('offline', handleNetworkChange)
  window.addEventListener('focus', handleFocus)
  document.addEventListener('visibilitychange', handleVisibility)

  fallbackIntervalId = window.setInterval(pollIfVisible, FALLBACK_POLL_MS)
  listenersAttached = true
}

function detachGlobalListeners() {
  if (!listenersAttached || typeof window === 'undefined') {
    return
  }

  const handlers = window.__CONJU_SYNC_STATUS_HANDLERS__
  if (handlers) {
    window.removeEventListener('progress:cloud-sync', handlers.handleSyncEvent)
    window.removeEventListener('online', handlers.handleNetworkChange)
    window.removeEventListener('offline', handlers.handleNetworkChange)
    window.removeEventListener('focus', handlers.handleFocus)
    document.removeEventListener('visibilitychange', handlers.handleVisibility)
    delete window.__CONJU_SYNC_STATUS_HANDLERS__
  }

  if (fallbackIntervalId) {
    window.clearInterval(fallbackIntervalId)
    fallbackIntervalId = null
  }

  listenersAttached = false
}

/**
 * Hook para monitorear el estado de sincronizacion en tiempo real.
 * Usa una sola suscripcion global para evitar listeners/intervals duplicados
 * cuando hay multiples componentes consumiendo el hook.
 */
export function useSyncStatus() {
  const [syncStatus, setSyncStatus] = useState(() => getSyncStatus())

  const areStatusesEqual = useCallback((a, b) => {
    return (
      a.isSyncing === b.isSyncing &&
      a.lastSyncTime?.getTime() === b.lastSyncTime?.getTime() &&
      a.syncError === b.syncError &&
      a.isOnline === b.isOnline &&
      a.isIncognitoMode === b.isIncognitoMode &&
      a.syncEnabled === b.syncEnabled &&
      a.isLocalSync === b.isLocalSync
    )
  }, [])

  const updateStatus = useCallback(() => {
    const nextStatus = getSyncStatus()
    setSyncStatus((prevStatus) => (areStatusesEqual(prevStatus, nextStatus) ? prevStatus : nextStatus))
  }, [areStatusesEqual])

  useEffect(() => {
    subscribers.add(updateStatus)
    attachGlobalListeners()
    updateStatus()

    return () => {
      subscribers.delete(updateStatus)
      if (subscribers.size === 0) {
        detachGlobalListeners()
      }
    }
  }, [updateStatus])

  return syncStatus
}
