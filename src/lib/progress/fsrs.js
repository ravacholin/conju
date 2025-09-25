// Implementación FSRS (Free Spaced Repetition Scheduler) para el sistema de progreso
// Integración con femto-fsrs con compatibilidad hacia atrás con SM-2

import { createDeck, Grade } from 'femto-fsrs'
import { PROGRESS_CONFIG } from './config.js'
import { ERROR_TAGS } from './dataModels.js'
import { confidenceEngine } from './confidenceEngine.js'
import { temporalIntelligence } from './temporalIntelligence.js'
import { FLOW_STATES, flowDetector } from './flowStateDetection.js'
import { logger } from './logger.js'
import { shouldUseFSRS } from './abTesting.js'

// Mapeo de ratings FSRS (1-4) a nuestros conceptos
const FSRS_RATINGS = {
  AGAIN: 1,    // Fallo total - reaprender
  HARD: 2,     // Difícil - reducir intervalo
  GOOD: 3,     // Bien - intervalo estándar
  EASY: 4      // Fácil - aumentar intervalo
}

/**
 * Wrapper inteligente para FSRS que integra IA emocional y temporal
 */
export class IntelligentFSRS {
  constructor() {
    this.fsrsConfig = PROGRESS_CONFIG.FSRS
    this.featureFlags = PROGRESS_CONFIG.FEATURE_FLAGS

    // Inicializar core FSRS con parámetros configurados
    this.deck = createDeck({
      w: this.fsrsConfig.WEIGHTS,
      requestedRetentionRate: this.fsrsConfig.REQUEST_RETENTION,
      maxStability: this.fsrsConfig.MAXIMUM_INTERVAL
    })

    // Estado para métricas de comparación
    this.metrics = {
      fsrsUsage: 0,
      sm2Fallbacks: 0,
      emotionalAdjustments: 0,
      temporalAdjustments: 0
    }

    logger.systemInit('Intelligent FSRS initialized')
  }

  /**
   * Calcula el próximo intervalo usando FSRS con inteligencia integrada
   * Mantiene compatibilidad con la interface existente de calculateNextInterval
   */
  calculateNextInterval(schedule, correct, hintsUsed, meta = {}) {
    try {
      // Si FSRS está deshabilitado, usar SM-2 legacy
      if (!this.featureFlags.FSRS_ALGORITHM) {
        return this.fallbackToSM2Sync(schedule, correct, hintsUsed, meta)
      }

      // Determinar rating FSRS basado en performance y contexto
      const ratingValue = this.determineRating(correct, hintsUsed, meta)
      const rating = ratingValue in Grade ? ratingValue : Grade.GOOD

      // Convertir schedule actual a formato FSRS Card
      const card = this.convertToFSRSCard(schedule)
      const now = Date.now()
      const dayMs = 24 * 60 * 60 * 1000
      const baseCard = {
        D: card.difficulty,
        S: card.stability,
        I: Math.max(1, card.interval)
      }

      let gradedCard
      if (card.reps === 0) {
        gradedCard = this.deck.newCard(rating)
      } else {
        const daysSinceReview = Math.max(0.01, (now - card.last_review) / dayMs)
        gradedCard = this.deck.gradeCard(baseCard, daysSinceReview, rating)
      }

      if (!gradedCard || Number.isNaN(gradedCard.I)) {
        logger.error('FSRS scheduling failed, falling back to SM-2')
        this.metrics.sm2Fallbacks++
        return this.fallbackToSM2Sync(schedule, correct, hintsUsed, meta)
      }

      const fsrsCard = {
        due: now + gradedCard.I * dayMs,
        stability: gradedCard.S,
        difficulty: gradedCard.D,
        interval: gradedCard.I,
        reps: (card.reps || 0) + 1,
        lapses: (card.lapses || 0) + (rating === Grade.AGAIN ? 1 : 0),
        state: rating === Grade.AGAIN ? 2 : 3,
        last_review: now
      }

      // Aplicar ajustes de inteligencia emocional y temporal
      const adjustedCard = this.applyIntelligentAdjustments(fsrsCard, meta)

      // Convertir resultado de vuelta al formato esperado
      const result = this.convertFromFSRSCard(adjustedCard, correct, meta)

      this.metrics.fsrsUsage++

      logger.debug('FSRS calculation completed', {
        rating,
        originalInterval: Math.round(card.interval),
        adjustedInterval: result.interval,
        difficulty: adjustedCard.difficulty,
        stability: adjustedCard.stability
      })

      return result

    } catch (error) {
      logger.error('FSRS calculation error, falling back to SM-2:', error)
      this.metrics.sm2Fallbacks++
      return this.fallbackToSM2Sync(schedule, correct, hintsUsed, meta)
    }
  }

  /**
   * Determina el rating FSRS basado en performance y contexto inteligente
   */
  determineRating(correct, hintsUsed, meta) {
    if (!correct) {
      // Análisis de tipo de error para rating más preciso
      const onlyAccentError = Array.isArray(meta.errorTags) &&
        meta.errorTags.length === 1 &&
        meta.errorTags[0] === ERROR_TAGS.ACCENT

      // Error leve (solo acentuación) = HARD, error mayor = AGAIN
      return onlyAccentError ? FSRS_RATINGS.HARD : FSRS_RATINGS.AGAIN
    }

    // Respuesta correcta - determinar nivel basado en múltiples factores
    let baseRating = FSRS_RATINGS.GOOD

    // Ajustes basados en pistas
    if (hintsUsed > 0) {
      baseRating = FSRS_RATINGS.HARD // Usó ayuda = más difícil
    }

    // Ajustes basados en velocidad de respuesta
    if (meta.latencyMs) {
      const { FAST_GUESS_MS, SLOW_MS } = PROGRESS_CONFIG.SRS_ADVANCED.SPEED

      if (meta.latencyMs < FAST_GUESS_MS) {
        // Muy rápido podría ser adivinanza, pero si es correcto probablemente es fácil
        baseRating = hintsUsed === 0 ? FSRS_RATINGS.EASY : FSRS_RATINGS.GOOD
      } else if (meta.latencyMs > SLOW_MS) {
        // Respuesta lenta = más difícil
        baseRating = Math.max(FSRS_RATINGS.HARD, baseRating - 1)
      }
    }

    // Integración con inteligencia emocional
    if (this.featureFlags.EMOTIONAL_SRS_INTEGRATION) {
      const confidenceState = confidenceEngine.getCurrentConfidenceState()
      const flowState = flowDetector.currentState

      // Ajustar rating basado en estado emocional
      if (confidenceState.level === 'struggling' || flowState === FLOW_STATES.FRUSTRATED) {
        baseRating = Math.max(FSRS_RATINGS.AGAIN, baseRating - 1)
      } else if (confidenceState.level === 'confident' || flowState === FLOW_STATES.DEEP_FLOW) {
        baseRating = Math.min(FSRS_RATINGS.EASY, baseRating + 1)
      }
    }

    return baseRating
  }

  /**
   * Convierte schedule del sistema a formato FSRS Card
   */
  convertToFSRSCard(schedule) {
    const now = Date.now()
    const interval = Math.max(1, schedule?.interval || 1)

    return {
      due: schedule?.nextDue ? new Date(schedule.nextDue).getTime() : now,
      stability: this.convertIntervalToStability(interval),
      difficulty: this.convertEaseToDifficulty(schedule?.ease || 2.5),
      interval,
      elapsed_days: interval,
      scheduled_days: interval,
      reps: schedule?.reps || 0,
      lapses: schedule?.lapses || 0,
      state: this.determineCardState(schedule),
      last_review: schedule?.updatedAt ? new Date(schedule.updatedAt).getTime() : now
    }
  }

  /**
   * Convierte intervalo (días) a stability FSRS
   */
  convertIntervalToStability(intervalDays) {
    // FSRS stability es conceptualmente similar al intervalo
    // pero tiene en cuenta la curva de olvido
    return Math.max(0.1, intervalDays * 0.9)
  }

  /**
   * Convierte ease SM-2 a difficulty FSRS
   */
  convertEaseToDifficulty(ease) {
    // Mapeo inverso: ease alto = difficulty bajo
    // SM-2 ease range: 1.3-3.2, FSRS difficulty range: 1-10
    const normalized = (ease - 1.3) / (3.2 - 1.3) // 0-1
    return Math.max(1, Math.min(10, 10 - (normalized * 9))) // Invertir y escalar
  }

  /**
   * Determina estado de carta FSRS basado en historial
   */
  determineCardState(schedule) {
    if (!schedule || schedule.reps === 0) return 0 // New
    if (schedule.reps === 1) return 1 // Learning
    if (schedule.lapses > 0) return 2 // Review (Relearning)
    return 3 // Review (Graduated)
  }

  /**
   * Aplica ajustes inteligentes basados en contexto emocional y temporal
   */
  applyIntelligentAdjustments(fsrsCard, meta) {
    let adjustmentFactor = 1.0
    let adjustmentReasons = []

    // Integración profunda con inteligencia emocional
    if (this.featureFlags.EMOTIONAL_SRS_INTEGRATION) {
      // Usar sistema específico de recomendaciones SRS del confidence engine
      const categoryKey = meta.categoryKey || `${meta.mood || 'unknown'}|${meta.tense || 'unknown'}`
      const confidenceRecommendations = confidenceEngine.getSRSRecommendations(categoryKey)

      if (confidenceRecommendations.intervalMultiplier !== 1.0) {
        adjustmentFactor *= confidenceRecommendations.intervalMultiplier
        adjustmentReasons.push(`confidence:${confidenceRecommendations.confidenceLevel}`)
        this.metrics.emotionalAdjustments++
      }

      // Usar sistema específico de scheduling del flow detector
      const flowRecommendations = flowDetector.getSRSSchedulingRecommendations()
      if (flowRecommendations.schedulingMultiplier !== 1.0) {
        adjustmentFactor *= flowRecommendations.schedulingMultiplier
        adjustmentReasons.push(`flow:${flowRecommendations.flowState}`)

        // Si está frustrado, considerar retrasar el review
        if (flowRecommendations.shouldDelay) {
          // Agregar tiempo adicional para recovery
          const recoveryHours = 2 // 2 horas de recovery mínimo
          fsrsCard.due = Math.max(fsrsCard.due, Date.now() + (recoveryHours * 60 * 60 * 1000))
          adjustmentReasons.push('frustrated_recovery_delay')
        }
      }
    }

    // Integración profunda con inteligencia temporal
    if (this.featureFlags.TEMPORAL_SCHEDULING) {
      // Usar sistema específico de scheduling temporal
      const temporalRecommendations = temporalIntelligence.getSRSSchedulingRecommendations(fsrsCard.due)

      if (temporalRecommendations.timingMultiplier !== 1.0) {
        adjustmentFactor *= temporalRecommendations.timingMultiplier
        adjustmentReasons.push(`temporal:${temporalRecommendations.priorityAdjustment}`)
        this.metrics.temporalAdjustments++
      }

      // Ajustar timing del review si hay recomendaciones específicas
      if (temporalRecommendations.shouldDelay) {
        // Posponer por fatiga alta o sobrecarga cognitiva
        const delayHours = temporalRecommendations.currentFatigue > 0.8 ? 4 : 2
        fsrsCard.due = Math.max(fsrsCard.due, Date.now() + (delayHours * 60 * 60 * 1000))
        adjustmentReasons.push('temporal_delay_fatigue_overload')
      } else if (temporalRecommendations.isOptimalTime) {
        // Si estamos en tiempo óptimo, permitir review temprano
        const advanceHours = 1 // Permitir adelantar 1 hora
        fsrsCard.due = Math.max(Date.now(), fsrsCard.due - (advanceHours * 60 * 60 * 1000))
        adjustmentReasons.push('temporal_advance_optimal')
      }

      // Usar ventana óptima para scheduling futuro
      if (temporalRecommendations.optimalWindow && temporalRecommendations.optimalWindow.confidence > 0.6) {
        const targetHour = temporalRecommendations.optimalWindow.peakHour
        const dueDate = new Date(fsrsCard.due)

        // Ajustar hora del review a la ventana óptima si está cerca
        if (Math.abs(dueDate.getHours() - targetHour) > 3) {
          dueDate.setHours(targetHour, 0, 0, 0) // Programar para hora pico
          fsrsCard.due = dueDate.getTime()
          adjustmentReasons.push('temporal_optimal_window_adjustment')
        }
      }
    }

    // Aplicar ajuste al intervalo (modificar due date)
    if (adjustmentFactor !== 1.0) {
      const originalInterval = (fsrsCard.due - Date.now()) / (1000 * 60 * 60 * 24)
      const adjustedInterval = Math.max(1, originalInterval * adjustmentFactor)
      fsrsCard.due = Date.now() + (adjustedInterval * 24 * 60 * 60 * 1000)

      logger.debug('Applied intelligent adjustments', {
        originalInterval: Math.round(originalInterval),
        adjustedInterval: Math.round(adjustedInterval),
        factor: adjustmentFactor,
        reasons: adjustmentReasons
      })
    }

    return fsrsCard
  }

  /**
   * Convierte resultado FSRS de vuelta al formato esperado por el sistema
   */
  convertFromFSRSCard(fsrsCard, wasCorrect, meta) {
    const intervalDays = (fsrsCard.due - Date.now()) / (1000 * 60 * 60 * 24)

    return {
      interval: Math.max(1, Math.round(intervalDays)),
      ease: this.convertDifficultyToEase(fsrsCard.difficulty), // Para compatibilidad
      reps: fsrsCard.reps,
      lapses: fsrsCard.lapses,
      leech: fsrsCard.lapses >= (PROGRESS_CONFIG.SRS_ADVANCED.LEECH_THRESHOLD || 8),
      nextDue: new Date(fsrsCard.due),
      lastAnswerCorrect: !!wasCorrect,
      lastLatencyMs: meta.latencyMs,

      // Metadatos FSRS para análisis
      fsrs: {
        stability: fsrsCard.stability,
        difficulty: fsrsCard.difficulty,
        retrievability: this.calculateRetrievability(fsrsCard),
        state: fsrsCard.state
      }
    }
  }

  /**
   * Convierte difficulty FSRS a ease SM-2 para compatibilidad
   */
  convertDifficultyToEase(difficulty) {
    // Mapeo inverso de convertEaseToDifficulty
    const normalized = (10 - difficulty) / 9 // 0-1, invertido
    return 1.3 + (normalized * (3.2 - 1.3))
  }

  /**
   * Calcula retrievability estimada para métricas
   */
  calculateRetrievability(card) {
    const stability = Math.max(card.stability || 0.1, 0.1)
    const daysSinceLastReview = (Date.now() - card.last_review) / (1000 * 60 * 60 * 24)
    return Math.exp(-daysSinceLastReview / stability)
  }

  /**
   * Fallback síncrono a SM-2 cuando FSRS falla o está deshabilitado
   */
  fallbackToSM2Sync(schedule, correct, hintsUsed, meta) {
    // Implementación SM-2 básica inline para evitar circular imports
    // Esta es una versión simplificada para fallback
    const intervals = [1, 3, 7, 14, 30, 90]
    let { interval = 0, ease = 2.5, reps = 0, lapses = 0 } = schedule || {}

    if (!correct) {
      lapses++
      reps = 0
      interval = 1 // Reaprender
    } else {
      if (reps < intervals.length) {
        interval = intervals[reps]
        reps++
      } else {
        interval = Math.round(interval * ease)
      }

      // Ajuste básico por hints
      if (hintsUsed > 0) {
        interval = Math.round(interval * 0.8)
      }
    }

    return {
      interval: Math.max(1, interval),
      ease,
      reps,
      lapses,
      leech: lapses >= 8,
      nextDue: new Date(Date.now() + interval * 24 * 60 * 60 * 1000),
      lastAnswerCorrect: !!correct,
      lastLatencyMs: meta.latencyMs
    }
  }

  /**
   * Fallback async a SM-2 para uso futuro (cuando se necesite importar srs.js)
   */
  async fallbackToSM2(schedule, correct, hintsUsed, meta) {
    // Usar la implementación SM-2 existente
    const { calculateNextIntervalSM2: sm2Calculate } = await import('./srs.js')
    return sm2Calculate(schedule, correct, hintsUsed, meta)
  }

  /**
   * Obtiene métricas de uso para análisis
   */
  getMetrics() {
    const total = this.metrics.fsrsUsage + this.metrics.sm2Fallbacks
    return {
      ...this.metrics,
      fsrsSuccessRate: total > 0 ? this.metrics.fsrsUsage / total : 0,
      totalCalculations: total
    }
  }

  /**
   * Reinicia métricas
   */
  resetMetrics() {
    this.metrics = {
      fsrsUsage: 0,
      sm2Fallbacks: 0,
      emotionalAdjustments: 0,
      temporalAdjustments: 0
    }
  }
}

// Instancia singleton
export const intelligentFSRS = new IntelligentFSRS()

/**
 * Función principal compatible con interface existente
 * Reemplaza calculateNextInterval cuando FSRS está habilitado
 */
export function calculateNextIntervalFSRS(schedule, correct, hintsUsed, meta = {}) {
  return intelligentFSRS.calculateNextInterval(schedule, correct, hintsUsed, meta)
}

/**
 * Función helper para verificar si FSRS está habilitado
 * Integra A/B testing para determinar algoritmo por usuario
 */
export function isFSRSEnabled() {
  // Feature flag global
  const globalEnabled = PROGRESS_CONFIG.FEATURE_FLAGS.FSRS_ALGORITHM && PROGRESS_CONFIG.FSRS.ENABLED

  // Si A/B testing está habilitado, usar decisión por usuario
  if (PROGRESS_CONFIG.FEATURE_FLAGS.A_B_TESTING) {
    try {
      return globalEnabled && shouldUseFSRS()
    } catch (error) {
      logger.warn('A/B testing check failed, defaulting to global FSRS flag', error)
      return globalEnabled
    }
  }

  return globalEnabled
}

/**
 * Función helper para obtener métricas de comparación
 */
export function getFSRSMetrics() {
  return intelligentFSRS.getMetrics()
}

// Debugging en navegador
if (typeof window !== 'undefined') {
  window.SpanishConjugator = window.SpanishConjugator || {}
  window.SpanishConjugator.FSRS = {
    isEnabled: isFSRSEnabled,
    getMetrics: getFSRSMetrics,
    resetMetrics: () => intelligentFSRS.resetMetrics(),
    instance: intelligentFSRS
  }
}

export default intelligentFSRS
