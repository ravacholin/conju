import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('./database.js', () => ({
  getMasteryByUser: vi.fn(),
  getAttemptsByUser: vi.fn(),
  getAllFromDB: vi.fn()
}))

import { getPronunciationStats } from './analytics.js'
import { getAttemptsByUser } from './database.js'

describe('getPronunciationStats', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns empty stats when there are no attempts', async () => {
    getAttemptsByUser.mockResolvedValue([])

    const stats = await getPronunciationStats('user-1')

    expect(stats).toEqual({
      totalAttempts: 0,
      successRate: 0,
      averageAccuracy: 0,
      averagePedagogicalScore: 0,
      averageConfidence: 0,
      recentAttempts: []
    })
  })

  it('aggregates metrics from pronunciation attempts', async () => {
    const now = Date.now()
    getAttemptsByUser.mockResolvedValue([
      {
        id: 'a1',
        correct: true,
        practiceType: 'pronunciation',
        pronunciation: {
          accuracy: 92,
          confidence: 88,
          timingMs: 1800,
          recognized: 'hablo',
          target: 'hablo'
        },
        createdAt: new Date(now).toISOString()
      },
      {
        id: 'a2',
        correct: false,
        practiceType: 'pronunciation',
        pronunciation: {
          accuracy: 65,
          confidence: 55,
          timingMs: 2400,
          recognized: 'hablas',
          target: 'hablo'
        },
        createdAt: new Date(now + 1000).toISOString()
      }
    ])

    const stats = await getPronunciationStats('user-1')

    expect(stats.totalAttempts).toBe(2)
    expect(stats.successRate).toBe(50)
    expect(stats.averageAccuracy).toBe(78.5)
    expect(stats.averageConfidence).toBe(71.5)
    expect(stats.recentAttempts).toHaveLength(2)
    expect(stats.recentAttempts[0].recognized).toBe('hablas')
  })
})
