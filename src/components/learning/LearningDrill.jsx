/**
 * LearningDrill.jsx - Componente principal para práctica de conjugaciones
 * 
 * @component
 * @description
 * Componente central del sistema de aprendizaje que proporciona práctica
 * interactiva de conjugaciones verbales con seguimiento de progreso en tiempo real.
 * 
 * Características principales:
 * - Generación automática de ejercicios basada en configuración
 * - Evaluación inteligente de respuestas con tolerancia de acentos
 * - Sistema de rachas y puntuación adaptativa
 * - Integración completa con sistema de progreso SRS
 * - Analytics en tiempo real y métricas de rendimiento
 * - Configuración de dificultad adaptativa según nivel CEFR
 * 
 * @param {Object} props - Propiedades del componente
 * @param {string} props.tense - Tiempo verbal a practicar (ej: 'pres', 'pretIndef')
 * @param {string} props.verbType - Tipo de verbos ('all', 'regular', 'irregular', familia específica)
 * @param {Array<string>} [props.selectedFamilies] - Familias irregulares específicas a incluir
 * @param {number} props.duration - Duración de la sesión en minutos
 * @param {Array<string>} [props.excludeLemmas=[]] - Verbos a excluir de la práctica
 * @param {Function} props.onBack - Callback para volver al paso anterior
 * @param {Function} props.onFinish - Callback al completar la sesión
 * @param {Function} [props.onPhaseComplete] - Callback al completar una fase del aprendizaje
 * @param {Function} [props.onHome] - Callback para ir al inicio
 * @param {Function} [props.onGoToProgress] - Callback para ir al dashboard de progreso
 * 
 * @example
 * ```jsx
 * <LearningDrill
 *   tense="pres"
 *   verbType="irregular"
 *   selectedFamilies={["e_ie", "o_ue"]}
 *   duration={10}
 *   excludeLemmas={["ser", "estar"]}
 *   onBack={() => goToPreviousStep()}
 *   onFinish={(stats) => handleSessionComplete(stats)}
 *   onPhaseComplete={(phase) => handlePhaseComplete(phase)}
 * />
 * ```
 * 
 * @requires useProgressTracking - Hook para seguimiento de progreso
 * @requires useSettings - Hook de configuraciones globales
 * @requires grade - Sistema de evaluación de respuestas
 * @requires chooseNext - Generador de ejercicios
 * @requires learningConfig - Configuración de parámetros de aprendizaje
 */

import React, { useState, useEffect, useRef, useCallback, useMemo, Suspense, lazy } from 'react';
import { TENSE_LABELS } from '../../lib/utils/verbLabels.js';
import SessionSummary from './SessionSummary.jsx';
import { useProgressTracking } from '../../features/drill/useProgressTracking.js';
import { grade } from '../../lib/core/grader.js';
import { chooseNext } from '../../lib/core/generator.js';
import { FORM_LOOKUP_MAP } from '../../lib/core/optimizedCache.js';
import { classifyError } from '../../lib/progress/errorClassification.js';
import { useSettings } from '../../state/settings.js';
import { convertLearningFamilyToOld } from '../../lib/data/learningIrregularFamilies.js';
import { calculateAdaptiveDifficulty, generateNextSessionRecommendations } from '../../lib/learning/adaptiveEngine.js';
import { 
  getLevelForTense, 
  getRealTimeDifficultyConfig, 
  DRILL_THRESHOLDS, 
  DIFFICULTY_PARAMS,
  SCORING_CONFIG 
} from '../../lib/learning/learningConfig.js';
import { recordLearningSession } from '../../lib/learning/analytics.js';
import { createLogger } from '../../lib/utils/logger.js';
import './LearningDrill.css';
import { getCurrentUserId } from '../../lib/progress/userManager.js';

const logger = createLogger('LearningDrill');

const PronunciationPanel = lazy(() => import('../drill/PronunciationPanelSafe.jsx'))

const MOOD_CANONICAL_MAP = {
  indicativo: 'indicative',
  subjuntivo: 'subjunctive',
  imperativo: 'imperative',
  condicional: 'conditional',
  nonfinite: 'nonfinite'
};

const canonicalizeMood = (mood) => MOOD_CANONICAL_MAP[mood] || mood;

const PRONOUNS_DISPLAY = {
  '1s': 'yo',
  '2s_tu': 'tú',
  '2s_vos': 'vos',
  '3s': 'él/ella/usted',
  '1p': 'nosotros/nosotras',
  '2p_vosotros': 'vosotros/vosotras',
  '3p': 'ellos/ellas/ustedes',
};

// CEFR level mapping now handled by centralized config

/**
 * Componente de práctica de conjugaciones con seguimiento de progreso
 * @param {Object} props - Propiedades del componente
 * @returns {JSX.Element} Interfaz de práctica de conjugaciones
 */
function LearningDrill({ tense, verbType, selectedFamilies, duration, excludeLemmas = [], onBack, onFinish, onPhaseComplete, onHome, onGoToProgress }) {
  const [currentItem, setCurrentItem] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [result, setResult] = useState('idle'); // idle | correct | incorrect
  const [sessionState, setSessionState] = useState('active'); // active | finished
  const [correctStreak, setCorrectStreak] = useState(0);
  
  // Removed custom points system - now using official progress tracking
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [responseTimes, setResponseTimes] = useState([]);
  const [startTime, setStartTime] = useState(null);
  const [errorPatterns, setErrorPatterns] = useState({});
  const [showStreakAnimation, setShowStreakAnimation] = useState(false);
  const [sessionStats, setSessionStats] = useState({ points: 0, streakCount: 0 });
  const [adaptiveSettings, setAdaptiveSettings] = useState(null);
  const [realTimeDifficulty, setRealTimeDifficulty] = useState(DIFFICULTY_PARAMS.DEFAULT);
  const [allAttempts, setAllAttempts] = useState([]);
  const [sessionStartTimestamp, setSessionStartTimestamp] = useState(null);
  
  // Cola de ejercicios fallados para reintegración (almacena objetos completos de ejercicios)
  const [failedItemsQueue, setFailedItemsQueue] = useState([]);
  // Historial de ejercicios para evitar repeticiones
  const [exerciseHistory, setExerciseHistory] = useState([]);
  // Error tracking for SRS integration
  const [detailedErrorHistory, setDetailedErrorHistory] = useState([]);

  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const [entered, setEntered] = useState(false);
  const [swapAnim, setSwapAnim] = useState(false);
  const settings = useSettings();
  const [showAccentKeys, setShowAccentKeys] = useState(false);
  const [showPronunciation, setShowPronunciation] = useState(false);
  const pronunciationPanelRef = useRef(null);

  // Toggle pronunciation function
  const handleTogglePronunciation = useCallback((show = null) => {
    // Si el show es explícito (desde botón cerrar), úsalo
    if (show !== null) {
      if (show === false) {
        setShowPronunciation(false)
      } else {
        setShowPronunciation(true)
      }
      return
    }

    // Lógica del click en el ícono de boca
    if (!showPronunciation) {
      // Panel cerrado → Abrir panel (la grabación se inicia automáticamente en el panel)
      setShowPronunciation(true)
    } else {
      // Panel abierto → Toggle grabación (NO cerrar panel)
      if (pronunciationPanelRef.current?.toggleRecording) {
        pronunciationPanelRef.current.toggleRecording()
      }
    }
  }, [showPronunciation])

  // Helper function to get person text
  const getPersonText = (personCode) => {
    return PRONOUNS_DISPLAY[personCode] || personCode;
  }

  // Create current item for pronunciation panel
  const currentPronunciationItem = useMemo(() => {
    if (!currentItem) return null;

    return {
      verb: currentItem.lemma,
      mood: currentItem.mood,
      tense: currentItem.tense,
      person: currentItem.person,
      expectedValue: currentItem.value,
      prompt: `${getPersonText(currentItem.person)} ${currentItem.lemma}`
    };
  }, [currentItem])

  const handleDrillResult = async (isCorrect, accuracy, extra = {}) => {
    // Handle pronunciation result similar to typing result
    if (isCorrect) {
      setResult('correct')
    } else {
      setResult('incorrect')
    }

    // Call the main progress tracking system
    await handleResult({
      correct: isCorrect,
      userAnswer: extra.recognized || '',
      correctAnswer: currentItem?.value || '',
      hintsUsed: 0,
      errorTags: [],
      latencyMs: 0,
      isIrregular: currentItem?.type === 'irregular',
      itemId: currentItem?.id
    });

    // Update local session stats
    if (isCorrect) {
      setCorrectStreak(prev => prev + 1);
      setCorrectAnswers(prev => prev + 1);
    } else {
      setCorrectStreak(0);
    }
    setTotalAttempts(prev => prev + 1);
  }

  const handleContinueFromPronunciation = () => {
    // This will be called by the pronunciation panel after auto-advance
    // Reset result state and continue to next item
    setResult('idle');
    setInputValue('');
    handleContinue();
  }

  const { handleResult, handleStreakIncremented, handleTenseDrillStarted, handleTenseDrillEnded } = useProgressTracking(currentItem, (result) => {
    // Update local session stats based on progress tracking
    console.log('Progress tracking result:', result);
    if (result.correct) {
      setSessionStats(prev => ({
        points: prev.points + (result.isIrregular ? SCORING_CONFIG.IRREGULAR_VERB_POINTS : SCORING_CONFIG.REGULAR_VERB_POINTS),
        streakCount: prev.streakCount + 1
      }));
    } else {
      setSessionStats(prev => ({ ...prev, streakCount: 0 }));
    }
  });

  useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
        setSessionState('finished');
      }, duration * 60 * 1000);
      return () => clearTimeout(timer);
    }
  }, [duration]);

  const generateNextItem = React.useCallback(async () => {
    // Get current settings snapshot WITHOUT modifying global state
    const currentSettings = settings.getState ? settings.getState() : settings;

    // For irregular practice, cycle through families for variety
    let selectedFamilyForGenerator = null;
    if (selectedFamilies && selectedFamilies.length > 0) {
      const familyIndex = (totalAttempts || 0) % selectedFamilies.length;
      const learningFamilyId = selectedFamilies[familyIndex];
      selectedFamilyForGenerator = convertLearningFamilyToOld(learningFamilyId);

      // DEBUG: Log family conversion
      console.log('🔄 SEGUNDO DRILL - Conversión de familia:', {
        learningFamilyId,
        selectedFamilyForGenerator,
        familyIndex,
        totalAttempts,
        allSelectedFamilies: selectedFamilies
      });

      // Note: Irregular forms are now automatically available in FORM_LOOKUP_MAP
      // No need for manual chunk loading as maps are initialized synchronously
    }

    // Create isolated settings object for generator (NO GLOBAL MUTATION)
    const sessionSettings = {
      ...currentSettings,
      practiceMode: 'specific',
      specificMood: canonicalizeMood(tense?.mood),
      specificTense: tense?.tense,
      verbType: verbType === 'irregular' ? 'irregular' : verbType,
      selectedFamily: selectedFamilyForGenerator,
      cameFromTema: false,
      // Force verb jumping: prioritize different verbs over same verb different persons
      prioritizeVerbVariety: true,
      level: (() => {
        const mappedLevel = getLevelForTense(tense?.tense);
        return mappedLevel || currentSettings.level || 'A1';
      })()
    };

    logger.debug('Session settings for generator', {
      mood: canonicalizeMood(tense?.mood),
      tense: tense?.tense,
      verbType,
      selectedFamily: selectedFamilyForGenerator,
      level: sessionSettings.level,
      prioritizeVerbVariety: true
    });

    // DEBUG: Log detailed settings for second drill
    console.log('🎯 SEGUNDO DRILL - Configuración del generador:', {
      tense: tense?.tense,
      mood: canonicalizeMood(tense?.mood),
      verbType,
      selectedFamily: selectedFamilyForGenerator,
      level: sessionSettings.level,
      excludeLemmas: excludeLemmas,
      practiceMode: sessionSettings.practiceMode
    });

    try {
      const excludeSet = new Set((excludeLemmas || []).map(l => (l || '').trim()))
      const allForms = Array.from(FORM_LOOKUP_MAP.values())
      const filteredForms = excludeSet.size > 0 ? allForms.filter(f => !excludeSet.has(f.lemma)) : allForms

      // Enhanced filtering to prioritize different verbs over same verb
      const recentVerbsUsed = exerciseHistory.slice(-5).map(item => item.lemma);
      const formsWithoutRecentVerbs = filteredForms.filter(f => !recentVerbsUsed.includes(f.lemma));

      // Use forms without recent verbs if available, otherwise fall back to all forms
      const prioritizedForms = formsWithoutRecentVerbs.length > 0 ? formsWithoutRecentVerbs : filteredForms;

      // Use generator with isolated settings - NO GLOBAL MUTATION
      let nextItem = await chooseNext({
        forms: prioritizedForms,
        history: exerciseHistory,
        currentItem,
        sessionSettings // Pass settings as parameter instead of mutating global state
      });

      // Fallback: if no item was generated, use all forms
      if (!nextItem) {
        logger.warn('First generator call failed, trying fallback with all forms');
        nextItem = await chooseNext({
          forms: allForms,
          history: exerciseHistory,
          currentItem,
          sessionSettings
        })
      }

      // Second fallback: try with simpler settings if still no item
      if (!nextItem) {
        logger.warn('Second generator call failed, trying with simplified settings');
        const simplifiedSettings = {
          ...sessionSettings,
          practiceMode: 'mixed',
          verbType: 'all',
          selectedFamily: null,
          level: 'A1' // Use most basic level
        };
        nextItem = await chooseNext({
          forms: allForms,
          history: [],
          currentItem: null,
          sessionSettings: simplifiedSettings
        })
      }

      // Third fallback: try with global settings if all else fails
      if (!nextItem) {
        logger.warn('All generator calls failed, trying with global settings');
        nextItem = await chooseNext({
          forms: allForms,
          history: [],
          currentItem: null,
          sessionSettings: null // Use global settings
        })
      }

      logger.debug('Generated exercise item', {
        lemma: nextItem?.lemma,
        person: nextItem?.person,
        verbVarietyApplied: formsWithoutRecentVerbs.length > 0,
        fallbackUsed: !nextItem ? 'none' : 'success'
      });

      // DEBUG: Log the generated item for second drill
      console.log('✅ SEGUNDO DRILL - Ejercicio generado:', {
        lemma: nextItem?.lemma,
        person: nextItem?.person,
        mood: nextItem?.mood,
        tense: nextItem?.tense,
        value: nextItem?.value,
        totalEligibleForms: filteredForms.length,
        excludedLemmas: Array.from(excludeSet),
        recentVerbs: exerciseHistory.slice(-5).map(item => item.lemma)
      });

      if (nextItem) {
        setCurrentItem(nextItem);
        setInputValue('');
        setResult('idle');
        setStartTime(Date.now());
        setExerciseHistory(prev => [...prev, nextItem].slice(-DRILL_THRESHOLDS.EXERCISE_HISTORY_SIZE));
        setTimeout(() => inputRef.current?.focus(), 0);
      } else {
        logger.error('CRITICAL: All generator fallbacks failed - no exercises available');
        logger.error('Session settings:', sessionSettings);
        logger.error('Available forms:', allForms.length);
        setCurrentItem(null);
      }
    } catch (error) {
      logger.error('Error generating next item', error);
      setCurrentItem(null);
    }
  }, [tense, verbType, selectedFamilies, totalAttempts, excludeLemmas, exerciseHistory]); // Include exerciseHistory dependency

  // Only generate first item on mount, not when currentItem changes
  useEffect(() => {
    if (!currentItem) {
      generateNextItem().catch(console.error);
    }
  }, [tense?.tense, verbType, selectedFamilies]); // Don't depend on generateNextItem

  // Track tense drill session WITHOUT mutating global settings
  useEffect(() => {
    if (tense?.tense) {
      handleTenseDrillStarted(tense.tense);
      logger.debug('Learning drill started', { tense: tense.tense });
    }
    
    return () => {
      if (tense?.tense) {
        handleTenseDrillEnded(tense.tense);
        logger.debug('Learning drill ended', { tense: tense.tense });
      }
    };
  }, [tense?.tense, handleTenseDrillStarted, handleTenseDrillEnded]);

  useEffect(() => {
    // enter animation on mount
    const t = setTimeout(() => setEntered(true), 10);
    return () => clearTimeout(t);
  }, []);

  // Initialize adaptive settings
  useEffect(() => {
    if (tense?.tense) {
      try {
        const userId = getCurrentUserId();
        const adaptive = calculateAdaptiveDifficulty(userId, tense.tense, verbType);
        setAdaptiveSettings(adaptive);
        logger.debug('Adaptive settings initialized', adaptive);
      } catch (error) {
        logger.error('Error initializing adaptive settings', error);
        // Use safe defaults
        setAdaptiveSettings({
          level: 'intermediate',
          practiceIntensity: 'medium',
          skipIntroduction: false,
          extendedPractice: false,
          hintsEnabled: true
        });
      }
    }
  }, [tense?.tense, verbType]);

  // Initialize session analytics tracking
  useEffect(() => {
    if (!sessionStartTimestamp) {
      const startTime = Date.now();
      setSessionStartTimestamp(startTime);
      logger.debug('Analytics session started', { startTime });
    }
  }, [sessionStartTimestamp]);

  // Ensure container maintains focus for keyboard navigation
  useEffect(() => {
    if (result !== 'idle' && containerRef.current) {
      // When result is shown (correct/incorrect), ensure container keeps focus for Enter key
      setTimeout(() => {
        containerRef.current?.focus();
      }, 100);
    }
  }, [result]);

  // calculatePoints function removed - now handled by progress tracking system


  const handleCheckAnswer = async () => {
    if (!currentItem || !startTime) return;
    const userAnswer = inputValue.trim();
    const responseTime = Date.now() - startTime;

    // Use the sophisticated grader from the main system
    const gradeResult = grade(userAnswer, {
      value: currentItem.value,
      alt: currentItem.alt || [],
      accepts: currentItem.accepts || {}
    });

    const isCorrect = gradeResult.correct;

    // Enhanced error classification for SRS integration
    let detailedErrorTags = [];
    if (!isCorrect) {
      // Use the progress system's error classification
      detailedErrorTags = classifyError(userAnswer, currentItem.value, {
        lemma: currentItem.lemma,
        mood: currentItem.mood,
        tense: currentItem.tense,
        person: currentItem.person
      });

      // Track detailed error for future SRS targeting
      const errorDetail = {
        timestamp: Date.now(),
        item: {
          lemma: currentItem.lemma,
          mood: currentItem.mood,
          tense: currentItem.tense,
          person: currentItem.person,
          value: currentItem.value
        },
        userAnswer,
        errorTags: detailedErrorTags,
        sessionContext: {
          tense: tense?.tense,
          verbType,
          sessionPhase: 'drill'
        }
      };

      setDetailedErrorHistory(prev => [...prev, errorDetail]);
      logger.debug('Error classified for SRS targeting:', {
        lemma: currentItem.lemma,
        errorTags: detailedErrorTags,
        userAnswer,
        correctAnswer: currentItem.value
      });
    }

    setTotalAttempts(prev => prev + 1);
    setResponseTimes(prev => [...prev, responseTime]);

    // Update real-time difficulty based on current performance
    const avgResponseTime = [...responseTimes, responseTime].reduce((a, b) => a + b, 0) / (responseTimes.length + 1);
    const currentAccuracy = (correctAnswers + (isCorrect ? 1 : 0)) / (totalAttempts + 1);
    
    const newDifficulty = getRealTimeDifficultyConfig({
      accuracy: currentAccuracy * 100,
      streak: isCorrect ? correctStreak + 1 : 0,
      avgResponseTime,
      totalAttempts: totalAttempts + 1
    });
    
    setRealTimeDifficulty(newDifficulty);
    logger.debug('Real-time difficulty adjusted', newDifficulty);

    if (isCorrect) {
      setResult('correct');
      const newStreak = correctStreak + 1;
      setCorrectStreak(newStreak);
      setCorrectAnswers(prev => prev + 1);
      
      // Handle streak animations and tracking
      if (newStreak > 0 && newStreak % SCORING_CONFIG.STREAK_ANIMATION_INTERVAL === 0) {
        setShowStreakAnimation(true);
        setTimeout(() => setShowStreakAnimation(false), 2000);
        await handleStreakIncremented();
      }
      logger.debug('Correct answer', { lemma: currentItem.lemma, person: getPersonText(currentItem.person), value: currentItem.value });
    } else {
      setResult('incorrect');
      setCorrectStreak(0);
      // Use detailed error analysis for session stats
      const primaryErrorType = detailedErrorTags[0] || gradeResult.errorTags?.[0] || 'complete_error';
      setErrorPatterns(prev => ({ ...prev, [primaryErrorType]: (prev[primaryErrorType] || 0) + 1 }));
      
      // Reintegrar el ejercicio fallado al final de la cola para práctica adicional
      setFailedItemsQueue(prev => [...prev, { ...currentItem }]);
      logger.debug('Incorrect answer - added to retry queue', { lemma: currentItem.lemma, person: getPersonText(currentItem.person) });
    }

    setTimeout(() => inputRef.current?.focus(), 0);

    // Record detailed attempt for analytics
    const detailedAttempt = {
      timestamp: Date.now(),
      correct: isCorrect,
      userAnswer,
      correctAnswer: currentItem.value,
      hintsUsed: 0,
      errorTags: detailedErrorTags.length > 0 ? detailedErrorTags : (gradeResult.errorTags || []),
      latencyMs: responseTime,
      isIrregular: currentItem.type === 'irregular',
      itemId: currentItem.id,
      verb: currentItem.lemma,
      tense: tense?.tense,
      person: currentItem.person,
      adaptiveDifficulty: adaptiveSettings?.level || 'intermediate',
      phaseType: 'mechanical_practice',
      realTimeDifficulty,
      sessionPhase: 'drill'
    };

    setAllAttempts(prev => [...prev, detailedAttempt]);

    // Use the progress tracking system with complete information
    await handleResult({
      correct: isCorrect,
      userAnswer,
      correctAnswer: currentItem.value,
      hintsUsed: 0,
      errorTags: detailedErrorTags.length > 0 ? detailedErrorTags : (gradeResult.errorTags || []),
      latencyMs: responseTime,
      isIrregular: currentItem.type === 'irregular',
      itemId: currentItem.id
    });
  };

  const handleContinue = () => {
    if (correctStreak >= DRILL_THRESHOLDS.STREAK_FOR_COMPLETION && onPhaseComplete) {
        setTimeout(() => onPhaseComplete(), 0);
    } else {
        // Verificar si hay ejercicios fallados para reintegrar
        if (failedItemsQueue.length > 0) {
          const nextFailedItem = failedItemsQueue[0];
          setFailedItemsQueue(prev => prev.slice(1));
          
          // Configurar el ejercicio fallado como siguiente
          setSwapAnim(true);
          setTimeout(() => {
            setSwapAnim(false);
            setCurrentItem(nextFailedItem);
            setInputValue('');
            setResult('idle');
            setStartTime(Date.now());
            setTimeout(() => inputRef.current?.focus(), 0);
            logger.debug('Reintegrating failed exercise', { lemma: nextFailedItem.lemma, person: getPersonText(nextFailedItem.person) });
          }, 250);
        } else {
          // subtle swap animation when moving to next random item
          setSwapAnim(true);
          // Reset result immediately to enable input
          setResult('idle');
          setTimeout(() => {
            setSwapAnim(false);
            generateNextItem().catch(console.error);
          }, 250);
          // Ensure focus is set after animation with longer delay
          setTimeout(() => {
            if (inputRef.current) {
              inputRef.current.focus();
              // Ensure cursor is visible
              inputRef.current.setSelectionRange(0, 0);
            }
          }, 300);
        }
    }
  };

  const generateSessionSummary = () => {
    const accuracy = totalAttempts > 0 ? (correctAnswers / totalAttempts) * 100 : 0;
    const avgTime = responseTimes.length > 0 ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0;
    let grade = 'F';
    if (accuracy >= 95) grade = 'A+';
    else if (accuracy >= 90) grade = 'A';
    else if (accuracy >= 80) grade = 'B';
    else if (accuracy >= 70) grade = 'C';
    else if (accuracy >= 60) grade = 'D';
    
    // Generate next session recommendations
    let recommendations = ['Continuar practicando'];
    try {
      const userId = getCurrentUserId();
      const currentSession = {
        tense: tense?.tense,
        verbType,
        accuracy,
        totalAttempts,
        correctAnswers,
        avgResponseTime: avgTime
      };
      
      const nextRec = generateNextSessionRecommendations(userId, currentSession);
      recommendations = nextRec ? [nextRec.recommendedTense || 'Continuar practicando'] : ['Continuar practicando'];
      logger.debug('Generated recommendations', nextRec);
    } catch (error) {
      logger.error('Error generating recommendations', error);
      recommendations = ['Continuar practicando'];
    }

    // Record detailed learning session analytics
    const sessionDuration = sessionStartTimestamp ? Date.now() - sessionStartTimestamp : 0;
    const completionRate = correctStreak >= 10 ? 1 : (totalAttempts / 20); // Assuming 20 attempts for full session
    
    try {
      const userId = getCurrentUserId();
      const sessionAnalytics = {
        tense: tense?.tense,
        verbType,
        grade,
        accuracy,
        averageTime: avgTime,
        maxStreak: correctStreak,
        points: sessionStats.points,
        totalAttempts,
        correctAnswers,
        errorPatterns,
        sessionDuration,
        completionRate,
        adaptiveLevel: adaptiveSettings?.level || 'intermediate',
        phaseType: 'mechanical_drill',
        attempts: allAttempts,
        realTimeDifficultyFinal: realTimeDifficulty,
        recommendations,
        // Enhanced error tracking for SRS integration
        detailedErrorHistory,
        errorItemsForSRS: detailedErrorHistory.map(error => ({
          lemma: error.item.lemma,
          mood: error.item.mood,
          tense: error.item.tense,
          person: error.item.person,
          errorTags: error.errorTags,
          priorityLevel: error.errorTags.includes('IRREGULAR_STEM') ? 'high' :
                        error.errorTags.includes('ACCENT') ? 'low' : 'medium'
        }))
      };

      recordLearningSession(userId, sessionAnalytics);
      logger.debug('Session analytics recorded', sessionAnalytics);
    } catch (error) {
      logger.error('Error recording session analytics', error);
    }
    
    return {
      grade,
      accuracy: Math.round(accuracy),
      averageTime: Math.round(avgTime / 1000 * 10) / 10,
      maxStreak: correctStreak,
      points: sessionStats.points,
      totalAttempts,
      correctAnswers,
      errorPatterns,
      recommendations,
      adaptiveLevel: adaptiveSettings?.level || 'intermediate',
      // Error data for SRS system integration
      detailedErrorHistory,
      errorItemsForSRS: detailedErrorHistory.map(error => ({
        lemma: error.item.lemma,
        mood: error.item.mood,
        tense: error.item.tense,
        person: error.item.person,
        errorTags: error.errorTags,
        priorityLevel: error.errorTags.includes('IRREGULAR_STEM') ? 'high' :
                      error.errorTags.includes('ACCENT') ? 'low' : 'medium'
      }))
    };
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (result === 'idle') {
        handleCheckAnswer();
      } else {
        handleContinue();
      }
    }
  };

  // Accent/tilde keypad support
  const specialChars = ['á', 'é', 'í', 'ó', 'ú', 'ñ', 'ü'];
  const insertChar = (char) => {
    setInputValue(prev => prev + char);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  // --- Text-to-Speech for learning drills ---
  const getSpeakText = () => {
    // Pronounce the correct form for the current item
    return currentItem?.value || '';
  };

  const speak = (text) => {
    try {
      if (!text || typeof window === 'undefined' || !window.speechSynthesis) return;
      const synth = window.speechSynthesis;
      const utter = new SpeechSynthesisUtterance(text);
      const region = settings?.region || 'la_general';
      utter.lang = region === 'rioplatense' ? 'es-AR' : 'es-ES';
      utter.rate = 0.95;

      const pickPreferredSpanishVoice = (voices, targetLang) => {
        const lower = (s) => (s || '').toLowerCase()
        const spanish = voices.filter(v => lower(v.lang).startsWith('es'))
        if (spanish.length === 0) return null
        const prefNames = ['mónica','monica','paulina','luciana','helena','elvira','google español','google us español','google español de estados','microsoft sabina','microsoft helena']
        const preferOrder = (region === 'rioplatense')
          ? ['es-ar','es-419','es-mx','es-es']
          : ['es-es','es-mx','es-419','es-us']
        const byLangExact = spanish.find(v => lower(v.lang) === lower(targetLang))
        if (byLangExact) return byLangExact
        for (const lang of preferOrder) {
          const femaleByName = spanish.find(v => lower(v.lang).startsWith(lang) && prefNames.some(n => lower(v.name).includes(n)))
          if (femaleByName) return femaleByName
          const anyByLang = spanish.find(v => lower(v.lang).startsWith(lang))
          if (anyByLang) return anyByLang
        }
        const anyFemale = spanish.find(v => prefNames.some(n => lower(v.name).includes(n)))
        return anyFemale || spanish[0]
      };

      const pickAndSpeak = () => {
        const voices = synth.getVoices ? synth.getVoices() : [];
        const chosen = pickPreferredSpanishVoice(voices, utter.lang)
        if (chosen) {
          utter.voice = chosen
          utter.lang = chosen.lang || utter.lang
        }
        synth.cancel();
        synth.speak(utter);
      };

      if (synth.getVoices && synth.getVoices().length === 0) {
        let hasSpoken = false;
        const onVoices = () => {
          if (!hasSpoken) {
            hasSpoken = true;
            pickAndSpeak();
          }
          synth.removeEventListener('voiceschanged', onVoices);
        };
        synth.addEventListener('voiceschanged', onVoices);
        setTimeout(() => {
          if (!hasSpoken) {
            hasSpoken = true;
            pickAndSpeak();
          }
        }, 500);
      } else {
        pickAndSpeak();
      }
    } catch (e) {
      logger.warn('TTS unavailable', e);
    }
  };

  const handleSpeak = () => {
    const text = getSpeakText();
    if (text) speak(text);
  };

  if (!currentItem) {
    return (
      <div className="App">
        <header className="header">
          <div className="icon-row">
            <button onClick={onBack} className="icon-btn" title="Volver" aria-label="Volver">
              <img src="/back.png" alt="Volver" className="menu-icon" />
            </button>
            <button onClick={() => setShowAccentKeys(v => !v)} className="icon-btn" title="Tildes" aria-label="Tildes">
              <img src="/enie.png" alt="Tildes" className="menu-icon" />
            </button>
            <button onClick={onHome} className="icon-btn" title="Inicio" aria-label="Inicio">
              <img src="/home.png" alt="Inicio" className="menu-icon" />
            </button>
            <button
              onClick={() => handleTogglePronunciation()}
              className="icon-btn"
              title="Práctica de pronunciación"
            >
              <img src="/boca.png" alt="Pronunciación" className="menu-icon" />
            </button>
            <button onClick={onGoToProgress} className="icon-btn" title="Métricas" aria-label="Métricas">
              <img src="/icons/chart.png" alt="Métricas" className="menu-icon" />
            </button>
          </div>
        </header>
        <div className="main-content">
          <div className="drill-container learning-drill">
            <div className="center-column"><p>No hay ejercicios disponibles.</p></div>
          </div>
        </div>
      </div>
    );
  }

  if (sessionState === 'finished') {
    const summary = generateSessionSummary();
    return <SessionSummary onFinish={onFinish} summary={summary} />;
  }

  // const tenseName = TENSE_LABELS[tense?.tense] || tense?.tense; // header shows only icons

  return (
    <div className="App" onKeyDown={handleKeyDown} tabIndex={-1} ref={containerRef}>
      <header className="header">
        <div className="icon-row">
          <button onClick={onBack} className="icon-btn" title="Volver" aria-label="Volver">
            <img src="/back.png" alt="Volver" className="menu-icon" />
          </button>
          <button onClick={() => setShowAccentKeys(v => !v)} className="icon-btn" title="Tildes" aria-label="Tildes">
            <img src="/enie.png" alt="Tildes" className="menu-icon" />
          </button>
          <button onClick={onHome} className="icon-btn" title="Inicio" aria-label="Inicio">
            <img src="/home.png" alt="Inicio" className="menu-icon" />
          </button>
          <button
            onClick={() => handleTogglePronunciation()}
            className="icon-btn"
            title="Práctica de pronunciación"
          >
            <img src="/boca.png" alt="Pronunciación" className="menu-icon" />
          </button>
          <button onClick={onGoToProgress} className="icon-btn" title="Métricas" aria-label="Métricas">
            <img src="/icons/chart.png" alt="Métricas" className="menu-icon" />
          </button>
        </div>
      </header>

      {showPronunciation && (
        <Suspense fallback={<div className="loading">Cargando pronunciación...</div>}>
          <PronunciationPanel
            ref={pronunciationPanelRef}
            currentItem={currentPronunciationItem}
            onClose={() => handleTogglePronunciation(false)}
            handleResult={handleDrillResult}
            onContinue={handleContinueFromPronunciation}
          />
        </Suspense>
      )}

      <div className="main-content">
        <div className={`drill-container learning-drill page-transition ${entered ? 'page-in' : ''}`}>

          <div className="chrono-panel">
            <div className="chrono-item"><div className="chrono-value">{sessionStats.points.toLocaleString()}</div><div className="chrono-label">Puntos</div></div>
            <div className="chrono-item"><div className="chrono-value streak-value">🔥 <span className={showStreakAnimation ? 'streak-shake' : ''}>{correctStreak}</span></div><div className="chrono-label">Racha</div></div>
            <div className="chrono-item"><div className="chrono-value">{totalAttempts > 0 ? Math.round((correctAnswers / totalAttempts) * 100) : 0}%</div><div className="chrono-label">Precisión</div></div>
            {failedItemsQueue.length > 0 && (
              <div className="chrono-item"><div className="chrono-value" style={{color: '#ff6b6b'}}>🔄 {failedItemsQueue.length}</div><div className="chrono-label">Por revisar</div></div>
            )}
          </div>

          {currentItem ? (
            <>
              <div className={`verb-lemma ${swapAnim ? 'swap' : ''}`}>{currentItem.lemma}</div>
              <div className={`person-display ${swapAnim ? 'swap' : ''}`}>{getPersonText(currentItem.person)}</div>
              
              <div className="input-container">
                <input 
                  ref={inputRef}
                  type="text" 
                  className={`conjugation-input ${result}`}
                  placeholder="Escribe la conjugación..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  disabled={result !== 'idle'}
                  autoFocus
                />
                {showAccentKeys && (
                  <div className="accent-keypad" style={{ marginTop: '1rem' }}>
                    {specialChars.map(ch => (
                      <button
                        key={ch}
                        type="button"
                        className="accent-key"
                        onClick={() => insertChar(ch)}
                        tabIndex={-1}
                      >{ch}</button>
                    ))}
                  </div>
                )}
              </div>
              
              {result !== 'idle' && (
                <div className={`result ${result}`}>
                  <div className="result-top">
                    {result === 'correct' ? (
                      <div className="correct-feedback">¡Correcto!</div>
                    ) : (
                      <div className="incorrect-feedback">
                        La respuesta correcta es: <span className="correct-answer">{currentItem.value}</span>
                      </div>
                    )}
                    <button
                      type="button"
                      className="tts-btn"
                      onClick={handleSpeak}
                      title="Pronunciar"
                      aria-label="Pronunciar"
                    >
                      <img src="/megaf-imperat.png" alt="Pronunciar" />
                    </button>
                  </div>
                </div>
              )}
              
              <div className="action-buttons">
                {result === 'idle' ? (
                  <button className="btn" onClick={handleCheckAnswer} disabled={!inputValue.trim()}>Continuar</button>
                ) : (
                  <button className="btn" onClick={handleContinue}>Continuar</button>
                )}
              </div>
            </>
          ) : (
            <div className="loading">Cargando...</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LearningDrill;
