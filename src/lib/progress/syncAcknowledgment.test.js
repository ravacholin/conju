import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createCompleteConfigMock, createCompleteAuthBridgeMock, createCompleteUserSettingsStoreMock } from './test-helpers.js'

/**
 * Tests para el "acuse de recibo honesto" del servidor.
 *
 * Antes, el cliente marcaba los registros como sincronizados apenas el servidor respondía 2xx,
 * incluso si el servidor había descartado algunos. Esos registros nunca se reintentaban y
 * desaparecían para el resto de los dispositivos. Ahora sólo se marcan como sincronizados los
 * registros que el servidor confirmó haber persistido.
 */

const loggerStub = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }

describe('serverAcknowledgedAll', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()

    vi.doMock('./safeLogger.js', () => ({ createSafeLogger: () => loggerStub }))
    vi.doMock('./config.js', () => createCompleteConfigMock())
    vi.doMock('../config/syncConfig.js', () => ({
      getSyncConfigDebug: () => ({ apiBase: 'https://api.test.com', authHeaderName: 'Authorization', isDev: true, isProd: false }),
      getSyncApiBase: () => 'https://api.test.com/api'
    }))
    vi.doMock('../cache/ProgressDataCache.js', () => ({ progressDataCache: { invalidateUser: vi.fn() } }))
    vi.doMock('./authBridge.js', () => createCompleteAuthBridgeMock({}))
    vi.doMock('./userSettingsStore.js', () => createCompleteUserSettingsStoreMock({}))
    vi.doMock('./SyncService.js', () => ({
      default: {
        tryBulk: vi.fn(),
        isBrowserOnline: () => true,
        enqueue: vi.fn(),
        getSyncSuccessMessage: vi.fn(),
        postJSON: vi.fn(),
        wakeUpServer: vi.fn(),
        flushSyncQueue: vi.fn()
      }
    }))
  })

  it('trusts a legacy 2xx response without numeric counts', async () => {
    const { __testing } = await import('./syncCoordinator.js')
    expect(__testing.serverAcknowledgedAll({ success: true }, 3)).toBe(true)
  })

  it('accepts when uploaded + updated cover every sent record', async () => {
    const { __testing } = await import('./syncCoordinator.js')
    expect(__testing.serverAcknowledgedAll({ success: true, uploaded: 2, updated: 1 }, 3)).toBe(true)
    expect(__testing.serverAcknowledgedAll({ success: true, uploaded: 3, updated: 0 }, 3)).toBe(true)
  })

  it('rejects when the server acknowledged fewer records than we sent', async () => {
    const { __testing } = await import('./syncCoordinator.js')
    // Server skipped one record (skipped: 1) -> not safe to mark all synced.
    expect(__testing.serverAcknowledgedAll({ success: true, uploaded: 2, updated: 0, skipped: 1 }, 3)).toBe(false)
  })

  it('rejects an explicit failure or a missing result', async () => {
    const { __testing } = await import('./syncCoordinator.js')
    expect(__testing.serverAcknowledgedAll({ success: false }, 1)).toBe(false)
    expect(__testing.serverAcknowledgedAll(null, 1)).toBe(false)
  })
})

describe('uploadAndMarkSynced', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()

    vi.doMock('./safeLogger.js', () => ({ createSafeLogger: () => loggerStub }))
    vi.doMock('./config.js', () => createCompleteConfigMock())
    vi.doMock('../config/syncConfig.js', () => ({
      getSyncConfigDebug: () => ({ apiBase: 'https://api.test.com', authHeaderName: 'Authorization', isDev: true, isProd: false }),
      getSyncApiBase: () => 'https://api.test.com/api'
    }))
    vi.doMock('../cache/ProgressDataCache.js', () => ({ progressDataCache: { invalidateUser: vi.fn() } }))
    vi.doMock('./authBridge.js', () => createCompleteAuthBridgeMock({}))
    vi.doMock('./userSettingsStore.js', () => createCompleteUserSettingsStoreMock({}))
  })

  it('does NOT mark records synced when the server under-acknowledges', async () => {
    const putCalls = []
    vi.doMock('./database.js', () => ({
      initDB: vi.fn(async () => ({
        transaction: () => ({
          objectStore: () => ({
            get: vi.fn(async (id) => ({ id, userId: 'user-123' })),
            put: vi.fn(async (record) => { putCalls.push(record) })
          }),
          done: Promise.resolve()
        })
      }))
    }))

    vi.doMock('./SyncService.js', () => ({
      default: {
        // Server received 2 records but only persisted 1.
        tryBulk: vi.fn(async () => ({ success: true, uploaded: 1, updated: 0, skipped: 1 })),
        isBrowserOnline: () => true,
        enqueue: vi.fn(),
        getSyncSuccessMessage: vi.fn(),
        postJSON: vi.fn(),
        wakeUpServer: vi.fn(),
        flushSyncQueue: vi.fn()
      }
    }))

    const { __testing } = await import('./syncCoordinator.js')
    const outcome = await __testing.uploadAndMarkSynced('attempts', 'attempts', [
      { id: 'a1', userId: 'user-123' },
      { id: 'a2', userId: 'user-123' }
    ])

    expect(outcome.ok).toBe(false)
    expect(outcome.uploaded).toBe(0)
    // Nothing was marked synced, so both records stay pending and get retried next cycle.
    expect(putCalls.length).toBe(0)
  })

  it('marks records synced when the server acknowledges all of them', async () => {
    const putCalls = []
    vi.doMock('./database.js', () => ({
      initDB: vi.fn(async () => ({
        transaction: () => ({
          objectStore: () => ({
            get: vi.fn(async (id) => ({ id, userId: 'user-123' })),
            put: vi.fn(async (record) => { putCalls.push(record) })
          }),
          done: Promise.resolve()
        })
      }))
    }))

    vi.doMock('./SyncService.js', () => ({
      default: {
        tryBulk: vi.fn(async () => ({ success: true, uploaded: 2, updated: 0, skipped: 0, skippedIds: [] })),
        isBrowserOnline: () => true,
        enqueue: vi.fn(),
        getSyncSuccessMessage: vi.fn(),
        postJSON: vi.fn(),
        wakeUpServer: vi.fn(),
        flushSyncQueue: vi.fn()
      }
    }))

    const { __testing } = await import('./syncCoordinator.js')
    const outcome = await __testing.uploadAndMarkSynced('attempts', 'attempts', [
      { id: 'a1', userId: 'user-123' },
      { id: 'a2', userId: 'user-123' }
    ])

    expect(outcome.ok).toBe(true)
    expect(outcome.uploaded).toBe(2)
    expect(putCalls.length).toBe(2)
  })

  it('keeps server-skipped ids pending while marking the rest synced', async () => {
    const putCalls = []
    vi.doMock('./database.js', () => ({
      initDB: vi.fn(async () => ({
        transaction: () => ({
          objectStore: () => ({
            get: vi.fn(async (id) => ({ id, userId: 'user-123' })),
            put: vi.fn(async (record) => { putCalls.push(record) })
          }),
          done: Promise.resolve()
        })
      }))
    }))

    vi.doMock('./SyncService.js', () => ({
      default: {
        // All records counted (uploaded + updated === sent) but one id explicitly reported skipped.
        tryBulk: vi.fn(async () => ({ success: true, uploaded: 2, updated: 0, skipped: 0, skippedIds: ['a2'] })),
        isBrowserOnline: () => true,
        enqueue: vi.fn(),
        getSyncSuccessMessage: vi.fn(),
        postJSON: vi.fn(),
        wakeUpServer: vi.fn(),
        flushSyncQueue: vi.fn()
      }
    }))

    const { __testing } = await import('./syncCoordinator.js')
    const outcome = await __testing.uploadAndMarkSynced('attempts', 'attempts', [
      { id: 'a1', userId: 'user-123' },
      { id: 'a2', userId: 'user-123' }
    ])

    expect(outcome.ok).toBe(true)
    // Only a1 was persisted to IndexedDB with syncedAt; a2 stays pending.
    expect(putCalls.length).toBe(1)
    expect(putCalls[0].id).toBe('a1')
  })
})
