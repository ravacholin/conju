/**
 * Tests for prioritizer utils
 * Verifies utility functions work correctly
 */

import { describe, it, expect } from 'vitest'
import {
  getTenseKey,
  parseTenseKey,
  getTenseFamily,
  getFormComplexity,
  getLevelBaseComplexity,
  removeDuplicateTenses
} from '../utils.js'

describe('Prioritizer Utils', () => {
  describe('getTenseKey', () => {
    it('should create tense key from mood and tense', () => {
      expect(getTenseKey('indicative', 'pres')).toBe('indicative|pres')
      expect(getTenseKey('subjunctive', 'subjPres')).toBe('subjunctive|subjPres')
    })
  })

  describe('parseTenseKey', () => {
    it('should parse tense key into mood and tense', () => {
      const result = parseTenseKey('indicative|pres')
      expect(result.mood).toBe('indicative')
      expect(result.tense).toBe('pres')
    })
  })

  describe('getTenseFamily', () => {
    it('should identify present family', () => {
      expect(getTenseFamily('indicative', 'pres')).toBe('present')
    })

    it('should identify past family', () => {
      expect(getTenseFamily('indicative', 'pretIndef')).toBe('past')
      expect(getTenseFamily('indicative', 'impf')).toBe('past')
    })

    it('should identify perfect family', () => {
      expect(getTenseFamily('indicative', 'pretPerf')).toBe('perfect')
      expect(getTenseFamily('indicative', 'plusc')).toBe('perfect')
    })

    it('should identify subjunctive families', () => {
      expect(getTenseFamily('subjunctive', 'subjPres')).toBe('subjunctive_pres')
      expect(getTenseFamily('subjunctive', 'subjImpf')).toBe('subjunctive_past')
    })

    it('should return "other" for unknown tenses', () => {
      expect(getTenseFamily('unknown', 'unknown')).toBe('other')
    })
  })

  describe('getFormComplexity', () => {
    it('should return complexity for known forms', () => {
      expect(getFormComplexity({ mood: 'indicative', tense: 'pres' })).toBe(1)
      expect(getFormComplexity({ mood: 'indicative', tense: 'pretIndef' })).toBe(3)
      expect(getFormComplexity({ mood: 'subjunctive', tense: 'subjPres' })).toBe(7)
      expect(getFormComplexity({ mood: 'subjunctive', tense: 'subjPlusc' })).toBe(9)
    })

    it('should return default complexity for unknown forms', () => {
      expect(getFormComplexity({ mood: 'unknown', tense: 'unknown' })).toBe(5)
    })
  })

  describe('getLevelBaseComplexity', () => {
    it('should return correct base complexity for each level', () => {
      expect(getLevelBaseComplexity('A1')).toBe(1.5)
      expect(getLevelBaseComplexity('A2')).toBe(3.0)
      expect(getLevelBaseComplexity('B1')).toBe(5.0)
      expect(getLevelBaseComplexity('B2')).toBe(7.0)
      expect(getLevelBaseComplexity('C1')).toBe(8.0)
      expect(getLevelBaseComplexity('C2')).toBe(9.0)
    })

    it('should return default for unknown level', () => {
      expect(getLevelBaseComplexity('Unknown')).toBe(5.0)
    })
  })

  describe('removeDuplicateTenses', () => {
    it('should remove duplicate tenses based on key', () => {
      const tenses = [
        { mood: 'indicative', tense: 'pres', key: 'indicative|pres' },
        { mood: 'indicative', tense: 'pres', key: 'indicative|pres' },
        { mood: 'subjunctive', tense: 'subjPres', key: 'subjunctive|subjPres' }
      ]

      const result = removeDuplicateTenses(tenses)
      expect(result.length).toBe(2)
      expect(result[0].key).toBe('indicative|pres')
      expect(result[1].key).toBe('subjunctive|subjPres')
    })

    it('should handle tenses without key property', () => {
      const tenses = [
        { mood: 'indicative', tense: 'pres' },
        { mood: 'indicative', tense: 'pres' },
        { mood: 'subjunctive', tense: 'subjPres' }
      ]

      const result = removeDuplicateTenses(tenses)
      expect(result.length).toBe(2)
    })

    it('should return empty array for empty input', () => {
      expect(removeDuplicateTenses([])).toEqual([])
    })
  })
})
