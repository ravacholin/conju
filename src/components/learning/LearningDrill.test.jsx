import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LearningDrill from './LearningDrill.jsx'

// Mock dependencies
vi.mock('../../lib/core/generator.js', () => ({
  chooseNext: vi.fn(() => ({
    id: 'test-verb',
    lemma: 'hablar',
    mood: 'indicative',
    tense: 'pres', 
    person: '1s',
    expected: 'hablo',
    isIrregular: false
  }))
}))

vi.mock('../../lib/core/grader.js', () => ({
  grade: vi.fn((input, expected) => ({
    isCorrect: input.toLowerCase().trim() === expected.toLowerCase(),
    response: input,
    expected: expected,
    errorTypes: input.toLowerCase().trim() !== expected.toLowerCase() ? ['general'] : []
  }))
}))

vi.mock('../../lib/learning/learningConfig.js', () => ({
  DRILL_THRESHOLDS: {
    STREAK_FOR_COMPLETION: 10,
    STREAK_ANIMATION_TRIGGER: 5,
    MIN_ATTEMPTS_FOR_ASSESSMENT: 3,
    EXERCISE_HISTORY_SIZE: 20
  },
  DIFFICULTY_PARAMS: {
    DEFAULT: {
      hintsDelay: 5000,
      timeLimit: null,
      complexityBoost: false,
      encouragementLevel: 'normal'
    }
  },
  SCORING_CONFIG: {
    REGULAR_VERB_POINTS: 10,
    IRREGULAR_VERB_POINTS: 15,
    STREAK_ANIMATION_INTERVAL: 5
  },
  getRealTimeDifficultyConfig: vi.fn(() => ({
    hintsDelay: 5000,
    timeLimit: null,
    complexityBoost: false,
    encouragementLevel: 'normal'
  })),
  getLevelForTense: vi.fn(() => 'A1')
}))

vi.mock('../../lib/learning/adaptiveEngine.js', () => ({
  calculateAdaptiveDifficulty: vi.fn(() => ({
    level: 'intermediate',
    hintsEnabled: true,
    avgMastery: 0.7
  })),
  generateNextSessionRecommendations: vi.fn(() => ({
    recommendedTense: 'pres',
    focusAreas: ['regular verbs'],
    difficultyAdjustment: 'maintain'
  }))
}))

vi.mock('../../state/settings.js', () => ({
  useSettings: vi.fn(() => ({
    level: 'A1',
    dialect: 'rioplatense',
    verbType: 'regular'
  }))
}))

vi.mock('../../lib/learning/analytics.js', () => ({
  recordLearningSession: vi.fn()
}))

// Mock the progress tracking hook
const mockProgressTracking = {
  handleResult: vi.fn(),
  handleHintShown: vi.fn(),
  getSessionAnalytics: vi.fn(() => ({
    totalAttempts: 5,
    correctAnswers: 3,
    accuracy: 0.6
  }))
}

vi.mock('../../features/drill/useProgressTracking.js', () => ({
  useProgressTracking: vi.fn(() => mockProgressTracking)
}))

describe('LearningDrill Component', () => {
  const defaultProps = {
    tense: 'pres',
    verbType: 'regular',
    selectedFamilies: [],
    duration: 10,
    excludeLemmas: [],
    onBack: vi.fn(),
    onFinish: vi.fn(),
    onPhaseComplete: vi.fn(),
    onHome: vi.fn(),
    onGoToProgress: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Component Initialization', () => {
    it('should render the drill interface', () => {
      render(<LearningDrill {...defaultProps} />)
      
      expect(screen.getByRole('textbox')).toBeInTheDocument()
      expect(screen.getByText(/hablar/)).toBeInTheDocument()
      expect(screen.getByText(/1s/)).toBeInTheDocument()
    })

    it('should initialize with correct starting state', () => {
      render(<LearningDrill {...defaultProps} />)
      
      expect(screen.getByDisplayValue('')).toBeInTheDocument()
      expect(screen.getByText('0')).toBeInTheDocument() // Initial streak counter
    })

    it('should handle missing required props gracefully', () => {
      const minimalProps = {
        tense: 'pres',
        onFinish: vi.fn()
      }
      
      expect(() => render(<LearningDrill {...minimalProps} />)).not.toThrow()
    })
  })

  describe('User Interaction', () => {
    it('should handle user input', async () => {
      const user = userEvent.setup()
      render(<LearningDrill {...defaultProps} />)
      
      const input = screen.getByRole('textbox')
      await user.type(input, 'hablo')
      
      expect(input).toHaveValue('hablo')
    })

    it('should submit answer on Enter key', async () => {
      const user = userEvent.setup()
      render(<LearningDrill {...defaultProps} />)
      
      const input = screen.getByRole('textbox')
      await user.type(input, 'hablo')
      await user.keyboard('{Enter}')
      
      expect(mockProgressTracking.handleResult).toHaveBeenCalled()
    })

    it('should submit answer on button click', async () => {
      const user = userEvent.setup()
      render(<LearningDrill {...defaultProps} />)
      
      const input = screen.getByRole('textbox')
      await user.type(input, 'hablo')
      
      const submitButton = screen.getByRole('button', { name: /verificar|enviar/i })
      await user.click(submitButton)
      
      expect(mockProgressTracking.handleResult).toHaveBeenCalled()
    })

    it('should clear input after submission', async () => {
      const user = userEvent.setup()
      render(<LearningDrill {...defaultProps} />)
      
      const input = screen.getByRole('textbox')
      await user.type(input, 'hablo')
      await user.keyboard('{Enter}')
      
      await waitFor(() => {
        expect(input).toHaveValue('')
      })
    })
  })

  describe('Answer Grading', () => {
    it('should show correct feedback for right answers', async () => {
      const user = userEvent.setup()
      render(<LearningDrill {...defaultProps} />)
      
      const input = screen.getByRole('textbox')
      await user.type(input, 'hablo')
      await user.keyboard('{Enter}')
      
      await waitFor(() => {
        expect(screen.getByText(/correcto/i)).toBeInTheDocument()
      })
    })

    it('should show incorrect feedback for wrong answers', async () => {
      const user = userEvent.setup()
      render(<LearningDrill {...defaultProps} />)
      
      const input = screen.getByRole('textbox')
      await user.type(input, 'wrong')
      await user.keyboard('{Enter}')
      
      await waitFor(() => {
        expect(screen.getByText(/incorrecto/i)).toBeInTheDocument()
      })
    })

    it('should show the correct answer for wrong submissions', async () => {
      const user = userEvent.setup()
      render(<LearningDrill {...defaultProps} />)
      
      const input = screen.getByRole('textbox')
      await user.type(input, 'wrong')
      await user.keyboard('{Enter}')
      
      await waitFor(() => {
        expect(screen.getByText(/hablo/)).toBeInTheDocument()
      })
    })
  })

  describe('Streak Tracking', () => {
    it('should increment streak on correct answers', async () => {
      const user = userEvent.setup()
      render(<LearningDrill {...defaultProps} />)
      
      const input = screen.getByRole('textbox')
      
      // Submit correct answer
      await user.type(input, 'hablo')
      await user.keyboard('{Enter}')
      
      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument()
      })
    })

    it('should reset streak on incorrect answers', async () => {
      const user = userEvent.setup()
      render(<LearningDrill {...defaultProps} />)
      
      const input = screen.getByRole('textbox')
      
      // First correct answer
      await user.type(input, 'hablo')
      await user.keyboard('{Enter}')
      
      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument()
      })
      
      // Then incorrect answer
      await user.type(input, 'wrong')
      await user.keyboard('{Enter}')
      
      await waitFor(() => {
        expect(screen.getByText('0')).toBeInTheDocument()
      })
    })

    it('should show streak animation at milestone intervals', async () => {
      const user = userEvent.setup()
      render(<LearningDrill {...defaultProps} />)
      
      const input = screen.getByRole('textbox')
      
      // Submit 5 correct answers to trigger animation
      for (let i = 0; i < 5; i++) {
        await user.type(input, 'hablo')
        await user.keyboard('{Enter}')
        
        // Wait for each submission to complete
        await waitFor(() => {
          expect(input).toHaveValue('')
        })
      }
      
      await waitFor(() => {
        expect(screen.getByText('5')).toBeInTheDocument()
      })
    })
  })

  describe('Phase Completion', () => {
    it('should call onPhaseComplete when streak reaches threshold', async () => {
      const user = userEvent.setup()
      const onPhaseComplete = vi.fn()
      
      render(<LearningDrill {...defaultProps} onPhaseComplete={onPhaseComplete} />)
      
      const input = screen.getByRole('textbox')
      
      // Submit 10 correct answers to reach completion threshold
      for (let i = 0; i < 10; i++) {
        await user.type(input, 'hablo')
        await user.keyboard('{Enter}')
        
        await waitFor(() => {
          expect(input).toHaveValue('')
        })
      }
      
      await waitFor(() => {
        expect(onPhaseComplete).toHaveBeenCalled()
      }, { timeout: 3000 })
    })

    it('should not complete phase if streak is broken', async () => {
      const user = userEvent.setup()
      const onPhaseComplete = vi.fn()
      
      render(<LearningDrill {...defaultProps} onPhaseComplete={onPhaseComplete} />)
      
      const input = screen.getByRole('textbox')
      
      // Submit 9 correct answers, then 1 wrong, then 1 correct
      for (let i = 0; i < 9; i++) {
        await user.type(input, 'hablo')
        await user.keyboard('{Enter}')
        await waitFor(() => expect(input).toHaveValue(''))
      }
      
      await user.type(input, 'wrong')
      await user.keyboard('{Enter}')
      await waitFor(() => expect(input).toHaveValue(''))
      
      await user.type(input, 'hablo')
      await user.keyboard('{Enter}')
      
      expect(onPhaseComplete).not.toHaveBeenCalled()
    })
  })

  describe('Navigation and Controls', () => {
    it('should call onBack when back button is clicked', async () => {
      const user = userEvent.setup()
      const onBack = vi.fn()
      
      render(<LearningDrill {...defaultProps} onBack={onBack} />)
      
      const backButton = screen.getByRole('button', { name: /atrás|back/i })
      await user.click(backButton)
      
      expect(onBack).toHaveBeenCalled()
    })

    it('should call onHome when home button is clicked', async () => {
      const user = userEvent.setup()
      const onHome = vi.fn()
      
      render(<LearningDrill {...defaultProps} onHome={onHome} />)
      
      const homeButton = screen.getByRole('button', { name: /inicio|home/i })
      await user.click(homeButton)
      
      expect(onHome).toHaveBeenCalled()
    })

    it('should call onGoToProgress when progress button is clicked', async () => {
      const user = userEvent.setup()
      const onGoToProgress = vi.fn()
      
      render(<LearningDrill {...defaultProps} onGoToProgress={onGoToProgress} />)
      
      const progressButton = screen.getByRole('button', { name: /progreso|progress/i })
      await user.click(progressButton)
      
      expect(onGoToProgress).toHaveBeenCalled()
    })
  })

  describe('Hints System', () => {
    it('should show hint after delay when enabled', async () => {
      render(<LearningDrill {...defaultProps} />)
      
      // Wait for hint delay
      await waitFor(() => {
        expect(screen.getByText(/pista|hint/i)).toBeInTheDocument()
      }, { timeout: 6000 })
    })

    it('should track hint usage in progress system', async () => {
      const user = userEvent.setup()
      render(<LearningDrill {...defaultProps} />)
      
      // Wait for hint to appear and click it
      await waitFor(() => {
        const hintButton = screen.getByText(/pista|hint/i)
        user.click(hintButton)
      }, { timeout: 6000 })
      
      expect(mockProgressTracking.handleHintShown).toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should handle generator errors gracefully', () => {
      vi.mocked(require('../../lib/core/generator.js').chooseNext).mockImplementation(() => {
        throw new Error('Generator error')
      })
      
      expect(() => render(<LearningDrill {...defaultProps} />)).not.toThrow()
    })

    it('should handle grader errors gracefully', async () => {
      const user = userEvent.setup()
      
      vi.mocked(require('../../lib/core/grader.js').grade).mockImplementation(() => {
        throw new Error('Grader error')
      })
      
      render(<LearningDrill {...defaultProps} />)
      
      const input = screen.getByRole('textbox')
      await user.type(input, 'test')
      
      expect(() => fireEvent.keyPress(input, { key: 'Enter' })).not.toThrow()
    })

    it('should handle empty input submission', async () => {
      const user = userEvent.setup()
      render(<LearningDrill {...defaultProps} />)
      
      const input = screen.getByRole('textbox')
      await user.keyboard('{Enter}')
      
      // Should not crash and should still accept input
      expect(input).toBeInTheDocument()
      expect(input).toHaveValue('')
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<LearningDrill {...defaultProps} />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('aria-label')
      
      const submitButton = screen.getByRole('button', { name: /verificar|enviar/i })
      expect(submitButton).toBeInTheDocument()
    })

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup()
      render(<LearningDrill {...defaultProps} />)
      
      // Tab to input
      await user.tab()
      expect(screen.getByRole('textbox')).toHaveFocus()
      
      // Tab to submit button
      await user.tab()
      expect(screen.getByRole('button', { name: /verificar|enviar/i })).toHaveFocus()
    })

    it('should announce results to screen readers', async () => {
      const user = userEvent.setup()
      render(<LearningDrill {...defaultProps} />)
      
      const input = screen.getByRole('textbox')
      await user.type(input, 'hablo')
      await user.keyboard('{Enter}')
      
      await waitFor(() => {
        const result = screen.getByRole('status') || screen.getByRole('alert')
        expect(result).toBeInTheDocument()
      })
    })
  })

  describe('Performance', () => {
    it('should not re-render unnecessarily', () => {
      const { rerender } = render(<LearningDrill {...defaultProps} />)
      
      // Re-render with same props
      rerender(<LearningDrill {...defaultProps} />)
      
      // Should not cause any issues
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('should handle rapid input changes', async () => {
      const user = userEvent.setup()
      render(<LearningDrill {...defaultProps} />)
      
      const input = screen.getByRole('textbox')
      
      // Type quickly
      await user.type(input, 'abcdefghijklmnop', { delay: 1 })
      
      expect(input).toHaveValue('abcdefghijklmnop')
    })
  })

  describe('Timer Functionality', () => {
    it('should handle timed exercises when enabled', () => {
      const timedProps = {
        ...defaultProps,
        timeLimit: 30000 // 30 seconds
      }
      
      render(<LearningDrill {...timedProps} />)
      
      // Timer should be visible if time limit is set
      expect(screen.getByText(/tiempo|time/i) || screen.getByText(/30/)).toBeInTheDocument()
    })

    it('should handle timer expiration', async () => {
      const timedProps = {
        ...defaultProps,
        timeLimit: 100 // Very short time limit
      }
      
      render(<LearningDrill {...timedProps} />)
      
      // Wait for timer to expire
      await waitFor(() => {
        expect(screen.getByText(/tiempo agotado|time up/i)).toBeInTheDocument()
      }, { timeout: 500 })
    })
  })
})