import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { SyncMutex, withMutex, globalMutex } from './SyncMutex.js'

describe('SyncMutex', () => {
  let mutex

  beforeEach(() => {
    // Clear localStorage before each test
    if (typeof window !== 'undefined') {
      window.localStorage.clear()
    }
    mutex = new SyncMutex()
  })

  afterEach(() => {
    if (mutex) {
      mutex.forceRelease()
    }
    if (typeof window !== 'undefined') {
      window.localStorage.clear()
    }
  })

  describe('Basic Lock Acquisition', () => {
    it('should acquire lock successfully on first attempt', () => {
      const acquired = mutex.acquire()
      expect(acquired).toBe(true)
      expect(mutex.hasLock()).toBe(true)
    })

    it('should prevent second acquisition while lock is held', () => {
      const first = mutex.acquire()
      expect(first).toBe(true)

      const second = mutex.acquire()
      expect(second).toBe(false)
    })

    it('should allow acquisition after release', () => {
      mutex.acquire()
      mutex.release()

      const secondAcquire = mutex.acquire()
      expect(secondAcquire).toBe(true)
    })
  })

  describe('Cross-Tab Simulation', () => {
    it('should prevent race condition between two mutex instances', () => {
      const mutex1 = new SyncMutex()
      const mutex2 = new SyncMutex()

      const acquired1 = mutex1.acquire()
      expect(acquired1).toBe(true)

      // Simulate second tab trying to acquire
      const acquired2 = mutex2.acquire()
      expect(acquired2).toBe(false)

      mutex1.release()

      // Now second tab can acquire
      const acquired2Retry = mutex2.acquire()
      expect(acquired2Retry).toBe(true)

      mutex2.release()
    })
  })

  describe('Lock Timeout', () => {
    it('should clear expired locks', () => {
      // Manually set an expired lock in localStorage
      if (typeof window !== 'undefined') {
        const expiredLock = {
          id: 'expired-lock-123',
          timestamp: Date.now() - 35000 // 35 seconds ago (>30s timeout)
        }
        window.localStorage.setItem('progress-sync-mutex-v1', JSON.stringify(expiredLock))
      }

      // Should acquire successfully by clearing expired lock
      const acquired = mutex.acquire()
      expect(acquired).toBe(true)
    })

    it('should not clear fresh locks', () => {
      // Manually set a fresh lock
      if (typeof window !== 'undefined') {
        const freshLock = {
          id: 'fresh-lock-456',
          timestamp: Date.now() - 5000 // 5 seconds ago (<30s timeout)
        }
        window.localStorage.setItem('progress-sync-mutex-v1', JSON.stringify(freshLock))
      }

      // Should fail to acquire
      const acquired = mutex.acquire()
      expect(acquired).toBe(false)
    })
  })

  describe('withMutex Helper', () => {
    it('should execute function with mutex protection', async () => {
      let executed = false
      const testFn = async () => {
        executed = true
        return 'success'
      }

      const result = await withMutex(testFn, { retries: 1, retryDelay: 100 })

      expect(executed).toBe(true)
      expect(result).toBe('success')
      expect(globalMutex.hasLock()).toBe(false) // Should release after execution
    })

    it('should retry if lock is busy', async () => {
      // Acquire lock with another mutex
      const blockingMutex = new SyncMutex()
      blockingMutex.acquire()

      let executed = false
      const testFn = async () => {
        executed = true
        return 'success'
      }

      // Start withMutex (should retry)
      const promise = withMutex(testFn, { retries: 3, retryDelay: 50 })

      // Release blocking lock after short delay
      setTimeout(() => {
        blockingMutex.release()
      }, 100)

      const result = await promise

      expect(executed).toBe(true)
      expect(result).toBe('success')
    })

    it('should return null if max retries exceeded', async () => {
      // Hold lock permanently
      const blockingMutex = new SyncMutex()
      blockingMutex.acquire()

      const testFn = async () => {
        return 'should not execute'
      }

      const result = await withMutex(testFn, { retries: 2, retryDelay: 10 })

      expect(result).toBe(null)

      blockingMutex.release()
    })

    it('should always release lock even if function throws', async () => {
      const testFn = async () => {
        throw new Error('test error')
      }

      await expect(withMutex(testFn, { retries: 1 })).rejects.toThrow('test error')

      // Lock should be released
      expect(globalMutex.hasLock()).toBe(false)
    })
  })

  describe('Edge Cases', () => {
    it('should handle missing localStorage gracefully', () => {
      // Simulate server-side environment
      const originalLocalStorage = global.window?.localStorage
      if (global.window) {
        delete global.window.localStorage
      }

      const serverMutex = new SyncMutex()
      const acquired = serverMutex.acquire()

      // Should succeed without localStorage
      expect(acquired).toBe(true)

      // Restore
      if (global.window && originalLocalStorage) {
        global.window.localStorage = originalLocalStorage
      }
    })

    it('should handle corrupted localStorage data', () => {
      if (typeof window !== 'undefined') {
        // Set corrupted data
        window.localStorage.setItem('progress-sync-mutex-v1', 'invalid json {')
      }

      // Should handle gracefully and acquire lock
      const acquired = mutex.acquire()
      expect(acquired).toBe(true)
    })
  })

  describe('Force Release', () => {
    it('should force clear lock regardless of ownership', () => {
      const mutex1 = new SyncMutex()
      const mutex2 = new SyncMutex()

      mutex1.acquire()

      // Force release from different instance
      mutex2.forceRelease()

      // Now anyone can acquire
      const acquired = mutex2.acquire()
      expect(acquired).toBe(true)

      mutex2.release()
    })
  })
})
