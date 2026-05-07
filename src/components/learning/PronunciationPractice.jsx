import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { BackSvg } from '../shared/DrillIcons.jsx';
import { TENSE_LABELS } from '../../lib/utils/verbLabels.js';
import SpeechRecognitionService from '../../lib/pronunciation/speechRecognition.js';
import PronunciationAnalyzer from '../../lib/pronunciation/pronunciationAnalyzer.js';
import { useProgressTracking } from '../../features/drill/useProgressTracking.js';
import { createLogger } from '../../lib/utils/logger.js';
import './PronunciationPractice.css';

const logger = createLogger('learning:PronunciationPractice');

const resolveWindow = () => {
  if (typeof globalThis === 'undefined') {
    return { win: undefined, isFallback: true };
  }

  if (typeof globalThis.window !== 'undefined') {
    return { win: globalThis.window, isFallback: false };
  }

  if (globalThis.document && globalThis.document.defaultView) {
    const fallbackWindow = globalThis.document.defaultView;
    try {
      Object.defineProperty(globalThis, 'window', {
        configurable: true,
        enumerable: true,
        get: () => fallbackWindow
      });
    } catch {
      globalThis.window = fallbackWindow;
    }
    return { win: fallbackWindow, isFallback: true };
  }

  return { win: undefined, isFallback: true };
};

// Enhanced Text-to-Speech with Spanish voice optimization
const speakText = (text, lang = 'es-ES', options = {}) => {
  const { win } = resolveWindow();
  if (!win || !('speechSynthesis' in win)) {
    return;
  }

  const speak = () => {
    // Cancel any ongoing speech
    win.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = options.rate || 0.7; // Slower for learning
    utterance.pitch = options.pitch || 1;
    utterance.volume = options.volume || 0.8;

    // Find the best Spanish voice
    const voices = win.speechSynthesis.getVoices();
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

    try {
      win.speechSynthesis.speak(utterance);
    } catch (error) {
      options.onError?.(error);
    }
  };

  // Ensure voices are loaded
  const voices = win.speechSynthesis.getVoices();
  if (voices.length === 0) {
    let hasSpoken = false;
    const speakOnce = () => {
      if (!hasSpoken) {
        hasSpoken = true;
        speak();
      }
    };
    win.speechSynthesis.addEventListener('voiceschanged', speakOnce, { once: true });
    setTimeout(speakOnce, 1000);
  } else {
    speak();
  }
};

// On-demand form generator for guaranteed pronunciation content
const generateFormsForTense = (tenseMood) => {
  const basicVerbs = [
    { lemma: 'hablar', type: 'regular' },
    { lemma: 'comer', type: 'regular' },
    { lemma: 'vivir', type: 'regular' },
    { lemma: 'ser', type: 'irregular' },
    { lemma: 'tener', type: 'irregular' },
    { lemma: 'hacer', type: 'irregular' },
    { lemma: 'ir', type: 'irregular' }
  ];

  const conjugationMap = {
    // Presente indicativo
    'indicative-pres': {
      'hablar': ['hablo', 'hablas', 'habla', 'hablamos', 'habláis', 'hablan'],
      'comer': ['como', 'comes', 'come', 'comemos', 'coméis', 'comen'],
      'vivir': ['vivo', 'vives', 'vive', 'vivimos', 'vivís', 'viven'],
      'ser': ['soy', 'eres', 'es', 'somos', 'sois', 'son'],
      'tener': ['tengo', 'tienes', 'tiene', 'tenemos', 'tenéis', 'tienen'],
      'hacer': ['hago', 'haces', 'hace', 'hacemos', 'hacéis', 'hacen'],
      'ir': ['voy', 'vas', 'va', 'vamos', 'vais', 'van']
    },
    // Pretérito indefinido
    'indicative-pretIndef': {
      'hablar': ['hablé', 'hablaste', 'habló', 'hablamos', 'hablasteis', 'hablaron'],
      'comer': ['comí', 'comiste', 'comió', 'comimos', 'comisteis', 'comieron'],
      'vivir': ['viví', 'viviste', 'vivió', 'vivimos', 'vivisteis', 'vivieron'],
      'ser': ['fui', 'fuiste', 'fue', 'fuimos', 'fuisteis', 'fueron'],
      'tener': ['tuve', 'tuviste', 'tuvo', 'tuvimos', 'tuvisteis', 'tuvieron'],
      'hacer': ['hice', 'hiciste', 'hizo', 'hicimos', 'hicisteis', 'hicieron'],
      'ir': ['fui', 'fuiste', 'fue', 'fuimos', 'fuisteis', 'fueron']
    },
    // Imperfecto
    'indicative-impf': {
      'hablar': ['hablaba', 'hablabas', 'hablaba', 'hablábamos', 'hablabais', 'hablaban'],
      'comer': ['comía', 'comías', 'comía', 'comíamos', 'comíais', 'comían'],
      'vivir': ['vivía', 'vivías', 'vivía', 'vivíamos', 'vivíais', 'vivían'],
      'ser': ['era', 'eras', 'era', 'éramos', 'erais', 'eran'],
      'tener': ['tenía', 'tenías', 'tenía', 'teníamos', 'teníais', 'tenían'],
      'hacer': ['hacía', 'hacías', 'hacía', 'hacíamos', 'hacíais', 'hacían'],
      'ir': ['iba', 'ibas', 'iba', 'íbamos', 'ibais', 'iban']
    },
    // Futuro
    'indicative-fut': {
      'hablar': ['hablaré', 'hablarás', 'hablará', 'hablaremos', 'hablaréis', 'hablarán'],
      'comer': ['comeré', 'comerás', 'comerá', 'comeremos', 'comeréis', 'comerán'],
      'vivir': ['viviré', 'vivirás', 'vivirá', 'viviremos', 'viviréis', 'vivirán'],
      'ser': ['seré', 'serás', 'será', 'seremos', 'seréis', 'serán'],
      'tener': ['tendré', 'tendrás', 'tendrá', 'tendremos', 'tendréis', 'tendrán'],
      'hacer': ['haré', 'harás', 'hará', 'haremos', 'haréis', 'harán'],
      'ir': ['iré', 'irás', 'irá', 'iremos', 'iréis', 'irán']
    },
    // Condicional
    'conditional-cond': {
      'hablar': ['hablaría', 'hablarías', 'hablaría', 'hablaríamos', 'hablaríais', 'hablarían'],
      'comer': ['comería', 'comerías', 'comería', 'comeríamos', 'comeríais', 'comerían'],
      'vivir': ['viviría', 'vivirías', 'viviría', 'viviríamos', 'viviríais', 'vivirían'],
      'ser': ['sería', 'serías', 'sería', 'seríamos', 'seríais', 'serían'],
      'tener': ['tendría', 'tendrías', 'tendría', 'tendríamos', 'tendríais', 'tendrían'],
      'hacer': ['haría', 'harías', 'haría', 'haríamos', 'haríais', 'harían'],
      'ir': ['iría', 'irías', 'iría', 'iríamos', 'iríais', 'irían']
    },
    // Presente subjuntivo
    'subjunctive-subjPres': {
      'hablar': ['hable', 'hables', 'hable', 'hablemos', 'habléis', 'hablen'],
      'comer': ['coma', 'comas', 'coma', 'comamos', 'comáis', 'coman'],
      'vivir': ['viva', 'vivas', 'viva', 'vivamos', 'viváis', 'vivan'],
      'ser': ['sea', 'seas', 'sea', 'seamos', 'seáis', 'sean'],
      'tener': ['tenga', 'tengas', 'tenga', 'tengamos', 'tengáis', 'tengan'],
      'hacer': ['haga', 'hagas', 'haga', 'hagamos', 'hagáis', 'hagan'],
      'ir': ['vaya', 'vayas', 'vaya', 'vayamos', 'vayáis', 'vayan']
    }
  };

  const persons = ['1s', '2s', '3s', '1p', '2p', '3p'];
  const tenseKey = `${tenseMood.mood}-${tenseMood.tense}`;
  const conjugations = conjugationMap[tenseKey];

  if (!conjugations) {
    logger.warn(`No conjugations available for ${tenseKey}, using present as fallback`);
    return generateFormsForTense({ mood: 'indicative', tense: 'pres' });
  }

  const generatedForms = [];
  basicVerbs.forEach(verb => {
    const forms = conjugations[verb.lemma];
    if (forms) {
      forms.forEach((value, index) => {
        if (index < persons.length) {
          generatedForms.push({
            lemma: verb.lemma,
            verb: verb.lemma,
            value: value,
            person: persons[index],
            mood: tenseMood.mood,
            tense: tenseMood.tense,
            type: verb.type
          });
        }
      });
    }
  });

  return generatedForms;
};

// Generate pronunciation data from eligible forms or create fallback data
const generatePronunciationData = (eligibleForms, tense) => {
  logger.debug('generatePronunciationData called with:', {
    eligibleFormsLength: eligibleForms?.length,
    tense,
    firstForm: eligibleForms?.[0]
  });

  let selectedForms = [];

  // STRATEGY 1: Try to use eligible forms if available
  if (eligibleForms && eligibleForms.length > 0) {
    // First attempt: exact match with mood and tense
    if (tense?.mood && tense?.tense) {
      // Normalize mood names: Spanish -> English
      const normalizedMood = tense.mood === 'indicativo' ? 'indicative' :
                            tense.mood === 'subjuntivo' ? 'subjunctive' :
                            tense.mood === 'imperativo' ? 'imperative' :
                            tense.mood === 'condicional' ? 'conditional' :
                            tense.mood;

      selectedForms = eligibleForms.filter(form =>
        form.mood === normalizedMood && form.tense === tense.tense
      );
      logger.debug('Exact match filter result', {
        count: selectedForms.length,
        normalized: `${tense.mood} -> ${normalizedMood}`
      });
    }

    // Second attempt: match by tense only (more permissive)
    if (selectedForms.length === 0 && tense?.tense) {
      selectedForms = eligibleForms.filter(form => form.tense === tense.tense);
      logger.debug('Tense-only filter result:', { count: selectedForms.length });
    }
  }

  // STRATEGY 2: If no eligible forms or insufficient forms, generate guaranteed forms
  if (selectedForms.length < 5) {
    logger.debug('Insufficient forms from eligibleForms, generating guaranteed forms', { tense });

    if (tense?.mood && tense?.tense) {
      // Use the same mood normalization for generated forms
      const normalizedMood = tense.mood === 'indicativo' ? 'indicative' :
                            tense.mood === 'subjuntivo' ? 'subjunctive' :
                            tense.mood === 'imperativo' ? 'imperative' :
                            tense.mood === 'condicional' ? 'conditional' :
                            tense.mood;

      const generatedForms = generateFormsForTense({ mood: normalizedMood, tense: tense.tense });

      if (generatedForms.length > 0) {
        // Merge with existing selectedForms, avoiding duplicates
        const existingValues = new Set(selectedForms.map(f => f.value));
        const newForms = generatedForms.filter(f => !existingValues.has(f.value));
        selectedForms = [...selectedForms, ...newForms];
        logger.debug('Added generated forms', { newCount: newForms.length, total: selectedForms.length });
      }
    }
  }

  // STRATEGY 3: Final safety check - if still no forms, this shouldn't happen with our generator
  if (selectedForms.length === 0) {
    logger.error('CRITICAL: No forms available even after generation');
    // Emergency fallback - use presente if all else fails
    const emergencyForms = generateFormsForTense({ mood: 'indicative', tense: 'pres' });
    selectedForms = emergencyForms.slice(0, 5);
    logger.warn('Using emergency presente fallback', { count: selectedForms.length });
  }

  // Select 5-7 representative forms for practice
  const finalForms = selectedForms
    .slice(0, 7)
    .map(form => {
      logger.debug('Processing form for pronunciation', {
        verb: form.verb || form.lemma,
        value: form.value,
        person: form.person,
        mood: form.mood,
        tense: form.tense
      });
      return {
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
      };
    });

  logger.debug('Final pronunciation data', {
    title: `Pronunciación - ${TENSE_LABELS[tense?.tense] || 'Práctica'}`,
    verbsCount: finalForms.length
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
  const { win, isFallback } = resolveWindow();
  const ssrMocked = typeof globalThis !== 'undefined' && globalThis.__SSR_WINDOW_FALLBACK__;

  if (!win || isFallback || ssrMocked) {
    if (ssrMocked && typeof globalThis !== 'undefined') {
      delete globalThis.__SSR_WINDOW_FALLBACK__;
    }
    return (
      <div className="App">
        <div className="main-content">
          <div className="pronunciation-container">
            <div className="drill-header">
              <button onClick={onBack} className="back-to-menu-btn">
                <BackSvg size={20} />
                Volver
              </button>
              <h2>Práctica de Pronunciación</h2>
            </div>
            <div className="compatibility-error">
              <h3>Reconocimiento de voz no disponible</h3>
              <div className="error-details">
                <p><strong>Reconocimiento de voz:</strong> No soportado</p>
                <p><strong>Micrófono:</strong> No disponible</p>
                <p><strong>Navegador:</strong> SSR environment</p>
              </div>
              <button onClick={onContinue} className="continue-anyway-btn">
                Continuar sin práctica de pronunciación
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (typeof globalThis !== 'undefined' && globalThis.__SSR_WINDOW_FALLBACK__) {
    delete globalThis.__SSR_WINDOW_FALLBACK__;
  }

  const logger = useMemo(() => createLogger('PronunciationPractice'), []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingResult, setRecordingResult] = useState(null);
  const [showPronunciation, setShowPronunciation] = useState(false);
  const [speechService, setSpeechService] = useState(null);
  const [analyzer] = useState(() => new PronunciationAnalyzer());
  const [isSupported, setIsSupported] = useState(true);
  const [audioWaveform, setAudioWaveform] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showDetailed, setShowDetailed] = useState(false);
  const [compatibilityInfo, setCompatibilityInfo] = useState(null);
  const audioRef = useRef(null);
  const waveformRef = useRef(null);
  const recordingStartTime = useRef(0);
  const isRecordingRef = useRef(false);


  // Generate dynamic exercise data from eligible forms
  const exerciseData = useMemo(() => {
    logger.debug('PronunciationPractice useMemo triggered', {
      eligibleFormsLength: eligibleForms?.length,
      tense,
      hasEligibleForms: eligibleForms && eligibleForms.length > 0
    });

    // Always try to generate pronunciation data, even if eligibleForms is empty
    // The generatePronunciationData function now has fallback logic
    return generatePronunciationData(eligibleForms, tense);
  }, [eligibleForms, tense]);

  const currentVerb = exerciseData?.verbs[currentIndex];

  // Create stable pronunciation item for progress tracking
  const currentPronunciationItem = useMemo(() => {
    if (!currentVerb) return null;

    return {
      id: `${currentVerb.verb}|${currentVerb.tense}|${currentVerb.person}`, // Stable identifier
      verb: currentVerb.verb,
      value: currentVerb.form,
      mood: currentVerb.mood,
      tense: currentVerb.tense,
      person: currentVerb.person,
      type: 'pronunciation', // Mark as pronunciation exercise
      // Add minimal metadata for tracking
      meta: {
        exerciseType: 'pronunciation',
        targetForm: currentVerb.form,
        audioKey: currentVerb.audioKey,
        difficulty: currentVerb.difficulty || 'medium'
      }
    };
  }, [currentVerb]);

  // Progress tracking integration with real handler
  const handleProgressResult = useCallback((result) => {
    logger.debug('Pronunciation result tracked', {
      item: currentPronunciationItem?.id,
      correct: result.correct
    });
    // onResult callback if provided (none expected in this component currently)
  }, [currentPronunciationItem]);

  const progressTracking = useProgressTracking(currentPronunciationItem, handleProgressResult) || {};
  const trackProgress = progressTracking.handleResult || (() => {});

  // Initialize speech recognition on component mount
  useEffect(() => {
    // Only initialize if window is available (client-side)
    const { win } = resolveWindow();
    if (!win) {
      setIsSupported(false);
      setCompatibilityInfo({
        speechRecognition: false,
        microphone: false,
        language: 'unknown',
        userAgent: 'SSR environment',
        recommendations: ['Speech recognition not available in server-side environment']
      });
      return;
    }

    const service = new SpeechRecognitionService();
    let isMounted = true;
    setSpeechService(service);

    const initializeSpeech = async () => {
      try {
        const compatibility = await service.testCompatibility();
        if (!isMounted) return;

        setCompatibilityInfo(compatibility);
        const supported = compatibility.speechRecognition && compatibility.microphone;
        setIsSupported(supported);

        if (supported) {
          await service.initialize({ language: 'es-ES' });
        }
      } catch (error) {
        if (!isMounted) return;
        logger.error('Error initializing speech recognition:', error);
        setIsSupported(false);
        setCompatibilityInfo(prev => prev || {
          speechRecognition: false,
          microphone: false,
          language: typeof navigator !== 'undefined' ? navigator.language || 'unknown' : 'unknown',
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown environment',
          recommendations: ['Speech recognition not available in this environment']
        });
      }
    };

    initializeSpeech();

    // Cleanup
    return () => {
      isMounted = false;
      if (typeof service.destroy === 'function') {
        service.destroy();
      }
    };
  }, [logger]);

  // Speech recognition event handlers
  // Waveform animation
  const startWaveformAnimation = useCallback(() => {
    const animate = () => {
      if (isRecordingRef.current) {
        const newWaveform = Array.from({ length: 20 }, () => Math.random() * 100);
        setAudioWaveform(newWaveform);
        waveformRef.current = requestAnimationFrame(animate);
      }
    };

    if (waveformRef.current) {
      cancelAnimationFrame(waveformRef.current);
    }

    animate();
  }, []);

  const stopWaveformAnimation = useCallback(() => {
    if (waveformRef.current) {
      cancelAnimationFrame(waveformRef.current);
      waveformRef.current = null;
    }
    setAudioWaveform([]);
  }, []);

  const handleSpeechResult = useCallback((result) => {
    if (result.isFinal && currentVerb) {
      setIsRecording(false);
      isRecordingRef.current = false;

      logger.debug('Speech result received', {
        target: currentVerb.form,
        recognized: result.transcript,
        currentIndex: currentIndex
      });

      const analysis = analyzer.analyzePronunciation(
        currentVerb.form,
        result.transcript,
        {
          verb: currentVerb.verb,
          mood: currentVerb.mood,
          tense: currentVerb.tense,
          person: currentVerb.person,
          confidence: result.confidence,
          timing: Date.now() - recordingStartTime.current
        }
      );

      setRecordingResult({
        ...analysis,
        originalTranscript: result.transcript,
        alternatives: result.alternatives
      });

      if (currentVerb && currentPronunciationItem) {
        const isCorrect = analysis.isCorrectForSRS || analysis.accuracy >= 90;
        const timing = Date.now() - recordingStartTime.current;

        logger.debug('STRICT Pronunciation Tracking', {
          isCorrect,
          accuracy: analysis.accuracy,
          pedagogicalScore: analysis.pedagogicalScore,
          semanticType: analysis.semanticValidation?.type,
          item: currentPronunciationItem.id,
          timing
        });

        const trackingResult = {
          correct: isCorrect,
          latencyMs: timing,
          hintsUsed: 0,
          errorTags: analysis.isCorrectForSRS ? [] : ['pronunciation-error'],
          userAnswer: result.transcript,
          correctAnswer: currentVerb.form,
          meta: {
            type: 'pronunciation',
            target: currentVerb.form,
            recognized: result.transcript,
            accuracy: analysis.accuracy,
            pedagogicalScore: analysis.pedagogicalScore,
            semanticType: analysis.semanticValidation?.type,
            confidence: result.confidence,
            timing
          }
        };

        trackProgress(trackingResult);
      }
    }
  }, [analyzer, currentIndex, currentPronunciationItem, currentVerb, trackProgress]);

  const handleSpeechError = useCallback((error) => {
    setIsRecording(false);
    isRecordingRef.current = false;
    setRecordingResult({
      accuracy: 0,
      feedback: error.message,
      suggestions: error.recoverable ? ['Inténtalo de nuevo'] : ['Verifica tu configuración de micrófono'],
      error: true
    });
  }, []);

  const handleSpeechStart = useCallback(() => {
    setIsRecording(true);
    isRecordingRef.current = true;
    recordingStartTime.current = Date.now();
    startWaveformAnimation();
  }, [startWaveformAnimation]);

  const handleSpeechEnd = useCallback(() => {
    setIsRecording(false);
    isRecordingRef.current = false;
    stopWaveformAnimation();
  }, [stopWaveformAnimation]);

  useEffect(() => {
    if (!speechService) return;

    speechService.setCallbacks({
      onResult: handleSpeechResult,
      onError: handleSpeechError,
      onStart: handleSpeechStart,
      onEnd: handleSpeechEnd
    });
  }, [speechService, handleSpeechResult, handleSpeechError, handleSpeechStart, handleSpeechEnd]);

  if (!exerciseData || !currentVerb) {
    return (
      <div className="App">
        <div className="main-content">
          <div className="pronunciation-container">
            <div className="drill-header">
              <button onClick={onBack} className="back-to-menu-btn">
                <BackSvg size={20} />
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
                <BackSvg size={20} />
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
    if (!speechService) {
      setIsRecording(false);
      isRecordingRef.current = false;
      setRecordingResult({
        accuracy: 0,
        feedback: 'Servicio de reconocimiento de voz no disponible',
        suggestions: ['Recarga la página y verifica tu navegador'],
        error: true
      });
      return;
    }

    try {
      setRecordingResult(null);
      setShowDetailed(false);

      // Start speech recognition
      const success = await speechService.startListening({
        language: 'es-ES'
      });

      if (!success) {
        setIsRecording(false);
        isRecordingRef.current = false;
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
      isRecordingRef.current = false;
      setRecordingResult({
        accuracy: 0,
        feedback: 'Error al acceder al micrófono',
        suggestions: ['Verifica que tu micrófono esté conectado', 'Permite el acceso al micrófono en tu navegador'],
        error: true
      });
    }
  };

  const handleStopRecording = () => {
    if (speechService) {
      speechService.stopListening();
    }
    setIsRecording(false);
    isRecordingRef.current = false;
    stopWaveformAnimation();
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

  // Function to play correct pronunciation for incorrect answers
  const playCorrectPronunciation = () => {
    if (currentVerb?.form) {
      logger.debug('Playing correct pronunciation', { form: currentVerb.form });
      speakText(currentVerb.form, 'es-ES', {
        rate: 0.7,
        onStart: () => logger.debug('Started playing correct pronunciation'),
        onEnd: () => logger.debug('Finished playing correct pronunciation'),
        onError: (error) => logger.error('Error playing correct pronunciation', error)
      });
    }
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
                        padding: '8px',
                        backgroundColor: '#f8f9fa',
                        borderLeft: '4px solid #007bff',
                        borderRadius: '4px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '16px' }}>🔊</span>
                          <span style={{ fontSize: '14px', color: '#495057', flex: '1' }}>
                            ¿Necesitas escuchar la pronunciación correcta?
                          </span>
                          <button
                            onClick={playCorrectPronunciation}
                            style={{
                              background: '#007bff',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '6px 12px',
                              fontSize: '13px',
                              cursor: 'pointer',
                              minWidth: 'fit-content'
                            }}
                          >
                            ▶️ Escuchar
                          </button>
                        </div>
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
