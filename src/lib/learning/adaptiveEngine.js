/**
 * Adaptive Learning Engine for Spanish Conjugator
 * Personalizes learning experience based on user performance and mastery
 */

import { getMasteryByUser } from '../progress/database.js';
import {
  getAdaptiveLevelConfig,
  MASTERY_THRESHOLDS,
  PHASE_DISTRIBUTION,
  calculatePhaseDurations,
  getRealTimeDifficultyConfig
} from './learningConfig.js';

/**
 * Calculates adaptive difficulty level based on user's mastery scores
 * @param {string} userId - User ID
 * @param {string} tense - Target tense
 * @param {string} verbType - Type of verbs (regular/irregular)
 * @returns {Object} Difficulty settings
 */
export function calculateAdaptiveDifficulty(userId, tense, verbType) {
  try {
    const masteryData = getMasteryByUser(userId);
    
    if (!masteryData || Object.keys(masteryData).length === 0) {
      // New user - start with beginner settings
      return {
        level: 'beginner',
        practiceIntensity: 'low',
        skipIntroduction: false,
        extendedPractice: true,
        hintsEnabled: true
      };
    }

    // Calculate average mastery for this tense
    const tenseItems = Object.entries(masteryData)
      .filter(([itemId, data]) => data.tense === tense)
      .map(([itemId, data]) => data.mastery);

    if (tenseItems.length === 0) {
      // No experience with this tense
      return {
        level: 'beginner',
        practiceIntensity: 'medium',
        skipIntroduction: false,
        extendedPractice: true,
        hintsEnabled: true
      };
    }

    const avgMastery = tenseItems.reduce((sum, m) => sum + m, 0) / tenseItems.length;
    const highMasteryCount = tenseItems.filter(m => m > 0.8).length;
    const masteryPercentage = highMasteryCount / tenseItems.length;

    // Get adaptive level configuration using centralized config
    const adaptiveConfig = getAdaptiveLevelConfig(avgMastery, masteryPercentage);

    return {
      ...adaptiveConfig,
      avgMastery,
      masteryPercentage
    };

  } catch (error) {
    console.error('Error calculating adaptive difficulty:', error);
    // Fallback to safe defaults
    return {
      level: 'beginner',
      practiceIntensity: 'medium',
      skipIntroduction: false,
      extendedPractice: true,
      hintsEnabled: true
    };
  }
}

/**
 * Personalizes phase durations based on user performance
 * @param {Object} adaptiveSettings - Settings from calculateAdaptiveDifficulty
 * @param {number} baseDuration - Base duration in minutes
 * @returns {Object} Phase duration settings
 */
export function personalizeSessionDuration(adaptiveSettings, baseDuration = 10) {
  // Use centralized phase duration calculation
  return calculatePhaseDurations(baseDuration, adaptiveSettings);
}

/**
 * Generates intelligent recommendations for next learning session
 * @param {string} userId - User ID
 * @param {Object} currentSession - Current session data
 * @returns {Object} Recommendations
 */
export function generateNextSessionRecommendations(userId, currentSession) {
  try {
    const masteryData = getMasteryByUser(userId);
    
    if (!masteryData || !currentSession) {
      return {
        recommendedTense: 'pres',
        recommendedType: 'regular',
        recommendedDuration: 10,
        reason: 'Empezar con presente - base fundamental',
        confidence: 'medium'
      };
    }

    const { tense, verbType, accuracy, totalAttempts } = currentSession;
    
    // Analyze current session performance
    let nextRecommendation = {
      recommendedTense: tense,
      recommendedType: verbType,
      recommendedDuration: 10,
      reason: '',
      confidence: 'medium'
    };

    if (accuracy >= 85 && totalAttempts >= 10) {
      // Excellent performance - suggest progression
      const progressionMap = {
        'pres': 'pretIndef',
        'pretIndef': 'impf', 
        'impf': 'fut',
        'fut': 'cond',
        'cond': 'pretPerf'
      };
      
      if (progressionMap[tense]) {
        nextRecommendation.recommendedTense = progressionMap[tense];
        nextRecommendation.reason = `Excelente progreso en ${tense}. Listo para ${progressionMap[tense]}`;
        nextRecommendation.confidence = 'high';
      } else {
        // Suggest irregular if currently on regular
        if (verbType === 'regular') {
          nextRecommendation.recommendedType = 'irregular';
          nextRecommendation.reason = `Dominas verbos regulares. Hora de irregulares en ${tense}`;
        } else {
          nextRecommendation.reason = `Continúa perfeccionando ${tense} irregular`;
        }
      }
    } else if (accuracy >= 70) {
      // Good performance - continue with same tense but adjust type
      nextRecommendation.reason = `Buen progreso. Continúa con ${tense} para consolidar`;
      if (verbType === 'regular' && accuracy >= 75) {
        nextRecommendation.recommendedType = 'irregular';
        nextRecommendation.reason += ' - prueba irregulares';
      }
    } else {
      // Needs more practice
      nextRecommendation.reason = `Necesitas más práctica con ${tense}. Repite sesión similar`;
      nextRecommendation.recommendedDuration = Math.min(15, nextRecommendation.recommendedDuration + 2);
    }

    // Check for weak areas from mastery data
    const weakTenses = Object.entries(masteryData)
      .reduce((acc, [itemId, data]) => {
        if (data.mastery < 0.6) {
          acc[data.tense] = (acc[data.tense] || 0) + 1;
        }
        return acc;
      }, {});

    if (Object.keys(weakTenses).length > 0) {
      const weakestTense = Object.entries(weakTenses)
        .sort((a, b) => b[1] - a[1])[0][0];
      
      if (accuracy >= 80 && weakestTense !== tense) {
        nextRecommendation.recommendedTense = weakestTense;
        nextRecommendation.reason = `Reforzar área débil: ${weakestTense}`;
        nextRecommendation.confidence = 'high';
      }
    }

    return nextRecommendation;

  } catch (error) {
    console.error('Error generating recommendations:', error);
    return {
      recommendedTense: 'pres',
      recommendedType: 'regular', 
      recommendedDuration: 10,
      reason: 'Recomendación por defecto',
      confidence: 'low'
    };
  }
}

/**
 * Determines if user can skip certain content based on mastery
 * @param {string} userId - User ID
 * @param {string} tense - Target tense
 * @param {string} phase - Learning phase to check
 * @returns {boolean} Whether phase can be skipped
 */
export function canSkipPhase(userId, tense, phase) {
  try {
    const adaptiveSettings = calculateAdaptiveDifficulty(userId, tense, 'regular');
    
    const thresholds = MASTERY_THRESHOLDS;
    
    switch (phase) {
      case 'introduction':
        return adaptiveSettings.skipIntroduction && adaptiveSettings.avgMastery > thresholds.ADVANCED.skipIntroductionMastery;
      
      case 'guided_drill_ar':
      case 'guided_drill_er': 
      case 'guided_drill_ir':
        // Can skip if very high mastery in regular verbs of this tense
        return adaptiveSettings.level === 'advanced' && adaptiveSettings.avgMastery > thresholds.ADVANCED.skipGuidedDrillsMastery;
      
      case 'recap':
        // Can skip recap if performing very well
        return adaptiveSettings.level === 'advanced';
      
      default:
        return false;
    }
  } catch (error) {
    console.error('Error checking skip eligibility:', error);
    return false;
  }
}

/**
 * Adjusts exercise difficulty in real-time based on performance
 * @param {Object} currentPerformance - Current session performance metrics
 * @returns {Object} Adjusted difficulty settings
 */
export function adjustRealTimeDifficulty(currentPerformance) {
  // Delegate to centralized config function for consistency
  return getRealTimeDifficultyConfig(currentPerformance);
}