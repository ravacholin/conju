import React, { useState, useRef, useEffect, useCallback, useMemo, forwardRef, useImperativeHandle } from 'react';
import { TENSE_LABELS, MOOD_LABELS, PERSON_LABELS } from '../../lib/utils/verbLabels.js';
import SpeechRecognitionService from '../../lib/pronunciation/speechRecognition.js';
import PronunciationAnalyzer from '../../lib/pronunciation/pronunciationAnalyzer.js';
import { convertCurrentItemToPronunciation, speakText } from '../../lib/pronunciation/pronunciationUtils.js';
import { createLogger } from '../../lib/utils/logger.js';
import { useSettings } from '../../state/settings.js';
import { getSpeechLanguagePreferences } from '../../lib/pronunciation/languagePreferences.js';

const PronunciationPanelSafe = forwardRef(function PronunciationPanelSafe({
  currentItem,
  onClose,
  handleResult,
  onContinue
}, ref) {
  const settings = useSettings();
  const { locale: speechLocale, dialect } = useMemo(
    () => getSpeechLanguagePreferences(settings?.region),
    [settings?.region]
  );
  const logger = useMemo(() => createLogger('PronunciationPanelSafe'), []);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingResult, setRecordingResult] = useState(null);
  const [speechService, setSpeechService] = useState(null);
  const [analyzer] = useState(() => new PronunciationAnalyzer());
  const [isSupported, setIsSupported] = useState(true);
  const [audioWaveform, setAudioWaveform] = useState([]);
  const [_compatibilityInfo, setCompatibilityInfo] = useState(null);
  const waveformRef = useRef(null);
  const recordingStartTime = useRef(0);

  // Estabilizar props con refs para evitar cambios de dependencias
  const handleResultRef = useRef(handleResult);
  const onContinueRef = useRef(onContinue);
  const onCloseRef = useRef(onClose);

  // Actualizar refs cuando cambien las props
  useEffect(() => {
    handleResultRef.current = handleResult;
    onContinueRef.current = onContinue;
    onCloseRef.current = onClose;
  });

  // Toggle recording function for external control
  const toggleRecording = useCallback(async () => {
    if (!speechService) {
      setRecordingResult({
        accuracy: 0,
        feedback: 'Servicio de reconocimiento de voz no disponible',
        suggestions: ['Recarga la página y verifica tu navegador'],
        error: true
      });
      return;
    }

    if (isRecording) {
      speechService.stopListening();
    } else {
      const success = await speechService.startListening({
        language: speechLocale
      });
      if (!success) {
        setRecordingResult({
          accuracy: 0,
          feedback: 'No se pudo iniciar el reconocimiento de voz',
          suggestions: ['Verifica los permisos del micrófono'],
          error: true
        });
      }
    }
  }, [isRecording, speechService, speechLocale]);

  // Expose toggleRecording function via ref
  useImperativeHandle(ref, () => ({
    toggleRecording
  }), [toggleRecording]);

  // Convertir currentItem a formato de pronunciación - MEMOIZADO para evitar recálculos
  const pronunciationData = useMemo(() => {
    console.log('🎤 CREATING PRONUNCIATION DATA FROM:', currentItem);
    const result = convertCurrentItemToPronunciation(currentItem);
    console.log('🎤 PRONUNCIATION DATA RESULT:', result);
    return result;
  }, [currentItem]);

  // Function to play correct pronunciation - DEFINED AFTER pronunciationData
  const playCorrectPronunciation = useCallback(() => {
    if (pronunciationData?.form) {
      console.log('🔊 Playing correct pronunciation:', pronunciationData.form);
      speakText(pronunciationData.form, speechLocale, {
        rate: 0.7,
        onStart: () => console.log('🔊 Started playing correct pronunciation'),
        onEnd: () => console.log('🔊 Finished playing correct pronunciation'),
        onError: (error) => console.error('🔊 Error playing correct pronunciation:', error)
      });
    }
  }, [pronunciationData?.form, speechLocale]);

  // Speech recognition event handlers - ESTABLES CON useCallback
  const handleSpeechResult = useCallback((result) => {
    if (result.isFinal && pronunciationData) {
      setIsRecording(false);

      // DEBUG: Log what we're comparing
      console.log('🎤 PRONUNCIATION DEBUG:');
      console.log('  Expected:', `"${pronunciationData.form}"`);
      console.log('  Recognized:', `"${result.transcript}"`);
      console.log('  Exact match:', pronunciationData.form === result.transcript);
      console.log('  Lower case match:', pronunciationData.form.toLowerCase() === result.transcript.toLowerCase());
      console.log('  PronunciationData:', pronunciationData);

      const analysis = analyzer.analyzePronunciation(
        pronunciationData.form,
        result.transcript,
        {
          verb: pronunciationData.verb,
          mood: pronunciationData.mood,
          tense: pronunciationData.tense,
          person: pronunciationData.person,
          confidence: result.confidence,
          timing: Date.now() - recordingStartTime.current
        }
      );

      // Use the new STRICT analysis directly - no fallback needed
      let finalAnalysis = analysis;

      setRecordingResult({
        ...finalAnalysis,
        originalTranscript: result.transcript,
        alternatives: result.alternatives
      });

      // Track progress using STRICT evaluation (90%+ threshold)
      if (pronunciationData) {
        const isCorrect = finalAnalysis.isCorrectForSRS;
        const timing = Date.now() - recordingStartTime.current;

        console.log('🎤 STRICT PRONUNCIATION RESULT TRACKING:', {
          isCorrect,
          accuracy: finalAnalysis.accuracy,
          pedagogicalScore: finalAnalysis.pedagogicalScore,
          threshold: '90% (STRICT)',
          semanticType: finalAnalysis.semanticValidation?.type,
          hasOnContinue: !!onContinueRef.current,
          hasOnClose: !!onCloseRef.current,
          timing
        });

        // Create proper result object for tracking
        const trackingResult = {
          correct: isCorrect,
          latencyMs: timing,
          hintsUsed: 0, // Pronunciation doesn't use hints
          errorTags: finalAnalysis.isCorrectForSRS ? [] : ['pronunciation-error'],
          userAnswer: result.transcript,
          correctAnswer: pronunciationData.form,
          practiceType: 'pronunciation',
          meta: {
            type: 'pronunciation',
            target: pronunciationData.form,
            recognized: result.transcript,
            accuracy: finalAnalysis.accuracy,
            pedagogicalScore: finalAnalysis.pedagogicalScore,
            semanticType: finalAnalysis.semanticValidation?.type,
            confidence: result.confidence,
            timing: timing
          }
        };

        handleResultRef.current(trackingResult);

        // Auto-advance if correct (90%+) - continue to next drill after 2 seconds
        if (isCorrect && onContinueRef.current) {
          console.log('🎤 STRICT AUTO-ADVANCE TRIGGERED: Will continue in 2 seconds');
          setTimeout(() => {
            console.log('🎤 EXECUTING AUTO-ADVANCE: Calling onContinue and onClose');
            // Call continue first to advance to next exercise
            onContinueRef.current();
            // Then close the pronunciation panel
            onCloseRef.current();
          }, 2000);
        } else {
          console.log('🎤 AUTO-ADVANCE NOT TRIGGERED:', {
            isCorrect,
            reason: isCorrect ? 'no onContinue function' : 'accuracy below 90% threshold',
            hasOnContinue: !!onContinueRef.current
          });
        }
      }
    }
  }, [pronunciationData, analyzer]); // Solo dependencias estables

  const handleSpeechError = useCallback((error) => {
    setIsRecording(false);
    setRecordingResult({
      accuracy: 0,
      feedback: error.message,
      suggestions: error.recoverable ? ['Inténtalo de nuevo'] : ['Verifica tu configuración de micrófono'],
      error: true
    });
  }, []);

  const handleSpeechStart = useCallback(() => {
    setIsRecording(true);
    recordingStartTime.current = Date.now();

    // Waveform animation - SIN dependencia de isRecording
    let animationRunning = true;
    const animation = () => {
      if (animationRunning) {
        const newWaveform = Array.from({ length: 20 }, () => Math.random() * 100);
        setAudioWaveform(newWaveform);
        waveformRef.current = requestAnimationFrame(animation);
      }
    };
    animation();

    // Cleanup function stored in ref for handleSpeechEnd
    waveformRef.stopAnimation = () => {
      animationRunning = false;
    };
  }, []);

  const handleSpeechEnd = useCallback(() => {
    setIsRecording(false);

    // Stop animation using stored function
    if (waveformRef.stopAnimation) {
      waveformRef.stopAnimation();
    }

    // Cancel any pending animation frame
    if (waveformRef.current) {
      cancelAnimationFrame(waveformRef.current);
    }

    setAudioWaveform([]);
  }, []);

  // Mantener los callbacks sincronizados con los handlers actuales
  useEffect(() => {
    if (!speechService) return;

    speechService.setCallbacks({
      onResult: handleSpeechResult,
      onError: handleSpeechError,
      onStart: handleSpeechStart,
      onEnd: handleSpeechEnd
    });
  }, [
    speechService,
    handleSpeechResult,
    handleSpeechError,
    handleSpeechStart,
    handleSpeechEnd
  ]);

  // Initialize speech recognition based on dialect preferences
  useEffect(() => {
    // Only initialize if window is available (client-side)
    if (typeof window === 'undefined') {
      setIsSupported(false);
      setCompatibilityInfo({
        speechRecognition: false,
        microphone: false,
        language: 'unknown',
        dialect,
        userAgent: 'SSR environment',
        recommendations: ['Speech recognition not available in server-side environment']
      });
      return () => {};
    }

    const service = new SpeechRecognitionService();
    setSpeechService(service);

    let isMounted = true;

    const initializeAndStart = async () => {
      try {
        const compatibility = await service.testCompatibility();
        if (!isMounted) return;

        const compatibilityWithLanguage = {
          ...compatibility,
          language: speechLocale,
          dialect
        };

        setCompatibilityInfo(compatibilityWithLanguage);
        setIsSupported(compatibility.speechRecognition && compatibility.microphone);

        if (compatibility.speechRecognition && compatibility.microphone) {
          await service.initialize({ language: speechLocale });

          // START RECORDING IMMEDIATELY
          const success = await service.startListening({
            language: speechLocale
          });

          if (!success && isMounted) {
            setRecordingResult({
              accuracy: 0,
              feedback: 'No se pudo iniciar el reconocimiento de voz',
              suggestions: ['Verifica los permisos del micrófono'],
              error: true
            });
          }
        }
      } catch (error) {
        logger.error('Error initializing speech recognition:', error);
        if (isMounted) {
          setIsSupported(false);
        }
      }
    };

    initializeAndStart();

    return () => {
      isMounted = false;
      service.destroy?.();
      setSpeechService((prev) => (prev === service ? null : prev));
    };
  }, [speechLocale, dialect, logger]);

  // No mostrar panel si no hay item actual
  if (!currentItem || !pronunciationData) {
    return (
      <div className="quick-switch-panel">
        <div className="setting-group">
          <p>No hay ítem disponible para pronunciación</p>
          <button className="btn btn-secondary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  if (!isSupported) {
    return (
      <div className="quick-switch-panel">
        <div className="setting-group">
          <h3>Reconocimiento de voz no disponible</h3>
          <button className="btn btn-secondary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="quick-switch-panel pronunciation-panel">
      <div className="setting-group">
        {isRecording ? (
          <div className="recording-status">
            <h3>🎤 Se está grabando...</h3>
            <p>Hacer click otra vez en el micrófono para terminar de pronunciar</p>

            <div className="recording-indicator">
              <div className="waveform">
                {audioWaveform.map((height, i) => (
                  <div
                    key={i}
                    className="wave-bar"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="recording-ready">
            <h3>Práctica de Pronunciación</h3>
            <p>Haz click en el micrófono del header para empezar a grabar</p>
          </div>
        )}
      </div>

      <div className="setting-group">
        <div className="verb-info">
          <p className="verb-infinitive">Verbo: <strong>{pronunciationData.verb}</strong></p>
          <p className="verb-context">
            {pronunciationData.person && `${PERSON_LABELS[pronunciationData.person] || pronunciationData.person}`} • {' '}
            {TENSE_LABELS[pronunciationData.tense] || pronunciationData.tense} • {' '}
            {MOOD_LABELS[pronunciationData.mood] || pronunciationData.mood}
          </p>
        </div>
      </div>

      {recordingResult && (
        <div className={`setting-group recording-result ${
          recordingResult.error ? 'error' :
          recordingResult.accuracy >= 100 ? 'perfect' :
          recordingResult.accuracy >= 95 ? 'excellent' :
          recordingResult.accuracy >= 85 ? 'good' :
          recordingResult.accuracy >= 75 ? 'needs-work' : 'incorrect'
        }`}>
          {!recordingResult.error && (
            <div className="accuracy-header">
              <div className="accuracy-score">
                <span className="score-number">{recordingResult.accuracy}%</span>
                <span className="score-label">Precisión</span>
              </div>
              <div className="accuracy-bar">
                <div
                  className="accuracy-fill"
                  style={{ width: `${recordingResult.accuracy}%` }}
                />
              </div>
            </div>
          )}

          <div className="feedback">
            {recordingResult.feedback}

            {/* Show pronunciation help for incorrect answers */}
            {recordingResult.accuracy < 90 && !recordingResult.error && (
              <div className="pronunciation-help" style={{
                marginTop: '12px',
                padding: '12px',
                backgroundColor: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '4px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '14px', color: '#e0e0e0', flex: 1 }}>
                    ¿Necesitas escuchar la pronunciación correcta?
                  </span>
                  <button
                    onClick={playCorrectPronunciation}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      padding: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <img
                      src="/megaf-imperat.png"
                      alt="Reproducir pronunciación correcta"
                      style={{ width: '24px', height: '24px' }}
                    />
                  </button>
                </div>
              </div>
            )}

            {recordingResult.accuracy >= 90 && onContinue && (
              <div className="auto-continue-message" style={{
                marginTop: '12px',
                padding: '8px 12px',
                fontSize: '14px',
                color: '#4ade80',
                backgroundColor: '#0a0a0a',
                border: '1px solid #16a34a',
                borderRadius: '4px',
                fontWeight: 'bold'
              }}>
                ✓ ¡Pronunciación correcta! Avanzando al siguiente...
              </div>
            )}
          </div>

          {recordingResult.originalTranscript && (
            <div className="transcript">
              <strong>Reconocido:</strong> "{recordingResult.originalTranscript}"
            </div>
          )}

          {recordingResult.suggestions && recordingResult.suggestions.length > 0 && (
            <div className="suggestions">
              <strong>Sugerencias:</strong>
              <ul>
                {recordingResult.suggestions.slice(0, 2).map((suggestion, i) => (
                  <li key={i}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="setting-group">
        <button className="btn btn-secondary" onClick={() => {
          // Stop recording if active when closing
          if (isRecording && speechService) {
            speechService.stopListening();
          }
          onClose();
        }}>
          Cerrar
        </button>
      </div>
    </div>
  );
});

export default PronunciationPanelSafe;