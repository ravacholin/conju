import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createSettingsPersistenceQueue } from './settingsPersistence.js'

describe('settingsPersistenceQueue', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('debounces rapid updates and persists only the latest snapshot', async () => {
    const saveFn = vi.fn().mockResolvedValue(undefined)
    const queue = createSettingsPersistenceQueue({
      saveFn,
      getUserId: () => 'user-1',
      debounceMs: 1000
    })

    queue.schedule({ lastUpdated: 1, level: 'A1' })
    queue.schedule({ lastUpdated: 2, level: 'B1' })
    queue.schedule({ lastUpdated: 3, level: 'C1' })

    await vi.advanceTimersByTimeAsync(1000)

    expect(saveFn).toHaveBeenCalledTimes(1)
    expect(saveFn).toHaveBeenCalledWith('user-1', expect.objectContaining({ lastUpdated: 3, level: 'C1' }))
  })

  it('flush persists immediately without waiting debounce window', async () => {
    const saveFn = vi.fn().mockResolvedValue(undefined)
    const queue = createSettingsPersistenceQueue({
      saveFn,
      getUserId: () => 'user-1',
      debounceMs: 1000
    })

    queue.schedule({ lastUpdated: 4, level: 'B2' })
    await queue.flush()

    expect(saveFn).toHaveBeenCalledTimes(1)
    expect(saveFn).toHaveBeenCalledWith('user-1', expect.objectContaining({ lastUpdated: 4 }))
  })

  it('serializes in-flight persistence and keeps newest queued state', async () => {
    let resolveFirst
    const firstSave = new Promise((resolve) => { resolveFirst = resolve })
    const saveFn = vi
      .fn()
      .mockImplementationOnce(() => firstSave)
      .mockResolvedValueOnce(undefined)

    const queue = createSettingsPersistenceQueue({
      saveFn,
      getUserId: () => 'user-1',
      debounceMs: 1
    })

    queue.schedule({ lastUpdated: 10, level: 'A2' })
    await vi.advanceTimersByTimeAsync(1)
    queue.schedule({ lastUpdated: 11, level: 'B1' })
    queue.schedule({ lastUpdated: 12, level: 'B2' })
    await vi.advanceTimersByTimeAsync(1)

    resolveFirst()
    await queue.flush()

    expect(saveFn).toHaveBeenCalledTimes(2)
    expect(saveFn.mock.calls[1][1]).toMatchObject({ lastUpdated: 12, level: 'B2' })
  })
})
