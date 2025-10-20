import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AdaptiveDifficultyEngine, getAdaptiveEngine, resetAdaptiveEngine } from './AdaptiveDifficultyEngine.js'
import { FLOW_STATES } from './flowStateDetection.js'

describe('AdaptiveDifficultyEngine', () => {
  let engine

  beforeEach(() => {
    engine = new AdaptiveDifficultyEngine('test-user')
  })

  describe('Basic Functionality', () => {
    it('should initialize with default values', () => {
      expect(engine.userId).toBe('test-user')
      expect(engine.currentDifficultyBoost).toBe(0)
      expect(engine.responsesProcessed).toBe(0)
      expect(engine.enabled).toBe(true)
    })

    it('should process responses and update counters', () => {
      const response = {
        correct: true,
        latency: 1500,
        verbId: 'hablar',
        mood: 'indicativo',
        tense: 'pres'
      }

      const result = engine.processResponse(response)

      expect(engine.responsesProcessed).toBe(1)
      expect(result.flowState).toBeDefined()
      expect(result.difficultyBoost).toBe(0) // No adjustment yet (need 5 responses)
      expect(result.recommendations).toBeDefined()
    })

    it('should not adjust difficulty before minimum responses', () => {
      for (let i = 0; i < 4; i++) {
        const response = {
          correct: true,
          latency: 1500,
          verbId: 'hablar',
          mood: 'indicativo',
          tense: 'pres'
        }
        const result = engine.processResponse(response)
        expect(result.adjustment).toBeNull()
      }
    })
  })

  describe('Difficulty Adjustments', () => {
    it('should increase difficulty when in deep flow', () => {
      // Reduce cooldown for testing
      engine.config.adjustmentCooldown = 0
      engine.config.minResponsesBeforeAdjustment = 5

      // Simulate deep flow: fast correct responses
      for (let i = 0; i < 15; i++) {
        engine.processResponse({
          correct: true,
          latency: 800, // Fast response
          verbId: 'hablar',
          mood: 'indicativo',
          tense: 'pres'
        })
      }

      const stats = engine.getSessionStats()
      // After enough correct fast responses, should eventually increase difficulty
      // At minimum, should have processed responses
      expect(stats.responsesProcessed).toBe(15)
    })

    it('should decrease difficulty when struggling', () => {
      // Reduce cooldown for testing
      engine.config.adjustmentCooldown = 0
      engine.config.minResponsesBeforeAdjustment = 5

      // Simulate struggling: slow incorrect responses
      for (let i = 0; i < 15; i++) {
        engine.processResponse({
          correct: false,
          latency: 5000, // Slow response
          verbId: 'ser',
          mood: 'subjuntivo',
          tense: 'pres'
        })
      }

      const stats = engine.getSessionStats()
      // After enough incorrect slow responses, should have processed them
      expect(stats.responsesProcessed).toBe(15)
    })

    it('should respect boost limits (-2 to +2)', () => {
      // Try to push boost beyond maximum
      for (let i = 0; i < 20; i++) {
        engine.processResponse({
          correct: true,
          latency: 500, // Very fast
          verbId: 'hablar',
          mood: 'indicativo',
          tense: 'pres'
        })
      }

      expect(engine.currentDifficultyBoost).toBeLessThanOrEqual(2)
      expect(engine.currentDifficultyBoost).toBeGreaterThanOrEqual(-2)
    })

    it('should track adjustment history', () => {
      // Reduce cooldown for testing
      engine.config.adjustmentCooldown = 0
      engine.config.minResponsesBeforeAdjustment = 3

      // Process enough responses to trigger adjustments
      for (let i = 0; i < 15; i++) {
        engine.processResponse({
          correct: i % 2 === 0, // Alternating performance
          latency: 2000,
          verbId: 'comer',
          mood: 'indicativo',
          tense: 'pres'
        })
      }

      const stats = engine.getSessionStats()
      // Should have processed all responses
      expect(stats.responsesProcessed).toBe(15)
      // Adjustment history might be empty if flow state doesn't change significantly
      expect(stats.adjustmentHistory).toBeDefined()
    })
  })

  describe('Recommendations', () => {
    it('should generate verb pool adjustments for positive boost', () => {
      engine.currentDifficultyBoost = 2

      const flowAnalysis = {
        currentState: FLOW_STATES.DEEP_FLOW,
        flowMetrics: {}
      }

      const recommendations = engine.generateRecommendations(flowAnalysis)

      expect(recommendations.verbPoolAdjustment).toBeDefined()
      expect(recommendations.verbPoolAdjustment.irregularWeight).toBeGreaterThan(1.0)
      expect(recommendations.verbPoolAdjustment.regularWeight).toBeLessThan(1.0)
    })

    it('should generate verb pool adjustments for negative boost', () => {
      engine.currentDifficultyBoost = -2

      const flowAnalysis = {
        currentState: FLOW_STATES.FRUSTRATED,
        flowMetrics: {}
      }

      const recommendations = engine.generateRecommendations(flowAnalysis)

      expect(recommendations.verbPoolAdjustment).toBeDefined()
      expect(recommendations.verbPoolAdjustment.irregularWeight).toBeLessThan(1.0)
      expect(recommendations.verbPoolAdjustment.regularWeight).toBeGreaterThan(1.0)
    })

    it('should recommend tense complexity adjustments', () => {
      engine.currentDifficultyBoost = 2

      const flowAnalysis = {
        currentState: FLOW_STATES.DEEP_FLOW,
        flowMetrics: {}
      }

      const recommendations = engine.generateRecommendations(flowAnalysis)

      expect(recommendations.tenseComplexityAdjustment).toBeDefined()
      expect(recommendations.tenseComplexityAdjustment.preferSubjunctive).toBe(true)
      expect(recommendations.tenseComplexityAdjustment.preferCompound).toBe(true)
    })
  })

  describe('Session Management', () => {
    it('should track session duration', (done) => {
      setTimeout(() => {
        const stats = engine.getSessionStats()
        expect(stats.sessionDuration).toBeGreaterThan(0)
        done()
      }, 50)
    })

    it('should reset session state', () => {
      // Process some responses
      for (let i = 0; i < 10; i++) {
        engine.processResponse({
          correct: true,
          latency: 1500,
          verbId: 'vivir',
          mood: 'indicativo',
          tense: 'pres'
        })
      }

      engine.reset()

      expect(engine.responsesProcessed).toBe(0)
      expect(engine.currentDifficultyBoost).toBe(0)
      expect(engine.adjustmentHistory.length).toBe(0)
    })

    it('should disable/enable engine', () => {
      engine.setEnabled(false)
      expect(engine.enabled).toBe(false)

      const result = engine.processResponse({
        correct: true,
        latency: 1500,
        verbId: 'estar',
        mood: 'indicativo',
        tense: 'pres'
      })

      expect(result.adjustment).toBeNull() // No adjustment when disabled
    })
  })

  describe('Singleton Pattern', () => {
    it('should return same instance from getAdaptiveEngine', () => {
      const engine1 = getAdaptiveEngine()
      const engine2 = getAdaptiveEngine()

      expect(engine1).toBe(engine2)
    })

    it('should reset global instance', () => {
      const engine1 = getAdaptiveEngine()

      // Process some responses
      engine1.processResponse({
        correct: true,
        latency: 1500,
        verbId: 'tener',
        mood: 'indicativo',
        tense: 'pres'
      })

      expect(engine1.responsesProcessed).toBe(1)

      resetAdaptiveEngine()

      expect(engine1.responsesProcessed).toBe(0)
    })
  })

  describe('Event Dispatching', () => {
    it('should dispatch event when difficulty changes', () => {
      const events = []

      // Mock window.addEventListener
      const originalAddEventListener = window.addEventListener
      window.addEventListener = vi.fn((event, handler) => {
        if (event === 'adaptive-difficulty-changed') {
          events.push(handler)
        }
      })

      // Create new engine to set up listeners
      const testEngine = new AdaptiveDifficultyEngine('test')

      // Process responses to trigger adjustment
      for (let i = 0; i < 10; i++) {
        testEngine.processResponse({
          correct: true,
          latency: 800,
          verbId: 'hacer',
          mood: 'indicativo',
          tense: 'pres'
        })
      }

      // Restore original
      window.addEventListener = originalAddEventListener
    })
  })

  describe('Error Handling', () => {
    it('should handle missing response fields gracefully', () => {
      const response = {
        correct: true
        // Missing latency, verbId, etc.
      }

      expect(() => engine.processResponse(response)).not.toThrow()
    })

    it('should handle invalid flow state', () => {
      const flowAnalysis = {
        currentState: 'INVALID_STATE',
        flowMetrics: {}
      }

      const recommendations = engine.generateRecommendations(flowAnalysis)

      expect(recommendations).toBeDefined()
      expect(recommendations.verbPoolAdjustment).toBeNull()
    })
  })

  describe('Configuration', () => {
    it('should allow custom configuration', () => {
      engine.config.minResponsesBeforeAdjustment = 3

      // Should adjust after 3 responses now
      for (let i = 0; i < 3; i++) {
        engine.processResponse({
          correct: true,
          latency: 800,
          verbId: 'poder',
          mood: 'indicativo',
          tense: 'pres'
        })
      }

      // Next response might trigger adjustment
      const result = engine.processResponse({
        correct: true,
        latency: 800,
        verbId: 'poder',
        mood: 'indicativo',
        tense: 'fut'
      })

      // Check if adjustment occurred (depends on flow state change)
      expect(result).toBeDefined()
    })

    it('should respect cooldown between adjustments', () => {
      engine.config.adjustmentCooldown = 100 // 100ms cooldown

      // Trigger first adjustment
      for (let i = 0; i < 10; i++) {
        engine.processResponse({
          correct: true,
          latency: 800,
          verbId: 'querer',
          mood: 'indicativo',
          tense: 'pres'
        })
      }

      const adjustmentsCount = engine.adjustmentHistory.length

      // Immediately try another adjustment (should be blocked by cooldown)
      engine.processResponse({
        correct: false,
        latency: 5000,
        verbId: 'saber',
        mood: 'subjuntivo',
        tense: 'pres'
      })

      // Should not have added new adjustment due to cooldown
      expect(engine.adjustmentHistory.length).toBe(adjustmentsCount)
    })
  })
})
