import { afterEach, describe, expect, it, vi } from 'vitest'
import { applyFamilyClusteringBoost } from './srsFamilyClustering.js'

vi.mock('./database.js', () => ({
  getScheduleByCell: vi.fn(),
  saveSchedule: vi.fn()
}))

const { getScheduleByCell } = await import('./database.js')

const cell = { mood: 'indicative', tense: 'pres', person: 'yo' }

describe('srsFamilyClustering', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('promotes intervals when cluster performance is strong', async () => {
    getScheduleByCell.mockResolvedValue({
      interval: 15,
      ease: 2.9,
      reps: 8,
      lapses: 0,
      leech: false,
      lastAnswerCorrect: true
    })

    const result = await applyFamilyClusteringBoost('user-1', 'pensar', cell, {
      interval: 5,
      ease: 2.5
    })

    expect(result.interval).toBeGreaterThan(5)
    expect(result.clusterPromotionApplied).toBe(true)
    expect(result.clusterContext).toBeDefined()
  })

  it('applies a conservative interval when the cluster is weak', async () => {
    getScheduleByCell.mockResolvedValue({
      interval: 1,
      ease: 1.4,
      reps: 1,
      lapses: 4,
      leech: false,
      lastAnswerCorrect: false
    })

    const result = await applyFamilyClusteringBoost('user-2', 'tocar', cell, {
      interval: 10,
      ease: 2.3
    })

    expect(result.interval).toBeLessThan(10)
    expect(result.clusterPromotionApplied ?? false).toBe(false)
  })
})
