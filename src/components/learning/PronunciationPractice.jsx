import React, { useState, useRef, useEffect, useMemo } from 'react';
import { TENSE_LABELS } from '../../lib/utils/verbLabels.js';
import SpeechRecognitionService from '../../lib/pronunciation/speechRecognition.js';
import PronunciationAnalyzer from '../../lib/pronunciation/pronunciationAnalyzer.js';
import { useProgressTracking } from '../../features/drill/useProgressTracking.js';
import { logger } from '../../lib/utils/logger.js';
import './PronunciationPractice.css';

// Enhanced Text-to-Speech with Spanish voice optimization
const speakText = (text, lang = 'es-ES', options = {}) => {
  if ('speechSynthesis' in window) {
    const speak = () => {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = options.rate || 0.7; // Slower for learning
      utterance.pitch = options.pitch || 1;
      utterance.volume = options.volume || 0.8;

      // Find the best Spanish voice
      const voices = window.speechSynthesis.getVoices();
      const spanishVoices = voices.filter(voice =>
        voice.lang.startsWith('es') || voice.lang.includes('Spanish')
      );

      // Prefer premium voices or specific regional variants
      const preferredVoice = spanishVoices.find(voice =>
        voice.lang === lang || voice.name.includes('Spanish')
      ) || spanishVoices[0];

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      // Event handlers for better UX
      utterance.onstart = () => options.onStart?.();
      utterance.onend = () => options.onEnd?.();
      utterance.onerror = (e) => options.onError?.(e);

      window.speechSynthesis.speak(utterance);
    };

    // Ensure voices are loaded
    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) {
      let hasSpoken = false;
      const speakOnce = () => {
        if (!hasSpoken) {
          hasSpoken = true;
          speak();
        }
      };
      window.speechSynthesis.addEventListener('voiceschanged', speakOnce, { once: true });
      setTimeout(speakOnce, 1000);
    } else {
      speak();
    }
  }
};

// Generate pronunciation data from eligible forms or create fallback data
const generatePronunciationData = (eligibleForms, tense) => {
  console.log('🔍 generatePronunciationData called with:', {
    eligibleFormsLength: eligibleForms?.length,
    tense,
    firstForm: eligibleForms?.[0]
  });

  let selectedForms = [];

  // Try to use eligible forms if available
  if (eligibleForms && eligibleForms.length > 0) {
    // First attempt: exact match with mood and tense
    if (tense?.mood && tense?.tense) {
      selectedForms = eligibleForms.filter(form =>
        form.mood === tense.mood && form.tense === tense.tense
      );
      console.log('🎯 Exact match filter result:', selectedForms.length, 'forms');
    }

    // Second attempt: match by tense only (more permissive)
    if (selectedForms.length === 0 && tense?.tense) {
      selectedForms = eligibleForms.filter(form => form.tense === tense.tense);
      console.log('📝 Tense-only filter result:', selectedForms.length, 'forms');
    }

    // Third attempt: if no forms for specific tense, don't use fallback
    if (selectedForms.length === 0) {
      console.log('❌ No forms found for specified tense/mood:', tense);
      return null; // Don't show pronunciation practice if no relevant forms
    }
  }

  // If no eligible forms and no selected forms, don't show pronunciation practice
  if (selectedForms.length === 0) {
    console.log('❌ No pronunciation data available for this tense/mood');
    return null;
  }

  // Select 5-7 representative forms for practice
  const finalForms = selectedForms
    .slice(0, 7)
    .map(form => ({
      verb: form.verb || form.lemma,
      form: form.value,
      person: form.person,
      mood: form.mood,
      tense: form.tense,
      // Generate basic pronunciation guidance
      ipa: generateIPA(form.value),
      pronunciation: generatePronunciationGuide(form.value),
      tip: generatePronunciationTip(form.value, form.verb || form.lemma),
      audioKey: `${form.verb || form.lemma}_${form.tense}_${form.person}`
    }));

  console.log('✅ Final pronunciation data:', {
    title: `Pronunciación - ${TENSE_LABELS[tense?.tense] || 'Práctica'}`,
    verbsCount: finalForms.length,
    verbs: finalForms
  });

  return finalForms.length > 0 ? {
    title: `Pronunciación - ${TENSE_LABELS[tense?.tense] || 'Práctica'}`,
    verbs: finalForms
  } : null;
};

// Basic IPA generation (simplified)
const generateIPA = (word) => {
  // This is a simplified version - in production you'd use a phonetic dictionary
  return `/${word.replace(/h/g, '').replace(/qu/g, 'k').replace(/c([ei])/g, 'θ$1')}/`;
};

// Generate pronunciation guide
const generatePronunciationGuide = (word) => {
  return word.split('').map(char => {
    switch(char) {
      case 'h': return ''; // Silent
      case 'j': return 'H';
      case 'rr': return 'RR';
      case 'ñ': return 'NY';
      case 'll': return 'LY';
      default: return char.toUpperCase();
    }
  }).join('');
};

// Generate pronunciation tips
const generatePronunciationTip = (word, _verb) => {
  const tips = [];
  if (word.includes('h')) tips.push('La "h" es muda');
  if (word.includes('rr')) tips.push('Vibra la "rr" con la lengua');
  if (word.includes('ñ')) tips.push('Sonido "ny" con la lengua en el paladar');
  if (word.includes('j')) tips.push('"J" suave desde la garganta');
  if (word.includes('ll')) tips.push('"Ll" como "y" en la mayoría de regiones');

  return tips.length > 0 ? tips.join('. ') : 'Pronuncia cada sílaba claramente';
};

function PronunciationPractice({ tense, eligibleForms, onBack, onContinue }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingResult, setRecordingResult] = useState(null);
  const [showPronunciation, setShowPronunciation] = useState(false);
  const [speechService] = useState(() => new SpeechRecognitionService());
  const [analyzer] = useState(() => new PronunciationAnalyzer());
  const [isSupported, setIsSupported] = useState(true);
  const [audioWaveform, setAudioWaveform] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showDetailed, setShowDetailed] = useState(false);
  const [compatibilityInfo, setCompatibilityInfo] = useState(null);
  const audioRef = useRef(null);
  const waveformRef = useRef(null);

  // Progress tracking integration
  const { handleResult } = useProgressTracking(null, () => {});

  // Generate dynamic exercise data from eligible forms
  const exerciseData = useMemo(() => {
    console.log('🎯 PronunciationPractice useMemo triggered:', {
      eligibleFormsLength: eligibleForms?.length,
      eligibleFormsFirst3: eligibleForms?.slice(0, 3),
      tense,
      hasEligibleForms: eligibleForms && eligibleForms.length > 0
    });

    // Always try to generate pronunciation data, even if eligibleForms is empty
    // The generatePronunciationData function now has fallback logic
    return generatePronunciationData(eligibleForms, tense);
  }, [eligibleForms, tense]);

  const currentVerb = exerciseData?.verbs[currentIndex];

  // Initialize speech recognition on component mount
  useEffect(() => {
    const initializeSpeech = async () => {
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
        }
      } catch (error) {
        logger.error('Error initializing speech recognition:', error);
        setIsSupported(false);
      }
    };

    initializeSpeech();

    // Cleanup
    return () => {
      speechService.destroy();
    };
  }, []);

  // Speech recognition event handlers
  const handleSpeechResult = (result) => {
    if (result.isFinal && currentVerb) {
      setIsRecording(false);

      const analysis = analyzer.analyzePronunciation(
        currentVerb.form,
        result.transcript,
        {
          confidence: result.confidence,
          timing: Date.now() - recordingStartTime.current
        }
      );

      setRecordingResult({
        ...analysis,
        originalTranscript: result.transcript,
        alternatives: result.alternatives
      });

      // Track progress
      if (currentVerb) {
        handleResult(analysis.accuracy >= 70, analysis.accuracy, {
          type: 'pronunciation',
          target: currentVerb.form,
          recognized: result.transcript,
          accuracy: analysis.accuracy
        });
      }
    }
  };

  const handleSpeechError = (error) => {
    setIsRecording(false);
    setRecordingResult({
      accuracy: 0,
      feedback: error.message,
      suggestions: error.recoverable ? ['Inténtalo de nuevo'] : ['Verifica tu configuración de micrófono'],
      error: true
    });
  };

  const handleSpeechStart = () => {
    setIsRecording(true);
    recordingStartTime.current = Date.now();
    startWaveformAnimation();
  };

  const handleSpeechEnd = () => {
    setIsRecording(false);
    stopWaveformAnimation();
  };

  const recordingStartTime = useRef(0);

  // Waveform animation
  const startWaveformAnimation = () => {
    const animation = () => {
      if (isRecording) {
        const newWaveform = Array.from({ length: 20 }, () => Math.random() * 100);
        setAudioWaveform(newWaveform);
        waveformRef.current = requestAnimationFrame(animation);
      }
    };
    animation();
  };

  const stopWaveformAnimation = () => {
    if (waveformRef.current) {
      cancelAnimationFrame(waveformRef.current);
    }
    setAudioWaveform([]);
  };

  if (!exerciseData || !currentVerb) {
    return (
      <div className="App">
        <div className="main-content">
          <div className="pronunciation-container">
            <div className="drill-header">
              <button onClick={onBack} className="back-to-menu-btn">
                <img src="/back.png" alt="Volver" className="back-icon" />
                Volver
              </button>
              <h2>Práctica de Pronunciación</h2>
            </div>
            <div className="no-data-message">
              <p>No hay formas verbales disponibles para practicar pronunciación.</p>
              <p>Completa primero algunas lecciones para generar contenido de pronunciación.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isSupported) {
    return (
      <div className="App">
        <div className="main-content">
          <div className="pronunciation-container">
            <div className="drill-header">
              <button onClick={onBack} className="back-to-menu-btn">
                <img src="/back.png" alt="Volver" className="back-icon" />
                Volver
              </button>
              <h2>Práctica de Pronunciación</h2>
            </div>
            <div className="compatibility-error">
              <h3>Reconocimiento de voz no disponible</h3>
              {compatibilityInfo && (
                <div className="error-details">
                  <p><strong>Reconocimiento de voz:</strong> {compatibilityInfo.speechRecognition ? 'Soportado' : 'No soportado'}</p>
                  <p><strong>Micrófono:</strong> {compatibilityInfo.microphone ? 'Disponible' : 'No disponible'}</p>
                  <p><strong>Navegador:</strong> {compatibilityInfo.userAgent}</p>

                  {compatibilityInfo.recommendations.length > 0 && (
                    <div className="recommendations">
                      <h4>Recomendaciones:</h4>
                      <ul>
                        {compatibilityInfo.recommendations.map((rec, i) => (
                          <li key={i}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              <button onClick={onContinue} className="continue-anyway-btn">
                Continuar sin práctica de pronunciación
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handlePlayAudio = () => {
    if (isPlaying) return;

    setIsPlaying(true);

    // Try prerecorded audio first, fallback to TTS
    const audioFile = `/audio/spanish/${currentVerb.audioKey}.mp3`;

    if (audioRef.current) {
      audioRef.current.src = audioFile;
      audioRef.current.play()
        .then(() => {
          // Audio file played successfully
        })
        .catch((error) => {
          // Fallback to enhanced TTS
          logger.debug('Audio file not found, using TTS:', error.message);
          speakText(currentVerb.form, 'es-ES', {
            rate: 0.7,
            onStart: () => setIsPlaying(true),
            onEnd: () => setIsPlaying(false),
            onError: () => setIsPlaying(false)
          });
        });
    } else {
      // Direct TTS fallback
      speakText(currentVerb.form, 'es-ES', {
        rate: 0.7,
        onStart: () => setIsPlaying(true),
        onEnd: () => setIsPlaying(false),
        onError: () => setIsPlaying(false)
      });
    }
  };

  // Audio ended event
  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  const handleStartRecording = async () => {
    try {
      setRecordingResult(null);
      setShowDetailed(false);

      // Start speech recognition
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
    } catch (error) {
      logger.error('Error starting recording:', error);
      setIsRecording(false);
      setRecordingResult({
        accuracy: 0,
        feedback: 'Error al acceder al micrófono',
        suggestions: ['Verifica que tu micrófono esté conectado', 'Permite el acceso al micrófono en tu navegador'],
        error: true
      });
    }
  };

  const handleStopRecording = () => {
    speechService.stopListening();
  };

  const handleNext = () => {
    if (currentIndex < exerciseData.verbs.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setRecordingResult(null);
      setShowPronunciation(false);
      setShowDetailed(false);
    } else {
      onContinue();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setRecordingResult(null);
      setShowPronunciation(false);
      setShowDetailed(false);
    }
  };

  const handleRepeatWord = () => {
    handlePlayAudio();
  };

  const handleSkipWord = () => {
    handleNext();
  };

  return (
    <div className="App">
      <div className="main-content">
        <div className="pronunciation-container">
          <div className="drill-header">
            <button onClick={onBack} className="back-to-menu-btn">
              <img src="/back.png" alt="Volver" className="back-icon" />
              Volver
            </button>
            <h2>{exerciseData.title}</h2>
          </div>

          <div className="progress-indicator">
            <span>{currentIndex + 1} de {exerciseData.verbs.length}</span>
          </div>

          <div className="pronunciation-card">
            <div className="verb-info">
              <h3 className="target-verb">{currentVerb.form}</h3>
              <p className="verb-infinitive">({currentVerb.verb})</p>
            </div>

            <div className="audio-section">
              <button
                className={`play-audio-btn ${isPlaying ? 'playing' : ''}`}
                onClick={handlePlayAudio}
                disabled={isPlaying}
              >
                <span className="play-icon">{isPlaying ? '⏸️' : '▶️'}</span>
                {isPlaying ? 'Reproduciendo...' : 'Escuchar pronunciación'}
              </button>
              <audio
                ref={audioRef}
                style={{ display: 'none' }}
                onEnded={handleAudioEnded}
                onError={() => setIsPlaying(false)}
              />

              <div className="verb-context">
                <span className="verb-person">
                  {currentVerb.person && `${currentVerb.person} persona`}
                </span>
                <span className="verb-mood-tense">
                  {TENSE_LABELS[currentVerb.tense]} - {currentVerb.mood}
                </span>
              </div>
            </div>

            <div className="pronunciation-guide">
              <button 
                className="show-pronunciation-btn"
                onClick={() => setShowPronunciation(!showPronunciation)}
              >
                {showPronunciation ? 'Ocultar' : 'Mostrar'} guía de pronunciación
              </button>
              
              {showPronunciation && (
                <div className="pronunciation-details">
                  <div className="ipa-notation">
                    <label>IPA:</label>
                    <span>{currentVerb.ipa}</span>
                  </div>
                  <div className="simplified-pronunciation">
                    <label>Pronunciación:</label>
                    <span>{currentVerb.pronunciation}</span>
                  </div>
                  <div className="pronunciation-tip">
                    <label>Consejo:</label>
                    <span>{currentVerb.tip}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="recording-section">
              <div className="recording-controls">
                <button
                  className={`record-btn ${isRecording ? 'recording' : ''}`}
                  onClick={isRecording ? handleStopRecording : handleStartRecording}
                  disabled={isPlaying}
                >
                  <span className="mic-icon">●</span>
                  {isRecording ? 'Detener grabación' : 'Grabar mi pronunciación'}
                </button>

                {isRecording && (
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
                    <span className="recording-text">Escuchando...</span>
                  </div>
                )}
              </div>

              {recordingResult && (
                <div className={`recording-result ${
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

                  {recordingResult.detailedAnalysis && (
                    <div className="detailed-toggle">
                      <button
                        className="show-detailed-btn"
                        onClick={() => setShowDetailed(!showDetailed)}
                      >
                        {showDetailed ? 'Ocultar' : 'Ver'} análisis detallado
                      </button>

                      {showDetailed && (
                        <div className="detailed-analysis">
                          <div className="analysis-grid">
                            <div className="analysis-item">
                              <label>Similitud de texto:</label>
                              <span>{recordingResult.detailedAnalysis.textSimilarity?.similarity || 0}%</span>
                            </div>
                            <div className="analysis-item">
                              <label>Análisis fonético:</label>
                              <span>{recordingResult.detailedAnalysis.phoneticAnalysis?.overall_score || 0}%</span>
                            </div>
                            <div className="analysis-item">
                              <label>Vocales:</label>
                              <span>{recordingResult.detailedAnalysis.phoneticAnalysis?.vowel_accuracy || 0}%</span>
                            </div>
                            <div className="analysis-item">
                              <label>Consonantes:</label>
                              <span>{recordingResult.detailedAnalysis.phoneticAnalysis?.consonant_accuracy || 0}%</span>
                            </div>
                          </div>

                          {recordingResult.phoneticsBreakdown && (
                            <div className="phonetics-breakdown">
                              <h4>Análisis fonético de "{recordingResult.phoneticsBreakdown.word}":</h4>
                              <div className="breakdown-details">
                                <p><strong>Sílabas:</strong> {recordingResult.phoneticsBreakdown.syllables}</p>
                                <p><strong>Vocales:</strong> {recordingResult.phoneticsBreakdown.vowels}</p>
                                <p><strong>Consonantes:</strong> {recordingResult.phoneticsBreakdown.consonants}</p>
                                <p><strong>Patrón de acento:</strong> {recordingResult.phoneticsBreakdown.stress_pattern}</p>
                              </div>

                              {recordingResult.phoneticsBreakdown.difficulty_elements?.length > 0 && (
                                <div className="difficulty-elements">
                                  <h5>Elementos de dificultad:</h5>
                                  {recordingResult.phoneticsBreakdown.difficulty_elements.map((element, i) => (
                                    <div key={i} className="difficulty-item">
                                      <strong>{element.element}</strong> ({element.type}): {element.tip}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="result-actions">
                    <button className="action-btn repeat-btn" onClick={handleRepeatWord}>
                      <span className="action-icon">↻</span>
                      Repetir ejemplo
                    </button>
                    <button className="action-btn try-again-btn" onClick={handleStartRecording}>
                      <span className="action-icon">●</span>
                      Intentar de nuevo
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="navigation-buttons">
              <button
                className="nav-btn prev-btn"
                onClick={handlePrevious}
                disabled={currentIndex === 0}
              >
                ← Anterior
              </button>

              <div className="center-actions">
                <button className="action-btn skip-btn" onClick={handleSkipWord}>
                  Saltar palabra
                </button>
              </div>

              <button
                className="nav-btn next-btn"
                onClick={handleNext}
              >
                {currentIndex < exerciseData.verbs.length - 1 ? 'Siguiente →' : 'Continuar →'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PronunciationPractice;