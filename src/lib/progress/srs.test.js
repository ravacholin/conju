import { describe, it, expect } from 'vitest'
import { calculateNextInterval } from './srs.js'

describe('SRS calculateNextInterval', () => {
  it('promotes on correct without hints', () => {
    const schedule = { interval: 0, ease: 2.5, reps: 0 }
    const next = calculateNextInterval(schedule, true, 0)
    expect(next.reps).toBe(1)
    expect(next.interval).toBeGreaterThanOrEqual(1)
    expect(next.ease).toBeGreaterThan(2.4)
  })

  it('half-steps towards next interval on hint usage', () => {
    const schedule = { interval: 1, ease: 2.5, reps: 1 }
    const next = calculateNextInterval(schedule, true, 1)
    // With default intervals [1,3,7,...], midpoint between 1 and 3 ≈ 2
    expect(next.reps).toBe(1)
    expect(next.interval).toBeGreaterThanOrEqual(2)
    expect(next.interval).toBeLessThanOrEqual(3)
    expect(next.ease).toBeLessThanOrEqual(2.5)
  })

  it('resets to short interval on incorrect', () => {
    const schedule = { interval: 7, ease: 2.5, reps: 3 }
    const next = calculateNextInterval(schedule, false, 0)
    expect(next.interval).toBe(1)
    expect(next.reps).toBeLessThan(3)
    expect(next.ease).toBeLessThanOrEqual(2.5)
  })
})

