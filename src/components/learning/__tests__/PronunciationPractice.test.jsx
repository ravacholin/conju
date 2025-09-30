/**
 * Tests para PronunciationPractice component
 * Verifica SSR compatibility, progress tracking integration y functionality principal
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import PronunciationPractice from '../PronunciationPractice.jsx'

// Mock dependencies
vi.mock('../../../lib/pronunciation/speechRecognition.js')
vi.mock('../../../lib/pronunciation/pronunciationAnalyzer.js')
vi.mock('../../../features/drill/useProgressTracking.js')
vi.mock('../../../lib/utils/logger.js', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn()
  })
}))

// Mock SpeechRecognitionService
const MockSpeechRecognitionService = vi.fn()
MockSpeechRecognitionService.prototype.testCompatibility = vi.fn()
MockSpeechRecognitionService.prototype.initialize = vi.fn()
MockSpeechRecognitionService.prototype.setCallbacks = vi.fn()
MockSpeechRecognitionService.prototype.startListening = vi.fn()
MockSpeechRecognitionService.prototype.stopListening = vi.fn()
MockSpeechRecognitionService.prototype.destroy = vi.fn()

// Mock PronunciationAnalyzer
const MockPronunciationAnalyzer = vi.fn()
MockPronunciationAnalyzer.prototype.analyzePronunciation = vi.fn()

// Mock useProgressTracking
const mockUseProgressTracking = vi.fn()

describe('PronunciationPractice', () => {
  let mockProps
  let originalWindow

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
    vi.clearAllMocks()
  })

  describe('SSR Compatibility', () => {
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
      global.window = {
        speechSynthesis: {
          cancel: vi.fn(),
          speak: vi.fn(),
          getVoices: vi.fn().mockReturnValue([
            { lang: 'es-ES', name: 'Spanish Voice' }
          ])
        }
      }

      // Set up speech recognition mocks
      MockSpeechRecognitionService.prototype.testCompatibility.mockResolvedValue({
        speechRecognition: true,
        microphone: true,
        language: 'es-ES',
        userAgent: 'Chrome',
        recommendations: []
      })

      MockSpeechRecognitionService.prototype.initialize.mockResolvedValue()
      MockSpeechRecognitionService.prototype.startListening.mockResolvedValue(true)
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
      global.window = {
        speechSynthesis: {
          cancel: vi.fn(),
          speak: vi.fn(),
          getVoices: vi.fn().mockReturnValue([])
        }
      }

      MockSpeechRecognitionService.prototype.testCompatibility.mockResolvedValue({
        speechRecognition: true,
        microphone: true,
        language: 'es-ES',
        userAgent: 'Chrome',
        recommendations: []
      })
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
    it('should handle empty eligible forms gracefully', () => {
      const emptyProps = { ...mockProps, eligibleForms: [] }

      render(<PronunciationPractice {...emptyProps} />)

      expect(screen.getByText(/No hay formas verbales disponibles/i)).toBeInTheDocument()
      expect(screen.getByText(/Completa primero algunas lecciones/i)).toBeInTheDocument()
    })

    it('should generate fallback exercises when no eligible forms', () => {
      global.window = { speechSynthesis: { getVoices: () => [] } }

      const emptyProps = { ...mockProps, eligibleForms: null }

      render(<PronunciationPractice {...emptyProps} />)

      // Should still attempt to render (fallback generation happens in useMemo)
      expect(screen.getByText(/Práctica de Pronunciación/i)).toBeInTheDocument()
    })

    it('should handle multiple verbs correctly', () => {
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
      expect(screen.getByText(/1 de/i)).toBeInTheDocument()
      expect(screen.getByText(/Siguiente/i)).toBeInTheDocument()
    })
  })

  describe('Navigation', () => {
    beforeEach(() => {
      global.window = { speechSynthesis: { getVoices: () => [] } }
    })

    it('should handle next/previous navigation', () => {
      const multipleFormsProps = {
        ...mockProps,
        eligibleForms: [
          { lemma: 'hablar', verb: 'hablar', value: 'hablo', person: '1s', mood: 'indicative', tense: 'pres' },
          { lemma: 'comer', verb: 'comer', value: 'como', person: '1s', mood: 'indicative', tense: 'pres' }
        ]
      }

      render(<PronunciationPractice {...multipleFormsProps} />)

      // Should start with first verb
      expect(screen.getByText(/hablo/i)).toBeInTheDocument()

      // Click next
      const nextButton = screen.getByText(/Siguiente/i)
      fireEvent.click(nextButton)

      // Should show second verb
      expect(screen.getByText(/como/i)).toBeInTheDocument()
    })

    it('should call onContinue when reaching end', () => {
      render(<PronunciationPractice {...mockProps} />)

      // On last item, "Siguiente" should become "Continuar"
      const continueButton = screen.getByText(/Continuar/i)
      fireEvent.click(continueButton)

      expect(mockProps.onContinue).toHaveBeenCalled()
    })

    it('should handle back navigation', () => {
      render(<PronunciationPractice {...mockProps} />)

      const backButton = screen.getByText(/Volver/i)
      fireEvent.click(backButton)

      expect(mockProps.onBack).toHaveBeenCalled()
    })
  })

  describe('Audio Functionality', () => {
    beforeEach(() => {
      global.window = {
        speechSynthesis: {
          cancel: vi.fn(),
          speak: vi.fn(),
          getVoices: vi.fn().mockReturnValue([
            { lang: 'es-ES', name: 'Spanish Voice' }
          ])
        }
      }
    })

    it('should handle audio playback', () => {
      render(<PronunciationPractice {...mockProps} />)

      const playButton = screen.getByText(/Escuchar pronunciación/i)
      fireEvent.click(playButton)

      expect(global.window.speechSynthesis.speak).toHaveBeenCalled()
    })

    it('should handle audio errors gracefully', () => {
      global.window.speechSynthesis.speak.mockImplementation(() => {
        throw new Error('Audio error')
      })

      render(<PronunciationPractice {...mockProps} />)

      const playButton = screen.getByText(/Escuchar pronunciación/i)

      expect(() => {
        fireEvent.click(playButton)
      }).not.toThrow()
    })
  })

  describe('Error Handling', () => {
    it('should handle speech recognition initialization errors', async () => {
      global.window = { speechSynthesis: { getVoices: () => [] } }

      MockSpeechRecognitionService.prototype.testCompatibility.mockRejectedValue(
        new Error('Initialization failed')
      )

      render(<PronunciationPractice {...mockProps} />)

      await waitFor(() => {
        expect(screen.getByText(/Reconocimiento de voz no disponible/i)).toBeInTheDocument()
      })
    })

    it('should handle recording start failures', async () => {
      global.window = { speechSynthesis: { getVoices: () => [] } }

      MockSpeechRecognitionService.prototype.testCompatibility.mockResolvedValue({
        speechRecognition: true,
        microphone: true
      })

      MockSpeechRecognitionService.prototype.startListening.mockResolvedValue(false)

      render(<PronunciationPractice {...mockProps} />)

      await waitFor(() => {
        const recordButton = screen.getByText(/Grabar mi pronunciación/i)
        fireEvent.click(recordButton)
      })

      // Should handle failure gracefully without crashing
      expect(screen.getByText(/Grabar mi pronunciación/i)).toBeInTheDocument()
    })
  })
})