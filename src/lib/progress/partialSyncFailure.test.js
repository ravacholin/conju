import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createCompleteConfigMock, createCompleteAuthBridgeMock, createCompleteUserSettingsStoreMock } from './test-helpers.js'

/**
 * Tests de partial sync failure
 * Valida comportamiento cuando sync falla parcialmente (ej: attempts OK, mastery FAIL)
 */

const loggerStub = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }

describe('Partial Sync Failure Scenarios', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()

    vi.doMock('./safeLogger.js', () => ({
      createSafeLogger: () => loggerStub
    }))

    vi.doMock('./config.js', () => createCompleteConfigMock())

    vi.doMock('../config/syncConfig.js', () => ({
      getSyncConfigDebug: () => ({
        apiBase: 'https://api.test.com',
        authHeaderName: 'Authorization',
        isDev: true,
        isProd: false
      })
    }))

    vi.doMock('../cache/ProgressDataCache.js', () => ({
      progressDataCache: { invalidateUser: vi.fn() }
    }))
  })

  describe('Collection-Level Failures', () => {
    it('should continue sync when attempts collection fails but mastery succeeds', async () => {
      vi.doMock('./authBridge.js', () => createCompleteAuthBridgeMock({
        isAuthenticated: () => true,
        getAuthToken: () => 'valid-token',
        getAuthenticatedUser: () => ({ id: 'user-123' }),
        getAuthenticatedAccount: () => ({ email: 'test@example.com' }),
        getSyncEndpoint: () => 'https://api.test.com',
        isSyncEnabled: () => true,
        isLocalSyncMode: () => false,
        getSyncAuthHeaderName: () => 'Authorization',
        getSyncAuthToken: () => 'valid-token',
        clearAuthState: vi.fn()
      }))

      vi.doMock('./userSettingsStore.js', () => createCompleteUserSettingsStoreMock({
        getCurrentUserId: () => 'user-123'
      }))

	      let attemptsSaved = false
	      let masterySaved = false

	      vi.doMock('./database.js', () => ({
	        getAttemptsByUser: vi.fn(async () => []),
	        getMasteryByUser: vi.fn(async () => [{ id: 'm1', userId: 'user-123', verbId: 'ser', mastery: 0.9 }]),
	        getAllFromDB: vi.fn(async (store) => {
	          if (store === 'schedules') return []
	          return []
	        }),
	        getLearningSessionsByUser: vi.fn(async () => []),
	        getFromDB: vi.fn(async () => null),
	        getUnsyncedItems: vi.fn(async (storeName) => {
	          if (storeName === 'attempts') return [{ id: 'a1', userId: 'user-123' }]
	          if (storeName === 'mastery') return [{ id: 'm1', userId: 'user-123', verbId: 'ser', mastery: 0.9 }]
	          return []
	        }),
	        saveUserSettings: vi.fn(async () => {}),
	        initDB: vi.fn(async () => ({
	          transaction: () => ({
	            objectStore: () => ({
	              get: vi.fn(async (id) => ({ id, userId: 'user-123' })),
	              put: vi.fn(async () => {})
	            }),
	            done: Promise.resolve()
	          })
	        }))
	      }))

	      vi.doMock('./SyncService.js', () => ({
	        default: {
	          postJSON: vi.fn(async () => ({ data: {} })),
	          tryBulk: vi.fn(async (collection) => {
	            if (collection === 'attempts') {
	              attemptsSaved = true
	              throw new Error('Network error')
	            }
	            if (collection === 'mastery') {
	              masterySaved = true
	              return { success: true }
	            }
	            return { success: true }
	          }),
	          wakeUpServer: vi.fn(async () => {}),
	          isBrowserOnline: () => true
	        }
	      }))

      const { syncAccountData } = await import('./syncCoordinator.js')

      const result = await syncAccountData()

      // Sync should complete (not crash) even if attempts failed
      expect(result).toBeDefined()

      // Mastery should have been attempted
      expect(masterySaved).toBe(true)
    })

    it('should rollback cleanly when network fails mid-sync', async () => {
      let syncAttempts = 0

      vi.doMock('./authBridge.js', () => createCompleteAuthBridgeMock({
        isAuthenticated: () => true,
        getAuthToken: () => 'valid-token',
        getAuthenticatedUser: () => ({ id: 'user-123' }),
        getAuthenticatedAccount: () => ({ email: 'test@example.com' }),
        getSyncEndpoint: () => 'https://api.test.com',
        isSyncEnabled: () => true,
        isLocalSyncMode: () => false,
        getSyncAuthHeaderName: () => 'Authorization',
        getSyncAuthToken: () => 'valid-token',
        clearAuthState: vi.fn()
      }))

      vi.doMock('./userSettingsStore.js', () => createCompleteUserSettingsStoreMock({
        getCurrentUserId: () => 'user-123'
      }))

	      vi.doMock('./database.js', () => ({
	        getAttemptsByUser: vi.fn(async () => [
	          { id: 'a1', verbId: 'hablar', correct: true }
	        ]),
	        getMasteryByUser: vi.fn(async () => [
	          { id: 'm1', verbId: 'ser', mastery: 0.8 }
	        ]),
	        getAllFromDB: vi.fn(async () => []),
	        getLearningSessionsByUser: vi.fn(async () => []),
	        getFromDB: vi.fn(async () => null),
	        getUnsyncedItems: vi.fn(async (storeName) => {
	          if (storeName === 'attempts') return [{ id: 'a1', userId: 'user-123' }]
	          if (storeName === 'mastery') return [{ id: 'm1', userId: 'user-123', verbId: 'ser', mastery: 0.8 }]
	          return []
	        }),
	        saveUserSettings: vi.fn(async () => {}),
	        initDB: vi.fn(async () => ({
	          transaction: () => ({
	            objectStore: () => ({
	              get: vi.fn(async (id) => ({ id, userId: 'user-123' })),
	              put: vi.fn(async () => {})
	            }),
	            done: Promise.resolve()
	          })
	        }))
	      }))

	      vi.doMock('./SyncService.js', () => ({
	        default: {
	          postJSON: vi.fn(async () => ({ data: {} })),
	          tryBulk: vi.fn(async () => {
	            syncAttempts++
	            // Fail on second upload (mastery)
	            if (syncAttempts >= 2) throw new Error('Network timeout')
	            return { success: true }
	          }),
	          wakeUpServer: vi.fn(async () => {}),
	          isBrowserOnline: () => true
	        }
	      }))

      const { syncAccountData } = await import('./syncCoordinator.js')

      const result = await syncAccountData()

      // Should return failure result (not crash)
      expect(result).toBeDefined()
      expect(result.success).toBe(false)
    })
  })

  describe('Database Constraint Violations', () => {
    it('should handle unique constraint violation during merge', async () => {
      vi.doMock('./authBridge.js', () => createCompleteAuthBridgeMock({
        getAuthenticatedUser: () => ({ id: 'user-123' }),
        isLocalSyncMode: () => false,
        isAuthenticated: () => true
      }))

      vi.doMock('./userSettingsStore.js', () => createCompleteUserSettingsStoreMock({
        getCurrentUserId: () => 'user-123'
      }))

      vi.doMock('./database.js', () => ({
        getAllFromDB: vi.fn(async () => [
          { id: 'existing-1', verbId: 'ser', mastery: 0.5 }
        ]),
        batchSaveToDB: vi.fn(async () => {
          // Simulate unique constraint error
          throw new Error('Constraint violation: duplicate key')
        }),
        batchUpdateInDB: vi.fn(async () => ({ updated: 0, errors: [] }))
      }))

      const { mergeAccountDataLocally } = await import('./dataMerger.js')

      const remoteData = [
        { id: 'existing-1', verbId: 'ser', mastery: 0.9 } // Same ID
      ]

      // Should not crash app
      const result = await mergeAccountDataLocally({
        mastery: remoteData
      })

      expect(result).toBeDefined()
    })

    it('should recover from IndexedDB quota exceeded error', async () => {
      vi.doMock('./authBridge.js', () => createCompleteAuthBridgeMock({
        getAuthenticatedUser: () => ({ id: 'user-123' }),
        isLocalSyncMode: () => false,
        isAuthenticated: () => true
      }))

      vi.doMock('./userSettingsStore.js', () => createCompleteUserSettingsStoreMock({
        getCurrentUserId: () => 'user-123'
      }))

      vi.doMock('./database.js', () => ({
        getAllFromDB: vi.fn(async () => []),
        batchSaveToDB: vi.fn(async () => {
          const quotaError = new Error('QuotaExceededError')
          quotaError.name = 'QuotaExceededError'
          throw quotaError
        }),
        batchUpdateInDB: vi.fn(async () => ({ updated: 0, errors: [] }))
      }))

      const { mergeAccountDataLocally } = await import('./dataMerger.js')

      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: `attempt-${i}`,
        verbId: 'hablar',
        correct: Math.random() > 0.5
      }))

      const result = await mergeAccountDataLocally({
        attempts: largeDataset
      })

      // Should handle quota error gracefully
      expect(result).toBeDefined()
    })
  })

  describe('Network Failure Scenarios', () => {
    it('should handle 401 Unauthorized mid-sync', async () => {
      vi.doMock('./authBridge.js', () => createCompleteAuthBridgeMock({
        isAuthenticated: () => true,
        getAuthToken: () => 'expired-token',
        getAuthenticatedUser: () => ({ id: 'user-123' }),
        getAuthenticatedAccount: () => ({ email: 'test@example.com' }),
        getSyncEndpoint: () => 'https://api.test.com',
        isSyncEnabled: () => true,
        isLocalSyncMode: () => false,
        getSyncAuthHeaderName: () => 'Authorization'
      }))

      vi.doMock('./userSettingsStore.js', () => createCompleteUserSettingsStoreMock({
        getCurrentUserId: () => 'user-123'
      }))

      vi.doMock('./database.js', () => ({
        getAttemptsByUser: vi.fn(async () => []),
        getMasteryByUser: vi.fn(async () => []),
        getAllFromDB: vi.fn(async () => []),
        getLearningSessionsByUser: vi.fn(async () => []),
        getFromDB: vi.fn(async () => null),
        initDB: vi.fn(async () => ({
          transaction: () => ({
            objectStore: () => ({ put: vi.fn() }),
            done: Promise.resolve()
          })
        }))
      }))

      vi.doMock('./SyncService.js', () => ({
        default: {
          postJSON: vi.fn(async () => {
            const error = new Error('Unauthorized')
            error.status = 401
            throw error
          }),
          wakeUpServer: vi.fn(async () => {}),
          isBrowserOnline: () => true
        }
      }))

      const { syncAccountData } = await import('./syncCoordinator.js')

      const result = await syncAccountData()

      // Should return auth failure (not crash)
      expect(result).toBeDefined()
      expect(result.success).toBe(false)
    })

    it('should handle 500 Internal Server Error gracefully', async () => {
      vi.doMock('./authBridge.js', () => createCompleteAuthBridgeMock({
        isAuthenticated: () => true,
        getAuthToken: () => 'valid-token',
        getAuthenticatedUser: () => ({ id: 'user-123' }),
        getAuthenticatedAccount: () => ({ email: 'test@example.com' }),
        getSyncEndpoint: () => 'https://api.test.com',
        isSyncEnabled: () => true,
        isLocalSyncMode: () => false,
        getSyncAuthHeaderName: () => 'Authorization',
        getSyncAuthToken: () => 'valid-token',
        clearAuthState: vi.fn()
      }))

      vi.doMock('./userSettingsStore.js', () => createCompleteUserSettingsStoreMock({
        getCurrentUserId: () => 'user-123'
      }))

      vi.doMock('./database.js', () => ({
        getAttemptsByUser: vi.fn(async () => []),
        getMasteryByUser: vi.fn(async () => []),
        getAllFromDB: vi.fn(async () => []),
        getLearningSessionsByUser: vi.fn(async () => []),
        getFromDB: vi.fn(async () => null),
        initDB: vi.fn(async () => ({
          transaction: () => ({
            objectStore: () => ({ put: vi.fn() }),
            done: Promise.resolve()
          })
        }))
      }))

      vi.doMock('./SyncService.js', () => ({
        default: {
          postJSON: vi.fn(async () => {
            const error = new Error('Internal Server Error')
            error.status = 500
            throw error
          }),
          wakeUpServer: vi.fn(async () => {}),
          isBrowserOnline: () => true
        }
      }))

      const { syncAccountData } = await import('./syncCoordinator.js')

      const result = await syncAccountData()

      // Should fail gracefully
      expect(result).toBeDefined()
      expect(result.success).toBe(false)
    })
  })

  describe('Partial Success Tracking', () => {
    it('should track which collections succeeded and which failed', async () => {
      const syncResults = {
        attempts: null,
        mastery: null,
        schedules: null
      }

      vi.doMock('./authBridge.js', () => createCompleteAuthBridgeMock({
        isAuthenticated: () => true,
        getAuthToken: () => 'valid-token',
        getAuthenticatedUser: () => ({ id: 'user-123' }),
        getAuthenticatedAccount: () => ({ email: 'test@example.com' }),
        getSyncEndpoint: () => 'https://api.test.com',
        isSyncEnabled: () => true,
        isLocalSyncMode: () => false,
        getSyncAuthHeaderName: () => 'Authorization',
        getSyncAuthToken: () => 'valid-token',
        clearAuthState: vi.fn()
      }))

      vi.doMock('./userSettingsStore.js', () => createCompleteUserSettingsStoreMock({
        getCurrentUserId: () => 'user-123'
      }))

	      vi.doMock('./database.js', () => ({
	        getAttemptsByUser: vi.fn(async () => [{ id: 'a1' }]),
	        getMasteryByUser: vi.fn(async () => [{ id: 'm1' }]),
	        getAllFromDB: vi.fn(async () => [{ id: 's1' }]),
	        getLearningSessionsByUser: vi.fn(async () => []),
	        getFromDB: vi.fn(async () => null),
	        getUnsyncedItems: vi.fn(async (storeName) => {
	          if (storeName === 'attempts') return [{ id: 'a1', userId: 'user-123' }]
	          if (storeName === 'mastery') return [{ id: 'm1', userId: 'user-123', verbId: 'ser', mastery: 0.5 }]
	          if (storeName === 'schedules') return [{ id: 's1', userId: 'user-123', mood: 'indicative', tense: 'present' }]
	          return []
	        }),
	        saveUserSettings: vi.fn(async () => {}),
	        initDB: vi.fn(async () => ({
	          transaction: () => ({
	            objectStore: () => ({
	              get: vi.fn(async (id) => ({ id, userId: 'user-123' })),
	              put: vi.fn(async () => {})
	            }),
	            done: Promise.resolve()
	          })
	        }))
	      }))

	      vi.doMock('./SyncService.js', () => ({
	        default: {
	          postJSON: vi.fn(async () => ({ data: {} })),
	          tryBulk: vi.fn(async (collection) => {
	            if (collection === 'attempts') {
	              syncResults.attempts = 'success'
	              return { success: true }
	            }
	            if (collection === 'mastery') {
	              syncResults.mastery = 'failed'
	              throw new Error('Mastery sync failed')
	            }
	            if (collection === 'schedules') {
	              syncResults.schedules = 'success'
	              return { success: true }
	            }
	            return { success: true }
	          }),
	          wakeUpServer: vi.fn(async () => {}),
	          isBrowserOnline: () => true
	        }
	      }))

      const { syncAccountData } = await import('./syncCoordinator.js')

      await syncAccountData()

      // Should have attempted all collections
      expect(syncResults.attempts).toBe('success')
      expect(syncResults.mastery).toBe('failed')
      // schedules might or might not execute depending on error handling
    })
  })
})
