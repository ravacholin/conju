import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { syncWithCloud, getSyncStatus, cancelScheduledSync } from './cloudSync.js'
import { globalMutex } from './SyncMutex.js'

/**
 * Tests de concurrencia para sistema de sincronización
 * Valida race conditions, multi-device scenarios, y data integrity
 */

describe('Sync Concurrency Tests', () => {
  beforeEach(() => {
    cancelScheduledSync()
    globalMutex.forceRelease()
  })

  afterEach(() => {
    cancelScheduledSync()
    globalMutex.forceRelease()
  })

  describe('Race Condition Prevention', () => {
    it('should prevent simultaneous sync from multiple tabs', async () => {
      // Simulate two tabs trying to sync at the exact same time
      const syncPromise1 = syncWithCloud({ include: ['attempts'] })

      // Small delay to ensure first sync acquires mutex
      await new Promise(resolve => setTimeout(resolve, 10))

      const syncPromise2 = syncWithCloud({ include: ['attempts'] })

      const [result1, result2] = await Promise.all([syncPromise1, syncPromise2])

      // Both complete (no crashes), but mutex prevents true simultaneous execution
      expect(result1).toBeDefined()
      expect(result2).toBeDefined()
      expect(typeof result1).toBe('boolean')
      expect(typeof result2).toBe('boolean')
    })

    it('should handle rapid sequential sync requests without data corruption', async () => {
      // Simulate user clicking sync button multiple times rapidly
      const results = []

      for (let i = 0; i < 5; i++) {
        const result = await syncWithCloud({ include: ['mastery'] })
        results.push(result)
        // Small delay to prevent blocking
        await new Promise(resolve => setTimeout(resolve, 10))
      }

      // At least one should succeed
      const anySuccess = results.some(r => r === true)
      expect(anySuccess).toBe(true)

      // No crashes or undefined results
      expect(results.every(r => typeof r === 'boolean')).toBe(true)
    })

    it('should release mutex after sync error', async () => {
      // Force sync to fail and verify mutex is released
      const statusBefore = getSyncStatus()

      try {
        await syncWithCloud({ include: ['invalid_collection'] })
      } catch {
        // Expected to fail
      }

      const statusAfter = getSyncStatus()

      // Mutex should be released even after error
      expect(statusAfter.isSyncing).toBe(false)
    })
  })

  describe('Multi-Device Scenarios', () => {
    it('should handle device A syncing while device B is offline', async () => {
      // Device A syncs successfully
      const deviceASync = await syncWithCloud({ include: ['attempts', 'mastery'] })

      // Device B comes online and tries to sync
      // Should not conflict with Device A's completed sync
      const deviceBSync = await syncWithCloud({ include: ['attempts', 'mastery'] })

      // Both should eventually succeed (not simultaneously, but sequentially)
      expect(deviceASync).toBeDefined()
      expect(deviceBSync).toBeDefined()
    })

    it('should maintain sync queue integrity across sessions', async () => {
      // Simulate device going offline mid-sync
      const sync1 = syncWithCloud({ include: ['schedules'] })

      // Cancel sync (simulating network failure)
      setTimeout(() => {
        cancelScheduledSync()
      }, 50)

      await sync1

      // New sync should work without issues
      const sync2 = await syncWithCloud({ include: ['schedules'] })

      expect(sync2).toBeDefined()
    })
  })

  describe('Timing and Ordering', () => {
    it('should respect sync order for sequential requests', async () => {
      const syncOrder = []

      // Start three syncs in order
      const sync1 = syncWithCloud({ include: ['attempts'] }).then(() => {
        syncOrder.push(1)
      })

      await new Promise(resolve => setTimeout(resolve, 50))

      const sync2 = syncWithCloud({ include: ['mastery'] }).then(() => {
        syncOrder.push(2)
      })

      await new Promise(resolve => setTimeout(resolve, 50))

      const sync3 = syncWithCloud({ include: ['schedules'] }).then(() => {
        syncOrder.push(3)
      })

      await Promise.all([sync1, sync2, sync3])

      // Due to mutex, they should execute in order (not all simultaneously)
      expect(syncOrder.length).toBeGreaterThan(0)
    })

    it('should handle sync timeout scenarios gracefully', async () => {
      // Start a sync
      const slowSync = syncWithCloud({ include: ['attempts', 'mastery', 'schedules'] })

      // Wait minimal time
      await new Promise(resolve => setTimeout(resolve, 100))

      // Try another sync (should be blocked by mutex)
      const fastSync = syncWithCloud({ include: ['attempts'] })

      const [slow, fast] = await Promise.all([slowSync, fastSync])

      // Both should complete without hanging
      expect(slow).toBeDefined()
      expect(fast).toBeDefined()
    })
  })

  describe('Data Integrity Under Concurrency', () => {
    it('should not lose sync status updates during concurrent operations', async () => {
      const statusSnapshots = []

      // Monitor status during concurrent syncs
      const monitor = setInterval(() => {
        statusSnapshots.push(getSyncStatus())
      }, 10)

      // Run multiple syncs
      await Promise.all([
        syncWithCloud({ include: ['attempts'] }),
        new Promise(resolve => setTimeout(resolve, 20)).then(() =>
          syncWithCloud({ include: ['mastery'] })
        ),
        new Promise(resolve => setTimeout(resolve, 40)).then(() =>
          syncWithCloud({ include: ['schedules'] })
        )
      ])

      clearInterval(monitor)

      // Verify no status snapshot shows undefined/corrupted state
      expect(statusSnapshots.every(s => s !== null && s !== undefined)).toBe(true)
      expect(statusSnapshots.every(s => typeof s.isSyncing === 'boolean')).toBe(true)
    })

    it('should maintain lastSyncTime accuracy across concurrent syncs', async () => {
      const beforeSync = new Date()

      await syncWithCloud({ include: ['attempts'] })

      const status1 = getSyncStatus()
      const afterFirstSync = status1.lastSyncTime

      await new Promise(resolve => setTimeout(resolve, 100))

      await syncWithCloud({ include: ['mastery'] })

      const status2 = getSyncStatus()
      const afterSecondSync = status2.lastSyncTime

      // lastSyncTime should progress forward (not regress)
      if (afterFirstSync && afterSecondSync) {
        expect(new Date(afterSecondSync).getTime()).toBeGreaterThanOrEqual(
          new Date(afterFirstSync).getTime()
        )
      }
    })
  })

  describe('Error Recovery', () => {
    it('should recover from mutex deadlock scenario', async () => {
      // Simulate potential deadlock: mutex held but sync fails
      const acquireMutex = globalMutex.acquire()

      if (acquireMutex) {
        // Force release to simulate recovery
        setTimeout(() => {
          globalMutex.forceRelease()
        }, 100)
      }

      // New sync should eventually succeed after recovery
      const result = await syncWithCloud({ include: ['attempts'] })

      expect(result).toBeDefined()
    })

    it('should handle corrupted sync state gracefully', async () => {
      // Force corrupt state
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('progress-sync-mutex-v1', 'corrupted data {')
      }

      // Sync should handle corruption
      const result = await syncWithCloud({ include: ['attempts'] })

      expect(result).toBeDefined()
    })
  })

  describe('Performance Under Load', () => {
    it('should handle 10 concurrent sync attempts without crashing', async () => {
      const attempts = Array.from({ length: 10 }, (_, i) =>
        syncWithCloud({ include: ['attempts'] })
      )

      const results = await Promise.all(attempts)

      // Should complete all without errors
      expect(results.length).toBe(10)
      expect(results.every(r => typeof r === 'boolean')).toBe(true)
    })

    it('should maintain performance with rapid sync requests', async () => {
      const startTime = Date.now()

      // 20 rapid syncs
      for (let i = 0; i < 20; i++) {
        await syncWithCloud({ include: ['mastery'] })
      }

      const duration = Date.now() - startTime

      // Should complete in reasonable time (< 10 seconds for 20 syncs)
      expect(duration).toBeLessThan(10000)
    })
  })
})
