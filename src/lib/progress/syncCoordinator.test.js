import { describe, it, expect, beforeEach, vi } from 'vitest'

const loggerStub = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }

const authBridgeMock = {
  getSyncEndpoint: vi.fn(() => 'https://api.example.com'),
  isSyncEnabled: vi.fn(() => true),
  isLocalSyncMode: vi.fn(() => false),
  setSyncEndpoint: vi.fn(),
  setSyncAuthToken: vi.fn(),
  setSyncAuthHeaderName: vi.fn(),
  getSyncAuthToken: vi.fn(() => 'token'),
  clearSyncAuthToken: vi.fn(),
  getSyncAuthHeaderName: vi.fn(() => 'Authorization'),
  isAuthenticated: vi.fn(() => false),
  getAuthToken: vi.fn(() => null),
  getAuthenticatedUser: vi.fn(() => null),
  getAuthenticatedAccount: vi.fn(() => null),
  clearAuthState: vi.fn()
}

const syncServiceMock = {
  isBrowserOnline: vi.fn(() => true),
  enqueue: vi.fn(),
  getSyncSuccessMessage: vi.fn(() => 'ok'),
  postJSON: vi.fn(async () => ({ data: {} })),
  tryBulk: vi.fn(async () => ({})),
  wakeUpServer: vi.fn(async () => {}),
  flushSyncQueue: vi.fn(async () => {})
}

describe('syncCoordinator', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()

    authBridgeMock.isAuthenticated.mockReturnValue(false)
    authBridgeMock.isSyncEnabled.mockReturnValue(true)

    vi.doMock('./safeLogger.js', () => ({
      createSafeLogger: () => loggerStub
    }))

    vi.doMock('../config/syncConfig.js', () => ({
      getSyncConfigDebug: () => ({ apiBase: 'https://api.example.com', authHeaderName: 'Authorization', isDev: false, isProd: true })
    }))

    vi.doMock('../cache/ProgressDataCache.js', () => ({
      progressDataCache: { invalidateUser: vi.fn() }
    }))

    vi.doMock('./dataMerger.js', () => ({
      mergeAccountDataLocally: vi.fn(async () => ({ userId: 'user-1', merged: {} })),
      __testing: {}
    }))

    vi.doMock('./authBridge.js', () => authBridgeMock)

    vi.doMock('./userSettingsStore.js', () => ({
      getCurrentUserId: vi.fn(() => 'user-123')
    }))

    vi.doMock('./database.js', () => ({
      getAttemptsByUser: vi.fn(async () => []),
      getMasteryByUser: vi.fn(async () => []),
      getFromDB: vi.fn(async () => null),
      getAllFromDB: vi.fn(async () => []),
      initDB: vi.fn(async () => ({
        transaction: () => ({
          objectStore: () => ({ put: vi.fn() }),
          done: Promise.resolve()
        })
      })),
      getLearningSessionsByUser: vi.fn(async () => [])
    }))

    vi.doMock('./SyncService.js', () => ({
      default: syncServiceMock
    }))
  })

  it('returns not_authenticated when user is not logged in', async () => {
    const { syncAccountData } = await import('./syncCoordinator.js')
    authBridgeMock.isAuthenticated.mockReturnValue(false)

    const result = await syncAccountData()
    expect(result).toEqual({ success: false, reason: 'not_authenticated' })
  })

  it('stops syncNow when sync is disabled', async () => {
    const { syncNow } = await import('./syncCoordinator.js')
    authBridgeMock.isSyncEnabled.mockReturnValue(false)

    const result = await syncNow()
    expect(result).toEqual({ success: false, reason: 'sync_disabled' })
    expect(syncServiceMock.wakeUpServer).not.toHaveBeenCalled()
  })
})

