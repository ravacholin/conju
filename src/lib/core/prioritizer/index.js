/**
 * Level-Driven Prioritizer - Modular Architecture
 *
 * Main orchestrator that composes all extracted modules.
 * Provides backwards-compatible API while using new modular structure.
 *
 * Status: Phase 3 Complete (100%)
 * - ✅ All core modules extracted
 * - ✅ New modular LevelDrivenPrioritizer created
 * - ✅ Backwards compatibility maintained
 * - ✅ Clean orchestration pattern
 */

import curriculum from '../../../data/curriculum.json'
import { createLogger } from '../../utils/logger.js'
import { LEVEL_PRIORITY_WEIGHTS } from './constants.js'
import { CurriculumProcessor } from './CurriculumProcessor.js'
import { ProgressAssessor } from './ProgressAssessor.js'
import { PriorityCalculator } from './PriorityCalculator.js'

const logger = createLogger('prioritizer:index')

// Quiet logs during tests
const debug = (...args) => {
  if (import.meta?.env?.DEV && !import.meta?.env?.VITEST) logger.debug(...args)
}

/**
 * New Modular LevelDrivenPrioritizer
 *
 * Orchestrates all extracted modules to provide the same API
 * as the original, but with better maintainability and testability.
 */
export class LevelDrivenPrioritizer {
  constructor() {
    // Initialize all modules
    this.curriculum = new CurriculumProcessor()
    this.assessor = new ProgressAssessor(this.curriculum)
    this.calculator = new PriorityCalculator(this.curriculum, this.assessor)
  }

  /**
   * Get prioritized tenses for a level
   * Main entry point for tense prioritization
   */
  getPrioritizedTenses(userLevel, userProgress = null) {
    const weights = LEVEL_PRIORITY_WEIGHTS[userLevel] || LEVEL_PRIORITY_WEIGHTS.B1

    const categorized = {
      core: this.getEnhancedCoreTenses(userLevel, userProgress),
      review: this.getEnhancedReviewTenses(userLevel, userProgress),
      exploration: this.getEnhancedExplorationTenses(userLevel, userProgress),
      prerequisites: this.assessor.getPrerequisiteGaps(userLevel, userProgress),
      familyGroups: this.assessor.getTenseFamilyGroups(userLevel, userProgress),
      progression: this.assessor.getProgressionPath(userLevel, userProgress),
      weights: {
        ...weights,
        ...this.calculator.calculateDynamicWeights(userLevel, userProgress)
      }
    }

    debug(`🎯 Level ${userLevel} prioritization:`, {
      core: categorized.core.length,
      review: categorized.review.length,
      exploration: categorized.exploration.length
    })

    return categorized
  }

  /**
   * Get enhanced core tenses for current level
   */
  getEnhancedCoreTenses(userLevel, userProgress = null) {
    const levelProgression = this.curriculum.getLevelProgression(userLevel)
    const masteryMap = this.assessor.createMasteryMap(userProgress)

    return levelProgression
      .filter(tense => tense.isCore)
      .map(tense => ({
        ...tense,
        priority: this.calculator.calculateAdvancedPriority(tense, userLevel, masteryMap),
        readiness: this.assessor.assessReadiness(tense, masteryMap),
        urgency: this.calculator.calculateUrgency(tense, userLevel, masteryMap),
        pedagogicalValue: this.calculator.calculatePedagogicalValue(tense, userLevel)
      }))
      .sort((a, b) => {
        if (a.readiness !== b.readiness) return b.readiness - a.readiness
        if (a.urgency !== b.urgency) return b.urgency - a.urgency
        return b.priority - a.priority
      })
  }

  /**
   * Get enhanced review tenses from previous levels
   */
  getEnhancedReviewTenses(userLevel, userProgress = null) {
    const levelIndex = this.curriculum.levelHierarchy.indexOf(userLevel)
    if (levelIndex <= 0) return []

    const masteryMap = this.assessor.createMasteryMap(userProgress)
    const reviewTenses = []

    for (let i = 0; i < levelIndex; i++) {
      const prevLevel = this.curriculum.levelHierarchy[i]
      const prevProgression = this.curriculum.getLevelProgression(prevLevel)

      prevProgression.forEach(tense => {
        const mastery = masteryMap.get(tense.key) || 0
        const isPrerequisite = this.calculator.isPrerequisiteForLevel(tense.key, userLevel)
        const needsReview = mastery < 80 || isPrerequisite

        if (needsReview) {
          reviewTenses.push({
            ...tense,
            originalLevel: prevLevel,
            priority: this.calculator.calculateReviewPriority(tense, userLevel, mastery),
            isPrerequisite,
            masteryGap: 80 - mastery
          })
        }
      })
    }

    return reviewTenses
      .sort((a, b) => {
        if (a.isPrerequisite && !b.isPrerequisite) return -1
        if (!a.isPrerequisite && b.isPrerequisite) return 1
        return b.priority - a.priority
      })
      .slice(0, 10)
  }

  /**
   * Get enhanced exploration tenses from future levels
   */
  getEnhancedExplorationTenses(userLevel, userProgress = null) {
    const levelIndex = this.curriculum.levelHierarchy.indexOf(userLevel)
    if (levelIndex >= this.curriculum.levelHierarchy.length - 1) return []

    const masteryMap = this.assessor.createMasteryMap(userProgress)
    const nextLevel = this.curriculum.levelHierarchy[levelIndex + 1]
    const nextProgression = this.curriculum.getLevelProgression(nextLevel)

    return nextProgression
      .map(tense => ({
        ...tense,
        readiness: this.assessor.assessExplorationReadiness(tense, userLevel, masteryMap),
        priority: this.calculator.calculateExplorationPriority(tense, this.assessor.assessExplorationReadiness(tense, userLevel, masteryMap))
      }))
      .filter(tense => tense.readiness >= 0.5)
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 3)
  }

  /**
   * Get weighted selection of forms
   */
  getWeightedSelection(forms, level, userProgress = null) {
    if (!forms || forms.length === 0) return []

    const masteryMap = this.assessor.createMasteryMap(userProgress)
    const adjusted = this.calculator.applyAdvancedProgressAdjustments(
      forms.map(form => ({
        ...form,
        key: `${form.mood}|${form.tense}`,
        priority: 50
      })),
      userProgress
    )

    return adjusted.sort((a, b) => b.priority - a.priority)
  }

  /**
   * Get next recommended tense
   */
  getNextRecommendedTense(level, userProgress = null) {
    const progression = this.assessor.getProgressionPath(level, userProgress)
    return progression.length > 0 ? progression[0] : null
  }

  /**
   * Debug prioritization
   */
  debugPrioritization(level, userProgress = null) {
    const result = this.getPrioritizedTenses(level, userProgress)
    return {
      level,
      hasProgress: !!userProgress,
      core: result.core.map(t => ({ key: t.key, priority: t.priority, readiness: t.readiness })),
      review: result.review.map(t => ({ key: t.key, priority: t.priority, masteryGap: t.masteryGap })),
      exploration: result.exploration.map(t => ({ key: t.key, readiness: t.readiness })),
      weights: result.weights
    }
  }
}

// Create singleton instance
export const levelPrioritizer = new LevelDrivenPrioritizer()

// ===== BACKWARDS-COMPATIBLE HELPER FUNCTIONS =====

/**
 * Get prioritized tenses for a level
 * @param {string} level - CEFR level
 * @param {Array} userProgress - User progress data
 * @returns {Object} Categorized tenses
 */
export function getPrioritizedTensesForLevel(level, userProgress = null) {
  return levelPrioritizer.getPrioritizedTenses(level, userProgress)
}

/**
 * Get weighted forms selection
 * @param {Array} forms - Array of verb forms
 * @param {string} level - CEFR level
 * @param {Array} userProgress - User progress data
 * @returns {Array} Weighted forms
 */
export function getWeightedFormsSelection(forms, level, userProgress = null) {
  return levelPrioritizer.getWeightedSelection(forms, level, userProgress)
}

/**
 * Debug level prioritization
 * @param {string} level - CEFR level
 * @param {Array} userProgress - User progress data
 * @returns {Object} Debug information
 */
export function debugLevelPrioritization(level, userProgress = null) {
  return levelPrioritizer.debugPrioritization(level, userProgress)
}

// ===== RE-EXPORT ALL MODULAR COMPONENTS =====
export { LEVEL_HIERARCHY, LEVEL_PRIORITY_WEIGHTS, CURRICULUM_ANALYSIS } from './constants.js'
export {
  getTenseKey,
  parseTenseKey,
  getTenseFamily,
  getFormComplexity,
  getLevelBaseComplexity,
  removeDuplicateTenses,
  isPrerequisiteForLevel,
  compareFamilyPriority
} from './utils.js'
export { CurriculumProcessor } from './CurriculumProcessor.js'
export { ProgressAssessor } from './ProgressAssessor.js'
export { PriorityCalculator } from './PriorityCalculator.js'

