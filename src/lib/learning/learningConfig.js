/**
 * Centralized Learning Configuration Module
 * Contains all difficulty and duration parameters for the learning system
 */

/**
 * Session duration options and their characteristics
 */
export const SESSION_DURATIONS = {
  SHORT: {
    minutes: 5,
    label: '5 minutos',
    description: 'Práctica intensiva',
    title: 'Sesión de 5 minutos'
  },
  MEDIUM: {
    minutes: 10,
    label: '10 minutos',
    description: 'Sesión media',
    title: 'Sesión de 10 minutos'
  },
  LONG: {
    minutes: 15,
    label: '15 minutos', 
    description: 'Sesión larga',
    title: 'Sesión de 15 minutos'
  }
};

/**
 * CEFR level mapping for tenses
 */
export const TENSE_CEFR_LEVELS = {
  // A1 - Básico
  'pres': 'A1',           // Presente
  
  // A2 - Elemental  
  'pretIndef': 'A2',      // Pretérito indefinido
  'impf': 'A2',           // Imperfecto
  'fut': 'A2',            // Futuro simple
  
  // B1 - Intermedio
  'cond': 'B1',           // Condicional simple
  'subjPres': 'B1',       // Presente de subjuntivo
  'impAff': 'B1',         // Imperativo afirmativo
  'impNeg': 'B1',         // Imperativo negativo
  
  // B2 - Intermedio alto
  'subjImpf': 'B2',       // Imperfecto de subjuntivo
  'pretPerf': 'B2',       // Pretérito perfecto compuesto
  'plusc': 'B2',          // Pluscuamperfecto
  'futPerf': 'B2',        // Futuro perfecto
  
  // C1 - Avanzado
  'condPerf': 'C1',       // Condicional compuesto
  'subjPerf': 'C1',       // Perfecto de subjuntivo
  'subjPlusc': 'C1'       // Pluscuamperfecto de subjuntivo
};

/**
 * Drill completion and progression thresholds
 */
export const DRILL_THRESHOLDS = {
  STREAK_FOR_COMPLETION: 10,    // Minimum streak to complete mechanical phase
  STREAK_ANIMATION_TRIGGER: 5,  // Streak count that triggers celebration animation
  MIN_ATTEMPTS_FOR_ASSESSMENT: 3, // Minimum attempts before adjusting difficulty
  EXERCISE_HISTORY_SIZE: 20,    // Maximum size of exercise history for variety
  FAILED_ITEMS_REINTEGRATION: true // Whether to reintegrate failed items
};

/**
 * Real-time difficulty adjustment parameters
 */
export const DIFFICULTY_PARAMS = {
  DEFAULT: {
    hintsDelay: 5000,           // 5 seconds before showing hints
    timeLimit: null,            // No time limit
    complexityBoost: false,
    encouragementLevel: 'normal'
  },
  EXCELLENT_PERFORMANCE: {
    accuracyThreshold: 90,
    streakThreshold: 5,
    hintsDelay: 10000,          // 10 seconds before hints
    complexityBoost: true,
    encouragementLevel: 'minimal'
  },
  GOOD_PERFORMANCE: {
    accuracyThreshold: 75,
    streakThreshold: 3,
    hintsDelay: 7000,           // 7 seconds before hints
    encouragementLevel: 'normal'
  },
  STRUGGLING_PERFORMANCE: {
    accuracyThreshold: 50,
    hintsDelay: 3000,           // 3 seconds before hints
    timeLimit: 30000,           // 30 second time limit
    encouragementLevel: 'supportive'
  },
  SLOW_RESPONSE: {
    responseTimeThreshold: 15000, // 15 seconds
    adjustedHintsDelay: 4000,   // 4 seconds before hints
    encouragementLevel: 'supportive'
  }
};

/**
 * Adaptive learning levels and their characteristics
 */
export const ADAPTIVE_LEVELS = {
  BEGINNER: {
    level: 'beginner',
    practiceIntensity: 'low',
    skipIntroduction: false,
    extendedPractice: true,
    hintsEnabled: true,
    durationMultiplier: 1.2,    // 20% longer sessions
    phaseWeights: {
      introduction: 1.2,         // Longer introduction
      guided_drills: 1.3,        // More guided practice
      recap: 1.2,               // Longer recap
      practice: 0.8,            // Less free practice
      meaningful_practice: 0.9,
      communicative_practice: 0.9
    }
  },
  INTERMEDIATE: {
    level: 'intermediate',
    practiceIntensity: 'medium',
    skipIntroduction: false,
    extendedPractice: false,
    hintsEnabled: true,
    durationMultiplier: 1.0,    // Standard duration
    phaseWeights: {
      introduction: 0.8,
      guided_drills: 1.0,
      recap: 1.0,
      practice: 1.1,
      meaningful_practice: 1.0,
      communicative_practice: 1.0
    }
  },
  ADVANCED: {
    level: 'advanced',
    practiceIntensity: 'high',
    skipIntroduction: true,
    extendedPractice: false,
    hintsEnabled: false,
    durationMultiplier: 0.8,    // 20% shorter sessions
    phaseWeights: {
      introduction: 0.5,         // Much shorter intro
      guided_drills: 0.7,        // Shorter guided practice
      recap: 0.8,
      practice: 1.2,            // More free practice
      meaningful_practice: 1.2,
      communicative_practice: 1.2
    }
  }
};

/**
 * Mastery thresholds for adaptive level determination
 */
export const MASTERY_THRESHOLDS = {
  ADVANCED: {
    avgMasteryMin: 0.85,
    masteryPercentageMin: 0.7,  // 70% of items with mastery > 0.8
    skipIntroductionMastery: 0.8,
    skipGuidedDrillsMastery: 0.9
  },
  INTERMEDIATE: {
    avgMasteryMin: 0.65,
    masteryPercentageMin: 0.5   // 50% of items with mastery > 0.8
  },
  BEGINNER: {
    // Below intermediate thresholds
  }
};

/**
 * Session phase distribution (as percentage of total duration)
 */
export const PHASE_DISTRIBUTION = {
  introduction: 0.15,           // 15%
  guided_drills: 0.35,         // 35%
  recap: 0.10,                 // 10%
  practice: 0.20,              // 20%
  meaningful_practice: 0.10,    // 10%
  communicative_practice: 0.10  // 10%
};

/**
 * Learning flow step sequence for navigation and smart transitions
 */
export const LEARNING_FLOW_STEPS = [
  'introduction',
  'guided_drill_ar',
  'guided_drill_er',
  'guided_drill_ir',
  'recap',
  'practice',
  'meaningful_practice',
  'pronunciation_practice',
  'communicative_practice'
];

/**
 * A/B Testing configuration
 */
export const AB_TESTING_CONFIG = {
  LEARNING_FLOW_V1: {
    testId: 'learning_flow_v1',
    name: 'Learning Flow Optimization',
    description: 'Test different approaches to guided drill progression',
    variants: ['control', 'enhanced'],
    trafficSplit: [50, 50],
    duration: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
    metrics: ['completion_rate', 'accuracy', 'engagement', 'session_duration']
  }
};

/**
 * Scoring system configuration
 */
export const SCORING_CONFIG = {
  REGULAR_VERB_POINTS: 10,
  IRREGULAR_VERB_POINTS: 15,
  STREAK_ANIMATION_INTERVAL: 5  // Show animation every 5 correct answers
};

/**
 * Get level configuration for a tense
 * @param {string} tense - The tense identifier
 * @returns {string} CEFR level
 */
export function getLevelForTense(tense) {
  return TENSE_CEFR_LEVELS[tense] || 'A1';
}

/**
 * Get adaptive level configuration based on mastery data
 * @param {number} avgMastery - Average mastery score
 * @param {number} masteryPercentage - Percentage of high-mastery items
 * @returns {Object} Adaptive level configuration
 */
export function getAdaptiveLevelConfig(avgMastery, masteryPercentage) {
  const thresholds = MASTERY_THRESHOLDS;
  
  if (avgMastery > thresholds.ADVANCED.avgMasteryMin && 
      masteryPercentage > thresholds.ADVANCED.masteryPercentageMin) {
    return { ...ADAPTIVE_LEVELS.ADVANCED };
  } else if (avgMastery > thresholds.INTERMEDIATE.avgMasteryMin && 
             masteryPercentage > thresholds.INTERMEDIATE.masteryPercentageMin) {
    return { ...ADAPTIVE_LEVELS.INTERMEDIATE };
  } else {
    return { ...ADAPTIVE_LEVELS.BEGINNER };
  }
}

/**
 * Get real-time difficulty adjustments based on performance
 * @param {Object} performance - Current performance metrics
 * @returns {Object} Difficulty adjustment settings
 */
export function getRealTimeDifficultyConfig(performance) {
  const { accuracy, streak, avgResponseTime, totalAttempts } = performance;
  
  if (totalAttempts < DRILL_THRESHOLDS.MIN_ATTEMPTS_FOR_ASSESSMENT) {
    return { ...DIFFICULTY_PARAMS.DEFAULT };
  }

  let config = { ...DIFFICULTY_PARAMS.DEFAULT };

  // Check for excellent performance
  if (accuracy >= DIFFICULTY_PARAMS.EXCELLENT_PERFORMANCE.accuracyThreshold && 
      streak >= DIFFICULTY_PARAMS.EXCELLENT_PERFORMANCE.streakThreshold) {
    config = {
      ...config,
      hintsDelay: DIFFICULTY_PARAMS.EXCELLENT_PERFORMANCE.hintsDelay,
      complexityBoost: DIFFICULTY_PARAMS.EXCELLENT_PERFORMANCE.complexityBoost,
      encouragementLevel: DIFFICULTY_PARAMS.EXCELLENT_PERFORMANCE.encouragementLevel
    };
  }
  // Check for good performance
  else if (accuracy >= DIFFICULTY_PARAMS.GOOD_PERFORMANCE.accuracyThreshold && 
           streak >= DIFFICULTY_PARAMS.GOOD_PERFORMANCE.streakThreshold) {
    config = {
      ...config,
      hintsDelay: DIFFICULTY_PARAMS.GOOD_PERFORMANCE.hintsDelay,
      encouragementLevel: DIFFICULTY_PARAMS.GOOD_PERFORMANCE.encouragementLevel
    };
  }
  // Check for struggling performance
  else if (accuracy < DIFFICULTY_PARAMS.STRUGGLING_PERFORMANCE.accuracyThreshold || 
           streak === 0) {
    config = {
      ...config,
      hintsDelay: DIFFICULTY_PARAMS.STRUGGLING_PERFORMANCE.hintsDelay,
      timeLimit: DIFFICULTY_PARAMS.STRUGGLING_PERFORMANCE.timeLimit,
      encouragementLevel: DIFFICULTY_PARAMS.STRUGGLING_PERFORMANCE.encouragementLevel
    };
  }

  // Adjust for slow response time
  if (avgResponseTime > DIFFICULTY_PARAMS.SLOW_RESPONSE.responseTimeThreshold) {
    config.hintsDelay = Math.min(config.hintsDelay, DIFFICULTY_PARAMS.SLOW_RESPONSE.adjustedHintsDelay);
    config.encouragementLevel = DIFFICULTY_PARAMS.SLOW_RESPONSE.encouragementLevel;
  }

  return config;
}

/**
 * Get session duration configurations
 * @returns {Array} Array of duration configurations
 */
export function getSessionDurationOptions() {
  return Object.values(SESSION_DURATIONS);
}

/**
 * Get next step in learning flow sequence
 * @param {string} currentStep - Current step identifier
 * @returns {string|null} Next step identifier or null if at end
 */
export function getNextFlowStep(currentStep) {
  const currentIndex = LEARNING_FLOW_STEPS.indexOf(currentStep);
  if (currentIndex >= 0 && currentIndex < LEARNING_FLOW_STEPS.length - 1) {
    return LEARNING_FLOW_STEPS[currentIndex + 1];
  }
  return null;
}

/**
 * Calculate session phase durations based on total duration and adaptive settings
 * @param {number} totalDurationMinutes - Total session duration in minutes
 * @param {Object} adaptiveConfig - Adaptive level configuration
 * @returns {Object} Phase duration breakdown
 */
export function calculatePhaseDurations(totalDurationMinutes, adaptiveConfig) {
  const totalMs = totalDurationMinutes * 60 * 1000;
  const multiplier = adaptiveConfig.durationMultiplier || 1;
  const adjustedDuration = totalMs * multiplier;
  
  const phases = {};
  Object.entries(PHASE_DISTRIBUTION).forEach(([phase, percentage]) => {
    const weight = adaptiveConfig.phaseWeights?.[phase] || 1;
    phases[phase] = Math.round(adjustedDuration * percentage * weight);
  });
  
  return {
    totalDuration: Math.round(adjustedDuration),
    phases
  };
}