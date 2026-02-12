import { describe, it, expect } from 'vitest'
import { getMsUntilNextMinute, normalizeReminderDays } from './practiceReminderScheduler.js'

describe('practiceReminderScheduler', () => {
  it('normalizes invalid reminder days to full week', () => {
    expect(normalizeReminderDays(null)).toEqual([0, 1, 2, 3, 4, 5, 6])
    expect(normalizeReminderDays([])).toEqual([0, 1, 2, 3, 4, 5, 6])
  })

  it('filters out invalid day values', () => {
    expect(normalizeReminderDays([0, 1, 7, -1, '2', 'x'])).toEqual([0, 1, 2])
  })

  it('computes delay until next minute boundary', () => {
    expect(getMsUntilNextMinute(120000)).toBe(60000)
    expect(getMsUntilNextMinute(120001)).toBe(59999)
    expect(getMsUntilNextMinute(179999)).toBe(1)
  })
})
