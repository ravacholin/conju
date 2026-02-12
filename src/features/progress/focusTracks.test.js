import { describe, expect, it } from 'vitest'
import { buildFocusTracks } from './focusTracks.js'

describe('focusTracks', () => {
  it('prioritizes weak and stale tracks from heatmap data', () => {
    const tenDaysAgo = Date.now() - (10 * 24 * 60 * 60 * 1000)
    const tracks = buildFocusTracks({
      userStats: { totalMastery: 70 },
      heatMapData: {
        heatMap: {
          'subjunctive-subjPres': { mastery: 0.2, attempts: 8, lastAttempt: Date.now() },
          'indicative-pretIndef': { mastery: 0.8, attempts: 6, lastAttempt: tenDaysAgo }
        }
      }
    })

    expect(tracks[0].id).toBe('repair-weakness')
    expect(tracks[1].id).toBe('reactivate-mastery')
    expect(tracks).toHaveLength(3)
  })

  it('returns fallback review track on low mastery', () => {
    const tracks = buildFocusTracks({
      userStats: { totalMastery: 30 },
      heatMapData: { heatMap: {} }
    })

    expect(tracks).toHaveLength(1)
    expect(tracks[0].drillConfig.practiceMode).toBe('review')
  })
})
