/**
 * Tests para PronunciationPractice component
 * Verifica SSR compatibility, progress tracking integration y functionality principal
 */

import React from 'react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import PronunciationPractice from '../PronunciationPractice.jsx'

const {
  MockSpeechRecognitionService,
  MockPronunciationAnalyzer,
  mockUseProgressTracking
} = vi.hoisted(() => {
  const speechService = vi.fn()
  speechService.prototype.testCompatibility = vi.fn()
  speechService.prototype.initialize = vi.fn()
  speechService.prototype.setCallbacks = vi.fn()
  speechService.prototype.startListening = vi.fn()
  speechService.prototype.stopListening = vi.fn()
  speechService.prototype.destroy = vi.fn()

  const pronunciationAnalyzer = vi.fn()
  pronunciationAnalyzer.prototype.analyzePronunciation = vi.fn()

  const progressTracking = vi.fn()

  return {
    MockSpeechRecognitionService: speechService,
    MockPronunciationAnalyzer: pronunciationAnalyzer,
    mockUseProgressTracking: progressTracking
  }
})

// Mock dependencies
vi.mock('../../../lib/pronunciation/speechRecognition.js', () => ({
  default: MockSpeechRecognitionService
}))

vi.mock('../../../lib/pronunciation/pronunciationAnalyzer.js', () => ({
  default: MockPronunciationAnalyzer
}))

vi.mock('../../../features/drill/useProgressTracking.js', () => ({
  useProgressTracking: mockUseProgressTracking
}))

vi.mock('../../../lib/utils/logger.js', async () => {
  const actual = await vi.importActual('../../../lib/utils/logger.js')
  return {
    ...actual,
    createLogger: () => ({
      debug: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn()
    }),
    registerDebugTool: vi.fn()
  }
})

describe('PronunciationPractice', () => {
  let mockProps
  let originalWindow
  const applyWindowStub = (overrides = {}) => {
    const baseWindow = originalWindow ?? global.window ?? {}
    const stub = Object.assign(Object.create(baseWindow), overrides)

    if (!stub.document && baseWindow.document) {
      stub.document = baseWindow.document
    }

    if (!stub.navigator && baseWindow.navigator) {
      stub.navigator = baseWindow.navigator
    }

    stub.window = stub
    stub.self = stub

    global.window = stub
    globalThis.window = stub
    globalThis.self = stub

    return stub
  }

  const setDefaultSpeechCompatibility = (overrides = {}) => {
    MockSpeechRecognitionService.prototype.testCompatibility.mockResolvedValue({
      speechRecognition: true,
      microphone: true,
      language: 'es-ES',
      userAgent: 'Vitest',
      recommendations: [],
      ...overrides
    })

    MockSpeechRecognitionService.prototype.initialize.mockResolvedValue()
    MockSpeechRecognitionService.prototype.startListening.mockResolvedValue(true)
  }

  beforeEach(() => {
    // Store original window
    originalWindow = global.window

    // Set up default props
    mockProps = {
      tense: { mood: 'indicativo', tense: 'pres' },
      eligibleForms: [
        {
          lemma: 'hablar',
          verb: 'hablar',
          value: 'hablo',
          person: '1s',
          mood: 'indicative',
          tense: 'pres'
        }
      ],
      onBack: vi.fn(),
      onContinue: vi.fn()
    }

    // Mock progress tracking
    mockUseProgressTracking.mockReturnValue({
      handleResult: vi.fn(),
      handleHintShown: vi.fn(),
      progressSystemReady: true
    })

    // Reset all mocks
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Restore original window
    global.window = originalWindow
    globalThis.window = originalWindow
    globalThis.self = originalWindow
    vi.clearAllMocks()
  })

  describe('SSR Compatibility', () => {
    beforeEach(() => {
      globalThis.__FORCE_SSR_FALLBACK__ = true
    })

    it('should render without errors in SSR environment', () => {
      // Simulate SSR by removing window
      delete global.window

      expect(() => {
        render(<PronunciationPractice {...mockProps} />)
      }).not.toThrow()

      // Should show compatibility error message
      expect(screen.getByText(/Reconocimiento de voz no disponible/i)).toBeInTheDocument()
    })

    it('should show SSR-specific error message', () => {
      delete global.window

      render(<PronunciationPractice {...mockProps} />)

      expect(screen.getByText(/Reconocimiento de voz no disponible/i)).toBeInTheDocument()
      expect(screen.getByText(/Continuar sin práctica de pronunciación/i)).toBeInTheDocument()
    })

    it('should handle onContinue in SSR mode', () => {
      delete global.window

      render(<PronunciationPractice {...mockProps} />)

      const continueButton = screen.getByText(/Continuar sin práctica de pronunciación/i)
      fireEvent.click(continueButton)

      expect(mockProps.onContinue).toHaveBeenCalled()
    })
  })

  describe('Browser Environment', () => {
    beforeEach(() => {
      // Mock browser environment
      applyWindowStub({
        speechSynthesis: {
          cancel: vi.fn(),
          speak: vi.fn(),
          getVoices: vi.fn().mockReturnValue([
            { lang: 'es-ES', name: 'Spanish Voice' }
          ])
        }
      })

      setDefaultSpeechCompatibility()
    })

    it('should render pronunciation interface', async () => {
      render(<PronunciationPractice {...mockProps} />)

      await waitFor(() => {
        expect(screen.getByText(/Pronunciación - Presente/i)).toBeInTheDocument()
      })

      expect(screen.getByText(/hablo/i)).toBeInTheDocument()
      expect(screen.getByText(/hablar/i)).toBeInTheDocument()
      expect(screen.getByText(/Grabar mi pronunciación/i)).toBeInTheDocument()
    })

    it('should initialize speech service on mount', async () => {
      render(<PronunciationPractice {...mockProps} />)

      await waitFor(() => {
        expect(MockSpeechRecognitionService).toHaveBeenCalled()
        expect(MockSpeechRecognitionService.prototype.testCompatibility).toHaveBeenCalled()
        expect(MockSpeechRecognitionService.prototype.initialize).toHaveBeenCalledWith({ language: 'es-ES' })
      })
    })

    it('should handle recording start/stop', async () => {
      render(<PronunciationPractice {...mockProps} />)

      await waitFor(() => {
        expect(screen.getByText(/Grabar mi pronunciación/i)).toBeInTheDocument()
      })

      const recordButton = screen.getByText(/Grabar mi pronunciación/i)
      fireEvent.click(recordButton)

      expect(MockSpeechRecognitionService.prototype.startListening).toHaveBeenCalledWith({
        language: 'es-ES'
      })
    })

    it('should handle microphone access denied', async () => {
      MockSpeechRecognitionService.prototype.testCompatibility.mockResolvedValue({
        speechRecognition: true,
        microphone: false,
        recommendations: ['Permite el acceso al micrófono']
      })

      render(<PronunciationPractice {...mockProps} />)

      await waitFor(() => {
        expect(screen.getByText(/Reconocimiento de voz no disponible/i)).toBeInTheDocument()
      })
    })
  })

  describe('Progress Tracking Integration', () => {
    beforeEach(() => {
      applyWindowStub({
        speechSynthesis: {
          cancel: vi.fn(),
          speak: vi.fn(),
          getVoices: vi.fn().mockReturnValue([])
        }
      })

      setDefaultSpeechCompatibility()
    })

    it('should create stable pronunciation item for tracking', async () => {
      render(<PronunciationPractice {...mockProps} />)

      await waitFor(() => {
        expect(mockUseProgressTracking).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'hablar|pres|1s', // Stable identifier
            verb: 'hablar',
            value: 'hablo',
            type: 'pronunciation'
          }),
          expect.any(Function)
        )
      })
    })

    it('should track pronunciation results with metadata', async () => {
      const mockHandleResult = vi.fn()
      mockUseProgressTracking.mockReturnValue({
        handleResult: mockHandleResult,
        progressSystemReady: true
      })

      // Mock analysis result
      MockPronunciationAnalyzer.prototype.analyzePronunciation.mockReturnValue({
        accuracy: 95,
        isCorrectForSRS: true,
        pedagogicalScore: 95,
        semanticValidation: { type: 'valid_conjugation' }
      })

      render(<PronunciationPractice {...mockProps} />)

      // Simulate speech result
      await waitFor(() => {
        const instance = MockSpeechRecognitionService.mock.instances[0]
        expect(instance.setCallbacks).toHaveBeenCalled()

        // Get the callback and simulate result
        const callbacks = instance.setCallbacks.mock.calls[0][0]
        callbacks.onResult({
          isFinal: true,
          transcript: 'hablo',
          confidence: 0.9
        })
      })

      expect(mockHandleResult).toHaveBeenCalledWith(
        expect.objectContaining({
          correct: true,
          userAnswer: 'hablo',
          correctAnswer: 'hablo',
          meta: expect.objectContaining({
            type: 'pronunciation',
            accuracy: 95,
            pedagogicalScore: 95
          })
        })
      )
    })

    it('should handle incorrect pronunciations with proper metadata', async () => {
      const mockHandleResult = vi.fn()
      mockUseProgressTracking.mockReturnValue({
        handleResult: mockHandleResult,
        progressSystemReady: true
      })

      // Mock analysis result for incorrect pronunciation
      MockPronunciationAnalyzer.prototype.analyzePronunciation.mockReturnValue({
        accuracy: 70,
        isCorrectForSRS: false,
        pedagogicalScore: 70,
        semanticValidation: { type: 'minor_pronunciation' }
      })

      render(<PronunciationPractice {...mockProps} />)

      await waitFor(() => {
        const instance = MockSpeechRecognitionService.mock.instances[0]
        const callbacks = instance.setCallbacks.mock.calls[0][0]
        callbacks.onResult({
          isFinal: true,
          transcript: 'ablo', // Missing 'h'
          confidence: 0.7
        })
      })

      expect(mockHandleResult).toHaveBeenCalledWith(
        expect.objectContaining({
          correct: false, // Below 90% threshold
          errorTags: ['pronunciation-error'],
          meta: expect.objectContaining({
            accuracy: 70,
            pedagogicalScore: 70
          })
        })
      )
    })
  })

  describe('Exercise Generation', () => {
    beforeEach(() => {
      applyWindowStub({
        speechSynthesis: {
          cancel: vi.fn(),
          speak: vi.fn(),
          getVoices: () => []
        }
      })
      setDefaultSpeechCompatibility()
    })

    it('should handle empty eligible forms gracefully', async () => {
      const emptyProps = { ...mockProps, eligibleForms: [] }

      render(<PronunciationPractice {...emptyProps} />)

      expect(await screen.findByText(/Pronunciación - Presente/i)).toBeInTheDocument()
      expect(await screen.findByText(/1 de/i)).toBeInTheDocument()
    })

    it('should generate fallback exercises when no eligible forms', async () => {
      applyWindowStub({
        speechSynthesis: {
          cancel: vi.fn(),
          speak: vi.fn(),
          getVoices: () => []
        }
      })

      const emptyProps = { ...mockProps, eligibleForms: null }

      render(<PronunciationPractice {...emptyProps} />)

      // Should still attempt to render (fallback generation happens in useMemo)
      expect(await screen.findByText(/Pronunciación - Presente/i)).toBeInTheDocument()
    })

    it('should handle multiple verbs correctly', async () => {
      const multipleFormsProps = {
        ...mockProps,
        eligibleForms: [
          {
            lemma: 'hablar',
            verb: 'hablar',
            value: 'hablo',
            person: '1s',
            mood: 'indicative',
            tense: 'pres'
          },
          {
            lemma: 'comer',
            verb: 'comer',
            value: 'como',
            person: '1s',
            mood: 'indicative',
            tense: 'pres'
          }
        ]
      }

      render(<PronunciationPractice {...multipleFormsProps} />)

      // Should render with navigation
      await waitFor(() => {
        expect(screen.getByText(/1 de/i)).toBeInTheDocument()
        expect(screen.getByText(/Siguiente/i)).toBeInTheDocument()
      })
    })
  })

  describe('Navigation', () => {
    beforeEach(() => {
      applyWindowStub({
        speechSynthesis: {
          cancel: vi.fn(),
          speak: vi.fn(),
          getVoices: () => []
        }
      })
      setDefaultSpeechCompatibility()
    })

    it('should handle next/previous navigation', async () => {
      const multipleFormsProps = {
        ...mockProps,
        eligibleForms: [
          { lemma: 'hablar', verb: 'hablar', value: 'hablo', person: '1s', mood: 'indicative', tense: 'pres' },
          { lemma: 'comer', verb: 'comer', value: 'como', person: '1s', mood: 'indicative', tense: 'pres' }
        ]
      }

      render(<PronunciationPractice {...multipleFormsProps} />)

      // Should start with first verb
      await waitFor(() => {
        expect(screen.getByText(/hablo/i)).toBeInTheDocument()
      })

      // Click next
      const nextButton = screen.getByText(/Siguiente/i)
      await act(async () => {
        fireEvent.click(nextButton)
      })

      // Should show second verb
      await waitFor(() => {
        expect(screen.getByText(/como/i)).toBeInTheDocument()
      })
    })

    it('should call onContinue when reaching end', async () => {
      render(<PronunciationPractice {...mockProps} />)

      // Advance through the generated set until reaching the final item
      for (let i = 0; i < 6; i += 1) {
        fireEvent.click(screen.getByText(/Siguiente/i))
      }

      const continueButton = await screen.findByText(/Continuar/i)
      fireEvent.click(continueButton)

      expect(mockProps.onContinue).toHaveBeenCalled()
    })

    it('should handle back navigation', async () => {
      render(<PronunciationPractice {...mockProps} />)

      const backButton = screen.getByText(/Volver/i)
      await act(async () => {
        fireEvent.click(backButton)
      })

      expect(mockProps.onBack).toHaveBeenCalled()
    })
  })

  describe('Audio Functionality', () => {
    beforeEach(() => {
      applyWindowStub({
        speechSynthesis: {
          cancel: vi.fn(),
          speak: vi.fn(),
          getVoices: vi.fn().mockReturnValue([
            { lang: 'es-ES', name: 'Spanish Voice' }
          ])
        }
      })
      setDefaultSpeechCompatibility()
    })

    it('should handle audio playback', async () => {
      render(<PronunciationPractice {...mockProps} />)

      const playButton = screen.getByText(/Escuchar pronunciación/i)
      fireEvent.click(playButton)

      await waitFor(() => {
        expect(global.window.speechSynthesis.speak).toHaveBeenCalled()
      })
    })

    it('should handle audio errors gracefully', async () => {
      global.window.speechSynthesis.speak.mockImplementation(() => {
        throw new Error('Audio error')
      })

      render(<PronunciationPractice {...mockProps} />)

      const playButton = screen.getByText(/Escuchar pronunciación/i)

      await act(async () => {
        expect(() => {
          fireEvent.click(playButton)
        }).not.toThrow()
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle speech recognition initialization errors', async () => {
      applyWindowStub({
        speechSynthesis: {
          cancel: vi.fn(),
          speak: vi.fn(),
          getVoices: () => []
        }
      })

      setDefaultSpeechCompatibility()
      MockSpeechRecognitionService.prototype.testCompatibility.mockRejectedValue(
        new Error('Initialization failed')
      )

      render(<PronunciationPractice {...mockProps} />)

      await waitFor(() => {
        expect(screen.getByText(/Reconocimiento de voz no disponible/i)).toBeInTheDocument()
      })
    })

    it('should handle recording start failures', async () => {
      applyWindowStub({
        speechSynthesis: {
          cancel: vi.fn(),
          speak: vi.fn(),
          getVoices: () => []
        }
      })

      setDefaultSpeechCompatibility()
      MockSpeechRecognitionService.prototype.testCompatibility.mockResolvedValue({
        speechRecognition: true,
        microphone: true
      })

      MockSpeechRecognitionService.prototype.startListening.mockResolvedValue(false)

      render(<PronunciationPractice {...mockProps} />)

      await waitFor(async () => {
        const recordButton = screen.getByText(/Grabar mi pronunciación/i)
        await act(async () => {
          fireEvent.click(recordButton)
        })
      })

      // Should handle failure gracefully without crashing
      expect(screen.getByText(/Grabar mi pronunciación/i)).toBeInTheDocument()
    })
  })
})
