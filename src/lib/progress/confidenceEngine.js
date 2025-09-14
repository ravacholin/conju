// Motor de Confianza y Auto-eficacia
// Analiza patrones de respuesta para construir perfiles de confianza granulares

import { PROGRESS_CONFIG } from './config.js';
import { logger } from './logger.js';
import { memoryManager, registerInterval } from './memoryManager.js';

/**
 * Sistema de análisis de confianza basado en múltiples dimensiones
 */
export class ConfidenceEngine {
  constructor() {
    this.confidenceProfiles = new Map() // verb/tense/mood -> confidence data
    this.responsePatterns = []
    this.sessionConfidence = {
      overall: 0.5,
      byCategory: new Map(),
      trends: [],
      calibration: 0.5 // qué tan bien calibrada está la confianza percibida vs. real
    }
    this.confidenceThresholds = PROGRESS_CONFIG.EMOTIONAL_INTELLIGENCE.CONFIDENCE.THRESHOLDS
    this.init()
  }

  async init() {
    await this.loadConfidenceData()
  }

  /**
   * Procesa una respuesta del usuario para análisis de confianza
   */
  processResponse(response) {
    const {
      isCorrect,
      responseTime,
      verb,
      mood,
      tense,
      person,
      hintsUsed = 0,
      selfReportedConfidence = null, // si el usuario reporta su confianza
      previousAttempts = 0,
      sessionContext = {}
    } = response

    // Crear entrada de respuesta detallada
    const responseEntry = {
      timestamp: Date.now(),
      verb,
      mood,
      tense,
      person,
      isCorrect,
      responseTime,
      hintsUsed,
      selfReportedConfidence,
      previousAttempts,
      sessionContext,
      confidenceIndicators: this.analyzeConfidenceIndicators(response)
    }

    // Agregar a historial de patrones
    this.responsePatterns.push(responseEntry)
    if (this.responsePatterns.length > 1000) {
      this.responsePatterns = this.responsePatterns.slice(-500) // Mantener últimas 500
    }

    // Actualizar perfil de confianza para esta categoría
    this.updateConfidenceProfile(responseEntry)

    // Analizar calibración de confianza
    this.updateConfidenceCalibration(responseEntry)

    // Calcular confianza actualizada
    const updatedConfidence = this.calculateConfidenceUpdate(responseEntry)

    // Generar recomendaciones
    const recommendations = this.generateConfidenceRecommendations(updatedConfidence)

    return {
      confidence: updatedConfidence,
      calibration: this.sessionConfidence.calibration,
      recommendations,
      insights: this.generateConfidenceInsights(responseEntry),
      nextSuggestions: this.getNextPracticeTargets(updatedConfidence)
    }
  }

  /**
   * Analiza indicadores de confianza basado en comportamiento
   */
  analyzeConfidenceIndicators(response) {
    const { responseTime, isCorrect, hintsUsed, previousAttempts } = response

    const indicators = {
      speed: this.analyzeResponseSpeed(responseTime),
      accuracy: isCorrect,
      help_seeking: hintsUsed > 0,
      persistence: previousAttempts > 0,
      fluency: responseTime < 3000 && isCorrect, // Respuesta fluida
      hesitation: responseTime > 8000, // Demasiado tiempo pensando
      impulsiveness: responseTime < 1000 && !isCorrect // Muy rápido pero incorrecto
    }

    // Calcular score de confianza comportamental (0-1)
    let confidenceScore = 0.5 // Base neutral

    if (indicators.fluency) confidenceScore += 0.3
    if (indicators.accuracy && !indicators.help_seeking) confidenceScore += 0.2
    if (indicators.hesitation) confidenceScore -= 0.2
    if (indicators.impulsiveness) confidenceScore -= 0.3
    if (indicators.help_seeking) confidenceScore -= 0.1
    if (previousAttempts > 2) confidenceScore -= 0.2

    return {
      ...indicators,
      behavioral_confidence: Math.max(0, Math.min(1, confidenceScore))
    }
  }

  /**
   * Analiza la velocidad de respuesta en contexto
   */
  analyzeResponseSpeed(responseTime) {
    // Categorizar velocidad basado en benchmarks
    if (responseTime < 1500) return 'very_fast'
    if (responseTime < 3000) return 'fast'
    if (responseTime < 6000) return 'normal'
    if (responseTime < 10000) return 'slow'
    return 'very_slow'
  }

  /**
   * Actualiza el perfil de confianza para una categoría específica
   */
  updateConfidenceProfile(responseEntry) {
    const { verb, mood, tense } = responseEntry
    const key = `${mood}|${tense}|${verb}`

    if (!this.confidenceProfiles.has(key)) {
      this.confidenceProfiles.set(key, {
        totalAttempts: 0,
        correctAttempts: 0,
        averageResponseTime: 0,
        confidence: 0.5,
        trend: 'neutral',
        lastSeen: 0,
        strengthAreas: [],
        improvementAreas: [],
        calibrationHistory: []
      })
    }

    const profile = this.confidenceProfiles.get(key)
    
    // Actualizar estadísticas básicas
    profile.totalAttempts += 1
    if (responseEntry.isCorrect) profile.correctAttempts += 1
    
    // Actualizar tiempo promedio con peso exponencial
    const alpha = 0.3
    profile.averageResponseTime = alpha * responseEntry.responseTime + 
                                 (1 - alpha) * profile.averageResponseTime

    // Calcular nueva confianza basada en múltiples factores
    const accuracy = profile.correctAttempts / profile.totalAttempts
    const speedFactor = this.calculateSpeedConfidenceFactor(profile.averageResponseTime)
    const consistencyFactor = this.calculateConsistencyFactor(key)

    profile.confidence = (
      accuracy * 0.4 + 
      speedFactor * 0.2 + 
      consistencyFactor * 0.2
    )

    // Actualizar tendencia
    profile.trend = this.calculateTrend(key)
    profile.lastSeen = Date.now()

    // Identificar áreas fuertes y de mejora
    this.updateStrengthAreas(profile, responseEntry)
  }

  /**
   * Calcula factor de confianza basado en velocidad
   */
  calculateSpeedConfidenceFactor(avgTime) {
    const { OPTIMAL_MIN, OPTIMAL_MAX, FAST_THRESHOLD, SLOW_THRESHOLD } = 
      PROGRESS_CONFIG.EMOTIONAL_INTELLIGENCE.CONFIDENCE.SPEED_FACTORS
    
    // Curva óptima basada en configuración
    if (avgTime >= OPTIMAL_MIN && avgTime <= OPTIMAL_MAX) return 1.0
    if (avgTime >= FAST_THRESHOLD && avgTime <= SLOW_THRESHOLD) return 0.8
    if (avgTime < FAST_THRESHOLD) return 0.4 // Muy rápido puede indicar adivinanza
    if (avgTime > SLOW_THRESHOLD) return Math.max(0.2, 1.0 - (avgTime - SLOW_THRESHOLD) / 10000)
    return 0.3
  }

  /**
   * Calcula factor de consistencia temporal
   */
  calculateConsistencyFactor(categoryKey) {
    const recentResponses = this.responsePatterns
      .filter(r => `${r.mood}|${r.tense}|${r.verb}` === categoryKey)
      .slice(-10) // Últimas 10 respuestas de esta categoría

    if (recentResponses.length < 3) return 0.5

    const accuracies = recentResponses.map(r => r.isCorrect ? 1 : 0)
    const variance = this.calculateVariance(accuracies)
    
    // Menor varianza = mayor consistencia = mayor confianza
    return Math.max(0.1, 1.0 - variance)
  }

  /**
   * Calcula varianza de un array
   */
  calculateVariance(arr) {
    const mean = arr.reduce((sum, val) => sum + val, 0) / arr.length
    const variance = arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / arr.length
    return variance
  }

  /**
   * Calcula tendencia de mejora/decline
   */
  calculateTrend(categoryKey) {
    const recentResponses = this.responsePatterns
      .filter(r => `${r.mood}|${r.tense}|${r.verb}` === categoryKey)
      .slice(-15)

    if (recentResponses.length < 5) return 'neutral'

    const firstHalf = recentResponses.slice(0, Math.floor(recentResponses.length / 2))
    const secondHalf = recentResponses.slice(Math.floor(recentResponses.length / 2))

    const firstAccuracy = firstHalf.reduce((sum, r) => sum + (r.isCorrect ? 1 : 0), 0) / firstHalf.length
    const secondAccuracy = secondHalf.reduce((sum, r) => sum + (r.isCorrect ? 1 : 0), 0) / secondHalf.length

    const difference = secondAccuracy - firstAccuracy

    if (difference > 0.2) return 'improving'
    if (difference < -0.2) return 'declining'
    return 'stable'
  }

  /**
   * Actualiza calibración entre confianza percibida y real
   */
  updateConfidenceCalibration(responseEntry) {
    if (responseEntry.selfReportedConfidence === null) return

    // Calcular discrepancia entre confianza reportada y rendimiento real
    const reportedConfidence = responseEntry.selfReportedConfidence
    const accuracy = responseEntry.isCorrect ? 1 : 0

    // Calibración perfecta: confianza alta = rendimiento alto, confianza baja = rendimiento bajo
    const calibrationScore = 1 - Math.abs(reportedConfidence - accuracy)
    
    // Actualizar calibración de sesión con peso exponencial
    const alpha = 0.2
    this.sessionConfidence.calibration = alpha * calibrationScore + 
                                        (1 - alpha) * this.sessionConfidence.calibration
  }

  /**
   * Calcula actualización de confianza general
   */
  calculateConfidenceUpdate(responseEntry) {
    const { mood, tense, verb } = responseEntry
    const categoryKey = `${mood}|${tense}|${verb}`
    const profile = this.confidenceProfiles.get(categoryKey)

    // Confianza por categoría
    const categoryConfidence = profile ? profile.confidence : 0.5

    // Actualizar confianza de sesión general
    const recentAccuracy = this.responsePatterns
      .slice(-20)
      .reduce((sum, r) => sum + (r.isCorrect ? 1 : 0), 0) / Math.min(20, this.responsePatterns.length)

    const sessionTrend = this.calculateSessionTrend()
    
    this.sessionConfidence.overall = (
      recentAccuracy * 0.5 + 
      categoryConfidence * 0.3 + 
      sessionTrend * 0.2
    )

    return {
      overall: this.sessionConfidence.overall,
      category: categoryConfidence,
      trend: profile ? profile.trend : 'neutral',
      calibration: this.sessionConfidence.calibration,
      level: this.getConfidenceLevel(categoryConfidence)
    }
  }

  /**
   * Calcula tendencia de la sesión actual
   */
  calculateSessionTrend() {
    if (this.responsePatterns.length < 10) return 0.5

    const recent = this.responsePatterns.slice(-10)
    const older = this.responsePatterns.slice(-20, -10)

    const recentAccuracy = recent.reduce((sum, r) => sum + (r.isCorrect ? 1 : 0), 0) / recent.length
    const olderAccuracy = older.reduce((sum, r) => sum + (r.isCorrect ? 1 : 0), 0) / older.length

    // Convertir diferencia a factor de tendencia (0-1)
    const difference = recentAccuracy - olderAccuracy
    return Math.max(0, Math.min(1, 0.5 + difference))
  }

  /**
   * Determina nivel de confianza categórico
   */
  getConfidenceLevel(confidence) {
    if (confidence >= this.confidenceThresholds.overconfident) return 'overconfident'
    if (confidence >= this.confidenceThresholds.confident) return 'confident'
    if (confidence >= this.confidenceThresholds.uncertain) return 'uncertain'
    if (confidence >= this.confidenceThresholds.hesitant) return 'hesitant'
    return 'struggling'
  }

  /**
   * Genera recomendaciones basadas en análisis de confianza
   */
  generateConfidenceRecommendations(confidenceData) {
    const recommendations = []
    const { level, calibration, trend } = confidenceData

    // Recomendaciones basadas en nivel de confianza
    if (level === 'struggling') {
      recommendations.push({
        type: 'support',
        message: 'Considera revisar conceptos fundamentales antes de continuar',
        action: 'review_basics',
        priority: 'high'
      })
    } else if (level === 'hesitant') {
      recommendations.push({
        type: 'practice',
        message: 'Más práctica dirigida te ayudará a ganar confianza',
        action: 'focused_practice',
        priority: 'medium'
      })
    } else if (level === 'overconfident') {
      recommendations.push({
        type: 'challenge',
        message: 'Estás listo para desafíos más avanzados',
        action: 'increase_difficulty',
        priority: 'medium'
      })
    }

    // Recomendaciones basadas en calibración
    if (calibration < 0.6) {
      recommendations.push({
        type: 'self_awareness',
        message: 'Trata de evaluar tu confianza antes de responder',
        action: 'confidence_tracking',
        priority: 'low'
      })
    }

    // Recomendaciones basadas en tendencia
    if (trend === 'declining') {
      recommendations.push({
        type: 'recovery',
        message: 'Considera tomar un descanso y volver con energía fresca',
        action: 'break_suggestion',
        priority: 'high'
      })
    }

    return recommendations
  }

  /**
   * Genera insights de confianza
   */
  generateConfidenceInsights(responseEntry) {
    const insights = []

    const indicators = responseEntry.confidenceIndicators
    
    if (indicators.fluency) {
      insights.push('🚀 Respuesta fluida - tu confianza en esta área está creciendo')
    }
    
    if (indicators.hesitation && responseEntry.isCorrect) {
      insights.push('🤔 Sabías la respuesta pero dudaste - confía más en tu instinto')
    }
    
    if (indicators.impulsiveness) {
      insights.push('⏱️ Tómate un momento para pensar - la velocidad no siempre ayuda')
    }
    
    if (indicators.help_seeking && responseEntry.isCorrect) {
      insights.push('🎯 Buen uso de pistas - estás aprendiendo estratégicamente')
    }

    return insights
  }

  /**
   * Sugiere próximos objetivos de práctica basado en confianza
   */
  getNextPracticeTargets() {
    // Analizar todas las categorías por confianza
    const categoriesByConfidence = Array.from(this.confidenceProfiles.entries())
      .map(([key, profile]) => ({
        category: key,
        confidence: profile.confidence,
        accuracy: profile.correctAttempts / profile.totalAttempts,
        lastSeen: profile.lastSeen
      }))
      .sort((a, b) => a.confidence - b.confidence)

    const suggestions = []

    // Priorizar áreas de baja confianza que no se han practicado recientemente
    const needsWork = categoriesByConfidence
      .filter(cat => cat.confidence < 0.6 && Date.now() - cat.lastSeen > 300000) // 5 min
      .slice(0, 3)

    needsWork.forEach(cat => {
      suggestions.push({
        type: 'improvement',
        category: cat.category,
        reason: 'Low confidence area',
        priority: 'high'
      })
    })

    // Agregar áreas de fortaleza para mantener confianza
    const strengths = categoriesByConfidence
      .filter(cat => cat.confidence > 0.8)
      .slice(-2)

    strengths.forEach(cat => {
      suggestions.push({
        type: 'maintenance',
        category: cat.category,
        reason: 'Maintain strong area',
        priority: 'low'
      })
    })

    return suggestions
  }

  /**
   * Obtiene estado actual de confianza
   */
  getCurrentConfidenceState() {
    return {
      overall: this.sessionConfidence.overall,
      level: this.getConfidenceLevel(this.sessionConfidence.overall),
      calibration: this.sessionConfidence.calibration,
      totalCategories: this.confidenceProfiles.size,
      strongAreas: this.getTopConfidenceAreas(5),
      improvementAreas: this.getLowestConfidenceAreas(5),
      sessionStats: {
        totalResponses: this.responsePatterns.length,
        recentAccuracy: this.responsePatterns.slice(-10)
          .reduce((sum, r) => sum + (r.isCorrect ? 1 : 0), 0) / Math.min(10, this.responsePatterns.length)
      }
    }
  }

  /**
   * Obtiene áreas de mayor confianza
   */
  getTopConfidenceAreas(count) {
    return Array.from(this.confidenceProfiles.entries())
      .sort((a, b) => b[1].confidence - a[1].confidence)
      .slice(0, count)
      .map(([key, profile]) => ({
        category: key,
        confidence: Math.round(profile.confidence * 100),
        accuracy: Math.round((profile.correctAttempts / profile.totalAttempts) * 100)
      }))
  }

  /**
   * Obtiene áreas de menor confianza
   */
  getLowestConfidenceAreas(count) {
    return Array.from(this.confidenceProfiles.entries())
      .sort((a, b) => a[1].confidence - b[1].confidence)
      .slice(0, count)
      .map(([key, profile]) => ({
        category: key,
        confidence: Math.round(profile.confidence * 100),
        accuracy: Math.round((profile.correctAttempts / profile.totalAttempts) * 100),
        needsPractice: profile.totalAttempts < 10 || profile.confidence < 0.5
      }))
  }

  /**
   * Actualiza áreas de fortaleza del perfil
   */
  updateStrengthAreas(profile, responseEntry) {
    // Lógica simple: si la confianza es alta y la tendencia positiva
    if (profile.confidence > 0.7 && profile.trend === 'improving') {
      const area = `${responseEntry.mood}/${responseEntry.tense}`
      if (!profile.strengthAreas.includes(area)) {
        profile.strengthAreas.push(area)
        profile.strengthAreas = profile.strengthAreas.slice(-5) // Mantener solo 5
      }
    }

    // Identificar áreas de mejora
    if (profile.confidence < 0.4 || profile.trend === 'declining') {
      const area = `${responseEntry.mood}/${responseEntry.tense}`
      if (!profile.improvementAreas.includes(area)) {
        profile.improvementAreas.push(area)
        profile.improvementAreas = profile.improvementAreas.slice(-5) // Mantener solo 5
      }
    }
  }

  /**
   * Cargar datos de confianza desde almacenamiento local
   */
  async loadConfidenceData() {
    try {
      const stored = localStorage.getItem('confidence-engine-data')
      if (stored) {
        const data = JSON.parse(stored)
        if (data.confidenceProfiles) {
          this.confidenceProfiles = new Map(data.confidenceProfiles)
        }
        if (data.sessionConfidence) {
          this.sessionConfidence = { ...this.sessionConfidence, ...data.sessionConfidence }
        }
      }
    } catch {
      console.warn('Failed to load confidence data:', e)
    }
  }

  /**
   * Guardar datos de confianza
   */
  async saveConfidenceData() {
    try {
      const data = {
        confidenceProfiles: Array.from(this.confidenceProfiles.entries()),
        sessionConfidence: this.sessionConfidence,
        lastSaved: Date.now()
      }
      localStorage.setItem('confidence-engine-data', JSON.stringify(data))
    } catch {
      console.warn('Failed to save confidence data:', e)
    }
  }

  /**
   * Reiniciar sistema de confianza
   */
  reset() {
    this.confidenceProfiles.clear()
    this.responsePatterns = []
    this.sessionConfidence = {
      overall: 0.5,
      byCategory: new Map(),
      trends: [],
      calibration: 0.5
    }
    this.saveConfidenceData()
  }
}

// Instancia global del motor de confianza
export const confidenceEngine = new ConfidenceEngine()

/**
 * Función de procesamiento para el hook principal
 */
export const processResponseForConfidence = (response) => {
  return confidenceEngine.processResponse(response)
}

/**
 * Función para obtener estado actual de confianza
 */
export const getCurrentConfidenceState = () => {
  return confidenceEngine.getCurrentConfidenceState()
}

// Configurar auto-save con memory management
if (typeof setInterval !== 'undefined') {
  registerInterval(
    'ConfidenceEngine',
    () => confidenceEngine.saveConfidenceData(),
    PROGRESS_CONFIG.AUTO_SAVE.CONFIDENCE_ENGINE,
    'Auto-save confidence data'
  )
}

// Registrar sistema para cleanup
memoryManager.registerSystem('ConfidenceEngine', () => {
  confidenceEngine.reset()
})

// Debugging unificado en navegador
if (typeof window !== 'undefined') {
  window.SpanishConjugator = window.SpanishConjugator || {}
  window.SpanishConjugator.ConfidenceEngine = {
    getState: getCurrentConfidenceState,
    processResponse: processResponseForConfidence,
    reset: () => confidenceEngine.reset()
  }
  
  logger.systemInit('Confidence Engine Debug Interface')
}

export default confidenceEngine