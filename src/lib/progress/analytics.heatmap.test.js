import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const getMasteryByUserMock = vi.fn()
const getAttemptsByUserMock = vi.fn()

vi.mock('./database.js', () => ({
  getMasteryByUser: getMasteryByUserMock,
  getAttemptsByUser: getAttemptsByUserMock,
  getAllFromDB: vi.fn()
}))

vi.mock('./realTimeAnalytics.js', () => ({
  getRealUserStats: vi.fn(),
  getRealCompetencyRadarData: vi.fn(),
  getIntelligentRecommendations: vi.fn()
}))

// Ensure config import does not break when unused

const { getHeatMapData } = await import('./analytics.js')

describe('getHeatMapData', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-06-01T12:00:00Z'))
    getMasteryByUserMock.mockReset()
    getAttemptsByUserMock.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns latest attempt timestamp per combination', async () => {
    getMasteryByUserMock.mockResolvedValue([
      {
        userId: 'user-1',
        mood: 'indicative',
        tense: 'pres',
        person: 'yo',
        score: 82
      }
    ])

    const now = Date.now()
    const twoDaysAgo = new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString()
    const fourDaysAgo = new Date(now - 4 * 24 * 60 * 60 * 1000).toISOString()

    getAttemptsByUserMock.mockResolvedValue([
      {
        userId: 'user-1',
        mood: 'indicative',
        tense: 'pres',
        person: 'yo',
        createdAt: fourDaysAgo
      },
      {
        userId: 'user-1',
        mood: 'indicative',
        tense: 'pres',
        person: 'yo',
        createdAt: twoDaysAgo
      }
    ])

    const result = await getHeatMapData('user-1', null, 'last_7_days')
    expect(result).toHaveLength(1)
    expect(result[0].count).toBe(2)
    expect(result[0].lastAttempt).toBe(new Date(twoDaysAgo).getTime())
  })

  it('excludes combinations without recent attempts when filtering by range', async () => {
    getMasteryByUserMock.mockResolvedValue([
      {
        userId: 'user-1',
        mood: 'indicative',
        tense: 'pretIndef',
        person: 'tu',
        score: 70
      }
    ])

    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()

    getAttemptsByUserMock.mockResolvedValue([
      {
        userId: 'user-1',
        mood: 'indicative',
        tense: 'pretIndef',
        person: 'tu',
        createdAt: tenDaysAgo
      }
    ])

    const result = await getHeatMapData('user-1', null, 'last_7_days')
    expect(result).toHaveLength(0)
  })
})
