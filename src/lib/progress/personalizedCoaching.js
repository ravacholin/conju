// Personalized Coaching System
// Analyzes user patterns and provides targeted learning guidance

import { getMasteryByUser, getRecentAttempts } from './database.js'
import { getCurrentUserId } from './userManager/index.js'
import { levelPrioritizer } from '../core/levelDrivenPrioritizer.js'
import { getRealUserStats } from './realTimeAnalytics.js'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('progress:personalizedCoaching')


/**
 * Personalized coaching engine that provides intelligent learning guidance
 */
export class PersonalizedCoach {
  constructor(userId = null) {
    this.userId = userId || getCurrentUserId()
    this.analysisCache = new Map()
    this.cacheExpiry = 5 * 60 * 1000 // 5 minutes
  }

  /**
   * Get comprehensive coaching analysis for a user
   * @param {string} userLevel - User's CEFR level
   * @returns {Promise<Object>} Complete coaching analysis
   */
  async getCoachingAnalysis(userLevel = 'B1') {
    const cacheKey = `analysis-${userLevel}-${this.userId}`
    
    // Check cache first
    const cached = this.analysisCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data
    }

    try {
      const [masteryRecords, recentAttempts, userStats] = await Promise.all([
        getMasteryByUser(this.userId),
        getRecentAttempts(this.userId, 100), // Last 100 attempts
        getRealUserStats(this.userId)
      ])

      const analysis = {
        userId: this.userId,
        level: userLevel,
        timestamp: new Date(),
        
        // Core analysis sections
        levelProgression: this.analyzeLevelProgression(masteryRecords, userLevel),
        learningPatterns: this.analyzeLearningPatterns(recentAttempts, masteryRecords),
        strengthsWeaknesses: this.analyzeStrengthsWeaknesses(masteryRecords, userLevel),
        recommendations: await this.generateRecommendations(masteryRecords, userLevel, userStats),
        motivationalInsights: this.generateMotivationalInsights(masteryRecords, recentAttempts, userLevel),
        
        // Specific guidance
        nextSteps: this.identifyNextSteps(masteryRecords, userLevel),
        studyPlan: this.createStudyPlan(masteryRecords, userLevel),
        difficultyAdjustments: this.suggestDifficultyAdjustments(userStats, masteryRecords)
      }

      // Cache the result
      this.analysisCache.set(cacheKey, {
        data: analysis,
        timestamp: Date.now()
      })

      return analysis

    } catch (error) {
      logger.error('Error generating coaching analysis:', error)
      return this.getFallbackAnalysis(userLevel)
    }
  }

  /**
   * Analyze user's progression within their current level
   */
  analyzeLevelProgression(masteryRecords, userLevel) {
    const prioritized = levelPrioritizer.getPrioritizedTenses(userLevel, masteryRecords)
    
    // Calculate mastery by category
    const masteryByCategory = {
      core: this.calculateCategoryMastery(masteryRecords, prioritized.core),
      review: this.calculateCategoryMastery(masteryRecords, prioritized.review),
      exploration: this.calculateCategoryMastery(masteryRecords, prioritized.exploration)
    }

    // Overall level completion
    const totalTenses = prioritized.core.length + prioritized.review.length
    const masteredTenses = masteryRecords.filter(r => r.score >= 75).length
    const completionPercentage = totalTenses > 0 ? (masteredTenses / totalTenses) * 100 : 0

    // Level status determination
    let status = 'beginning'
    if (completionPercentage >= 80) status = 'mastering'
    else if (completionPercentage >= 60) status = 'advancing'
    else if (completionPercentage >= 30) status = 'developing'
    else if (completionPercentage >= 10) status = 'building'

    return {
      level: userLevel,
      status,
      completionPercentage: Math.round(completionPercentage),
      masteryByCategory,
      readyForNext: completionPercentage >= 70 && masteryByCategory.core.average >= 75,
      coreProgress: masteryByCategory.core.percentage,
      totalTenses,
      masteredTenses
    }
  }

  /**
   * Calculate mastery statistics for a category of tenses
   */
  calculateCategoryMastery(masteryRecords, categoryTenses) {
    if (categoryTenses.length === 0) {
      return { average: 0, percentage: 0, count: 0, mastered: 0 }
    }

    const masteryMap = new Map(masteryRecords.map(r => [`${r.mood}|${r.tense}`, r.score]))
    
    let totalScore = 0
    let masteredCount = 0
    let recordCount = 0

    categoryTenses.forEach(tense => {
      const key = `${tense.mood}|${tense.tense}`
      const score = masteryMap.get(key) || 0
      totalScore += score
      recordCount++
      
      if (score >= 75) masteredCount++
    })

    return {
      average: recordCount > 0 ? Math.round(totalScore / recordCount) : 0,
      percentage: recordCount > 0 ? Math.round((masteredCount / recordCount) * 100) : 0,
      count: recordCount,
      mastered: masteredCount
    }
  }

  /**
   * Analyze learning patterns from recent attempts
   */
  analyzeLearningPatterns(recentAttempts, _masteryRecords) {
    if (!recentAttempts || recentAttempts.length < 10) {
      return {
        sessionLength: 'insufficient_data',
        accuracy: 0,
        consistency: 'unknown',
        preferredTime: 'unknown',
        strugglingAreas: []
      }
    }

    // Session patterns
    const avgAccuracy = recentAttempts.reduce((sum, a) => sum + (a.correct ? 1 : 0), 0) / recentAttempts.length
    const avgLatency = recentAttempts.reduce((sum, a) => sum + (a.latency || 5000), 0) / recentAttempts.length

    // Identify struggling areas
    const errorsByTense = new Map()
    recentAttempts.filter(a => !a.correct).forEach(attempt => {
      const key = `${attempt.mood}|${attempt.tense}`
      errorsByTense.set(key, (errorsByTense.get(key) || 0) + 1)
    })

    const strugglingAreas = Array.from(errorsByTense.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([key, count]) => {
        const [mood, tense] = key.split('|')
        return { mood, tense, errorCount: count }
      })

    // Consistency analysis
    let consistency = 'steady'
    if (recentAttempts.length >= 20) {
      const firstHalf = recentAttempts.slice(0, Math.floor(recentAttempts.length / 2))
      const secondHalf = recentAttempts.slice(Math.floor(recentAttempts.length / 2))
      
      const firstHalfAcc = firstHalf.reduce((sum, a) => sum + (a.correct ? 1 : 0), 0) / firstHalf.length
      const secondHalfAcc = secondHalf.reduce((sum, a) => sum + (a.correct ? 1 : 0), 0) / secondHalf.length
      
      const improvement = secondHalfAcc - firstHalfAcc
      if (improvement > 0.15) consistency = 'improving'
      else if (improvement < -0.15) consistency = 'declining'
    }

    return {
      sessionLength: this.categorizeSessionLength(recentAttempts.length),
      accuracy: Math.round(avgAccuracy * 100),
      consistency,
      avgLatency: Math.round(avgLatency),
      strugglingAreas,
      totalAttempts: recentAttempts.length
    }
  }

  /**
   * Analyze user's strengths and weaknesses
   */
  analyzeStrengthsWeaknesses(masteryRecords, userLevel) {
    // Group by mood and tense
    const moodAnalysis = this.analyzeMoodPerformance(masteryRecords)
    const tenseAnalysis = this.analyzeTensePerformance(masteryRecords)
    
    // Identify top strengths and weaknesses
    const strengths = []
    const weaknesses = []

    // Mood-based analysis
    Object.entries(moodAnalysis).forEach(([mood, data]) => {
      if (data.average >= 80) {
        strengths.push({ type: 'mood', name: mood, score: data.average, reason: 'high_mastery' })
      } else if (data.average < 50) {
        weaknesses.push({ type: 'mood', name: mood, score: data.average, reason: 'low_mastery' })
      }
    })

    // Specific tense analysis
    masteryRecords.forEach(record => {
      if (record.score >= 85) {
        strengths.push({ 
          type: 'tense', 
          name: `${record.mood}/${record.tense}`, 
          score: record.score, 
          reason: 'mastered' 
        })
      } else if (record.score < 40) {
        weaknesses.push({ 
          type: 'tense', 
          name: `${record.mood}/${record.tense}`, 
          score: record.score, 
          reason: 'struggling' 
        })
      }
    })

    return {
      strengths: strengths.sort((a, b) => b.score - a.score).slice(0, 5),
      weaknesses: weaknesses.sort((a, b) => a.score - b.score).slice(0, 5),
      moodAnalysis,
      overallStrength: this.identifyOverallStrength(moodAnalysis, tenseAnalysis),
      primaryChallenge: this.identifyPrimaryChallenge(weaknesses, userLevel)
    }
  }

  /**
   * Analyze performance by mood
   */
  analyzeMoodPerformance(masteryRecords) {
    const moodGroups = {}
    
    masteryRecords.forEach(record => {
      if (!moodGroups[record.mood]) {
        moodGroups[record.mood] = []
      }
      moodGroups[record.mood].push(record.score)
    })

    const analysis = {}
    Object.entries(moodGroups).forEach(([mood, scores]) => {
      analysis[mood] = {
        average: Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length),
        count: scores.length,
        highest: Math.max(...scores),
        lowest: Math.min(...scores)
      }
    })

    return analysis
  }

  /**
   * Analyze performance by tense
   */
  analyzeTensePerformance(masteryRecords) {
    const tenseGroups = {}
    
    masteryRecords.forEach(record => {
      const key = record.tense
      if (!tenseGroups[key]) {
        tenseGroups[key] = []
      }
      tenseGroups[key].push(record.score)
    })

    return tenseGroups
  }

  /**
   * Generate personalized recommendations
   */
  async generateRecommendations(masteryRecords, userLevel, userStats) {
    const prioritized = levelPrioritizer.getPrioritizedTenses(userLevel, masteryRecords)
    const recommendations = []

    // 1. Core tense recommendations (highest priority)
    const unmasteredCore = prioritized.core.filter(tense => {
      const record = masteryRecords.find(r => r.mood === tense.mood && r.tense === tense.tense)
      return !record || record.score < 70
    })

    if (unmasteredCore.length > 0) {
      recommendations.push({
        type: 'core_focus',
        priority: 95,
        title: `Domina ${unmasteredCore[0].mood}/${unmasteredCore[0].tense}`,
        description: `Esta es una habilidad clave para tu nivel ${userLevel}. Enfócate en practicar esto primero.`,
        action: `Practica ${unmasteredCore[0].mood}/${unmasteredCore[0].tense} durante 15-20 minutos`,
        targetTense: unmasteredCore[0]
      })
    }

    // 2. Review weak areas
    const weakReviewAreas = masteryRecords
      .filter(r => r.score < 60)
      .sort((a, b) => a.score - b.score)
      .slice(0, 2)

    weakReviewAreas.forEach((weak, index) => {
      recommendations.push({
        type: 'weakness_repair',
        priority: 80 - (index * 10),
        title: `Refuerza ${weak.mood}/${weak.tense}`,
        description: `Tu dominio actual es ${weak.score}%. Necesitas más práctica en esta área.`,
        action: `Dedica 10-15 minutos extra a ${weak.mood}/${weak.tense}`,
        targetTense: weak
      })
    })

    // 3. Speed improvement
    if (userStats && userStats.averageTime > 12000) { // >12 seconds
      recommendations.push({
        type: 'speed_improvement',
        priority: 60,
        title: 'Mejora tu velocidad de respuesta',
        description: `Tu tiempo promedio es ${Math.round(userStats.averageTime / 1000)}s. Trata de responder más rápido.`,
        action: 'Practica tenses familiares con límite de tiempo',
        targetSpeed: '< 8 segundos'
      })
    }

    // 4. Exploration recommendations for advanced users
    if (prioritized.exploration.length > 0 && masteryRecords.length >= 10) {
      recommendations.push({
        type: 'exploration',
        priority: 40,
        title: `Explora ${prioritized.exploration[0].mood}/${prioritized.exploration[0].tense}`,
        description: 'Desafíate con contenido del siguiente nivel',
        action: 'Intenta algunas preguntas de nivel avanzado',
        targetTense: prioritized.exploration[0]
      })
    }

    return recommendations.sort((a, b) => b.priority - a.priority)
  }

  /**
   * Generate motivational insights and achievements
   */
  generateMotivationalInsights(masteryRecords, recentAttempts, userLevel) {
    const insights = []

    // Progress celebration
    const masteredCount = masteryRecords.filter(r => r.score >= 75).length
    if (masteredCount > 0) {
      insights.push({
        type: 'achievement',
        icon: '🎯',
        title: `${masteredCount} tenses dominados`,
        message: `Has demostrado dominio en ${masteredCount} combinaciones de tiempo y modo. ¡Excelente progreso!`
      })
    }

    // Recent improvement
    if (recentAttempts && recentAttempts.length >= 20) {
      const recentAccuracy = recentAttempts.slice(-10).reduce((sum, a) => sum + (a.correct ? 1 : 0), 0) / 10
      if (recentAccuracy >= 0.8) {
        insights.push({
          type: 'improvement',
          icon: '📈',
          title: 'Racha de éxito',
          message: `Tu precisión reciente es del ${Math.round(recentAccuracy * 100)}%. ¡Estás en una buena racha!`
        })
      }
    }

    // Level progression insight
    const levelProgression = this.analyzeLevelProgression(masteryRecords, userLevel)
    if (levelProgression.readyForNext) {
      insights.push({
        type: 'milestone',
        icon: '🚀',
        title: '¡Listo para el siguiente nivel!',
        message: `Has dominado las habilidades de ${userLevel}. Considera avanzar al siguiente nivel.`
      })
    } else if (levelProgression.completionPercentage >= 50) {
      insights.push({
        type: 'progress',
        icon: '⭐',
        title: `${levelProgression.completionPercentage}% completado`,
        message: `Has completado más de la mitad de ${userLevel}. ¡Sigue así!`
      })
    }

    return insights
  }

  /**
   * Identify next steps for the user
   */
  identifyNextSteps(masteryRecords, userLevel) {
    const prioritized = levelPrioritizer.getPrioritizedTenses(userLevel, masteryRecords)
    const steps = []

    // Step 1: Focus on unmastered core tenses
    const unmasteredCore = prioritized.core.filter(tense => {
      const record = masteryRecords.find(r => r.mood === tense.mood && r.tense === tense.tense)
      return !record || record.score < 75
    })

    if (unmasteredCore.length > 0) {
      steps.push({
        order: 1,
        type: 'master_core',
        title: 'Domina las habilidades centrales',
        description: `Enfócate en ${unmasteredCore.slice(0, 3).map(t => `${t.mood}/${t.tense}`).join(', ')}`,
        estimatedTime: '2-3 semanas'
      })
    }

    // Step 2: Strengthen weak review areas
    const weakReview = masteryRecords
      .filter(r => r.score < 70)
      .sort((a, b) => a.score - b.score)
      .slice(0, 2)

    if (weakReview.length > 0) {
      steps.push({
        order: 2,
        type: 'strengthen_weak',
        title: 'Refuerza áreas débiles',
        description: `Mejora tu dominio en ${weakReview.map(r => `${r.mood}/${r.tense}`).join(', ')}`,
        estimatedTime: '1-2 semanas'
      })
    }

    // Step 3: Prepare for advancement
    if (prioritized.exploration.length > 0 && unmasteredCore.length <= 2) {
      steps.push({
        order: 3,
        type: 'prepare_advancement',
        title: 'Prepárate para el siguiente nivel',
        description: `Explora ${prioritized.exploration[0].mood}/${prioritized.exploration[0].tense}`,
        estimatedTime: '1 semana'
      })
    }

    return steps
  }

  /**
   * Create a structured study plan
   */
  createStudyPlan(masteryRecords, userLevel) {
    const plan = {
      duration: '4 semanas',
      sessionsPerWeek: 4,
      sessionLength: '15-20 minutos',
      weeks: []
    }

    const prioritized = levelPrioritizer.getPrioritizedTenses(userLevel, masteryRecords)
    
    // Week 1-2: Core tenses
    const coreToWork = prioritized.core
      .filter(tense => {
        const record = masteryRecords.find(r => r.mood === tense.mood && r.tense === tense.tense)
        return !record || record.score < 75
      })
      .slice(0, 4)

    plan.weeks.push({
      number: 1,
      focus: 'Habilidades centrales I',
      targets: coreToWork.slice(0, 2),
      goal: 'Alcanzar 70% de dominio'
    })

    plan.weeks.push({
      number: 2,
      focus: 'Habilidades centrales II',
      targets: coreToWork.slice(2, 4),
      goal: 'Alcanzar 70% de dominio'
    })

    // Week 3: Review and strengthen
    const reviewTargets = masteryRecords
      .filter(r => r.score >= 40 && r.score < 75)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)

    plan.weeks.push({
      number: 3,
      focus: 'Repaso y consolidación',
      targets: reviewTargets,
      goal: 'Mejorar dominio existente'
    })

    // Week 4: Mixed practice and exploration
    plan.weeks.push({
      number: 4,
      focus: 'Práctica mixta y exploración',
      targets: [...coreToWork.slice(0, 2), ...prioritized.exploration.slice(0, 1)],
      goal: 'Práctica integrada y preparación avanzada'
    })

    return plan
  }

  /**
   * Suggest difficulty adjustments based on performance
   */
  suggestDifficultyAdjustments(userStats, masteryRecords) {
    const adjustments = []

    if (!userStats) {
      return [{ type: 'info', message: 'Necesitamos más datos para sugerir ajustes de dificultad' }]
    }

    // Accuracy-based adjustments
    if (userStats.accuracy >= 90) {
      adjustments.push({
        type: 'increase_difficulty',
        reason: 'high_accuracy',
        message: 'Tu precisión es excelente. Considera practicar tenses más difíciles o acelerar el ritmo.',
        suggestion: 'Aumentar dificultad o reducir pistas'
      })
    } else if (userStats.accuracy < 60) {
      adjustments.push({
        type: 'decrease_difficulty',
        reason: 'low_accuracy',
        message: 'Considera enfocarte en tenses básicos hasta mejorar la confianza.',
        suggestion: 'Reducir dificultad o aumentar pistas'
      })
    }

    // Speed-based adjustments
    if (userStats.averageTime && userStats.averageTime > 15000) {
      adjustments.push({
        type: 'speed_focus',
        reason: 'slow_response',
        message: 'Intenta practicar formas familiares para mejorar la velocidad de reconocimiento.',
        suggestion: 'Incluir más practice drills de velocidad'
      })
    }

    // Consistency adjustments
    const recentMastery = masteryRecords.filter(r => r.score >= 70).length
    const totalMastery = masteryRecords.length
    
    if (totalMastery > 0 && (recentMastery / totalMastery) < 0.3) {
      adjustments.push({
        type: 'focus_fundamentals',
        reason: 'inconsistent_mastery',
        message: 'Considera enfocarte en menos tenses a la vez para construir una base sólida.',
        suggestion: 'Práctica más enfocada en 2-3 tenses específicos'
      })
    }

    return adjustments
  }

  // Helper methods
  categorizeSessionLength(attemptCount) {
    if (attemptCount < 10) return 'short'
    if (attemptCount < 25) return 'medium'
    return 'long'
  }

  identifyOverallStrength(moodAnalysis, _tenseAnalysis) {
    const strengths = Object.entries(moodAnalysis)
      .filter(([_, data]) => data.average >= 75)
      .map(([mood, data]) => ({ mood, score: data.average }))
      .sort((a, b) => b.score - a.score)

    return strengths.length > 0 ? strengths[0].mood : 'En desarrollo'
  }

  identifyPrimaryChallenge(weaknesses, userLevel) {
    if (weaknesses.length === 0) return 'Ningún desafío principal identificado'
    
    const primaryWeak = weaknesses[0]
    
    // Provide level-specific context
    const levelContext = {
      'A1': 'enfócate en formas básicas del presente',
      'A2': 'practica más los tiempos pasados',
      'B1': 'el subjuntivo requiere práctica adicional',
      'B2': 'los tiempos compuestos necesitan refuerzo',
      'C1': 'la variación modal requiere más atención',
      'C2': 'continúa puliendo las formas menos comunes'
    }

    return `${primaryWeak.name} (${primaryWeak.score}%) - ${levelContext[userLevel] || 'práctica adicional recomendada'}`
  }

  /**
   * Fallback analysis when full analysis fails
   */
  getFallbackAnalysis(userLevel) {
    return {
      userId: this.userId,
      level: userLevel,
      timestamp: new Date(),
      error: true,
      message: 'Análisis completo no disponible. Continúa practicando para obtener recomendaciones personalizadas.',
      recommendations: [
        {
          type: 'general',
          priority: 50,
          title: 'Continúa practicando',
          description: 'Practica regularmente para recibir recomendaciones personalizadas.',
          action: 'Completa al menos 20 ejercicios para análisis detallado'
        }
      ]
    }
  }
}

// Singleton instance and utility functions
const personalizedCoach = new PersonalizedCoach()

/**
 * Get coaching recommendations for current user
 */
export async function getCoachingRecommendations(userLevel = 'B1') {
  const analysis = await personalizedCoach.getCoachingAnalysis(userLevel)
  return analysis.recommendations || []
}

/**
 * Get motivational insights for current user
 */
export async function getMotivationalInsights(userLevel = 'B1') {
  const analysis = await personalizedCoach.getCoachingAnalysis(userLevel)
  return analysis.motivationalInsights || []
}

/**
 * Get next steps guidance for current user
 */
export async function getNextStepsGuidance(userLevel = 'B1') {
  const analysis = await personalizedCoach.getCoachingAnalysis(userLevel)
  return {
    nextSteps: analysis.nextSteps || [],
    studyPlan: analysis.studyPlan || null,
    progression: analysis.levelProgression || null
  }
}

/**
 * Check if user is ready to advance to next level
 */
export async function checkLevelAdvancementReadiness(userLevel = 'B1') {
  const analysis = await personalizedCoach.getCoachingAnalysis(userLevel)
  return {
    ready: analysis.levelProgression?.readyForNext || false,
    completion: analysis.levelProgression?.completionPercentage || 0,
    blockers: analysis.recommendations?.filter(r => r.type === 'core_focus' || r.type === 'weakness_repair') || []
  }
}

/**
 * Debug coaching analysis
 */
export async function debugCoachingAnalysis(userLevel = 'B1') {
  logger.debug(`\n=== COACHING ANALYSIS DEBUG FOR ${userLevel} ===`)
  const analysis = await personalizedCoach.getCoachingAnalysis(userLevel)
  
  logger.debug('Level Progression:', analysis.levelProgression)
  logger.debug('Recommendations:', analysis.recommendations?.slice(0, 3))
  logger.debug('Strengths/Weaknesses:', {
    strengths: analysis.strengthsWeaknesses?.strengths?.slice(0, 2),
    weaknesses: analysis.strengthsWeaknesses?.weaknesses?.slice(0, 2)
  })
  logger.debug('Next Steps:', analysis.nextSteps)
  logger.debug('=== END COACHING DEBUG ===\n')
  
  return analysis
}

// PersonalizedCoach is already exported above