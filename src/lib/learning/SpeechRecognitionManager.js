// Speech Recognition Manager - Centralized speech-to-text handling
// Enhanced version of existing speech recognition for conversation mode

import { createLogger } from '../utils/logger.js'

const logger = createLogger('learning:SpeechRecognitionManager')

/**
 * Enhanced Speech Recognition Manager
 * Builds on existing SpeechRecognitionService with conversation-specific features
 */
export class SpeechRecognitionManager {
  constructor(options = {}) {
    this.language = options.language || 'es-ES'
    this.continuous = options.continuous || false
    this.maxAlternatives = options.maxAlternatives || 5
    this.interimResults = options.interimResults || true

    this.recognition = null
    this.isListening = false
    this.callbacks = {}
    this.timeout = null
    this.silenceThreshold = options.silenceThreshold || 3000 // 3 seconds
    this.autoStop = options.autoStop !== false

    this.initializeRecognition()
  }

  /**
   * Initialize Web Speech API
   */
  initializeRecognition() {
    if (typeof window === 'undefined') {
      logger.warn('Window not available, speech recognition disabled')
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      logger.error('Speech Recognition API not supported')
      return
    }

    this.recognition = new SpeechRecognition()
    this.recognition.lang = this.language
    this.recognition.continuous = this.continuous
    this.recognition.maxAlternatives = this.maxAlternatives
    this.recognition.interimResults = this.interimResults

    this.attachEventHandlers()
    logger.debug('Speech recognition initialized', { language: this.language })
  }

  /**
   * Attach event handlers
   */
  attachEventHandlers() {
    if (!this.recognition) return

    this.recognition.onstart = () => {
      this.isListening = true
      this.callbacks.onStart?.()
      logger.debug('Speech recognition started')

      // Auto-stop after silence threshold
      if (this.autoStop) {
        this.resetSilenceTimeout()
      }
    }

    this.recognition.onend = () => {
      this.isListening = false
      this.clearSilenceTimeout()
      this.callbacks.onEnd?.()
      logger.debug('Speech recognition ended')
    }

    this.recognition.onresult = (event) => {
      this.clearSilenceTimeout()

      const results = []
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          const alternatives = []
          for (let j = 0; j < result.length; j++) {
            alternatives.push({
              transcript: result[j].transcript.trim(),
              confidence: result[j].confidence
            })
          }

          results.push({
            transcript: alternatives[0].transcript,
            confidence: alternatives[0].confidence,
            alternatives,
            isFinal: true
          })

          logger.debug('Final result', {
            transcript: alternatives[0].transcript,
            confidence: alternatives[0].confidence
          })
        } else if (this.interimResults) {
          // Interim result
          this.callbacks.onInterim?.({
            transcript: result[0].transcript.trim(),
            isFinal: false
          })
        }
      }

      if (results.length > 0) {
        this.callbacks.onResult?.(results[0])

        // Auto-stop after receiving final result
        if (this.autoStop && !this.continuous) {
          setTimeout(() => this.stop(), 100)
        }
      }

      // Reset silence timeout
      if (this.autoStop && this.isListening) {
        this.resetSilenceTimeout()
      }
    }

    this.recognition.onerror = (event) => {
      const errorInfo = {
        error: event.error,
        message: this.getErrorMessage(event.error),
        recoverable: event.error !== 'not-allowed' && event.error !== 'service-not-allowed'
      }

      logger.error('Speech recognition error', errorInfo)
      this.callbacks.onError?.(errorInfo)

      // Stop on non-recoverable errors
      if (!errorInfo.recoverable) {
        this.stop()
      }
    }

    this.recognition.onspeechend = () => {
      logger.debug('Speech ended')
      if (this.autoStop && !this.continuous) {
        this.stop()
      }
    }

    this.recognition.onsoundstart = () => {
      logger.debug('Sound detected')
      this.clearSilenceTimeout()
    }

    this.recognition.onsoundend = () => {
      logger.debug('Sound ended')
      if (this.autoStop) {
        this.resetSilenceTimeout()
      }
    }
  }

  /**
   * Start listening
   */
  start() {
    if (!this.recognition) {
      logger.error('Speech recognition not initialized')
      return false
    }

    if (this.isListening) {
      logger.warn('Already listening')
      return false
    }

    try {
      this.recognition.start()
      return true
    } catch (error) {
      logger.error('Failed to start recognition', error)
      return false
    }
  }

  /**
   * Stop listening
   */
  stop() {
    if (!this.recognition) return

    this.clearSilenceTimeout()

    if (this.isListening) {
      try {
        this.recognition.stop()
      } catch (error) {
        logger.error('Error stopping recognition', error)
      }
    }
  }

  /**
   * Abort current recognition
   */
  abort() {
    if (!this.recognition) return

    this.clearSilenceTimeout()

    if (this.isListening) {
      try {
        this.recognition.abort()
      } catch (error) {
        logger.error('Error aborting recognition', error)
      }
    }
  }

  /**
   * Set callbacks
   */
  setCallbacks(callbacks) {
    this.callbacks = { ...callbacks }
  }

  /**
   * Change language
   */
  setLanguage(language) {
    this.language = language
    if (this.recognition) {
      this.recognition.lang = language
      logger.debug('Language changed', { language })
    }
  }

  /**
   * Reset silence timeout
   */
  resetSilenceTimeout() {
    this.clearSilenceTimeout()

    this.timeout = setTimeout(() => {
      logger.debug('Silence threshold reached, auto-stopping')
      this.stop()
    }, this.silenceThreshold)
  }

  /**
   * Clear silence timeout
   */
  clearSilenceTimeout() {
    if (this.timeout) {
      clearTimeout(this.timeout)
      this.timeout = null
    }
  }

  /**
   * Get human-readable error message
   */
  getErrorMessage(errorCode) {
    const messages = {
      'no-speech': 'No se detectó voz. Intenta hablar más fuerte.',
      'aborted': 'Reconocimiento cancelado.',
      'audio-capture': 'No se puede acceder al micrófono.',
      'network': 'Error de red. Verifica tu conexión.',
      'not-allowed': 'Permiso de micrófono denegado.',
      'service-not-allowed': 'Servicio de reconocimiento no disponible.',
      'bad-grammar': 'Error en la configuración del reconocimiento.',
      'language-not-supported': 'Idioma no soportado.'
    }

    return messages[errorCode] || `Error desconocido: ${errorCode}`
  }

  /**
   * Check if speech recognition is supported
   */
  static isSupported() {
    if (typeof window === 'undefined') return false
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  }

  /**
   * Test microphone and speech recognition
   */
  static async testCompatibility() {
    const result = {
      speechRecognition: SpeechRecognitionManager.isSupported(),
      microphone: false,
      language: typeof navigator !== 'undefined' ? navigator.language : 'unknown',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
      recommendations: []
    }

    // Test microphone access
    if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        result.microphone = true
        // Stop the stream immediately
        stream.getTracks().forEach(track => track.stop())
      } catch (error) {
        result.microphone = false
        result.recommendations.push('Permite el acceso al micrófono en la configuración del navegador')
      }
    } else {
      result.recommendations.push('Tu navegador no soporta acceso al micrófono')
    }

    if (!result.speechRecognition) {
      result.recommendations.push('Usa Chrome, Edge o Safari para reconocimiento de voz')
    }

    if (!result.language.startsWith('es')) {
      result.recommendations.push('Considera cambiar el idioma del sistema a español para mejor reconocimiento')
    }

    return result
  }

  /**
   * Cleanup
   */
  destroy() {
    this.stop()
    this.clearSilenceTimeout()
    this.recognition = null
    this.callbacks = {}
  }
}

export default SpeechRecognitionManager
