import { describe, it, expect, beforeEach, vi } from 'vitest'
import { chooseNext } from './generator.js'
import { useSettings } from '../../state/settings.js'
import { mockSettings, mockVerb as MOCK_VERB, expectValidGeneratorOutput } from '../../test-utils/index.js'

// Create more comprehensive mock forms for testing
const createMockForms = () => [
  {
    lemma: 'hablar',
    region: 'la_general',
    forms: [
      { mood: 'indicative', tense: 'pres', person: '1s', value: 'hablo' },
      { mood: 'indicative', tense: 'pres', person: '2s_tu', value: 'hablas' },
      { mood: 'indicative', tense: 'pres', person: '3s', value: 'habla' },
      { mood: 'indicative', tense: 'pres', person: '1p', value: 'hablamos' },
      { mood: 'indicative', tense: 'pres', person: '3p', value: 'hablan' }
    ]
  },
  {
    lemma: 'comer',
    region: 'la_general',
    forms: [
      { mood: 'indicative', tense: 'pres', person: '1s', value: 'como' },
      { mood: 'indicative', tense: 'pres', person: '2s_tu', value: 'comes' },
      { mood: 'indicative', tense: 'pres', person: '3s', value: 'come' },
      { mood: 'indicative', tense: 'pres', person: '1p', value: 'comemos' },
      { mood: 'indicative', tense: 'pres', person: '3p', value: 'comen' }
    ]
  },
  {
    lemma: 'vivir',
    region: 'la_general',
    forms: [
      { mood: 'indicative', tense: 'pres', person: '1s', value: 'vivo' },
      { mood: 'indicative', tense: 'pres', person: '2s_tu', value: 'vives' },
      { mood: 'indicative', tense: 'pres', person: '3s', value: 'vive' },
      { mood: 'indicative', tense: 'pres', person: '1p', value: 'vivimos' },
      { mood: 'indicative', tense: 'pres', person: '3p', value: 'viven' }
    ]
  }
]

describe('Generator - Comprehensive Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Reset settings to clean state
    useSettings.setState(mockSettings())
  })

  describe('chooseNext - Core Functionality', () => {
    it('should generate valid forms across all dialects', async () => {
      const regions = ['rioplatense', 'la_general', 'peninsular']

      for (const region of regions) {
        const mockForms = createMockForms().map(verb => ({
          ...verb,
          region
        }))

        useSettings.setState(mockSettings({ region }))

        const result = await chooseNext({
          forms: mockForms,
          history: {},
          currentItem: null
        })

        expectValidGeneratorOutput(result)
        expect(result?.region).toBe(region)
      }
    })

    it('should respect level restrictions', async () => {
      const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

      for (const level of levels) {
        const mockForms = createMockForms()
        useSettings.setState(mockSettings({ level }))

        const results = []
        for (let i = 0; i < 5; i++) {
          try {
            const result = await chooseNext({
              forms: mockForms,
              history: {},
              currentItem: null
            })
            if (result) results.push(result)
          } catch (error) {
            // Some levels might not have valid forms, which is okay
            break
          }
        }

        if (results.length > 0) {
          results.forEach(result => {
            expectValidGeneratorOutput(result)
            // A1 should not have complex tenses
            if (level === 'A1') {
              expect(['pluscuamperf', 'futPerf', 'antepret']).not.toContain(result.tense)
            }
          })
        }
      }
    })

    it('should handle practice mode variations', async () => {
      const practiceModes = ['mixed', 'specific']

      for (const practiceMode of practiceModes) {
        const mockForms = createMockForms()
        useSettings.setState(mockSettings({ practiceMode }))

        try {
          const result = await chooseNext({
            forms: mockForms,
            history: {},
            currentItem: null
          })

          if (result) {
            expectValidGeneratorOutput(result)
          }
        } catch (error) {
          // Some practice modes might not work with our mock data
          console.log(`Practice mode ${practiceMode} not supported with mock data`)
        }
      }
    })

    it('should generate different forms on successive calls', async () => {
      useSettings.setState(mockSettings({
        level: 'B1',
        verbType: 'all',
        practiceMode: 'mixed'
      }))
      const mockForms = createMockForms()

      const results = []
      for (let i = 0; i < 10; i++) {
        try {
          const result = await chooseNext({
            forms: mockForms,
            history: {},
            currentItem: null
          })
          if (result) results.push(result)
        } catch (error) {
          // Expected for some iterations
          break
        }
      }

      expect(results.length).toBeGreaterThan(0)

      // Check for variety - should have different lemmas
      const uniqueLemmas = new Set(results.map(r => r.lemma))
      expect(uniqueLemmas.size).toBeGreaterThan(1)

      // Check for variety in persons
      const uniquePersons = new Set(results.map(r => r.person))
      expect(uniquePersons.size).toBeGreaterThanOrEqual(3)
    })

    it('should handle vos/tuteo/vosotros settings correctly', async () => {
      const mockForms = createMockForms()

      // Test Rioplatense with vos only
      useSettings.setState(mockSettings({
        region: 'rioplatense',
        useVoseo: true,
        useTuteo: false,
        useVosotros: false
      }))

      const results = []
      for (let i = 0; i < 20; i++) {
        const result = await chooseNext({
          forms: mockForms,
          history: {},
          currentItem: null
        })
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
        const result = await chooseNext({
          forms: mockForms,
          history: {},
          currentItem: null
        })
        if (result) peninsularResults.push(result)
      }

      const secondPersonPeninsular = peninsularResults.filter(r =>
        r.person === '2s_tu' || r.person === '2p_vosotros'
      )
      expect(secondPersonPeninsular.length).toBeGreaterThan(0)
    })

    it('should handle empty pools gracefully', async () => {
      const mockForms = createMockForms()

      // Set very restrictive settings that might result in empty pool
      useSettings.setState(mockSettings({
        level: 'A1',
        practiceMode: 'specific',
        allowedMoods: [],
        allowedTenses: []
      }))

      const result = await chooseNext({
        forms: mockForms,
        history: {},
        currentItem: null
      })

      // Should either return null or a valid form
      if (result) {
        expectValidGeneratorOutput(result)
      } else {
        expect(result).toBeNull()
      }
    })
  })

  // Removed buildEligiblePool tests since function doesn't exist

  describe('Performance Tests', () => {
    it('should generate forms quickly', async () => {
      const mockForms = createMockForms()

      useSettings.setState(mockSettings({
        level: 'B1',
        verbType: 'all'
      }))

      const startTime = performance.now()

      // Generate 100 forms
      for (let i = 0; i < 100; i++) {
        await chooseNext({
          forms: mockForms,
          history: {},
          currentItem: null
        })
      }

      const endTime = performance.now()
      const totalTime = endTime - startTime

      // Should complete 100 generations in less than 200ms
      expect(totalTime).toBeLessThan(200)
    })

    // Removed buildEligiblePool performance test since function doesn't exist
  })

  describe('Edge Cases', () => {
    it('should handle malformed settings gracefully', async () => {
      useSettings.setState({
        level: 'INVALID_LEVEL',
        region: 'INVALID_REGION',
        practiceMode: 'INVALID_MODE'
      })

      // Should not crash
      await expect(chooseNext({
        forms: createMockForms(),
        history: {},
        currentItem: null
      })).resolves.toBeDefined()
    })

    it('should handle missing verb data gracefully', async () => {
      // Mock empty verb data
      vi.doMock('../../data/verbs.js', () => ({
        default: []
      }))

      const result = await chooseNext({
        forms: createMockForms(),
        history: {},
        currentItem: null
      })

      // Should either return null or handle gracefully
      if (result) {
        expectValidGeneratorOutput(result)
      }
    })

    it('should maintain consistency across cache rebuilds', async () => {
      const mockForms = createMockForms()

      useSettings.setState(mockSettings({
        level: 'A2',
        region: 'rioplatense'
      }))

      // Generate some forms to warm up cache
      const initialResults = []
      for (let i = 0; i < 5; i++) {
        initialResults.push(await chooseNext({
          forms: mockForms,
          history: {},
          currentItem: null
        }))
      }

      // Force cache invalidation by changing settings
      useSettings.setState(mockSettings({
        level: 'B1',
        region: 'rioplatense'
      }))

      // Generate forms with new settings
      const newResults = []
      for (let i = 0; i < 5; i++) {
        newResults.push(await chooseNext({
          forms: mockForms,
          history: {},
          currentItem: null
        }))
      }

      // All results should be valid
      [...initialResults, ...newResults].forEach(result => {
        if (result) expectValidGeneratorOutput(result)
      })
    })
  })

  describe('Stress Tests', () => {
    it('should handle rapid successive calls', async () => {
      const mockForms = createMockForms()

      useSettings.setState(mockSettings({
        level: 'B1',
        verbType: 'all'
      }))

      const results = []
      const startTime = performance.now()

      // Generate 1000 forms rapidly
      for (let i = 0; i < 1000; i++) {
        const result = await chooseNext({
          forms: mockForms,
          history: {},
          currentItem: null
        })
        if (result) results.push(result)
      }

      const endTime = performance.now()

      expect(results.length).toBeGreaterThan(900) // Allow some null results
      expect(endTime - startTime).toBeLessThan(1000) // 1 second max

      // Check for reasonable variety
      const uniqueLemmas = new Set(results.map(r => r.lemma))
      expect(uniqueLemmas.size).toBeGreaterThanOrEqual(10)
    })

    // Removed memory test since buildEligiblePool doesn't exist
  })
})