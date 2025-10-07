// Dynamic Level Evaluator
// Sistema inteligente de evaluación continua del nivel del usuario basado en rendimiento real

import { getCurrentUserProfile, AVAILABLE_LEVELS } from './userLevelProfile.js'
import { getMasteryByUser } from '../progress/database.js'
import { LEVEL_REQUIREMENTS } from './levelProgression.js'
import { getAdvancedAnalytics } from '../progress/analytics.js'

// Configuración del evaluador dinámico
const EVALUATOR_CONFIG = {
  // Pesos para diferentes métricas en la evaluación
  weights: {
    accuracy: 0.35,           // Precisión en respuestas
    consistency: 0.25,        // Consistencia temporal en el rendimiento
    responseTime: 0.15,       // Tiempo de respuesta (fluidez)
    coverage: 0.15,           // Cobertura de competencias del nivel
    confidence: 0.10          // Confianza del sistema emocional
  },

  // Configuración temporal para análisis de tendencias
  temporal: {
    recentWindowDays: 7,      // Ventana de análisis reciente
    trendWindowDays: 30,      // Ventana para detectar tendencias
    minAttemptsForEval: 20,   // Mínimo intentos para evaluar un nivel
    decayFactor: 0.9          // Factor de decaimiento para datos antiguos
  },

  // Umbrales para determinación de nivel
  thresholds: {
    levelUpConfidence: 0.85,  // Confianza mínima para subir nivel
    levelDownConfidence: 0.60, // Confianza mínima para mantener nivel
    stabilityRequired: 0.80,   // Estabilidad requerida en el rendimiento
    competencyCoverage: 0.70   // Cobertura mínima de competencias
  }
}

export class DynamicLevelEvaluator {
  constructor() {
    this.cache = new Map()
    this.cacheExpiry = 5 * 60 * 1000 // 5 minutos
  }

  /**
   * Evalúa el nivel efectivo del usuario basado en su rendimiento real
   * @param {string} userId - ID del usuario
   * @param {string} declaredLevel - Nivel declarado por el usuario
   * @returns {Promise<Object>} Evaluación completa del nivel
   */
  async evaluateEffectiveLevel(userId, declaredLevel = null) {
    try {
      // Verificar cache
      const cacheKey = `${userId}:${declaredLevel || 'auto'}`
      const cached = this.cache.get(cacheKey)
      if (cached && (Date.now() - cached.timestamp) < this.cacheExpiry) {
        return cached.result
      }

      // Obtener perfil del usuario y datos base
      const profile = await getCurrentUserProfile()
      const currentLevel = declaredLevel || profile.getCurrentLevel()

      // Obtener datos de rendimiento
      const [masteryData, analytics] = await Promise.all([
        this.getMasteryDataForUser(userId),
        this.getAnalyticsForUser(userId)
      ])

      // Realizar evaluación multi-dimensional
      const evaluation = {
        userId,
        declaredLevel: currentLevel,
        effectiveLevel: null,
        confidence: 0,
        stability: 0,
        evaluation: {
          accuracy: await this.evaluateAccuracy(masteryData, currentLevel),
          consistency: await this.evaluateConsistency(masteryData, analytics),
          responseTime: await this.evaluateResponseTime(analytics, currentLevel),
          coverage: await this.evaluateCompetencyCoverage(masteryData, currentLevel),
          confidence: await this.evaluateSystemConfidence(analytics)
        },
        recommendations: [],
        timestamp: Date.now()
      }

      // Calcular nivel efectivo
      evaluation.effectiveLevel = await this.calculateEffectiveLevel(evaluation.evaluation, currentLevel)
      evaluation.confidence = await this.calculateOverallConfidence(evaluation.evaluation)
      evaluation.stability = await this.calculateStability(masteryData, analytics)

      // Generar recomendaciones
      evaluation.recommendations = await this.generateRecommendations(evaluation, currentLevel)

      // Cache del resultado
      this.cache.set(cacheKey, {
        result: evaluation,
        timestamp: Date.now()
      })

      return evaluation

    } catch (error) {
      console.error('Error evaluating effective level:', error)
      return this.getDefaultEvaluation(userId, declaredLevel)
    }
  }

  /**
   * Evalúa la precisión del usuario en el nivel especificado
   */
  async evaluateAccuracy(masteryData, targetLevel) {
    const requirements = LEVEL_REQUIREMENTS[targetLevel]
    if (!requirements) return { score: 0, details: 'Nivel no encontrado' }

    let totalScore = 0
    let totalWeight = 0
    const details = {}

    // Evaluar competencias requeridas para el nivel
    for (const competency of requirements.requiredCompetencies) {
      const key = `${competency.mood}_${competency.tense}`
      const mastery = masteryData[key]

      if (mastery && mastery.attempts >= competency.minAttempts) {
        const score = Math.min(mastery.accuracy / competency.minAccuracy, 1.0)
        const weight = competency.minAttempts / 10 // Mayor peso para competencias con más intentos requeridos

        totalScore += score * weight
        totalWeight += weight

        details[key] = {
          score,
          accuracy: mastery.accuracy,
          required: competency.minAccuracy,
          attempts: mastery.attempts,
          meets: mastery.accuracy >= competency.minAccuracy
        }
      } else {
        details[key] = {
          score: 0,
          accuracy: mastery?.accuracy || 0,
          required: competency.minAccuracy,
          attempts: mastery?.attempts || 0,
          meets: false,
          insufficientData: true
        }
      }
    }

    const finalScore = totalWeight > 0 ? totalScore / totalWeight : 0

    return {
      score: finalScore,
      details,
      competenciesMet: Object.values(details).filter(d => d.meets).length,
      totalCompetencies: requirements.requiredCompetencies.length
    }
  }

  /**
   * Evalúa la consistencia del rendimiento a lo largo del tiempo
   */
  async evaluateConsistency(masteryData, analytics) {
    if (!analytics?.timeline?.length) {
      return { score: 0, details: 'Datos insuficientes para evaluar consistencia' }
    }

    const recentDays = EVALUATOR_CONFIG.temporal.recentWindowDays
    const cutoffTime = Date.now() - (recentDays * 24 * 60 * 60 * 1000)

    // Filtrar datos recientes
    const recentData = analytics.timeline.filter(entry =>
      new Date(entry.date).getTime() > cutoffTime
    )

    if (recentData.length < 3) {
      return { score: 0, details: 'Datos recientes insuficientes' }
    }

    // Calcular variabilidad en accuracy
    const accuracies = recentData.map(entry => entry.accuracy || 0)
    const mean = accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length
    const variance = accuracies.reduce((sum, acc) => sum + Math.pow(acc - mean, 2), 0) / accuracies.length
    const stdDev = Math.sqrt(variance)

    // Consistencia = 1 - (stdDev normalizada)
    const consistency = Math.max(0, 1 - (stdDev / mean))

    return {
      score: consistency,
      details: {
        mean,
        stdDev,
        dataPoints: recentData.length,
        timeSpan: recentDays
      }
    }
  }

  /**
   * Evalúa la fluidez basada en tiempos de respuesta
   */
  async evaluateResponseTime(analytics, targetLevel) {
    if (!analytics?.averageResponseTime) {
      return { score: 0, details: 'Datos de tiempo de respuesta no disponibles' }
    }

    // Umbrales esperados por nivel (en milisegundos)
    const expectedTimes = {
      'A1': 8000,   // 8 segundos
      'A2': 6000,   // 6 segundos
      'B1': 5000,   // 5 segundos
      'B2': 4000,   // 4 segundos
      'C1': 3500,   // 3.5 segundos
      'C2': 3000    // 3 segundos
    }

    const expectedTime = expectedTimes[targetLevel] || 5000
    const actualTime = analytics.averageResponseTime

    // Score basado en qué tan cerca está del tiempo esperado
    // Mejor rendimiento = menor tiempo
    const score = Math.min(expectedTime / Math.max(actualTime, 1000), 1.0)

    return {
      score,
      details: {
        actualTime,
        expectedTime,
        performance: actualTime <= expectedTime ? 'good' : 'needs_improvement'
      }
    }
  }

  /**
   * Evalúa la cobertura de competencias del nivel
   */
  async evaluateCompetencyCoverage(masteryData, targetLevel) {
    const requirements = LEVEL_REQUIREMENTS[targetLevel]
    if (!requirements) return { score: 0, details: 'Nivel no encontrado' }

    const totalCompetencies = requirements.requiredCompetencies.length
    let coveredCompetencies = 0
    const coverage = {}

    for (const competency of requirements.requiredCompetencies) {
      const key = `${competency.mood}_${competency.tense}`
      const mastery = masteryData[key]

      const hasCoverage = mastery && mastery.attempts >= Math.min(competency.minAttempts / 2, 10)
      if (hasCoverage) {
        coveredCompetencies++
      }

      coverage[key] = {
        covered: hasCoverage,
        attempts: mastery?.attempts || 0,
        required: competency.minAttempts
      }
    }

    const score = totalCompetencies > 0 ? coveredCompetencies / totalCompetencies : 0

    return {
      score,
      details: {
        covered: coveredCompetencies,
        total: totalCompetencies,
        coverage
      }
    }
  }

  /**
   * Evalúa la confianza del sistema emocional/inteligencia artificial
   */
  async evaluateSystemConfidence(analytics) {
    if (!analytics?.confidence) {
      return { score: 0.5, details: 'Datos de confianza no disponibles' }
    }

    // Usar directamente la confianza del sistema de analytics
    const confidence = analytics.confidence / 100 // Normalizar a 0-1

    return {
      score: confidence,
      details: {
        systemConfidence: analytics.confidence,
        source: 'emotional_intelligence_system'
      }
    }
  }

  /**
   * Calcula el nivel efectivo basado en todas las evaluaciones
   */
  async calculateEffectiveLevel(evaluations, currentLevel) {
    const weights = EVALUATOR_CONFIG.weights

    // Calcular puntuación ponderada
    const weightedScore =
      (evaluations.accuracy.score * weights.accuracy) +
      (evaluations.consistency.score * weights.consistency) +
      (evaluations.responseTime.score * weights.responseTime) +
      (evaluations.coverage.score * weights.coverage) +
      (evaluations.confidence.score * weights.confidence)

    // Determinar nivel basado en puntuación
    const currentLevelIndex = AVAILABLE_LEVELS.indexOf(currentLevel)

    if (weightedScore >= EVALUATOR_CONFIG.thresholds.levelUpConfidence) {
      // Usuario está listo para subir de nivel
      const nextLevelIndex = Math.min(currentLevelIndex + 1, AVAILABLE_LEVELS.length - 1)
      return AVAILABLE_LEVELS[nextLevelIndex]
    } else if (weightedScore < EVALUATOR_CONFIG.thresholds.levelDownConfidence) {
      // Usuario debería bajar de nivel
      const prevLevelIndex = Math.max(currentLevelIndex - 1, 0)
      return AVAILABLE_LEVELS[prevLevelIndex]
    }

    // Mantener nivel actual
    return currentLevel
  }

  /**
   * Calcula la confianza general de la evaluación
   */
  async calculateOverallConfidence(evaluations) {
    const weights = EVALUATOR_CONFIG.weights

    // Confianza basada en disponibilidad de datos y calidad de métricas
    let dataQuality = 0
    let totalWeight = 0

    Object.entries(evaluations).forEach(([metric, result]) => {
      const weight = weights[metric] || 0
      const quality = result.score > 0 ? 1 : 0.5 // Penalizar métricas sin datos

      dataQuality += quality * weight
      totalWeight += weight
    })

    return totalWeight > 0 ? dataQuality / totalWeight : 0.5
  }

  /**
   * Calcula la estabilidad del rendimiento
   */
  async calculateStability(masteryData, analytics) {
    // Estabilidad basada en consistencia de competencias principales
    const consistencyScore = analytics?.consistency?.score || 0
    const coverageScore = Object.keys(masteryData).length > 5 ? 1 : 0.5

    return (consistencyScore + coverageScore) / 2
  }

  /**
   * Genera recomendaciones específicas para el usuario
   */
  async generateRecommendations(evaluation, currentLevel) {
    const recommendations = []
    const { accuracy, coverage, consistency, responseTime } = evaluation.evaluation

    // Recomendaciones basadas en accuracy
    if (accuracy.score < 0.7) {
      recommendations.push({
        type: 'accuracy',
        priority: 'high',
        message: 'Enfócate en practicar las competencias básicas del nivel actual',
        specificActions: Object.entries(accuracy.details)
          .filter(([_, detail]) => !detail.meets)
          .map(([key, _]) => `Practicar ${key.replace('_', ' ')}`)
      })
    }

    // Recomendaciones basadas en coverage
    if (coverage.score < 0.6) {
      recommendations.push({
        type: 'coverage',
        priority: 'medium',
        message: 'Amplía tu práctica a más competencias del nivel',
        specificActions: ['Explorar nuevos tiempos verbales', 'Diversificar tipos de ejercicios']
      })
    }

    // Recomendaciones basadas en consistency
    if (consistency.score < 0.6) {
      recommendations.push({
        type: 'consistency',
        priority: 'medium',
        message: 'Trabaja en mantener un rendimiento más estable',
        specificActions: ['Practicar regularmente', 'Revisar errores frecuentes']
      })
    }

    // Recomendaciones basadas en response time
    if (responseTime.score < 0.7) {
      recommendations.push({
        type: 'fluency',
        priority: 'low',
        message: 'Mejora tu fluidez practicando más frecuentemente',
        specificActions: ['Ejercicios de velocidad', 'Revisión de patrones']
      })
    }

    return recommendations
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
   * Obtiene analytics del usuario
   */
  async getAnalyticsForUser(userId) {
    try {
      const analytics = await getAdvancedAnalytics(userId)
      return analytics || {}
    } catch (error) {
      console.warn('Error loading analytics:', error)
      return {}
    }
  }

  /**
   * Devuelve evaluación por defecto en caso de error
   */
  getDefaultEvaluation(userId, declaredLevel) {
    return {
      userId,
      declaredLevel: declaredLevel || 'A2',
      effectiveLevel: declaredLevel || 'A2',
      confidence: 0.5,
      stability: 0.5,
      evaluation: {
        accuracy: { score: 0.5, details: 'Datos insuficientes' },
        consistency: { score: 0.5, details: 'Datos insuficientes' },
        responseTime: { score: 0.5, details: 'Datos insuficientes' },
        coverage: { score: 0.5, details: 'Datos insuficientes' },
        confidence: { score: 0.5, details: 'Datos insuficientes' }
      },
      recommendations: [{
        type: 'data',
        priority: 'high',
        message: 'Practica más para obtener una evaluación precisa de tu nivel',
        specificActions: ['Completar más ejercicios', 'Diversificar práctica']
      }],
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

// Instancia global del evaluador
let globalEvaluator = null

export function getDynamicLevelEvaluator() {
  if (!globalEvaluator) {
    globalEvaluator = new DynamicLevelEvaluator()
  }
  return globalEvaluator
}

/**
 * Función de conveniencia para evaluar rápidamente el nivel efectivo
 */
export async function evaluateUserLevel(userId, declaredLevel = null) {
  const evaluator = getDynamicLevelEvaluator()
  return await evaluator.evaluateEffectiveLevel(userId, declaredLevel)
}

/**
 * Verifica si el usuario debería cambiar de nivel
 */
export async function shouldUserChangeLevel(userId) {
  const evaluation = await evaluateUserLevel(userId)
  const shouldChange = evaluation.effectiveLevel !== evaluation.declaredLevel
  const confidence = evaluation.confidence

  return {
    shouldChange,
    confidence,
    currentLevel: evaluation.declaredLevel,
    recommendedLevel: evaluation.effectiveLevel,
    reason: shouldChange ? 'performance_based' : 'level_appropriate',
    evaluation
  }
}