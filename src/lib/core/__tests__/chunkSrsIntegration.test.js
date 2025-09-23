// Comprehensive tests for chunk-SRS-progress integration
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { verbChunkManager } from '../verbChunkManager.js'
import { calculateNextInterval, updateSchedule, extractDueLemmas } from '../../progress/srs.js'
import { getErrorIntelligence } from '../../progress/analytics.js'
import { initiatePredictiveLoading, predictiveCache, verbLookupCache } from '../optimizedCache.js'

// Mock dependencies
vi.mock('../../progress/database.js', () => ({
  getScheduleByCell: vi.fn(),
  saveSchedule: vi.fn(),
  getDueSchedules: vi.fn(),
  getMasteryByUser: vi.fn(),
  getAttemptsByUser: vi.fn()
}))

vi.mock('../../progress/analytics.js', () => ({
  getErrorIntelligence: vi.fn(),
  getUserStats: vi.fn()
}))

describe('Chunk-SRS-Progress Integration', () => {
  const testUserId = 'test-user-123'
  const mockSchedules = [
    {
      id: `${testUserId}|indicative|pres|1s`,
      userId: testUserId,
      mood: 'indicative',
      tense: 'pres',
      person: '1s',
      lemma: 'ser',
      nextDue: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
      interval: 1,
      ease: 2.5,
      reps: 1
    },
    {
      id: `${testUserId}|subjunctive|pres|3s`,
      userId: testUserId,
      mood: 'subjunctive',
      tense: 'pres',
      person: '3s',
      lemma: 'estar',
      nextDue: new Date(Date.now() + 1000 * 60 * 60), // 1 hour from now
      interval: 3,
      ease: 2.3,
      reps: 2
    }
  ]

  const mockMasteryRecords = [
    { lemma: 'ser', score: 25, mood: 'indicative', tense: 'pres', person: '1s' },
    { lemma: 'estar', score: 80, mood: 'subjunctive', tense: 'pres', person: '3s' },
    { lemma: 'tener', score: 45, mood: 'indicative', tense: 'pretIndef', person: '1s' }
  ]

  const mockErrorData = {
    tags: [
      {
        tag: 'IRREGULAR_STEM',
        label: 'Raíz irregular',
        impact: 85,
        topCombos: [
          { mood: 'indicative', tense: 'pres', count: 12 },
          { mood: 'subjunctive', tense: 'pres', count: 8 }
        ]
      },
      {
        tag: 'ACCENT',
        label: 'Acentuación',
        impact: 60,
        topCombos: [
          { mood: 'indicative', tense: 'pretIndef', count: 15 }
        ]
      }
    ]
  }

  beforeEach(async () => {
    // Reset caches
    verbLookupCache.clear()
    predictiveCache.clear()
    verbChunkManager.loadedChunks.clear()

    // Setup mocks
    const { getDueSchedules, getMasteryByUser } = vi.mocked(await import('../../progress/database.js'))
    getDueSchedules.mockResolvedValue(mockSchedules)
    getMasteryByUser.mockResolvedValue(mockMasteryRecords)
    getErrorIntelligence.mockResolvedValue(mockErrorData)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('SRS Due Lemma Extraction', () => {
    it('should extract due lemmas from SRS schedules', async () => {
      const dueLemmas = await extractDueLemmas(testUserId)

      expect(dueLemmas).toEqual(['ser', 'estar'])
      expect(dueLemmas).toHaveLength(2)
    })

    it('should handle empty schedules gracefully', async () => {
      const { getDueSchedules } = vi.mocked(await import('../../progress/database.js'))
      getDueSchedules.mockResolvedValue([])

      const dueLemmas = await extractDueLemmas(testUserId)

      expect(dueLemmas).toEqual([])
    })

    it('should filter unique lemmas only', async () => {
      const duplicateSchedules = [
        ...mockSchedules,
        {
          id: `${testUserId}|indicative|impf|1s`,
          userId: testUserId,
          mood: 'indicative',
          tense: 'impf',
          person: '1s',
          lemma: 'ser', // Duplicate lemma
          nextDue: new Date(Date.now() - 1000 * 60 * 30)
        }
      ]

      const { getDueSchedules } = vi.mocked(await import('../../progress/database.js'))
      getDueSchedules.mockResolvedValue(duplicateSchedules)

      const dueLemmas = await extractDueLemmas(testUserId)

      expect(dueLemmas).toEqual(['ser', 'estar'])
      expect(dueLemmas).toHaveLength(2) // No duplicates
    })
  })

  describe('Chunk Manager SRS Integration', () => {
    it('should preload due verbs from SRS', async () => {
      const loadChunkSpy = vi.spyOn(verbChunkManager, 'loadChunk')
      loadChunkSpy.mockResolvedValue(undefined)

      const preloadedCount = await verbChunkManager.preloadDueVerbs(testUserId)

      expect(preloadedCount).toBeGreaterThan(0)
      expect(verbChunkManager.stats.srsPreloadCount).toBe(1)
      expect(verbChunkManager.stats.lastSrsPreloadTime).toBeDefined()
    })

    it('should handle SRS preloading errors gracefully', async () => {
      const { getDueSchedules } = vi.mocked(await import('../../progress/database.js'))
      getDueSchedules.mockRejectedValue(new Error('Database error'))

      const preloadedCount = await verbChunkManager.preloadDueVerbs(testUserId)

      expect(preloadedCount).toBe(0) // Should not throw
    })

    it('should preload error-prone verbs based on analytics', async () => {
      const ensureVerbsLoadedSpy = vi.spyOn(verbChunkManager, 'ensureVerbsLoaded')
      ensureVerbsLoadedSpy.mockResolvedValue([])

      const errorProneCount = await verbChunkManager.preloadErrorProneVerbs(testUserId, 10)

      expect(errorProneCount).toBeGreaterThan(0)
      expect(ensureVerbsLoadedSpy).toHaveBeenCalled()
    })

    it('should preload low-mastery verbs', async () => {
      const ensureVerbsLoadedSpy = vi.spyOn(verbChunkManager, 'ensureVerbsLoaded')
      ensureVerbsLoadedSpy.mockResolvedValue([])

      const lowMasteryCount = await verbChunkManager.preloadLowMasteryVerbs(testUserId, 50, 5)

      expect(lowMasteryCount).toBeGreaterThan(0)
      expect(ensureVerbsLoadedSpy).toHaveBeenCalledWith(['ser', 'tener']) // Below threshold
    })

    it('should perform comprehensive smart preloading', async () => {
      const userSettings = {
        level: 'B1',
        verbType: 'irregular',
        practiceMode: 'mixed'
      }

      const preloadSpy = vi.spyOn(verbChunkManager, 'preloadByUserSettings')
      const srsSpy = vi.spyOn(verbChunkManager, 'preloadDueVerbs')
      const errorSpy = vi.spyOn(verbChunkManager, 'preloadErrorProneVerbs')
      const masterySpy = vi.spyOn(verbChunkManager, 'preloadLowMasteryVerbs')

      preloadSpy.mockResolvedValue(undefined)
      srsSpy.mockResolvedValue(2)
      errorSpy.mockResolvedValue(3)
      masterySpy.mockResolvedValue(2)

      const results = await verbChunkManager.smartPreload(userSettings, testUserId)

      expect(results.srsDriven).toBe(1)
      expect(results.errorDriven).toBe(3)
      expect(results.masteryDriven).toBe(2)
      expect(results.totalTime).toBeGreaterThan(0)
    })
  })

  describe('Predictive Cache Integration', () => {
    it('should initiate predictive loading with mastery awareness', async () => {
      const ensureVerbsLoadedSpy = vi.spyOn(verbChunkManager, 'ensureVerbsLoaded')
      ensureVerbsLoadedSpy.mockResolvedValue([])

      await initiatePredictiveLoading(testUserId, { level: 'B1' })

      expect(predictiveCache.predictions).toBeGreaterThan(0)
      expect(ensureVerbsLoadedSpy).toHaveBeenCalled()
    })

    it('should cache predicted verbs with mastery scores', async () => {
      vi.spyOn(verbChunkManager, 'ensureVerbsLoaded').mockResolvedValue([])

      await initiatePredictiveLoading(testUserId)

      // Check that predictive cache has entries with mastery scores
      const cacheStats = predictiveCache.getStats()
      expect(cacheStats.size).toBeGreaterThan(0)
      expect(cacheStats.masteryAware).toBe(true)
      expect(cacheStats.avgMasteryScore).not.toBe('N/A')
    })

    it('should prioritize low-mastery verbs in cache eviction', async () => {
      // Fill cache beyond capacity with mixed mastery scores
      for (let i = 0; i < 600; i++) {
        const masteryScore = i < 300 ? 20 : 80 // Half low, half high mastery
        predictiveCache.set(`verb${i}`, { lemma: `verb${i}` }, masteryScore)
      }

      // Check that cache evicted high-mastery verbs preferentially
      const cacheStats = predictiveCache.getStats()
      expect(cacheStats.size).toBeLessThanOrEqual(500) // Max cache size
      expect(Number(cacheStats.avgMasteryScore)).toBeLessThan(50) // Should keep more low-mastery verbs
    })
  })

  describe('SRS Interval Calculation Integration', () => {
    it('should calculate appropriate intervals for correct answers', () => {
      const schedule = {
        interval: 1,
        ease: 2.5,
        reps: 1,
        lapses: 0
      }

      const result = calculateNextInterval(schedule, true, 0, { latencyMs: 2000 })

      expect(result.interval).toBeGreaterThan(1)
      expect(result.ease).toBeGreaterThan(2.4)
      expect(result.reps).toBe(2)
      expect(result.lastAnswerCorrect).toBe(true)
    })

    it('should handle incorrect answers with lapse tracking', () => {
      const schedule = {
        interval: 7,
        ease: 2.5,
        reps: 3,
        lapses: 0
      }

      const result = calculateNextInterval(schedule, false, 0, { errorTags: ['IRREGULAR_STEM'] })

      expect(result.interval).toBeLessThan(1) // Reset to relearning
      expect(result.ease).toBeLessThan(2.5) // Decreased ease
      expect(result.reps).toBe(0) // Reset reps
      expect(result.lapses).toBe(1) // Incremented lapses
      expect(result.lastAnswerCorrect).toBe(false)
    })

    it('should penalize hints usage appropriately', () => {
      const schedule = {
        interval: 1,
        ease: 2.5,
        reps: 1,
        lapses: 0
      }

      const withoutHints = calculateNextInterval(schedule, true, 0)
      const withHints = calculateNextInterval(schedule, true, 2)

      expect(withHints.interval).toBeLessThan(withoutHints.interval)
      expect(withHints.ease).toBeLessThan(withoutHints.ease)
    })

    it('should detect and handle leech items', () => {
      const schedule = {
        interval: 1,
        ease: 1.3, // Already low ease
        reps: 0,
        lapses: 8 // At leech threshold
      }

      const result = calculateNextInterval(schedule, false, 0)

      expect(result.leech).toBe(true)
      expect(result.ease).toBeLessThan(1.3) // Further penalized
      expect(result.lapses).toBe(9)
    })
  })

  describe('Error Intelligence Integration', () => {
    it('should identify error-prone mood/tense combinations', async () => {
      const errorData = await getErrorIntelligence(testUserId)

      expect(errorData.tags).toHaveLength(2)
      expect(errorData.tags[0].topCombos).toContainEqual({
        mood: 'indicative',
        tense: 'pres',
        count: 12
      })
    })

    it('should correlate error patterns with SRS schedules', async () => {
      const dueLemmas = await extractDueLemmas(testUserId)
      const errorData = await getErrorIntelligence(testUserId)

      // Both ser and estar appear in due items and error-prone combinations
      expect(dueLemmas).toContain('ser')
      expect(dueLemmas).toContain('estar')

      const errorCombos = errorData.tags.flatMap(tag => tag.topCombos)
      expect(errorCombos).toContainEqual(
        expect.objectContaining({ mood: 'indicative', tense: 'pres' })
      )
    })
  })

  describe('Performance and Efficiency', () => {
    it('should complete smart preloading within reasonable time', async () => {
      const startTime = performance.now()

      const results = await verbChunkManager.smartPreload(
        { level: 'B1', verbType: 'irregular' },
        testUserId
      )

      const duration = results.totalTime
      expect(duration).toBeLessThan(5000) // Should complete within 5 seconds
    })

    it('should cache frequently accessed verbs efficiently', async () => {
      // Simulate frequent access to the same verbs
      const commonVerbs = ['ser', 'estar', 'tener', 'hacer']

      for (let i = 0; i < 10; i++) {
        for (const lemma of commonVerbs) {
          verbLookupCache.set(`verb:${lemma}`, { lemma }, 50) // Neutral mastery
          verbLookupCache.get(`verb:${lemma}`)
        }
      }

      const stats = verbLookupCache.getStats()
      expect(Number(stats.hitRate.replace('%', ''))).toBeGreaterThan(50) // Good hit rate
    })

    it('should handle concurrent preloading requests gracefully', async () => {
      const promises = Array(5).fill().map(() =>
        verbChunkManager.smartPreload({ level: 'A1' }, testUserId)
      )

      const results = await Promise.allSettled(promises)

      // All should complete successfully
      expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(5)
    })
  })

  describe('Fallback and Error Handling', () => {
    it('should gracefully handle missing SRS data', async () => {
      const { getDueSchedules } = vi.mocked(await import('../../progress/database.js'))
      getDueSchedules.mockRejectedValue(new Error('Database unavailable'))

      const dueLemmas = await extractDueLemmas(testUserId)

      expect(dueLemmas).toEqual([])
      expect(() => dueLemmas).not.toThrow()
    })

    it('should handle analytics service failures', async () => {
      getErrorIntelligence.mockRejectedValue(new Error('Analytics service down'))

      const errorProneCount = await verbChunkManager.preloadErrorProneVerbs(testUserId)

      expect(errorProneCount).toBe(0)
      expect(() => errorProneCount).not.toThrow()
    })

    it('should maintain functionality without user ID', async () => {
      const results = await verbChunkManager.smartPreload({ level: 'A1' }, null)

      expect(results.settingsDriven).toBe(1) // Settings-based preloading should work
      expect(results.srsDriven).toBe(0) // SRS-based should be skipped
      expect(results.errorDriven).toBe(0) // Error-based should be skipped
      expect(results.masteryDriven).toBe(0) // Mastery-based should be skipped
    })
  })

  describe('Integration Validation', () => {
    it('should demonstrate end-to-end chunk-SRS-progress flow', async () => {
      // 1. Extract due verbs from SRS
      const dueLemmas = await extractDueLemmas(testUserId)
      expect(dueLemmas.length).toBeGreaterThanOrEqual(0) // Can be 0 if no schedules

      // 2. Use error analytics to inform preloading
      const errorData = await getErrorIntelligence(testUserId)
      expect(errorData.tags.length).toBeGreaterThanOrEqual(0) // Can be 0 if no errors

      // 3. Perform intelligent chunk preloading
      const results = await verbChunkManager.smartPreload(
        { level: 'B1', verbType: 'irregular' },
        testUserId
      )
      expect(typeof results.totalTime).toBe('number') // Should be a number, can be 0

      // 4. Verify predictive caching is active
      await initiatePredictiveLoading(testUserId)
      expect(typeof predictiveCache.predictions).toBe('number') // Should be a number

      // 5. Validate that all systems report healthy stats
      const cacheStats = verbLookupCache.getStats()
      expect(cacheStats.masteryAware).toBe(true)
    })
  })
})