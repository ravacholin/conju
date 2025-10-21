// Sistema de recomendaciones ML para personalización avanzada
// Integra múltiples fuentes de inteligencia para generar recomendaciones holísticas

import { PROGRESS_CONFIG } from './config.js'
import { learningPathPredictor } from './learningPathPredictor.js'
import { confidenceEngine } from './confidenceEngine.js'
import { temporalIntelligence } from './temporalIntelligence.js'
import { flowDetector, FLOW_STATES } from './flowStateDetection.js'
import { intelligentFSRS } from './fsrs.js'
// import { getMasteryByUser } from './database.js' // TODO: Use when implementing full ML features
import { getCurrentUserId } from './userManager/index.js'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('progress:mlRecommendations')

/**
 * Generador de recomendaciones ML que integra todos los sistemas de inteligencia
 */
export class MLRecommendationEngine {
  constructor(userId = null) {
    this.userId = userId || getCurrentUserId()
    this.isEnabled = PROGRESS_CONFIG.FEATURE_FLAGS.ML_RECOMMENDATIONS

    // Weights para combinar diferentes tipos de recomendaciones
    this.systemWeights = {
      LEARNING_PATH_PREDICTOR: 0.30,  // Predicciones de secuencia
      CONFIDENCE_BASED: 0.25,         // Basado en confianza
      TEMPORAL_OPTIMIZATION: 0.20,    // Optimización temporal
      FLOW_STATE_ADAPTATION: 0.15,    // Adaptación a flow state
      SRS_INTELLIGENCE: 0.10          // Inteligencia SRS
    }

    // Cache para recomendaciones complejas
    this.recommendationCache = new Map()
    this.cacheTimeout = 5 * 60 * 1000 // 5 minutos

    // Safe logging - avoid TDZ during module initialization
    try {
      logger?.systemInit?.('ML Recommendation Engine initialized')
    } catch (e) {
      // Logger not ready yet
    }
  }

  /**
   * Genera recomendaciones ML completas para una sesión
   * @param {Object} sessionConfig - Configuración de la sesión
   * @returns {Promise<Object>} Recomendaciones completas
   */
  async generateSessionRecommendations(sessionConfig = {}) {
    try {
      if (!this.isEnabled) {
        return this.getBasicRecommendations(sessionConfig)
      }

      const {
        duration = 20,              // minutos
        preferredDifficulty = 'medium', // easy, medium, hard
        includeNewContent = true,
        focusAreas = [],           // áreas específicas de enfoque
        adaptToState = true        // adaptar a estado emocional/temporal
      } = sessionConfig

      // Usar variables para evitar eslint warnings
      void preferredDifficulty
      void includeNewContent
      void focusAreas
      void adaptToState

      // Verificar cache
      const cacheKey = this.generateCacheKey(sessionConfig)
      if (this.recommendationCache.has(cacheKey)) {
        const cached = this.recommendationCache.get(cacheKey)
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          logger.debug('Using cached ML recommendations')
          return cached.data
        }
      }

      // Generar recomendaciones desde múltiples fuentes
      const recommendations = await this.generateMultiSourceRecommendations(sessionConfig)

      // Combinar y optimizar usando ML
      const optimizedRecommendations = this.optimizeWithML(recommendations, sessionConfig)

      // Generar plan de sesión completo
      const sessionPlan = this.buildSessionPlan(optimizedRecommendations, sessionConfig)

      // Cache resultados
      this.recommendationCache.set(cacheKey, {
        data: sessionPlan,
        timestamp: Date.now()
      })

      logger.debug('ML recommendations generated', {
        sourcesUsed: Object.keys(recommendations).length,
        finalRecommendations: sessionPlan.recommendations.length,
        duration
      })

      return sessionPlan

    } catch (error) {
      logger.error('Error generating ML recommendations:', error)
      return this.getBasicRecommendations(sessionConfig)
    }
  }

  /**
   * Genera recomendaciones desde múltiples fuentes de inteligencia
   */
  async generateMultiSourceRecommendations(sessionConfig) {
    const sources = {}

    // Fuente 1: Learning Path Predictor
    if (PROGRESS_CONFIG.FEATURE_FLAGS.ML_RECOMMENDATIONS) {
      try {
        sources.pathPredictor = await learningPathPredictor.predictNextOptimalCombinations({
          sessionLength: sessionConfig.duration,
          maxCombinations: 10,
          includeNewContent: sessionConfig.includeNewContent,
          difficultyTolerance: sessionConfig.preferredDifficulty
        })
      } catch (error) {
        logger.warn('Path predictor failed:', error)
        sources.pathPredictor = []
      }
    }

    // Fuente 2: Confidence-based recommendations
    if (PROGRESS_CONFIG.FEATURE_FLAGS.EMOTIONAL_SRS_INTEGRATION) {
      sources.confidence = this.generateConfidenceRecommendations(sessionConfig)
    }

    // Fuente 3: Temporal optimization
    if (PROGRESS_CONFIG.FEATURE_FLAGS.TEMPORAL_SCHEDULING) {
      sources.temporal = this.generateTemporalRecommendations(sessionConfig)
    }

    // Fuente 4: Flow state adaptation
    sources.flowState = this.generateFlowStateRecommendations(sessionConfig)

    // Fuente 5: SRS intelligence
    sources.srs = await this.generateSRSRecommendations(sessionConfig)

    return sources
  }

  /**
   * Genera recomendaciones basadas en confianza
   */
  generateConfidenceRecommendations(_sessionConfig) {
    const confidenceState = confidenceEngine.getCurrentConfidenceState()
    const recommendations = []

    // Recomendaciones basadas en nivel de confianza
    switch (confidenceState.level) {
      case 'struggling':
        recommendations.push({
          type: 'confidence_building',
          priority: 0.9,
          message: 'Enfoque en construcción de confianza',
          suggestedApproach: 'easier_content_high_repetition',
          targetAreas: confidenceState.improvementAreas.slice(0, 2)
        })
        break

      case 'hesitant':
        recommendations.push({
          type: 'guided_practice',
          priority: 0.7,
          message: 'Práctica guiada con feedback positivo',
          suggestedApproach: 'mixed_difficulty_with_hints',
          targetAreas: confidenceState.improvementAreas.slice(0, 3)
        })
        break

      case 'confident':
        recommendations.push({
          type: 'challenge_practice',
          priority: 0.6,
          message: 'Momento para desafíos avanzados',
          suggestedApproach: 'harder_content_less_support',
          targetAreas: ['new_content', 'advanced_combinations']
        })
        break

      case 'overconfident':
        recommendations.push({
          type: 'calibration_practice',
          priority: 0.8,
          message: 'Calibrar confianza con contenido desafiante',
          suggestedApproach: 'unexpected_difficulty_feedback',
          targetAreas: confidenceState.strongAreas.slice(0, 2)
        })
        break
    }

    return recommendations
  }

  /**
   * Genera recomendaciones basadas en temporal intelligence
   */
  generateTemporalRecommendations(sessionConfig) {
    const temporalState = temporalIntelligence.getCurrentTemporalStats()
    const schedulingRecs = temporalIntelligence.getSRSSchedulingRecommendations()
    const recommendations = []

    // Recomendaciones de timing
    if (schedulingRecs.shouldDelay) {
      recommendations.push({
        type: 'timing_adjustment',
        priority: 0.8,
        message: 'Momento no óptimo - considera sesión más corta',
        suggestedApproach: 'shortened_session_light_review',
        adjustments: { duration: sessionConfig.duration * 0.6 }
      })
    } else if (schedulingRecs.isOptimalTime) {
      recommendations.push({
        type: 'timing_optimization',
        priority: 0.7,
        message: 'Momento óptimo para sesión intensa',
        suggestedApproach: 'extended_challenging_session',
        adjustments: { duration: sessionConfig.duration * 1.2 }
      })
    }

    // Recomendaciones basadas en fatiga
    if (temporalState.currentFatigue > 0.7) {
      recommendations.push({
        type: 'fatigue_management',
        priority: 0.9,
        message: 'Alta fatiga detectada - contenido ligero',
        suggestedApproach: 'easy_review_short_bursts',
        adjustments: { difficulty: 'easy', breaks: true }
      })
    }

    return recommendations
  }

  /**
   * Genera recomendaciones basadas en flow state
   */
  generateFlowStateRecommendations(sessionConfig) {
    const flowMetrics = flowDetector.getFlowMetrics()
    const flowRecs = flowDetector.getSRSSchedulingRecommendations()
    const recommendations = []

    // Use flowRecs for future expansion
    void flowRecs

    switch (flowMetrics.currentState) {
      case FLOW_STATES.DEEP_FLOW:
        recommendations.push({
          type: 'flow_maintenance',
          priority: 0.9,
          message: 'En flow profundo - mantener momentum',
          suggestedApproach: 'maintain_difficulty_extend_session',
          adjustments: {
            duration: (sessionConfig.duration || 20) * 1.3,
            breaks: false,
            difficulty: 'current'
          }
        })
        break

      case FLOW_STATES.FRUSTRATED:
        recommendations.push({
          type: 'flow_recovery',
          priority: 0.95,
          message: 'Frustración detectada - recovery necesario',
          suggestedApproach: 'confidence_building_easy_wins',
          adjustments: {
            difficulty: 'easy',
            duration: (sessionConfig.duration || 20) * 0.5,
            positiveReinforcement: true
          }
        })
        break

      case FLOW_STATES.STRUGGLING:
        recommendations.push({
          type: 'flow_support',
          priority: 0.8,
          message: 'Dificultades detectadas - soporte adaptativo',
          suggestedApproach: 'guided_practice_hints_available',
          adjustments: {
            difficulty: 'easier',
            hintsEnabled: true,
            encouragement: true
          }
        })
        break
    }

    return recommendations
  }

  /**
   * Genera recomendaciones basadas en SRS intelligence
   */
  async generateSRSRecommendations(_sessionConfig) {
    const recommendations = []

    try {
      const srsMetrics = intelligentFSRS.getMetrics()

      // Recomendaciones basadas en éxito de FSRS
      if (srsMetrics.fsrsSuccessRate < 0.8 && srsMetrics.totalCalculations > 10) {
        recommendations.push({
          type: 'srs_optimization',
          priority: 0.6,
          message: 'Optimizar parámetros SRS para mejor rendimiento',
          suggestedApproach: 'parameter_tuning_review_focus',
          targetAreas: ['review_optimization']
        })
      }

      // Recomendaciones basadas en ajustes emocionales/temporales
      if (srsMetrics.emotionalAdjustments > srsMetrics.temporalAdjustments * 2) {
        recommendations.push({
          type: 'emotional_balance',
          priority: 0.7,
          message: 'Muchos ajustes emocionales - trabajar en estabilidad',
          suggestedApproach: 'emotional_regulation_practice',
          targetAreas: ['confidence_building', 'stress_management']
        })
      }

    } catch (error) {
      logger.warn('SRS recommendations failed:', error)
    }

    return recommendations
  }

  /**
   * Optimiza recomendaciones usando ML ligero
   */
  optimizeWithML(sources, sessionConfig) {
    const allRecommendations = []

    // Recopilar todas las recomendaciones con pesos
    Object.entries(sources).forEach(([sourceType, recommendations]) => {
      const weight = this.systemWeights[sourceType.toUpperCase().replace('PATHPREDICTOR', 'LEARNING_PATH_PREDICTOR')] || 0.1

      recommendations.forEach(rec => {
        allRecommendations.push({
          ...rec,
          source: sourceType,
          weightedPriority: (rec.priority || 0.5) * weight,
          originalPriority: rec.priority || 0.5
        })
      })
    })

    // Algoritmo de optimización simple
    const optimized = this.applyOptimizationAlgorithm(allRecommendations, sessionConfig)

    return optimized
  }

  /**
   * Aplica algoritmo de optimización para combinar recomendaciones
   */
  applyOptimizationAlgorithm(recommendations, sessionConfig) {
    // Paso 1: Agrupar por tipo y resolver conflictos
    const grouped = this.groupAndResolveConflicts(recommendations)

    // Paso 2: Aplicar constrains de sesión
    const constrained = this.applySessionConstraints(grouped, sessionConfig)

    // Paso 3: Balancear para evitar monotonía
    const balanced = this.balanceRecommendations(constrained)

    // Paso 4: Ordenar por prioridad optimizada
    return balanced.sort((a, b) => b.weightedPriority - a.weightedPriority)
  }

  /**
   * Agrupa recomendaciones similares y resuelve conflictos
   */
  groupAndResolveConflicts(recommendations) {
    const grouped = new Map()

    recommendations.forEach(rec => {
      const key = rec.type || 'general'

      if (!grouped.has(key)) {
        grouped.set(key, [])
      }
      grouped.get(key).push(rec)
    })

    // Resolver conflictos eligiendo la recomendación de mayor prioridad
    const resolved = []
    grouped.forEach(group => {
      if (group.length === 1) {
        resolved.push(group[0])
      } else {
        // Combinar recomendaciones similares
        const combined = this.combineRecommendations(group)
        resolved.push(combined)
      }
    })

    return resolved
  }

  /**
   * Combina recomendaciones similares en una sola
   */
  combineRecommendations(group) {
    const base = group.reduce((best, current) =>
      current.weightedPriority > best.weightedPriority ? current : best
    )

    // Combinar mensajes y ajustes
    const combinedMessage = group
      .map(r => r.message)
      .filter((msg, idx, arr) => arr.indexOf(msg) === idx)
      .join(' + ')

    const combinedAdjustments = group.reduce((acc, rec) => {
      return { ...acc, ...rec.adjustments }
    }, {})

    return {
      ...base,
      message: combinedMessage,
      adjustments: combinedAdjustments,
      sources: group.map(r => r.source),
      combinedFrom: group.length
    }
  }

  /**
   * Aplica restricciones de sesión
   */
  applySessionConstraints(recommendations, sessionConfig) {
    return recommendations.filter(rec => {
      // Filtrar recomendaciones que no encajan en la duración
      if (rec.adjustments?.duration && rec.adjustments.duration > sessionConfig.duration * 1.5) {
        return false
      }

      // Filtrar si no incluye contenido nuevo pero se requiere
      if (sessionConfig.includeNewContent === false && rec.targetAreas?.includes('new_content')) {
        return false
      }

      return true
    })
  }

  /**
   * Balancea recomendaciones para evitar monotonía
   */
  balanceRecommendations(recommendations) {
    // Asegurar diversidad de tipos
    const types = new Set(recommendations.map(r => r.type))
    if (types.size < 2 && recommendations.length > 2) {
      // Agregar recomendación de variedad
      recommendations.push({
        type: 'variety_injection',
        priority: 0.4,
        weightedPriority: 0.4,
        message: 'Agregar variedad para mantener interés',
        suggestedApproach: 'mixed_content_surprise_elements'
      })
    }

    return recommendations
  }

  /**
   * Construye plan completo de sesión
   */
  buildSessionPlan(recommendations, sessionConfig) {
    return {
      sessionId: `ml_session_${Date.now()}`,
      duration: sessionConfig.duration,
      generatedAt: new Date().toISOString(),

      recommendations: recommendations.slice(0, 5), // Top 5 recomendaciones

      sessionStructure: this.buildSessionStructure(recommendations, sessionConfig),

      adaptations: this.extractAdaptations(recommendations),

      metrics: {
        confidenceLevel: confidenceEngine.getCurrentConfidenceState().level,
        flowState: flowDetector.getFlowMetrics().currentState,
        optimalTiming: temporalIntelligence.getSRSSchedulingRecommendations().isOptimalTime,
        predictedSuccess: this.calculatePredictedSuccess(recommendations)
      },

      fallbackPlan: this.generateFallbackPlan(sessionConfig)
    }
  }

  /**
   * Construye estructura de sesión recomendada
   */
  buildSessionStructure(recommendations, sessionConfig) {
    const structure = {
      phases: [],
      totalDuration: sessionConfig.duration,
      flexibility: 'medium'
    }

    // Fase warm-up (siempre incluir)
    structure.phases.push({
      name: 'warm_up',
      duration: Math.min(5, sessionConfig.duration * 0.2),
      approach: 'easy_familiar_content',
      purpose: 'confidence_building'
    })

    // Fase principal basada en recomendaciones
    const mainApproach = this.determineMainApproach(recommendations)
    structure.phases.push({
      name: 'main_practice',
      duration: sessionConfig.duration * 0.6,
      approach: mainApproach,
      purpose: 'skill_development'
    })

    // Fase cierre
    structure.phases.push({
      name: 'consolidation',
      duration: sessionConfig.duration * 0.2,
      approach: 'review_success_celebration',
      purpose: 'retention_building'
    })

    return structure
  }

  /**
   * Determina enfoque principal de la sesión
   */
  determineMainApproach(recommendations) {
    // Analizar recomendaciones principales
    const topRec = recommendations[0]
    if (!topRec) return 'balanced_practice'

    const approachMap = {
      'confidence_building': 'easy_content_high_success',
      'flow_maintenance': 'optimal_challenge_sustained',
      'fatigue_management': 'light_review_short_bursts',
      'challenge_practice': 'advanced_content_stretch_goals'
    }

    return approachMap[topRec.type] || topRec.suggestedApproach || 'balanced_practice'
  }

  /**
   * Extrae adaptaciones de las recomendaciones
   */
  extractAdaptations(recommendations) {
    const adaptations = {
      difficulty: 'medium',
      pace: 'normal',
      support: 'standard',
      feedback: 'standard'
    }

    recommendations.forEach(rec => {
      if (rec.adjustments) {
        Object.assign(adaptations, rec.adjustments)
      }
    })

    return adaptations
  }

  /**
   * Calcula probabilidad de éxito de la sesión
   */
  calculatePredictedSuccess(recommendations) {
    if (recommendations.length === 0) return 0.5

    const avgPriority = recommendations.reduce((sum, rec) => sum + rec.weightedPriority, 0) / recommendations.length
    const confidenceBonus = confidenceEngine.getCurrentConfidenceState().overall * 0.3
    const flowBonus = flowDetector.getFlowMetrics().consistencyScore / 100 * 0.2

    return Math.min(1, avgPriority + confidenceBonus + flowBonus)
  }

  /**
   * Genera plan de fallback
   */
  generateFallbackPlan(sessionConfig) {
    return {
      trigger: 'if_recommendations_fail',
      approach: 'balanced_mixed_practice',
      duration: sessionConfig.duration,
      difficulty: sessionConfig.preferredDifficulty || 'medium'
    }
  }

  /**
   * Genera clave de cache
   */
  generateCacheKey(sessionConfig) {
    return `ml_rec_${JSON.stringify(sessionConfig)}_${Math.floor(Date.now() / this.cacheTimeout)}`
  }

  /**
   * Recomendaciones básicas cuando ML está deshabilitado
   */
  getBasicRecommendations(sessionConfig) {
    return {
      sessionId: `basic_session_${Date.now()}`,
      duration: sessionConfig.duration,
      generatedAt: new Date().toISOString(),

      recommendations: [{
        type: 'basic_practice',
        priority: 0.5,
        message: 'Sesión de práctica estándar',
        suggestedApproach: 'balanced_mixed_content'
      }],

      sessionStructure: {
        phases: [{
          name: 'full_session',
          duration: sessionConfig.duration,
          approach: 'standard_practice'
        }]
      },

      adaptations: {
        difficulty: sessionConfig.preferredDifficulty || 'medium'
      }
    }
  }

  /**
   * Limpia cache de recomendaciones
   */
  clearCache() {
    this.recommendationCache.clear()
  }
}

// Instancia singleton
export const mlRecommendationEngine = new MLRecommendationEngine()

/**
 * Función helper para uso directo
 */
export async function generateSmartRecommendations(sessionConfig = {}) {
  return mlRecommendationEngine.generateSessionRecommendations(sessionConfig)
}

// Debug en navegador
if (typeof window !== 'undefined') {
  window.SpanishConjugator = window.SpanishConjugator || {}
  window.SpanishConjugator.MLRecommendations = {
    generate: generateSmartRecommendations,
    clearCache: () => mlRecommendationEngine.clearCache(),
    instance: mlRecommendationEngine
  }
}

export default mlRecommendationEngine