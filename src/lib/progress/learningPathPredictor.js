// Sistema predictivo de rutas de aprendizaje usando ML ligero
// Analiza patrones exitosos para recomendar secuencias óptimas de práctica

import { PROGRESS_CONFIG } from './config.js'
import { confidenceEngine } from './confidenceEngine.js'
import { temporalIntelligence } from './temporalIntelligence.js'
import { flowDetector } from './flowStateDetection.js'
import { getMasteryByUser, getAttemptsByUser } from './database.js'
import { getCurrentUserId } from './userManager.js'

/**
 * Predictor de rutas de aprendizaje basado en análisis de patrones
 * Usa ML ligero para predecir secuencias óptimas de práctica
 */
export class LearningPathPredictor {
  constructor(userId = null) {
    this.userId = userId || getCurrentUserId()
    this.mlConfig = PROGRESS_CONFIG.FEATURE_FLAGS

    // Cache para patrones analizados
    this.patternCache = new Map()
    this.lastAnalysis = null

    // Matrices de transición para secuencias exitosas
    this.successTransitions = new Map()
    this.failureTransitions = new Map()

    // Pesos para factores de predicción
    this.predictionWeights = {
      HISTORICAL_SUCCESS: 0.35,   // Éxito histórico en secuencias
      USER_MASTERY: 0.25,        // Nivel actual de mastery
      TEMPORAL_CONTEXT: 0.20,    // Contexto temporal y fatiga
      EMOTIONAL_STATE: 0.15,     // Estado emocional actual
      DIFFICULTY_PROGRESSION: 0.05 // Progresión de dificultad
    }

    logger.systemInit('Predictor de Ruta de Aprendizaje inicializado')
  }

  /**
   * Predice las próximas combinaciones óptimas para el usuario
   * @param {Object} options - Configuración de predicción
   * @returns {Promise<Array>} Secuencia predicha de combinaciones
   */
  async predictNextOptimalCombinations(options = {}) {
    try {
      const {
        sessionLength = 15,          // minutos
        maxCombinations = 8,         // máximo combinaciones
        includeNewContent = true,    // incluir contenido nuevo
        difficultyTolerance = 'medium' // 'easy', 'medium', 'hard'
      } = options

      // Usar las variables para evitar eslint warnings
      void sessionLength
      void includeNewContent
      void difficultyTolerance

      // Verificar si ML está habilitado
      if (!this.mlConfig.ML_RECOMMENDATIONS) {
        return this.getFallbackRecommendations(options)
      }

      // Analizar contexto actual del usuario
      const context = await this.analyzeCurrentContext()

      // Obtener patrones históricos
      const patterns = await this.analyzeHistoricalPatterns()

      // Construir modelo predictivo ligero
      const predictions = this.buildPredictionModel(context, patterns, options)

      // Filtrar y ordenar por probabilidad de éxito
      const optimizedSequence = this.optimizeSequence(predictions, options)

      logger.debug('Learning path predicted', {
        predictionsGenerated: predictions.length,
        finalSequence: optimizedSequence.length,
        sessionLength,
        maxCombinations
      })

      return optimizedSequence

    } catch (error) {
      logger.error('Error prediciendo ruta de aprendizaje:', error)
      return this.getFallbackRecommendations(options)
    }
  }

  /**
   * Analiza el contexto actual del usuario
   */
  async analyzeCurrentContext() {
    const [masteryData, confidenceState, temporalState, flowState] = await Promise.all([
      getMasteryByUser(this.userId),
      this.getConfidenceContext(),
      this.getTemporalContext(),
      this.getFlowContext()
    ])

    // Crear mapa de mastery por combinación
    const masteryMap = new Map(
      masteryData.map(m => [`${m.mood}|${m.tense}`, m.score])
    )

    return {
      mastery: masteryMap,
      confidence: confidenceState,
      temporal: temporalState,
      flow: flowState,
      timestamp: Date.now()
    }
  }

  /**
   * Obtiene contexto de confianza
   */
  getConfidenceContext() {
    const state = confidenceEngine.getCurrentConfidenceState()
    return {
      overall: state.overall,
      level: state.level,
      strongAreas: state.strongAreas.slice(0, 3),
      weakAreas: state.improvementAreas.slice(0, 3),
      recentAccuracy: state.sessionStats.recentAccuracy
    }
  }

  /**
   * Obtiene contexto temporal
   */
  getTemporalContext() {
    const state = temporalIntelligence.getCurrentTemporalStats()
    const schedulingRec = temporalIntelligence.getSRSSchedulingRecommendations()

    return {
      currentFatigue: state.currentFatigue,
      optimalTime: schedulingRec.isOptimalTime,
      shouldDelay: schedulingRec.shouldDelay,
      cognitiveLoad: state.currentCognitiveLoad
    }
  }

  /**
   * Obtiene contexto de flow
   */
  getFlowContext() {
    const metrics = flowDetector.getFlowMetrics()
    const recommendations = flowDetector.getSRSSchedulingRecommendations()

    return {
      currentState: metrics.currentState,
      consistencyScore: metrics.consistencyScore,
      shouldDelay: recommendations.shouldDelay,
      shouldAccelerate: recommendations.shouldAccelerate
    }
  }

  /**
   * Analiza patrones históricos de éxito/fracaso
   */
  async analyzeHistoricalPatterns() {
    // Usar cache si está disponible y reciente (< 1 hora)
    const cacheKey = `patterns_${this.userId}`
    if (this.patternCache.has(cacheKey)) {
      const cached = this.patternCache.get(cacheKey)
      if (Date.now() - cached.timestamp < 3600000) { // 1 hora
        return cached.data
      }
    }

    try {
      // Obtener intentos recientes (últimas 2 semanas)
      const cutoff = Date.now() - (14 * 24 * 60 * 60 * 1000)
      const attempts = await getAttemptsByUser(this.userId)
      const recentAttempts = attempts.filter(a => new Date(a.timestamp).getTime() > cutoff)

      if (recentAttempts.length < 10) {
        // Datos insuficientes para patrones ML
        return this.getDefaultPatterns()
      }

      // Analizar secuencias exitosas
      const patterns = this.extractPatterns(recentAttempts)

      // Cache resultados
      this.patternCache.set(cacheKey, {
        data: patterns,
        timestamp: Date.now()
      })

      return patterns

    } catch (error) {
      logger.error('Error analyzing historical patterns:', error)
      return this.getDefaultPatterns()
    }
  }

  /**
   * Extrae patrones de secuencias exitosas/fallidas
   */
  extractPatterns(attempts) {
    // Agrupar intentos por sesiones (gap > 30 min = nueva sesión)
    const sessions = this.groupAttemptsBySession(attempts)

    const patterns = {
      successfulSequences: [],
      failedSequences: [],
      transitionMatrix: new Map(),
      difficultyProgression: new Map(),
      temporalPatterns: new Map()
    }

    sessions.forEach(session => {
      if (session.length < 2) return

      const sessionSuccess = session.filter(a => a.isCorrect).length / session.length > 0.7

      // Analizar transiciones entre combinaciones
      for (let i = 0; i < session.length - 1; i++) {
        const current = `${session[i].mood}|${session[i].tense}`
        const next = `${session[i + 1].mood}|${session[i + 1].tense}`
        const transition = `${current}→${next}`

        if (!patterns.transitionMatrix.has(transition)) {
          patterns.transitionMatrix.set(transition, { success: 0, total: 0 })
        }

        const stats = patterns.transitionMatrix.get(transition)
        stats.total++
        if (session[i + 1].isCorrect) stats.success++
      }

      // Clasificar secuencia como exitosa o fallida
      if (sessionSuccess) {
        patterns.successfulSequences.push(session.map(a => `${a.mood}|${a.tense}`))
      } else {
        patterns.failedSequences.push(session.map(a => `${a.mood}|${a.tense}`))
      }

      // Analizar patrones temporales
      const sessionHour = new Date(session[0].timestamp).getHours()
      if (!patterns.temporalPatterns.has(sessionHour)) {
        patterns.temporalPatterns.set(sessionHour, { sessions: 0, avgAccuracy: 0 })
      }
      const temporal = patterns.temporalPatterns.get(sessionHour)
      temporal.sessions++
      temporal.avgAccuracy = (temporal.avgAccuracy * (temporal.sessions - 1) +
                              (session.filter(a => a.isCorrect).length / session.length)) / temporal.sessions
    })

    return patterns
  }

  /**
   * Agrupa intentos por sesiones de práctica
   */
  groupAttemptsBySession(attempts) {
    attempts.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))

    const sessions = []
    let currentSession = []

    attempts.forEach(attempt => {
      if (currentSession.length === 0) {
        currentSession.push(attempt)
        return
      }

      const lastAttempt = currentSession[currentSession.length - 1]
      const timeDiff = new Date(attempt.timestamp) - new Date(lastAttempt.timestamp)

      if (timeDiff > 30 * 60 * 1000) { // 30 minutos = nueva sesión
        sessions.push([...currentSession])
        currentSession = [attempt]
      } else {
        currentSession.push(attempt)
      }
    })

    if (currentSession.length > 0) {
      sessions.push(currentSession)
    }

    return sessions
  }

  /**
   * Construye modelo predictivo ligero
   */
  buildPredictionModel(context, patterns, options) {
    const predictions = []

    // Obtener todas las combinaciones posibles
    const allCombinations = this.getAllCombinations(options.includeNewContent)

    allCombinations.forEach(combo => {
      const prediction = this.calculateCombinationScore(combo, context, patterns, options)

      if (prediction.score > 0.3) { // Umbral mínimo de confianza
        predictions.push({
          combination: combo,
          score: prediction.score,
          confidence: prediction.confidence,
          reasoning: prediction.reasoning,
          estimatedDuration: this.estimateDuration(combo, context),
          difficulty: prediction.difficulty
        })
      }
    })

    return predictions.sort((a, b) => b.score - a.score)
  }

  /**
   * Calcula score predictivo para una combinación
   */
  calculateCombinationScore(combo, context, patterns, options) {
    const comboKey = `${combo.mood}|${combo.tense}`
    let score = 0.5 // Base neutral
    let confidence = 0.5
    const reasoning = []

    // Factor 1: Éxito histórico en transiciones
    const transitionScore = this.calculateTransitionScore(comboKey, patterns)
    score += transitionScore * this.predictionWeights.HISTORICAL_SUCCESS
    if (transitionScore > 0.7) reasoning.push('high_historical_success')
    else if (transitionScore < 0.3) reasoning.push('low_historical_success')

    // Factor 2: Nivel actual de mastery
    const masteryScore = (context.mastery.get(comboKey) || 0) / 100
    const masteryFactor = this.calculateMasteryFactor(masteryScore, options)
    score += masteryFactor * this.predictionWeights.USER_MASTERY
    if (masteryScore < 0.4) reasoning.push('needs_improvement')
    else if (masteryScore > 0.8) reasoning.push('already_mastered')

    // Factor 3: Contexto temporal
    const temporalFactor = this.calculateTemporalFactor(context.temporal)
    score += temporalFactor * this.predictionWeights.TEMPORAL_CONTEXT
    if (context.temporal.shouldDelay) reasoning.push('temporal_delay_recommended')
    else if (context.temporal.optimalTime) reasoning.push('optimal_timing')

    // Factor 4: Estado emocional
    const emotionalFactor = this.calculateEmotionalFactor(context.confidence, context.flow)
    score += emotionalFactor * this.predictionWeights.EMOTIONAL_STATE
    if (context.confidence.level === 'struggling') reasoning.push('emotional_support_needed')
    else if (context.flow.currentState === 'deep_flow') reasoning.push('flow_state_advantage')

    // Factor 5: Progresión de dificultad
    const difficultyFactor = this.calculateDifficultyFactor(combo, context)
    score += difficultyFactor * this.predictionWeights.DIFFICULTY_PROGRESSION

    // Normalizar score
    score = Math.max(0, Math.min(1, score))

    // Calcular confianza basada en cantidad de datos históricos
    const transitionData = patterns.transitionMatrix.get(`*→${comboKey}`) || { total: 0 }
    confidence = Math.min(1, transitionData.total / 10) // Max confianza con 10+ datos

    return {
      score,
      confidence,
      reasoning,
      difficulty: this.calculateDifficulty(combo, context)
    }
  }

  /**
   * Calcula score de transición basado en patrones históricos
   */
  calculateTransitionScore(comboKey, patterns) {
    let totalSuccess = 0
    let totalAttempts = 0

    // Buscar transiciones hacia esta combinación
    patterns.transitionMatrix.forEach((stats, transition) => {
      if (transition.endsWith(`→${comboKey}`)) {
        totalSuccess += stats.success
        totalAttempts += stats.total
      }
    })

    return totalAttempts > 0 ? totalSuccess / totalAttempts : 0.5
  }

  /**
   * Factor de mastery para predicción
   */
  calculateMasteryFactor(masteryScore, options) {
    if (options.difficultyTolerance === 'easy' && masteryScore > 0.7) {
      return 0.8 // Preferir contenido conocido
    } else if (options.difficultyTolerance === 'hard' && masteryScore < 0.5) {
      return 0.3 // Evitar contenido muy difícil
    } else if (masteryScore >= 0.4 && masteryScore <= 0.7) {
      return 1.0 // Zona óptima de desafío
    }

    return 0.5 // Neutral
  }

  /**
   * Factor temporal para scoring
   */
  calculateTemporalFactor(temporal) {
    let factor = 0.5

    if (temporal.shouldDelay) {
      factor = 0.2 // Penalizar si debe retrasar
    } else if (temporal.optimalTime) {
      factor = 0.9 // Bonificar tiempo óptimo
    }

    // Ajustar por fatiga y carga cognitiva
    factor *= (1 - temporal.currentFatigue * 0.3)
    factor *= (1 - temporal.cognitiveLoad * 0.2)

    return Math.max(0, Math.min(1, factor))
  }

  /**
   * Factor emocional para scoring
   */
  calculateEmotionalFactor(confidence, flow) {
    let factor = 0.5

    // Ajustar por nivel de confianza
    switch (confidence.level) {
      case 'struggling':
        factor = 0.2
        break
      case 'hesitant':
        factor = 0.4
        break
      case 'confident':
        factor = 0.8
        break
      case 'overconfident':
        factor = 0.6 // Reducir un poco para evitar estancamiento
        break
      default:
        factor = 0.5
    }

    // Ajustar por estado de flow
    if (flow.shouldDelay) {
      factor *= 0.5
    } else if (flow.shouldAccelerate) {
      factor *= 1.3
    }

    return Math.max(0, Math.min(1, factor))
  }

  /**
   * Factor de progresión de dificultad
   */
  calculateDifficultyFactor(combo, context) {
    // Lógica simple: preferir progresión gradual
    const avgMastery = Array.from(context.mastery.values()).reduce((sum, val) => sum + val, 0) /
                       Math.max(1, context.mastery.size)

    const comboDifficulty = this.estimateCombinationDifficulty(combo)

    // Diferencia óptima: ligeramente más difícil que el promedio actual
    const optimalDifficulty = (avgMastery / 100) + 0.1
    const difficultyGap = Math.abs(comboDifficulty - optimalDifficulty)

    return Math.max(0, 1 - difficultyGap * 2) // Penalizar gaps grandes
  }

  /**
   * Estima dificultad de una combinación
   */
  estimateCombinationDifficulty(combo) {
    // Mapeo básico de dificultad por mood/tense
    const difficultyMap = {
      'indicative': 0.3,
      'subjunctive': 0.7,
      'imperative': 0.6,
      'conditional': 0.5
    }

    const tenseComplexity = {
      'pres': 0.2,
      'pretIndef': 0.4,
      'impf': 0.3,
      'subjPres': 0.6,
      'subjImpf': 0.8,
      'fut': 0.4,
      'cond': 0.5
    }

    const baseDifficulty = difficultyMap[combo.mood] || 0.5
    const tenseBonus = tenseComplexity[combo.tense] || 0.5

    return Math.min(1, baseDifficulty + tenseBonus * 0.3)
  }

  /**
   * Optimiza secuencia final basada en múltiples criterios
   */
  optimizeSequence(predictions, options) {
    if (predictions.length === 0) {
      return this.getFallbackRecommendations(options)
    }

    const optimized = []
    const maxItems = Math.min(options.maxCombinations, predictions.length)

    // Selección balanceada: alternar entre alta prioridad y variedad
    const highPriority = predictions.filter(p => p.score > 0.7).slice(0, Math.ceil(maxItems * 0.6))
    const mediumPriority = predictions.filter(p => p.score >= 0.5 && p.score <= 0.7).slice(0, Math.ceil(maxItems * 0.3))
    const variety = predictions.filter(p => p.score < 0.5).slice(0, Math.floor(maxItems * 0.1))

    optimized.push(...highPriority, ...mediumPriority, ...variety)

    // Ordenar por score final y limitar
    return optimized
      .sort((a, b) => b.score - a.score)
      .slice(0, options.maxCombinations)
      .map(p => ({
        ...p.combination,
        predictionScore: p.score,
        confidence: p.confidence,
        reasoning: p.reasoning,
        estimatedDuration: p.estimatedDuration
      }))
  }

  /**
   * Obtiene todas las combinaciones posibles
   */
  getAllCombinations(includeNew = true) {
    // Combinaciones básicas para el predictor
    const combinations = [
      { mood: 'indicative', tense: 'pres' },
      { mood: 'indicative', tense: 'pretIndef' },
      { mood: 'indicative', tense: 'impf' },
      { mood: 'indicative', tense: 'fut' },
      { mood: 'subjunctive', tense: 'subjPres' },
      { mood: 'subjunctive', tense: 'subjImpf' },
      { mood: 'conditional', tense: 'cond' },
      { mood: 'imperative', tense: 'impAff' }
    ]

    if (includeNew) {
      // Agregar combinaciones más avanzadas
      combinations.push(
        { mood: 'indicative', tense: 'pretPerf' },
        { mood: 'subjunctive', tense: 'subjPerf' },
        { mood: 'conditional', tense: 'condPerf' }
      )
    }

    return combinations
  }

  /**
   * Estima duración para una combinación
   */
  estimateDuration(combo, context) {
    const baseDuration = 2 // minutos base por combinación

    // Ajustar por mastery existente
    const comboKey = `${combo.mood}|${combo.tense}`
    const mastery = context.mastery.get(comboKey) || 0

    let duration = baseDuration
    if (mastery < 40) duration *= 1.5 // Más tiempo si es débil
    else if (mastery > 80) duration *= 0.7 // Menos tiempo si domina

    return Math.round(duration)
  }

  /**
   * Calcula dificultad final
   */
  calculateDifficulty(combo, context) {
    const intrinsicDifficulty = this.estimateCombinationDifficulty(combo)
    const comboKey = `${combo.mood}|${combo.tense}`
    const userMastery = (context.mastery.get(comboKey) || 0) / 100

    // Dificultad percibida = dificultad intrínseca - mastery del usuario
    const perceivedDifficulty = Math.max(0, intrinsicDifficulty - userMastery * 0.5)

    if (perceivedDifficulty < 0.3) return 'easy'
    if (perceivedDifficulty < 0.6) return 'medium'
    return 'hard'
  }

  /**
   * Patrones por defecto cuando no hay datos suficientes
   */
  getDefaultPatterns() {
    return {
      successfulSequences: [
        ['indicative|pres', 'indicative|pretIndef', 'indicative|impf'],
        ['subjunctive|subjPres', 'indicative|pres', 'subjunctive|subjPres']
      ],
      failedSequences: [],
      transitionMatrix: new Map(),
      difficultyProgression: new Map(),
      temporalPatterns: new Map()
    }
  }

  /**
   * Recomendaciones de fallback cuando ML falla
   */
  getFallbackRecommendations(options) {
    logger.debug('Using fallback recommendations')

    const fallbacks = [
      { mood: 'indicative', tense: 'pres', predictionScore: 0.7, confidence: 0.5 },
      { mood: 'indicative', tense: 'pretIndef', predictionScore: 0.6, confidence: 0.5 },
      { mood: 'subjunctive', tense: 'subjPres', predictionScore: 0.5, confidence: 0.4 }
    ]

    return fallbacks.slice(0, options.maxCombinations || 3)
  }

  /**
   * Limpia cache de patrones
   */
  clearCache() {
    this.patternCache.clear()
    this.lastAnalysis = null
  }
}

// Instancia singleton
export const learningPathPredictor = new LearningPathPredictor()

/**
 * Función helper para uso directo
 */
export async function predictOptimalSequence(options = {}) {
  return learningPathPredictor.predictNextOptimalCombinations(options)
}

// Debug en navegador
if (typeof window !== 'undefined') {
  window.SpanishConjugator = window.SpanishConjugator || {}
  window.SpanishConjugator.LearningPathPredictor = {
    predict: predictOptimalSequence,
    clearCache: () => learningPathPredictor.clearCache(),
    instance: learningPathPredictor
  }
}

export default learningPathPredictor