import { describe, expect, it, vi } from 'vitest'
import { createActionCooldown } from './actionCooldown.js'

describe('actionCooldown', () => {
  it('blocks repeated runs during cooldown window', () => {
    vi.useFakeTimers()
    const cooldown = createActionCooldown({ delayMs: 200 })
    const action = vi.fn()

    expect(cooldown.run(action)).toBe(true)
    expect(cooldown.run(action)).toBe(false)
    expect(action).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(210)

    expect(cooldown.run(action)).toBe(true)
    expect(action).toHaveBeenCalledTimes(2)
    vi.useRealTimers()
  })

  it('can be cancelled to release lock immediately', () => {
    vi.useFakeTimers()
    const cooldown = createActionCooldown({ delayMs: 500 })
    const action = vi.fn()

    cooldown.run(action)
    expect(cooldown.isLocked()).toBe(true)

    cooldown.cancel()
    expect(cooldown.isLocked()).toBe(false)
    expect(cooldown.run(action)).toBe(true)
    expect(action).toHaveBeenCalledTimes(2)
    vi.useRealTimers()
  })
})
