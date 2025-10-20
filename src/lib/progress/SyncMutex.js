// SyncMutex - Cross-tab atomic lock using localStorage
// Prevents race conditions when multiple tabs/devices sync simultaneously

import { createLogger } from '../utils/logger.js'

const logger = createLogger('progress:SyncMutex')
const isDev = import.meta?.env?.DEV

const MUTEX_KEY = 'progress-sync-mutex-v1'
const LOCK_TIMEOUT_MS = 30000 // 30 seconds max lock duration

/**
 * SyncMutex - Atomic lock for cross-tab synchronization
 * Uses localStorage as shared memory with timestamp-based timeout
 */
class SyncMutex {
  constructor() {
    this.lockId = null
    this.isLocked = false
  }

  /**
   * Attempt to acquire lock
   * @returns {boolean} True if lock acquired, false if already locked
   */
  acquire() {
    if (typeof window === 'undefined' || !window.localStorage) {
      // Server-side or no localStorage - allow operation
      if (isDev) logger.warn('acquire', 'localStorage unavailable, bypassing mutex')
      this.isLocked = true
      return true
    }

    try {
      const now = Date.now()
      const lockData = this._getLockData()

      // Check if existing lock is expired
      if (lockData && now - lockData.timestamp > LOCK_TIMEOUT_MS) {
        if (isDev) logger.warn('acquire', 'Expired lock detected, clearing', {
          age: now - lockData.timestamp,
          lockId: lockData.id
        })
        this._clearLock()
      } else if (lockData) {
        // Lock is still valid and held by another process
        if (isDev) logger.info('acquire', 'Lock already held by another process', {
          lockId: lockData.id,
          age: now - lockData.timestamp
        })
        return false
      }

      // Acquire lock
      this.lockId = this._generateLockId()
      const newLock = {
        id: this.lockId,
        timestamp: now
      }

      window.localStorage.setItem(MUTEX_KEY, JSON.stringify(newLock))

      // Verify we actually got the lock (race condition check)
      // Small delay to ensure localStorage is consistent across tabs
      const verification = this._getLockData()
      if (verification && verification.id === this.lockId) {
        this.isLocked = true
        if (isDev) logger.debug('acquire', 'Lock acquired successfully', { lockId: this.lockId })
        return true
      } else {
        // Another process won the race
        if (isDev) logger.info('acquire', 'Lost race for lock', {
          ourId: this.lockId,
          winnerId: verification?.id
        })
        this.lockId = null
        return false
      }
    } catch (error) {
      logger.error('acquire', 'Error acquiring lock', error)
      return false
    }
  }

  /**
   * Release lock if we hold it
   */
  release() {
    if (!this.isLocked) {
      return
    }

    if (typeof window === 'undefined' || !window.localStorage) {
      this.isLocked = false
      this.lockId = null
      return
    }

    try {
      const lockData = this._getLockData()

      // Only release if we still hold the lock
      if (lockData && lockData.id === this.lockId) {
        this._clearLock()
        if (isDev) logger.debug('release', 'Lock released', { lockId: this.lockId })
      } else {
        if (isDev) logger.warn('release', 'Lock was already released or taken by another process', {
          ourId: this.lockId,
          currentId: lockData?.id
        })
      }
    } catch (error) {
      logger.error('release', 'Error releasing lock', error)
    } finally {
      this.isLocked = false
      this.lockId = null
    }
  }

  /**
   * Check if we currently hold the lock
   * @returns {boolean}
   */
  hasLock() {
    if (!this.isLocked || !this.lockId) {
      return false
    }

    if (typeof window === 'undefined' || !window.localStorage) {
      return this.isLocked
    }

    try {
      const lockData = this._getLockData()
      return lockData && lockData.id === this.lockId
    } catch {
      return false
    }
  }

  /**
   * Force clear all locks (use with caution)
   */
  forceRelease() {
    try {
      this._clearLock()
      this.isLocked = false
      this.lockId = null
      if (isDev) logger.warn('forceRelease', 'Lock forcefully cleared')
    } catch (error) {
      logger.error('forceRelease', 'Error force releasing lock', error)
    }
  }

  // Private methods

  _getLockData() {
    try {
      const raw = window.localStorage.getItem(MUTEX_KEY)
      if (!raw) return null
      return JSON.parse(raw)
    } catch {
      return null
    }
  }

  _clearLock() {
    try {
      window.localStorage.removeItem(MUTEX_KEY)
    } catch (error) {
      logger.error('_clearLock', 'Error clearing lock', error)
    }
  }

  _generateLockId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

// Global mutex instance
const globalMutex = new SyncMutex()

/**
 * Execute function with mutex lock
 * @param {Function} fn - Async function to execute with lock
 * @param {Object} options
 * @param {number} options.retries - Number of retry attempts
 * @param {number} options.retryDelay - Delay between retries in ms
 * @returns {Promise<any>} Result of fn() or null if couldn't acquire lock
 */
export async function withMutex(fn, options = {}) {
  const { retries = 3, retryDelay = 1000 } = options

  for (let attempt = 0; attempt < retries; attempt++) {
    if (globalMutex.acquire()) {
      try {
        const result = await fn()
        return result
      } finally {
        globalMutex.release()
      }
    }

    // Couldn't acquire lock, wait and retry
    if (attempt < retries - 1) {
      if (isDev) logger.debug('withMutex', `Lock busy, retrying in ${retryDelay}ms`, {
        attempt: attempt + 1,
        maxRetries: retries
      })
      await new Promise(resolve => setTimeout(resolve, retryDelay))
    }
  }

  // Failed to acquire lock after all retries
  if (isDev) logger.warn('withMutex', 'Failed to acquire lock after retries', { retries })
  return null
}

export { globalMutex, SyncMutex }
export default globalMutex
