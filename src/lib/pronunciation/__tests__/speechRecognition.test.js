/**
 * Tests para SpeechRecognitionService
 * Verifica compatibilidad SSR, manejo de errores y funcionalidad principal
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import SpeechRecognitionService from '../speechRecognition.js'

// Mock global objects for testing
const mockSpeechRecognition = vi.fn()
mockSpeechRecognition.prototype.start = vi.fn()
mockSpeechRecognition.prototype.stop = vi.fn()

describe('SpeechRecognitionService', () => {
  let service
  let originalWindow

  beforeEach(() => {
    // Store original window
    originalWindow = global.window

    // Create fresh service instance
    service = new SpeechRecognitionService()
  })

  afterEach(() => {
    // Restore original window
    global.window = originalWindow

    // Clean up service
    if (service) {
      service.destroy()
    }

    vi.clearAllMocks()
  })

  describe('SSR Compatibility', () => {
    it('should handle undefined window gracefully', () => {
      // Simulate SSR environment
      delete global.window

      const ssrService = new SpeechRecognitionService()

      expect(ssrService.checkSupport()).toBe(false)
      expect(ssrService.isSupported).toBe(false)
    })

    it('should not throw when window is undefined', () => {
      delete global.window

      expect(() => {
        const ssrService = new SpeechRecognitionService()
        ssrService.checkSupport()
      }).not.toThrow()
    })

    it('should handle initialize() in SSR environment', async () => {
      delete global.window

      const ssrService = new SpeechRecognitionService()

      // Should reject since isSupported is false
      await expect(ssrService.initialize()).rejects.toThrow()
    })

    it('should handle testCompatibility() in SSR environment', async () => {
      delete global.window
      delete global.navigator

      const ssrService = new SpeechRecognitionService()
      const result = await ssrService.testCompatibility()

      expect(result.speechRecognition).toBe(false)
      expect(result.microphone).toBe(false)
      expect(result.language).toBe('unknown') // Should be unknown when no navigator
      expect(result.userAgent).toBe('SSR environment')
      expect(result.recommendations).toContain('Speech recognition not available in server-side environment')
    })
  })

  describe('Browser Compatibility', () => {
    beforeEach(() => {
      // Mock browser environment
      global.window = {
        webkitSpeechRecognition: mockSpeechRecognition,
        SpeechRecognition: undefined
      }
      global.navigator = {
        language: 'es-ES',
        userAgent: 'Mozilla/5.0 (Chrome)',
        mediaDevices: {
          getUserMedia: vi.fn().mockResolvedValue({
            getTracks: () => [{ stop: vi.fn() }]
          })
        }
      }
    })

    it('should detect webkit speech recognition support', () => {
      const browserService = new SpeechRecognitionService()
      expect(browserService.checkSupport()).toBe(true)
      expect(browserService.isSupported).toBe(true)
    })

    it('should detect standard speech recognition support', () => {
      global.window.SpeechRecognition = mockSpeechRecognition
      delete global.window.webkitSpeechRecognition

      const browserService = new SpeechRecognitionService()
      expect(browserService.checkSupport()).toBe(true)
    })

    it('should detect no speech recognition support', () => {
      delete global.window.webkitSpeechRecognition
      delete global.window.SpeechRecognition

      const browserService = new SpeechRecognitionService()
      expect(browserService.checkSupport()).toBe(false)
    })

    it('should test microphone compatibility', async () => {
      const browserService = new SpeechRecognitionService()
      const result = await browserService.testCompatibility()

      expect(result.microphone).toBe(true)
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({ audio: true })
    })

    it('should handle microphone access denied', async () => {
      global.navigator.mediaDevices.getUserMedia = vi.fn().mockRejectedValue(new Error('Permission denied'))

      const browserService = new SpeechRecognitionService()
      const result = await browserService.testCompatibility()

      expect(result.microphone).toBe(false)
      expect(result.recommendations).toContain('Permite el acceso al micrófono para usar esta función')
    })
  })

  describe('Service Initialization', () => {
    beforeEach(() => {
      global.window = {
        webkitSpeechRecognition: mockSpeechRecognition
      }
    })

    it('should initialize with Spanish configuration', async () => {
      const browserService = new SpeechRecognitionService()

      await browserService.initialize({ language: 'es-ES' })

      expect(mockSpeechRecognition).toHaveBeenCalled()
      expect(browserService.currentLanguage).toBe('es-ES')
    })

    it('should throw error when not supported', async () => {
      const unsupportedService = new SpeechRecognitionService()
      unsupportedService.isSupported = false

      await expect(unsupportedService.initialize()).rejects.toThrow()
    })

    it('should set up event handlers', async () => {
      const browserService = new SpeechRecognitionService()
      const mockCallbacks = {
        onResult: vi.fn(),
        onError: vi.fn(),
        onStart: vi.fn(),
        onEnd: vi.fn()
      }

      await browserService.initialize()
      browserService.setCallbacks(mockCallbacks)

      expect(browserService.onResult).toBe(mockCallbacks.onResult)
      expect(browserService.onError).toBe(mockCallbacks.onError)
      expect(browserService.onStart).toBe(mockCallbacks.onStart)
      expect(browserService.onEnd).toBe(mockCallbacks.onEnd)
    })
  })

  describe('Speech Recognition Operations', () => {
    beforeEach(() => {
      global.window = {
        webkitSpeechRecognition: mockSpeechRecognition
      }
    })

    it('should start listening', async () => {
      const browserService = new SpeechRecognitionService()
      await browserService.initialize()

      const result = await browserService.startListening({ language: 'es-MX' })

      expect(result).toBe(true)
      expect(browserService.currentLanguage).toBe('es-MX')
      expect(mockSpeechRecognition.prototype.start).toHaveBeenCalled()
    })

    it('should stop listening', async () => {
      const browserService = new SpeechRecognitionService()
      await browserService.initialize()
      browserService.isListening = true

      browserService.stopListening()

      expect(mockSpeechRecognition.prototype.stop).toHaveBeenCalled()
    })

    it('should handle start listening errors', async () => {
      const browserService = new SpeechRecognitionService()
      await browserService.initialize()

      const mockOnError = vi.fn()
      browserService.setCallbacks({ onError: mockOnError })

      mockSpeechRecognition.prototype.start.mockImplementation(() => {
        throw new Error('Start failed')
      })

      const result = await browserService.startListening()

      expect(result).toBe(false)
      expect(mockOnError).toHaveBeenCalledWith(expect.objectContaining({
        type: 'start_failed',
        message: 'No se pudo iniciar el reconocimiento de voz.'
      }))
    })
  })

  describe('Error Processing', () => {
    it('should process known errors correctly', () => {
      const service = new SpeechRecognitionService()

      const networkError = service.processError({ error: 'network' })
      expect(networkError.message).toContain('Error de conexión')
      expect(networkError.recoverable).toBe(true)

      const permissionError = service.processError({ error: 'not-allowed' })
      expect(permissionError.message).toContain('Acceso al micrófono denegado')
      expect(permissionError.recoverable).toBe(false)

      const unknownError = service.processError({ error: 'unknown-error' })
      expect(unknownError.message).toContain('Error desconocido')
    })
  })

  describe('Language Support', () => {
    it('should return supported Spanish languages', () => {
      const service = new SpeechRecognitionService()
      const languages = service.getSupportedLanguages()

      expect(languages).toHaveLength(7)
      expect(languages.find(lang => lang.code === 'es-ES')).toBeTruthy()
      expect(languages.find(lang => lang.code === 'es-MX')).toBeTruthy()
      expect(languages.find(lang => lang.code === 'es-AR')).toBeTruthy()
    })

    it('should map regions correctly', () => {
      const service = new SpeechRecognitionService()
      const languages = service.getSupportedLanguages()

      const argentina = languages.find(lang => lang.code === 'es-AR')
      expect(argentina.region).toBe('rioplatense')

      const spain = languages.find(lang => lang.code === 'es-ES')
      expect(spain.region).toBe('peninsular')

      const mexico = languages.find(lang => lang.code === 'es-MX')
      expect(mexico.region).toBe('la_general')
    })
  })

  describe('Resource Cleanup', () => {
    it('should clean up resources on destroy', () => {
      const service = new SpeechRecognitionService()
      const mockCallbacks = {
        onResult: vi.fn(),
        onError: vi.fn(),
        onStart: vi.fn(),
        onEnd: vi.fn()
      }

      service.setCallbacks(mockCallbacks)
      service.destroy()

      expect(service.onResult).toBeNull()
      expect(service.onError).toBeNull()
      expect(service.onStart).toBeNull()
      expect(service.onEnd).toBeNull()
      expect(service.recognition).toBeNull()
    })
  })
})