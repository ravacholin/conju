import { describe, it, expect, vi } from 'vitest'
import {
  EVENT_TYPE_TO_CACHE_TYPES,
  PROGRESS_CACHE_TTL_MS,
  ProgressDataCache,
  resolveProgressUpdateKeys
} from './ProgressDataCache.js'

describe('ProgressDataCache cancellation', () => {
  it('rejects pending loads when aborted', async () => {
    const cache = new ProgressDataCache()
    const controller = new AbortController()

    const loadFn = vi.fn(({ signal }) => {
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => resolve('data'), 100)
        if (signal) {
          signal.addEventListener('abort', () => {
            clearTimeout(timer)
            reject(new Error('load aborted'))
          }, { once: true })
        }
      })
    })

    const promise = cache.get('user:test', loadFn, 'userStats', { signal: controller.signal })
    controller.abort()

    await expect(promise).rejects.toThrow('Operation was cancelled')
    expect(loadFn).toHaveBeenCalledTimes(1)
  })
})

describe('ProgressDataCache policies', () => {
  it('defines explicit TTL policy for dashboard data types', () => {
    expect(PROGRESS_CACHE_TTL_MS).toMatchObject({
      heatMap: expect.any(Number),
      recommendations: expect.any(Number),
      pronunciationStats: expect.any(Number),
      studyPlan: expect.any(Number),
      advancedAnalytics: expect.any(Number),
      dynamicLevelProgress: expect.any(Number)
    })
  })

  it('supports per-entry TTL overrides', async () => {
    const cache = new ProgressDataCache()
    const loader = vi.fn(() => Promise.resolve({ ok: true }))

    await cache.get('u1:userStats', loader, 'userStats', { ttl: 1 })
    await new Promise((resolve) => setTimeout(resolve, 5))
    await cache.get('u1:userStats', loader, 'userStats')

    expect(loader).toHaveBeenCalledTimes(2)
  })

  it('forces refresh when requested', async () => {
    const cache = new ProgressDataCache()
    const loader = vi.fn(() => Promise.resolve({ ok: true }))

    await cache.get('u1:weeklyProgress', loader, 'weeklyProgress')
    await cache.get('u1:weeklyProgress', loader, 'weeklyProgress', { forceRefresh: true })

    expect(loader).toHaveBeenCalledTimes(2)
  })

  it('invalidates by data type and user', async () => {
    const cache = new ProgressDataCache()
    const loader = vi.fn(() => Promise.resolve({ ok: true }))

    await cache.get('u1:userStats', loader, 'userStats')
    await cache.get('u1:heatMap:all', loader, 'heatMap')
    await cache.get('u1:recommendations', loader, 'recommendations')
    await cache.get('u2:userStats', loader, 'userStats')

    cache.invalidateByDataType(['userStats', 'heatMap'], 'u1')

    expect(cache.cache.has('u1:userStats')).toBe(false)
    expect(cache.cache.has('u1:heatMap:all')).toBe(false)
    expect(cache.cache.has('u1:recommendations')).toBe(true)
    expect(cache.cache.has('u2:userStats')).toBe(true)
  })
})

describe('resolveProgressUpdateKeys', () => {
  it('maps known event types to cache keys', () => {
    expect(EVENT_TYPE_TO_CACHE_TYPES.settings_change).toEqual(['recommendations', 'heatMap'])
    expect(EVENT_TYPE_TO_CACHE_TYPES.challenge_completed).toContain('dailyChallenges')
  })

  it('returns mapped keys for drill_result', () => {
    const keys = resolveProgressUpdateKeys({ type: 'drill_result' })
    expect(keys).toContain('heatMap')
    expect(keys).toContain('pronunciationStats')
  })

  it('falls back to partial core keys when context exists', () => {
    const keys = resolveProgressUpdateKeys({ mood: 'indicative', tense: 'present' })
    expect(keys).toContain('weeklyProgress')
    expect(keys).toContain('dailyChallenges')
  })

  it('returns null for full refresh events', () => {
    expect(resolveProgressUpdateKeys({ type: 'sync' })).toBeNull()
    expect(resolveProgressUpdateKeys({ forceFullRefresh: true })).toBeNull()
  })

  it('resolves settings_change to partial invalidation', () => {
    expect(resolveProgressUpdateKeys({ type: 'settings_change' })).toEqual(['recommendations', 'heatMap'])
  })
})
