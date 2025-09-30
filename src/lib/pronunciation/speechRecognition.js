/**
 * Speech Recognition Utility for Spanish Language Learning
 *
 * Provides a robust wrapper around the Web Speech API with Spanish-specific
 * configurations and error handling. Supports multiple Spanish dialects
 * and provides detailed recognition results for pronunciation assessment.
 */

class SpeechRecognitionService {
  constructor() {
    this.recognition = null;
    this.isSupported = this.checkSupport();
    this.isListening = false;
    this.currentLanguage = 'es-ES';
    this.onResult = null;
    this.onError = null;
    this.onStart = null;
    this.onEnd = null;
    this.lastResult = null;
  }

  /**
   * Check if speech recognition is supported in the current browser
   */
  checkSupport() {
    if (typeof window === 'undefined') {
      return false; // SSR environment - no window object
    }
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  }

  /**
   * Initialize speech recognition with Spanish-specific settings
   */
  initialize(options = {}) {
    if (!this.isSupported) {
      throw new Error('Speech recognition not supported in this browser');
    }

    if (typeof window === 'undefined') {
      throw new Error('Speech recognition not available in SSR environment');
    }

    try {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      this.recognition = new SpeechRecognition();

      // Spanish-specific configuration
      this.recognition.lang = options.language || this.currentLanguage;
      this.recognition.continuous = false; // Single utterance for pronunciation practice
      this.recognition.interimResults = true; // Get intermediate results for real-time feedback
      this.recognition.maxAlternatives = 3; // Multiple alternatives for better analysis

      // Set optional properties if available
      try {
        this.recognition.audioCapture = true;
      } catch {
        // audioCapture not supported in all browsers
      }

      try {
        this.recognition.enableWordTimeOffsets = true;
      } catch {
        // enableWordTimeOffsets not supported in all browsers
      }

      try {
        this.recognition.enableWordConfidence = true;
      } catch {
        // enableWordConfidence not supported in all browsers
      }

      this.setupEventHandlers();
    } catch (error) {
      throw new Error(`Failed to initialize speech recognition: ${error.message}`);
    }
  }

  /**
   * Set up event handlers for speech recognition
   */
  setupEventHandlers() {
    this.recognition.onstart = () => {
      this.isListening = true;
      if (this.onStart) this.onStart();
    };

    this.recognition.onend = () => {
      this.isListening = false;
      if (this.onEnd) this.onEnd();
    };

    this.recognition.onresult = (event) => {
      const results = this.processResults(event);
      this.lastResult = results;
      if (this.onResult) this.onResult(results);
    };

    this.recognition.onerror = (event) => {
      this.isListening = false;
      const errorInfo = this.processError(event);
      if (this.onError) this.onError(errorInfo);
    };

    this.recognition.onnomatch = () => {
      if (this.onError) {
        this.onError({
          type: 'no_match',
          message: 'No se pudo reconocer la pronunciación. Inténtalo de nuevo hablando más claro.',
          severity: 'warning'
        });
      }
    };
  }

  /**
   * Process speech recognition results
   */
  processResults(event) {
    const results = {
      transcript: '',
      confidence: 0,
      alternatives: [],
      isFinal: false,
      timestamp: Date.now()
    };

    // Get the latest result
    const lastResult = event.results[event.results.length - 1];

    if (lastResult) {
      results.transcript = lastResult[0].transcript.trim().toLowerCase();
      results.confidence = lastResult[0].confidence || 0;
      results.isFinal = lastResult.isFinal;

      // Collect alternatives for analysis
      for (let i = 0; i < lastResult.length && i < 3; i++) {
        results.alternatives.push({
          transcript: lastResult[i].transcript.trim().toLowerCase(),
          confidence: lastResult[i].confidence || 0
        });
      }
    }

    return results;
  }

  /**
   * Process and categorize speech recognition errors
   */
  processError(event) {
    const errorMap = {
      'network': {
        message: 'Error de conexión. Verifica tu conexión a internet.',
        severity: 'error',
        recoverable: true
      },
      'not-allowed': {
        message: 'Acceso al micrófono denegado. Por favor, permite el acceso al micrófono.',
        severity: 'error',
        recoverable: false
      },
      'no-speech': {
        message: 'No se detectó habla. Asegúrate de hablar claramente.',
        severity: 'warning',
        recoverable: true
      },
      'audio-capture': {
        message: 'No se pudo capturar audio. Verifica que tu micrófono funcione.',
        severity: 'error',
        recoverable: true
      },
      'aborted': {
        message: 'Reconocimiento cancelado.',
        severity: 'info',
        recoverable: true
      },
      'service-not-allowed': {
        message: 'Servicio de reconocimiento no disponible.',
        severity: 'error',
        recoverable: false
      }
    };

    const errorInfo = errorMap[event.error] || {
      message: `Error desconocido: ${event.error}`,
      severity: 'error',
      recoverable: false
    };

    return {
      type: event.error,
      ...errorInfo,
      originalEvent: event
    };
  }

  /**
   * Start listening for speech input
   */
  async startListening(options = {}) {
    if (!this.recognition) {
      await this.initialize(options);
    }

    if (this.isListening) {
      this.stopListening();
    }

    try {
      // Update language if provided
      if (options.language && options.language !== this.currentLanguage) {
        this.currentLanguage = options.language;
        this.recognition.lang = options.language;
      }

      this.recognition.start();
      return true;
    } catch (error) {
      if (this.onError) {
        this.onError({
          type: 'start_failed',
          message: 'No se pudo iniciar el reconocimiento de voz.',
          severity: 'error',
          recoverable: true,
          originalError: error
        });
      }
      return false;
    }
  }

  /**
   * Stop listening for speech input
   */
  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  /**
   * Set event callbacks
   */
  setCallbacks({ onResult, onError, onStart, onEnd }) {
    this.onResult = onResult;
    this.onError = onError;
    this.onStart = onStart;
    this.onEnd = onEnd;
  }

  /**
   * Get supported Spanish language codes
   */
  getSupportedLanguages() {
    return [
      { code: 'es-ES', name: 'Español (España)', region: 'peninsular' },
      { code: 'es-MX', name: 'Español (México)', region: 'la_general' },
      { code: 'es-AR', name: 'Español (Argentina)', region: 'rioplatense' },
      { code: 'es-CO', name: 'Español (Colombia)', region: 'la_general' },
      { code: 'es-CL', name: 'Español (Chile)', region: 'la_general' },
      { code: 'es-PE', name: 'Español (Perú)', region: 'la_general' },
      { code: 'es-VE', name: 'Español (Venezuela)', region: 'la_general' }
    ];
  }

  /**
   * Test microphone access and browser compatibility
   */
  async testCompatibility() {
    const results = {
      speechRecognition: this.isSupported,
      microphone: false,
      language: typeof navigator !== 'undefined' ? navigator.language : 'unknown',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'SSR environment',
      recommendations: []
    };

    // Early return if no window/navigator (SSR environment)
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      results.recommendations.push('Speech recognition not available in server-side environment');
      return results;
    }

    // Test microphone access
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        results.microphone = true;
        stream.getTracks().forEach(track => track.stop());
      } else {
        results.microphone = false;
        results.recommendations.push('Media devices API not available');
      }
    } catch {
      results.microphone = false;
      results.recommendations.push('Permite el acceso al micrófono para usar esta función');
    }

    // Browser-specific recommendations
    if (!this.isSupported) {
      if (navigator.userAgent.includes('Firefox')) {
        results.recommendations.push('Firefox no soporta Web Speech API. Usa Chrome, Edge o Safari');
      } else if (navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome')) {
        results.recommendations.push('Safari tiene soporte limitado. Para mejores resultados usa Chrome');
      } else {
        results.recommendations.push('Tu navegador no soporta reconocimiento de voz. Actualiza a la última versión');
      }
    }

    return results;
  }

  /**
   * Clean up resources
   */
  destroy() {
    if (this.recognition) {
      this.stopListening();
      this.recognition = null;
    }
    this.onResult = null;
    this.onError = null;
    this.onStart = null;
    this.onEnd = null;
  }
}

export default SpeechRecognitionService;