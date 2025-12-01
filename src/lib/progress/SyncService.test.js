import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const SYNC_QUEUE_KEY = 'progress-sync-queue-v1'

async function loadSyncServiceWithMax(maxQueueSize) {
  vi.resetModules()

  const loggerMock = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }
  vi.doMock('../utils/logger.js', () => ({
    createLogger: () => loggerMock,
    registerDebugTool: vi.fn()
  }))

  vi.doMock('./userManager/index.js', () => ({
    getCurrentUserId: vi.fn(() => 'test-user'),
    default: { getCurrentUserId: vi.fn(() => 'test-user') }
  }))

  const { PROGRESS_CONFIG } = await import('./config.js')
  const originalMaxQueueSize = PROGRESS_CONFIG.SYNC.MAX_QUEUE_SIZE
  PROGRESS_CONFIG.SYNC.MAX_QUEUE_SIZE = maxQueueSize

  const syncService = await import('./SyncService.js')

  return { loggerMock, syncService, restore: () => (PROGRESS_CONFIG.SYNC.MAX_QUEUE_SIZE = originalMaxQueueSize) }
}

describe('SyncService.enqueue', () => {
  let restoreConfig

  beforeEach(() => {
    window.localStorage?.clear?.()
  })

  afterEach(() => {
    restoreConfig?.()
    vi.resetModules()
  })

  it('recorta la cola si supera el límite máximo y persiste solo las más recientes', async () => {
    const { syncService, loggerMock, restore } = await loadSyncServiceWithMax(3)
    restoreConfig = restore

    syncService.enqueue('attempts', { id: 1 })
    syncService.enqueue('attempts', { id: 2 })
    syncService.enqueue('attempts', { id: 3 })
    syncService.enqueue('attempts', { id: 4 })
    syncService.enqueue('attempts', { id: 5 })

    const queue = JSON.parse(window.localStorage.getItem(SYNC_QUEUE_KEY))

    expect(queue).toHaveLength(3)
    expect(queue.map(entry => entry.payload.id)).toEqual([3, 4, 5])
    expect(loggerMock.warn).toHaveBeenCalledTimes(2)
    const discardedTotal = loggerMock.warn.mock.calls.reduce(
      (acc, [, , data]) => acc + (data?.discarded || 0),
      0
    )
    expect(discardedTotal).toBe(2)
    expect(loggerMock.warn).toHaveBeenLastCalledWith(
      'enqueue',
      expect.stringContaining('Descartando 1 operaciones antiguas'),
      expect.objectContaining({ discarded: 1, maxQueueSize: 3 })
    )
  })

  it('consolida operaciones idénticas para evitar duplicados y mantiene el más reciente', async () => {
    const { syncService, restore } = await loadSyncServiceWithMax(5)
    restoreConfig = restore
    vi.useFakeTimers()

    syncService.enqueue('schedules', { id: 'abc', value: 1 })
    const firstQueue = JSON.parse(window.localStorage.getItem(SYNC_QUEUE_KEY))
    const firstEnqueuedAt = firstQueue[0].enqueuedAt

    vi.advanceTimersByTime(1000)
    syncService.enqueue('schedules', { id: 'abc', value: 1 })

    const queue = JSON.parse(window.localStorage.getItem(SYNC_QUEUE_KEY))

    expect(queue).toHaveLength(1)
    expect(queue[0].payload).toEqual({ id: 'abc', value: 1 })
    expect(queue[0].enqueuedAt).toBeGreaterThan(firstEnqueuedAt)

    vi.useRealTimers()
  })
})
