import { describe, expect, it } from 'vitest'
import {
  buildSmartPracticeRecommendationKey,
  getCachedSmartPracticeRecommendation,
  cacheSmartPracticeRecommendation,
  getOrCreateRecommendationRequest,
  __resetSmartPracticeRecommendationCache
} from './smartPracticeMlCache.js'

describe('smartPracticeMlCache', () => {
  it('builds stable key from relevant user stats', () => {
    const keyA = buildSmartPracticeRecommendationKey({ totalAttempts: 10, totalMastery: 50, streakDays: 3 })
    const keyB = buildSmartPracticeRecommendationKey({ totalAttempts: 10, totalMastery: 50, streakDays: 3 })

    expect(keyA).toBe(keyB)
  })

  it('stores and expires cached recommendations', () => {
    __resetSmartPracticeRecommendationCache()
    cacheSmartPracticeRecommendation('k1', { recommendations: [1] }, 1000)

    expect(getCachedSmartPracticeRecommendation('k1', 1100)).toEqual({ recommendations: [1] })
    expect(getCachedSmartPracticeRecommendation('k1', 1000 + 5 * 60 * 1000 + 1)).toBeNull()
  })

  it('deduplicates in-flight requests by key', async () => {
    __resetSmartPracticeRecommendationCache()
    let calls = 0
    const factory = async () => {
      calls += 1
      return { ok: true }
    }

    const [a, b] = await Promise.all([
      getOrCreateRecommendationRequest('shared', factory),
      getOrCreateRecommendationRequest('shared', factory)
    ])

    expect(a).toEqual({ ok: true })
    expect(b).toEqual({ ok: true })
    expect(calls).toBe(1)
  })
})
