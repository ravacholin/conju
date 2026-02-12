import { describe, expect, it, vi } from 'vitest'
import { createProgressUpdateBatcher } from './progressUpdateBatcher.js'

describe('progressUpdateBatcher', () => {
  it('coalesces multiple key updates into a single flush', () => {
    const onFlush = vi.fn()
    let scheduled = null
    const schedule = (cb) => {
      scheduled = cb
      return 1
    }

    const batcher = createProgressUpdateBatcher({ onFlush, schedule, clear: vi.fn() })

    batcher.addUpdate(['heatMap'])
    batcher.addUpdate(['userStats', 'heatMap'])

    scheduled()

    expect(onFlush).toHaveBeenCalledTimes(1)
    expect(onFlush.mock.calls[0][0].fullRefresh).toBe(false)
    expect(onFlush.mock.calls[0][0].keys.sort()).toEqual(['heatMap', 'userStats'])
  })

  it('elevates to full refresh when an empty update arrives', () => {
    const onFlush = vi.fn()
    let scheduled = null
    const schedule = (cb) => {
      scheduled = cb
      return 1
    }

    const batcher = createProgressUpdateBatcher({ onFlush, schedule, clear: vi.fn() })

    batcher.addUpdate(['heatMap'])
    batcher.addUpdate([])

    scheduled()

    expect(onFlush).toHaveBeenCalledTimes(1)
    expect(onFlush.mock.calls[0][0]).toEqual({ fullRefresh: true, keys: ['heatMap'] })
  })

  it('stops scheduling after dispose', () => {
    const onFlush = vi.fn()
    const schedule = vi.fn(() => 1)
    const clear = vi.fn()

    const batcher = createProgressUpdateBatcher({ onFlush, schedule, clear })
    batcher.dispose()
    batcher.addUpdate(['heatMap'])

    expect(schedule).not.toHaveBeenCalled()
    expect(onFlush).not.toHaveBeenCalled()
  })
})
