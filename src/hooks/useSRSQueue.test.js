import { describe, expect, it, vi, beforeEach } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useSRSQueue } from './useSRSQueue.js'

const { getDueSchedulesMock, getMasterySnapshotForUserMock, getCurrentUserIdMock } = vi.hoisted(() => ({
  getDueSchedulesMock: vi.fn(),
  getMasterySnapshotForUserMock: vi.fn(),
  getCurrentUserIdMock: vi.fn()
}))

vi.mock('../lib/progress/database.js', () => ({
  getDueSchedules: (...args) => getDueSchedulesMock(...args)
}))

vi.mock('../lib/progress/mastery.js', () => ({
  getMasterySnapshotForUser: (...args) => getMasterySnapshotForUserMock(...args)
}))

vi.mock('../lib/progress/userManager/index.js', () => ({
  getCurrentUserId: (...args) => getCurrentUserIdMock(...args)
}))

vi.mock('../lib/utils/verbLabels.js', () => ({
  formatMoodTense: (mood, tense) => `${mood}-${tense}`
}))

describe('useSRSQueue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getCurrentUserIdMock.mockReturnValue('user-123')
    getMasterySnapshotForUserMock.mockResolvedValue([
      { mood: 'indicative', tense: 'pres', person: '1s', score: 30 },
      { mood: 'subjunctive', tense: 'subjPres', person: '1s', score: 30 }
    ])
  })

  it('builds deterministic order and item keys for tie cases', async () => {
    getDueSchedulesMock.mockResolvedValue([
      {
        mood: 'subjunctive',
        tense: 'subjPres',
        person: '1s',
        nextDue: '2026-01-01T17:00:00.000Z'
      },
      {
        mood: 'indicative',
        tense: 'pres',
        person: '1s',
        nextDue: '2026-01-01T17:00:00.000Z'
      }
    ])

    const { result } = renderHook(() => useSRSQueue())

    await waitFor(() => {
      expect(result.current.queue).toHaveLength(2)
    })

    expect(result.current.queue[0].itemKey).toContain('indicative|pres|1s')
    expect(result.current.queue[1].itemKey).toContain('subjunctive|subjPres|1s')
  })

  it('ignores stale responses when a newer reload finishes first', async () => {
    let resolveFirst
    const firstRequest = new Promise((resolve) => {
      resolveFirst = resolve
    })

    getDueSchedulesMock
      .mockReturnValueOnce(firstRequest)
      .mockResolvedValueOnce([
        {
          mood: 'indicative',
          tense: 'pres',
          person: '1s',
          nextDue: '2026-01-02T10:00:00.000Z'
        }
      ])

    const { result } = renderHook(() => useSRSQueue())

    await act(async () => {
      await result.current.reload()
    })

    await waitFor(() => {
      expect(result.current.queue).toHaveLength(1)
      expect(result.current.queue[0].tense).toBe('pres')
    })

    await act(async () => {
      resolveFirst([
        {
          mood: 'subjunctive',
          tense: 'subjPres',
          person: '1s',
          nextDue: '2026-01-02T12:00:00.000Z'
        }
      ])
      await Promise.resolve()
    })

    expect(result.current.queue).toHaveLength(1)
    expect(result.current.queue[0].tense).toBe('pres')
  })
})
