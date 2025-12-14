/**
 * PriorityCalculator.js
 *
 * Calculates priorities and weights for tenses based on curriculum analysis,
 * user progress, and pedagogical principles.
 *
 * Responsibility: Priority and weight calculations
 * Extracted from levelDrivenPrioritizer.js
 */

import { LEVEL_HIERARCHY } from './constants.js'

export class PriorityCalculator {
  constructor(curriculumProcessor, progressAssessor) {
    this.curriculum = curriculumProcessor
    this.assessor = progressAssessor
    this.levelHierarchy = LEVEL_HIERARCHY
  }

  /**
   * Calculate advanced priority using comprehensive curriculum analysis
   * @param {Object} tense - Tense object
   * @param {string} userLevel - Current CEFR level
   * @param {Map} masteryMap - Map of mastery scores
   * @returns {number} Priority score
   */
  calculateAdvancedPriority(tense, userLevel, masteryMap) {
    let priority = 50

    // 1. Curriculum-based complexity weighting
    const complexityBonus = tense.complexity * 5

    // 2. Introduction level appropriateness
    let levelAppropriateBonus = 0
    const userLevelIndex = this.levelHierarchy.indexOf(userLevel)
    const tenseLevelIndex = this.levelHierarchy.indexOf(tense.introducedAt)

    if (tenseLevelIndex !== -1 && userLevelIndex !== -1) {
      if (tenseLevelIndex === userLevelIndex) {
        // Current level tense gets high priority
        levelAppropriateBonus = 30
      } else if (tenseLevelIndex < userLevelIndex) {
        // Previous level tense (for review) gets moderate priority
        levelAppropriateBonus = 15
      } else {
        // Future level tense gets low priority
        levelAppropriateBonus = 5
      }
    } else {
      // If level is not defined, use default
      levelAppropriateBonus = tense.introducedAt === userLevel ? 30 : 10
    }

    // 3. Pedagogical family importance
    const familyBonuses = {
      'subjunctive_present': 25, // Critical for B1
      'perfect_system': 20,      // Important for B1
      'past_narrative': 15,      // Important for A2
      'subjunctive_past': 30,    // Critical for B2
      'conditional_system': 15
    }
    const familyBonus = familyBonuses[tense.family] || 0
    const effectiveFamilyBonus = (
      tenseLevelIndex !== -1 &&
      userLevelIndex !== -1 &&
      tenseLevelIndex > userLevelIndex
    )
      ? 0
      : familyBonus

    // 4. Prerequisite chain length (more dependencies = higher priority)
    const prereqChain = this.curriculum.getPrerequisiteChain(tense.key) || []
    const prereqBonus = prereqChain.length * 3

    // 5. Current mastery adjustment
    const currentMastery = masteryMap.get(tense.key) || 0
    const masteryAdjustment = Math.max(0, 100 - currentMastery) * 0.2

    priority = complexityBonus + levelAppropriateBonus + effectiveFamilyBonus + prereqBonus + masteryAdjustment

    return Math.round(priority)
  }

  /**
   * Calculate urgency based on curriculum position and user level
   * @param {Object} tense - Tense object
   * @param {string} userLevel - Current CEFR level
   * @param {Map} masteryMap - Map of mastery scores
   * @returns {number} Urgency score (0-100)
   */
  calculateUrgency(tense, userLevel, masteryMap) {
    let urgency = 50

    // 1. Level-critical tenses get higher urgency
    const levelCritical = {
      'B1': ['subjunctive|subjPres', 'indicative|pretPerf'],
      'B2': ['subjunctive|subjImpf'],
      'A2': ['indicative|pretIndef', 'indicative|impf']
    }

    const criticalTenses = levelCritical[userLevel] || []
    if (criticalTenses.includes(tense.key)) {
      urgency += 30
    }

    // 2. Family completion urgency (complete families faster)
    const familyTenses = this.curriculum.curriculumData.tenseFamilies[tense.family] || []
    const familyMastery = familyTenses.map(ft => masteryMap.get(ft.key) || 0)
    const avgFamilyMastery = familyMastery.length > 0 ?
      familyMastery.reduce((sum, m) => sum + m, 0) / familyMastery.length : 0

    if (avgFamilyMastery > 40 && avgFamilyMastery < 80) {
      urgency += 15 // Push to complete partially learned families
    }

    // 3. Current mastery level urgency
    const currentMastery = masteryMap.get(tense.key) || 0
    if (currentMastery > 30 && currentMastery < 70) {
      urgency += 10 // Prioritize partially learned tenses
    }

    return Math.min(100, urgency)
  }

  /**
   * Calculate pedagogical value based on curriculum analysis
   * @param {Object} tense - Tense object
   * @param {string} userLevel - Current CEFR level
   * @returns {number} Pedagogical value score
   */
  calculatePedagogicalValue(tense, userLevel) {
    let value = 50

    // 1. Complexity appropriateness for level
    const levelComplexityRanges = {
      'A1': [1, 3], 'A2': [2, 4], 'B1': [4, 7],
      'B2': [6, 8], 'C1': [7, 9], 'C2': [8, 9]
    }

    const [minComp, maxComp] = levelComplexityRanges[userLevel] || [1, 9]
    const complexityFit = tense.complexity >= minComp && tense.complexity <= maxComp
    if (complexityFit) value += 20

    // 2. Foundation value (some tenses are particularly foundational)
    const foundationalTenses = {
      'indicative|pres': 30,
      'subjunctive|subjPres': 25,
      'indicative|pretIndef': 20,
      'indicative|pretPerf': 20
    }
    value += foundationalTenses[tense.key] || 0

    // 3. Family completeness value
    const familySizes = {
      'perfect_system': 15,        // Large family
      'subjunctive_present': 12,   // Important family
      'subjunctive_past': 15,      // Complex family
      'conditional_system': 10     // Moderate family
    }
    value += familySizes[tense.family] || 5

    return value
  }

  /**
   * Calculate learning priority for core tenses
   * @param {Object} tense - Tense object
   * @param {string} userLevel - Current CEFR level
   * @param {Map} masteryMap - Map of mastery scores
   * @returns {number} Learning priority score
   */
  calculateLearningPriority(tense, userLevel, masteryMap) {
    let priority = this.calculateAdvancedPriority(tense, userLevel, masteryMap)

    // Readiness bonus
    const readiness = this.assessor.assessReadiness(tense, masteryMap)
    priority += readiness * 20

    // Urgency bonus
    const urgency = this.calculateUrgency(tense, userLevel, masteryMap)
    priority += urgency * 0.3

    // Pedagogical value
    const value = this.calculatePedagogicalValue(tense, userLevel)
    priority += value * 0.2

    return Math.round(priority)
  }

  /**
   * Calculate review priority with curriculum intelligence
   * @param {Object} tense - Tense object
   * @param {string} userLevel - Current CEFR level
   * @param {number} mastery - Current mastery score
   * @returns {number} Review priority score
   */
  calculateReviewPriority(tense, userLevel, mastery) {
    let priority = 30 // Base review priority

    // Higher priority for prerequisites
    if (this.isPrerequisiteForLevel(tense.key, userLevel)) {
      priority += 40
    }

    // Priority based on mastery gap
    const masteryGap = Math.max(0, 75 - mastery)
    priority += masteryGap * 0.3

    // Family consolidation priority
    const familySizes = {
      'perfect_system': 10,
      'subjunctive_present': 15,
      'past_narrative': 12
    }
    priority += familySizes[tense.family] || 0

    return Math.round(priority)
  }

  /**
   * Calculate exploration priority
   * @param {Object} tense - Tense object
   * @param {number} readiness - Readiness score
   * @returns {number} Exploration priority score
   */
  calculateExplorationPriority(tense, readiness) {
    let priority = 20 // Base exploration priority

    // Readiness bonus
    priority += readiness * 30

    // Complexity adjustment (moderate complexity preferred for exploration)
    if (tense.complexity >= 5 && tense.complexity <= 7) {
      priority += 10 // Sweet spot for exploration
    }

    return Math.round(priority)
  }

  /**
   * Calculate dynamic weights based on user progress and level
   * @param {string} userLevel - Current CEFR level
   * @param {Array} userProgress - User progress data
   * @returns {Object} Dynamic weight adjustments
   */
  calculateDynamicWeights(userLevel, userProgress = null) {
    const masteryMap = this.assessor.createMasteryMap(userProgress)
    const levelTenses = this.curriculum.getLevelProgression(userLevel)
    const masteries = levelTenses
      .map(t => (masteryMap.has(t.key) ? masteryMap.get(t.key) : null))
      .filter(mastery => mastery !== null)

    const avgMastery = masteries.length > 0 ?
      masteries.reduce((sum, m) => sum + m, 0) / masteries.length : 0

    // Adjust weights based on overall level mastery
    if (avgMastery < 30) {
      // Beginner: focus heavily on core
      return {
        core: 0.80,
        review: 0.15,
        exploration: 0.05
      }
    } else if (avgMastery < 60) {
      // Learning: balanced approach
      return {
        core: 0.60,
        review: 0.30,
        exploration: 0.10
      }
    } else if (avgMastery >= 75) {
      // Mastered: focus on variety and exploration
      return {
        core: 0.30,
        review: 0.40,
        exploration: 0.30
      }
    } else {
      // Between 60-75: slight exploration focus
      return {
        core: 0.50,
        review: 0.35,
        exploration: 0.15
      }
    }
  }

  /**
   * Apply advanced progress adjustments to tenses
   * @param {Array} tenses - Array of tense objects
   * @param {Array} userProgress - User progress data
   * @returns {Array} Adjusted tenses with updated priorities
   */
  applyAdvancedProgressAdjustments(tenses, userProgress = null) {
    if (!userProgress || userProgress.length === 0) return tenses

    const masteryMap = this.assessor.createMasteryMap(userProgress)

    return tenses.map(tense => {
      const mastery = masteryMap.get(tense.key) || 0
      let adjustedPriority = tense.priority || 50

      // Boost priority for partially learned tenses
      if (mastery > 20 && mastery < 70) {
        adjustedPriority += 15
      }

      // Reduce priority for nearly mastered tenses
      if (mastery >= 75) {
        adjustedPriority *= 0.5
      }

      // Boost priority for prerequisite gaps
      const readiness = this.assessor.assessReadiness(tense, masteryMap)
      if (readiness < 0.5) {
        adjustedPriority *= 0.7 // Not ready yet
      }

      return {
        ...tense,
        mastery,
        readiness,
        priority: Math.round(adjustedPriority)
      }
    })
  }

  /**
   * Check if a tense is prerequisite for current level
   * @param {string} tenseKey - Tense key
   * @param {string} userLevel - Current CEFR level
   * @returns {boolean} True if tense is a prerequisite
   */
  isPrerequisiteForLevel(tenseKey, userLevel) {
    // Get tenses that are introduced at the current level
    const levelTenses = this.curriculum.getLevelProgression(userLevel)

    // Check if the requested tense is a prerequisite for any tense at this level
    for (const levelTense of levelTenses) {
      // Check the full prerequisite chain
      const prereqChain = this.curriculum.getPrerequisiteChain(levelTense.key)
      if (prereqChain && prereqChain.includes(tenseKey)) {
        return true
      }
    }

    return false
  }

  /**
   * Compare family priority for sorting
   * @param {Object} a - First tense
   * @param {Object} b - Second tense
   * @returns {number} Comparison result
   */
  compareFamilyPriority(a, b) {
    const familyOrder = [
      'basic_present',
      'nonfinite_basics',
      'past_narrative',
      'perfect_system',
      'subjunctive_present',
      'conditional_system',
      'command_forms',
      'subjunctive_past'
    ]

    const aFamilyIndex = familyOrder.indexOf(a.family || 'other')
    const bFamilyIndex = familyOrder.indexOf(b.family || 'other')

    if (aFamilyIndex !== -1 && bFamilyIndex !== -1 && aFamilyIndex !== bFamilyIndex) {
      return aFamilyIndex - bFamilyIndex
    }

    // If same family or not in list, sort by priority
    return (b.priority || 0) - (a.priority || 0)
  }
}
