/**
 * ProgressAssessor.js
 *
 * Assesses user mastery and readiness for tenses based on progress data.
 * Evaluates prerequisites, learning stage, and exploration readiness.
 *
 * Responsibility: Progress assessment and readiness evaluation
 * Extracted from levelDrivenPrioritizer.js
 */

import { LEVEL_HIERARCHY } from './constants.js'

export class ProgressAssessor {
  constructor(curriculumProcessor) {
    this.curriculum = curriculumProcessor
    this.levelHierarchy = LEVEL_HIERARCHY
  }

  /**
   * Create mastery map from user progress data
   * @param {Array} userProgress - Array of progress records with mood, tense, score
   * @returns {Map} Map of tenseKey -> mastery score
   */
  createMasteryMap(userProgress) {
    const map = new Map()
    if (userProgress && Array.isArray(userProgress)) {
      userProgress.forEach(record => {
        const key = `${record.mood}|${record.tense}`
        map.set(key, record.score || 0)
      })
    }
    return map
  }

  /**
   * Assess readiness for a tense based on prerequisites
   * @param {Object} tense - Tense object with key, mood, tense
   * @param {Map} masteryMap - Map of mastery scores
   * @returns {number} Readiness score 0.0-1.0
   */
  assessReadiness(tense, masteryMap) {
    const prereqChain = this.curriculum.getPrerequisiteChain(tense.key)

    if (prereqChain.length === 0) return 1.0 // No prerequisites, fully ready

    // Calculate average mastery of prerequisites
    let totalMastery = 0
    let validPrereqs = 0

    prereqChain.forEach(prereqKey => {
      const mastery = masteryMap.get(prereqKey)
      if (mastery !== undefined) {
        totalMastery += mastery
        validPrereqs++
      }
    })

    if (validPrereqs === 0) return 0.5 // No data, moderate readiness

    const avgPrereqMastery = totalMastery / validPrereqs
    return Math.min(1.0, avgPrereqMastery / 75) // 75% mastery = full readiness
  }

  /**
   * Assess exploration readiness for advanced tenses
   * @param {Object} tense - Tense object
   * @param {string} userLevel - Current CEFR level
   * @param {Map} masteryMap - Map of mastery scores
   * @returns {number} Exploration readiness score 0.0-1.0
   */
  assessExplorationReadiness(tense, userLevel, masteryMap) {
    // Base readiness from prerequisites
    let readiness = this.assessReadiness(tense, masteryMap)

    // Level gap penalty (exploring too far ahead is risky)
    const levelIndex = this.levelHierarchy.indexOf(userLevel)
    const tenseLevel = this.levelHierarchy.indexOf(tense.introducedAt)
    const levelGap = tenseLevel - levelIndex

    if (levelGap > 1) {
      readiness *= 0.5 // Heavy penalty for jumping levels
    }

    // Complexity readiness (user level vs tense complexity)
    const levelComplexityMax = {
      'A1': 3, 'A2': 4, 'B1': 7, 'B2': 8, 'C1': 9, 'C2': 9
    }

    const maxComplexity = levelComplexityMax[userLevel] || 5
    if (tense.complexity > maxComplexity + 1) {
      readiness *= 0.7 // Penalty for excessive complexity
    }

    return Math.min(1.0, readiness)
  }

  /**
   * Determine learning stage for a user at a given level
   * @param {string} userLevel - Current CEFR level
   * @param {Map} masteryMap - Map of mastery scores
   * @returns {Object} Learning stage information
   */
  determineLearningStage(userLevel, masteryMap) {
    const levelTenses = this.curriculum.getLevelProgression(userLevel)
    const masteries = levelTenses.map(t => masteryMap.get(t.key) || 0)

    const avgMastery = masteries.length > 0 ?
      masteries.reduce((sum, m) => sum + m, 0) / masteries.length : 0

    const mastered = masteries.filter(m => m >= 75).length
    const total = masteries.length

    let stage = 'beginner'
    if (avgMastery >= 75) stage = 'mastered'
    else if (avgMastery >= 60) stage = 'consolidating'
    else if (avgMastery >= 40) stage = 'developing'
    else if (avgMastery >= 20) stage = 'learning'
    else stage = 'beginner'

    return {
      stage,
      avgMastery: Math.round(avgMastery),
      masteredCount: mastered,
      totalCount: total,
      completionPercent: Math.round((mastered / total) * 100),
      recommendation: this.getStageRecommendation(stage, userLevel)
    }
  }

  /**
   * Get recommendation based on learning stage
   * @param {string} stage - Learning stage
   * @param {string} userLevel - CEFR level
   * @returns {string} Recommendation text
   */
  getStageRecommendation(stage, userLevel) {
    const recommendations = {
      'beginner': `Start with core ${userLevel} tenses. Focus on building foundations.`,
      'learning': `Continue practicing ${userLevel} tenses. Mix in some review.`,
      'developing': `Good progress! Balance new ${userLevel} content with review.`,
      'consolidating': `Nearly there! Focus on weak spots and start exploring next level.`,
      'mastered': `Excellent! Ready to advance or maintain through review.`
    }
    return recommendations[stage] || recommendations.beginner
  }

  /**
   * Get prerequisite gaps - tenses that are prerequisites but not yet mastered
   * @param {string} userLevel - Current CEFR level
   * @param {Array} userProgress - User progress data
   * @returns {Array} Array of gap objects sorted by priority
   */
  getPrerequisiteGaps(userLevel, userProgress = null) {
    const masteryMap = this.createMasteryMap(userProgress)
    const levelTenses = this.curriculum.getLevelProgression(userLevel)
    const gaps = new Set()

    // Find all prerequisites for current level tenses
    levelTenses.forEach(tense => {
      const prereqChain = this.curriculum.getPrerequisiteChain(tense.key)
      prereqChain.forEach(prereqKey => {
        const mastery = masteryMap.get(prereqKey) || 0
        if (mastery < 70) { // Not mastered
          const [mood, tenseName] = prereqKey.split('|')
          gaps.add(JSON.stringify({
            key: prereqKey,
            mood,
            tense: tenseName,
            mastery,
            urgency: 100 - mastery, // Lower mastery = higher urgency
            requiredFor: tense.key,
            priority: 90 + (70 - mastery) // High base priority + mastery gap
          }))
        }
      })
    })

    return Array.from(gaps)
      .map(gapStr => JSON.parse(gapStr))
      .sort((a, b) => b.priority - a.priority)
  }

  /**
   * Get tense family groups with completion analysis
   * @param {string} userLevel - Current CEFR level
   * @param {Array} userProgress - User progress data
   * @returns {Object} Family groups with statistics
   */
  getTenseFamilyGroups(userLevel, userProgress = null) {
    const masteryMap = this.createMasteryMap(userProgress)
    const levelTenses = this.curriculum.getLevelProgression(userLevel)
    const groups = {}

    // Group tenses by family for current level
    levelTenses.forEach(tense => {
      const family = tense.family
      if (!groups[family]) {
        groups[family] = {
          name: family,
          tenses: [],
          avgMastery: 0,
          completionStatus: 'not_started',
          priority: 0,
          readiness: 0
        }
      }
      groups[family].tenses.push({
        ...tense,
        mastery: masteryMap.get(tense.key) || 0
      })
    })

    // Calculate group statistics
    Object.values(groups).forEach(group => {
      const masteries = group.tenses.map(t => t.mastery)
      group.avgMastery = masteries.length > 0 ?
        masteries.reduce((sum, m) => sum + m, 0) / masteries.length : 0

      const mastered = masteries.filter(m => m >= 75).length
      const total = masteries.length

      if (mastered === total) group.completionStatus = 'completed'
      else if (mastered > 0) group.completionStatus = 'in_progress'
      else if (group.avgMastery > 30) group.completionStatus = 'started'
      else group.completionStatus = 'not_started'

      // Priority based on partial completion (prioritize completing started families)
      if (group.completionStatus === 'in_progress') {
        group.priority = 80 + group.avgMastery * 0.2
      } else if (group.completionStatus === 'started') {
        group.priority = 70 + group.avgMastery * 0.3
      } else {
        group.priority = 60
      }

      // Readiness based on prerequisites of family tenses
      const readinesses = group.tenses.map(t => this.assessReadiness(t, masteryMap))
      group.readiness = readinesses.reduce((sum, r) => sum + r, 0) / readinesses.length
    })

    return groups
  }

  /**
   * Get optimal progression path for the user's current level
   * @param {string} userLevel - Current CEFR level
   * @param {Array} userProgress - User progress data
   * @returns {Array} Ordered list of tenses ready to learn
   */
  getProgressionPath(userLevel, userProgress = null) {
    const masteryMap = this.createMasteryMap(userProgress)
    const levelProgression = this.curriculum.getLevelProgression(userLevel)

    // Filter to tenses that are ready to learn (prerequisites met)
    const readyTenses = levelProgression.filter(tense => {
      const readiness = this.assessReadiness(tense, masteryMap)
      const mastery = masteryMap.get(tense.key) || 0
      return readiness >= 0.7 && mastery < 80 // Ready and not mastered
    })

    // Sort by optimal learning order
    return readyTenses
      .map(tense => ({
        ...tense,
        mastery: masteryMap.get(tense.key) || 0,
        readiness: this.assessReadiness(tense, masteryMap),
        priority: this.calculateLearningPriority(tense, masteryMap)
      }))
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 10) // Top 10 next steps
  }

  /**
   * Calculate learning priority for a tense
   * @param {Object} tense - Tense object
   * @param {Map} masteryMap - Map of mastery scores
   * @returns {number} Priority score
   */
  calculateLearningPriority(tense, masteryMap) {
    let priority = 50

    // Readiness bonus
    const readiness = this.assessReadiness(tense, masteryMap)
    priority += readiness * 30

    // Core tenses get higher priority
    if (tense.isCore) {
      priority += 20
    }

    // Lower complexity first (within level)
    priority += (10 - tense.complexity) * 2

    // Current mastery (prioritize partially learned)
    const mastery = masteryMap.get(tense.key) || 0
    if (mastery > 20 && mastery < 70) {
      priority += 15 // Finish what's started
    }

    return Math.round(priority)
  }
}
