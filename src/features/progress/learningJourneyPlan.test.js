import { describe, expect, it } from 'vitest'
import { buildLearningJourney } from './learningJourneyPlan.js'

describe('learningJourneyPlan', () => {
  it('computes checkpoints and next milestone', () => {
    const result = buildLearningJourney({
      userStats: { totalAttempts: 10, streakDays: 2, totalMastery: 30 }
    })

    expect(result.checkpoints).toHaveLength(3)
    expect(result.nextCheckpoint.id).toBe('foundation')
    expect(result.adaptiveMessage).toContain('enfocada en errores')
  })

  it('returns plan-oriented message when study plan has sessions', () => {
    const result = buildLearningJourney({
      userStats: { totalAttempts: 40, streakDays: 6, totalMastery: 80 },
      studyPlan: { sessionBlueprints: { sessions: [{ id: 's1' }] } }
    })

    expect(result.adaptiveMessage).toContain('plan personalizado')
    expect(result.checkpoints.every((item) => item.completed)).toBe(true)
  })
})
