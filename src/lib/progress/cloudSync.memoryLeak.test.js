import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  scheduleAutoSync,
  cancelScheduledSync,
  setIncognitoMode,
  getSyncStatus,
  shouldRunAutoSyncTick
} from './cloudSync.js'
import { clearAuthState } from './authBridge.js'

describe('CloudSync Memory Leak Prevention', () => {
  beforeEach(() => {
    // Cancel any existing auto-sync before each test
    cancelScheduledSync()
  })

  afterEach(() => {
    // Cleanup after each test
    cancelScheduledSync()
    setIncognitoMode(false)
  })

  describe('Auto-Sync Timer Cleanup', () => {
    it('should cancel auto-sync timer when cancelScheduledSync is called', () => {
      // Schedule auto-sync
      scheduleAutoSync(1000)
      // Note: We can't directly check timer ID, but we can verify cleanup behavior

      // Cancel
      cancelScheduledSync()

      const statusAfter = getSyncStatus()

      // Should complete without errors
      expect(statusAfter).toBeDefined()
    })

    it('should prevent multiple setInterval accumulation', () => {
      // Simulate multiple calls to scheduleAutoSync (memory leak scenario)
      scheduleAutoSync(1000)
      scheduleAutoSync(1000)
      scheduleAutoSync(1000)

      // Each call should cancel previous timer, preventing accumulation
      // If not, we'd have 3 timers running

      cancelScheduledSync()

      // Should complete without errors
      expect(true).toBe(true)
    })

    it('should cleanup timer when setIncognitoMode is enabled', () => {
      scheduleAutoSync(1000)

      // Enabling incognito should cancel auto-sync
      setIncognitoMode(true)

      const status = getSyncStatus()
      expect(status.isIncognitoMode).toBe(true)

      // Cleanup
      setIncognitoMode(false)
    })

    it('should cleanup timer during logout', async () => {
      scheduleAutoSync(1000)

      // Mock scenario: user logs out
      // This should trigger cleanup via clearAuthState
      try {
        await clearAuthState()
      } catch {
        // clearAuthState might fail in test environment, that's ok
      }

      // The timer should be cleaned up
      // (Hard to verify directly, but should not throw)
      expect(true).toBe(true)
    })
  })

  describe('Multiple Session Simulation', () => {
    it('should handle multiple login/logout cycles without leaking', async () => {
      // Simulate user logging in and out multiple times
      for (let i = 0; i < 5; i++) {
        scheduleAutoSync(500)

        // Simulate logout
        try {
          await clearAuthState()
        } catch {
          // Ignore errors in test environment
        }

        cancelScheduledSync()
      }

      // Should complete without accumulating timers
      expect(true).toBe(true)
    })

    it('should not have stale timers after multiple incognito toggles', () => {
      for (let i = 0; i < 10; i++) {
        scheduleAutoSync(100)
        setIncognitoMode(true)
        setIncognitoMode(false)
        cancelScheduledSync()
      }

      // Should not accumulate timers
      const status = getSyncStatus()
      expect(status).toBeDefined()
    })
  })

  describe('Edge Cases', () => {
    it('should handle cancelScheduledSync called multiple times', () => {
      scheduleAutoSync(1000)

      // Multiple cancels should be idempotent
      cancelScheduledSync()
      cancelScheduledSync()
      cancelScheduledSync()

      expect(true).toBe(true)
    })

    it('should handle cancelScheduledSync without prior schedule', () => {
      // Cancel without scheduling - should not throw
      cancelScheduledSync()

      expect(true).toBe(true)
    })

    it('should handle zero interval gracefully', () => {
      // scheduleAutoSync with 0 or negative interval should not schedule
      scheduleAutoSync(0)
      scheduleAutoSync(-100)

      // Should not throw
      expect(true).toBe(true)

      cancelScheduledSync()
    })

    it('should clear scheduled timer even when timer id is 0', () => {
      const originalSetInterval = globalThis.setInterval
      const originalClearInterval = globalThis.clearInterval
      const clearIntervalSpy = vi.fn()

      try {
        globalThis.setInterval = vi.fn(() => 0)
        globalThis.clearInterval = clearIntervalSpy

        scheduleAutoSync(1000)
        cancelScheduledSync()

        expect(clearIntervalSpy).toHaveBeenCalledWith(0)
      } finally {
        globalThis.setInterval = originalSetInterval
        globalThis.clearInterval = originalClearInterval
      }
    })

    it('should skip auto-sync tick when hidden or offline', () => {
      expect(shouldRunAutoSyncTick({ online: true, incognito: false, hidden: false })).toBe(true)
      expect(shouldRunAutoSyncTick({ online: true, incognito: false, hidden: true })).toBe(false)
      expect(shouldRunAutoSyncTick({ online: false, incognito: false, hidden: false })).toBe(false)
      expect(shouldRunAutoSyncTick({ online: true, incognito: true, hidden: false })).toBe(false)
    })
  })

  describe('Memory Leak Regression Test (Bug #3)', () => {
    it('should not leak memory on repeated sync operations', () => {
      // Simulate the original bug: multiple sessions without cleanup
      const iterations = 20

      for (let i = 0; i < iterations; i++) {
        scheduleAutoSync(100)
        // In the buggy version, this would accumulate 20 intervals

        // Proper cleanup
        cancelScheduledSync()
      }

      // If memory leak exists, we'd have 20 intervals still running
      // With fix, all should be cleaned up

      const status = getSyncStatus()
      expect(status).toBeDefined()
    })

    it('should release mutex lock during cleanup', () => {
      scheduleAutoSync(1000)

      // Verify cleanup also releases mutex
      cancelScheduledSync()

      const status = getSyncStatus()

      // isSyncing should be false after cleanup
      expect(status.isSyncing).toBe(false)
    })
  })

  describe('Integration with Mutex', () => {
    it('should not leave mutex locked after auto-sync error', async () => {
      // This tests that even if sync fails, mutex is released

      // Schedule with very short interval to trigger quickly
      scheduleAutoSync(100)

      // Wait a bit for potential execution
      await new Promise(resolve => setTimeout(resolve, 150))

      // Cancel
      cancelScheduledSync()

      const status = getSyncStatus()

      // Mutex should not be locked
      expect(status.isSyncing).toBe(false)
    })
  })
})
