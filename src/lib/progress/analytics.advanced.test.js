import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./database.js', () => ({
  getAttemptsByUser: vi.fn(),
  getAllFromDB: vi.fn()
}))

vi.mock('./mastery.js', () => ({
  getMasterySnapshotForUser: vi.fn()
}))

import { getAttemptsByUser } from './database.js'
import { getMasterySnapshotForUser } from './mastery.js'
import { getAdvancedAnalytics } from './analytics.js'

const USER_ID = 'analytics-test-user'

describe('getAdvancedAnalytics', () => {
  beforeEach(() => {
    getAttemptsByUser.mockReset()
    getMasterySnapshotForUser.mockReset()
  })

  it('handles empty datasets gracefully', async () => {
    getAttemptsByUser.mockResolvedValueOnce([])
    getMasterySnapshotForUser.mockResolvedValueOnce([])

    const analytics = await getAdvancedAnalytics(USER_ID)
    expect(analytics.retention.dailyAccuracy).toHaveLength(30)
    expect(analytics.engagement.sessionsPerWeek).toBe(0)
    expect(Array.isArray(analytics.timeOfDay)).toBe(true)
  })

  it('computes retention and engagement metrics from attempts', async () => {
    const now = Date.now()
    getAttemptsByUser.mockResolvedValueOnce([
      { createdAt: new Date(now - 1000).toISOString(), correct: true, sessionId: 's1', latencyMs: 4000 },
      { createdAt: new Date(now - 2000).toISOString(), correct: false, sessionId: 's1', latencyMs: 5000 },
      { createdAt: new Date(now - 3600 * 1000 * 10).toISOString(), correct: true, sessionId: 's2', latencyMs: 4500 }
    ])
    getMasterySnapshotForUser.mockResolvedValueOnce([
      { mood: 'indicativo', tense: 'presente', score: 85 },
      { mood: 'indicativo', tense: 'pretérito', score: 55 }
    ])

    const analytics = await getAdvancedAnalytics(USER_ID)
    expect(analytics.retention.overallAccuracy).toBeGreaterThanOrEqual(0)
    expect(analytics.engagement.sessionsPerWeek).toBeGreaterThan(0)
    expect(analytics.mastery.total).toBe(2)
  })
})
