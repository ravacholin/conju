// Level Progression System
// Manages automatic level advancement and progression logic

import { getCurrentUserProfile, AVAILABLE_LEVELS } from './userLevelProfile.js'

// Level requirements based on curriculum.json structure
export const LEVEL_REQUIREMENTS = {
  'A1': {
    name: 'Principiante',
    description: 'Presente indicativo y verbos básicos',
    requiredCompetencies: [
      { mood: 'indicative', tense: 'pres', minAccuracy: 0.80, minAttempts: 30 }
    ],
    requiredVerbs: ['ser', 'estar', 'tener', 'hacer', 'ir', 'ver', 'dar'],
    overallAccuracy: 0.75,
    minTotalAttempts: 50
  },
  'A2': {
    name: 'Básico',
    description: 'Pasados básicos e imperativos',
    requiredCompetencies: [
      { mood: 'indicative', tense: 'pres', minAccuracy: 0.85, minAttempts: 40 },
      { mood: 'indicative', tense: 'pretIndef', minAccuracy: 0.80, minAttempts: 30 },
      { mood: 'indicative', tense: 'impf', minAccuracy: 0.80, minAttempts: 30 },
      { mood: 'imperative', tense: 'impAff', minAccuracy: 0.75, minAttempts: 20 }
    ],
    requiredVerbs: ['pensar', 'cerrar', 'empezar', 'volver', 'contar', 'dormir', 'conocer'],
    overallAccuracy: 0.80,
    minTotalAttempts: 100
  },
  'B1': {
    name: 'Intermedio',
    description: 'Subjuntivo presente y tiempos compuestos',
    requiredCompetencies: [
      { mood: 'indicative', tense: 'pretPerf', minAccuracy: 0.80, minAttempts: 25 },
      { mood: 'indicative', tense: 'plusc', minAccuracy: 0.75, minAttempts: 20 },
      { mood: 'subjunctive', tense: 'subjPres', minAccuracy: 0.75, minAttempts: 30 },
      { mood: 'conditional', tense: 'cond', minAccuracy: 0.75, minAttempts: 25 },
      { mood: 'imperative', tense: 'impNeg', minAccuracy: 0.70, minAttempts: 15 }
    ],
    requiredVerbs: ['pedir', 'servir', 'repetir', 'parecer', 'crecer', 'ofrecer'],
    overallAccuracy: 0.80,
    minTotalAttempts: 150
  },
  'B2': {
    name: 'Intermedio Alto',
    description: 'Subjuntivos complejos y condicionales',
    requiredCompetencies: [
      { mood: 'subjunctive', tense: 'subjImpf', minAccuracy: 0.75, minAttempts: 25 },
      { mood: 'subjunctive', tense: 'subjPlusc', minAccuracy: 0.70, minAttempts: 20 },
      { mood: 'conditional', tense: 'condPerf', minAccuracy: 0.75, minAttempts: 20 },
      { mood: 'indicative', tense: 'futPerf', minAccuracy: 0.80, minAttempts: 15 }
    ],
    requiredVerbs: ['vencer', 'proteger', 'elegir', 'dirigir', 'corregir'],
    overallAccuracy: 0.82,
    minTotalAttempts: 200
  },
  'C1': {
    name: 'Avanzado',
    description: 'Formas raras y construcciones complejas',
    requiredCompetencies: [
      { mood: 'subjunctive', tense: 'subjFut', minAccuracy: 0.70, minAttempts: 15 },
      { mood: 'subjunctive', tense: 'subjPerf', minAccuracy: 0.80, minAttempts: 20 }
    ],
    requiredVerbs: ['distinguir', 'conseguir', 'perseguir', 'construir', 'incluir'],
    overallAccuracy: 0.85,
    minTotalAttempts: 250
  },
  'C2': {
    name: 'Dominio',
    description: 'Maestría completa del español',
    requiredCompetencies: [],
    requiredVerbs: ['yacer', 'asir', 'balbucir', 'concernir'],
    overallAccuracy: 0.90,
    minTotalAttempts: 300
  }
}

export class LevelProgressionEngine {
  constructor() {
    this.notifications = []
  }

  async evaluateProgressionEligibility() {
    const profile = await getCurrentUserProfile()
    const currentLevel = profile.getCurrentLevel()
    const nextLevel = profile.getNextLevel()

    if (currentLevel === 'C2') {
      return {
        eligible: false,
        reason: 'max_level_reached',
        currentLevel,
        nextLevel: null
      }
    }

    const requirements = LEVEL_REQUIREMENTS[nextLevel]
    if (!requirements) {
      return {
        eligible: false,
        reason: 'invalid_next_level',
        currentLevel,
        nextLevel
      }
    }

    const evaluation = await this.evaluateRequirements(profile, requirements)

    return {
      eligible: evaluation.meetsRequirements,
      reason: evaluation.meetsRequirements ? 'requirements_met' : 'requirements_not_met',
      currentLevel,
      nextLevel,
      evaluation,
      requirements,
      confidence: this.calculateConfidence(evaluation)
    }
  }

  async evaluateRequirements(profile, requirements) {
    const stats = profile.competencyStats
    const competencyResults = []
    let totalAttempts = 0
    let totalCorrect = 0

    // Check competency requirements
    for (const req of requirements.requiredCompetencies) {
      const key = `${req.mood}_${req.tense}`
      const stat = stats[key]

      totalAttempts += stat?.attempts || 0
      totalCorrect += stat?.correct || 0

      const result = {
        mood: req.mood,
        tense: req.tense,
        required: req,
        actual: stat || { attempts: 0, accuracy: 0 },
        meets: stat && stat.attempts >= req.minAttempts && stat.accuracy >= req.minAccuracy
      }

      competencyResults.push(result)
    }

    const overallAccuracy = totalAttempts > 0 ? totalCorrect / totalAttempts : 0
    const meetsOverallAccuracy = overallAccuracy >= requirements.overallAccuracy
    const meetsMinAttempts = totalAttempts >= requirements.minTotalAttempts
    const meetsAllCompetencies = competencyResults.every(r => r.meets)

    return {
      competencyResults,
      totalAttempts,
      overallAccuracy,
      meetsOverallAccuracy,
      meetsMinAttempts,
      meetsAllCompetencies,
      meetsRequirements: meetsOverallAccuracy && meetsMinAttempts && meetsAllCompetencies,
      missingRequirements: this.identifyMissingRequirements(competencyResults, requirements, {
        meetsOverallAccuracy,
        meetsMinAttempts
      })
    }
  }

  identifyMissingRequirements(competencyResults, requirements, overallCheck) {
    const missing = []

    if (!overallCheck.meetsOverallAccuracy) {
      missing.push({
        type: 'overall_accuracy',
        message: `Necesitas ${(requirements.overallAccuracy * 100).toFixed(0)}% de precisión general`
      })
    }

    if (!overallCheck.meetsMinAttempts) {
      missing.push({
        type: 'min_attempts',
        message: `Necesitas al menos ${requirements.minTotalAttempts} intentos totales`
      })
    }

    competencyResults.filter(r => !r.meets).forEach(result => {
      const accuracy = (result.required.minAccuracy * 100).toFixed(0)
      missing.push({
        type: 'competency',
        mood: result.mood,
        tense: result.tense,
        message: `${result.mood} ${result.tense}: ${accuracy}% precisión, ${result.required.minAttempts} intentos mínimos`
      })
    })

    return missing
  }

  calculateConfidence(evaluation) {
    if (!evaluation.meetsRequirements) return 0

    const confidenceFactors = []

    // Attempts factor (more attempts = higher confidence)
    const attemptsRatio = Math.min(evaluation.totalAttempts / 300, 1.0)
    confidenceFactors.push(attemptsRatio)

    // Accuracy factor (higher accuracy = higher confidence)
    const accuracyBonus = Math.max(0, evaluation.overallAccuracy - 0.80)
    confidenceFactors.push(0.8 + accuracyBonus)

    // Competency spread factor (meeting all requirements with margin)
    const competencyMargins = evaluation.competencyResults.map(r => {
      if (!r.actual || r.actual.attempts === 0) return 0
      const accuracyMargin = r.actual.accuracy - r.required.minAccuracy
      const attemptsMargin = (r.actual.attempts - r.required.minAttempts) / r.required.minAttempts
      return Math.min(accuracyMargin + attemptsMargin * 0.1, 0.3)
    })

    const avgMargin = competencyMargins.reduce((sum, m) => sum + m, 0) / competencyMargins.length
    confidenceFactors.push(0.7 + avgMargin)

    return confidenceFactors.reduce((sum, f) => sum + f, 0) / confidenceFactors.length
  }

  async checkForAutomaticPromotion() {
    const eligibility = await this.evaluateProgressionEligibility()

    if (!eligibility.eligible) {
      return {
        promoted: false,
        reason: eligibility.reason,
        eligibility
      }
    }

    // Require high confidence for automatic promotion
    if (eligibility.confidence < 0.85) {
      return {
        promoted: false,
        reason: 'low_confidence',
        eligibility
      }
    }

    // Perform automatic promotion
    const profile = await getCurrentUserProfile()
    await profile.setLevel(eligibility.nextLevel, 'automatic_promotion')

    this.addNotification({
      type: 'level_promotion',
      from: eligibility.currentLevel,
      to: eligibility.nextLevel,
      confidence: eligibility.confidence,
      timestamp: new Date().toISOString()
    })

    return {
      promoted: true,
      from: eligibility.currentLevel,
      to: eligibility.nextLevel,
      confidence: eligibility.confidence,
      eligibility
    }
  }

  async suggestLevelAdjustment() {
    const profile = await getCurrentUserProfile()
    const eligibility = await this.evaluateProgressionEligibility()

    // Simple recommendation based on progression eligibility
    if (eligibility.eligible && eligibility.confidence > 0.8) {
      return {
        suggestion: 'promote',
        confidence: eligibility.confidence,
        message: 'Considera avanzar al siguiente nivel'
      }
    }

    // Check if user is struggling (low accuracy in current level)
    const stats = profile.competencyStats
    const overallAccuracy = this.calculateOverallAccuracy(stats)

    if (overallAccuracy < 0.5 && profile.getCurrentLevel() !== 'A1') {
      return {
        suggestion: 'demote',
        confidence: 1 - overallAccuracy,
        message: 'Considera practicar en un nivel más básico'
      }
    }

    return {
      suggestion: 'maintain',
      confidence: Math.max(0.6, overallAccuracy),
      message: 'Continúa en tu nivel actual'
    }
  }

  calculateOverallAccuracy(stats) {
    const statValues = Object.values(stats)
    if (statValues.length === 0) return 0

    const totalCorrect = statValues.reduce((sum, stat) => sum + (stat.correct || 0), 0)
    const totalAttempts = statValues.reduce((sum, stat) => sum + (stat.attempts || 0), 0)

    return totalAttempts > 0 ? totalCorrect / totalAttempts : 0
  }

  async updateLevelProgress() {
    const profile = await getCurrentUserProfile()
    const currentLevel = profile.getCurrentLevel()
    const requirements = LEVEL_REQUIREMENTS[profile.getNextLevel()]

    if (!requirements || currentLevel === 'C2') {
      await profile.updateProgress(100)
      return 100
    }

    const evaluation = await this.evaluateRequirements(profile, requirements)
    let progress = 0

    // Calculate progress based on multiple factors
    const factors = []

    // Overall accuracy factor (40% weight)
    const accuracyProgress = Math.min(evaluation.overallAccuracy / requirements.overallAccuracy, 1.0)
    factors.push({ weight: 0.4, value: accuracyProgress })

    // Attempts factor (20% weight)
    const attemptsProgress = Math.min(evaluation.totalAttempts / requirements.minTotalAttempts, 1.0)
    factors.push({ weight: 0.2, value: attemptsProgress })

    // Competencies factor (40% weight)
    const competencyProgress = evaluation.competencyResults.length > 0
      ? evaluation.competencyResults.filter(r => r.meets).length / evaluation.competencyResults.length
      : 0
    factors.push({ weight: 0.4, value: competencyProgress })

    progress = factors.reduce((sum, factor) => sum + (factor.weight * factor.value * 100), 0)
    progress = Math.max(0, Math.min(100, progress))

    await profile.updateProgress(progress)
    return progress
  }

  addNotification(notification) {
    this.notifications.push(notification)

    // Keep only last 10 notifications
    if (this.notifications.length > 10) {
      this.notifications = this.notifications.slice(-10)
    }
  }

  getRecentNotifications() {
    return this.notifications.slice().reverse()
  }

  clearNotifications() {
    this.notifications = []
  }
}

// Global progression engine
let globalProgression = null

export function getGlobalProgression() {
  if (!globalProgression) {
    globalProgression = new LevelProgressionEngine()
  }
  return globalProgression
}

export async function checkUserProgression() {
  const progression = getGlobalProgression()
  await progression.updateLevelProgress()
  return await progression.checkForAutomaticPromotion()
}

export async function getUserLevelRequirements(level) {
  return LEVEL_REQUIREMENTS[level] || null
}

export async function getProgressionStatus() {
  const progression = getGlobalProgression()
  const eligibility = await progression.evaluateProgressionEligibility()
  const suggestion = await progression.suggestLevelAdjustment()
  const progress = await progression.updateLevelProgress()

  return {
    eligibility,
    suggestion,
    progress,
    notifications: progression.getRecentNotifications()
  }
}