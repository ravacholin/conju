import React, { useState, useRef, useEffect, useCallback, useMemo, forwardRef, useImperativeHandle } from 'react';
import { TENSE_LABELS, MOOD_LABELS, PERSON_LABELS } from '../../lib/utils/verbLabels.js';
import SpeechRecognitionService from '../../lib/pronunciation/speechRecognition.js';
import PronunciationAnalyzer from '../../lib/pronunciation/pronunciationAnalyzer.js';
import { convertCurrentItemToPronunciation, speakText } from '../../lib/pronunciation/pronunciationUtils.js';
import { createLogger } from '../../lib/utils/logger.js';
import { useSettings } from '../../state/settings.js';
import { getSpeechLanguagePreferences } from '../../lib/pronunciation/languagePreferences.js';

const logger = createLogger('PronunciationPanelSafe');

const MicIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
  </svg>
);

const SpeakerIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
  </svg>
);

const RESULT_CLASS = (accuracy, error) => {
  if (error) return 'error';
  if (accuracy >= 100) return 'perfect';
  if (accuracy >= 92) return 'excellent';
  if (accuracy >= 80) return 'good';
  if (accuracy >= 65) return 'needs-work';
  return 'incorrect';
};

const PronunciationPanelSafe = forwardRef(function PronunciationPanelSafe({
  currentItem,
  onClose,
  handleResult,
  onContinue,
  onRecordingChange
}, ref) {
  const settings = useSettings();
  const { locale: speechLocale, dialect } = useMemo(
    () => getSpeechLanguagePreferences(settings?.region),
    [settings?.region]
  );
  const [isRecording, setIsRecording] = useState(false);
  const [recordingResult, setRecordingResult] = useState(null);
  const [speechService, setSpeechService] = useState(null);
  const [analyzer] = useState(() => new PronunciationAnalyzer());
  const [isSupported, setIsSupported] = useState(true);
  const [audioWaveform, setAudioWaveform] = useState([]);
  const waveformRef = useRef(null);
  const recordingStartTime = useRef(0);

  const handleResultRef = useRef(handleResult);
  const onContinueRef = useRef(onContinue);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    handleResultRef.current = handleResult;
    onContinueRef.current = onContinue;
    onCloseRef.current = onClose;
  });

  const pronunciationData = useMemo(() => {
    const result = convertCurrentItemToPronunciation(currentItem, {
      dialect,
      region: settings?.region
    });
    return result;
  }, [currentItem, dialect, settings?.region]);

  const playCorrectPronunciation = useCallback(() => {
    if (pronunciationData?.form) {
      speakText(pronunciationData.form, speechLocale, { rate: 0.75 });
    }
  }, [pronunciationData?.form, speechLocale]);

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
      setRecordingResult(null);
      const success = await speechService.startListening({ language: speechLocale });
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

  useImperativeHandle(ref, () => ({ toggleRecording }), [toggleRecording]);

  const handleSpeechResult = useCallback((result) => {
    if (result.isFinal && pronunciationData) {
      setIsRecording(false);

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

      setRecordingResult({
        ...analysis,
        originalTranscript: result.transcript,
        alternatives: result.alternatives
      });

      if (pronunciationData) {
        const isCorrect = analysis.isCorrectForSRS;
        const timing = Date.now() - recordingStartTime.current;

        const trackingResult = {
          correct: isCorrect,
          latencyMs: timing,
          hintsUsed: 0,
          errorTags: isCorrect ? [] : ['pronunciation-error'],
          userAnswer: result.transcript,
          correctAnswer: pronunciationData.form,
          practiceType: 'pronunciation',
          meta: {
            type: 'pronunciation',
            target: pronunciationData.form,
            recognized: result.transcript,
            accuracy: analysis.accuracy,
            pedagogicalScore: analysis.pedagogicalScore,
            confidence: result.confidence,
            timing
          }
        };

        handleResultRef.current(trackingResult);

        if (isCorrect && onContinueRef.current) {
          setTimeout(() => {
            onContinueRef.current();
            onCloseRef.current();
          }, 2000);
        }
      }
    }
  }, [pronunciationData, analyzer]);

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
    onRecordingChange?.(true);
    recordingStartTime.current = Date.now();

    let animationRunning = true;
    const animation = () => {
      if (animationRunning) {
        setAudioWaveform(Array.from({ length: 24 }, () => 8 + Math.random() * 92));
        waveformRef.current = requestAnimationFrame(animation);
      }
    };
    animation();
    waveformRef.stopAnimation = () => { animationRunning = false; };
  }, []);

  const handleSpeechEnd = useCallback(() => {
    setIsRecording(false);
    onRecordingChange?.(false);
    if (waveformRef.stopAnimation) waveformRef.stopAnimation();
    if (waveformRef.current) cancelAnimationFrame(waveformRef.current);
    setAudioWaveform([]);
  }, [onRecordingChange]);

  useEffect(() => {
    if (!speechService) return;
    speechService.setCallbacks({
      onResult: handleSpeechResult,
      onError: handleSpeechError,
      onStart: handleSpeechStart,
      onEnd: handleSpeechEnd
    });
  }, [speechService, handleSpeechResult, handleSpeechError, handleSpeechStart, handleSpeechEnd]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsSupported(false);
      return () => {};
    }

    const service = new SpeechRecognitionService();
    setSpeechService(service);

    let isMounted = true;

    const initializeAndStart = async () => {
      try {
        const compatibility = await service.testCompatibility();
        if (!isMounted) return;

        setIsSupported(compatibility.speechRecognition && compatibility.microphone);

        if (compatibility.speechRecognition && compatibility.microphone) {
          await service.initialize({ language: speechLocale });

          const success = await service.startListening({ language: speechLocale });

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
        if (isMounted) setIsSupported(false);
      }
    };

    initializeAndStart();

    return () => {
      isMounted = false;
      service.destroy?.();
      setSpeechService((prev) => (prev === service ? null : prev));
    };
  }, [speechLocale, dialect]);

  const handleClose = () => {
    if (isRecording && speechService) speechService.stopListening();
    onClose();
  };

  if (!currentItem || !pronunciationData) {
    return (
      <div className="pronunciation-panel-v2">
        <p style={{ color: 'var(--vd-ink2)', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', textAlign: 'center', padding: '20px' }}>
          No hay ítem disponible para pronunciación
        </p>
        <div className="pron-footer">
          <button className="pron-close-btn" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    );
  }

  if (!isSupported) {
    return (
      <div className="pronunciation-panel-v2">
        <p style={{ color: 'var(--vd-ink2)', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', textAlign: 'center', padding: '20px' }}>
          Reconocimiento de voz no disponible en este navegador
        </p>
        <div className="pron-footer">
          <button className="pron-close-btn" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    );
  }

  const resultClass = recordingResult
    ? RESULT_CLASS(recordingResult.accuracy, recordingResult.error)
    : '';

  const contextParts = [
    pronunciationData.person && (PERSON_LABELS[pronunciationData.person] || pronunciationData.person),
    TENSE_LABELS[pronunciationData.tense] || pronunciationData.tense,
    MOOD_LABELS[pronunciationData.mood] || pronunciationData.mood
  ].filter(Boolean);

  return (
    <div className="pronunciation-panel-v2">
      {/* Target word to pronounce */}
      <div className="pron-target-block">
        <div className="pron-target-label">Pronunciar</div>
        <div className="pron-target-word">{pronunciationData.form}</div>
        <div className="pron-target-context">
          {pronunciationData.verb} · {contextParts.join(' · ')}
        </div>

        {/* Listen button */}
        <button
          className="pron-listen-btn"
          onClick={playCorrectPronunciation}
          title="Escuchar pronunciación correcta"
          aria-label="Escuchar pronunciación correcta"
        >
          <SpeakerIcon />
        </button>
      </div>

      {/* Mic button + waveform */}
      <div className="pron-mic-area">
        <button
          className={`pron-mic-btn${isRecording ? ' recording' : ''}`}
          onClick={toggleRecording}
          disabled={!speechService}
          title={isRecording ? 'Detener grabación' : 'Grabar pronunciación'}
          aria-label={isRecording ? 'Detener grabación' : 'Grabar pronunciación'}
        >
          <MicIcon />
        </button>

        {isRecording ? (
          <div className="pron-waveform">
            {audioWaveform.map((h, i) => (
              <div
                key={i}
                className="pron-wave-bar"
                style={{ height: `${Math.max(4, h * 0.3)}px` }}
              />
            ))}
          </div>
        ) : (
          <div className={`pron-mic-label${isRecording ? ' recording' : ''}`}>
            {recordingResult
              ? 'VOLVER A INTENTAR'
              : 'GRABAR'}
          </div>
        )}

        {isRecording && (
          <div className="pron-mic-label recording">GRABANDO — click para detener</div>
        )}
      </div>

      {/* Transcript */}
      {recordingResult?.originalTranscript && (
        <div className="pron-transcript">
          Reconocido: <span>"{recordingResult.originalTranscript}"</span>
        </div>
      )}

      {/* Result block */}
      {recordingResult && (
        <div className={`pron-result ${resultClass}`}>
          {!recordingResult.error && (
            <div className="pron-score-row">
              <div className="pron-score-number">{recordingResult.accuracy}%</div>
              <div className="pron-score-bar-wrap">
                <div
                  className="pron-score-bar"
                  style={{ width: `${recordingResult.accuracy}%` }}
                />
              </div>
            </div>
          )}

          <div className="pron-feedback-text">{recordingResult.feedback}</div>

          {recordingResult.accuracy >= 90 && onContinue && (
            <div className="pron-ok-msg">✓ Pronunciación correcta — avanzando...</div>
          )}

          {recordingResult.suggestions?.length > 0 && (
            <ul className="pron-suggestions">
              {recordingResult.suggestions.slice(0, 2).map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="pron-footer">
        <button className="pron-close-btn" onClick={handleClose}>
          Cerrar
        </button>
      </div>
    </div>
  );
});

export default PronunciationPanelSafe;
