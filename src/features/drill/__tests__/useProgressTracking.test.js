/**
 * Tests para useProgressTracking hook
 * Verifica la integración con pronunciación y el tracking completo de telemetría
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useProgressTracking } from '../useProgressTracking.js'

// Mock dependencies
vi.mock('../tracking.js', () => ({
  trackAttemptStarted: vi.fn(),
  trackAttemptSubmitted: vi.fn(),
  trackHintShown: vi.fn(),
  trackStreakIncremented: vi.fn(),
  trackTenseDrillStarted: vi.fn(),
  trackTenseDrillEnded: vi.fn()
}))

vi.mock('../../../lib/progress/userManager.js', () => ({
  incrementSessionCount: vi.fn(),
  getCurrentUserId: vi.fn()
}))

vi.mock('../../../lib/progress/index.js', () => ({
  isProgressSystemInitialized: vi.fn(),
  onProgressSystemReady: vi.fn()
}))

vi.mock('../../../lib/utils/logger.js', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  })
}))

import {
  trackAttemptStarted,
  trackAttemptSubmitted,
  trackHintShown,
  trackStreakIncremented,
  trackTenseDrillStarted,
  trackTenseDrillEnded
} from '../tracking.js'

import {
  incrementSessionCount,
  getCurrentUserId
} from '../../../lib/progress/userManager.js'

import {
  isProgressSystemInitialized,
  onProgressSystemReady
} from '../../../lib/progress/index.js'

describe('useProgressTracking', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default mocks
    isProgressSystemInitialized.mockReturnValue(true)
    onProgressSystemReady.mockReturnValue(() => {}) // Unsubscribe function
    getCurrentUserId.mockReturnValue('test-user-id')
    trackAttemptStarted.mockReturnValue('attempt-123')
  })

  describe('Initialization', () => {
    it('should initialize progress system when ready', () => {
      const currentItem = {
        id: 'test-item',
        verb: 'hablar',
        value: 'hablo'
      }

      renderHook(() => useProgressTracking(currentItem, vi.fn()))

      expect(getCurrentUserId).toHaveBeenCalled()
      expect(incrementSessionCount).toHaveBeenCalledWith('test-user-id')
      expect(trackAttemptStarted).toHaveBeenCalledWith(currentItem)
    })

    it('should wait for progress system to be ready', () => {
      isProgressSystemInitialized.mockReturnValue(false)

      const currentItem = {
        id: 'test-item',
        verb: 'hablar',
        value: 'hablo'
      }

      renderHook(() => useProgressTracking(currentItem, vi.fn()))

      expect(trackAttemptStarted).not.toHaveBeenCalled()
    })

    it('should handle progress system becoming ready', () => {
      isProgressSystemInitialized.mockReturnValue(false)
      let readyCallback

      onProgressSystemReady.mockImplementation((callback) => {
        readyCallback = callback
        return () => {} // Unsubscribe
      })

      const currentItem = {
        id: 'test-item',
        verb: 'hablar',
        value: 'hablo'
      }

      renderHook(() => useProgressTracking(currentItem, vi.fn()))

      expect(trackAttemptStarted).not.toHaveBeenCalled()

      // Simulate progress system becoming ready
      act(() => {
        readyCallback(true)
      })

      expect(trackAttemptStarted).toHaveBeenCalledWith(currentItem)
    })
  })

  describe('Pronunciation Item Tracking', () => {
    it('should track pronunciation items correctly', () => {
      const pronunciationItem = {
        id: 'hablar|pres|1s',
        verb: 'hablar',
        value: 'hablo',
        mood: 'indicative',
        tense: 'pres',
        person: '1s',
        type: 'pronunciation',
        meta: {
          exerciseType: 'pronunciation',
          targetForm: 'hablo',
          audioKey: 'hablar_pres_1s',
          difficulty: 'medium'
        }
      }

      renderHook(() => useProgressTracking(pronunciationItem, vi.fn()))

      expect(trackAttemptStarted).toHaveBeenCalledWith(pronunciationItem)
    })

    it('should handle null currentItem gracefully', () => {
      renderHook(() => useProgressTracking(null, vi.fn()))

      expect(trackAttemptStarted).not.toHaveBeenCalled()
    })

    it('should handle item changes', () => {
      const item1 = { id: 'item-1', verb: 'hablar', value: 'hablo' }
      const item2 = { id: 'item-2', verb: 'comer', value: 'como' }

      const { rerender } = renderHook(
        ({ currentItem }) => useProgressTracking(currentItem, vi.fn()),
        { initialProps: { currentItem: item1 } }
      )

      expect(trackAttemptStarted).toHaveBeenCalledWith(item1)

      rerender({ currentItem: item2 })

      expect(trackAttemptStarted).toHaveBeenCalledWith(item2)
      expect(trackAttemptStarted).toHaveBeenCalledTimes(2)
    })
  })

  describe('Result Handling', () => {
    it('should handle pronunciation results with full metadata', async () => {
      const mockOnResult = vi.fn()
      const currentItem = {
        id: 'hablar|pres|1s',
        verb: 'hablar',
        value: 'hablo',
        type: 'pronunciation'
      }

      const { result } = renderHook(() => useProgressTracking(currentItem, mockOnResult))

      const pronunciationResult = {
        correct: true,
        latencyMs: 1500,
        hintsUsed: 0,
        errorTags: [],
        userAnswer: 'hablo',
        correctAnswer: 'hablo',
        meta: {
          type: 'pronunciation',
          target: 'hablo',
          recognized: 'hablo',
          accuracy: 95,
          pedagogicalScore: 95,
          semanticType: 'exact_match',
          confidence: 0.9,
          timing: 1500
        }
      }

      await act(async () => {
        await result.current.handleResult(pronunciationResult)
      })

      expect(mockOnResult).toHaveBeenCalledWith(pronunciationResult)
      expect(trackAttemptSubmitted).toHaveBeenCalledWith(
        'attempt-123',
        expect.objectContaining({
          correct: true,
          latencyMs: expect.any(Number),
          hintsUsed: 0,
          errorTags: [],
          userAnswer: 'hablo',
          correctAnswer: 'hablo',
          item: currentItem
        })
      )
    })

    it('should handle incorrect pronunciation results', async () => {
      const mockOnResult = vi.fn()
      const currentItem = {
        id: 'hablar|pres|1s',
        verb: 'hablar',
        value: 'hablo',
        type: 'pronunciation'
      }

      const { result } = renderHook(() => useProgressTracking(currentItem, mockOnResult))

      const incorrectResult = {
        correct: false,
        latencyMs: 2000,
        hintsUsed: 0,
        errorTags: ['pronunciation-error'],
        userAnswer: 'ablo',
        correctAnswer: 'hablo',
        meta: {
          type: 'pronunciation',
          accuracy: 70,
          semanticType: 'minor_pronunciation'
        }
      }

      await act(async () => {
        await result.current.handleResult(incorrectResult)
      })

      expect(trackAttemptSubmitted).toHaveBeenCalledWith(
        'attempt-123',
        expect.objectContaining({
          correct: false,
          latencyMs: expect.any(Number),
          hintsUsed: 0,
          errorTags: ['pronunciation-error'],
          userAnswer: 'ablo',
          correctAnswer: 'hablo',
          item: currentItem
        })
      )
    })

    it('should forward composite answers for double attempts', async () => {
      const mockOnResult = vi.fn()
      const currentItem = { id: 'double-item', verb: 'hablar', value: 'hablo' }

      const { result } = renderHook(() => useProgressTracking(currentItem, mockOnResult))

      const doubleAttemptResult = {
        correct: false,
        latencyMs: 1800,
        hintsUsed: 1,
        errorTags: ['wrong-person', 'accent'],
        userAnswer: { first: 'hablas', second: 'habláis' },
        correctAnswer: { first: 'hablo', second: 'hablamos' }
      }

      await act(async () => {
        await result.current.handleResult(doubleAttemptResult)
      })

      expect(mockOnResult).toHaveBeenCalledWith(doubleAttemptResult)
      expect(trackAttemptSubmitted).toHaveBeenCalledWith(
        'attempt-123',
        expect.objectContaining({
          correct: false,
          latencyMs: expect.any(Number),
          hintsUsed: 1,
          errorTags: ['wrong-person', 'accent'],
          userAnswer: { first: 'hablas', second: 'habláis' },
          correctAnswer: { first: 'hablo', second: 'hablamos' },
          item: currentItem
        })
      )
    })

    it('should handle legacy result format (backwards compatibility)', async () => {
      const mockOnResult = vi.fn()
      const currentItem = { id: 'test-item', verb: 'hablar', value: 'hablo' }

      const { result } = renderHook(() => useProgressTracking(currentItem, mockOnResult))

      // Legacy format: (isCorrect, accuracy, meta)
      const legacyResult = {
        isCorrect: true,
        accuracy: 90,
        meta: {
          type: 'pronunciation',
          target: 'hablo'
        }
      }

      await act(async () => {
        await result.current.handleResult(legacyResult)
      })

      expect(mockOnResult).toHaveBeenCalledWith(legacyResult)
    })
  })

  describe('Error Handling', () => {
    it('should handle tracking errors gracefully', async () => {
      trackAttemptSubmitted.mockRejectedValue(new Error('Tracking failed'))

      const currentItem = { id: 'test-item', verb: 'hablar', value: 'hablo' }
      const { result } = renderHook(() => useProgressTracking(currentItem, vi.fn()))

      const pronunciationResult = {
        correct: true,
        latencyMs: 1500,
        hintsUsed: 0,
        errorTags: [],
        userAnswer: 'hablo',
        correctAnswer: 'hablo'
      }

      // Should not throw
      await act(async () => {
        await expect(result.current.handleResult(pronunciationResult)).resolves.toBeUndefined()
      })
    })

    it('should handle missing user ID', () => {
      getCurrentUserId.mockReturnValue(null)

      const currentItem = { id: 'test-item', verb: 'hablar', value: 'hablo' }
      renderHook(() => useProgressTracking(currentItem, vi.fn()))

      expect(incrementSessionCount).not.toHaveBeenCalled()
    })

    it('should handle attempt start errors', () => {
      trackAttemptStarted.mockImplementation(() => {
        throw new Error('Start failed')
      })

      const currentItem = { id: 'test-item', verb: 'hablar', value: 'hablo' }

      expect(() => {
        renderHook(() => useProgressTracking(currentItem, vi.fn()))
      }).not.toThrow()
    })
  })

  describe('Hint and Streak Tracking', () => {
    it('should track hints shown', async () => {
      const { result } = renderHook(() => useProgressTracking(null, vi.fn()))

      await act(async () => {
        await result.current.handleHintShown()
      })

      expect(trackHintShown).toHaveBeenCalled()
    })

    it('should track streak increments', async () => {
      const { result } = renderHook(() => useProgressTracking(null, vi.fn()))

      await act(async () => {
        await result.current.handleStreakIncremented()
      })

      expect(trackStreakIncremented).toHaveBeenCalled()
    })

    it('should track tense drill start/end', async () => {
      const { result } = renderHook(() => useProgressTracking(null, vi.fn()))

      await act(async () => {
        await result.current.handleTenseDrillStarted('pres')
      })

      expect(trackTenseDrillStarted).toHaveBeenCalledWith('pres')

      await act(async () => {
        await result.current.handleTenseDrillEnded('pres')
      })

      expect(trackTenseDrillEnded).toHaveBeenCalledWith('pres')
    })

    it('should handle tracking when progress system not ready', async () => {
      isProgressSystemInitialized.mockReturnValue(false)

      const { result } = renderHook(() => useProgressTracking(null, vi.fn()))

      await act(async () => {
        await result.current.handleHintShown()
        await result.current.handleStreakIncremented()
      })

      expect(trackHintShown).not.toHaveBeenCalled()
      expect(trackStreakIncremented).not.toHaveBeenCalled()
    })
  })

  describe('Session Management', () => {
    it('should initialize session only once', () => {
      const item1 = { id: 'item-1', verb: 'hablar', value: 'hablo' }
      const item2 = { id: 'item-2', verb: 'comer', value: 'como' }

      const { rerender } = renderHook(
        ({ currentItem }) => useProgressTracking(currentItem, vi.fn()),
        { initialProps: { currentItem: item1 } }
      )

      expect(incrementSessionCount).toHaveBeenCalledTimes(1)

      rerender({ currentItem: item2 })

      // Should not increment session again
      expect(incrementSessionCount).toHaveBeenCalledTimes(1)
    })

    it('should provide progress system ready status', () => {
      const { result } = renderHook(() => useProgressTracking(null, vi.fn()))

      expect(result.current.progressSystemReady).toBe(true)
    })
  })

  describe('Memory Management', () => {
    it('should cleanup on unmount', () => {
      const unsubscribe = vi.fn()
      onProgressSystemReady.mockReturnValue(unsubscribe)

      const { unmount } = renderHook(() => useProgressTracking(null, vi.fn()))

      unmount()

      expect(unsubscribe).toHaveBeenCalled()
    })

    it('should cleanup attempt tracking on item change', () => {
      const item1 = { id: 'item-1', verb: 'hablar', value: 'hablo' }
      const item2 = { id: 'item-2', verb: 'comer', value: 'como' }

      const { rerender } = renderHook(
        ({ currentItem }) => useProgressTracking(currentItem, vi.fn()),
        { initialProps: { currentItem: item1 } }
      )

      expect(trackAttemptStarted).toHaveBeenCalledWith(item1)

      rerender({ currentItem: item2 })

      // Should start new attempt for new item
      expect(trackAttemptStarted).toHaveBeenCalledWith(item2)
      expect(trackAttemptStarted).toHaveBeenCalledTimes(2)
    })
  })
})