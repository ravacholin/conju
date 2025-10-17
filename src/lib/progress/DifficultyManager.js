// Gestor de dificultad dinámico para ajustar la experiencia según el rendimiento

import { getRealUserStats } from './realTimeAnalytics.js'
import { getCurrentUserId } from './userManager.js'
import { getMasteryByUser as _getMasteryByUser } from './database.js'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('progress:DifficultyManager')


/**
 * Gestiona la dificultad dinámica basada en el rendimiento del usuario
 */
export class DifficultyManager {
  constructor(userId = null) {
    this.userId = userId || getCurrentUserId()
    
    // Umbrales para ajuste de dificultad
    this.thresholds = {
      ACCURACY_HIGH: 85,      // Aumentar dificultad
      ACCURACY_LOW: 60,       // Disminuir dificultad
      SPEED_FAST: 3000,       // ms - Aumentar dificultad
      SPEED_SLOW: 12000,      // ms - Disminuir dificultad
      STREAK_HIGH: 8,         // Aumentar dificultad
      STREAK_BROKEN: 0        // Considerar disminuir
    }
    
    // Niveles de dificultad
    this.difficultyLevels = {
      VERY_EASY: 1,
      EASY: 2,
      NORMAL: 3,
      HARD: 4,
      VERY_HARD: 5
    }
  }

  /**
   * Evalúa el nivel de dificultad apropiado basado en el rendimiento actual
   * @param {Object} sessionData - Datos de la sesión actual
   * @returns {Promise<Object>} Configuración de dificultad recomendada
   */
  async evaluateDifficultyLevel(sessionData = {}) {
    try {
      const userStats = await getRealUserStats(this.userId)
      
      // Analizar rendimiento actual
      const analysis = this.analyzePerformance(userStats, sessionData)
      
      // Calcular nivel de dificultad recomendado
      const recommendedLevel = this.calculateDifficultyLevel(analysis)
      
      // Generar ajustes específicos
      const adjustments = this.generateAdjustments(recommendedLevel, analysis)
      
      return {
        currentLevel: recommendedLevel,
        adjustments,
        reasoning: analysis.factors,
        confidence: analysis.confidence,
        shouldAdjust: analysis.shouldAdjust
      }
    } catch (error) {
      logger.error('Error evaluando nivel de dificultad:', error)
      return this.getDefaultDifficulty()
    }
  }

  /**
   * Analiza el rendimiento del usuario
   */
  analyzePerformance(userStats, sessionData) {
    const factors = []
    let difficultyScore = this.difficultyLevels.NORMAL // Punto de partida
    let confidence = 0.5

    // Factor 1: Precisión general
    if (userStats.accuracy > this.thresholds.ACCURACY_HIGH) {
      difficultyScore += 0.5
      factors.push('high_accuracy')
      confidence += 0.2
    } else if (userStats.accuracy < this.thresholds.ACCURACY_LOW) {
      difficultyScore -= 0.5
      factors.push('low_accuracy')
      confidence += 0.2
    }

    // Factor 2: Velocidad de respuesta
    if (userStats.avgLatency < this.thresholds.SPEED_FAST) {
      difficultyScore += 0.3
      factors.push('fast_responses')
      confidence += 0.15
    } else if (userStats.avgLatency > this.thresholds.SPEED_SLOW) {
      difficultyScore -= 0.3
      factors.push('slow_responses')
      confidence += 0.15
    }

    // Factor 3: Consistencia
    if (userStats.masteredCells > userStats.strugglingCells * 2) {
      difficultyScore += 0.2
      factors.push('consistent_mastery')
      confidence += 0.1
    } else if (userStats.strugglingCells > userStats.masteredCells) {
      difficultyScore -= 0.3
      factors.push('inconsistent_performance')
      confidence += 0.15
    }

    // Factor 4: Datos de sesión actual (si están disponibles)
    if (sessionData.currentStreak >= this.thresholds.STREAK_HIGH) {
      difficultyScore += 0.2
      factors.push('current_streak')
      confidence += 0.1
    } else if (sessionData.recentErrors > sessionData.recentCorrect) {
      difficultyScore -= 0.2
      factors.push('recent_errors')
      confidence += 0.1
    }

    // Factor 5: Progreso temporal
    const progressTrend = this.analyzeTrend(userStats)
    if (progressTrend === 'improving') {
      difficultyScore += 0.15
      factors.push('improving_trend')
      confidence += 0.1
    } else if (progressTrend === 'declining') {
      difficultyScore -= 0.25
      factors.push('declining_trend')
      confidence += 0.15
    }

    // Normalizar el puntaje de dificultad
    const normalizedScore = Math.max(1, Math.min(5, Math.round(difficultyScore)))
    
    return {
      factors,
      difficultyScore: normalizedScore,
      confidence: Math.min(1, confidence),
      shouldAdjust: factors.length > 0,
      recommendation: this.getDifficultyLabel(normalizedScore)
    }
  }

  /**
   * Calcula el nivel de dificultad basado en el análisis
   */
  calculateDifficultyLevel(analysis) {
    return analysis.difficultyScore
  }

  /**
   * Genera ajustes específicos basados en el nivel de dificultad
   */
  generateAdjustments(difficultyLevel, analysis) {
    const adjustments = {
      verbComplexity: 'normal',
      hintAvailability: 'normal',
      timePresure: 'normal',
      errorTolerance: 'normal',
      practiceIntensity: 'normal',
      feedbackDetail: 'normal'
    }

    switch (difficultyLevel) {
      case this.difficultyLevels.VERY_EASY:
        adjustments.verbComplexity = 'simple'
        adjustments.hintAvailability = 'generous'
        adjustments.timePresure = 'relaxed'
        adjustments.errorTolerance = 'high'
        adjustments.practiceIntensity = 'light'
        adjustments.feedbackDetail = 'detailed'
        break

      case this.difficultyLevels.EASY:
        adjustments.verbComplexity = 'simple'
        adjustments.hintAvailability = 'available'
        adjustments.timePresure = 'relaxed'
        adjustments.errorTolerance = 'medium'
        adjustments.practiceIntensity = 'light'
        break

      case this.difficultyLevels.HARD:
        adjustments.verbComplexity = 'complex'
        adjustments.hintAvailability = 'limited'
        adjustments.timePresure = 'moderate'
        adjustments.errorTolerance = 'low'
        adjustments.practiceIntensity = 'intensive'
        adjustments.feedbackDetail = 'brief'
        break

      case this.difficultyLevels.VERY_HARD:
        adjustments.verbComplexity = 'complex'
        adjustments.hintAvailability = 'minimal'
        adjustments.timePresure = 'challenging'
        adjustments.errorTolerance = 'very_low'
        adjustments.practiceIntensity = 'intensive'
        adjustments.feedbackDetail = 'minimal'
        break

      default: // NORMAL
        // Mantener valores por defecto
        break
    }

    // Ajustes específicos basados en factores de análisis
    if (analysis.factors.includes('slow_responses')) {
      adjustments.timePresure = 'relaxed'
    }
    
    if (analysis.factors.includes('low_accuracy')) {
      adjustments.hintAvailability = 'generous'
      adjustments.feedbackDetail = 'detailed'
    }

    return adjustments
  }

  /**
   * Analiza la tendencia de progreso del usuario
   */
  analyzeTrend(userStats) {
    // Simplificado - en una implementación completa, esto analizaría datos históricos
    const masteryRatio = userStats.masteredCells / (userStats.masteredCells + userStats.strugglingCells + userStats.inProgressCells + 1)
    
    if (masteryRatio > 0.6) return 'improving'
    if (masteryRatio < 0.3) return 'declining'
    return 'stable'
  }

  /**
   * Obtiene la etiqueta de dificultad
   */
  getDifficultyLabel(level) {
    const labels = {
      1: 'Muy Fácil',
      2: 'Fácil', 
      3: 'Normal',
      4: 'Difícil',
      5: 'Muy Difícil'
    }
    return labels[level] || 'Normal'
  }

  /**
   * Obtiene configuración por defecto
   */
  getDefaultDifficulty() {
    return {
      currentLevel: this.difficultyLevels.NORMAL,
      adjustments: {
        verbComplexity: 'normal',
        hintAvailability: 'normal',
        timePresure: 'normal',
        errorTolerance: 'normal',
        practiceIntensity: 'normal',
        feedbackDetail: 'normal'
      },
      reasoning: ['default_settings'],
      confidence: 0.5,
      shouldAdjust: false
    }
  }

  /**
   * Aplica ajustes de dificultad a la configuración de práctica
   * @param {Object} practiceSettings - Configuración actual de práctica
   * @param {Object} difficultyConfig - Configuración de dificultad
   * @returns {Object} Configuración ajustada
   */
  applyDifficultyAdjustments(practiceSettings, difficultyConfig) {
    const adjusted = { ...practiceSettings }
    const { adjustments } = difficultyConfig

    // Ajustar complejidad de verbos
    if (adjustments.verbComplexity === 'simple') {
      adjusted.preferRegularVerbs = true
      adjusted.avoidIrregulars = true
    } else if (adjustments.verbComplexity === 'complex') {
      adjusted.preferIrregulars = true
      adjusted.includeRareVerbs = true
    }

    // Ajustar disponibilidad de pistas
    if (adjustments.hintAvailability === 'generous') {
      adjusted.hintsEnabled = true
      adjusted.hintCooldown = 0
    } else if (adjustments.hintAvailability === 'minimal') {
      adjusted.hintsEnabled = false
    }

    // Ajustar presión de tiempo
    if (adjustments.timePresure === 'relaxed') {
      adjusted.timeLimit = null // Sin límite de tiempo
    } else if (adjustments.timePresure === 'challenging') {
      adjusted.timeLimit = 5000 // 5 segundos
    }

    // Ajustar tolerancia a errores
    if (adjustments.errorTolerance === 'high') {
      adjusted.strictAccents = false
      adjusted.allowTypos = true
    } else if (adjustments.errorTolerance === 'very_low') {
      adjusted.strictAccents = true
      adjusted.allowTypos = false
    }

    return adjusted
  }

  /**
   * Obtiene recomendaciones de ajuste en tiempo real
   * @param {Object} currentPerformance - Rendimiento de la sesión actual
   * @returns {Object} Recomendaciones inmediatas
   */
  getRealTimeAdjustments(currentPerformance) {
    const recommendations = {
      shouldEasify: false,
      shouldHarden: false,
      suggestions: []
    }

    // Análisis de rendimiento inmediato
    const { accuracy, averageTime, recentErrors, streak } = currentPerformance

    if (accuracy < 0.5 && recentErrors > 3) {
      recommendations.shouldEasify = true
      recommendations.suggestions.push('Reduce verb complexity')
      recommendations.suggestions.push('Enable more hints')
    }

    if (accuracy > 0.9 && streak > 10 && averageTime < 4000) {
      recommendations.shouldHarden = true
      recommendations.suggestions.push('Increase verb complexity')
      recommendations.suggestions.push('Reduce hint availability')
    }

    return recommendations
  }
}

// Exportar instancia por defecto
export default new DifficultyManager()

/**
 * Funciones de utilidad para uso directo
 */

/**
 * Evalúa rápidamente si la dificultad debe ajustarse
 * @param {Object} sessionData - Datos de la sesión
 * @returns {Promise<boolean>} True si se debe ajustar
 */
export async function shouldAdjustDifficulty(sessionData) {
  const manager = new DifficultyManager()
  const evaluation = await manager.evaluateDifficultyLevel(sessionData)
  return evaluation.shouldAdjust && evaluation.confidence > 0.7
}

/**
 * Obtiene ajustes recomendados para la sesión actual
 * @param {Object} sessionData - Datos de la sesión
 * @returns {Promise<Object>} Ajustes recomendados
 */
export async function getRecommendedAdjustments(sessionData) {
  const manager = new DifficultyManager()
  return manager.evaluateDifficultyLevel(sessionData)
}

/**
 * Aplica ajustes automáticos basados en el rendimiento
 * @param {Object} practiceSettings - Configuración actual
 * @param {Object} performanceData - Datos de rendimiento
 * @returns {Promise<Object>} Configuración ajustada
 */
export async function autoAdjustDifficulty(practiceSettings, performanceData) {
  const manager = new DifficultyManager()
  const difficultyConfig = await manager.evaluateDifficultyLevel(performanceData)
  
  if (difficultyConfig.shouldAdjust) {
    return manager.applyDifficultyAdjustments(practiceSettings, difficultyConfig)
  }
  
  return practiceSettings
}