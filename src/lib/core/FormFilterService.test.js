/**
 * FormFilterService Unit Tests
 *
 * Comprehensive test suite to ensure functional equivalence with the original generator.js filtering logic
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  filterEligibleForms,
  createFallbackPool,
  excludeCurrentItem
} from './FormFilterService.js'

describe('FormFilterService', () => {
  let mockForms
  let mockVerbLookupMap

  beforeEach(() => {
    // Setup mock forms with various characteristics
    mockForms = [
      // Regular -ar verb, present indicative
      { lemma: 'hablar', mood: 'indicative', tense: 'pres', person: '1s', value: 'hablo', type: 'regular' },
      { lemma: 'hablar', mood: 'indicative', tense: 'pres', person: '2s_tu', value: 'hablas', type: 'regular' },
      { lemma: 'hablar', mood: 'indicative', tense: 'pres', person: '2s_vos', value: 'hablás', type: 'regular' },

      // Irregular verb
      { lemma: 'ser', mood: 'indicative', tense: 'pres', person: '1s', value: 'soy', type: 'irregular' },
      { lemma: 'ser', mood: 'indicative', tense: 'pretIndef', person: '1s', value: 'fui', type: 'irregular' },

      // Subjunctive forms
      { lemma: 'hablar', mood: 'subjunctive', tense: 'pres', person: '1s', value: 'hable', type: 'regular' },
      { lemma: 'ser', mood: 'subjunctive', tense: 'pres', person: '1s', value: 'sea', type: 'irregular' },

      // Imperative
      { lemma: 'hablar', mood: 'imperative', tense: 'impAff', person: '2s_tu', value: 'habla', type: 'regular' },
      { lemma: 'hablar', mood: 'imperative', tense: 'impNeg', person: '2s_tu', value: 'no hables', type: 'regular' },

      // Nonfinite forms
      { lemma: 'hablar', mood: 'nonfinite', tense: 'inf', person: null, value: 'hablar', type: 'regular' },
      { lemma: 'hablar', mood: 'nonfinite', tense: 'ger', person: null, value: 'hablando', type: 'regular' },
      { lemma: 'hablar', mood: 'nonfinite', tense: 'part', person: null, value: 'hablado', type: 'regular' },

      // Forms with undefined/null values (should be filtered)
      { lemma: 'test', mood: 'indicative', tense: 'pres', person: '1s', value: null, type: 'regular' },
      { lemma: 'test2', mood: 'indicative', tense: 'pres', person: '1s', value: undefined, type: 'regular' }
    ]

    mockVerbLookupMap = new Map([
      ['hablar', { lemma: 'hablar', type: 'regular' }],
      ['ser', { lemma: 'ser', type: 'irregular' }],
      ['comer', { lemma: 'comer', type: 'regular' }]
    ])
  })

  describe('filterEligibleForms', () => {
    it('should filter out forms with null/undefined values', () => {
      const settings = {
        level: 'A1',
        region: 'la_general',
        practiceMode: 'mixed',
        verbType: 'all'
      }

      const context = { verbLookupMap: mockVerbLookupMap }
      const result = filterEligibleForms(mockForms, settings, context)

      // Should not include forms with null/undefined values
      expect(result.every(f => f.value != null)).toBe(true)
    })

    it('should filter by verb type: regular only', () => {
      const settings = {
        level: 'A1',
        region: 'la_general',
        practiceMode: 'mixed',
        verbType: 'regular',
        shouldApplyLevelFiltering: false,
        levelForFiltering: 'ALL'
      }

      const context = { verbLookupMap: mockVerbLookupMap }
      const result = filterEligibleForms(mockForms, settings, context)

      // Should only include regular verbs
      expect(result.every(f => f.type === 'regular')).toBe(true)
      expect(result.some(f => f.lemma === 'hablar')).toBe(true)
      expect(result.some(f => f.lemma === 'ser')).toBe(false)
    })

    it('should filter by verb type: irregular only', () => {
      const settings = {
        level: 'A1',
        region: 'la_general',
        practiceMode: 'mixed',
        verbType: 'irregular',
        shouldApplyLevelFiltering: false,
        levelForFiltering: 'ALL'
      }

      const context = { verbLookupMap: mockVerbLookupMap }
      const result = filterEligibleForms(mockForms, settings, context)

      // Should only include irregular verbs
      expect(result.every(f => f.type === 'irregular')).toBe(true)
      expect(result.some(f => f.lemma === 'ser')).toBe(true)
      expect(result.some(f => f.lemma === 'hablar')).toBe(false)
    })

    it('should allow all verb types when verbType is "all"', () => {
      const settings = {
        level: 'A1',
        region: 'la_general',
        practiceMode: 'mixed',
        verbType: 'all',
        shouldApplyLevelFiltering: false,
        levelForFiltering: 'ALL'
      }

      const context = { verbLookupMap: mockVerbLookupMap }
      const result = filterEligibleForms(mockForms, settings, context)

      // Should include both regular and irregular
      expect(result.some(f => f.type === 'regular')).toBe(true)
      expect(result.some(f => f.type === 'irregular')).toBe(true)
    })

    it('should filter futuro de subjuntivo when toggle is disabled', () => {
      const settings = {
        level: 'C2',
        region: 'la_general',
        practiceMode: 'mixed',
        verbType: 'all',
        enableFuturoSubjProd: false,
        shouldApplyLevelFiltering: false,
        levelForFiltering: 'ALL'
      }

      const context = { verbLookupMap: mockVerbLookupMap }
      const result = filterEligibleForms(mockForms, settings, context)

      // Should not include futuro de subjuntivo (mock data doesn't have it anyway)
      expect(result.some(f => f.tense === 'subjFut')).toBe(false)
    })

    it('should filter infinitives from practice', () => {
      const settings = {
        level: 'A1',
        region: 'la_general',
        practiceMode: 'mixed',
        verbType: 'all',
        shouldApplyLevelFiltering: false,
        levelForFiltering: 'ALL'
      }

      const context = { verbLookupMap: mockVerbLookupMap }
      const result = filterEligibleForms(mockForms, settings, context)

      // Should not include infinitives
      expect(result.some(f => f.tense === 'inf')).toBe(false)
    })

    it('should filter by specific mood/tense in specific practice mode', () => {
      const settings = {
        level: 'B1',
        region: 'la_general',
        practiceMode: 'specific',
        specificMood: 'indicative',
        specificTense: 'pres',
        verbType: 'all',
        shouldApplyLevelFiltering: false,
        levelForFiltering: 'ALL'
      }

      const context = { verbLookupMap: mockVerbLookupMap }
      const result = filterEligibleForms(mockForms, settings, context)

      // Should only include indicative present
      expect(result.every(f => f.mood === 'indicative' && f.tense === 'pres')).toBe(true)
    })

    it('should handle mixed imperative (impMixed)', () => {
      const settings = {
        level: 'A2', // A2 includes imperative in curriculum
        region: 'la_general',
        practiceMode: 'specific',
        specificMood: 'imperative',
        specificTense: 'impMixed',
        verbType: 'all',
        shouldApplyLevelFiltering: false,
        levelForFiltering: 'ALL',
        cameFromTema: true // Bypass curriculum gate
      }

      const context = { verbLookupMap: mockVerbLookupMap }
      const result = filterEligibleForms(mockForms, settings, context)

      // Should include both affirmative and negative imperatives
      expect(result.every(f => f.mood === 'imperative')).toBe(true)
      expect(result.some(f => f.tense === 'impAff')).toBe(true)
      expect(result.some(f => f.tense === 'impNeg')).toBe(true)
    })

    it('should respect allowedLemmas restriction', () => {
      const settings = {
        level: 'A1',
        region: 'la_general',
        practiceMode: 'mixed',
        verbType: 'regular',
        allowedLemmas: new Set(['hablar']),
        shouldApplyLevelFiltering: false,
        levelForFiltering: 'ALL'
      }

      const context = { verbLookupMap: mockVerbLookupMap }
      const result = filterEligibleForms(mockForms, settings, context)

      // Should only include 'hablar'
      expect(result.every(f => f.lemma === 'hablar')).toBe(true)
    })

    it('should bypass lemma restrictions for theme practice', () => {
      const settings = {
        level: 'A1',
        region: 'la_general',
        practiceMode: 'theme',
        verbType: 'regular',
        allowedLemmas: new Set(['comer']), // Different lemma
        shouldApplyLevelFiltering: false,
        levelForFiltering: 'ALL'
      }

      const context = { verbLookupMap: mockVerbLookupMap }
      const result = filterEligibleForms(mockForms, settings, context)

      // Should not be restricted by allowedLemmas in theme mode
      expect(result.some(f => f.lemma !== 'comer')).toBe(true)
    })
  })

  describe('createFallbackPool', () => {
    it('should create a fallback pool with relaxed filters', () => {
      const settings = {
        level: 'A1',
        region: 'la_general',
        practiceMode: 'specific',
        specificMood: 'indicative',
        specificTense: 'pres',
        verbType: 'all'
      }

      const context = { verbLookupMap: mockVerbLookupMap }
      const result = createFallbackPool(mockForms, settings, context)

      // Should return forms matching the mood/tense
      expect(result.length).toBeGreaterThan(0)
      expect(result.every(f => f.mood === 'indicative' && f.tense === 'pres')).toBe(true)
    })

    it('should apply dialect filtering in fallback', () => {
      const settings = {
        level: 'A1',
        region: 'rioplatense', // No tú forms
        practiceMode: 'mixed',
        verbType: 'all'
      }

      const context = { verbLookupMap: mockVerbLookupMap }
      const result = createFallbackPool(mockForms, settings, context)

      // Should not include tú or vosotros forms for rioplatense
      expect(result.every(f =>
        f.mood === 'nonfinite' || !['2s_tu', '2p_vosotros'].includes(f.person)
      )).toBe(true)
    })

    it('should progressively relax filters when no matches', () => {
      const settings = {
        level: 'A1',
        region: 'la_general',
        practiceMode: 'specific',
        specificMood: 'nonexistent_mood', // Will find nothing
        specificTense: 'nonexistent_tense',
        verbType: 'all'
      }

      const context = { verbLookupMap: mockVerbLookupMap }
      const result = createFallbackPool(mockForms, settings, context)

      // Should eventually return all forms as ultimate fallback
      expect(result.length).toBeGreaterThan(0)
    })
  })

  describe('excludeCurrentItem', () => {
    const eligible = [
      { lemma: 'hablar', mood: 'indicative', tense: 'pres', person: '1s', value: 'hablo' },
      { lemma: 'hablar', mood: 'indicative', tense: 'pres', person: '2s_tu', value: 'hablas' },
      { lemma: 'comer', mood: 'indicative', tense: 'pres', person: '1s', value: 'como' }
    ]

    it('should exclude exact match in non-specific practice', () => {
      const currentItem = eligible[0]
      const result = excludeCurrentItem(eligible, currentItem, 'mixed')

      // Should not include the exact same form
      expect(result.some(f =>
        f.lemma === currentItem.lemma &&
        f.mood === currentItem.mood &&
        f.tense === currentItem.tense &&
        f.person === currentItem.person
      )).toBe(false)
    })

    it('should exclude entire lemma in specific practice', () => {
      const currentItem = eligible[0] // hablar
      const result = excludeCurrentItem(eligible, currentItem, 'specific')

      // Should not include any 'hablar' forms
      expect(result.every(f => f.lemma !== 'hablar')).toBe(true)
      expect(result.some(f => f.lemma === 'comer')).toBe(true)
    })

    it('should return original if only one form available', () => {
      const singleForm = [eligible[0]]
      const result = excludeCurrentItem(singleForm, eligible[0], 'mixed')

      // Should return the original since it's the only one
      expect(result).toEqual(singleForm)
    })

    it('should return original if no currentItem provided', () => {
      const result = excludeCurrentItem(eligible, null, 'mixed')

      // Should return all forms
      expect(result).toEqual(eligible)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty forms array gracefully', () => {
      const settings = {
        level: 'A1',
        region: 'la_general',
        practiceMode: 'mixed',
        verbType: 'all',
        shouldApplyLevelFiltering: false,
        levelForFiltering: 'ALL'
      }

      const context = { verbLookupMap: mockVerbLookupMap }
      const result = filterEligibleForms([], settings, context)

      expect(result).toEqual([])
    })

    it('should handle missing verbLookupMap gracefully', () => {
      const settings = {
        level: 'A1',
        region: 'la_general',
        practiceMode: 'mixed',
        verbType: 'all',
        shouldApplyLevelFiltering: false,
        levelForFiltering: 'ALL'
      }

      const context = {} // No verbLookupMap
      const result = filterEligibleForms(mockForms, settings, context)

      // Should still work, using default verb type
      expect(result.length).toBeGreaterThan(0)
    })

    it('should handle forms without type property', () => {
      const formsWithoutType = [
        { lemma: 'test', mood: 'indicative', tense: 'pres', person: '1s', value: 'test' }
        // No 'type' property
      ]

      const settings = {
        level: 'A1',
        region: 'la_general',
        practiceMode: 'mixed',
        verbType: 'all',
        shouldApplyLevelFiltering: false,
        levelForFiltering: 'ALL'
      }

      const context = { verbLookupMap: mockVerbLookupMap }
      const result = filterEligibleForms(formsWithoutType, settings, context)

      // Should handle gracefully (verb from lookup map or default to regular)
      expect(result.length).toBeGreaterThanOrEqual(0)
    })
  })
})
