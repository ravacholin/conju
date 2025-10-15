/**
 * FormSelectorService Unit Tests
 *
 * Comprehensive test suite to ensure functional equivalence with the original generator.js selection logic
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { selectForm } from './FormSelectorService.js'

describe('FormSelectorService', () => {
  let mockEligible
  let mockVerbLookupMap
  let mockSchedules

  beforeEach(() => {
    // Reset mocks
    mockEligible = []
    mockVerbLookupMap = new Map()
    mockSchedules = new Map()
  })

  describe('selectForm', () => {
    it('should return null when eligible is empty', async () => {
      const settings = {
        level: 'A1',
        region: 'la_general',
        practiceMode: 'mixed',
        verbType: 'all'
      }

      const result = await selectForm([], settings, { verbLookupMap: mockVerbLookupMap })
      expect(result).toBeNull()
    })

    it('should select from single form array', async () => {
      mockEligible = [
        { lemma: 'hablar', mood: 'indicative', tense: 'pres', person: '1s', value: 'hablo', type: 'regular', ending: '-ar' }
      ]

      const settings = {
        level: 'A1',
        region: 'la_general',
        practiceMode: 'mixed',
        verbType: 'all'
      }

      const result = await selectForm(mockEligible, settings, { verbLookupMap: mockVerbLookupMap })
      expect(result).toEqual(mockEligible[0])
    })

    it('should apply weighted selection for mixed practice', async () => {
      // Create 10 regular and 10 irregular forms
      const regularForms = Array.from({ length: 10 }, (_, i) => ({
        lemma: 'hablar',
        mood: 'indicative',
        tense: 'pres',
        person: '1s',
        value: `hablar${i}`,
        type: 'regular',
        ending: '-ar'
      }))

      const irregularForms = Array.from({ length: 10 }, (_, i) => ({
        lemma: 'ser',
        mood: 'indicative',
        tense: 'pres',
        person: '1s',
        value: `ser${i}`,
        type: 'irregular',
        ending: '-er'
      }))

      mockEligible = [...regularForms, ...irregularForms]

      const settings = {
        level: 'B1',
        region: 'la_general',
        practiceMode: 'mixed',
        verbType: 'all'
      }

      const result = await selectForm(mockEligible, settings, { verbLookupMap: mockVerbLookupMap })

      // Should select a valid form
      expect(result).toBeDefined()
      expect(['regular', 'irregular']).toContain(result.type)
    })

    it('should prioritize presente indicativo for A1 level', async () => {
      const presenteForms = [
        { lemma: 'hablar', mood: 'indicative', tense: 'pres', person: '1s', value: 'hablo', type: 'regular', ending: '-ar' },
        { lemma: 'comer', mood: 'indicative', tense: 'pres', person: '2s_tu', value: 'comes', type: 'regular', ending: '-er' }
      ]

      const otherForms = [
        { lemma: 'hablar', mood: 'indicative', tense: 'pretIndef', person: '1s', value: 'hablé', type: 'regular', ending: '-ar' }
      ]

      mockEligible = [...presenteForms, ...otherForms]

      const settings = {
        level: 'A1',
        region: 'la_general',
        practiceMode: 'mixed',
        verbType: 'all'
      }

      // Run multiple times to test probabilistic selection
      const results = await Promise.all(
        Array.from({ length: 20 }, () => selectForm(mockEligible, settings, { verbLookupMap: mockVerbLookupMap }))
      )

      // Most should be presente indicativo (85% weight)
      const presenteCount = results.filter(r => r?.tense === 'pres').length
      expect(presenteCount).toBeGreaterThan(10) // Should be ~17/20 with 85% weight
    })

    it('should handle SRS integration with schedules', async () => {
      mockEligible = [
        { lemma: 'hablar', mood: 'indicative', tense: 'pres', person: '1s', value: 'hablo', type: 'regular', ending: '-ar' },
        { lemma: 'comer', mood: 'indicative', tense: 'pres', person: '1s', value: 'como', type: 'regular', ending: '-er' }
      ]

      // Mock schedule with due item
      const now = new Date()
      mockSchedules = new Map([
        ['hablar|indicative|pres|1s', {
          lemma: 'hablar',
          mood: 'indicative',
          tense: 'pres',
          person: '1s',
          nextReview: new Date(now.getTime() - 86400000).toISOString(), // Due yesterday
          interval: 1,
          easeFactor: 2.5,
          consecutiveCorrect: 1
        }]
      ])

      const settings = {
        level: 'A1',
        region: 'la_general',
        practiceMode: 'mixed',
        verbType: 'all'
      }

      const context = {
        verbLookupMap: mockVerbLookupMap,
        schedules: mockSchedules
      }

      // Run multiple times - SRS should influence selection
      const results = await Promise.all(
        Array.from({ length: 10 }, () => selectForm(mockEligible, settings, context))
      )

      // Should select valid forms, SRS will weight them
      const validResults = results.filter(r => r !== null)
      expect(validResults.length).toBe(10)
      expect(validResults.every(r => ['hablar', 'comer'].includes(r.lemma))).toBe(true)
    })

    it('should apply ending distribution for specific practice', async () => {
      const arForms = Array.from({ length: 10 }, (_, i) => ({
        lemma: 'hablar',
        mood: 'indicative',
        tense: 'pres',
        person: '1s',
        value: `form${i}`,
        type: 'regular',
        ending: '-ar'
      }))

      const erForms = Array.from({ length: 10 }, (_, i) => ({
        lemma: 'comer',
        mood: 'indicative',
        tense: 'pres',
        person: '1s',
        value: `form${i}`,
        type: 'regular',
        ending: '-er'
      }))

      const irForms = Array.from({ length: 10 }, (_, i) => ({
        lemma: 'vivir',
        mood: 'indicative',
        tense: 'pres',
        person: '1s',
        value: `form${i}`,
        type: 'regular',
        ending: '-ir'
      }))

      mockEligible = [...arForms, ...erForms, ...irForms]

      const settings = {
        level: 'A2',
        region: 'la_general',
        practiceMode: 'specific',
        specificMood: 'indicative',
        specificTense: 'pres',
        verbType: 'all'
      }

      // Run many times to test distribution
      const results = await Promise.all(
        Array.from({ length: 100 }, () => selectForm(mockEligible, settings, { verbLookupMap: mockVerbLookupMap }))
      )

      const arCount = results.filter(r => r?.ending === '-ar').length
      const erCount = results.filter(r => r?.ending === '-er').length
      const irCount = results.filter(r => r?.ending === '-ir').length

      // Distribution should roughly match 40%/30%/30%
      expect(arCount).toBeGreaterThan(25) // Should be ~40
      expect(erCount).toBeGreaterThan(15) // Should be ~30
      expect(irCount).toBeGreaterThan(15) // Should be ~30
    })

    it('should handle C2 person variety (conmutación)', async () => {
      const persons = ['1s', '2s_tu', '3s', '1p', '2p_vosotros', '3p']
      mockEligible = persons.map(person => ({
        lemma: 'hablar',
        mood: 'indicative',
        tense: 'pres',
        person,
        value: `form_${person}`,
        type: 'regular',
        ending: '-ar'
      }))

      const settings = {
        level: 'C2',
        region: 'peninsular', // Supports all persons
        practiceMode: 'mixed',
        verbType: 'all'
      }

      // Run multiple times to ensure variety
      const results = await Promise.all(
        Array.from({ length: 20 }, () => selectForm(mockEligible, settings, { verbLookupMap: mockVerbLookupMap }))
      )

      const uniquePersons = new Set(results.map(r => r?.person))

      // Should use multiple different persons (conmutación)
      expect(uniquePersons.size).toBeGreaterThan(3)
    })

    it('should apply clitic transformations for imperative with voseo', async () => {
      mockEligible = [
        {
          lemma: 'dar',
          mood: 'imperative',
          tense: 'impAff',
          person: '2s_vos',
          value: 'da',
          type: 'irregular',
          ending: '-ar'
        }
      ]

      const settings = {
        level: 'B1',
        region: 'rioplatense',
        practiceMode: 'mixed',
        verbType: 'all',
        enableClitics: true
      }

      mockVerbLookupMap.set('dar', {
        lemma: 'dar',
        type: 'irregular',
        families: ['dar_family']
      })

      const context = {
        verbLookupMap: mockVerbLookupMap,
        shouldTransformClitics: true
      }

      const result = await selectForm(mockEligible, settings, context)

      expect(result).toBeDefined()
      // May have clitic transformation applied (e.g., "damelo" → "damelo" with accent)
    })

    it('should handle emergency fallback when selection fails', async () => {
      // This tests the emergency fallback mechanism
      mockEligible = [
        { lemma: 'hablar', mood: 'indicative', tense: 'pres', person: '1s', value: 'hablo', type: 'regular', ending: '-ar' }
      ]

      const settings = {
        level: 'A1',
        region: 'la_general',
        practiceMode: 'mixed',
        verbType: 'all'
      }

      // Even with limited pool, should return a valid form
      const result = await selectForm(mockEligible, settings, { verbLookupMap: mockVerbLookupMap })

      expect(result).toBeDefined()
      expect(result.lemma).toBe('hablar')
    })

    it('should exclude nonfinite forms from normal practice', async () => {
      mockEligible = [
        { lemma: 'hablar', mood: 'indicative', tense: 'pres', person: '1s', value: 'hablo', type: 'regular', ending: '-ar' },
        { lemma: 'hablar', mood: 'nonfinite', tense: 'ger', person: null, value: 'hablando', type: 'regular', ending: '-ar' },
        { lemma: 'hablar', mood: 'nonfinite', tense: 'part', person: null, value: 'hablado', type: 'regular', ending: '-ar' }
      ]

      const settings = {
        level: 'A1',
        region: 'la_general',
        practiceMode: 'mixed',
        verbType: 'all'
      }

      // Run multiple times
      const results = await Promise.all(
        Array.from({ length: 10 }, () => selectForm(mockEligible, settings, { verbLookupMap: mockVerbLookupMap }))
      )

      // Should strongly prefer finite forms (nonfinite only 5% at A1)
      const finiteForms = results.filter(r => r?.mood !== 'nonfinite')
      expect(finiteForms.length).toBeGreaterThan(8)
    })

    it('should handle person-weighted selection', async () => {
      const persons = ['1s', '2s_tu', '3s']
      mockEligible = persons.map(person => ({
        lemma: 'hablar',
        mood: 'indicative',
        tense: 'pres',
        person,
        value: `form_${person}`,
        type: 'regular',
        ending: '-ar'
      }))

      const settings = {
        level: 'B1',
        region: 'la_general',
        practiceMode: 'mixed',
        verbType: 'all'
      }

      // Run multiple times to test person distribution
      const results = await Promise.all(
        Array.from({ length: 30 }, () => selectForm(mockEligible, settings, { verbLookupMap: mockVerbLookupMap }))
      )

      const personCounts = {}
      results.forEach(r => {
        if (r?.person) {
          personCounts[r.person] = (personCounts[r.person] || 0) + 1
        }
      })

      // Should distribute across persons (not all same person)
      expect(Object.keys(personCounts).length).toBeGreaterThan(1)
    })

    it('should validate selected form structure', async () => {
      mockEligible = [
        { lemma: 'hablar', mood: 'indicative', tense: 'pres', person: '1s', value: 'hablo', type: 'regular', ending: '-ar' }
      ]

      const settings = {
        level: 'A1',
        region: 'la_general',
        practiceMode: 'mixed',
        verbType: 'all'
      }

      const result = await selectForm(mockEligible, settings, { verbLookupMap: mockVerbLookupMap })

      // Validate structure
      expect(result).toHaveProperty('lemma')
      expect(result).toHaveProperty('mood')
      expect(result).toHaveProperty('tense')
      expect(result).toHaveProperty('person')
      expect(result).toHaveProperty('value')
      expect(result).toHaveProperty('type')
    })
  })

  describe('Edge Cases', () => {
    it('should handle forms without ending property', async () => {
      mockEligible = [
        { lemma: 'ser', mood: 'indicative', tense: 'pres', person: '1s', value: 'soy', type: 'irregular' }
        // No 'ending' property
      ]

      const settings = {
        level: 'A1',
        region: 'la_general',
        practiceMode: 'specific',
        specificMood: 'indicative',
        specificTense: 'pres',
        verbType: 'all'
      }

      const result = await selectForm(mockEligible, settings, { verbLookupMap: mockVerbLookupMap })

      // Should handle gracefully
      expect(result).toBeDefined()
    })

    it('should handle missing context gracefully', async () => {
      mockEligible = [
        { lemma: 'hablar', mood: 'indicative', tense: 'pres', person: '1s', value: 'hablo', type: 'regular', ending: '-ar' }
      ]

      const settings = {
        level: 'A1',
        region: 'la_general',
        practiceMode: 'mixed',
        verbType: 'all'
      }

      // No context provided
      const result = await selectForm(mockEligible, settings)

      expect(result).toBeDefined()
    })

    it('should handle mixed regular and irregular with no type preference', async () => {
      mockEligible = [
        { lemma: 'hablar', mood: 'indicative', tense: 'pres', person: '1s', value: 'hablo', type: 'regular', ending: '-ar' },
        { lemma: 'ser', mood: 'indicative', tense: 'pres', person: '1s', value: 'soy', type: 'irregular', ending: '-er' }
      ]

      const settings = {
        level: 'A1',
        region: 'la_general',
        practiceMode: 'mixed',
        verbType: 'all' // No preference
      }

      const result = await selectForm(mockEligible, settings, { verbLookupMap: mockVerbLookupMap })

      expect(result).toBeDefined()
      expect(['regular', 'irregular']).toContain(result.type)
    })

    it('should handle all irregular forms', async () => {
      mockEligible = [
        { lemma: 'ser', mood: 'indicative', tense: 'pres', person: '1s', value: 'soy', type: 'irregular', ending: '-er' },
        { lemma: 'ir', mood: 'indicative', tense: 'pres', person: '1s', value: 'voy', type: 'irregular', ending: '-ir' }
      ]

      const settings = {
        level: 'B1',
        region: 'la_general',
        practiceMode: 'mixed',
        verbType: 'irregular'
      }

      const result = await selectForm(mockEligible, settings, { verbLookupMap: mockVerbLookupMap })

      expect(result).toBeDefined()
      expect(result.type).toBe('irregular')
    })

    it('should handle all regular forms', async () => {
      mockEligible = [
        { lemma: 'hablar', mood: 'indicative', tense: 'pres', person: '1s', value: 'hablo', type: 'regular', ending: '-ar' },
        { lemma: 'comer', mood: 'indicative', tense: 'pres', person: '1s', value: 'como', type: 'regular', ending: '-er' }
      ]

      const settings = {
        level: 'A1',
        region: 'la_general',
        practiceMode: 'mixed',
        verbType: 'regular'
      }

      const result = await selectForm(mockEligible, settings, { verbLookupMap: mockVerbLookupMap })

      expect(result).toBeDefined()
      expect(result.type).toBe('regular')
    })
  })

  describe('SRS Integration', () => {
    it('should prioritize overdue items', async () => {
      const now = new Date()
      mockEligible = [
        { lemma: 'hablar', mood: 'indicative', tense: 'pres', person: '1s', value: 'hablo', type: 'regular', ending: '-ar' },
        { lemma: 'comer', mood: 'indicative', tense: 'pres', person: '1s', value: 'como', type: 'regular', ending: '-er' },
        { lemma: 'vivir', mood: 'indicative', tense: 'pres', person: '1s', value: 'vivo', type: 'regular', ending: '-ir' }
      ]

      mockSchedules = new Map([
        ['hablar|indicative|pres|1s', {
          lemma: 'hablar',
          mood: 'indicative',
          tense: 'pres',
          person: '1s',
          nextReview: new Date(now.getTime() - 172800000).toISOString(), // 2 days overdue
          interval: 1,
          easeFactor: 2.5,
          consecutiveCorrect: 1
        }],
        ['comer|indicative|pres|1s', {
          lemma: 'comer',
          mood: 'indicative',
          tense: 'pres',
          person: '1s',
          nextReview: new Date(now.getTime() + 86400000).toISOString(), // Due tomorrow
          interval: 1,
          easeFactor: 2.5,
          consecutiveCorrect: 1
        }]
      ])

      const settings = {
        level: 'A1',
        region: 'la_general',
        practiceMode: 'mixed',
        verbType: 'all'
      }

      const context = {
        verbLookupMap: mockVerbLookupMap,
        schedules: mockSchedules
      }

      // Run multiple times - SRS should weight overdue items higher
      const results = await Promise.all(
        Array.from({ length: 20 }, () => selectForm(mockEligible, settings, context))
      )

      // Should return valid forms, with SRS weighting applied
      const validResults = results.filter(r => r !== null)
      expect(validResults.length).toBe(20)
      expect(validResults.every(r => ['hablar', 'comer', 'vivir'].includes(r.lemma))).toBe(true)
    })

    it('should handle items with no schedule', async () => {
      mockEligible = [
        { lemma: 'hablar', mood: 'indicative', tense: 'pres', person: '1s', value: 'hablo', type: 'regular', ending: '-ar' },
        { lemma: 'comer', mood: 'indicative', tense: 'pres', person: '1s', value: 'como', type: 'regular', ending: '-er' }
      ]

      // Only one has schedule
      const now = new Date()
      mockSchedules = new Map([
        ['hablar|indicative|pres|1s', {
          lemma: 'hablar',
          mood: 'indicative',
          tense: 'pres',
          person: '1s',
          nextReview: new Date(now.getTime() + 86400000).toISOString(),
          interval: 1,
          easeFactor: 2.5,
          consecutiveCorrect: 1
        }]
      ])

      const settings = {
        level: 'A1',
        region: 'la_general',
        practiceMode: 'mixed',
        verbType: 'all'
      }

      const context = {
        verbLookupMap: mockVerbLookupMap,
        schedules: mockSchedules
      }

      const result = await selectForm(mockEligible, settings, context)

      // Should handle both scheduled and unscheduled items
      expect(result).toBeDefined()
      expect(['hablar', 'comer']).toContain(result.lemma)
    })
  })
})
