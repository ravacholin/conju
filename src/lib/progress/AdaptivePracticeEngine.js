// Motor de práctica adaptativa para personalizar la experiencia de aprendizaje

import { getMasteryByUser, getDueSchedules } from './database.js'
import { getCurrentUserId } from './userManager.js'
import { getRealUserStats } from './realTimeAnalytics.js'

/**
 * Motor principal para generar recomendaciones de práctica adaptativa
 */
export class AdaptivePracticeEngine {
  constructor(userId = null) {
    this.userId = userId || getCurrentUserId()
    this.priorityWeights = {
      MASTERY_SCORE: 0.4,     // Puntuación de dominio (menor = más importante)
      DUE_URGENCY: 0.3,       // Urgencia de repaso por SRS
      ERROR_FREQUENCY: 0.2,   // Frecuencia de errores recientes
      LEARNING_CURVE: 0.1     // Curva de aprendizaje individual
    }
  }

  /**
   * Obtiene recomendaciones de práctica priorizadas
   * @param {Object} options - Opciones de configuración
   * @returns {Promise<Array>} Lista de recomendaciones ordenadas por prioridad
   */
  async getPracticeRecommendations(options = {}) {
    try {
      const {
        maxRecommendations = 5,
        includeNewContent = true,
        focusMode = 'balanced', // 'balanced', 'weak_areas', 'review', 'new'
        userLevel = 'intermediate'
      } = options

      // Obtener datos del usuario
      const [masteryRecords, dueItems, userStats] = await Promise.all([
        getMasteryByUser(this.userId),
        getDueSchedules(this.userId, new Date()),
        getRealUserStats(this.userId)
      ])

      // Generar recomendaciones basadas en el modo de enfoque
      const recommendations = []

      switch (focusMode) {
        case 'weak_areas':
          recommendations.push(...await this.getWeakAreaRecommendations(masteryRecords, userStats))
          break
        case 'review':
          recommendations.push(...await this.getReviewRecommendations(dueItems, masteryRecords))
          break
        case 'new':
          recommendations.push(...await this.getNewContentRecommendations(masteryRecords, userLevel))
          break
        default: // 'balanced'
          recommendations.push(
            ...await this.getBalancedRecommendations(masteryRecords, dueItems, userStats, includeNewContent)
          )
      }

      // Ordenar por prioridad y limitar resultados
      return recommendations
        .sort((a, b) => b.priority - a.priority)
        .slice(0, maxRecommendations)
    } catch (error) {
      console.error('Error generando recomendaciones adaptativas:', error)
      return []
    }
  }

  /**
   * Genera recomendaciones enfocadas en áreas débiles
   */
  async getWeakAreaRecommendations(masteryRecords, userStats) {
    const weakAreas = masteryRecords
      .filter(record => record.score < 60)
      .sort((a, b) => a.score - b.score)
      .slice(0, 3)

    return weakAreas.map((area, index) => ({
      type: 'weak_area_practice',
      priority: 90 - (index * 10), // Prioridad alta decreciente
      title: `Refuerza ${area.mood}/${area.tense}`,
      description: `Dominio actual: ${Math.round(area.score)}%. Práctica intensiva recomendada.`,
      targetCombination: {
        mood: area.mood,
        tense: area.tense,
        verbId: area.verbId
      },
      estimatedDuration: '10-15 min',
      difficulty: 'focused',
      reason: 'low_mastery'
    }))
  }

  /**
   * Genera recomendaciones de repaso basadas en SRS
   */
  async getReviewRecommendations(dueItems, masteryRecords) {
    const masteryMap = new Map(masteryRecords.map(r => [r.id, r]))
    
    return dueItems
      .slice(0, 5)
      .map((item, index) => {
        const mastery = masteryMap.get(item.itemId) || { score: 50 }
        const urgency = this.calculateUrgency(item.nextDue)
        
        return {
          type: 'spaced_review',
          priority: 80 - (index * 5) + urgency,
          title: `Repaso: ${item.mood}/${item.tense}`,
          description: `Programado para repaso. Dominio: ${Math.round(mastery.score)}%`,
          targetCombination: {
            mood: item.mood,
            tense: item.tense,
            itemId: item.itemId
          },
          estimatedDuration: '5-8 min',
          difficulty: 'review',
          reason: 'spaced_repetition'
        }
      })
  }

  /**
   * Genera recomendaciones de contenido nuevo
   */
  async getNewContentRecommendations(masteryRecords, userLevel) {
    const masteredCombinations = new Set(
      masteryRecords
        .filter(r => r.score >= 80)
        .map(r => `${r.mood}|${r.tense}`)
    )

    const levelCombinations = this.getLevelAppropriateCombinations(userLevel)
    const newCombinations = levelCombinations.filter(
      combo => !masteredCombinations.has(`${combo.mood}|${combo.tense}`)
    )

    return newCombinations.slice(0, 3).map((combo, index) => ({
      type: 'new_content',
      priority: 60 - (index * 10),
      title: `Aprende ${combo.mood}/${combo.tense}`,
      description: `Nueva combinación para tu nivel ${userLevel}`,
      targetCombination: combo,
      estimatedDuration: '15-20 min',
      difficulty: 'learning',
      reason: 'skill_expansion'
    }))
  }

  /**
   * Genera recomendaciones balanceadas
   */
  async getBalancedRecommendations(masteryRecords, dueItems, userStats, includeNewContent) {
    const recommendations = []

    // 40% áreas débiles
    const weakAreas = await this.getWeakAreaRecommendations(masteryRecords, userStats)
    recommendations.push(...weakAreas.slice(0, 2))

    // 30% repaso SRS
    const reviews = await this.getReviewRecommendations(dueItems, masteryRecords)
    recommendations.push(...reviews.slice(0, 2))

    // 30% contenido nuevo (si está habilitado)
    if (includeNewContent) {
      const newContent = await this.getNewContentRecommendations(masteryRecords, 'intermediate')
      recommendations.push(...newContent.slice(0, 1))
    }

    return recommendations
  }

  /**
   * Calcula la urgencia de repaso basada en el tiempo vencido
   */
  calculateUrgency(nextDue) {
    const now = new Date()
    const dueDate = new Date(nextDue)
    const overdueDays = Math.max(0, (now - dueDate) / (1000 * 60 * 60 * 24))
    
    // Mayor urgencia para elementos más vencidos
    return Math.min(20, overdueDays * 5)
  }

  /**
   * Obtiene combinaciones apropiadas para el nivel del usuario
   */
  getLevelAppropriateCombinations(userLevel) {
    const baseCombinations = [
      { mood: 'indicative', tense: 'pres' },
      { mood: 'indicative', tense: 'pretIndef' },
      { mood: 'indicative', tense: 'impf' },
      { mood: 'indicative', tense: 'fut' }
    ]

    const intermediateCombinations = [
      { mood: 'subjunctive', tense: 'subjPres' },
      { mood: 'subjunctive', tense: 'subjImpf' },
      { mood: 'conditional', tense: 'cond' }
    ]

    const advancedCombinations = [
      { mood: 'indicative', tense: 'pretPerf' },
      { mood: 'subjunctive', tense: 'subjPerf' },
      { mood: 'imperative', tense: 'impAff' }
    ]

    switch (userLevel) {
      case 'beginner':
        return baseCombinations
      case 'intermediate':
        return [...baseCombinations, ...intermediateCombinations]
      case 'advanced':
        return [...baseCombinations, ...intermediateCombinations, ...advancedCombinations]
      default:
        return baseCombinations
    }
  }

  /**
   * Evalúa la dificultad percibida de una práctica
   * @param {Object} targetCombination - Combinación objetivo
   * @param {Object} userStats - Estadísticas del usuario
   * @returns {string} Nivel de dificultad
   */
  evaluateDifficulty(targetCombination, userStats) {
    const { mood, tense } = targetCombination
    
    // Factores de dificultad por modo/tiempo
    const difficultyMap = {
      'indicative-pres': 1,
      'indicative-pretIndef': 2,
      'indicative-impf': 2,
      'subjunctive-subjPres': 4,
      'subjunctive-subjImpf': 5,
      'imperative-impAff': 3,
      'conditional-cond': 3
    }

    const baseDifficulty = difficultyMap[`${mood}-${tense}`] || 3
    
    // Ajustar según estadísticas del usuario
    const adjustedDifficulty = baseDifficulty + (userStats.accuracy < 70 ? 1 : 0)
    
    if (adjustedDifficulty <= 2) return 'easy'
    if (adjustedDifficulty <= 3) return 'medium'
    return 'hard'
  }

  /**
   * Obtiene práctica personalizada para una sesión específica
   * @param {number} sessionDuration - Duración deseada en minutos
   * @returns {Promise<Object>} Plan de práctica personalizado
   */
  async getPersonalizedSession(sessionDuration = 15) {
    try {
      const recommendations = await this.getPracticeRecommendations({
        maxRecommendations: 10,
        focusMode: 'balanced'
      })

      const session = {
        duration: sessionDuration,
        activities: [],
        estimatedItems: 0,
        focusAreas: []
      }

      let remainingTime = sessionDuration
      const avgTimePerItem = 2 // minutos promedio por elemento

      for (const rec of recommendations) {
        const estimatedTime = this.parseEstimatedDuration(rec.estimatedDuration)
        
        if (remainingTime >= estimatedTime) {
          session.activities.push({
            ...rec,
            allocatedTime: estimatedTime,
            estimatedItems: Math.ceil(estimatedTime / avgTimePerItem)
          })
          
          remainingTime -= estimatedTime
          session.estimatedItems += Math.ceil(estimatedTime / avgTimePerItem)
          
          if (!session.focusAreas.includes(rec.reason)) {
            session.focusAreas.push(rec.reason)
          }
        }
      }

      return session
    } catch (error) {
      console.error('Error generando sesión personalizada:', error)
      return {
        duration: sessionDuration,
        activities: [],
        estimatedItems: 0,
        focusAreas: ['general_practice']
      }
    }
  }

  /**
   * Parsea la duración estimada de una cadena a número
   */
  parseEstimatedDuration(durationStr) {
    const match = durationStr.match(/(\d+)-?(\d+)?/)
    if (match) {
      const min = parseInt(match[1])
      const max = match[2] ? parseInt(match[2]) : min
      return (min + max) / 2
    }
    return 10 // Valor por defecto
  }
}

// Exportar instancia por defecto
export default new AdaptivePracticeEngine()

/**
 * Funciones de utilidad para uso directo
 */

/**
 * Obtiene recomendaciones rápidas para la interfaz
 * @param {Object} options - Opciones de configuración
 * @returns {Promise<Array>} Recomendaciones básicas
 */
export async function getQuickRecommendations(options = {}) {
  const engine = new AdaptivePracticeEngine()
  return engine.getPracticeRecommendations({ maxRecommendations: 3, ...options })
}

/**
 * Evalúa si el usuario necesita más práctica en un área específica
 * @param {string} mood - Modo gramatical
 * @param {string} tense - Tiempo verbal
 * @returns {Promise<boolean>} True si necesita más práctica
 */
export async function needsMorePractice(mood, tense) {
  try {
    const userId = getCurrentUserId()
    const masteryRecords = await getMasteryByUser(userId)
    
    const record = masteryRecords.find(r => r.mood === mood && r.tense === tense)
    return !record || record.score < 70
  } catch (error) {
    console.error('Error evaluando necesidad de práctica:', error)
    return true
  }
}

/**
 * Obtiene el próximo elemento recomendado para práctica
 * @returns {Promise<Object|null>} Elemento recomendado o null
 */
export async function getNextRecommendedItem() {
  try {
    const engine = new AdaptivePracticeEngine()
    const recommendations = await engine.getPracticeRecommendations({ maxRecommendations: 1 })
    
    return recommendations.length > 0 ? recommendations[0] : null
  } catch (error) {
    console.error('Error obteniendo próximo elemento recomendado:', error)
    return null
  }
}