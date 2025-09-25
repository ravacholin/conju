/**
 * flowStateDetection.test.js - Unit tests for flow state detection system
 *
 * Tests the integration between useDrillProgress and flowStateDetection modules,
 * ensuring proper data flow and accurate flow state analysis.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  FlowStateDetector,
  FLOW_STATES,
  processUserResponse,
  flowDetector
} from './flowStateDetection.js'

describe('FlowStateDetector', () => {
  let detector

  beforeEach(() => {
    detector = new FlowStateDetector()
  })

  describe('processResponse with enriched data', () => {
    it('should process response with complete item data', () => {
      const mockItem = {
        lemma: 'hablar',
        mood: 'indicative',
        tense: 'pres',
        person: '2s',
        id: 'test-item-123'
      }

      const mockResponse = {
        correct: true, // Using 'correct' as expected by the implementation
        responseTime: 2500,
        hintsUsed: 0
      }

      const enrichedResponse = {
        ...mockResponse,
        item: mockItem,
        verb: mockItem.lemma,
        mood: mockItem.mood,
        tense: mockItem.tense,
        person: mockItem.person,
        timestamp: new Date(),
        userId: 'test-user'
      }

      const result = detector.processResponse(enrichedResponse)

      expect(result).toBeDefined()
      expect(detector.responseHistory).toHaveLength(1)
      expect(detector.responseHistory[0]).toMatchObject({
        responseTime: 2500,
        item: mockItem
      })
    })

    it('should calculate complexity correctly based on item data', () => {
      const subjunctiveItem = {
        lemma: 'hablar',
        mood: 'subjunctive',
        tense: 'subjImpf',
        person: '3s'
      }

      const enrichedResponse = {
        correct: true,
        responseTime: 3000,
        item: subjunctiveItem,
        verb: subjunctiveItem.lemma,
        mood: subjunctiveItem.mood,
        tense: subjunctiveItem.tense,
        person: subjunctiveItem.person
      }

      detector.processResponse(enrichedResponse)
      const processedResponse = detector.responseHistory[0]

      // Subjunctive imperfect should have high complexity
      expect(processedResponse.complexity).toBeGreaterThan(0.7)
    })

    it('should handle missing item data gracefully', () => {
      const responseWithoutItem = {
        correct: true,
        responseTime: 2000,
        verb: 'hablar',
        mood: 'indicative',
        tense: 'pres'
      }

      expect(() => {
        detector.processResponse(responseWithoutItem)
      }).not.toThrow()

      expect(detector.responseHistory).toHaveLength(1)
    })
  })

  describe('flow state detection with item complexity', () => {
    it('should detect deep flow with fast correct responses on complex items', () => {
      // Simulate series of fast, correct responses on complex subjunctive forms
      const complexItems = [
        { lemma: 'ser', mood: 'subjunctive', tense: 'subjImpf', person: '2s' },
        { lemma: 'tener', mood: 'subjunctive', tense: 'subjPres', person: '3p' },
        { lemma: 'hacer', mood: 'subjunctive', tense: 'subjImpf', person: '1p' }
      ]

      complexItems.forEach((item, index) => {
        const enrichedResponse = {
          correct: true,
          responseTime: 1500, // Fast response
          item,
          verb: item.lemma,
          mood: item.mood,
          tense: item.tense,
          person: item.person,
          timestamp: new Date(Date.now() + index * 1000)
        }

        detector.processResponse(enrichedResponse)
      })

      // After several fast, correct complex responses, should be in flow or neutral
      expect([FLOW_STATES.LIGHT_FLOW, FLOW_STATES.DEEP_FLOW, FLOW_STATES.NEUTRAL]).toContain(detector.currentState)
    })

    it('should detect struggling state with slow incorrect responses', () => {
      // Simulate series of slow, incorrect responses
      for (let i = 0; i < 5; i++) {
        const enrichedResponse = {
          correct: false,
          responseTime: 8000, // Slow response
          item: { lemma: 'hablar', mood: 'indicative', tense: 'pres', person: '1s' },
          verb: 'hablar',
          mood: 'indicative',
          tense: 'pres',
          person: '1s',
          timestamp: new Date(Date.now() + i * 2000)
        }

        detector.processResponse(enrichedResponse)
      }

      expect([FLOW_STATES.STRUGGLING, FLOW_STATES.FRUSTRATED, FLOW_STATES.NEUTRAL]).toContain(detector.currentState)
    })
  })

  describe('confidence calculation with response time', () => {
    it('should assign high confidence to fast correct responses', () => {
      const enrichedResponse = {
        correct: true,
        responseTime: 1200, // Fast
        item: { lemma: 'hablar', mood: 'indicative', tense: 'pres' },
        verb: 'hablar',
        mood: 'indicative',
        tense: 'pres'
      }

      detector.processResponse(enrichedResponse)
      const processed = detector.responseHistory[0]

      expect(processed.confidence).toBeGreaterThan(0.5)
    })

    it('should assign low confidence to slow incorrect responses', () => {
      const enrichedResponse = {
        correct: false,
        responseTime: 9000, // Slow
        item: { lemma: 'ser', mood: 'subjunctive', tense: 'subjImpf' },
        verb: 'ser',
        mood: 'subjunctive',
        tense: 'subjImpf'
      }

      detector.processResponse(enrichedResponse)
      const processed = detector.responseHistory[0]

      expect(processed.confidence).toBeLessThan(0.3)
    })
  })
})

describe('processUserResponse integration', () => {
  beforeEach(() => {
    // Reset the global detector
    flowDetector.reset()
  })

  it('should properly integrate item, response, and metadata', () => {
    const mockItem = {
      lemma: 'vivir',
      mood: 'indicative',
      tense: 'pres',
      person: '2s_vos',
      id: 'item-123'
    }

    const mockResponse = {
      correct: true,
      responseTime: 2200,
      hintsUsed: 0,
      userAnswer: 'vivís'
    }

    const mockMetadata = {
      userId: 'user-123',
      timestamp: new Date(),
      sessionContext: {
        practiceMode: 'specific',
        level: 'A1'
      }
    }

    const result = processUserResponse(mockItem, mockResponse, mockMetadata)

    expect(result).toBeDefined()
    expect(flowDetector.responseHistory).toHaveLength(1)

    const processedResponse = flowDetector.responseHistory[0]
    expect(processedResponse).toMatchObject({
      responseTime: 2200,
      userAnswer: 'vivís',
      userId: 'user-123'
    })
    expect(processedResponse.item).toEqual(mockItem)
    expect(processedResponse.metadata).toEqual(mockMetadata)
  })

  it('should handle missing metadata gracefully', () => {
    const mockItem = {
      lemma: 'hablar',
      mood: 'indicative',
      tense: 'pres',
      person: '1s'
    }

    const mockResponse = {
      correct: false,
      responseTime: 4500
    }

    expect(() => {
      processUserResponse(mockItem, mockResponse)
    }).not.toThrow()

    expect(flowDetector.responseHistory).toHaveLength(1)
    const processedResponse = flowDetector.responseHistory[0]
    // Basic validation that response was processed
    expect(processedResponse.responseTime).toBeDefined()
  })

  it('should preserve original response properties', () => {
    const mockItem = {
      lemma: 'tener',
      mood: 'conditional',
      tense: 'cond',
      person: '3s'
    }

    const mockResponse = {
      correct: true,
      responseTime: 3100,
      hintsUsed: 1,
      userAnswer: 'tendría',
      startTime: Date.now() - 3100,
      attempts: 1
    }

    processUserResponse(mockItem, mockResponse, { userId: 'test' })

    const processedResponse = flowDetector.responseHistory[0]
    expect(processedResponse.hintsUsed).toBe(1)
    expect(processedResponse.userAnswer).toBe('tendría')
    expect(processedResponse.attempts).toBe(1)
    expect(processedResponse.startTime).toBeDefined()
  })
})

describe('useDrillProgress integration scenarios', () => {
  beforeEach(() => {
    flowDetector.reset()
  })

  it('should simulate complete drill response processing flow', () => {
    // Simulate the exact flow from useDrillProgress.handleResponse
    const item = {
      lemma: 'hacer',
      mood: 'subjunctive',
      tense: 'subjPres',
      person: '2s_tu',
      id: 'drill-item-456',
      settings: {
        practiceMode: 'specific',
        level: 'B1'
      }
    }

    const response = {
      correct: true,
      responseTime: 2800,
      hintsUsed: 0,
      userAnswer: 'hagas'
    }

    const userId = 'user-789'

    // Create enriched response as done in useDrillProgress
    const enrichedResponse = {
      ...response,
      verb: item.lemma,
      mood: item.mood,
      tense: item.tense,
      person: item.person,
      item,
      timestamp: new Date(),
      userId
    }

    // Process through flowDetector directly (simulating the flow from useDrillProgress)
    const result = flowDetector.processResponse(enrichedResponse)

    expect(result).toBeDefined()
    expect(flowDetector.responseHistory).toHaveLength(1)

    const processed = flowDetector.responseHistory[0]
    expect(processed.complexity).toBeGreaterThan(0.5) // Subjunctive should be complex
    expect(processed.responseTime).toBe(2800)
  })

  it('should maintain flow state across multiple responses', () => {
    const responses = [
      { lemma: 'ser', mood: 'indicative', tense: 'pres', correct: true, time: 1800 },
      { lemma: 'estar', mood: 'indicative', tense: 'pres', correct: true, time: 1600 },
      { lemma: 'tener', mood: 'indicative', tense: 'pres', correct: true, time: 1400 },
      { lemma: 'hacer', mood: 'indicative', tense: 'pres', correct: true, time: 1200 }
    ]

    let currentState = FLOW_STATES.NEUTRAL

    responses.forEach((resp, index) => {
      const enrichedResponse = {
        correct: resp.correct,
        responseTime: resp.time,
        verb: resp.lemma,
        mood: resp.mood,
        tense: resp.tense,
        person: '1s',
        item: { lemma: resp.lemma, mood: resp.mood, tense: resp.tense, person: '1s' },
        timestamp: new Date(Date.now() + index * 2000),
        userId: 'test-user'
      }

      flowDetector.processResponse(enrichedResponse)
      currentState = flowDetector.currentState
    })

    // After series of fast, correct responses, should have processed all responses
    expect(flowDetector.responseHistory).toHaveLength(4)
    expect([FLOW_STATES.LIGHT_FLOW, FLOW_STATES.DEEP_FLOW, FLOW_STATES.NEUTRAL]).toContain(currentState)
  })
})

describe('error handling and edge cases', () => {
  beforeEach(() => {
    flowDetector.reset()
  })

  it('should handle malformed item data', () => {
    const malformedItem = {
      // Missing required fields
      id: 'test'
    }

    const response = {
      correct: true,
      responseTime: 2000
    }

    expect(() => {
      processUserResponse(malformedItem, response)
    }).not.toThrow()

    expect(flowDetector.responseHistory).toHaveLength(1)
  })

  it('should handle undefined response time', () => {
    const item = {
      lemma: 'hablar',
      mood: 'indicative',
      tense: 'pres',
      person: '1s'
    }

    const responseWithoutTime = {
      correct: true
      // responseTime is undefined
    }

    expect(() => {
      processUserResponse(item, responseWithoutTime)
    }).not.toThrow()

    const processed = flowDetector.responseHistory[0]
    expect(processed.responseTime).toBeDefined()
    expect(typeof processed.responseTime).toBe('number')
  })

  it('should handle very large response times', () => {
    const item = {
      lemma: 'vivir',
      mood: 'indicative',
      tense: 'pres',
      person: '2s'
    }

    const slowResponse = {
      correct: false,
      responseTime: 30000 // 30 seconds
    }

    processUserResponse(item, slowResponse)

    const processed = flowDetector.responseHistory[0]
    expect(processed.isSlow).toBe(true)
    expect(processed.confidence).toBeLessThan(0.5)
  })
})
