// Sistema de Tracking de Momentum Emocional
// Rastrea las rachas emocionales del usuario más allá de simple acierto/error

/**
 * Tipos de momentum emocional
 */
export const MOMENTUM_TYPES = {
  CONFIDENCE_BUILDING: 'confidence_building',    // Construyendo confianza
  PEAK_PERFORMANCE: 'peak_performance',          // Rendimiento máximo
  STEADY_PROGRESS: 'steady_progress',            // Progreso constante
  MINOR_SETBACK: 'minor_setback',               // Retroceso menor
  RECOVERY_MODE: 'recovery_mode',                // Modo recuperación
  CONFIDENCE_CRISIS: 'confidence_crisis'         // Crisis de confianza
}

/**
 * Factores que influyen en el momentum
 */
const MOMENTUM_FACTORS = {
  // Pesos para cálculo de momentum score
  ACCURACY: 0.30,           // 30% - Correctness matters
  RESPONSE_TIME: 0.25,      // 25% - Speed indicates confidence  
  CONSISTENCY: 0.20,        // 20% - Consistency builds momentum
  DIFFICULTY_PROGRESS: 0.15, // 15% - Handling harder content
  RECOVERY_RATE: 0.10       // 10% - Bouncing back from errors
}

/**
 * Thresholds para categorización de momentum
 */
const MOMENTUM_THRESHOLDS = {
  PEAK_PERFORMANCE: 0.85,      // 85%+ momentum score
  CONFIDENCE_BUILDING: 0.70,   // 70-84% momentum score
  STEADY_PROGRESS: 0.55,       // 55-69% momentum score
  MINOR_SETBACK: 0.40,        // 40-54% momentum score
  RECOVERY_MODE: 0.25,         // 25-39% momentum score
  CONFIDENCE_CRISIS: 0.25      // <25% momentum score
}

/**
 * Configuración de ventanas temporales
 */
const MOMENTUM_CONFIG = {
  SHORT_TERM_WINDOW: 5,        // Últimas 5 respuestas
  MEDIUM_TERM_WINDOW: 15,      // Últimas 15 respuestas
  LONG_TERM_WINDOW: 30,        // Últimas 30 respuestas
  TREND_ANALYSIS_MIN: 8,       // Mínimas respuestas para análisis de tendencia
  MOMENTUM_DECAY_TIME: 300000, // 5 minutos para decay
  STREAK_RESET_THRESHOLD: 2    // Reset streak después de 2 errores
}

/**
 * Sistema de Tracking de Momentum Emocional
 */
export class MomentumTracker {
  constructor() {
    this.reset()
  }

  /**
   * Reset del tracker para nueva sesión
   */
  reset() {
    this.responses = []
    this.currentMomentum = MOMENTUM_TYPES.STEADY_PROGRESS
    this.momentumHistory = []
    this.lastMomentumChange = Date.now()
    
    // Métricas de momentum
    this.momentumScore = 0.5 // Comenzar en neutral
    this.trends = {
      shortTerm: 0,    // Tendencia corto plazo (-1 a 1)
      mediumTerm: 0,   // Tendencia medio plazo
      longTerm: 0      // Tendencia largo plazo
    }
    
    // Streaks emocionales
    this.streaks = {
      confidence: 0,        // Racha de confianza (respuestas rápidas correctas)
      struggle: 0,          // Racha de lucha (errores o respuestas lentas)
      improvement: 0,       // Racha de mejora (tiempos mejorando)
      consistency: 0        // Racha de consistencia (performance estable)
    }
    
    // Patrones detectados
    this.patterns = {
      recoveryRate: 0,      // Qué tan rápido se recupera de errores
      difficultyTolerance: 0, // Tolerancia a contenido difícil
      performanceVariability: 0, // Variabilidad en el rendimiento
      learningVelocity: 0   // Velocidad de aprendizaje detectada
    }
    
    // Estado emocional inferido
    this.emotionalState = {
      confidence: 0.5,      // Nivel de confianza (0-1)
      frustration: 0,       // Nivel de frustración (0-1)  
      engagement: 0.5,      // Nivel de engagement (0-1)
      fatigue: 0           // Nivel de fatiga (0-1)
    }
    
    this.sessionStartTime = Date.now()
  }

  /**
   * Procesar nueva respuesta y actualizar momentum
   */
  processResponse(response, flowState = null) {
    const processedResponse = this.enrichResponse(response)
    
    // Añadir a historial
    this.responses.push(processedResponse)
    if (this.responses.length > MOMENTUM_CONFIG.LONG_TERM_WINDOW) {
      this.responses.shift()
    }
    
    // Actualizar streaks emocionales
    this.updateEmotionalStreaks(processedResponse)
    
    // Calcular nuevo momentum score
    this.updateMomentumScore()
    
    // Actualizar tendencias
    this.updateTrends()
    
    // Detectar patrones
    this.updatePatterns()
    
    // Actualizar estado emocional
    this.updateEmotionalState(flowState)
    
    // Detectar nuevo tipo de momentum
    const newMomentum = this.detectMomentumType()
    
    // Cambiar momentum si es necesario
    if (newMomentum !== this.currentMomentum) {
      this.changeMomentum(newMomentum, processedResponse)
    }
    
    return {
      currentMomentum: this.currentMomentum,
      momentumScore: this.momentumScore,
      trends: this.trends,
      streaks: this.streaks,
      emotionalState: this.emotionalState,
      recommendations: this.getMomentumRecommendations(),
      insights: this.getMomentumInsights()
    }
  }

  /**
   * Enriquecer respuesta con métricas adicionales
   */
  enrichResponse(response) {
    const now = Date.now()
    const enriched = {
      ...response,
      timestamp: now,
      sessionTime: now - this.sessionStartTime
    }
    
    // Calcular métricas de confianza
    enriched.confidenceIndicators = this.calculateConfidenceIndicators(response)
    
    // Calcular dificultad percibida
    enriched.perceivedDifficulty = this.calculatePerceivedDifficulty(response)
    
    // Determinar si es una mejora
    enriched.isImprovement = this.isImprovement(response)
    
    return enriched
  }

  /**
   * Calcular indicadores de confianza
   */
  calculateConfidenceIndicators(response) {
    const responseTime = response.responseTime || 5000
    const isCorrect = response.correct || false
    
    // Indicadores principales
    const speedConfidence = responseTime < 3000 ? 0.8 : responseTime > 8000 ? 0.2 : 0.5
    const accuracyConfidence = isCorrect ? 0.9 : 0.1
    
    // Indicadores secundarios
    const hesitationPenalty = response.hesitationCount ? response.hesitationCount * 0.1 : 0
    const hintPenalty = response.hintsUsed ? response.hintsUsed * 0.2 : 0
    
    const rawConfidence = (speedConfidence + accuracyConfidence) / 2
    const adjustedConfidence = Math.max(0, rawConfidence - hesitationPenalty - hintPenalty)
    
    return {
      raw: rawConfidence,
      adjusted: adjustedConfidence,
      speedComponent: speedConfidence,
      accuracyComponent: accuracyConfidence,
      penalties: hesitationPenalty + hintPenalty
    }
  }

  /**
   * Calcular dificultad percibida
   */
  calculatePerceivedDifficulty(response) {
    const responseTime = response.responseTime || 5000
    const isCorrect = response.correct || false
    
    // Base: tiempo de respuesta normalizado
    let difficulty = Math.min(1, responseTime / 10000) // 10s = max difficulty
    
    // Ajustar por resultado
    if (!isCorrect) difficulty += 0.3
    if (response.hintsUsed) difficulty += response.hintsUsed * 0.1
    
    // Ajustar por complejidad del item (si disponible)
    if (response.item) {
      const item = response.item
      if (item.mood === 'subjunctive') difficulty += 0.2
      if (item.tense && item.tense.includes('Perf')) difficulty += 0.1
      if (response.verbType === 'irregular') difficulty += 0.1
    }
    
    return Math.min(1, difficulty)
  }

  /**
   * Determinar si representa una mejora
   */
  isImprovement(response) {
    if (this.responses.length < 3) return false
    
    const recent = this.responses.slice(-3)
    const avgRecentTime = recent.reduce((sum, r) => sum + (r.responseTime || 5000), 0) / recent.length
    const avgRecentAccuracy = recent.filter(r => r.correct).length / recent.length
    
    const currentTime = response.responseTime || 5000
    const currentAccuracy = response.correct ? 1 : 0
    
    // Es mejora si es más rápido Y/O más preciso que el promedio reciente
    return (currentTime < avgRecentTime * 0.9) || (currentAccuracy > avgRecentAccuracy)
  }

  /**
   * Actualizar streaks emocionales
   */
  updateEmotionalStreaks(response) {
    const confidence = response.confidenceIndicators.adjusted
    const isCorrect = response.correct
    const isImprovement = response.isImprovement
    
    // Confidence streak
    if (confidence > 0.7 && isCorrect) {
      this.streaks.confidence++
      this.streaks.struggle = 0
    } else if (confidence < 0.4 || !isCorrect) {
      this.streaks.struggle++
      this.streaks.confidence = 0
    } else {
      // Neutral response - decay both streaks gradually
      this.streaks.confidence = Math.max(0, this.streaks.confidence - 1)
      this.streaks.struggle = Math.max(0, this.streaks.struggle - 1)
    }
    
    // Improvement streak
    if (isImprovement) {
      this.streaks.improvement++
    } else {
      this.streaks.improvement = Math.max(0, this.streaks.improvement - 1)
    }
    
    // Consistency streak
    if (this.responses.length >= 3) {
      const lastThree = this.responses.slice(-3)
      const confidences = lastThree.map(r => r.confidenceIndicators?.adjusted || 0.5)
      const variation = this.calculateVariation(confidences)
      
      if (variation < 0.2) { // Low variation = consistent
        this.streaks.consistency++
      } else {
        this.streaks.consistency = Math.max(0, this.streaks.consistency - 1)
      }
    }
  }

  /**
   * Actualizar momentum score
   */
  updateMomentumScore() {
    if (this.responses.length === 0) return
    
    const recent = this.responses.slice(-MOMENTUM_CONFIG.MEDIUM_TERM_WINDOW)
    
    // Calcular componentes del score
    const accuracyScore = recent.filter(r => r.correct).length / recent.length
    const speedScore = this.calculateSpeedScore(recent)
    const consistencyScore = this.calculateConsistencyScore(recent)
    const difficultyScore = this.calculateDifficultyHandlingScore(recent)
    const recoveryScore = this.calculateRecoveryScore(recent)
    
    // Weighted average
    this.momentumScore = 
      accuracyScore * MOMENTUM_FACTORS.ACCURACY +
      speedScore * MOMENTUM_FACTORS.RESPONSE_TIME +
      consistencyScore * MOMENTUM_FACTORS.CONSISTENCY +
      difficultyScore * MOMENTUM_FACTORS.DIFFICULTY_PROGRESS +
      recoveryScore * MOMENTUM_FACTORS.RECOVERY_RATE
    
    // Apply time decay if no recent activity
    const timeSinceLastResponse = Date.now() - (recent[recent.length - 1]?.timestamp || Date.now())
    if (timeSinceLastResponse > MOMENTUM_CONFIG.MOMENTUM_DECAY_TIME) {
      const decayFactor = Math.exp(-timeSinceLastResponse / MOMENTUM_CONFIG.MOMENTUM_DECAY_TIME)
      this.momentumScore *= decayFactor
    }
    
    // Ensure bounds
    this.momentumScore = Math.max(0, Math.min(1, this.momentumScore))
  }

  /**
   * Calcular score de velocidad
   */
  calculateSpeedScore(responses) {
    const avgResponseTime = responses.reduce((sum, r) => sum + (r.responseTime || 5000), 0) / responses.length
    
    // 3 segundos = score 1.0, 8 segundos = score 0.0
    return Math.max(0, Math.min(1, (8000 - avgResponseTime) / 5000))
  }

  /**
   * Calcular score de consistencia
   */
  calculateConsistencyScore(responses) {
    if (responses.length < 3) return 0.5
    
    const confidences = responses.map(r => r.confidenceIndicators?.adjusted || 0.5)
    const variation = this.calculateVariation(confidences)
    
    // Menos variación = mayor consistencia
    return Math.max(0, 1 - variation * 2) // Scale variation to 0-1
  }

  /**
   * Calcular score de manejo de dificultad
   */
  calculateDifficultyHandlingScore(responses) {
    const difficultResponses = responses.filter(r => (r.perceivedDifficulty || 0.5) > 0.6)
    if (difficultResponses.length === 0) return 0.5
    
    const correctDifficult = difficultResponses.filter(r => r.correct).length
    return correctDifficult / difficultResponses.length
  }

  /**
   * Calcular score de recuperación
   */
  calculateRecoveryScore(responses) {
    let recoveryInstances = 0
    let totalRecoveries = 0
    
    for (let i = 1; i < responses.length; i++) {
      if (!responses[i-1].correct && responses[i].correct) {
        totalRecoveries++
        
        // Faster recovery = higher score
        const recoveryTime = responses[i].responseTime || 5000
        if (recoveryTime < 6000) recoveryInstances++
      }
    }
    
    return totalRecoveries > 0 ? recoveryInstances / totalRecoveries : 0.5
  }

  /**
   * Actualizar tendencias temporales
   */
  updateTrends() {
    if (this.responses.length < MOMENTUM_CONFIG.TREND_ANALYSIS_MIN) return
    
    const shortTerm = this.responses.slice(-MOMENTUM_CONFIG.SHORT_TERM_WINDOW)
    const mediumTerm = this.responses.slice(-MOMENTUM_CONFIG.MEDIUM_TERM_WINDOW)
    const longTerm = this.responses.slice(-MOMENTUM_CONFIG.LONG_TERM_WINDOW)
    
    this.trends.shortTerm = this.calculateTrend(shortTerm)
    this.trends.mediumTerm = this.calculateTrend(mediumTerm)
    if (longTerm.length >= MOMENTUM_CONFIG.LONG_TERM_WINDOW) {
      this.trends.longTerm = this.calculateTrend(longTerm)
    }
  }

  /**
   * Calcular tendencia para un conjunto de respuestas
   */
  calculateTrend(responses) {
    if (responses.length < 3) return 0
    
    const confidences = responses.map(r => r.confidenceIndicators?.adjusted || 0.5)
    
    // Simple linear regression slope
    const n = confidences.length
    const sumX = (n * (n - 1)) / 2 // Sum of indices 0,1,2,...,n-1
    const sumY = confidences.reduce((sum, conf) => sum + conf, 0)
    const sumXY = confidences.reduce((sum, conf, i) => sum + i * conf, 0)
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    
    // Normalize to -1 to 1 range
    return Math.max(-1, Math.min(1, slope * n))
  }

  /**
   * Actualizar patrones detectados
   */
  updatePatterns() {
    if (this.responses.length < 10) return
    
    // Recovery Rate Pattern
    this.patterns.recoveryRate = this.analyzeRecoveryPattern()
    
    // Difficulty Tolerance Pattern
    this.patterns.difficultyTolerance = this.analyzeDifficultyTolerance()
    
    // Performance Variability Pattern
    this.patterns.performanceVariability = this.analyzePerformanceVariability()
    
    // Learning Velocity Pattern  
    this.patterns.learningVelocity = this.analyzeLearningVelocity()
  }

  /**
   * Analizar patrón de recuperación
   */
  analyzeRecoveryPattern() {
    let recoveryTimes = []
    
    for (let i = 1; i < this.responses.length; i++) {
      if (!this.responses[i-1].correct && this.responses[i].correct) {
        recoveryTimes.push(1) // Immediate recovery
      } else if (!this.responses[i-1].correct && !this.responses[i].correct) {
        // Look ahead for recovery
        let recoverySteps = 0
        for (let j = i + 1; j < Math.min(i + 5, this.responses.length); j++) {
          recoverySteps++
          if (this.responses[j].correct) {
            recoveryTimes.push(recoverySteps)
            break
          }
        }
      }
    }
    
    if (recoveryTimes.length === 0) return 0.5
    
    const avgRecoveryTime = recoveryTimes.reduce((sum, time) => sum + time, 0) / recoveryTimes.length
    return Math.max(0, 1 - (avgRecoveryTime - 1) / 4) // 1 step = 1.0, 5 steps = 0.0
  }

  /**
   * Analizar tolerancia a la dificultad
   */
  analyzeDifficultyTolerance() {
    const difficultResponses = this.responses.filter(r => (r.perceivedDifficulty || 0.5) > 0.6)
    if (difficultResponses.length === 0) return 0.5
    
    const avgDifficultConfidence = difficultResponses.reduce(
      (sum, r) => sum + (r.confidenceIndicators?.adjusted || 0.5), 0
    ) / difficultResponses.length
    
    return avgDifficultConfidence
  }

  /**
   * Analizar variabilidad del rendimiento
   */
  analyzePerformanceVariability() {
    const confidences = this.responses.map(r => r.confidenceIndicators?.adjusted || 0.5)
    const variation = this.calculateVariation(confidences)
    
    return Math.max(0, 1 - variation * 3) // Lower variation = higher score
  }

  /**
   * Analizar velocidad de aprendizaje
   */
  analyzeLearningVelocity() {
    if (this.responses.length < 15) return 0.5
    
    const firstHalf = this.responses.slice(0, Math.floor(this.responses.length / 2))
    const secondHalf = this.responses.slice(Math.floor(this.responses.length / 2))
    
    const firstHalfAvgConfidence = firstHalf.reduce(
      (sum, r) => sum + (r.confidenceIndicators?.adjusted || 0.5), 0
    ) / firstHalf.length
    
    const secondHalfAvgConfidence = secondHalf.reduce(
      (sum, r) => sum + (r.confidenceIndicators?.adjusted || 0.5), 0
    ) / secondHalf.length
    
    const improvement = secondHalfAvgConfidence - firstHalfAvgConfidence
    return Math.max(0, Math.min(1, 0.5 + improvement)) // Center around 0.5
  }

  /**
   * Actualizar estado emocional inferido
   */
  updateEmotionalState(flowState) {
    // Confidence basado en streaks y momentum
    this.emotionalState.confidence = Math.max(0, Math.min(1, 
      this.momentumScore * 0.7 + (this.streaks.confidence / 10) * 0.3
    ))
    
    // Frustration basado en struggle streak y errores recientes
    const recentErrors = this.responses.slice(-5).filter(r => !r.correct).length
    this.emotionalState.frustration = Math.max(0, Math.min(1,
      (this.streaks.struggle / 5) * 0.6 + (recentErrors / 5) * 0.4
    ))
    
    // Engagement basado en flow state y consistency
    let engagementBoost = 0
    if (flowState === 'deep_flow') engagementBoost = 0.3
    else if (flowState === 'light_flow') engagementBoost = 0.2
    else if (flowState === 'frustrated') engagementBoost = -0.3
    
    this.emotionalState.engagement = Math.max(0, Math.min(1,
      0.5 + engagementBoost + (this.streaks.consistency / 10) * 0.2
    ))
    
    // Fatigue basado en tiempo de sesión y declive en performance
    const sessionMinutes = (Date.now() - this.sessionStartTime) / 60000
    const timeBasedFatigue = Math.min(0.8, sessionMinutes / 30) // 30 min = 80% fatigue
    const performanceBasedFatigue = this.trends.shortTerm < -0.5 ? 0.3 : 0
    
    this.emotionalState.fatigue = Math.max(0, Math.min(1,
      timeBasedFatigue + performanceBasedFatigue
    ))
  }

  /**
   * Detectar tipo de momentum
   */
  detectMomentumType() {
    const score = this.momentumScore
    const trend = this.trends.shortTerm
    
    // Peak Performance: Alto score y tendencia positiva
    if (score >= MOMENTUM_THRESHOLDS.PEAK_PERFORMANCE && trend > 0.3) {
      return MOMENTUM_TYPES.PEAK_PERFORMANCE
    }
    
    // Confidence Building: Score medio-alto con mejora
    if (score >= MOMENTUM_THRESHOLDS.CONFIDENCE_BUILDING && trend > 0.1) {
      return MOMENTUM_TYPES.CONFIDENCE_BUILDING
    }
    
    // Confidence Crisis: Bajo score con tendencia negativa
    if (score <= MOMENTUM_THRESHOLDS.CONFIDENCE_CRISIS && trend < -0.3) {
      return MOMENTUM_TYPES.CONFIDENCE_CRISIS
    }
    
    // Recovery Mode: Bajo score pero mejorando
    if (score <= MOMENTUM_THRESHOLDS.RECOVERY_MODE && trend > 0.2) {
      return MOMENTUM_TYPES.RECOVERY_MODE
    }
    
    // Minor Setback: Score medio-bajo con declive
    if (score <= MOMENTUM_THRESHOLDS.MINOR_SETBACK && trend < -0.1) {
      return MOMENTUM_TYPES.MINOR_SETBACK
    }
    
    // Steady Progress: Default para scores medios
    return MOMENTUM_TYPES.STEADY_PROGRESS
  }

  /**
   * Cambiar tipo de momentum
   */
  changeMomentum(newMomentum, triggeringResponse) {
    const previousMomentum = this.currentMomentum
    const now = Date.now()
    
    // Registrar cambio
    this.momentumHistory.push({
      previousMomentum,
      newMomentum,
      timestamp: now,
      duration: now - this.lastMomentumChange,
      triggeringResponse: {
        correct: triggeringResponse.correct,
        responseTime: triggeringResponse.responseTime,
        confidence: triggeringResponse.confidenceIndicators?.adjusted
      },
      context: {
        momentumScore: this.momentumScore,
        trend: this.trends.shortTerm,
        streaks: { ...this.streaks }
      }
    })
    
    this.currentMomentum = newMomentum
    this.lastMomentumChange = now
    
    console.log(`📈 Momentum Changed: ${previousMomentum} → ${newMomentum} (Score: ${this.momentumScore.toFixed(2)})`)
  }

  /**
   * Obtener recomendaciones basadas en momentum
   */
  getMomentumRecommendations() {
    const recommendations = []
    
    switch (this.currentMomentum) {
      case MOMENTUM_TYPES.PEAK_PERFORMANCE:
        recommendations.push({
          type: 'maintain',
          message: '🚀 ¡Momentum extraordinario! Mantén este ritmo.',
          action: 'continue_challenging_content',
          priority: 'high'
        })
        break
        
      case MOMENTUM_TYPES.CONFIDENCE_BUILDING:
        recommendations.push({
          type: 'reinforce',
          message: '📈 Tu confianza está creciendo. ¡Excelente progreso!',
          action: 'gradually_increase_difficulty', 
          priority: 'medium'
        })
        break
        
      case MOMENTUM_TYPES.RECOVERY_MODE:
        recommendations.push({
          type: 'support',
          message: '💪 Te estás recuperando bien. Continúa con paciencia.',
          action: 'provide_easier_content',
          priority: 'high'
        })
        break
        
      case MOMENTUM_TYPES.CONFIDENCE_CRISIS:
        recommendations.push({
          type: 'recover',
          message: '🌱 Vamos paso a paso. Tómate tu tiempo.',
          action: 'switch_to_confidence_building',
          priority: 'critical'
        })
        break
        
      case MOMENTUM_TYPES.MINOR_SETBACK:
        recommendations.push({
          type: 'adjust',
          message: '🔄 Un pequeño ajuste y vuelves al camino.',
          action: 'slight_difficulty_reduction',
          priority: 'medium'
        })
        break
        
      default:
        recommendations.push({
          type: 'continue',
          message: '📚 Progreso constante. Sigue adelante.',
          action: 'maintain_current_level',
          priority: 'low'
        })
    }
    
    // Recomendaciones adicionales basadas en estado emocional
    if (this.emotionalState.fatigue > 0.7) {
      recommendations.push({
        type: 'rest',
        message: '😴 Considera tomar un descanso.',
        action: 'suggest_break',
        priority: 'high'
      })
    }
    
    if (this.emotionalState.frustration > 0.6) {
      recommendations.push({
        type: 'reassure',
        message: '🤗 Está bien sentirse desafiado. Eres capaz.',
        action: 'provide_encouragement',
        priority: 'medium'
      })
    }
    
    return recommendations
  }

  /**
   * Obtener insights sobre el momentum
   */
  getMomentumInsights() {
    const insights = []
    
    // Insight sobre tendencias
    if (this.trends.shortTerm > 0.5) {
      insights.push('📈 Tu rendimiento está mejorando consistentemente')
    } else if (this.trends.shortTerm < -0.5) {
      insights.push('📉 Tu rendimiento ha declinado recientemente')
    }
    
    // Insight sobre streaks
    if (this.streaks.confidence > 7) {
      insights.push('🔥 ¡Racha de confianza excepcional!')
    } else if (this.streaks.consistency > 5) {
      insights.push('⚡ Muy consistente en tu práctica')
    }
    
    // Insight sobre patrones
    if (this.patterns.recoveryRate > 0.8) {
      insights.push('🏃‍♂️ Te recuperas muy rápido de los errores')
    } else if (this.patterns.difficultyTolerance > 0.7) {
      insights.push('💎 Manejas bien el contenido difícil')
    }
    
    // Insight sobre aprendizaje
    if (this.patterns.learningVelocity > 0.7) {
      insights.push('🚀 Tu velocidad de aprendizaje es impresionante')
    }
    
    return insights
  }

  /**
   * Obtener métricas completas
   */
  getMomentumMetrics() {
    return {
      currentMomentum: this.currentMomentum,
      momentumScore: Math.round(this.momentumScore * 100),
      trends: {
        shortTerm: Math.round(this.trends.shortTerm * 100),
        mediumTerm: Math.round(this.trends.mediumTerm * 100),
        longTerm: Math.round(this.trends.longTerm * 100)
      },
      streaks: { ...this.streaks },
      patterns: {
        recoveryRate: Math.round(this.patterns.recoveryRate * 100),
        difficultyTolerance: Math.round(this.patterns.difficultyTolerance * 100),
        performanceVariability: Math.round(this.patterns.performanceVariability * 100),
        learningVelocity: Math.round(this.patterns.learningVelocity * 100)
      },
      emotionalState: {
        confidence: Math.round(this.emotionalState.confidence * 100),
        frustration: Math.round(this.emotionalState.frustration * 100),
        engagement: Math.round(this.emotionalState.engagement * 100),
        fatigue: Math.round(this.emotionalState.fatigue * 100)
      },
      sessionDuration: Date.now() - this.sessionStartTime,
      totalResponses: this.responses.length,
      momentumChanges: this.momentumHistory.length
    }
  }

  /**
   * Utilidades matemáticas
   */
  calculateVariation(numbers) {
    if (numbers.length < 2) return 0
    const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length
    const variance = numbers.reduce((sum, num) => sum + Math.pow(num - mean, 2), 0) / numbers.length
    return Math.sqrt(variance)
  }
}

// Export singleton
export const momentumTracker = new MomentumTracker()

// Utility functions
export function initializeMomentumTracking() {
  momentumTracker.reset()
  console.log('📈 Momentum Tracking initialized')
  return momentumTracker
}

export function processResponseForMomentum(response, flowState = null) {
  return momentumTracker.processResponse(response, flowState)
}

export function getCurrentMomentum() {
  return momentumTracker.currentMomentum
}

export function getMomentumMetrics() {
  return momentumTracker.getMomentumMetrics()
}

export function getMomentumRecommendations() {
  return momentumTracker.getMomentumRecommendations()
}

// Browser console integration
if (typeof window !== 'undefined') {
  window.momentumTracker = {
    getMomentum: () => momentumTracker.currentMomentum,
    getMetrics: () => momentumTracker.getMomentumMetrics(),
    getRecommendations: () => momentumTracker.getMomentumRecommendations(),
    getInsights: () => momentumTracker.getMomentumInsights(),
    reset: () => momentumTracker.reset()
  }
  
  console.log(`
📈 Momentum Tracking Available!

Browser console commands:
  window.momentumTracker.getMomentum()          // Current momentum type
  window.momentumTracker.getMetrics()           // Detailed momentum metrics
  window.momentumTracker.getRecommendations()   // Momentum-based recommendations  
  window.momentumTracker.getInsights()          // Learning insights
  window.momentumTracker.reset()                // Reset for new session
`)
}