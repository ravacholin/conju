/**
 * useDifficultyAdjustment.js - Hook para ajuste dinámico de dificultad
 *
 * Ajusta automáticamente la dificultad de los ejercicios basado en el rendimiento
 * del usuario, siguiendo principios de zona de desarrollo próximo.
 */

import { useState, useEffect, useRef } from 'react';
import { DIFFICULTY_LEVELS, PROGRESSION_THRESHOLDS } from '../utils/constants.js';
import { createLogger } from '../../../../lib/utils/logger.js';

const logger = createLogger('useDifficultyAdjustment');

/**
 * Hook para ajuste dinámico de dificultad
 */
export function useDifficultyAdjustment({
  sessionStats,
  currentStage
}) {
  // Estado de dificultad
  const [currentDifficulty, setCurrentDifficulty] = useState(DIFFICULTY_LEVELS.INTERMEDIATE);
  const [difficultyHistory, setDifficultyHistory] = useState([]);
  const [lastAdjustment, setLastAdjustment] = useState(null);

  // Referencias para evitar ajustes excesivos
  const consecutiveErrors = useRef(0);
  const consecutiveCorrect = useRef(0);
  const lastAdjustmentTime = useRef(Date.now());

  // Ajustar dificultad inicial basada en la etapa
  useEffect(() => {
    const stageDifficulty = getStageDifficulty(currentStage);
    if (stageDifficulty !== currentDifficulty) {
      setCurrentDifficulty(stageDifficulty);
      logger.debug(`Difficulty adjusted for stage ${currentStage}: ${stageDifficulty}`);
    }
  }, [currentStage]);

  /**
   * Ajusta la dificultad basado en el resultado de un ejercicio
   */
  const adjustDifficulty = (result) => {
    const now = Date.now();
    const timeSinceLastAdjustment = now - lastAdjustmentTime.current;

    // Evitar ajustes demasiado frecuentes
    if (timeSinceLastAdjustment < 5000) {
      return;
    }

    // Actualizar contadores
    if (result.correct) {
      consecutiveCorrect.current++;
      consecutiveErrors.current = 0;
    } else {
      consecutiveErrors.current++;
      consecutiveCorrect.current = 0;
    }

    // Determinar si necesitamos ajuste
    const adjustment = calculateDifficultyAdjustment(result, sessionStats);

    if (adjustment !== null) {
      const newDifficulty = applyDifficultyAdjustment(currentDifficulty, adjustment);

      if (newDifficulty !== currentDifficulty) {
        setCurrentDifficulty(newDifficulty);
        setLastAdjustment({
          from: currentDifficulty,
          to: newDifficulty,
          reason: adjustment.reason,
          timestamp: now
        });

        setDifficultyHistory(prev => [...prev, {
          difficulty: newDifficulty,
          timestamp: now,
          trigger: adjustment.reason,
          sessionStats: { ...sessionStats }
        }]);

        lastAdjustmentTime.current = now;

        logger.debug('Difficulty adjusted:', {
          from: currentDifficulty,
          to: newDifficulty,
          reason: adjustment.reason,
          consecutiveCorrect: consecutiveCorrect.current,
          consecutiveErrors: consecutiveErrors.current
        });
      }
    }
  };

  /**
   * Calcula si necesitamos ajuste de dificultad
   */
  const calculateDifficultyAdjustment = (result, stats) => {
    const accuracy = stats.totalAttempts > 0 ?
      stats.correctAnswers / stats.totalAttempts : 0;

    // Condiciones para aumentar dificultad
    if (shouldIncreaseDifficulty(accuracy, stats)) {
      return {
        direction: 'increase',
        reason: getDifficultyIncreaseReason(accuracy, stats)
      };
    }

    // Condiciones para reducir dificultad
    if (shouldDecreaseDifficulty(accuracy, stats)) {
      return {
        direction: 'decrease',
        reason: getDifficultyDecreaseReason(accuracy, stats)
      };
    }

    return null;
  };

  /**
   * Determina si debemos aumentar la dificultad
   */
  const shouldIncreaseDifficulty = (accuracy, stats) => {
    // Muy alta precisión y racha larga
    if (accuracy >= 0.9 && stats.currentStreak >= PROGRESSION_THRESHOLDS.STREAK_FOR_DIFFICULTY_INCREASE) {
      return true;
    }

    // Muchos ejercicios correctos consecutivos
    if (consecutiveCorrect.current >= 8) {
      return true;
    }

    // Tiempo promedio muy rápido (indica facilidad excesiva)
    const avgTime = calculateAverageResponseTime(stats);
    if (avgTime > 0 && avgTime < 3000 && accuracy >= 0.85) {
      return true;
    }

    return false;
  };

  /**
   * Determina si debemos reducir la dificultad
   */
  const shouldDecreaseDifficulty = (accuracy, stats) => {
    // Baja precisión persistente
    if (accuracy < 0.6 && stats.totalAttempts >= 5) {
      return true;
    }

    // Muchos errores consecutivos
    if (consecutiveErrors.current >= PROGRESSION_THRESHOLDS.ERRORS_FOR_DIFFICULTY_DECREASE) {
      return true;
    }

    // Tiempo promedio muy lento (indica dificultad excesiva)
    const avgTime = calculateAverageResponseTime(stats);
    if (avgTime > 15000 && accuracy < 0.7) {
      return true;
    }

    return false;
  };

  /**
   * Aplica el ajuste de dificultad
   */
  const applyDifficultyAdjustment = (current, adjustment) => {
    const levels = [
      DIFFICULTY_LEVELS.EASY,
      DIFFICULTY_LEVELS.INTERMEDIATE,
      DIFFICULTY_LEVELS.ADVANCED,
      DIFFICULTY_LEVELS.EXPERT
    ];

    const currentIndex = levels.indexOf(current);
    let newIndex = currentIndex;

    if (adjustment.direction === 'increase' && currentIndex < levels.length - 1) {
      newIndex = currentIndex + 1;
    } else if (adjustment.direction === 'decrease' && currentIndex > 0) {
      newIndex = currentIndex - 1;
    }

    return levels[newIndex];
  };

  /**
   * Obtiene dificultad inicial por etapa
   */
  const getStageDifficulty = (stage) => {
    switch (stage) {
      case 'warm_up':
        return DIFFICULTY_LEVELS.EASY;
      case 'building':
        return DIFFICULTY_LEVELS.INTERMEDIATE;
      case 'consolidation':
        return DIFFICULTY_LEVELS.INTERMEDIATE;
      case 'mastery':
        return DIFFICULTY_LEVELS.ADVANCED;
      default:
        return DIFFICULTY_LEVELS.INTERMEDIATE;
    }
  };

  /**
   * Funciones de utilidad para determinar razones de ajuste
   */
  const getDifficultyIncreaseReason = (accuracy, stats) => {
    if (accuracy >= 0.95) return 'excellent_accuracy';
    if (stats.currentStreak >= 10) return 'long_streak';
    if (consecutiveCorrect.current >= 8) return 'consecutive_correct';
    return 'fast_responses';
  };

  const getDifficultyDecreaseReason = (accuracy, stats) => {
    if (accuracy < 0.5) return 'low_accuracy';
    if (consecutiveErrors.current >= 3) return 'consecutive_errors';
    return 'slow_responses';
  };

  const calculateAverageResponseTime = (stats) => {
    // Esta es una aproximación - en implementación real usaríamos tiempos reales
    if (stats.totalAttempts === 0) return 0;

    // Estimar basado en dificultad y precisión
    const baseTime = 8000; // 8 segundos base
    const accuracyFactor = stats.correctAnswers / stats.totalAttempts;

    return baseTime * (1.5 - accuracyFactor);
  };

  /**
   * Obtiene configuración de dificultad para el ejercicio actual
   */
  const getDifficultyConfig = () => {
    switch (currentDifficulty) {
      case DIFFICULTY_LEVELS.EASY:
        return {
          level: 'easy',
          showHints: true,
          allowedTime: 20000,
          personSubset: ['1s', '3s'], // Solo formas más simples
          verbComplexity: 'low',
          contextualHelp: true
        };

      case DIFFICULTY_LEVELS.INTERMEDIATE:
        return {
          level: 'intermediate',
          showHints: true,
          allowedTime: 15000,
          personSubset: ['1s', '2s_tu', '3s', '3p'],
          verbComplexity: 'medium',
          contextualHelp: false
        };

      case DIFFICULTY_LEVELS.ADVANCED:
        return {
          level: 'advanced',
          showHints: false,
          allowedTime: 12000,
          personSubset: null, // Todas las personas
          verbComplexity: 'high',
          contextualHelp: false
        };

      case DIFFICULTY_LEVELS.EXPERT:
        return {
          level: 'expert',
          showHints: false,
          allowedTime: 10000,
          personSubset: null,
          verbComplexity: 'very_high',
          contextualHelp: false
        };

      default:
        return getDifficultyConfig(DIFFICULTY_LEVELS.INTERMEDIATE);
    }
  };

  return {
    currentDifficulty,
    difficultyHistory,
    lastAdjustment,
    adjustDifficulty,
    getDifficultyConfig
  };
}