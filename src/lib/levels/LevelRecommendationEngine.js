// Level Recommendation Engine
// Sistema inteligente de recomendaciones basado en evaluación dinámica del nivel

import { getCurrentUserProfile } from './userLevelProfile.js'
import { getDynamicLevelEvaluator } from './DynamicLevelEvaluator.js'
import { getLevelProgressCalculator } from './LevelProgressCalculator.js'
import { LEVEL_REQUIREMENTS } from './levelProgression.js'

// Configuración del motor de recomendaciones
const RECOMMENDATION_CONFIG = {
  // Umbrales para diferentes tipos de recomendaciones
  thresholds: {
    levelUpConfidence: 0.85,    // Confianza mínima para recomendar subir nivel
    levelDownConfidence: 0.50,   // Confianza mínima para recomendar bajar nivel
    practiceUrgency: 0.70,      // Umbral para recomendaciones urgentes de práctica
    masteryTarget: 0.80,        // Objetivo de mastery para competencias
    consistencyRequired: 0.75    // Consistencia mínima requerida
  },

  // Pesos para priorizar recomendaciones
  weights: {
    levelChange: 1.0,           // Cambios de nivel (máxima prioridad)
    competencyGaps: 0.8,        // Brechas en competencias
    practiceOptimization: 0.6,  // Optimización de práctica
    motivational: 0.4,          // Recomendaciones motivacionales
    maintenance: 0.3            // Mantenimiento de habilidades
  },

  // Configuración temporal
  temporal: {
    recentDays: 7,              // Días para análisis reciente
    staleDays: 14,              // Días para considerar data obsoleta
    reminderCooldown: 24 * 60 * 60 * 1000 // 24 horas entre recordatorios similares
  }
}

export class LevelRecommendationEngine {
  constructor() {
    this.cache = new Map()
    this.cacheExpiry = 10 * 60 * 1000 // 10 minutos
    this.lastRecommendations = new Map() // Para evitar spam de recomendaciones
  }

  /**
   * Genera recomendaciones personalizadas para el usuario
   * @param {string} userId - ID del usuario
   * @param {Object} options - Opciones de configuración
   * @returns {Promise<Object>} Objeto con recomendaciones categorizadas
   */
  async generateRecommendations(userId, options = {}) {
    try {
      // Verificar cache
      const cacheKey = `${userId}:${JSON.stringify(options)}`
      const cached = this.cache.get(cacheKey)
      if (cached && (Date.now() - cached.timestamp) < this.cacheExpiry) {
        return cached.result
      }

      // Obtener datos necesarios
      const [profile, evaluation, progress] = await Promise.all([
        getCurrentUserProfile(),
        this.getDynamicEvaluation(userId),
        this.getDynamicProgress(userId)
      ])

      // Generar recomendaciones por categoría
      const recommendations = {
        userId,
        timestamp: Date.now(),
        categories: {
          levelChange: await this.generateLevelChangeRecommendations(profile, evaluation, progress),
          competencyGaps: await this.generateCompetencyGapRecommendations(progress, evaluation),
          practiceOptimization: await this.generatePracticeOptimizationRecommendations(evaluation, progress),
          motivational: await this.generateMotivationalRecommendations(profile, progress, evaluation),
          maintenance: await this.generateMaintenanceRecommendations(progress)
        },
        summary: {
          totalRecommendations: 0,
          highPriority: 0,
          mediumPriority: 0,
          lowPriority: 0
        }
      }

      // Calcular estadísticas de resumen
      recommendations.summary = this.calculateSummaryStats(recommendations.categories)

      // Priorizar y filtrar recomendaciones
      recommendations.prioritized = this.prioritizeRecommendations(recommendations.categories)

      // Cache del resultado
      this.cache.set(cacheKey, {
        result: recommendations,
        timestamp: Date.now()
      })

      return recommendations

    } catch (error) {
      console.error('Error generating recommendations:', error)
      return this.getDefaultRecommendations(userId)
    }
  }

  /**
   * Genera recomendaciones para cambios de nivel
   */
  async generateLevelChangeRecommendations(profile, evaluation, progress) {
    const recommendations = []

    if (!evaluation || !progress) return recommendations

    const currentLevel = profile.getCurrentLevel()
    const effectiveLevel = evaluation.effectiveLevel
    const confidence = evaluation.confidence

    // Recomendación para subir de nivel
    if (effectiveLevel !== currentLevel &&
        this.getLevelIndex(effectiveLevel) > this.getLevelIndex(currentLevel) &&
        confidence >= RECOMMENDATION_CONFIG.thresholds.levelUpConfidence) {

      recommendations.push({
        id: `level-up-${effectiveLevel}`,
        type: 'level_up',
        priority: 'high',
        title: `Considera cambiar a nivel ${effectiveLevel}`,
        description: `Tu rendimiento indica que estás listo para el nivel ${effectiveLevel}`,
        actionable: true,
        actions: [
          `Revisar competencias del nivel ${effectiveLevel}`,
          'Realizar práctica específica para validar el cambio',
          `Actualizar nivel a ${effectiveLevel}`
        ],
        data: {
          currentLevel,
          recommendedLevel: effectiveLevel,
          confidence,
          supportingEvidence: this.extractSupportingEvidence(evaluation, 'level_up')
        },
        estimatedImpact: 'high'
      })
    }

    // Recomendación para bajar de nivel
    if (effectiveLevel !== currentLevel &&
        this.getLevelIndex(effectiveLevel) < this.getLevelIndex(currentLevel) &&
        confidence >= RECOMMENDATION_CONFIG.thresholds.levelDownConfidence) {

      recommendations.push({
        id: `level-down-${effectiveLevel}`,
        type: 'level_down',
        priority: 'medium',
        title: `Considera ajustar a nivel ${effectiveLevel}`,
        description: `Tu rendimiento actual se alinea mejor con el nivel ${effectiveLevel}`,
        actionable: true,
        actions: [
          `Revisar fundamentos del nivel ${effectiveLevel}`,
          'Fortalecer competencias básicas',
          'Realizar práctica intensiva'
        ],
        data: {
          currentLevel,
          recommendedLevel: effectiveLevel,
          confidence,
          supportingEvidence: this.extractSupportingEvidence(evaluation, 'level_down')
        },
        estimatedImpact: 'medium'
      })
    }

    return recommendations
  }

  /**
   * Genera recomendaciones para cerrar brechas en competencias
   */
  async generateCompetencyGapRecommendations(progress, evaluation) {
    const recommendations = []

    if (!progress || !progress.details) return recommendations

    const missingCompetencies = progress.details.missingCompetencies || []
    const weakestAreas = progress.details.weakestAreas || []

    // Recomendaciones para competencias faltantes
    missingCompetencies.slice(0, 3).forEach((competency, index) => {
      recommendations.push({
        id: `missing-competency-${competency.mood}-${competency.tense}`,
        type: 'competency_gap',
        priority: index === 0 ? 'high' : 'medium',
        title: `Practicar ${competency.mood} ${competency.tense}`,
        description: `Esta competencia es esencial para tu nivel actual`,
        actionable: true,
        actions: [
          `Estudiar ${competency.mood} ${competency.tense}`,
          'Realizar ejercicios específicos',
          'Practicar hasta alcanzar 80% de precisión'
        ],
        data: {
          mood: competency.mood,
          tense: competency.tense,
          currentAccuracy: competency.currentAccuracy,
          requiredAccuracy: competency.requiredAccuracy,
          currentAttempts: competency.currentAttempts,
          requiredAttempts: competency.requiredAttempts
        },
        estimatedImpact: 'high'
      })
    })

    // Recomendaciones para áreas más débiles
    weakestAreas.slice(0, 2).forEach((area, index) => {
      if (area.needsWork) {
        recommendations.push({
          id: `weak-area-${area.mood}-${area.tense}`,
          type: 'improvement',
          priority: 'medium',
          title: `Mejorar ${area.mood} ${area.tense}`,
          description: `Tu precisión en esta área puede mejorar`,
          actionable: true,
          actions: [
            'Revisar errores comunes',
            'Práctica adicional',
            'Ejercicios de velocidad'
          ],
          data: {
            mood: area.mood,
            tense: area.tense,
            currentAccuracy: area.accuracy,
            attempts: area.attempts,
            targetAccuracy: 0.80
          },
          estimatedImpact: 'medium'
        })
      }
    })

    return recommendations
  }

  /**
   * Genera recomendaciones para optimizar la práctica
   */
  async generatePracticeOptimizationRecommendations(evaluation, progress) {
    const recommendations = []

    if (!evaluation || !progress) return recommendations

    // Recomendación basada en consistencia
    if (evaluation.evaluation.consistency.score < RECOMMENDATION_CONFIG.thresholds.consistencyRequired) {
      recommendations.push({
        id: 'improve-consistency',
        type: 'practice_optimization',
        priority: 'medium',
        title: 'Mejorar consistencia en la práctica',
        description: 'Tu rendimiento varía mucho entre sesiones',
        actionable: true,
        actions: [
          'Practicar diariamente por períodos cortos',
          'Establecer una rutina de práctica',
          'Revisar conceptos antes de cada sesión'
        ],
        data: {
          currentConsistency: evaluation.evaluation.consistency.score,
          targetConsistency: RECOMMENDATION_CONFIG.thresholds.consistencyRequired
        },
        estimatedImpact: 'medium'
      })
    }

    // Recomendación basada en tiempo de respuesta
    if (evaluation.evaluation.responseTime.score < 0.7) {
      recommendations.push({
        id: 'improve-fluency',
        type: 'practice_optimization',
        priority: 'low',
        title: 'Mejorar fluidez y velocidad',
        description: 'Puedes responder más rápidamente',
        actionable: true,
        actions: [
          'Ejercicios de velocidad',
          'Revisión de patrones comunes',
          'Práctica de automatización'
        ],
        data: {
          currentSpeed: evaluation.evaluation.responseTime.details.actualTime,
          targetSpeed: evaluation.evaluation.responseTime.details.expectedTime
        },
        estimatedImpact: 'low'
      })
    }

    // Recomendación basada en cobertura
    if (evaluation.evaluation.coverage.score < 0.8) {
      recommendations.push({
        id: 'increase-coverage',
        type: 'practice_optimization',
        priority: 'medium',
        title: 'Ampliar variedad de práctica',
        description: 'Explora más competencias del nivel',
        actionable: true,
        actions: [
          'Probar diferentes tipos de ejercicios',
          'Practicar competencias nuevas',
          'Diversificar tiempos verbales'
        ],
        data: {
          currentCoverage: evaluation.evaluation.coverage.score,
          targetCoverage: 0.8
        },
        estimatedImpact: 'medium'
      })
    }

    return recommendations
  }

  /**
   * Genera recomendaciones motivacionales
   */
  async generateMotivationalRecommendations(profile, progress, evaluation) {
    const recommendations = []

    // Celebrar fortalezas
    if (progress && progress.details.strongestAreas.length > 0) {
      const strongest = progress.details.strongestAreas[0]
      recommendations.push({
        id: 'celebrate-strength',
        type: 'motivational',
        priority: 'low',
        title: `¡Excelente dominio en ${strongest.mood} ${strongest.tense}!`,
        description: `Tienes ${Math.round(strongest.accuracy * 100)}% de precisión`,
        actionable: false,
        actions: [],
        data: {
          area: strongest,
          achievement: 'mastery'
        },
        estimatedImpact: 'motivational'
      })
    }

    // Progreso hacia siguiente hito
    if (progress && progress.details.nextMilestones.length > 0) {
      const nextMilestone = progress.details.nextMilestones[0]
      recommendations.push({
        id: 'next-milestone',
        type: 'motivational',
        priority: 'low',
        title: 'Próximo objetivo',
        description: nextMilestone.title,
        actionable: true,
        actions: [
          'Revisar progreso actual',
          'Planificar sesiones de práctica',
          'Mantener constancia'
        ],
        data: {
          milestone: nextMilestone
        },
        estimatedImpact: 'motivational'
      })
    }

    return recommendations
  }

  /**
   * Genera recomendaciones de mantenimiento
   */
  async generateMaintenanceRecommendations(progress) {
    const recommendations = []

    if (!progress || !progress.details) return recommendations

    // Mantener áreas fuertes
    const strongAreas = progress.details.strongestAreas || []
    if (strongAreas.length > 0) {
      recommendations.push({
        id: 'maintain-strengths',
        type: 'maintenance',
        priority: 'low',
        title: 'Mantener fortalezas',
        description: 'Continúa practicando tus áreas más fuertes',
        actionable: true,
        actions: [
          'Revisión periódica de competencias dominadas',
          'Práctica de mantenimiento',
          'Explorar variaciones avanzadas'
        ],
        data: {
          strongAreas: strongAreas.slice(0, 3)
        },
        estimatedImpact: 'low'
      })
    }

    return recommendations
  }

  /**
   * Prioriza y filtra recomendaciones
   */
  prioritizeRecommendations(categories) {
    const allRecommendations = []

    // Recopilar todas las recomendaciones con sus pesos
    Object.entries(categories).forEach(([category, recommendations]) => {
      const weight = RECOMMENDATION_CONFIG.weights[category] || 0.5
      recommendations.forEach(rec => {
        allRecommendations.push({
          ...rec,
          category,
          weight,
          score: this.calculateRecommendationScore(rec, weight)
        })
      })
    })

    // Ordenar por puntuación (descendente)
    allRecommendations.sort((a, b) => b.score - a.score)

    // Filtrar duplicados y limitar cantidad
    const filtered = this.filterRecommendations(allRecommendations)

    return filtered.slice(0, 8) // Máximo 8 recomendaciones
  }

  /**
   * Calcula puntuación de recomendación para priorización
   */
  calculateRecommendationScore(recommendation, weight) {
    let score = weight

    // Ajustar por prioridad
    const priorityMultipliers = { high: 3, medium: 2, low: 1 }
    score *= priorityMultipliers[recommendation.priority] || 1

    // Ajustar por impacto estimado
    const impactMultipliers = { high: 2, medium: 1.5, low: 1, motivational: 0.8 }
    score *= impactMultipliers[recommendation.estimatedImpact] || 1

    // Bonus por accionabilidad
    if (recommendation.actionable) {
      score *= 1.2
    }

    return score
  }

  /**
   * Filtra recomendaciones duplicadas y no relevantes
   */
  filterRecommendations(recommendations) {
    const seen = new Set()
    const filtered = []

    for (const rec of recommendations) {
      // Evitar duplicados por ID
      if (seen.has(rec.id)) continue
      seen.add(rec.id)

      // Verificar cooldown para evitar spam
      const lastShown = this.lastRecommendations.get(rec.id)
      if (lastShown && (Date.now() - lastShown) < RECOMMENDATION_CONFIG.temporal.reminderCooldown) {
        continue
      }

      filtered.push(rec)
      this.lastRecommendations.set(rec.id, Date.now())
    }

    return filtered
  }

  /**
   * Calcula estadísticas de resumen
   */
  calculateSummaryStats(categories) {
    let total = 0
    let high = 0
    let medium = 0
    let low = 0

    Object.values(categories).forEach(recommendations => {
      recommendations.forEach(rec => {
        total++
        switch (rec.priority) {
          case 'high': high++; break
          case 'medium': medium++; break
          case 'low': low++; break
        }
      })
    })

    return { totalRecommendations: total, highPriority: high, mediumPriority: medium, lowPriority: low }
  }

  /**
   * Extrae evidencia de apoyo para recomendaciones
   */
  extractSupportingEvidence(evaluation, recommendationType) {
    const evidence = []

    if (recommendationType === 'level_up') {
      if (evaluation.evaluation.accuracy.score > 0.8) {
        evidence.push(`Alta precisión: ${Math.round(evaluation.evaluation.accuracy.score * 100)}%`)
      }
      if (evaluation.evaluation.consistency.score > 0.7) {
        evidence.push('Rendimiento consistente')
      }
      if (evaluation.evaluation.coverage.score > 0.7) {
        evidence.push('Buena cobertura de competencias')
      }
    }

    if (recommendationType === 'level_down') {
      if (evaluation.evaluation.accuracy.score < 0.6) {
        evidence.push(`Precisión baja: ${Math.round(evaluation.evaluation.accuracy.score * 100)}%`)
      }
      if (evaluation.evaluation.consistency.score < 0.5) {
        evidence.push('Rendimiento inconsistente')
      }
    }

    return evidence
  }

  /**
   * Obtiene índice numérico del nivel
   */
  getLevelIndex(level) {
    const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
    return levels.indexOf(level)
  }

  /**
   * Obtiene evaluación dinámica
   */
  async getDynamicEvaluation(userId) {
    try {
      const evaluator = getDynamicLevelEvaluator()
      return await evaluator.evaluateEffectiveLevel(userId)
    } catch (error) {
      console.warn('Error getting dynamic evaluation:', error)
      return null
    }
  }

  /**
   * Obtiene progreso dinámico
   */
  async getDynamicProgress(userId) {
    try {
      const calculator = getLevelProgressCalculator()
      return await calculator.calculateLevelProgress(userId)
    } catch (error) {
      console.warn('Error getting dynamic progress:', error)
      return null
    }
  }

  /**
   * Devuelve recomendaciones por defecto en caso de error
   */
  getDefaultRecommendations(userId) {
    return {
      userId,
      timestamp: Date.now(),
      categories: {
        levelChange: [],
        competencyGaps: [],
        practiceOptimization: [{
          id: 'default-practice',
          type: 'practice_optimization',
          priority: 'medium',
          title: 'Continúa practicando',
          description: 'Mantén una rutina de práctica regular',
          actionable: true,
          actions: ['Practicar diariamente', 'Revisar errores', 'Mantener constancia'],
          data: {},
          estimatedImpact: 'medium'
        }],
        motivational: [],
        maintenance: []
      },
      summary: {
        totalRecommendations: 1,
        highPriority: 0,
        mediumPriority: 1,
        lowPriority: 0
      },
      prioritized: []
    }
  }

  /**
   * Limpia el cache
   */
  clearCache() {
    this.cache.clear()
  }

  /**
   * Limpia el historial de recomendaciones mostradas
   */
  clearRecommendationHistory() {
    this.lastRecommendations.clear()
  }
}

// Instancia global del motor
let globalRecommendationEngine = null

export function getLevelRecommendationEngine() {
  if (!globalRecommendationEngine) {
    globalRecommendationEngine = new LevelRecommendationEngine()
  }
  return globalRecommendationEngine
}

/**
 * Función de conveniencia para generar recomendaciones
 */
export async function generateUserRecommendations(userId, options = {}) {
  const engine = getLevelRecommendationEngine()
  return await engine.generateRecommendations(userId, options)
}

/**
 * Función para obtener solo recomendaciones de alta prioridad
 */
export async function getHighPriorityRecommendations(userId) {
  const recommendations = await generateUserRecommendations(userId)
  return recommendations.prioritized.filter(rec => rec.priority === 'high')
}

/**
 * Función para obtener recomendaciones accionables
 */
export async function getActionableRecommendations(userId) {
  const recommendations = await generateUserRecommendations(userId)
  return recommendations.prioritized.filter(rec => rec.actionable)
}