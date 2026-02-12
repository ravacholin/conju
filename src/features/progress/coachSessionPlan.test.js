import { describe, expect, it } from 'vitest'
import { buildCoachSessionPlan } from './coachSessionPlan.js'

describe('coachSessionPlan', () => {
  it('builds targeted plan when weak combo exists', () => {
    const result = buildCoachSessionPlan({
      userStats: { totalMastery: 60, streakDays: 4 },
      heatMapData: {
        heatMap: {
          'indicative-pres': { mastery: 0.75, attempts: 6 },
          'subjunctive-subjPres': { mastery: 0.2, attempts: 5 }
        }
      }
    })

    expect(result.mode).toBe('targeted')
    expect(result.drillConfig.practiceMode).toBe('specific')
    expect(result.drillConfig.specificMood).toBe('subjunctive')
    expect(result.drillConfig.specificTense).toBe('subjPres')
  })

  it('falls back to confidence mode with low mastery', () => {
    const result = buildCoachSessionPlan({
      userStats: { totalMastery: 30, streakDays: 0 },
      heatMapData: { heatMap: {} }
    })

    expect(result.mode).toBe('confidence')
    expect(result.drillConfig.practiceMode).toBe('review')
  })
})
