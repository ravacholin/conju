import React, { useState, useRef, useEffect, useCallback, useMemo, forwardRef, useImperativeHandle } from 'react';
import { TENSE_LABELS } from '../../lib/utils/verbLabels.js';
import SpeechRecognitionService from '../../lib/pronunciation/speechRecognition.js';
import PronunciationAnalyzer from '../../lib/pronunciation/pronunciationAnalyzer.js';
import { convertCurrentItemToPronunciation } from '../../lib/pronunciation/pronunciationUtils.js';
import { logger } from '../../lib/utils/logger.js';

const PronunciationPanelSafe = forwardRef(function PronunciationPanelSafe({
  currentItem,
  onClose,
  handleResult,
  onContinue
}, ref) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingResult, setRecordingResult] = useState(null);
  const [speechService] = useState(() => new SpeechRecognitionService());
  const [analyzer] = useState(() => new PronunciationAnalyzer());
  const [isSupported, setIsSupported] = useState(true);
  const [audioWaveform, setAudioWaveform] = useState([]);
  const [compatibilityInfo, setCompatibilityInfo] = useState(null);
  const waveformRef = useRef(null);
  const recordingStartTime = useRef(0);
  const initializeOnceRef = useRef(false);

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
    if (isRecording) {
      speechService.stopListening();
    } else {
      const success = await speechService.startListening({
        language: 'es-ES'
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
  }, [isRecording, speechService]);

  // Expose toggleRecording function via ref
  useImperativeHandle(ref, () => ({
    toggleRecording
  }), [toggleRecording]);

  // Convertir currentItem a formato de pronunciación - MEMOIZADO para evitar recálculos
  const pronunciationData = useMemo(() => {
    return convertCurrentItemToPronunciation(currentItem);
  }, [currentItem]);

  // Speech recognition event handlers - ESTABLES CON useCallback
  const handleSpeechResult = useCallback((result) => {
    if (result.isFinal && pronunciationData) {
      setIsRecording(false);

      const analysis = analyzer.analyzePronunciation(
        pronunciationData.form,
        result.transcript,
        {
          confidence: result.confidence,
          timing: Date.now() - recordingStartTime.current
        }
      );

      // FALLBACK: Si el analyzer no funciona, crear análisis básico
      let finalAnalysis = analysis;
      if (!analysis || analysis.accuracy === undefined) {
        const targetLower = pronunciationData.form.toLowerCase();
        const recognizedLower = result.transcript.toLowerCase();

        const isExactMatch = targetLower === recognizedLower;
        const isSimilar = targetLower.includes(recognizedLower) || recognizedLower.includes(targetLower);

        finalAnalysis = {
          accuracy: isExactMatch ? 95 : (isSimilar ? 75 : 30),
          feedback: isExactMatch ? '¡Perfecto!' :
                   isSimilar ? 'Muy bien, casi perfecto' :
                   'Inténtalo de nuevo',
          suggestions: isExactMatch ? [] : ['Pronuncia más claramente cada sílaba']
        };
      }

      setRecordingResult({
        ...finalAnalysis,
        originalTranscript: result.transcript,
        alternatives: result.alternatives
      });

      // Track progress usando refs estables
      if (pronunciationData) {
        const isCorrect = finalAnalysis.accuracy >= 60;
        handleResultRef.current(isCorrect, finalAnalysis.accuracy, {
          type: 'pronunciation',
          target: pronunciationData.form,
          recognized: result.transcript,
          accuracy: finalAnalysis.accuracy
        });

        // No auto-advance - keep panel open for feedback
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

  // Initialize ONLY ONCE
  useEffect(() => {
    if (initializeOnceRef.current) return;
    initializeOnceRef.current = true;

    const initializeAndStart = async () => {
      try {
        const compatibility = await speechService.testCompatibility();
        setCompatibilityInfo(compatibility);
        setIsSupported(compatibility.speechRecognition && compatibility.microphone);

        if (compatibility.speechRecognition && compatibility.microphone) {
          await speechService.initialize({ language: 'es-ES' });

          speechService.setCallbacks({
            onResult: handleSpeechResult,
            onError: handleSpeechError,
            onStart: handleSpeechStart,
            onEnd: handleSpeechEnd
          });

          // START RECORDING IMMEDIATELY
          const success = await speechService.startListening({
            language: 'es-ES'
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
      } catch (error) {
        logger.error('Error initializing speech recognition:', error);
        setIsSupported(false);
      }
    };

    initializeAndStart();

    return () => {
      speechService.destroy();
    };
  }, []); // EMPTY DEPS - inicializa solo una vez

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
            {pronunciationData.person && `${pronunciationData.person} persona`} • {' '}
            {TENSE_LABELS[pronunciationData.tense]} - {pronunciationData.mood}
          </p>
        </div>
      </div>

      {recordingResult && (
        <div className={`setting-group recording-result ${
          recordingResult.error ? 'error' :
          recordingResult.accuracy > 80 ? 'excellent' :
          recordingResult.accuracy > 70 ? 'good' :
          recordingResult.accuracy > 50 ? 'fair' : 'needs-work'
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
            {recordingResult.accuracy >= 60 && (
              <div className="success-message" style={{
                marginTop: '8px',
                fontSize: '14px',
                color: '#28a745',
                fontWeight: 'bold'
              }}>
                ✓ ¡Pronunciación correcta!
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
          if (isRecording) {
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