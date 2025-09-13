import { describe, it, expect, beforeEach, vi } from 'vitest'
import { chooseNext, buildEligiblePool } from './generator.js'
import { useSettings } from '../../state/settings.js'
import { mockSettings, mockVerb as MOCK_VERB, expectValidGeneratorOutput } from '../../test-utils/index.js'

describe('Generator - Comprehensive Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Reset settings to clean state
    useSettings.setState(mockSettings())
  })

  describe('chooseNext - Core Functionality', () => {
    it('should generate valid forms across all dialects', () => {
      const regions = ['rioplatense', 'la_general', 'peninsular']

      regions.forEach(region => {
        useSettings.setState(mockSettings({ region }))

        const result = chooseNext()

        expectValidGeneratorOutput(result)
        expect(result?.region).toBe(region)
      })
    })

    it('should respect level restrictions', () => {
      const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

      levels.forEach(level => {
        useSettings.setState(mockSettings({ level }))

        const results = []
        for (let i = 0; i < 10; i++) {
          const result = chooseNext()
          if (result) results.push(result)
        }

        expect(results).toHaveLength(10)
        results.forEach(result => {
          expectValidGeneratorOutput(result)
          // A1 should not have complex tenses
          if (level === 'A1') {
            expect(['pluscuamperf', 'futPerf', 'antepret']).not.toContain(result.tense)
          }
        })
      })
    })

    it('should handle practice mode variations', () => {
      const practiceModes = ['mixed', 'specific']

      practiceModes.forEach(practiceMode => {
        useSettings.setState(mockSettings({ practiceMode }))

        const result = chooseNext()

        expectValidGeneratorOutput(result)
      })
    })

    it('should generate different forms on successive calls', () => {
      useSettings.setState(mockSettings({
        level: 'B1',
        verbType: 'all',
        practiceMode: 'mixed'
      }))

      const results = []
      for (let i = 0; i < 20; i++) {
        const result = chooseNext()
        if (result) results.push(result)
      }

      expect(results).toHaveLength(20)

      // Check for variety - should have at least 3 different lemmas
      const uniqueLemmas = new Set(results.map(r => r.lemma))
      expect(uniqueLemmas.size).toBeGreaterThanOrEqual(3)

      // Check for variety in persons
      const uniquePersons = new Set(results.map(r => r.person))
      expect(uniquePersons.size).toBeGreaterThanOrEqual(3)
    })

    it('should handle vos/tuteo/vosotros settings correctly', () => {
      // Test Rioplatense with vos only
      useSettings.setState(mockSettings({
        region: 'rioplatense',
        useVoseo: true,
        useTuteo: false,
        useVosotros: false
      }))

      const results = []
      for (let i = 0; i < 20; i++) {
        const result = chooseNext()
        if (result) results.push(result)
      }

      const secondPersonResults = results.filter(r => r.person.startsWith('2s'))
      expect(secondPersonResults.every(r => r.person === '2s_vos')).toBe(true)

      // Test Peninsular with tuteo and vosotros
      useSettings.setState(mockSettings({
        region: 'peninsular',
        useVoseo: false,
        useTuteo: true,
        useVosotros: true
      }))

      const peninsularResults = []
      for (let i = 0; i < 20; i++) {
        const result = chooseNext()
        if (result) peninsularResults.push(result)
      }

      const secondPersonPeninsular = peninsularResults.filter(r =>
        r.person === '2s_tu' || r.person === '2p_vosotros'
      )
      expect(secondPersonPeninsular.length).toBeGreaterThan(0)
    })

    it('should handle empty pools gracefully', () => {
      // Set very restrictive settings that might result in empty pool
      useSettings.setState(mockSettings({
        level: 'A1',
        practiceMode: 'specific',
        allowedMoods: [],
        allowedTenses: []
      }))

      const result = chooseNext()

      // Should either return null or a valid form
      if (result) {
        expectValidGeneratorOutput(result)
      } else {
        expect(result).toBeNull()
      }
    })
  })

  describe('buildEligiblePool - Pool Building', () => {
    it('should build pool with correct size constraints', () => {
      useSettings.setState(mockSettings({
        level: 'B2',
        verbType: 'all'
      }))

      const pool = buildEligiblePool()

      expect(Array.isArray(pool)).toBe(true)
      expect(pool.length).toBeGreaterThan(0)
      expect(pool.length).toBeLessThan(10000) // Reasonable upper bound

      // All forms should be valid
      pool.forEach(form => {
        expectValidGeneratorOutput(form)
      })
    })

    it('should filter by allowed lemmas when specified', () => {
      const allowedLemmas = ['hablar', 'comer', 'vivir']

      useSettings.setState(mockSettings({
        allowedLemmas,
        verbType: 'specific'
      }))

      const pool = buildEligiblePool()

      expect(pool.every(form => allowedLemmas.includes(form.lemma))).toBe(true)
    })

    it('should apply irregular family filters correctly', () => {
      useSettings.setState(mockSettings({
        irregularFamilies: ['PRET_STRONG', 'E_IE'],
        verbType: 'irregular'
      }))

      const pool = buildEligiblePool()

      expect(pool.length).toBeGreaterThan(0)
      pool.forEach(form => {
        expectValidGeneratorOutput(form)
      })
    })

    it('should handle regional variations correctly', () => {
      const regions = ['rioplatense', 'la_general', 'peninsular']

      regions.forEach(region => {
        useSettings.setState(mockSettings({ region }))

        const pool = buildEligiblePool()

        expect(pool.length).toBeGreaterThan(0)
        expect(pool.every(form => form.region === region)).toBe(true)
      })
    })
  })

  describe('Performance Tests', () => {
    it('should generate forms quickly', () => {
      useSettings.setState(mockSettings({
        level: 'B1',
        verbType: 'all'
      }))

      const startTime = performance.now()

      // Generate 100 forms
      for (let i = 0; i < 100; i++) {
        chooseNext()
      }

      const endTime = performance.now()
      const totalTime = endTime - startTime

      // Should complete 100 generations in less than 200ms
      expect(totalTime).toBeLessThan(200)
    })

    it('should build pool efficiently', () => {
      useSettings.setState(mockSettings({
        level: 'B2',
        verbType: 'all'
      }))

      const startTime = performance.now()
      const pool = buildEligiblePool()
      const endTime = performance.now()

      expect(endTime - startTime).toBeLessThan(100) // 100ms threshold
      expect(pool.length).toBeGreaterThan(50)
    })
  })

  describe('Edge Cases', () => {
    it('should handle malformed settings gracefully', () => {
      useSettings.setState({
        level: 'INVALID_LEVEL',
        region: 'INVALID_REGION',
        practiceMode: 'INVALID_MODE'
      })

      // Should not crash
      expect(() => chooseNext()).not.toThrow()
    })

    it('should handle missing verb data gracefully', () => {
      // Mock empty verb data
      vi.doMock('../../data/verbs.js', () => ({
        default: []
      }))

      const result = chooseNext()

      // Should either return null or handle gracefully
      if (result) {
        expectValidGeneratorOutput(result)
      }
    })

    it('should maintain consistency across cache rebuilds', () => {
      useSettings.setState(mockSettings({
        level: 'A2',
        region: 'rioplatense'
      }))

      // Generate some forms to warm up cache
      const initialResults = []
      for (let i = 0; i < 5; i++) {
        initialResults.push(chooseNext())
      }

      // Force cache invalidation by changing settings
      useSettings.setState(mockSettings({
        level: 'B1',
        region: 'rioplatense'
      }))

      // Generate forms with new settings
      const newResults = []
      for (let i = 0; i < 5; i++) {
        newResults.push(chooseNext())
      }

      // All results should be valid
      [...initialResults, ...newResults].forEach(result => {
        if (result) expectValidGeneratorOutput(result)
      })
    })
  })

  describe('Stress Tests', () => {
    it('should handle rapid successive calls', () => {
      useSettings.setState(mockSettings({
        level: 'B1',
        verbType: 'all'
      }))

      const results = []
      const startTime = performance.now()

      // Generate 1000 forms rapidly
      for (let i = 0; i < 1000; i++) {
        const result = chooseNext()
        if (result) results.push(result)
      }

      const endTime = performance.now()

      expect(results.length).toBeGreaterThan(900) // Allow some null results
      expect(endTime - startTime).toBeLessThan(1000) // 1 second max

      // Check for reasonable variety
      const uniqueLemmas = new Set(results.map(r => r.lemma))
      expect(uniqueLemmas.size).toBeGreaterThanOrEqual(10)
    })

    it('should handle memory efficiently with large pools', () => {
      useSettings.setState(mockSettings({
        level: 'C2', // Most comprehensive level
        verbType: 'all'
      }))

      const initialMemory = performance.memory?.usedJSHeapSize || 0

      // Build multiple large pools
      for (let i = 0; i < 10; i++) {
        buildEligiblePool()
      }

      const finalMemory = performance.memory?.usedJSHeapSize || 0
      const memoryIncrease = finalMemory - initialMemory

      // Should not leak significant memory (allow 50MB increase)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024)
    })
  })
})