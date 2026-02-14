import { describe, expect, it } from 'vitest'
import { buildLearningJourney } from './learningJourneyPlan.js'

describe('learningJourneyPlan', () => {
  it('computes checkpoints and next milestone', () => {
    const result = buildLearningJourney({
      userStats: { totalAttempts: 10, streakDays: 2, totalMastery: 30, accuracy: 40, masteredCells: 1 }
    })

    // Shows up to 3 visible checkpoints
    expect(result.checkpoints.length).toBeLessThanOrEqual(3)
    expect(result.checkpoints.length).toBeGreaterThanOrEqual(1)
    // first-steps (10/10 = 100%) should be completed
    expect(result.checkpoints[0].completed).toBe(true)
    expect(result.nextCheckpoint).toBeDefined()
    expect(result.adaptiveMessage).toContain('errores frecuentes')
  })

  it('returns plan-oriented message when study plan has sessions', () => {
    const result = buildLearningJourney({
      userStats: { totalAttempts: 100, streakDays: 6, totalMastery: 85, accuracy: 80, masteredCells: 10 },
      studyPlan: { sessionBlueprints: { sessions: [{ id: 's1' }] } }
    })

    expect(result.adaptiveMessage).toContain('plan personalizado')
    // With these stats, all 6 checkpoints should be completed
    expect(result.totalCompleted).toBe(6)
  })
})
