// User Level Profile System
// Manages personalized CEFR level progression and statistics with dynamic evaluation

import { openDB } from 'idb'
import { getDynamicLevelEvaluator } from './DynamicLevelEvaluator.js'
import { getLevelProgressCalculator } from './LevelProgressCalculator.js'

const LEVEL_ORDER = {
  'A1': 1, 'A2': 2, 'B1': 3, 'B2': 4, 'C1': 5, 'C2': 6
}

const REVERSE_LEVEL_ORDER = {
  1: 'A1', 2: 'A2', 3: 'B1', 4: 'B2', 5: 'C1', 6: 'C2'
}

export const AVAILABLE_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

let db = null

async function getDB() {
  if (!db) {
    db = await openDB('user-level-profile', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('profiles')) {
          db.createObjectStore('profiles', { keyPath: 'userId' })
        }
        if (!db.objectStoreNames.contains('levelHistory')) {
          db.createObjectStore('levelHistory', { keyPath: 'id', autoIncrement: true })
        }
      }
    })
  }
  return db
}

export class UserLevelProfile {
  constructor(userId = 'default') {
    this.userId = userId
    this.currentLevel = 'A2' // Default starting level
    this.levelProgress = 0 // 0-100% (legacy, will be calculated dynamically)
    this.levelHistory = []
    this.competencyStats = {}
    this.lastAssessment = null
    this.lastDynamicEvaluation = null // Cache for dynamic evaluation
    this.lastProgressCalculation = null // Cache for progress calculation
    this.placementTestBaseline = null // Baseline from placement test
    this.manualOverride = false
    this.evaluationEnabled = true // Enable/disable dynamic evaluation
    this.createdAt = new Date().toISOString()
    this.updatedAt = new Date().toISOString()
  }

  static async load(userId = 'default') {
    try {
      const database = await getDB()
      const profile = await database.get('profiles', userId)

      if (profile) {
        const instance = new UserLevelProfile(userId)
        Object.assign(instance, profile)
        return instance
      }
    } catch (error) {
      console.warn('Failed to load user level profile:', error)
    }

    // Return new profile if none exists
    return new UserLevelProfile(userId)
  }

  async save() {
    try {
      this.updatedAt = new Date().toISOString()
      const database = await getDB()
      await database.put('profiles', { ...this })
      return true
    } catch (error) {
      console.error('Failed to save user level profile:', error)
      return false
    }
  }

  getCurrentLevel() {
    return this.currentLevel
  }

  getLevelProgress() {
    // Return cached dynamic progress if available and recent
    if (this.lastProgressCalculation &&
      (Date.now() - this.lastProgressCalculation.timestamp) < 5 * 60 * 1000) {
      return this.lastProgressCalculation.overall
    }

    // Fallback to static progress for immediate response
    return this.levelProgress
  }

  /**
   * Gets dynamic level progress (async)
   */
  async getDynamicLevelProgress() {
    try {
      const calculator = getLevelProgressCalculator()
      const progress = await calculator.calculateLevelProgress(this.userId, this.currentLevel)

      // Cache the result
      this.lastProgressCalculation = progress
      await this.save()

      return progress
    } catch (error) {
      console.warn('Error calculating dynamic progress:', error)
      return {
        level: this.currentLevel,
        userId: this.userId,
        overall: this.levelProgress, // Fallback to static
        components: {
          competencies: { score: 0, details: 'Error loading data' },
          mastery: { score: 0, details: 'Error loading data' },
          coverage: { score: 0, details: 'Error loading data' },
          consistency: { score: 0, details: 'Error loading data' }
        },
        details: {
          totalCompetencies: 0,
          completedCompetencies: 0,
          missingCompetencies: [],
          strongestAreas: [],
          weakestAreas: [],
          nextMilestones: []
        },
        timestamp: Date.now()
      }
    }
  }

  getLevelNumber() {
    return LEVEL_ORDER[this.currentLevel] || 2
  }

  getNextLevel() {
    const currentNum = this.getLevelNumber()
    const nextNum = currentNum + 1
    return REVERSE_LEVEL_ORDER[nextNum] || 'C2'
  }

  getPreviousLevel() {
    const currentNum = this.getLevelNumber()
    const prevNum = currentNum - 1
    return REVERSE_LEVEL_ORDER[prevNum] || 'A1'
  }

  async setLevel(newLevel, reason = 'manual', skipHistory = false) {
    if (!AVAILABLE_LEVELS.includes(newLevel)) {
      throw new Error(`Invalid level: ${newLevel}`)
    }

    const oldLevel = this.currentLevel
    this.currentLevel = newLevel
    this.levelProgress = 0 // Reset progress when changing level
    this.manualOverride = reason === 'manual'

    if (!skipHistory && oldLevel !== newLevel) {
      await this.addToHistory({
        fromLevel: oldLevel,
        toLevel: newLevel,
        reason,
        timestamp: new Date().toISOString(),
        progress: this.levelProgress
      })
    }

    await this.save()

    // Sync to global settings store if not triggered by sync itself
    if (reason !== 'sync') {
      try {
        const { useSettings } = await import('../../state/settings.js')
        useSettings.getState().setUserLevel(newLevel)
      } catch (error) {
        console.warn('Failed to sync level to global settings:', error)
      }
    }

    return true
  }

  async updateProgress(newProgress) {
    this.levelProgress = Math.max(0, Math.min(100, newProgress))

    // Clear cached dynamic calculations when static progress is updated
    this.lastProgressCalculation = null

    await this.save()
  }

  /**
   * Updates progress dynamically based on performance
   */
  async updateDynamicProgress() {
    if (!this.evaluationEnabled) return

    try {
      const dynamicProgress = await this.getDynamicLevelProgress()

      // Update static progress to match dynamic (for compatibility)
      this.levelProgress = Math.round(dynamicProgress.overall)

      await this.save()

      return dynamicProgress
    } catch (error) {
      console.warn('Error updating dynamic progress:', error)
    }
  }

  async addToHistory(entry) {
    try {
      const database = await getDB()
      await database.add('levelHistory', {
        userId: this.userId,
        ...entry
      })

      // Keep only last 50 entries in memory
      this.levelHistory.push(entry)
      if (this.levelHistory.length > 50) {
        this.levelHistory = this.levelHistory.slice(-50)
      }
    } catch (error) {
      console.error('Failed to add level history:', error)
    }
  }

  async getFullHistory() {
    try {
      const database = await getDB()
      const tx = database.transaction('levelHistory', 'readonly')
      const store = tx.objectStore('levelHistory')
      const allEntries = await store.getAll()

      return allEntries
        .filter(entry => entry.userId === this.userId)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    } catch (error) {
      console.error('Failed to get level history:', error)
      return this.levelHistory
    }
  }

  updateCompetencyStats(mood, tense, accuracy, responseTime) {
    const key = `${mood}_${tense}`

    if (!this.competencyStats[key]) {
      this.competencyStats[key] = {
        attempts: 0,
        correct: 0,
        accuracy: 0,
        avgResponseTime: 0,
        lastPracticed: null
      }
    }

    const stats = this.competencyStats[key]
    stats.attempts += 1
    stats.correct += accuracy ? 1 : 0
    stats.accuracy = stats.correct / stats.attempts
    stats.avgResponseTime = (stats.avgResponseTime * (stats.attempts - 1) + responseTime) / stats.attempts
    stats.lastPracticed = new Date().toISOString()

    // Clear cached calculations to trigger refresh
    this.lastDynamicEvaluation = null
    this.lastProgressCalculation = null

    this.save()
  }

  /**
   * Sets placement test baseline for future evaluations
   */
  setPlacementTestBaseline(testResult) {
    // Extract competencies from test results
    const competencies = {}

    if (testResult.results) {
      testResult.results.forEach(result => {
        if (result.competencyInfo) {
          const { mood, tense } = result.competencyInfo
          const key = `${mood}_${tense}`

          if (!competencies[key]) {
            competencies[key] = { correct: 0, total: 0, level: result.level }
          }

          competencies[key].total += 1
          if (result.isCorrect) {
            competencies[key].correct += 1
          }
        }
      })

      // Calculate accuracy
      Object.keys(competencies).forEach(key => {
        competencies[key].accuracy = competencies[key].correct / competencies[key].total
      })
    }

    this.placementTestBaseline = {
      level: testResult.determinedLevel,
      accuracy: testResult.correctAnswers / testResult.totalQuestions,
      competencies: competencies,
      timestamp: Date.now(),
      testId: testResult.testId || 'placement_test'
    }

    // Also update the main competency stats with this baseline data
    Object.entries(competencies).forEach(([key, data]) => {
      const [mood, tense] = key.split('_')
      // We weight placement test results slightly less than drill practice
      // by treating them as a single consolidated "practice session"
      this.updateCompetencyStats(mood, tense, data.accuracy, 0)
    })

    this.save()
  }

  /**
   * Gets placement test baseline
   */
  getPlacementTestBaseline() {
    return this.placementTestBaseline
  }

  /**
   * Enables or disables dynamic evaluation
   */
  setDynamicEvaluationEnabled(enabled) {
    this.evaluationEnabled = enabled

    if (!enabled) {
      // Clear cached evaluations when disabled
      this.lastDynamicEvaluation = null
      this.lastProgressCalculation = null
    }

    this.save()
  }

  /**
   * Forces refresh of dynamic evaluations
   */
  async refreshDynamicEvaluations() {
    this.lastDynamicEvaluation = null
    this.lastProgressCalculation = null

    if (this.evaluationEnabled) {
      // Trigger fresh calculations
      await Promise.all([
        this.getDynamicLevelProgress(),
        this.getDynamicEvaluation()
      ])
    }
  }

  getCompetencyForMoodTense(mood, tense) {
    const key = `${mood}_${tense}`
    return this.competencyStats[key] || null
  }

  getOverallCompetency() {
    const stats = Object.values(this.competencyStats)
    if (stats.length === 0) return 0

    const totalAccuracy = stats.reduce((sum, stat) => sum + stat.accuracy, 0)
    return totalAccuracy / stats.length
  }

  /**
   * Gets effective level based on performance analysis
   */
  async getEffectiveLevel() {
    if (!this.evaluationEnabled) {
      return this.currentLevel
    }

    try {
      // Use cached evaluation if recent
      if (this.lastDynamicEvaluation &&
        (Date.now() - this.lastDynamicEvaluation.timestamp) < 10 * 60 * 1000) {
        return this.lastDynamicEvaluation.effectiveLevel
      }

      const evaluator = getDynamicLevelEvaluator()
      const evaluation = await evaluator.evaluateEffectiveLevel(this.userId, this.currentLevel)

      // Cache the result
      this.lastDynamicEvaluation = evaluation
      await this.save()

      return evaluation.effectiveLevel
    } catch (error) {
      console.warn('Error getting effective level:', error)
      return this.currentLevel
    }
  }

  /**
   * Gets full dynamic evaluation
   */
  async getDynamicEvaluation() {
    if (!this.evaluationEnabled) {
      return null
    }

    try {
      const evaluator = getDynamicLevelEvaluator()
      const evaluation = await evaluator.evaluateEffectiveLevel(this.userId, this.currentLevel)

      // Cache the result
      this.lastDynamicEvaluation = evaluation
      await this.save()

      return evaluation
    } catch (error) {
      console.warn('Error getting dynamic evaluation:', error)
      return null
    }
  }

  isReadyForPromotion() {
    if (this.manualOverride) return false

    // Use cached dynamic progress if available
    const currentProgress = this.lastProgressCalculation?.overall || this.levelProgress
    const overallCompetency = this.getOverallCompetency()

    const progressThreshold = 85 // 85% progress required
    const competencyThreshold = 0.80 // 80% accuracy required

    return currentProgress >= progressThreshold && overallCompetency >= competencyThreshold
  }

  /**
   * Async version that uses dynamic evaluation for promotion readiness
   */
  async isReadyForPromotionDynamic() {
    if (this.manualOverride) return false

    try {
      const [dynamicProgress, dynamicEvaluation] = await Promise.all([
        this.getDynamicLevelProgress(),
        this.getDynamicEvaluation()
      ])

      const progressReady = dynamicProgress.overall >= 85
      const evaluationReady = dynamicEvaluation && dynamicEvaluation.confidence >= 0.80
      const missingCompetencies = dynamicProgress.details.missingCompetencies.length === 0

      return {
        ready: progressReady && evaluationReady && missingCompetencies,
        progress: dynamicProgress.overall,
        confidence: dynamicEvaluation?.confidence || 0,
        missingCompetencies: dynamicProgress.details.missingCompetencies.length,
        recommendations: dynamicEvaluation?.recommendations || []
      }
    } catch (error) {
      console.warn('Error checking dynamic promotion readiness:', error)
      return {
        ready: this.isReadyForPromotion(),
        progress: this.levelProgress,
        confidence: 0.5,
        missingCompetencies: 0,
        recommendations: []
      }
    }
  }

  canAccessLevel(targetLevel) {
    const currentNum = this.getLevelNumber()
    const targetNum = LEVEL_ORDER[targetLevel] || 999

    // Can always access current level and below
    return targetNum <= currentNum
  }

  shouldShowAdvancedWarning(targetLevel) {
    const currentNum = this.getLevelNumber()
    const targetNum = LEVEL_ORDER[targetLevel] || 999

    // Show warning if target is more than 1 level above current
    return targetNum > currentNum + 1
  }

  getLevelDisplayInfo() {
    const dynamicProgress = this.lastProgressCalculation?.overall || this.levelProgress

    return {
      current: this.currentLevel,
      effective: this.lastDynamicEvaluation?.effectiveLevel || this.currentLevel,
      progress: dynamicProgress,
      dynamicAvailable: this.evaluationEnabled && this.lastDynamicEvaluation !== null,
      next: this.getNextLevel(),
      isMaxLevel: this.currentLevel === 'C2',
      readyForPromotion: this.isReadyForPromotion(),
      overallCompetency: Math.round(this.getOverallCompetency() * 100),
      confidence: this.lastDynamicEvaluation?.confidence || 0.5,
      lastEvaluated: this.lastDynamicEvaluation?.timestamp
    }
  }

  /**
   * Gets comprehensive level display info with dynamic data
   */
  async getDynamicLevelDisplayInfo() {
    try {
      const [dynamicProgress, dynamicEvaluation] = await Promise.all([
        this.getDynamicLevelProgress(),
        this.getDynamicEvaluation()
      ])

      const promotionReadiness = await this.isReadyForPromotionDynamic()

      return {
        current: this.currentLevel,
        effective: dynamicEvaluation.effectiveLevel,
        progress: dynamicProgress.overall,
        progressDetails: dynamicProgress,
        evaluation: dynamicEvaluation,
        next: this.getNextLevel(),
        isMaxLevel: this.currentLevel === 'C2',
        readyForPromotion: promotionReadiness,
        overallCompetency: Math.round(this.getOverallCompetency() * 100),
        confidence: dynamicEvaluation.confidence,
        stability: dynamicEvaluation.stability,
        recommendations: dynamicEvaluation.recommendations,
        nextMilestones: dynamicProgress.details.nextMilestones,
        strongestAreas: dynamicProgress.details.strongestAreas,
        weakestAreas: dynamicProgress.details.weakestAreas,
        lastEvaluated: Date.now()
      }
    } catch (error) {
      console.warn('Error getting dynamic level display info:', error)
      return this.getLevelDisplayInfo()
    }
  }

  async reset() {
    this.currentLevel = 'A2'
    this.levelProgress = 0
    this.competencyStats = {}
    this.manualOverride = false

    await this.addToHistory({
      fromLevel: this.currentLevel,
      toLevel: 'A2',
      reason: 'reset',
      timestamp: new Date().toISOString(),
      progress: 0
    })

    await this.save()
  }
}

// Global instance management
let globalProfile = null

export async function getCurrentUserProfile() {
  if (!globalProfile) {
    globalProfile = await UserLevelProfile.load()
  }
  return globalProfile
}

export async function setGlobalUserLevel(newLevel, reason = 'manual') {
  const profile = await getCurrentUserProfile()
  await profile.setLevel(newLevel, reason)
  return profile
}

export async function updateGlobalLevelProgress(progress) {
  const profile = await getCurrentUserProfile()
  await profile.updateProgress(progress)
  return profile
}

export async function recordGlobalCompetency(mood, tense, accuracy, responseTime) {
  const profile = await getCurrentUserProfile()
  profile.updateCompetencyStats(mood, tense, accuracy, responseTime)

  // Trigger dynamic progress update if enabled
  if (profile.evaluationEnabled) {
    // Don't await to avoid blocking the main flow
    profile.updateDynamicProgress().catch(err =>
      console.warn('Error updating dynamic progress after competency record:', err)
    )
  }

  return profile
}

/**
 * Gets user's dynamic level evaluation
 */
export async function getGlobalDynamicEvaluation({ signal } = {}) {
  if (signal?.aborted) {
    throw new Error('Operation was cancelled')
  }
  const profile = await getCurrentUserProfile()
  if (signal?.aborted) {
    throw new Error('Operation was cancelled')
  }
  return await profile.getDynamicEvaluation()
}

/**
 * Gets user's dynamic level progress
 */
export async function getGlobalDynamicProgress({ signal } = {}) {
  if (signal?.aborted) {
    throw new Error('Operation was cancelled')
  }
  const profile = await getCurrentUserProfile()
  if (signal?.aborted) {
    throw new Error('Operation was cancelled')
  }
  return await profile.getDynamicLevelProgress()
}

/**
 * Gets comprehensive level info with dynamic data
 */
export async function getGlobalDynamicLevelInfo({ signal } = {}) {
  if (signal?.aborted) {
    throw new Error('Operation was cancelled')
  }
  const profile = await getCurrentUserProfile()
  if (signal?.aborted) {
    throw new Error('Operation was cancelled')
  }
  return await profile.getDynamicLevelDisplayInfo()
}

/**
 * Sets placement test baseline for the global user
 */
export async function setGlobalPlacementTestBaseline(testResult) {
  const profile = await getCurrentUserProfile()
  profile.setPlacementTestBaseline(testResult)
  return profile
}

/**
 * Checks if user should change level based on performance
 */
export async function checkGlobalLevelRecommendation({ signal } = {}) {
  try {
    const { shouldUserChangeLevel } = await import('./DynamicLevelEvaluator.js')
    if (signal?.aborted) {
      throw new Error('Operation was cancelled')
    }
    const profile = await getCurrentUserProfile()
    if (signal?.aborted) {
      throw new Error('Operation was cancelled')
    }
    return await shouldUserChangeLevel(profile.userId)
  } catch (error) {
    console.warn('Error checking level recommendation:', error)
    return {
      shouldChange: false,
      confidence: 0,
      currentLevel: 'A2',
      recommendedLevel: 'A2',
      reason: 'error',
      evaluation: null
    }
  }
}

/**
 * Forces refresh of all dynamic evaluations
 */
export async function refreshGlobalDynamicEvaluations() {
  const profile = await getCurrentUserProfile()
  await profile.refreshDynamicEvaluations()
  return profile
}

// Utility functions
export function getLevelColor(level) {
  const colors = {
    'A1': 'var(--text-secondary)',
    'A2': 'var(--text-secondary)',
    'B1': 'var(--accent-blue)',
    'B2': 'var(--accent-blue)',
    'C1': 'var(--accent-green)',
    'C2': 'var(--accent-green)'
  }
  return colors[level] || 'var(--text-secondary)'
}

export function getLevelDescription(level) {
  const descriptions = {
    'A1': 'Principiante',
    'A2': 'Básico',
    'B1': 'Intermedio',
    'B2': 'Intermedio Alto',
    'C1': 'Avanzado',
    'C2': 'Dominio'
  }
  return descriptions[level] || 'Desconocido'
}

export function isValidLevel(level) {
  return AVAILABLE_LEVELS.includes(level)
}