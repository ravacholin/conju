/**
 * AdaptiveLearningDrill.jsx - Drill de aprendizaje adaptativo y contextual
 *
 * @component
 * @description
 * Drill mejorado específicamente diseñado para el learning flow que proporciona:
 * - Múltiples tipos de ejercicio (conjugación, contextual, construcción de oraciones)
 * - Algoritmo de secuenciamiento inteligente
 * - Ajuste dinámico de dificultad
 * - Integración fluida con el flujo de aprendizaje
 * - Progresión pedagógica optimizada
 *
 * Características principales:
 * - Progresión inteligente de verbos y personas
 * - Ejercicios contextuales y variados
 * - Feedback específico por familia irregular
 * - Transiciones suaves entre modos de práctica
 * - Integración completa con sistema SRS
 *
 * @param {Object} props - Propiedades del componente
 * @param {Object} props.tense - Tiempo verbal a practicar (ej: {mood: 'indicativo', tense: 'pres'})
 * @param {string} props.verbType - Tipo de verbos ('regular', 'irregular', familia específica)
 * @param {Array<string>} props.selectedFamilies - Familias irregulares específicas
 * @param {number} props.duration - Duración de la sesión en minutos
 * @param {Array<string>} props.excludeLemmas - Verbos a excluir de la práctica
 * @param {Array<Object>} props.exampleVerbs - Verbos de la introducción para warm-up
 * @param {Function} props.onBack - Callback para volver al paso anterior
 * @param {Function} props.onFinish - Callback al completar la sesión
 * @param {Function} props.onPhaseComplete - Callback al completar fase
 * @param {Function} props.onHome - Callback para ir al inicio
 * @param {Function} props.onGoToProgress - Callback para ir al progreso
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useProgressTracking } from '../../../features/drill/useProgressTracking.js';
import { useSettings } from '../../../state/settings.js';
import { createLogger } from '../../../lib/utils/logger.js';

// Import drill exercise components
import ConjugationExercise from './components/ConjugationExercise.jsx';
import ContextualExercise from './components/ContextualExercise.jsx';
import SentenceBuilding from './components/SentenceBuilding.jsx';
import ProgressVisualization from './components/ProgressVisualization.jsx';

// Import hooks for intelligent behavior
import { useAdaptiveSequencing } from './hooks/useAdaptiveSequencing.js';
import { useDifficultyAdjustment } from './hooks/useDifficultyAdjustment.js';
import { useExerciseSelection } from './hooks/useExerciseSelection.js';

// Import utilities
import { EXERCISE_TYPES, DIFFICULTY_LEVELS, PROGRESSION_STAGES } from './utils/constants.js';

import './AdaptiveLearningDrill.css';

const logger = createLogger('AdaptiveLearningDrill');

/**
 * Componente principal del drill de aprendizaje adaptativo
 */
function AdaptiveLearningDrill({
  tense,
  verbType,
  selectedFamilies = [],
  duration,
  excludeLemmas = [],
  exampleVerbs = [],
  onBack,
  onFinish,
  onPhaseComplete,
  onHome,
  onGoToProgress
}) {
  // Estado principal del drill
  const [currentExercise, setCurrentExercise] = useState(null);
  const [currentStage, setCurrentStage] = useState(PROGRESSION_STAGES.WARM_UP);
  const [exerciseHistory, setExerciseHistory] = useState([]);
  const [sessionStats, setSessionStats] = useState({
    totalAttempts: 0,
    correctAnswers: 0,
    currentStreak: 0,
    maxStreak: 0,
    exerciseTypesCompleted: new Set(),
    timeSpent: 0,
    verbsMastered: new Set(),
    patternsIdentified: new Set()
  });

  // Estado de la interfaz
  const [isLoading, setIsLoading] = useState(true);
  const [showHints, setShowHints] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState(null);
  const [celebrationMessage, setCelebrationMessage] = useState(null);

  // Referencias
  const sessionStartTime = useRef(Date.now());
  const containerRef = useRef(null);

  // Hooks del sistema
  const settings = useSettings();
  const { handleResult, handleStreakIncremented, handleTenseDrillStarted, handleTenseDrillEnded } =
    useProgressTracking(currentExercise, handleExerciseResult);

  // Hooks especializados del adaptive drill
  const { currentVerbSequence, getNextVerb, markVerbCompleted } = useAdaptiveSequencing({
    tense,
    verbType,
    selectedFamilies,
    excludeLemmas,
    exampleVerbs,
    currentStage
  });

  const { currentDifficulty, adjustDifficulty } = useDifficultyAdjustment({
    sessionStats,
    currentStage
  });

  const { selectExerciseType, getExerciseConfig } = useExerciseSelection({
    currentStage,
    currentDifficulty,
    sessionStats,
    verbType,
    selectedFamilies
  });

  // Inicialización del drill
  useEffect(() => {
    initializeDrill();
    return () => {
      handleTenseDrillEnded(tense?.tense);
    };
  }, []);

  // Generar siguiente ejercicio cuando cambia el estado
  useEffect(() => {
    if (!isLoading && !currentExercise) {
      generateNextExercise();
    }
  }, [currentStage, currentDifficulty, isLoading]);

  /**
   * Inicializa el drill con configuración inicial
   */
  const initializeDrill = async () => {
    try {
      setIsLoading(true);

      // Registrar inicio de sesión
      if (tense?.tense) {
        handleTenseDrillStarted(tense.tense);
      }

      // Configurar temporizador de duración si está especificado
      if (duration) {
        setTimeout(() => {
          handleSessionComplete();
        }, duration * 60 * 1000);
      }

      logger.debug('Adaptive learning drill initialized', {
        tense: tense?.tense,
        verbType,
        selectedFamilies,
        duration,
        exampleVerbs: exampleVerbs?.length
      });

      setIsLoading(false);
    } catch (error) {
      logger.error('Error initializing adaptive drill:', error);
      setIsLoading(false);
    }
  };

  /**
   * Genera el siguiente ejercicio basado en el estado actual
   */
  const generateNextExercise = async () => {
    try {
      // Obtener siguiente verbo de la secuencia inteligente
      const nextVerb = getNextVerb();
      if (!nextVerb) {
        logger.debug('No more verbs available, completing phase');
        handlePhaseTransition();
        return;
      }

      // Seleccionar tipo de ejercicio apropiado
      const exerciseType = selectExerciseType();
      const exerciseConfig = getExerciseConfig(exerciseType, nextVerb);

      // Crear ejercicio
      const exercise = {
        id: `${nextVerb.lemma}_${exerciseType}_${Date.now()}`,
        type: exerciseType,
        verb: nextVerb,
        config: exerciseConfig,
        stage: currentStage,
        difficulty: currentDifficulty
      };

      setCurrentExercise(exercise);

      logger.debug('Generated exercise:', {
        verb: nextVerb.lemma,
        type: exerciseType,
        stage: currentStage,
        difficulty: currentDifficulty
      });

    } catch (error) {
      logger.error('Error generating next exercise:', error);
    }
  };

  /**
   * Maneja el resultado de un ejercicio completado
   */
  function handleExerciseResult(result) {
    const isCorrect = result.correct;
    const timeSpent = Date.now() - sessionStartTime.current;

    // Actualizar estadísticas de sesión
    setSessionStats(prev => {
      const newStats = {
        ...prev,
        totalAttempts: prev.totalAttempts + 1,
        correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0),
        currentStreak: isCorrect ? prev.currentStreak + 1 : 0,
        maxStreak: Math.max(prev.maxStreak, isCorrect ? prev.currentStreak + 1 : 0),
        timeSpent,
        exerciseTypesCompleted: new Set([...prev.exerciseTypesCompleted, currentExercise?.type])
      };

      // Marcar verbo como dominado si es apropiado
      if (isCorrect && shouldMarkVerbMastered(result)) {
        newStats.verbsMastered = new Set([...prev.verbsMastered, currentExercise?.verb?.lemma]);
        markVerbCompleted(currentExercise.verb);
      }

      // Identificar patrón si es apropiado
      if (isCorrect && shouldMarkPatternIdentified(result)) {
        const pattern = getPatternFromExercise(currentExercise);
        if (pattern) {
          newStats.patternsIdentified = new Set([...prev.patternsIdentified, pattern]);
        }
      }

      return newStats;
    });

    // Ajustar dificultad basado en el resultado
    adjustDifficulty(result);

    // Agregar a historial
    setExerciseHistory(prev => [...prev, {
      exercise: currentExercise,
      result,
      timestamp: Date.now()
    }]);

    // Mostrar feedback apropiado
    showFeedback(result);

    // Manejar celebraciones especiales
    if (isCorrect && sessionStats.currentStreak > 0 && sessionStats.currentStreak % 5 === 0) {
      showCelebration(`¡Racha de ${sessionStats.currentStreak + 1}!`);
      handleStreakIncremented();
    }
  }

  /**
   * Maneja la transición entre fases del aprendizaje
   */
  const handlePhaseTransition = () => {
    const nextStage = getNextStage(currentStage);

    if (nextStage) {
      setCurrentStage(nextStage);
      setCurrentExercise(null); // Forzar generación de nuevo ejercicio
      logger.debug(`Transitioning to stage: ${nextStage}`);
    } else {
      // No hay más fases, completar el drill
      handleSessionComplete();
    }
  };

  /**
   * Maneja la finalización de la sesión
   */
  const handleSessionComplete = () => {
    const finalStats = {
      ...sessionStats,
      timeSpent: Date.now() - sessionStartTime.current,
      accuracy: sessionStats.totalAttempts > 0 ?
        (sessionStats.correctAnswers / sessionStats.totalAttempts) * 100 : 0,
      exerciseTypes: Array.from(sessionStats.exerciseTypesCompleted),
      verbsMastered: Array.from(sessionStats.verbsMastered),
      patternsIdentified: Array.from(sessionStats.patternsIdentified)
    };

    logger.debug('Session completed:', finalStats);

    if (onPhaseComplete) {
      onPhaseComplete(finalStats);
    } else if (onFinish) {
      onFinish(finalStats);
    }
  };

  /**
   * Continúa al siguiente ejercicio
   */
  const handleContinue = () => {
    setCurrentExercise(null);
    setFeedbackMessage(null);
    setCelebrationMessage(null);

    // Pequeño delay para transición suave
    setTimeout(() => {
      generateNextExercise();
    }, 150);
  };

  // Funciones de utilidad
  const shouldMarkVerbMastered = (result) => {
    return result.correct && result.confidence >= 0.8 && currentDifficulty !== DIFFICULTY_LEVELS.EASY;
  };

  const shouldMarkPatternIdentified = (result) => {
    return result.correct && currentExercise?.type === EXERCISE_TYPES.PATTERN_RECOGNITION;
  };

  const getPatternFromExercise = (exercise) => {
    if (exercise?.verb && selectedFamilies?.length > 0) {
      return selectedFamilies[0]; // Simplificado por ahora
    }
    return null;
  };

  const getNextStage = (current) => {
    const stages = [
      PROGRESSION_STAGES.WARM_UP,
      PROGRESSION_STAGES.BUILDING,
      PROGRESSION_STAGES.CONSOLIDATION,
      PROGRESSION_STAGES.MASTERY
    ];
    const currentIndex = stages.indexOf(current);
    return currentIndex < stages.length - 1 ? stages[currentIndex + 1] : null;
  };

  const showFeedback = (result) => {
    if (result.correct) {
      setFeedbackMessage({
        type: 'success',
        message: '¡Correcto!',
        details: result.feedback || null
      });
    } else {
      setFeedbackMessage({
        type: 'error',
        message: `La respuesta correcta es: ${result.correctAnswer}`,
        details: result.feedback || null
      });
    }
  };

  const showCelebration = (message) => {
    setCelebrationMessage(message);
    setTimeout(() => setCelebrationMessage(null), 3000);
  };

  // Renderizado del componente
  if (isLoading) {
    return (
      <div className="adaptive-drill-container loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Preparando ejercicios adaptativos...</p>
        </div>
      </div>
    );
  }

  if (!currentExercise) {
    return (
      <div className="adaptive-drill-container">
        <div className="drill-header">
          <button onClick={onBack} className="back-button">← Volver</button>
          <h2>Preparando siguiente ejercicio...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="adaptive-drill-container" ref={containerRef}>
      {/* Header con navegación y estado */}
      <header className="drill-header">
        <div className="navigation-controls">
          <button onClick={onBack} className="icon-btn" title="Volver">
            <img src="/back.png" alt="Volver" className="menu-icon" />
          </button>
          <button onClick={() => setShowHints(!showHints)} className="icon-btn" title="Ayuda">
            <img src="/enie.png" alt="Ayuda" className="menu-icon" />
          </button>
          <button onClick={onGoToProgress} className="icon-btn" title="Progreso">
            <img src="/icons/chart.png" alt="Progreso" className="menu-icon" />
          </button>
          <button onClick={onHome} className="icon-btn" title="Inicio">
            <img src="/home.png" alt="Inicio" className="menu-icon" />
          </button>
        </div>

        <ProgressVisualization
          currentStage={currentStage}
          sessionStats={sessionStats}
          exerciseHistory={exerciseHistory}
        />
      </header>

      {/* Área principal del ejercicio */}
      <main className="drill-main">
        {celebrationMessage && (
          <div className="celebration-overlay">
            <div className="celebration-message">
              {celebrationMessage}
            </div>
          </div>
        )}

        <div className="exercise-container">
          {currentExercise.type === EXERCISE_TYPES.CONJUGATION && (
            <ConjugationExercise
              exercise={currentExercise}
              onResult={handleExerciseResult}
              onContinue={handleContinue}
              showHints={showHints}
              feedbackMessage={feedbackMessage}
            />
          )}

          {currentExercise.type === EXERCISE_TYPES.CONTEXTUAL && (
            <ContextualExercise
              exercise={currentExercise}
              onResult={handleExerciseResult}
              onContinue={handleContinue}
              showHints={showHints}
              feedbackMessage={feedbackMessage}
            />
          )}

          {currentExercise.type === EXERCISE_TYPES.SENTENCE_BUILDING && (
            <SentenceBuilding
              exercise={currentExercise}
              onResult={handleExerciseResult}
              onContinue={handleContinue}
              showHints={showHints}
              feedbackMessage={feedbackMessage}
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default AdaptiveLearningDrill;