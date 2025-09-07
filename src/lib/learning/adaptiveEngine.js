/**
 * Adaptive Learning Engine for Spanish Conjugator
 * Personalizes learning experience based on user performance and mastery
 */

import { getMasteryByUser } from '../progress/mastery.js';
import { getProgress } from '../progress/tracking.js';

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

    // Determine difficulty level
    let level, practiceIntensity, skipIntroduction, extendedPractice, hintsEnabled;

    if (avgMastery > 0.85 && masteryPercentage > 0.7) {
      // Advanced user
      level = 'advanced';
      practiceIntensity = 'high';
      skipIntroduction = true;
      extendedPractice = false;
      hintsEnabled = false;
    } else if (avgMastery > 0.65 && masteryPercentage > 0.5) {
      // Intermediate user
      level = 'intermediate';
      practiceIntensity = 'medium';
      skipIntroduction = false;
      extendedPractice = false;
      hintsEnabled = true;
    } else {
      // Beginner/struggling user
      level = 'beginner';
      practiceIntensity = 'low';
      skipIntroduction = false;
      extendedPractice = true;
      hintsEnabled = true;
    }

    return {
      level,
      practiceIntensity,
      skipIntroduction,
      extendedPractice,
      hintsEnabled,
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
  const { level, practiceIntensity, extendedPractice } = adaptiveSettings;
  
  let multiplier = 1;
  let phaseWeights = {
    introduction: 1,
    guided_drills: 1,
    recap: 1,
    practice: 1,
    meaningful_practice: 1,
    communicative_practice: 1
  };

  // Adjust overall duration based on level
  switch (level) {
    case 'advanced':
      multiplier = 0.8; // 20% shorter sessions
      phaseWeights.introduction = 0.5; // Much shorter intro
      phaseWeights.guided_drills = 0.7; // Shorter guided practice
      phaseWeights.practice = 1.2; // More free practice
      break;
    
    case 'intermediate':
      multiplier = 1; // Standard duration
      phaseWeights.introduction = 0.8;
      phaseWeights.guided_drills = 1;
      phaseWeights.practice = 1.1;
      break;
    
    case 'beginner':
      multiplier = 1.2; // 20% longer sessions
      phaseWeights.introduction = 1.2; // Longer introduction
      phaseWeights.guided_drills = 1.3; // More guided practice
      phaseWeights.recap = 1.2; // Longer recap
      break;
  }

  // Adjust for practice intensity
  if (practiceIntensity === 'high') {
    phaseWeights.practice *= 1.3;
    phaseWeights.meaningful_practice *= 1.2;
    phaseWeights.communicative_practice *= 1.2;
  } else if (practiceIntensity === 'low') {
    phaseWeights.practice *= 0.8;
    phaseWeights.meaningful_practice *= 0.9;
    phaseWeights.communicative_practice *= 0.9;
  }

  // Extended practice for struggling users
  if (extendedPractice) {
    phaseWeights.guided_drills *= 1.2;
    phaseWeights.practice *= 1.1;
  }

  const adjustedDuration = baseDuration * multiplier;
  
  return {
    totalDuration: Math.round(adjustedDuration),
    phaseWeights,
    phases: {
      introduction: Math.round((adjustedDuration * 0.15) * phaseWeights.introduction),
      guided_drills: Math.round((adjustedDuration * 0.35) * phaseWeights.guided_drills),
      recap: Math.round((adjustedDuration * 0.10) * phaseWeights.recap),
      practice: Math.round((adjustedDuration * 0.20) * phaseWeights.practice),
      meaningful_practice: Math.round((adjustedDuration * 0.10) * phaseWeights.meaningful_practice),
      communicative_practice: Math.round((adjustedDuration * 0.10) * phaseWeights.communicative_practice)
    }
  };
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
    const progressData = getProgress(userId);
    
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
    
    switch (phase) {
      case 'introduction':
        return adaptiveSettings.skipIntroduction && adaptiveSettings.avgMastery > 0.8;
      
      case 'guided_drill_ar':
      case 'guided_drill_er': 
      case 'guided_drill_ir':
        // Can skip if very high mastery in regular verbs of this tense
        return adaptiveSettings.level === 'advanced' && adaptiveSettings.avgMastery > 0.9;
      
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
  const { accuracy, streak, avgResponseTime, totalAttempts } = currentPerformance;
  
  let adjustments = {
    hintsDelay: 5000, // Default 5 seconds before showing hints
    timeLimit: null, // No time limit by default
    complexityBoost: false,
    encouragementLevel: 'normal'
  };

  if (totalAttempts < 3) {
    // Not enough data yet
    return adjustments;
  }

  if (accuracy >= 90 && streak >= 5) {
    // User is performing excellently
    adjustments.hintsDelay = 10000; // Longer before hints
    adjustments.complexityBoost = true; // More complex exercises
    adjustments.encouragementLevel = 'minimal';
  } else if (accuracy >= 75 && streak >= 3) {
    // Good performance
    adjustments.hintsDelay = 7000;
    adjustments.encouragementLevel = 'normal';
  } else if (accuracy < 50 || streak === 0) {
    // Struggling
    adjustments.hintsDelay = 3000; // Faster hints
    adjustments.timeLimit = 30000; // 30 second time limit to prevent overthinking
    adjustments.encouragementLevel = 'supportive';
  }

  // Adjust based on response time
  if (avgResponseTime > 15000) { // Over 15 seconds average
    adjustments.hintsDelay = Math.min(adjustments.hintsDelay, 4000);
    adjustments.encouragementLevel = 'supportive';
  }

  return adjustments;
}