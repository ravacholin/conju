/**
 * Test suite for result normalization in useDrillMode
 *
 * Tests the critical fix that normalizes result.correct to result.isCorrect
 * to ensure progress tracking works correctly.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDrillMode } from './useDrillMode.js'

// Mock the settings store with shallow selector support
const { useSettingsMock } = vi.hoisted(() => {
  const mockSet = vi.fn()
  const state = {
    set: mockSet,
    currentSession: null,
    verbType: 'all',
    selectedFamily: null,
    level: 'A1',
    useVoseo: false,
    useVosotros: false,
    practiceMode: 'mixed',
    specificMood: null,
    specificTense: null,
    region: 'la_general'
  }

  const selectorAwareUseSettings = vi.fn((selector) => (selector ? selector(state) : state))

  return { useSettingsMock: selectorAwareUseSettings }
})

vi.mock('../state/settings.js', () => ({
  useSettings: useSettingsMock
}))

// Mock the specialized hooks
vi.mock('./modules/useDrillGenerator.js', () => ({
  useDrillGenerator: vi.fn(() => ({
    generateNextItem: vi.fn(),
    isGenerationViable: vi.fn(() => true),
    getGenerationStats: vi.fn(() => ({})),
    isGenerating: false
  }))
}))

// Mock the progress hook with spy on handleResponse
const mockHandleResponse = vi.fn()
vi.mock('./modules/useDrillProgress.js', () => ({
  useDrillProgress: vi.fn(() => ({
    handleResponse: mockHandleResponse,
    handleHintShown: vi.fn(),
    getProgressInsights: vi.fn(() => ({})),
    resetProgressStats: vi.fn(),
    isProcessing: false
  }))
}))

// Mock the validation hook
vi.mock('./modules/useDrillValidation.js', () => ({
  useDrillValidation: vi.fn(() => ({
    validateItem: vi.fn(() => ({ valid: true })),
    validateSettings: vi.fn(() => ({ valid: true })),
    getValidationInsights: vi.fn(() => ({})),
    isValidating: false
  }))
}))

// Mock other dependencies
vi.mock('../lib/progress/personalizedCoaching.js', () => ({
  getMotivationalInsights: vi.fn(() => Promise.resolve([]))
}))

vi.mock('../lib/core/levelDrivenPrioritizer.js', () => ({
  debugLevelPrioritization: vi.fn()
}))

vi.mock('../lib/progress/flowStateDetection.js', () => ({
  getCurrentFlowState: vi.fn(() => 'neutral')
}))

vi.mock('../lib/utils/logger.js', () => ({
  createLogger: vi.fn(() => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }))
}))

describe('useDrillMode result normalization', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should normalize result.correct to result.isCorrect for progress tracking', async () => {
    const { result } = renderHook(() => useDrillMode())

    // Set up a mock current item
    const mockItem = {
      id: 'test-item-1',
      lemma: 'hablar',
      mood: 'indicative',
      tense: 'pres',
      person: '1s',
      value: 'hablo'
    }

    // Set current item using the hook's method
    act(() => {
      result.current.setCurrentItem(mockItem)
    })

    // Test with grader result format (result.correct)
    const graderResult = {
      correct: true,
      score: 1.0,
      input: 'hablo',
      expected: 'hablo',
      responseTime: 1500
    }

    // Call handleDrillResult wrapped in act
    await act(async () => {
      await result.current.handleDrillResult(graderResult)
    })

    // Verify that handleResponse was called with normalized result
    expect(mockHandleResponse).toHaveBeenCalledWith(
      mockItem,
      expect.objectContaining({
        correct: true,
        isCorrect: true, // This should be normalized from result.correct
        score: 1.0,
        input: 'hablo',
        expected: 'hablo',
        responseTime: 1500
      }),
      expect.any(Function)
    )
  })

  it('should preserve existing result.isCorrect if already present', async () => {
    const { result } = renderHook(() => useDrillMode())

    const mockItem = {
      id: 'test-item-2',
      lemma: 'ser',
      mood: 'indicative',
      tense: 'pres',
      person: '3s',
      value: 'es'
    }

    act(() => {
      result.current.setCurrentItem(mockItem)
    })

    // Test with result that already has isCorrect
    const alreadyNormalizedResult = {
      isCorrect: false,
      correct: true, // This should be ignored in favor of isCorrect
      score: 0.0,
      input: 'está',
      expected: 'es'
    }

    await act(async () => {
      await result.current.handleDrillResult(alreadyNormalizedResult)
    })

    // Verify that isCorrect is preserved (false), not overwritten by correct (true)
    expect(mockHandleResponse).toHaveBeenCalledWith(
      mockItem,
      expect.objectContaining({
        correct: true,
        isCorrect: false, // Should preserve original isCorrect value
        score: 0.0,
        input: 'está',
        expected: 'es'
      }),
      expect.any(Function)
    )
  })

  it('should handle case where result has neither correct nor isCorrect', async () => {
    const { result } = renderHook(() => useDrillMode())

    const mockItem = {
      id: 'test-item-3',
      lemma: 'tener',
      mood: 'indicative',
      tense: 'pres',
      person: '2s',
      value: 'tienes'
    }

    act(() => {
      result.current.setCurrentItem(mockItem)
    })

    // Test with result that has neither property
    const incompleteResult = {
      score: 0.5,
      input: 'tiene',
      expected: 'tienes'
    }

    await act(async () => {
      await result.current.handleDrillResult(incompleteResult)
    })

    // Verify that isCorrect is undefined when neither property exists
    expect(mockHandleResponse).toHaveBeenCalledWith(
      mockItem,
      expect.objectContaining({
        isCorrect: undefined,
        score: 0.5,
        input: 'tiene',
        expected: 'tienes'
      }),
      expect.any(Function)
    )
  })

  it('should update history with normalized accuracy tracking', async () => {
    const { result } = renderHook(() => useDrillMode())

    const mockItem = {
      id: 'test-item-4',
      lemma: 'hacer',
      mood: 'indicative',
      tense: 'pres',
      person: '1s',
      value: 'hago'
    }

    act(() => {
      result.current.setCurrentItem(mockItem)
    })

    // Test correct answer
    const correctResult = { correct: true }
    await act(async () => {
      await result.current.handleDrillResult(correctResult)
    })

    // Check history was updated with accuracy: 1
    const history = result.current.history
    const key = `${mockItem.lemma}-${mockItem.mood}-${mockItem.tense}`
    expect(history[key]).toEqual(
      expect.objectContaining({
        count: 1,
        accuracy: 1, // Should be 1 for correct answer
        lastSeen: expect.any(Number)
      })
    )

    // Test incorrect answer
    const incorrectResult = { correct: false }
    await act(async () => {
      await result.current.handleDrillResult(incorrectResult)
    })

    // Check history was updated with accuracy: 0
    const updatedHistory = result.current.history
    expect(updatedHistory[key]).toEqual(
      expect.objectContaining({
        count: 2,
        accuracy: 0, // Should be 0 for incorrect answer
        lastSeen: expect.any(Number)
      })
    )
  })
})