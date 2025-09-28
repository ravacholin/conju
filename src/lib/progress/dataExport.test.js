import { describe, expect, it } from 'vitest'

import { calculatePracticeFrequency } from './dataExport.js'

describe('calculatePracticeFrequency', () => {
  it('counts practice days using createdAt when available and ignores invalid dates', () => {
    const attempts = [
      {
        createdAt: '2024-06-01T08:00:00.000Z',
        timestamp: '2024-05-29T12:00:00.000Z'
      },
      {
        createdAt: '2024-06-01T18:00:00.000Z',
        timestamp: '2024-05-29T14:00:00.000Z'
      },
      {
        timestamp: '2024-06-02T10:00:00.000Z'
      },
      {
        createdAt: 'not-a-real-date',
        timestamp: '2024-06-03T09:00:00.000Z'
      }
    ]
    const originalAttempts = attempts.map(attempt => ({ ...attempt }))

    const result = calculatePracticeFrequency(attempts)

    expect(result.totalDays).toBe(2)
    expect(result.averageAttemptsPerDay).toBe('1.5')
    expect(attempts).toEqual(originalAttempts)
  })
})
