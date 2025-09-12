import { describe, it, expect } from 'vitest'
import {
  SESSION_DURATIONS,
  TENSE_CEFR_LEVELS,
  DRILL_THRESHOLDS,
  DIFFICULTY_PARAMS,
  ADAPTIVE_LEVELS,
  MASTERY_THRESHOLDS,
  PHASE_DISTRIBUTION,
  LEARNING_FLOW_STEPS,
  AB_TESTING_CONFIG,
  SCORING_CONFIG,
  getLevelForTense,
  getAdaptiveLevelConfig,
  getRealTimeDifficultyConfig,
  getSessionDurationOptions,
  getNextFlowStep,
  calculatePhaseDurations
} from './learningConfig.js'

describe('Learning Configuration Module', () => {
  
  describe('Session Duration Configuration', () => {
    it('should have all required session duration options', () => {
      expect(SESSION_DURATIONS.SHORT).toBeDefined()
      expect(SESSION_DURATIONS.MEDIUM).toBeDefined() 
      expect(SESSION_DURATIONS.LONG).toBeDefined()
      
      expect(SESSION_DURATIONS.SHORT.minutes).toBe(5)
      expect(SESSION_DURATIONS.MEDIUM.minutes).toBe(10)
      expect(SESSION_DURATIONS.LONG.minutes).toBe(15)
    })

    it('should provide proper labels and descriptions', () => {
      expect(SESSION_DURATIONS.SHORT.label).toBe('5 minutos')
      expect(SESSION_DURATIONS.SHORT.description).toBe('Práctica intensiva')
      expect(SESSION_DURATIONS.SHORT.title).toBe('Sesión de 5 minutos')
    })

    it('getSessionDurationOptions should return array of duration configs', () => {
      const options = getSessionDurationOptions()
      expect(Array.isArray(options)).toBe(true)
      expect(options.length).toBe(3)
      expect(options[0].minutes).toBeDefined()
      expect(options[0].label).toBeDefined()
    })
  })

  describe('CEFR Level Mappings', () => {
    it('should map basic tenses to A1-A2', () => {
      expect(getLevelForTense('pres')).toBe('A1')
      expect(getLevelForTense('pretIndef')).toBe('A2')
      expect(getLevelForTense('impf')).toBe('A2')
      expect(getLevelForTense('fut')).toBe('A2')
    })

    it('should map intermediate tenses to B1', () => {
      expect(getLevelForTense('cond')).toBe('B1')
      expect(getLevelForTense('subjPres')).toBe('B1')
      expect(getLevelForTense('impAff')).toBe('B1')
      expect(getLevelForTense('impNeg')).toBe('B1')
    })

    it('should map advanced tenses to B2-C1', () => {
      expect(getLevelForTense('subjImpf')).toBe('B2')
      expect(getLevelForTense('pretPerf')).toBe('B2')
      expect(getLevelForTense('condPerf')).toBe('C1')
      expect(getLevelForTense('subjPlusc')).toBe('C1')
    })

    it('should return A1 for unknown tenses', () => {
      expect(getLevelForTense('unknown')).toBe('A1')
      expect(getLevelForTense('')).toBe('A1')
      expect(getLevelForTense(null)).toBe('A1')
    })
  })

  describe('Drill Thresholds', () => {
    it('should have reasonable threshold values', () => {
      expect(DRILL_THRESHOLDS.STREAK_FOR_COMPLETION).toBe(10)
      expect(DRILL_THRESHOLDS.STREAK_ANIMATION_TRIGGER).toBe(5)
      expect(DRILL_THRESHOLDS.MIN_ATTEMPTS_FOR_ASSESSMENT).toBe(3)
      expect(DRILL_THRESHOLDS.EXERCISE_HISTORY_SIZE).toBe(20)
      expect(DRILL_THRESHOLDS.FAILED_ITEMS_REINTEGRATION).toBe(true)
    })
  })

  describe('Difficulty Parameters', () => {
    it('should have default difficulty settings', () => {
      const defaultParams = DIFFICULTY_PARAMS.DEFAULT
      expect(defaultParams.hintsDelay).toBe(5000)
      expect(defaultParams.timeLimit).toBe(null)
      expect(defaultParams.complexityBoost).toBe(false)
      expect(defaultParams.encouragementLevel).toBe('normal')
    })

    it('should have escalating difficulty for excellent performance', () => {
      const excellentParams = DIFFICULTY_PARAMS.EXCELLENT_PERFORMANCE
      expect(excellentParams.accuracyThreshold).toBe(90)
      expect(excellentParams.streakThreshold).toBe(5)
      expect(excellentParams.hintsDelay).toBe(10000)
      expect(excellentParams.complexityBoost).toBe(true)
      expect(excellentParams.encouragementLevel).toBe('minimal')
    })

    it('should have supportive settings for struggling performance', () => {
      const strugglingParams = DIFFICULTY_PARAMS.STRUGGLING_PERFORMANCE
      expect(strugglingParams.accuracyThreshold).toBe(50)
      expect(strugglingParams.hintsDelay).toBe(3000)
      expect(strugglingParams.timeLimit).toBe(30000)
      expect(strugglingParams.encouragementLevel).toBe('supportive')
    })
  })

  describe('Adaptive Level Configuration', () => {
    it('should classify advanced users correctly', () => {
      const advancedConfig = getAdaptiveLevelConfig(0.9, 0.8)
      expect(advancedConfig.level).toBe('advanced')
      expect(advancedConfig.practiceIntensity).toBe('high')
      expect(advancedConfig.skipIntroduction).toBe(true)
      expect(advancedConfig.hintsEnabled).toBe(false)
      expect(advancedConfig.durationMultiplier).toBe(0.8)
    })

    it('should classify intermediate users correctly', () => {
      const intermediateConfig = getAdaptiveLevelConfig(0.7, 0.6)
      expect(intermediateConfig.level).toBe('intermediate')
      expect(intermediateConfig.practiceIntensity).toBe('medium')
      expect(intermediateConfig.skipIntroduction).toBe(false)
      expect(intermediateConfig.hintsEnabled).toBe(true)
      expect(intermediateConfig.durationMultiplier).toBe(1.0)
    })

    it('should classify beginner users correctly', () => {
      const beginnerConfig = getAdaptiveLevelConfig(0.4, 0.3)
      expect(beginnerConfig.level).toBe('beginner')
      expect(beginnerConfig.practiceIntensity).toBe('low')
      expect(beginnerConfig.skipIntroduction).toBe(false)
      expect(beginnerConfig.extendedPractice).toBe(true)
      expect(beginnerConfig.hintsEnabled).toBe(true)
      expect(beginnerConfig.durationMultiplier).toBe(1.2)
    })
  })

  describe('Real-time Difficulty Configuration', () => {
    it('should return default config for insufficient attempts', () => {
      const config = getRealTimeDifficultyConfig({
        accuracy: 75,
        streak: 3,
        avgResponseTime: 8000,
        totalAttempts: 2
      })
      expect(config).toEqual(DIFFICULTY_PARAMS.DEFAULT)
    })

    it('should increase difficulty for excellent performance', () => {
      const config = getRealTimeDifficultyConfig({
        accuracy: 95,
        streak: 6,
        avgResponseTime: 5000,
        totalAttempts: 10
      })
      expect(config.hintsDelay).toBe(10000)
      expect(config.complexityBoost).toBe(true)
      expect(config.encouragementLevel).toBe('minimal')
    })

    it('should provide support for struggling performance', () => {
      const config = getRealTimeDifficultyConfig({
        accuracy: 40,
        streak: 0,
        avgResponseTime: 12000,
        totalAttempts: 8
      })
      expect(config.hintsDelay).toBe(3000)
      expect(config.timeLimit).toBe(30000)
      expect(config.encouragementLevel).toBe('supportive')
    })

    it('should adjust for slow response times', () => {
      const config = getRealTimeDifficultyConfig({
        accuracy: 80,
        streak: 3,
        avgResponseTime: 20000,
        totalAttempts: 5
      })
      expect(config.hintsDelay).toBe(4000)
      expect(config.encouragementLevel).toBe('supportive')
    })
  })

  describe('Learning Flow Navigation', () => {
    it('should have proper step sequence', () => {
      expect(LEARNING_FLOW_STEPS).toContain('introduction')
      expect(LEARNING_FLOW_STEPS).toContain('guided_drill_ar')
      expect(LEARNING_FLOW_STEPS).toContain('recap')
      expect(LEARNING_FLOW_STEPS).toContain('practice')
      expect(LEARNING_FLOW_STEPS).toContain('communicative_practice')
    })

    it('should navigate to next step correctly', () => {
      expect(getNextFlowStep('introduction')).toBe('guided_drill_ar')
      expect(getNextFlowStep('guided_drill_ar')).toBe('guided_drill_er')
      expect(getNextFlowStep('recap')).toBe('practice')
    })

    it('should return null at end of sequence', () => {
      const lastStep = LEARNING_FLOW_STEPS[LEARNING_FLOW_STEPS.length - 1]
      expect(getNextFlowStep(lastStep)).toBe(null)
    })

    it('should return null for unknown steps', () => {
      expect(getNextFlowStep('unknown_step')).toBe(null)
      expect(getNextFlowStep('')).toBe(null)
    })
  })

  describe('Phase Duration Calculation', () => {
    it('should calculate standard phase durations', () => {
      const adaptiveConfig = ADAPTIVE_LEVELS.INTERMEDIATE
      const result = calculatePhaseDurations(10, adaptiveConfig)
      
      expect(result.totalDuration).toBe(600000) // 10 minutes in ms
      expect(result.phases.introduction).toBeDefined()
      expect(result.phases.guided_drills).toBeDefined()
      expect(result.phases.recap).toBeDefined()
      expect(result.phases.practice).toBeDefined()
    })

    it('should apply duration multiplier for beginners', () => {
      const beginnerConfig = ADAPTIVE_LEVELS.BEGINNER
      const result = calculatePhaseDurations(10, beginnerConfig)
      
      expect(result.totalDuration).toBe(720000) // 12 minutes (10 * 1.2)
      expect(result.phases.introduction).toBeGreaterThan(90000) // longer intro
    })

    it('should reduce duration for advanced users', () => {
      const advancedConfig = ADAPTIVE_LEVELS.ADVANCED
      const result = calculatePhaseDurations(10, advancedConfig)
      
      expect(result.totalDuration).toBe(480000) // 8 minutes (10 * 0.8)
      expect(result.phases.introduction).toBeLessThan(72000) // shorter intro
    })

    it('should respect phase weights', () => {
      const customConfig = {
        durationMultiplier: 1.0,
        phaseWeights: {
          introduction: 2.0, // Double weight
          guided_drills: 0.5, // Half weight
          recap: 1.0,
          practice: 1.0,
          meaningful_practice: 1.0,
          communicative_practice: 1.0
        }
      }
      
      const result = calculatePhaseDurations(10, customConfig)
      const standardIntro = 600000 * 0.15 // 15% of 10 minutes
      const weightedIntro = standardIntro * 2.0
      
      expect(result.phases.introduction).toBe(Math.round(weightedIntro))
    })
  })

  describe('Scoring Configuration', () => {
    it('should have proper point values', () => {
      expect(SCORING_CONFIG.REGULAR_VERB_POINTS).toBe(10)
      expect(SCORING_CONFIG.IRREGULAR_VERB_POINTS).toBe(15)
      expect(SCORING_CONFIG.STREAK_ANIMATION_INTERVAL).toBe(5)
    })
  })

  describe('A/B Testing Configuration', () => {
    it('should have learning flow test config', () => {
      const testConfig = AB_TESTING_CONFIG.LEARNING_FLOW_V1
      expect(testConfig.testId).toBe('learning_flow_v1')
      expect(testConfig.variants).toEqual(['control', 'enhanced'])
      expect(testConfig.trafficSplit).toEqual([50, 50])
      expect(testConfig.metrics).toContain('completion_rate')
      expect(testConfig.metrics).toContain('accuracy')
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle undefined adaptive config gracefully', () => {
      const result = calculatePhaseDurations(10, {})
      expect(result.totalDuration).toBe(600000) // Default to 10 minutes
      expect(result.phases).toBeDefined()
    })

    it('should handle zero duration', () => {
      const result = calculatePhaseDurations(0, ADAPTIVE_LEVELS.INTERMEDIATE)
      expect(result.totalDuration).toBe(0)
      expect(result.phases.introduction).toBe(0)
    })

    it('should handle negative duration', () => {
      const result = calculatePhaseDurations(-5, ADAPTIVE_LEVELS.INTERMEDIATE)
      expect(result.totalDuration).toBeLessThan(0)
    })
  })

  describe('Configuration Consistency', () => {
    it('should have consistent phase distribution percentages', () => {
      const total = Object.values(PHASE_DISTRIBUTION).reduce((sum, pct) => sum + pct, 0)
      expect(total).toBeCloseTo(1.0, 2) // Should sum to 100%
    })

    it('should have consistent difficulty thresholds', () => {
      const excellent = DIFFICULTY_PARAMS.EXCELLENT_PERFORMANCE
      const good = DIFFICULTY_PARAMS.GOOD_PERFORMANCE
      const struggling = DIFFICULTY_PARAMS.STRUGGLING_PERFORMANCE
      
      expect(excellent.accuracyThreshold).toBeGreaterThan(good.accuracyThreshold)
      expect(good.accuracyThreshold).toBeGreaterThan(struggling.accuracyThreshold)
      
      expect(excellent.hintsDelay).toBeGreaterThan(good.hintsDelay)
      expect(good.hintsDelay).toBeGreaterThan(struggling.hintsDelay)
    })

    it('should have consistent mastery thresholds', () => {
      const advanced = MASTERY_THRESHOLDS.ADVANCED
      const intermediate = MASTERY_THRESHOLDS.INTERMEDIATE
      
      expect(advanced.avgMasteryMin).toBeGreaterThan(intermediate.avgMasteryMin)
      expect(advanced.masteryPercentageMin).toBeGreaterThan(intermediate.masteryPercentageMin)
    })
  })
})