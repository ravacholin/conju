import { describe, it, expect, beforeEach, vi } from 'vitest'

const loggerStub = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }

describe('dataMerger', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()

    vi.doMock('./safeLogger.js', () => ({
      createSafeLogger: () => loggerStub
    }))

    vi.doMock('./config.js', () => ({
      STORAGE_CONFIG: {
        STORES: {
          ATTEMPTS: 'attempts',
          MASTERY: 'mastery',
          SCHEDULES: 'schedules',
          LEARNING_SESSIONS: 'sessions'
        }
      }
    }))
  })

  it('prefers authenticated user id when resolving merge user', async () => {
    vi.doMock('./authBridge.js', () => ({
      getAuthenticatedUser: () => ({ id: 'auth-user' })
    }))
    vi.doMock('./userSettingsStore.js', () => ({
      getCurrentUserId: () => 'local-user'
    }))

    const { resolveMergeUserId } = await import('./dataMerger.js')
    const result = resolveMergeUserId({})
    expect(result).toMatchObject({ userId: 'auth-user', source: 'auth' })
  })

  it('merges remote attempts into local storage when missing', async () => {
    const savedAttempts = []

    vi.doMock('./authBridge.js', () => ({
      getAuthenticatedUser: () => null
    }))
    vi.doMock('./userSettingsStore.js', () => ({
      getCurrentUserId: () => 'local-user-123'
    }))
    vi.doMock('./database.js', () => ({
      getAllFromDB: vi.fn(async (store) => {
        if (store === 'attempts') return []
        return []
      }),
      batchSaveToDB: vi.fn(async () => ({ saved: savedAttempts.push('saved') && savedAttempts.length, errors: [] })),
      batchUpdateInDB: vi.fn(async () => ({ updated: 0, errors: [] }))
    }))

    const { mergeAccountDataLocally } = await import('./dataMerger.js')

    const result = await mergeAccountDataLocally({
      attempts: [
        {
          id: 'remote-attempt',
          verbId: 'hablar',
          mood: 'indicative',
          tense: 'present',
          person: '1s',
          createdAt: new Date().toISOString()
        }
      ]
    })

    expect(result).toMatchObject({
      attempts: 1,
      userId: 'local-user-123'
    })
    expect(savedAttempts.length).toBe(1)
  })

  it('aborts merge when no reliable user id is found', async () => {
    const dispatched = vi.fn()
    const originalDispatch = window.dispatchEvent
    window.dispatchEvent = dispatched

    vi.doMock('./authBridge.js', () => ({
      getAuthenticatedUser: () => null
    }))
    vi.doMock('./userSettingsStore.js', () => ({
      getCurrentUserId: () => 'user-temp-123'
    }))
    vi.doMock('./database.js', () => ({
      getAllFromDB: vi.fn(async () => []),
      batchSaveToDB: vi.fn(async () => ({ saved: 0, errors: [] })),
      batchUpdateInDB: vi.fn(async () => ({ updated: 0, errors: [] }))
    }))

    const { mergeAccountDataLocally } = await import('./dataMerger.js')

    try {
      const result = await mergeAccountDataLocally({ attempts: [] })

      expect(result).toMatchObject({ aborted: true, reason: 'missing_user_id' })
      expect(dispatched).toHaveBeenCalled()
    } finally {
      window.dispatchEvent = originalDispatch
    }
  })
})

