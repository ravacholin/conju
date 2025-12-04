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

  it('applies server settings on fresh device (no local DB record)', async () => {
    const applied = { called: false, state: null }
    const saved = { called: false, record: null, opts: null }

    vi.doMock('./authBridge.js', () => ({
      getAuthenticatedUser: () => ({ id: 'auth-user-xyz' })
    }))
    vi.doMock('./userSettingsStore.js', () => ({
      getCurrentUserId: () => 'auth-user-xyz'
    }))
    // Mock DB helpers: no local settings in IndexedDB, and capture saveUserSettings
    vi.doMock('./database.js', () => ({
      getAllFromDB: vi.fn(async () => []),
      batchSaveToDB: vi.fn(async () => ({ saved: 0, errors: [] })),
      batchUpdateInDB: vi.fn(async () => ({ updated: 0, errors: [] })),
      getUserSettings: vi.fn(async () => null),
      saveUserSettings: vi.fn(async (_userId, settings, opts) => {
        saved.called = true
        saved.record = settings
        saved.opts = opts
        return { id: 'settings-auth-user-xyz', userId: 'auth-user-xyz', settings, updatedAt: Date.now(), synced: true, syncedAt: Date.now() }
      })
    }))
    // Mock settings store: local has recent defaults, ensure setState gets called with server values
    vi.doMock('../../state/settings.js', () => ({
      useSettings: {
        getState: () => ({ userLevel: 'A1', level: 'A1', lastUpdated: Date.now() }),
        setState: (next) => { applied.called = true; applied.state = next }
      }
    }))

    const { mergeAccountDataLocally } = await import('./dataMerger.js')

    // Server returns C1 settings with older lastUpdated than the local default's timestamp
    const serverSettings = {
      settings: { userLevel: 'C1', level: 'C1', lastUpdated: Date.now() - 1000 }
    }

    const result = await mergeAccountDataLocally({ settings: serverSettings })

    expect(result).toMatchObject({ userId: 'auth-user-xyz' })
    // Should apply server settings despite local having a very recent lastUpdated,
    // because there is no local IndexedDB record (fresh device)
    expect(applied.called).toBe(true)
    expect(applied.state.userLevel).toBe('C1')
    expect(saved.called).toBe(true)
    expect(saved.opts).toMatchObject({ alreadySynced: true })
  })
})
