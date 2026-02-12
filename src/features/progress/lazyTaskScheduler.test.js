import { describe, expect, it, vi } from 'vitest'
import { createLazyTaskScheduler } from './lazyTaskScheduler.js'

describe('lazyTaskScheduler', () => {
  it('runs task only once even if idle and fallback fire', () => {
    const task = vi.fn()
    let idleCb = null
    let timeoutCb = null

    const scheduler = createLazyTaskScheduler({
      scheduleIdle: (cb) => {
        idleCb = cb
        return 'idle-1'
      },
      cancelIdle: vi.fn(),
      scheduleTimeout: (cb) => {
        timeoutCb = cb
        return 'timeout-1'
      },
      clearScheduledTimeout: vi.fn()
    })

    scheduler.schedule(task)

    idleCb()
    timeoutCb()

    expect(task).toHaveBeenCalledTimes(1)
  })

  it('cancels pending scheduled callbacks', () => {
    const task = vi.fn()
    const cancelIdle = vi.fn()
    const clearScheduledTimeout = vi.fn()

    const scheduler = createLazyTaskScheduler({
      scheduleIdle: () => 'idle-1',
      cancelIdle,
      scheduleTimeout: () => 'timeout-1',
      clearScheduledTimeout
    })

    scheduler.schedule(task)
    scheduler.cancel()

    expect(cancelIdle).toHaveBeenCalledWith('idle-1')
    expect(clearScheduledTimeout).toHaveBeenCalledWith('timeout-1')
    expect(task).not.toHaveBeenCalled()
  })
})
