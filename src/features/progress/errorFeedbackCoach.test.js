import { describe, expect, it } from 'vitest'
import { buildErrorFeedbackCards } from './errorFeedbackCoach.js'

describe('errorFeedbackCoach', () => {
  it('builds cards sorted by highest error rate', () => {
    const cards = buildErrorFeedbackCards({
      heatmap: {
        cells: [
          { mood: 'indicative', tense: 'pretIndef', errorRate: 0.6, attempts: 8 },
          { mood: 'subjunctive', tense: 'subjPres', errorRate: 0.8, attempts: 6 },
          { mood: 'imperative', tense: 'impAff', errorRate: 0.3, attempts: 4 }
        ]
      }
    })

    expect(cards).toHaveLength(3)
    expect(cards[0].id).toBe('subjunctive|subjPres')
    expect(cards[1].id).toBe('indicative|pretIndef')
  })

  it('uses fallback rule for unknown combinations', () => {
    const cards = buildErrorFeedbackCards({
      heatmap: {
        cells: [{ mood: 'conditional', tense: 'condPerf', errorRate: 0.5, attempts: 3 }]
      }
    })

    expect(cards[0].title).toContain('conditional')
    expect(cards[0].rule).toContain('Revisá la regla')
  })
})
