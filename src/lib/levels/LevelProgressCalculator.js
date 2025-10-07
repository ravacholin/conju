// Level Progress Calculator
// Sistema de cálculo dinámico de progreso basado en competencias reales

import { getCurrentUserProfile, AVAILABLE_LEVELS } from './userLevelProfile.js'
import { LEVEL_REQUIREMENTS } from './levelProgression.js'
import { getMasteryByUser } from '../progress/database.js'
import { getDynamicLevelEvaluator } from './DynamicLevelEvaluator.js'

// Configuración del calculador de progreso
const PROGRESS_CONFIG = {
  // Pesos para diferentes aspectos del progreso
  weights: {
    competencies: 0.40,    // Competencias específicas del nivel
    mastery: 0.30,         // Mastery scores de las habilidades
    coverage: 0.20,        // Cobertura de diferentes áreas
    consistency: 0.10      // Consistencia en el rendimiento
  },

  // Configuración de umbrales
  thresholds: {
    minCompetencyScore: 0.75,  // Puntuación mínima para competencia lograda
    maxProgressPerDay: 5,      // Máximo progreso por día (%)
    smoothingFactor: 0.15      // Factor de suavizado para cambios graduales
  },

  // Configuración de competencias
  competency: {
    baseScore: 20,           // Puntuación base por competencia
    bonusMultiplier: 1.5,    // Multiplicador para competencias avanzadas
    penaltyFactor: 0.8       // Factor de penalización por competencias faltantes
  }
}

export class LevelProgressCalculator {
  constructor() {
    this.cache = new Map()
    this.cacheExpiry = 2 * 60 * 1000 // 2 minutos
  }

  /**
   * Calcula el progreso dinámico del usuario en su nivel actual
   * @param {string} userId - ID del usuario
   * @param {string} currentLevel - Nivel actual del usuario
   * @returns {Promise<Object>} Objeto con progreso detallado
   */
  async calculateLevelProgress(userId, currentLevel = null) {
    try {
      // Verificar cache
      const cacheKey = `${userId}:${currentLevel || 'auto'}`
      const cached = this.cache.get(cacheKey)
      if (cached && (Date.now() - cached.timestamp) < this.cacheExpiry) {
        return cached.result
      }

      // Obtener datos base
      const profile = await getCurrentUserProfile()
      const level = currentLevel || profile.getCurrentLevel()
      const requirements = LEVEL_REQUIREMENTS[level]

      if (!requirements) {
        return this.getDefaultProgress(level, 'Nivel no encontrado')
      }

      // Obtener datos de rendimiento
      const [masteryData, levelEvaluation] = await Promise.all([
        this.getMasteryDataForUser(userId),
        this.getLevelEvaluation(userId, level)
      ])

      // Calcular componentes del progreso
      const progress = {
        level,
        userId,
        overall: 0,
        components: {
          competencies: await this.calculateCompetencyProgress(masteryData, requirements),
          mastery: await this.calculateMasteryProgress(masteryData, requirements),
          coverage: await this.calculateCoverageProgress(masteryData, requirements),
          consistency: await this.calculateConsistencyProgress(levelEvaluation)
        },
        details: {
          totalCompetencies: requirements.requiredCompetencies.length,
          completedCompetencies: 0,
          missingCompetencies: [],
          strongestAreas: [],
          weakestAreas: [],
          nextMilestones: []
        },
        timestamp: Date.now()
      }

      // Calcular progreso general
      progress.overall = this.calculateOverallProgress(progress.components)

      // Analizar detalles
      progress.details = await this.analyzeProgressDetails(progress, masteryData, requirements)

      // Aplicar suavizado si existe progreso previo
      progress.overall = await this.applySmoothingIfNeeded(userId, level, progress.overall)

      // Cache del resultado
      this.cache.set(cacheKey, {
        result: progress,
        timestamp: Date.now()
      })

      return progress

    } catch (error) {
      console.error('Error calculating level progress:', error)
      return this.getDefaultProgress(currentLevel || 'A2', error.message)
    }
  }

  /**
   * Calcula el progreso específico de competencias
   */
  async calculateCompetencyProgress(masteryData, requirements) {
    if (!requirements.requiredCompetencies.length) {
      return { score: 100, details: 'No hay competencias específicas para este nivel' }
    }

    let totalScore = 0
    let completedCompetencies = 0
    const competencyDetails = {}

    for (const competency of requirements.requiredCompetencies) {
      const key = `${competency.mood}_${competency.tense}`
      const mastery = masteryData[key]

      let competencyScore = 0

      if (mastery && mastery.attempts >= competency.minAttempts) {
        // Competencia con datos suficientes
        const accuracyRatio = mastery.accuracy / competency.minAccuracy
        const attemptBonus = Math.min(mastery.attempts / competency.minAttempts, 2.0) // Bonus hasta 2x

        competencyScore = Math.min(accuracyRatio * attemptBonus * 100, 100)

        if (mastery.accuracy >= competency.minAccuracy) {
          completedCompetencies++
        }
      } else if (mastery && mastery.attempts > 0) {
        // Algunos datos pero insuficientes
        const attemptProgress = mastery.attempts / competency.minAttempts
        const accuracyScore = mastery.accuracy / competency.minAccuracy

        competencyScore = Math.min(attemptProgress * accuracyScore * 60, 60) // Máximo 60% sin datos completos
      }
      // Sin datos = 0 puntos

      competencyDetails[key] = {
        score: competencyScore,
        completed: competencyScore >= 75,
        accuracy: mastery?.accuracy || 0,
        attempts: mastery?.attempts || 0,
        required: competency
      }

      totalScore += competencyScore
    }

    const averageScore = totalScore / requirements.requiredCompetencies.length

    return {
      score: averageScore,
      completedCompetencies,
      totalCompetencies: requirements.requiredCompetencies.length,
      details: competencyDetails
    }
  }

  /**
   * Calcula el progreso basado en mastery scores
   */
  async calculateMasteryProgress(masteryData, requirements) {
    const allMasteryScores = Object.values(masteryData)
      .filter(mastery => mastery.attempts > 5) // Solo considerar con datos significativos
      .map(mastery => mastery.accuracy * 100)

    if (allMasteryScores.length === 0) {
      return { score: 0, details: 'Sin datos de mastery suficientes' }
    }

    // Calcular promedio ponderado por número de intentos
    let weightedSum = 0
    let totalWeight = 0

    Object.values(masteryData).forEach(mastery => {
      if (mastery.attempts > 5) {
        const weight = Math.min(mastery.attempts / 20, 2.0) // Peso máximo 2x
        weightedSum += mastery.accuracy * weight
        totalWeight += weight
      }
    })

    const weightedAverage = totalWeight > 0 ? (weightedSum / totalWeight) * 100 : 0

    // Bonus por tener mastery en competencias del nivel
    let levelBonus = 0
    requirements.requiredCompetencies.forEach(comp => {
      const key = `${comp.mood}_${comp.tense}`
      const mastery = masteryData[key]
      if (mastery && mastery.accuracy >= comp.minAccuracy) {
        levelBonus += 5 // 5 puntos por competencia dominada
      }
    })

    const finalScore = Math.min(weightedAverage + levelBonus, 100)

    return {
      score: finalScore,
      details: {
        weightedAverage,
        levelBonus,
        masteryEntries: allMasteryScores.length
      }
    }
  }

  /**
   * Calcula el progreso basado en cobertura de áreas
   */
  async calculateCoverageProgress(masteryData, requirements) {
    // Contar diferentes moods y tenses practicados
    const practiceCount = Object.keys(masteryData).length
    const requiredCount = requirements.requiredCompetencies.length

    if (requiredCount === 0) {
      return { score: 100, details: 'No hay requisitos específicos' }
    }

    // Cobertura básica
    const coverageRatio = Math.min(practiceCount / requiredCount, 1.0)
    let coverageScore = coverageRatio * 70 // Máximo 70% por cobertura básica

    // Bonus por diversidad
    const moodsCount = new Set(
      Object.keys(masteryData).map(key => key.split('_')[0])
    ).size

    const tensesCount = new Set(
      Object.keys(masteryData).map(key => key.split('_')[1])
    ).size

    const diversityBonus = Math.min((moodsCount + tensesCount) * 2, 30)
    coverageScore += diversityBonus

    return {
      score: Math.min(coverageScore, 100),
      details: {
        practiceCount,
        requiredCount,
        moodsCount,
        tensesCount,
        diversityBonus
      }
    }
  }

  /**
   * Calcula el progreso basado en consistencia
   */
  async calculateConsistencyProgress(levelEvaluation) {
    if (!levelEvaluation?.evaluation?.consistency) {
      return { score: 50, details: 'Datos de consistencia no disponibles' }
    }

    const consistencyScore = levelEvaluation.evaluation.consistency.score * 100

    return {
      score: consistencyScore,
      details: levelEvaluation.evaluation.consistency.details || {}
    }
  }

  /**
   * Calcula el progreso general combinando todos los componentes
   */
  calculateOverallProgress(components) {
    const weights = PROGRESS_CONFIG.weights

    return (
      (components.competencies.score * weights.competencies) +
      (components.mastery.score * weights.mastery) +
      (components.coverage.score * weights.coverage) +
      (components.consistency.score * weights.consistency)
    )
  }

  /**
   * Analiza los detalles del progreso para generar insights
   */
  async analyzeProgressDetails(progress, masteryData, requirements) {
    const details = progress.details

    // Contar competencias completadas
    details.completedCompetencies = Object.values(progress.components.competencies.details || {})
      .filter(comp => comp.completed).length

    // Identificar competencias faltantes
    details.missingCompetencies = requirements.requiredCompetencies
      .filter(req => {
        const key = `${req.mood}_${req.tense}`
        const mastery = masteryData[key]
        return !mastery || mastery.accuracy < req.minAccuracy || mastery.attempts < req.minAttempts
      })
      .map(req => ({
        mood: req.mood,
        tense: req.tense,
        requiredAccuracy: req.minAccuracy,
        requiredAttempts: req.minAttempts,
        currentAccuracy: masteryData[`${req.mood}_${req.tense}`]?.accuracy || 0,
        currentAttempts: masteryData[`${req.mood}_${req.tense}`]?.attempts || 0
      }))

    // Identificar áreas más fuertes
    details.strongestAreas = Object.entries(masteryData)
      .filter(([_, mastery]) => mastery.attempts >= 10 && mastery.accuracy >= 0.85)
      .sort(([, a], [, b]) => (b.accuracy * b.attempts) - (a.accuracy * a.attempts))
      .slice(0, 3)
      .map(([key, mastery]) => ({
        key,
        mood: key.split('_')[0],
        tense: key.split('_')[1],
        accuracy: mastery.accuracy,
        attempts: mastery.attempts
      }))

    // Identificar áreas más débiles
    details.weakestAreas = Object.entries(masteryData)
      .filter(([_, mastery]) => mastery.attempts >= 5)
      .sort(([, a], [, b]) => a.accuracy - b.accuracy)
      .slice(0, 3)
      .map(([key, mastery]) => ({
        key,
        mood: key.split('_')[0],
        tense: key.split('_')[1],
        accuracy: mastery.accuracy,
        attempts: mastery.attempts,
        needsWork: mastery.accuracy < 0.7
      }))

    // Generar próximos hitos
    details.nextMilestones = await this.generateNextMilestones(progress, requirements)

    return details
  }

  /**
   * Genera los próximos hitos para el progreso
   */
  async generateNextMilestones(progress, requirements) {
    const milestones = []

    // Hito por competencias faltantes
    const missingCount = progress.details.missingCompetencies.length
    if (missingCount > 0) {
      milestones.push({
        type: 'competencies',
        title: `Completar ${missingCount} competencia${missingCount > 1 ? 's' : ''} faltante${missingCount > 1 ? 's' : ''}`,
        progress: ((requirements.requiredCompetencies.length - missingCount) / requirements.requiredCompetencies.length) * 100,
        target: 100
      })
    }

    // Hito por progreso general
    const currentProgress = progress.overall
    if (currentProgress < 85) {
      const nextTarget = Math.ceil(currentProgress / 10) * 10 + 10
      milestones.push({
        type: 'overall',
        title: `Alcanzar ${nextTarget}% de progreso general`,
        progress: currentProgress,
        target: nextTarget
      })
    }

    // Hito por accuracy en áreas débiles
    if (progress.details.weakestAreas.length > 0) {
      const weakest = progress.details.weakestAreas[0]
      if (weakest.accuracy < 0.8) {
        milestones.push({
          type: 'accuracy',
          title: `Mejorar ${weakest.mood} ${weakest.tense} a 80% accuracy`,
          progress: weakest.accuracy * 100,
          target: 80
        })
      }
    }

    return milestones.slice(0, 3) // Máximo 3 hitos
  }

  /**
   * Aplica suavizado al progreso para evitar cambios bruscos
   */
  async applySmoothingIfNeeded(userId, level, newProgress) {
    try {
      const profile = await getCurrentUserProfile()
      const currentProgress = profile.getLevelProgress()

      if (currentProgress > 0) {
        const smoothingFactor = PROGRESS_CONFIG.thresholds.smoothingFactor
        const smoothedProgress = (currentProgress * (1 - smoothingFactor)) + (newProgress * smoothingFactor)

        // Evitar retrocesos dramáticos (máximo 5% por día)
        const maxDecrease = PROGRESS_CONFIG.thresholds.maxProgressPerDay
        if (smoothedProgress < currentProgress - maxDecrease) {
          return currentProgress - maxDecrease
        }

        return smoothedProgress
      }

      return newProgress
    } catch (error) {
      console.warn('Error applying smoothing:', error)
      return newProgress
    }
  }

  /**
   * Obtiene datos de mastery del usuario
   */
  async getMasteryDataForUser(userId) {
    try {
      const masteryData = await getMasteryByUser(userId)
      return masteryData || {}
    } catch (error) {
      console.warn('Error loading mastery data:', error)
      return {}
    }
  }

  /**
   * Obtiene evaluación de nivel del usuario
   */
  async getLevelEvaluation(userId, level) {
    try {
      const evaluator = getDynamicLevelEvaluator()
      return await evaluator.evaluateEffectiveLevel(userId, level)
    } catch (error) {
      console.warn('Error getting level evaluation:', error)
      return null
    }
  }

  /**
   * Devuelve progreso por defecto en caso de error
   */
  getDefaultProgress(level, reason) {
    return {
      level,
      userId: 'unknown',
      overall: 0,
      components: {
        competencies: { score: 0, details: `Error: ${reason}` },
        mastery: { score: 0, details: `Error: ${reason}` },
        coverage: { score: 0, details: `Error: ${reason}` },
        consistency: { score: 0, details: `Error: ${reason}` }
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

  /**
   * Limpia el cache
   */
  clearCache() {
    this.cache.clear()
  }
}

// Instancia global del calculador
let globalCalculator = null

export function getLevelProgressCalculator() {
  if (!globalCalculator) {
    globalCalculator = new LevelProgressCalculator()
  }
  return globalCalculator
}

/**
 * Función de conveniencia para calcular progreso dinámico
 */
export async function calculateUserLevelProgress(userId, currentLevel = null) {
  const calculator = getLevelProgressCalculator()
  return await calculator.calculateLevelProgress(userId, currentLevel)
}

/**
 * Función para obtener el próximo hito del usuario
 */
export async function getNextMilestone(userId) {
  const progress = await calculateUserLevelProgress(userId)
  return progress.details.nextMilestones[0] || null
}

/**
 * Función para verificar si el usuario está listo para el siguiente nivel
 */
export async function isReadyForNextLevel(userId) {
  const progress = await calculateUserLevelProgress(userId)
  const isReady = progress.overall >= 85 && progress.details.missingCompetencies.length === 0

  return {
    ready: isReady,
    progress: progress.overall,
    missingCompetencies: progress.details.missingCompetencies.length,
    recommendation: isReady ? 'level_up' : 'continue_practice'
  }
}