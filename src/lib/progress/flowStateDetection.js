// Sistema de Detección de Estados de Flow y Momentum
// Algoritmo inteligente para detectar cuándo el usuario está "en la zona"

import { PROGRESS_CONFIG } from './config.js'
import { logger, logFlow } from './logger.js'
import { memoryManager } from './memoryManager.js'

/**
 * Estados posibles de flow del usuario
 */
export const FLOW_STATES = {
  DEEP_FLOW: 'deep_flow',     // En la zona profunda - máxima productividad
  LIGHT_FLOW: 'light_flow',   // Flow ligero - buen ritmo
  NEUTRAL: 'neutral',         // Estado neutral - aprendizaje normal  
  STRUGGLING: 'struggling',   // Luchando - necesita apoyo
  FRUSTRATED: 'frustrated'    // Frustrado - necesita recovery
}

// Usar configuración centralizada
const FLOW_CONFIG = PROGRESS_CONFIG.EMOTIONAL_INTELLIGENCE.FLOW

/**
 * Motor de Detección de Estados de Flow
 */
export class FlowStateDetector {
  constructor() {
    this.reset()
  }

  /**
   * Reset del detector para nueva sesión
   */
  reset() {
    this.responseHistory = []     // Últimas N respuestas
    this.currentState = FLOW_STATES.NEUTRAL
    this.stateHistory = []        // Historial de cambios de estado
    this.lastStateChange = Date.now()
    this.streakCounter = { correct: 0, fast: 0, slow: 0, errors: 0 }
    this.sessionStartTime = Date.now()
    
    // Ventana deslizante para análisis
    this.maxHistorySize = 20      // Últimas 20 respuestas
    this.flowDetectionWindow = 10 // Ventana de 10 respuestas para flow
    this.stateChangeBuffer = 3    // Buffer para evitar cambios erráticos
    
    // Métricas de flow acumuladas
    this.flowMetrics = {
      totalFlowTime: 0,
      deepFlowSessions: 0,
      recoveryCount: 0,
      averageResponseTime: 0,
      consistencyScore: 0
    }
  }

  /**
   * Procesar nueva respuesta del usuario
   */
  processResponse(response) {
    const processedResponse = this.analyzeResponse(response)
    
    // Añadir a historial
    this.responseHistory.push(processedResponse)
    if (this.responseHistory.length > this.maxHistorySize) {
      this.responseHistory.shift()
    }
    
    // Actualizar streaks
    this.updateStreaks(processedResponse)
    
    // Detectar nuevo estado
    const newState = this.detectFlowState()
    
    // Cambiar estado si es necesario
    if (this.shouldChangeState(newState)) {
      this.changeState(newState)
    }
    
    // Actualizar métricas
    this.updateFlowMetrics(processedResponse)
    
    return {
      currentState: this.currentState,
      stateChanged: this.stateHistory.length > 0 && 
                   this.stateHistory[this.stateHistory.length - 1]?.state === newState &&
                   Date.now() - this.lastStateChange < 1000,
      responseAnalysis: processedResponse,
      flowMetrics: this.getFlowMetrics(),
      recommendations: this.getStateRecommendations()
    }
  }

  /**
   * Analizar respuesta individual
   */
  analyzeResponse(response) {
    const now = Date.now()
    
    return {
      ...response,
      timestamp: now,
      responseTime: response.responseTime || (now - (response.startTime || now)),
      isCorrect: response.correct,
      isFast: response.responseTime < FLOW_CONFIG.FAST_RESPONSE,
      isSlow: response.responseTime > FLOW_CONFIG.SLOW_RESPONSE,
      confidence: this.calculateConfidence(response),
      complexity: this.estimateComplexity(response)
    }
  }

  /**
   * Calcular confianza basada en tiempo de respuesta
   */
  calculateConfidence(response) {
    const responseTime = response.responseTime || 5000
    
    if (responseTime < FLOW_CONFIG.FAST_RESPONSE) {
      return response.correct ? 0.9 : 0.3
    } else if (responseTime > FLOW_CONFIG.SLOW_RESPONSE) {
      return response.correct ? 0.6 : 0.2
    } else {
      return response.correct ? 0.7 : 0.4 // Tiempo normal
    }
  }

  /**
   * Estimar complejidad del elemento (sincrónico con fallback)
   */
  estimateComplexity(response) {
    const item = response.item
    if (!item) return 0.5

    let complexity = 0.3 // Base complexity

    // Mood complexity
    if (item.mood === 'subjunctive') complexity += 0.3
    else if (item.mood === 'conditional') complexity += 0.2
    else if (item.mood === 'imperative') complexity += 0.2

    // Tense complexity
    if (item.tense && (item.tense.includes('Perf') || item.tense.includes('Plusc'))) complexity += 0.2
    if (item.tense === 'subjImpf' || item.tense === 'subjPlusc') complexity += 0.3

    // Verb irregularity - usar verbType como fallback rápido para análisis de flow
    // El análisis de flow necesita ser rápido, así que usamos verbType si está disponible
    if (response.verbType === 'irregular') {
      complexity += 0.2
    } else if (item.lemma) {
      // Complejidad mínima adicional para verbos desconocidos
      complexity += 0.1
    }

    return Math.min(1.0, complexity)
  }

  /**
   * Actualizar contadores de streaks
   */
  updateStreaks(response) {
    // Reset all streaks first
    const streaks = this.streakCounter
    
    if (response.isCorrect) {
      streaks.correct++
      streaks.errors = 0
      
      if (response.isFast) {
        streaks.fast++
        streaks.slow = 0
      } else if (response.isSlow) {
        streaks.slow++
        streaks.fast = 0
      }
    } else {
      streaks.errors++
      streaks.correct = 0
      streaks.fast = 0
    }
  }

  /**
   * Detectar estado de flow basado en patrones
   */
  detectFlowState() {
    if (this.responseHistory.length < 3) return FLOW_STATES.NEUTRAL
    
    const recent = this.responseHistory.slice(-this.flowDetectionWindow)
    const veryRecent = this.responseHistory.slice(-5) // Últimas 5 respuestas
    
    // Calcular métricas de ventana
    const recentAccuracy = recent.filter(r => r.isCorrect).length / recent.length
    const recentAvgResponseTime = recent.reduce((sum, r) => sum + r.responseTime, 0) / recent.length
    const recentAvgConfidence = recent.reduce((sum, r) => sum + r.confidence, 0) / recent.length
    
    // Detectar consistencia en velocidad
    const responseTimes = recent.map(r => r.responseTime)
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
    const velocityVariation = this.calculateVariation(responseTimes) / avgResponseTime
    
    // DEEP FLOW: Alto rendimiento consistente
    if (
      recentAccuracy >= FLOW_CONFIG.HIGH_ACCURACY && 
      recentAvgResponseTime <= FLOW_CONFIG.FAST_RESPONSE * 1.2 &&
      velocityVariation < FLOW_CONFIG.VELOCITY_CONSISTENCY &&
      this.streakCounter.correct >= FLOW_CONFIG.FLOW_STREAK
    ) {
      return FLOW_STATES.DEEP_FLOW
    }
    
    // LIGHT FLOW: Buen rendimiento con alguna inconsistencia
    if (
      recentAccuracy >= 0.75 &&
      recentAvgResponseTime <= FLOW_CONFIG.FAST_RESPONSE * 1.5 &&
      recentAvgConfidence > 0.6 &&
      this.streakCounter.correct >= 3
    ) {
      return FLOW_STATES.LIGHT_FLOW
    }
    
    // FRUSTRATED: Múltiples errores o respuestas muy lentas
    if (
      recentAccuracy < FLOW_CONFIG.LOW_ACCURACY ||
      this.streakCounter.errors >= FLOW_CONFIG.STRUGGLE_STREAK ||
      veryRecent.filter(r => r.responseTime > FLOW_CONFIG.SLOW_RESPONSE * 1.5).length >= 3
    ) {
      return FLOW_STATES.FRUSTRATED
    }
    
    // STRUGGLING: Bajo rendimiento pero no completamente frustrado
    if (
      recentAccuracy < 0.70 ||
      recentAvgResponseTime > FLOW_CONFIG.SLOW_RESPONSE ||
      this.streakCounter.slow >= FLOW_CONFIG.STRUGGLE_STREAK
    ) {
      return FLOW_STATES.STRUGGLING
    }
    
    // NEUTRAL: Estado por defecto
    return FLOW_STATES.NEUTRAL
  }

  /**
   * Determinar si debería cambiar de estado
   */
  shouldChangeState(newState) {
    if (newState === this.currentState) return false
    
    // Evitar cambios muy rápidos (buffer)
    const timeSinceLastChange = Date.now() - this.lastStateChange
    if (timeSinceLastChange < 10000) { // 10 segundos minimum
      return false
    }
    
    // Requiere confirmación para estados extremos
    if (newState === FLOW_STATES.DEEP_FLOW || newState === FLOW_STATES.FRUSTRATED) {
      const confirmationResponses = this.responseHistory.slice(-this.stateChangeBuffer)
      const stateSupport = this.countStateSupportingResponses(confirmationResponses, newState)
      return stateSupport >= this.stateChangeBuffer - 1 // Al menos N-1 respuestas que apoyen el estado
    }
    
    return true
  }

  /**
   * Contar respuestas que apoyan un estado específico
   */
  countStateSupportingResponses(responses, state) {
    let supportCount = 0
    
    responses.forEach(r => {
      switch (state) {
        case FLOW_STATES.DEEP_FLOW:
          if (r.isCorrect && r.isFast && r.confidence > 0.7) supportCount++
          break
        case FLOW_STATES.LIGHT_FLOW:
          if (r.isCorrect && r.confidence > 0.6) supportCount++
          break
        case FLOW_STATES.FRUSTRATED:
          if (!r.isCorrect || r.isSlow || r.confidence < 0.4) supportCount++
          break
        case FLOW_STATES.STRUGGLING:
          if (!r.isCorrect || r.responseTime > FLOW_CONFIG.SLOW_RESPONSE) supportCount++
          break
      }
    })
    
    return supportCount
  }

  /**
   * Cambiar estado de flow
   */
  changeState(newState) {
    const previousState = this.currentState
    const now = Date.now()
    
    // Actualizar métricas de tiempo en estado anterior
    if (previousState === FLOW_STATES.DEEP_FLOW || previousState === FLOW_STATES.LIGHT_FLOW) {
      this.flowMetrics.totalFlowTime += now - this.lastStateChange
    }
    
    // Registrar cambio
    this.stateHistory.push({
      previousState,
      newState,
      timestamp: now,
      duration: now - this.lastStateChange,
      triggeringFactors: this.identifyTriggeringFactors(newState)
    })
    
    // Actualizar estado actual
    this.currentState = newState
    this.lastStateChange = now
    
    // Contadores especiales
    if (newState === FLOW_STATES.DEEP_FLOW) {
      this.flowMetrics.deepFlowSessions++
    }
    
    if (previousState === FLOW_STATES.FRUSTRATED && newState !== FLOW_STATES.FRUSTRATED) {
      this.flowMetrics.recoveryCount++
    }
    
    logFlow('Cambio de estado', `${previousState} → ${newState}`)
  }

  /**
   * Identificar factores que causaron el cambio de estado
   */
  identifyTriggeringFactors(newState) {
    const recent = this.responseHistory.slice(-3)
    const factors = []
    
    if (newState === FLOW_STATES.DEEP_FLOW) {
      factors.push('consecutive_correct_responses', 'fast_response_times', 'high_confidence')
    } else if (newState === FLOW_STATES.FRUSTRATED) {
      if (recent.some(r => !r.isCorrect)) factors.push('multiple_errors')
      if (recent.some(r => r.isSlow)) factors.push('slow_responses')
      factors.push('low_confidence')
    }
    
    return factors
  }

  /**
   * Actualizar métricas de flow
   */
  updateFlowMetrics(response) {
    // Actualizar promedio de tiempo de respuesta
    const totalResponses = this.responseHistory.length
    this.flowMetrics.averageResponseTime = (
      (this.flowMetrics.averageResponseTime * (totalResponses - 1) + response.responseTime) / 
      totalResponses
    )
    
    // Calcular score de consistencia
    if (this.responseHistory.length >= 5) {
      const recent = this.responseHistory.slice(-10)
      const times = recent.map(r => r.responseTime)
      const accuracies = recent.map(r => r.isCorrect ? 1 : 0)
      
      const timeConsistency = 1 - (this.calculateVariation(times) / this.calculateMean(times))
      const accuracyConsistency = 1 - this.calculateVariation(accuracies)
      
      this.flowMetrics.consistencyScore = (timeConsistency + accuracyConsistency) / 2
    }
  }

  /**
   * Obtener recomendaciones basadas en el estado actual
   */
  getStateRecommendations() {
    switch (this.currentState) {
      case FLOW_STATES.DEEP_FLOW:
        return {
          action: 'maintain',
          message: ' ¡Estás en la zona! Mantén el ritmo.',
          difficultyAdjustment: 'increase_slightly', // Aumentar dificultad ligeramente
          contentType: 'challenging',
          urgency: 'low'
        }

      case FLOW_STATES.LIGHT_FLOW:
        return {
          action: 'enhance',
          message: ' Buen ritmo, puedes ir un poco más rápido.',
          difficultyAdjustment: 'maintain',
          contentType: 'balanced',
          urgency: 'low'
        }

      case FLOW_STATES.STRUGGLING:
        return {
          action: 'support',
          message: ' Tómatelo con calma, vas bien.',
          difficultyAdjustment: 'decrease',
          contentType: 'easier',
          urgency: 'medium'
        }

      case FLOW_STATES.FRUSTRATED:
        return {
          action: 'recover',
          message: ' Respira hondo, vamos a algo más fácil.',
          difficultyAdjustment: 'decrease_significantly',
          contentType: 'confidence_building',
          urgency: 'high'
        }

      default:
        return {
          action: 'continue',
          message: ' Continúa con tu práctica.',
          difficultyAdjustment: 'maintain',
          contentType: 'balanced',
          urgency: 'low'
        }
    }
  }

  /**
   * Obtiene recomendaciones específicas para scheduling SRS
   * Usado por FSRS para ajustar timing y prioridad de reviews
   */
  getSRSSchedulingRecommendations() {
    const recommendations = this.getStateRecommendations()
    let schedulingMultiplier = 1.0
    let priorityAdjustment = 'normal'
    let optimalTiming = 'now'

    switch (this.currentState) {
      case FLOW_STATES.DEEP_FLOW:
        schedulingMultiplier = 1.20  // Intervalos 20% más largos - está dominando el contenido
        priorityAdjustment = 'lower'  // Menor prioridad - puede esperar
        optimalTiming = 'continue_session' // Continuar mientras esté en flow
        break

      case FLOW_STATES.LIGHT_FLOW:
        schedulingMultiplier = 1.10  // Intervalos 10% más largos
        priorityAdjustment = 'normal'
        optimalTiming = 'now'
        break

      case FLOW_STATES.STRUGGLING:
        schedulingMultiplier = 0.75  // Intervalos 25% más cortos
        priorityAdjustment = 'higher' // Mayor prioridad - necesita atención
        optimalTiming = 'soon'
        break

      case FLOW_STATES.FRUSTRATED:
        schedulingMultiplier = 0.50  // Intervalos 50% más cortos
        priorityAdjustment = 'critical' // Prioridad crítica
        optimalTiming = 'after_break' // No ahora, después de descanso
        break

      default: // NEUTRAL
        schedulingMultiplier = 1.0
        priorityAdjustment = 'normal'
        optimalTiming = 'now'
    }

    return {
      schedulingMultiplier: Math.max(0.3, Math.min(2.0, schedulingMultiplier)),
      priorityAdjustment,
      optimalTiming,
      flowState: this.currentState,
      shouldDelay: this.currentState === FLOW_STATES.FRUSTRATED,
      shouldAccelerate: this.currentState === FLOW_STATES.DEEP_FLOW,
      recommendedAction: recommendations.action,
      reasoning: this.generateFlowReasoning()
    }
  }

  /**
   * Genera explicación para ajustes basados en flow
   */
  generateFlowReasoning() {
    const reasons = []

    switch (this.currentState) {
      case FLOW_STATES.DEEP_FLOW:
        reasons.push('deep_flow_longer_intervals')
        reasons.push('high_performance_can_wait')
        break
      case FLOW_STATES.LIGHT_FLOW:
        reasons.push('good_flow_maintain_schedule')
        break
      case FLOW_STATES.STRUGGLING:
        reasons.push('struggling_needs_more_practice')
        reasons.push('shorter_intervals_for_support')
        break
      case FLOW_STATES.FRUSTRATED:
        reasons.push('frustrated_needs_recovery')
        reasons.push('delay_difficult_content')
        break
      default:
        reasons.push('neutral_state_normal_schedule')
    }

    // Agregar información de streaks
    if (this.streakCounter.correct >= 5) {
      reasons.push('strong_streak_building')
    } else if (this.streakCounter.errors >= 3) {
      reasons.push('error_streak_needs_attention')
    }

    return reasons
  }

  /**
   * Obtener métricas de flow para analytics
   */
  getFlowMetrics() {
    const sessionTime = Date.now() - this.sessionStartTime
    const flowPercentage = sessionTime > 0 ? (this.flowMetrics.totalFlowTime / sessionTime) * 100 : 0
    
    return {
      currentState: this.currentState,
      sessionDuration: sessionTime,
      totalFlowTime: this.flowMetrics.totalFlowTime,
      flowPercentage: Math.round(flowPercentage),
      deepFlowSessions: this.flowMetrics.deepFlowSessions,
      recoveryCount: this.flowMetrics.recoveryCount,
      averageResponseTime: Math.round(this.flowMetrics.averageResponseTime),
      consistencyScore: Math.round(this.flowMetrics.consistencyScore * 100),
      currentStreak: {
        correct: this.streakCounter.correct,
        fast: this.streakCounter.fast,
        errors: this.streakCounter.errors
      },
      stateHistory: this.stateHistory.length
    }
  }

  /**
   * Obtener estado detallado para debugging
   */
  getDetailedState() {
    return {
      currentState: this.currentState,
      responseHistory: this.responseHistory.slice(-10), // Últimas 10 respuestas
      streakCounter: this.streakCounter,
      stateHistory: this.stateHistory,
      flowMetrics: this.flowMetrics,
      recommendations: this.getStateRecommendations()
    }
  }

  /**
   * Utilidades matemáticas
   */
  calculateVariation(numbers) {
    const mean = this.calculateMean(numbers)
    const variance = numbers.reduce((sum, num) => sum + Math.pow(num - mean, 2), 0) / numbers.length
    return Math.sqrt(variance)
  }

  calculateMean(numbers) {
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length
  }
}

// Singleton para uso global
export const flowDetector = new FlowStateDetector()

/**
 * Funciones de utilidad para integración
 */
export function initializeFlowDetection() {
  flowDetector.reset()
  logger.systemInit('Flow State Detection')
  return flowDetector
}

export function processUserResponse(item, response, metadata = {}) {
  // Create enriched response object with all necessary data
  const enrichedResponse = {
    ...response,
    item,  // Include item data for complexity analysis
    metadata,  // Include metadata like userId, timestamp, sessionContext
    timestamp: metadata.timestamp || new Date(),
    userId: metadata.userId
  }

  return flowDetector.processResponse(enrichedResponse)
}

export function getCurrentFlowState() {
  return flowDetector.currentState
}

export function getFlowMetrics() {
  return flowDetector.getFlowMetrics()
}

export function getFlowRecommendations() {
  return flowDetector.getStateRecommendations()
}

// Registrar sistema para cleanup
memoryManager.registerSystem('FlowDetector', () => {
  flowDetector.reset()
})

// Debugging unificado en navegador
if (typeof window !== 'undefined') {
  window.SpanishConjugator = window.SpanishConjugator || {}
  window.SpanishConjugator.FlowDetector = {
    getState: () => flowDetector.getCurrentState(),
    getMetrics: () => flowDetector.getFlowMetrics(),
    getRecommendations: () => flowDetector.getRecommendations(),
    getDetailedState: () => flowDetector.getDetailedState(),
    reset: () => flowDetector.reset()
  }
  
  logger.systemInit('Flow Detector Debug Interface')
}
