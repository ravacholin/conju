import { describe, expect, it, vi } from 'vitest'
import { createEventDebouncer } from './eventDebouncer.js'

describe('eventDebouncer', () => {
  it('coalesces rapid triggers into one callback with latest payload', () => {
    vi.useFakeTimers()
    const onDebounced = vi.fn()
    const debouncer = createEventDebouncer({ delayMs: 200, onDebounced })

    debouncer.trigger({ id: 1 })
    debouncer.trigger({ id: 2 })
    debouncer.trigger({ id: 3 })

    vi.advanceTimersByTime(210)

    expect(onDebounced).toHaveBeenCalledTimes(1)
    expect(onDebounced).toHaveBeenCalledWith({ id: 3 })
    vi.useRealTimers()
  })

  it('cancels pending callback', () => {
    vi.useFakeTimers()
    const onDebounced = vi.fn()
    const debouncer = createEventDebouncer({ delayMs: 200, onDebounced })

    debouncer.trigger({ id: 1 })
    debouncer.cancel()
    vi.advanceTimersByTime(210)

    expect(onDebounced).not.toHaveBeenCalled()
    vi.useRealTimers()
  })
})
