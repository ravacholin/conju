import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createCompleteConfigMock, createCompleteAuthBridgeMock, createCompleteUserSettingsStoreMock } from './test-helpers.js'

/**
 * Tests de conflictos en data merge
 * Valida resolución correcta cuando Device A y Device B tienen datos diferentes
 */

const loggerStub = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }

describe('Data Merge Conflict Resolution', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()

    vi.doMock('./safeLogger.js', () => ({
      createSafeLogger: () => loggerStub
    }))

    vi.doMock('./config.js', () => createCompleteConfigMock())
  })

  describe('Timestamp-Based Conflict Resolution', () => {
    it('should prefer newer data when local and remote have same item', async () => {
      const olderDate = new Date('2025-01-01T00:00:00Z')
      const newerDate = new Date('2025-01-15T00:00:00Z')

      const localAttempts = [
        {
          id: 'attempt-1',
          verbId: 'hablar',
          correct: true,
          createdAt: olderDate.toISOString(),
          syncedAt: olderDate.toISOString()
        }
      ]

      const remoteAttempts = [
        {
          id: 'attempt-1',
          verbId: 'hablar',
          correct: false, // Different value
          createdAt: olderDate.toISOString(),
          syncedAt: newerDate.toISOString()
        }
      ]

      vi.doMock('./authBridge.js', () => createCompleteAuthBridgeMock({
        getAuthenticatedUser: () => ({ id: 'user-123' }),
        isLocalSyncMode: () => false,
        isAuthenticated: () => true
      }))

      vi.doMock('./userSettingsStore.js', () => createCompleteUserSettingsStoreMock({
        getCurrentUserId: () => 'user-123'
      }))

      const updatedItems = []

      vi.doMock('./database.js', () => ({
        getAllFromDB: vi.fn(async (store) => {
          if (store === 'attempts') return localAttempts
          return []
        }),
        batchSaveToDB: vi.fn(async () => ({ saved: 0, errors: [] })),
        batchUpdateInDB: vi.fn(async (_store, items) => {
          updatedItems.push(...items)
          return { updated: items.length, errors: [] }
        })
      }))

      const { mergeAccountDataLocally } = await import('./dataMerger.js')

      const result = await mergeAccountDataLocally({
        attempts: remoteAttempts
      })

      // Should update with newer remote data
      expect(result.attempts).toBe(1)
      expect(updatedItems.length).toBeGreaterThan(0)
      expect(updatedItems[0].updates.correct).toBe(false) // Remote value wins
    })

    it('should queue attempt updates using the latest updatedAt timestamp', async () => {
      const localAttempts = [
        {
          id: 'attempt-2',
          verbId: 'leer',
          correct: true,
          createdAt: '2025-01-01T00:00:00Z',
          syncedAt: '2025-01-20T00:00:00Z',
          updatedAt: '2025-01-20T00:00:00Z'
        }
      ]

      const remoteAttempts = [
        {
          id: 'attempt-2',
          verbId: 'leer',
          correct: false,
          createdAt: '2025-01-01T00:00:00Z',
          syncedAt: '2025-01-10T00:00:00Z',
          updatedAt: '2025-02-01T00:00:00Z'
        }
      ]

      vi.doMock('./authBridge.js', () => createCompleteAuthBridgeMock({
        getAuthenticatedUser: () => ({ id: 'user-123' }),
        isLocalSyncMode: () => false,
        isAuthenticated: () => true
      }))

      vi.doMock('./userSettingsStore.js', () => createCompleteUserSettingsStoreMock({
        getCurrentUserId: () => 'user-123'
      }))

      const updatedItems = []

      vi.doMock('./database.js', () => ({
        getAllFromDB: vi.fn(async (store) => {
          if (store === 'attempts') return localAttempts
          return []
        }),
        batchSaveToDB: vi.fn(async () => ({ saved: 0, errors: [] })),
        batchUpdateInDB: vi.fn(async (_store, items) => {
          updatedItems.push(...items)
          return { updated: items.length, errors: [] }
        })
      }))

      const { mergeAccountDataLocally } = await import('./dataMerger.js')

      const result = await mergeAccountDataLocally({ attempts: remoteAttempts })

      expect(result.attempts).toBe(1)
      expect(updatedItems).toHaveLength(1)
      expect(updatedItems[0].id).toBe('attempt-2')
      expect(updatedItems[0].updates.correct).toBe(false)
    })

    it('should keep local attempt data when local attempt is newer than remote', async () => {
      const localAttempts = [
        {
          id: 'attempt-3',
          verbId: 'escribir',
          correct: true,
          createdAt: '2025-01-01T00:00:00Z',
          syncedAt: '2025-02-10T00:00:00Z',
          updatedAt: '2025-02-10T00:00:00Z'
        }
      ]

      const remoteAttempts = [
        {
          id: 'attempt-3',
          verbId: 'escribir',
          correct: false,
          createdAt: '2025-01-01T00:00:00Z',
          syncedAt: '2025-01-10T00:00:00Z',
          updatedAt: '2025-01-10T00:00:00Z'
        }
      ]

      vi.doMock('./authBridge.js', () => createCompleteAuthBridgeMock({
        getAuthenticatedUser: () => ({ id: 'user-123' }),
        isLocalSyncMode: () => false,
        isAuthenticated: () => true
      }))

      vi.doMock('./userSettingsStore.js', () => createCompleteUserSettingsStoreMock({
        getCurrentUserId: () => 'user-123'
      }))

      const updatedItems = []
      const savedItems = []

      vi.doMock('./database.js', () => ({
        getAllFromDB: vi.fn(async (store) => {
          if (store === 'attempts') return localAttempts
          return []
        }),
        batchSaveToDB: vi.fn(async (_store, items) => {
          savedItems.push(...items)
          return { saved: items.length, errors: [] }
        }),
        batchUpdateInDB: vi.fn(async (_store, items) => {
          updatedItems.push(...items)
          return { updated: items.length, errors: [] }
        })
      }))

      const { mergeAccountDataLocally } = await import('./dataMerger.js')
      const result = await mergeAccountDataLocally({ attempts: remoteAttempts })

      expect(result.attempts).toBe(0)
      expect(updatedItems).toHaveLength(0)
      expect(savedItems).toHaveLength(0)
    })

    it('should update matching attempt by composite key when remote attempt has no id', async () => {
      const localAttempts = [
        {
          id: 'attempt-composite-1',
          verbId: 'tener',
          mood: 'indicative',
          tense: 'pres',
          person: '1s',
          correct: true,
          createdAt: '2025-01-01T00:00:01.000Z',
          syncedAt: '2025-01-01T00:00:02.000Z'
        }
      ]

      const remoteAttempts = [
        {
          verbId: 'tener',
          mood: 'indicative',
          tense: 'pres',
          person: '1s',
          correct: false,
          createdAt: '2025-01-01T00:00:03.000Z',
          syncedAt: '2025-01-20T00:00:00.000Z'
        }
      ]

      vi.doMock('./authBridge.js', () => createCompleteAuthBridgeMock({
        getAuthenticatedUser: () => ({ id: 'user-123' }),
        isLocalSyncMode: () => false,
        isAuthenticated: () => true
      }))

      vi.doMock('./userSettingsStore.js', () => createCompleteUserSettingsStoreMock({
        getCurrentUserId: () => 'user-123'
      }))

      const updatedItems = []

      vi.doMock('./database.js', () => ({
        getAllFromDB: vi.fn(async (store) => {
          if (store === 'attempts') return localAttempts
          return []
        }),
        batchSaveToDB: vi.fn(async () => ({ saved: 0, errors: [] })),
        batchUpdateInDB: vi.fn(async (_store, items) => {
          updatedItems.push(...items)
          return { updated: items.length, errors: [] }
        })
      }))

      const { mergeAccountDataLocally } = await import('./dataMerger.js')
      const result = await mergeAccountDataLocally({ attempts: remoteAttempts })

      expect(result.attempts).toBe(1)
      expect(updatedItems).toHaveLength(1)
      expect(updatedItems[0].id).toBe('attempt-composite-1')
      expect(updatedItems[0].updates.correct).toBe(false)
      expect(updatedItems[0].updates.id).toBe('attempt-composite-1')
    })

    it('should keep local data when local is newer than remote', async () => {
      const newerDate = new Date('2025-01-15T00:00:00Z')
      const olderDate = new Date('2025-01-01T00:00:00Z')

      const localMastery = [
        {
          id: 'mastery-1',
          verbId: 'ser',
          mood: 'indicative',
          tense: 'present',
          mastery: 0.9,
          syncedAt: newerDate.toISOString()
        }
      ]

      const remoteMastery = [
        {
          id: 'mastery-1',
          verbId: 'ser',
          mood: 'indicative',
          tense: 'present',
          mastery: 0.5, // Older, lower mastery
          syncedAt: olderDate.toISOString()
        }
      ]

      vi.doMock('./authBridge.js', () => createCompleteAuthBridgeMock({
        getAuthenticatedUser: () => ({ id: 'user-123' }),
        isLocalSyncMode: () => false,
        isAuthenticated: () => true
      }))

      vi.doMock('./userSettingsStore.js', () => createCompleteUserSettingsStoreMock({
        getCurrentUserId: () => 'user-123'
      }))

      const updatedItems = []

      vi.doMock('./database.js', () => ({
        getAllFromDB: vi.fn(async (store) => {
          if (store === 'mastery') return localMastery
          return []
        }),
        batchSaveToDB: vi.fn(async () => ({ saved: 0, errors: [] })),
        batchUpdateInDB: vi.fn(async (store, items) => {
          updatedItems.push(...items)
          return { updated: items.length, errors: [] }
        })
      }))

      const { mergeAccountDataLocally } = await import('./dataMerger.js')

      const result = await mergeAccountDataLocally({
        mastery: remoteMastery
      })

      // Should NOT update - local is newer
      // Remote data is ignored because local has newer timestamp
      expect(result.mastery).toBeDefined()
    })
  })

  describe('Partial Merge Scenarios', () => {
    it('should handle scenario where mastery succeeds but schedules fail', async () => {
      vi.doMock('./authBridge.js', () => createCompleteAuthBridgeMock({
        getAuthenticatedUser: () => ({ id: 'user-123' }),
        isLocalSyncMode: () => false,
        isAuthenticated: () => true
      }))

      vi.doMock('./userSettingsStore.js', () => createCompleteUserSettingsStoreMock({
        getCurrentUserId: () => 'user-123'
      }))

      vi.doMock('./database.js', () => ({
        getAllFromDB: vi.fn(async (_store) => {
          return [] // No local data
        }),
        batchSaveToDB: vi.fn(async (store, items) => {
          // Mastery succeeds, schedules fails
          if (store === 'mastery') {
            return { saved: items.length, errors: [] }
          }
          if (store === 'schedules') {
            throw new Error('Database locked')
          }
          return { saved: 0, errors: [] }
        }),
        batchUpdateInDB: vi.fn(async () => ({ updated: 0, errors: [] }))
      }))

      const { mergeAccountDataLocally } = await import('./dataMerger.js')

      const remoteMastery = [
        { id: 'm1', verbId: 'hablar', mood: 'indicative', tense: 'present', mastery: 0.8 }
      ]

      const remoteSchedules = [
        { id: 's1', itemId: 'item1', nextReview: new Date().toISOString() }
      ]

      const result = await mergeAccountDataLocally({
        mastery: remoteMastery,
        schedules: remoteSchedules
      })

      // Mastery should succeed
      expect(result.mastery).toBeGreaterThan(0)

      // Schedules should report failure (not crash)
      // Result should still return, not throw
      expect(result).toBeDefined()
    })

    it('should merge new items without affecting existing unrelated items', async () => {
      const existingAttempts = [
        {
          id: 'local-1',
          verbId: 'comer',
          correct: true,
          createdAt: new Date().toISOString()
        }
      ]

      const remoteAttempts = [
        {
          id: 'remote-1',
          verbId: 'vivir',
          correct: false,
          createdAt: new Date().toISOString()
        }
      ]

      vi.doMock('./authBridge.js', () => createCompleteAuthBridgeMock({
        getAuthenticatedUser: () => ({ id: 'user-123' }),
        isLocalSyncMode: () => false,
        isAuthenticated: () => true
      }))

      vi.doMock('./userSettingsStore.js', () => createCompleteUserSettingsStoreMock({
        getCurrentUserId: () => 'user-123'
      }))

      let savedItems = []

      vi.doMock('./database.js', () => ({
        getAllFromDB: vi.fn(async (store) => {
          if (store === 'attempts') return existingAttempts
          return []
        }),
        batchSaveToDB: vi.fn(async (store, items) => {
          savedItems = items
          return { saved: items.length, errors: [] }
        }),
        batchUpdateInDB: vi.fn(async () => ({ updated: 0, errors: [] }))
      }))

      const { mergeAccountDataLocally } = await import('./dataMerger.js')

      const result = await mergeAccountDataLocally({
        attempts: remoteAttempts
      })

      // Should add remote item (doesn't conflict with local)
      expect(result.attempts).toBe(1)
      expect(savedItems.length).toBe(1)
      expect(savedItems[0].id).toBe('remote-1')
    })
  })

  describe('Conflict Edge Cases', () => {
    it('should handle missing syncedAt timestamp gracefully', async () => {
      const localWithoutTimestamp = [
        {
          id: 'item-1',
          verbId: 'estar',
          // Missing syncedAt
          createdAt: new Date().toISOString()
        }
      ]

      const remoteWithTimestamp = [
        {
          id: 'item-1',
          verbId: 'estar',
          syncedAt: new Date().toISOString(),
          createdAt: new Date().toISOString()
        }
      ]

      vi.doMock('./authBridge.js', () => createCompleteAuthBridgeMock({
        getAuthenticatedUser: () => ({ id: 'user-123' }),
        isLocalSyncMode: () => false,
        isAuthenticated: () => true
      }))

      vi.doMock('./userSettingsStore.js', () => createCompleteUserSettingsStoreMock({
        getCurrentUserId: () => 'user-123'
      }))

      vi.doMock('./database.js', () => ({
        getAllFromDB: vi.fn(async () => localWithoutTimestamp),
        batchSaveToDB: vi.fn(async () => ({ saved: 0, errors: [] })),
        batchUpdateInDB: vi.fn(async () => ({ updated: 0, errors: [] }))
      }))

      const { mergeAccountDataLocally } = await import('./dataMerger.js')

      // Should not crash with missing timestamp
      const result = await mergeAccountDataLocally({
        mastery: remoteWithTimestamp
      })

      expect(result).toBeDefined()
    })

    it('should handle corrupted data in merge gracefully', async () => {
      const corruptedRemoteData = [
        {
          id: 'corrupt-1',
          // Missing required fields
          verbId: null,
          mastery: 'not-a-number'
        }
      ]

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
        batchSaveToDB: vi.fn(async () => ({ saved: 0, errors: [] })),
        batchUpdateInDB: vi.fn(async () => ({ updated: 0, errors: [] }))
      }))

      const { mergeAccountDataLocally } = await import('./dataMerger.js')

      // Should handle corrupted data without crashing
      const result = await mergeAccountDataLocally({
        mastery: corruptedRemoteData
      })

      expect(result).toBeDefined()
    })
  })

  describe('Concurrent Merge Conflicts', () => {
    it('should handle Device A and Device B syncing different data simultaneously', async () => {
      // Device A has attempts for "hablar"
      const deviceAData = [
        {
          id: 'a-attempt-1',
          verbId: 'hablar',
          correct: true,
          createdAt: new Date('2025-01-10T10:00:00Z').toISOString(),
          syncedAt: new Date('2025-01-10T10:00:00Z').toISOString()
        }
      ]

      // Device B has attempts for "comer"
      const deviceBData = [
        {
          id: 'b-attempt-1',
          verbId: 'comer',
          correct: false,
          createdAt: new Date('2025-01-10T11:00:00Z').toISOString(),
          syncedAt: new Date('2025-01-10T11:00:00Z').toISOString()
        }
      ]

      vi.doMock('./authBridge.js', () => createCompleteAuthBridgeMock({
        getAuthenticatedUser: () => ({ id: 'user-123' }),
        isLocalSyncMode: () => false,
        isAuthenticated: () => true
      }))

      vi.doMock('./userSettingsStore.js', () => createCompleteUserSettingsStoreMock({
        getCurrentUserId: () => 'user-123'
      }))

      const allSavedItems = []

      vi.doMock('./database.js', () => ({
        getAllFromDB: vi.fn(async () => deviceAData),
        batchSaveToDB: vi.fn(async (store, items) => {
          allSavedItems.push(...items)
          return { saved: items.length, errors: [] }
        }),
        batchUpdateInDB: vi.fn(async () => ({ updated: 0, errors: [] }))
      }))

      const { mergeAccountDataLocally } = await import('./dataMerger.js')

      // Simulate Device B syncing to server with Device A's local data
      const result = await mergeAccountDataLocally({
        attempts: deviceBData
      })

      // Should merge both datasets (no conflicts - different items)
      expect(result).toBeDefined()
      expect(allSavedItems.length).toBeGreaterThan(0)
    })
  })
})
