import { describe, expect, it } from 'vitest'
import { buildSmartPracticeRecommendationKeyItem } from './smartPracticeRecommendationKey.js'

describe('smartPracticeRecommendationKey', () => {
  it('builds stable key from recommendation identity fields', () => {
    const rec = {
      type: 'focus-weakness',
      targetMood: 'subjunctive',
      targetTense: 'subjPres',
      title: 'Reforzar área débil'
    }

    const keyA = buildSmartPracticeRecommendationKeyItem(rec, 0)
    const keyB = buildSmartPracticeRecommendationKeyItem(rec, 0)

    expect(keyA).toBe(keyB)
  })

  it('includes index as fallback disambiguator', () => {
    const rec = { type: 'mixed-practice', title: 'Práctica variada' }

    expect(buildSmartPracticeRecommendationKeyItem(rec, 0)).not.toBe(
      buildSmartPracticeRecommendationKeyItem(rec, 1)
    )
  })
})
