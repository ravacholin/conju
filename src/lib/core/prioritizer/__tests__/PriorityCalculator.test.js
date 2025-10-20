/**
 * Tests for PriorityCalculator
 * Verifies priority and weight calculations
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { PriorityCalculator } from '../PriorityCalculator.js'
import { CurriculumProcessor } from '../CurriculumProcessor.js'
import { ProgressAssessor } from '../ProgressAssessor.js'

describe('PriorityCalculator', () => {
  let calculator
  let curriculum
  let assessor

  beforeEach(() => {
    curriculum = new CurriculumProcessor()
    assessor = new ProgressAssessor(curriculum)
    calculator = new PriorityCalculator(curriculum, assessor)
  })

  describe('calculateAdvancedPriority', () => {
    it('should calculate priority for a tense', () => {
      const tense = {
        key: 'indicative|pres',
        mood: 'indicative',
        tense: 'pres',
        complexity: 1,
        introducedAt: 'A1',
        family: 'basic_present'
      }
      const masteryMap = new Map()

      const priority = calculator.calculateAdvancedPriority(tense, 'A1', masteryMap)

      expect(typeof priority).toBe('number')
      expect(priority).toBeGreaterThan(0)
    })

    it('should give higher priority to level-appropriate tenses', () => {
      const coreTense = {
        key: 'indicative|pres',
        complexity: 1,
        introducedAt: 'A1',
        family: 'basic_present'
      }
      const reviewTense = {
        key: 'indicative|pretIndef',
        complexity: 3,
        introducedAt: 'A2',
        family: 'past_narrative'
      }
      const masteryMap = new Map()

      const corePriority = calculator.calculateAdvancedPriority(coreTense, 'A1', masteryMap)
      const reviewPriority = calculator.calculateAdvancedPriority(reviewTense, 'A1', masteryMap)

      // Core tense for level should have higher priority
      expect(corePriority).toBeGreaterThan(reviewPriority)
    })
  })

  describe('calculateUrgency', () => {
    it('should calculate urgency score', () => {
      const tense = {
        key: 'subjunctive|subjPres',
        family: 'subjunctive_present'
      }
      const masteryMap = new Map()

      const urgency = calculator.calculateUrgency(tense, 'B1', masteryMap)

      expect(typeof urgency).toBe('number')
      expect(urgency).toBeGreaterThanOrEqual(0)
      expect(urgency).toBeLessThanOrEqual(100)
    })

    it('should give higher urgency to level-critical tenses', () => {
      const criticalTense = {
        key: 'subjunctive|subjPres',
        family: 'subjunctive_present'
      }
      const normalTense = {
        key: 'indicative|pres',
        family: 'basic_present'
      }
      const masteryMap = new Map()

      const criticalUrgency = calculator.calculateUrgency(criticalTense, 'B1', masteryMap)
      const normalUrgency = calculator.calculateUrgency(normalTense, 'B1', masteryMap)

      // subjPres is critical for B1
      expect(criticalUrgency).toBeGreaterThan(normalUrgency)
    })
  })

  describe('calculatePedagogicalValue', () => {
    it('should calculate pedagogical value', () => {
      const tense = {
        key: 'indicative|pres',
        complexity: 1,
        family: 'basic_present'
      }

      const value = calculator.calculatePedagogicalValue(tense, 'A1')

      expect(typeof value).toBe('number')
      expect(value).toBeGreaterThan(0)
    })

    it('should value foundational tenses highly', () => {
      const foundationalTense = {
        key: 'indicative|pres',
        complexity: 1,
        family: 'basic_present'
      }
      const otherTense = {
        key: 'nonfinite|ger',
        complexity: 2,
        family: 'nonfinite_basics'
      }

      const foundationalValue = calculator.calculatePedagogicalValue(foundationalTense, 'A1')
      const otherValue = calculator.calculatePedagogicalValue(otherTense, 'A1')

      // Present indicative is highly foundational
      expect(foundationalValue).toBeGreaterThan(otherValue)
    })
  })

  describe('calculateDynamicWeights', () => {
    it('should calculate dynamic weights', () => {
      const weights = calculator.calculateDynamicWeights('B1', null)

      expect(weights).toBeDefined()
      expect(weights.core).toBeDefined()
      expect(weights.review).toBeDefined()
      expect(weights.exploration).toBeDefined()

      // Weights should sum to approximately 1.0
      const sum = weights.core + weights.review + weights.exploration
      expect(sum).toBeCloseTo(1.0, 1)
    })

    it('should adjust weights based on mastery', () => {
      const lowProgress = [
        { mood: 'indicative', tense: 'pres', score: 20 }
      ]
      const highProgress = [
        { mood: 'indicative', tense: 'pres', score: 85 },
        { mood: 'indicative', tense: 'pretIndef', score: 80 }
      ]

      const lowWeights = calculator.calculateDynamicWeights('A2', lowProgress)
      const highWeights = calculator.calculateDynamicWeights('A2', highProgress)

      // Low mastery should focus more on core
      expect(lowWeights.core).toBeGreaterThan(highWeights.core)

      // High mastery should allow more exploration
      expect(highWeights.exploration).toBeGreaterThan(lowWeights.exploration)
    })
  })

  describe('isPrerequisiteForLevel', () => {
    it('should identify prerequisites', () => {
      // Present indicative is a prerequisite for many B1 tenses
      const isPrereq = calculator.isPrerequisiteForLevel('indicative|pres', 'B1')

      expect(typeof isPrereq).toBe('boolean')
      expect(isPrereq).toBe(true)
    })

    it('should return false for non-prerequisites', () => {
      // C2 tense is not a prerequisite for A1
      const isPrereq = calculator.isPrerequisiteForLevel('subjunctive|subjPlusc', 'A1')

      expect(isPrereq).toBe(false)
    })
  })

  describe('applyAdvancedProgressAdjustments', () => {
    it('should adjust tense priorities based on progress', () => {
      const tenses = [
        { key: 'indicative|pres', priority: 50, complexity: 1 },
        { key: 'subjunctive|subjPres', priority: 50, complexity: 7 }
      ]
      const progress = [
        { mood: 'indicative', tense: 'pres', score: 85 },
        { mood: 'subjunctive', tense: 'subjPres', score: 30 }
      ]

      const adjusted = calculator.applyAdvancedProgressAdjustments(tenses, progress)

      expect(Array.isArray(adjusted)).toBe(true)
      expect(adjusted.length).toBe(2)

      // Should have mastery and readiness added
      expect(adjusted[0].mastery).toBeDefined()
      expect(adjusted[0].readiness).toBeDefined()
    })

    it('should handle null progress gracefully', () => {
      const tenses = [
        { key: 'indicative|pres', priority: 50 }
      ]

      const adjusted = calculator.applyAdvancedProgressAdjustments(tenses, null)

      expect(adjusted).toEqual(tenses) // Should return unchanged
    })
  })
})
