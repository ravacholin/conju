import { describe, expect, it } from 'vitest'
import { buildFrequentErrorsPlan } from './frequentErrorsPlan.js'

describe('frequentErrorsPlan', () => {
  it('returns top error combos ordered by error rate', () => {
    const result = buildFrequentErrorsPlan({
      heatmap: {
        cells: [
          { mood: 'indicative', tense: 'pres', attempts: 5, errorRate: 0.2 },
          { mood: 'subjunctive', tense: 'subjPres', attempts: 8, errorRate: 0.7 },
          { mood: 'indicative', tense: 'pretIndef', attempts: 6, errorRate: 0.5 }
        ]
      }
    })

    expect(result.items).toHaveLength(3)
    expect(result.items[0].mood).toBe('subjunctive')
    expect(result.items[0].errorRate).toBe(70)
  })

  it('returns empty plan when no critical errors exist', () => {
    const result = buildFrequentErrorsPlan({ heatmap: { cells: [] } })

    expect(result.items).toEqual([])
    expect(result.headline).toContain('Sin errores críticos')
  })
})
