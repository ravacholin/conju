// Adaptive Difficulty Engine - Ajusta dificultad en tiempo real basado en flow state
// Integra FlowStateDetector + DifficultyManager para experiencia personalizada

import { FlowStateDetector, FLOW_STATES } from './flowStateDetection.js'
import { DifficultyManager } from './DifficultyManager.js'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('progress:AdaptiveDifficultyEngine')
const isDev = import.meta?.env?.DEV

/**
 * Motor de Dificultad Adaptativa
 * Ajusta ejercicios en tiempo real según el estado de flow del usuario
 */
export class AdaptiveDifficultyEngine {
  constructor(userId = null) {
    this.userId = userId
    this.flowDetector = new FlowStateDetector()
    this.difficultyManager = new DifficultyManager(userId)

    // Estado interno
    this.sessionStartTime = Date.now()
    this.responsesProcessed = 0
    this.adjustmentHistory = []
    this.currentDifficultyBoost = 0 // -2 a +2 (muy fácil a muy difícil)

    // Configuración de ajustes
    this.config = {
      minResponsesBeforeAdjustment: 5, // Mínimo de respuestas antes de ajustar
      adjustmentCooldown: 30000, // 30s entre ajustes
      maxBoostLevel: 2,
      minBoostLevel: -2,
      flowStateWeights: {
        [FLOW_STATES.DEEP_FLOW]: 1.5,
        [FLOW_STATES.LIGHT_FLOW]: 1.0,
        [FLOW_STATES.NEUTRAL]: 0.0,
        [FLOW_STATES.STRUGGLING]: -1.0,
        [FLOW_STATES.FRUSTRATED]: -1.5
      }
    }

    this.lastAdjustmentTime = 0
    this.enabled = true
  }

  /**
   * Procesa una nueva respuesta del usuario y ajusta dificultad si es necesario
   * @param {Object} response - Respuesta del usuario
   * @param {boolean} response.correct - Si fue correcta
   * @param {number} response.latency - Tiempo en ms
   * @param {string} response.verbId - ID del verbo
   * @param {string} response.mood - Mood practicado
   * @param {string} response.tense - Tense practicado
   * @returns {Object} Estado y recomendaciones
   */
  processResponse(response) {
    this.responsesProcessed++

    // Procesar con flow detector
    const flowAnalysis = this.flowDetector.processResponse(response)

    // Determinar si necesitamos ajustar dificultad
    const shouldAdjust = this.shouldAdjustDifficulty(flowAnalysis)

    let adjustment = null
    if (shouldAdjust) {
      adjustment = this.calculateDifficultyAdjustment(flowAnalysis)
      this.applyAdjustment(adjustment)
    }

    return {
      flowState: flowAnalysis.currentState,
      difficultyBoost: this.currentDifficultyBoost,
      adjustment,
      recommendations: this.generateRecommendations(flowAnalysis),
      metrics: {
        responsesProcessed: this.responsesProcessed,
        sessionDuration: Date.now() - this.sessionStartTime,
        totalAdjustments: this.adjustmentHistory.length
      }
    }
  }

  /**
   * Determina si es momento de ajustar dificultad
   */
  shouldAdjustDifficulty(flowAnalysis) {
    if (!this.enabled) return false

    // Necesitamos mínimo de respuestas
    if (this.responsesProcessed < this.config.minResponsesBeforeAdjustment) {
      return false
    }

    // Cooldown entre ajustes
    const timeSinceLastAdjustment = Date.now() - this.lastAdjustmentTime
    if (timeSinceLastAdjustment < this.config.adjustmentCooldown) {
      return false
    }

    // Ajustar si hay cambio significativo de estado
    if (flowAnalysis.stateChanged) {
      return true
    }

    // Ajustar si llevamos mucho tiempo en flow profundo o frustrado
    const currentState = flowAnalysis.currentState
    if (currentState === FLOW_STATES.DEEP_FLOW || currentState === FLOW_STATES.FRUSTRATED) {
      return true
    }

    return false
  }

  /**
   * Calcula el ajuste de dificultad apropiado
   */
  calculateDifficultyAdjustment(flowAnalysis) {
    const currentState = flowAnalysis.currentState
    const weight = this.config.flowStateWeights[currentState] || 0

    // Calcular nuevo boost level
    let targetBoost = Math.round(weight)

    // No cambiar más de 1 nivel a la vez (suavizar transiciones)
    const currentBoost = this.currentDifficultyBoost
    if (targetBoost > currentBoost) {
      targetBoost = Math.min(targetBoost, currentBoost + 1)
    } else if (targetBoost < currentBoost) {
      targetBoost = Math.max(targetBoost, currentBoost - 1)
    }

    // Respetar límites
    targetBoost = Math.max(
      this.config.minBoostLevel,
      Math.min(this.config.maxBoostLevel, targetBoost)
    )

    const adjustment = {
      from: currentBoost,
      to: targetBoost,
      reason: this.getAdjustmentReason(currentState, targetBoost),
      timestamp: Date.now(),
      flowState: currentState,
      metrics: flowAnalysis.flowMetrics
    }

    if (isDev) {
      logger.debug('Calculated difficulty adjustment', adjustment)
    }

    return adjustment
  }

  /**
   * Aplica el ajuste de dificultad
   */
  applyAdjustment(adjustment) {
    const oldBoost = this.currentDifficultyBoost
    this.currentDifficultyBoost = adjustment.to
    this.lastAdjustmentTime = Date.now()

    this.adjustmentHistory.push(adjustment)

    // Mantener historial limitado
    if (this.adjustmentHistory.length > 20) {
      this.adjustmentHistory.shift()
    }

    logger.info('Difficulty adjusted', {
      from: oldBoost,
      to: this.currentDifficultyBoost,
      reason: adjustment.reason
    })

    // Disparar evento para UI
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('adaptive-difficulty-changed', {
        detail: {
          boost: this.currentDifficultyBoost,
          adjustment
        }
      }))
    }
  }

  /**
   * Genera razón legible del ajuste
   */
  getAdjustmentReason(flowState, targetBoost) {
    if (flowState === FLOW_STATES.DEEP_FLOW && targetBoost > 0) {
      return 'You\'re in deep flow! Increasing challenge to keep you engaged.'
    }
    if (flowState === FLOW_STATES.LIGHT_FLOW && targetBoost > 0) {
      return 'Great rhythm! Slightly increasing difficulty.'
    }
    if (flowState === FLOW_STATES.STRUGGLING && targetBoost < 0) {
      return 'Let\'s ease up a bit to build confidence.'
    }
    if (flowState === FLOW_STATES.FRUSTRATED && targetBoost < 0) {
      return 'Reducing difficulty to help you recover momentum.'
    }
    if (targetBoost === 0) {
      return 'Returning to balanced difficulty.'
    }
    return 'Adjusting difficulty based on your performance.'
  }

  /**
   * Genera recomendaciones para el generator
   * @returns {Object} Configuración para generator.js
   */
  generateRecommendations(flowAnalysis) {
    const boost = this.currentDifficultyBoost

    const recommendations = {
      difficultyBoost: boost,
      suggestedChanges: [],
      verbPoolAdjustment: null,
      tenseComplexityAdjustment: null
    }

    // Boost positivo: aumentar dificultad
    if (boost > 0) {
      recommendations.suggestedChanges.push('increase_irregular_weight')
      recommendations.suggestedChanges.push('prefer_harder_tenses')

      // Ajustar pool de verbos hacia irregulares
      recommendations.verbPoolAdjustment = {
        irregularWeight: 1.0 + (boost * 0.3), // +30% por nivel
        regularWeight: 1.0 - (boost * 0.2)    // -20% por nivel
      }

      // Preferir tenses complejos
      recommendations.tenseComplexityAdjustment = {
        preferSubjunctive: boost >= 1,
        preferCompound: boost >= 2,
        avoidPresent: boost >= 2
      }
    }

    // Boost negativo: reducir dificultad
    if (boost < 0) {
      recommendations.suggestedChanges.push('decrease_irregular_weight')
      recommendations.suggestedChanges.push('prefer_easier_tenses')

      // Ajustar pool hacia regulares
      recommendations.verbPoolAdjustment = {
        irregularWeight: 1.0 + (boost * 0.2), // -20% por nivel
        regularWeight: 1.0 - (boost * 0.3)    // +30% por nivel
      }

      // Preferir tenses simples
      recommendations.tenseComplexityAdjustment = {
        preferPresent: Math.abs(boost) >= 1,
        avoidSubjunctive: Math.abs(boost) >= 1,
        avoidCompound: Math.abs(boost) >= 2
      }
    }

    return recommendations
  }

  /**
   * Obtiene la configuración actual para aplicar al generator
   * @returns {Object} Configuración de dificultad
   */
  getDifficultyConfig() {
    return {
      enabled: this.enabled,
      currentBoost: this.currentDifficultyBoost,
      flowState: this.flowDetector.currentState,
      recommendations: this.generateRecommendations({
        currentState: this.flowDetector.currentState,
        flowMetrics: this.flowDetector.getFlowMetrics()
      })
    }
  }

  /**
   * Resetea el engine para nueva sesión
   */
  reset() {
    this.flowDetector.reset()
    this.sessionStartTime = Date.now()
    this.responsesProcessed = 0
    this.currentDifficultyBoost = 0
    this.adjustmentHistory = []
    this.lastAdjustmentTime = 0

    logger.info('Adaptive Difficulty Engine reset')
  }

  /**
   * Habilita/deshabilita el engine
   */
  setEnabled(enabled) {
    this.enabled = enabled
    logger.info(`Adaptive Difficulty Engine ${enabled ? 'enabled' : 'disabled'}`)
  }

  /**
   * Obtiene estadísticas de la sesión
   */
  getSessionStats() {
    return {
      enabled: this.enabled,
      responsesProcessed: this.responsesProcessed,
      sessionDuration: Date.now() - this.sessionStartTime,
      currentBoost: this.currentDifficultyBoost,
      flowState: this.flowDetector.currentState,
      totalAdjustments: this.adjustmentHistory.length,
      adjustmentHistory: this.adjustmentHistory.slice(-10), // Últimos 10
      flowMetrics: this.flowDetector.getFlowMetrics()
    }
  }
}

// Singleton global para uso en toda la app
let globalAdaptiveEngine = null

/**
 * Obtiene o crea la instancia global del engine
 */
export function getAdaptiveEngine(userId = null) {
  if (!globalAdaptiveEngine) {
    globalAdaptiveEngine = new AdaptiveDifficultyEngine(userId)
  }
  return globalAdaptiveEngine
}

/**
 * Resetea la instancia global
 */
export function resetAdaptiveEngine() {
  if (globalAdaptiveEngine) {
    globalAdaptiveEngine.reset()
  }
}

// Exponer en window para debugging
if (typeof window !== 'undefined' && isDev) {
  window.adaptiveEngine = {
    get: getAdaptiveEngine,
    reset: resetAdaptiveEngine,
    stats: () => globalAdaptiveEngine?.getSessionStats()
  }
  logger.info('🎯 Adaptive Difficulty Engine debug interface available at window.adaptiveEngine')
}

export default AdaptiveDifficultyEngine
