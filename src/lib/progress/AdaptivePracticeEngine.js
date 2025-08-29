// Motor de práctica adaptativa para personalizar la experiencia de aprendizaje

import { getMasteryByUser, getDueSchedules } from './database.js'
import { getCurrentUserId } from './userManager.js'
import { getRealUserStats } from './realTimeAnalytics.js'
import { levelPrioritizer } from '../core/levelDrivenPrioritizer.js'
import { validateMoodTenseAvailability } from '../core/generator.js'
import { useSettings } from '../../state/settings.js'
import { buildFormsForRegion } from '../core/eligibility.js'

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
        userLevel = 'B1' // Default to B1 if no level specified
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

      // CRITICAL FIX: Filter out recommendations with invalid mood/tense combinations
      const validatedRecommendations = await this.validateRecommendations(recommendations)
      
      // Ordenar por prioridad y limitar resultados
      return validatedRecommendations
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
  async getWeakAreaRecommendations(masteryRecords) {
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
   * Genera recomendaciones de contenido nuevo usando nivel-driven logic
   */
  async getNewContentRecommendations(masteryRecords, userLevel) {
    const masteredCombinations = new Set(
      masteryRecords
        .filter(r => r.score >= 80)
        .map(r => `${r.mood}|${r.tense}`)
    )

    // Get level-appropriate combinations with user progress context
    const levelCombinations = this.getLevelAppropriateCombinations(userLevel, masteryRecords)
    
    // Focus on core tenses first (new to current level), then review tenses with low mastery
    const newCombinations = levelCombinations.filter(combo => {
      const key = `${combo.mood}|${combo.tense}`
      
      // Skip already mastered combinations
      if (masteredCombinations.has(key)) return false
      
      // Prefer core tenses (new to this level) for learning
      if (combo.category === 'core') return true
      
      // Include review tenses that need work
      if (combo.category === 'review') {
        const masteryRecord = masteryRecords.find(r => `${r.mood}|${r.tense}` === key)
        return !masteryRecord || masteryRecord.score < 70
      }
      
      // Include some exploration for advanced learners
      return combo.category === 'exploration'
    })

    // Sort by priority from the level prioritizer
    const sortedNew = newCombinations
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 4) // Top 4 new content recommendations

    return sortedNew.map((combo, index) => {
      const isCore = combo.category === 'core'
      const isExploration = combo.category === 'exploration'
      
      return {
        type: 'new_content',
        priority: combo.priority * 0.6 + (60 - (index * 10)), // Blend prioritizer priority with ordering
        title: isCore ? `🆕 Aprende ${combo.mood}/${combo.tense}` : 
               isExploration ? `🔮 Explora ${combo.mood}/${combo.tense}` :
               `📚 Mejora ${combo.mood}/${combo.tense}`,
        description: isCore ? `Nueva habilidad clave para nivel ${userLevel}` :
                    isExploration ? `Contenido avanzado - prepárate para el siguiente nivel` :
                    `Refuerza esta combinación importante`,
        targetCombination: {
          mood: combo.mood,
          tense: combo.tense,
          priority: combo.priority,
          category: combo.category
        },
        estimatedDuration: isCore ? '15-20 min' : 
                          isExploration ? '10-15 min' : '12-18 min',
        difficulty: isCore ? 'learning' :
                   isExploration ? 'challenging' : 'review',
        reason: isCore ? 'level_progression' : 
               isExploration ? 'advanced_preparation' : 'skill_reinforcement'
      }
    })
  }

  /**
   * Genera recomendaciones balanceadas con nivel-driven logic
   */
  async getBalancedRecommendations(masteryRecords, dueItems, userStats, includeNewContent, userLevel = 'B1') {
    const recommendations = []

    // Get user's level-specific information
    const prioritized = levelPrioritizer.getPrioritizedTenses(userLevel, masteryRecords)
    const levelWeights = prioritized.weights

    // Adjust recommendation distribution based on level
    const distribution = this.calculateRecommendationDistribution(levelWeights, includeNewContent)

    // 1. Áreas débiles (priority based on level)
    const weakAreas = await this.getWeakAreaRecommendations(masteryRecords, userStats)
    recommendations.push(...weakAreas.slice(0, distribution.weakAreas))

    // 2. Repaso SRS (espaciado)
    const reviews = await this.getReviewRecommendations(dueItems, masteryRecords)
    recommendations.push(...reviews.slice(0, distribution.srsReview))

    // 3. Contenido nuevo (level-appropriate)
    if (includeNewContent) {
      const newContent = await this.getNewContentRecommendations(masteryRecords, userLevel)
      recommendations.push(...newContent.slice(0, distribution.newContent))
    }

    // 4. Add level-specific boosts for core tenses
    const coreTenseBoosts = this.getCoreContentRecommendations(prioritized.core, masteryRecords)
    recommendations.push(...coreTenseBoosts.slice(0, distribution.coreBoosts))

    return recommendations
  }

  /**
   * Calculate recommendation distribution based on level characteristics
   */
  calculateRecommendationDistribution(levelWeights, includeNewContent) {
    // Base distribution
    let distribution = {
      weakAreas: 2,
      srsReview: 2, 
      newContent: includeNewContent ? 2 : 0,
      coreBoosts: 1
    }

    // Adjust based on level focus
    if (levelWeights.core > 0.6) {
      // High core focus (A1, A2) - emphasize new content
      distribution.newContent += 1
      distribution.coreBoosts += 1
      distribution.srsReview -= 1
    } else if (levelWeights.review > 0.4) {
      // High review focus (C1, C2) - emphasize review and weak areas
      distribution.weakAreas += 1
      distribution.srsReview += 1
      distribution.newContent = Math.max(0, distribution.newContent - 1)
    }

    return distribution
  }

  /**
   * Get recommendations specifically for core tenses of current level
   */
  getCoreContentRecommendations(coreTenses, masteryRecords) {
    const masteryMap = new Map(masteryRecords.map(r => [`${r.mood}|${r.tense}`, r.score]))
    
    return coreTenses
      .filter(tense => {
        const key = `${tense.mood}|${tense.tense}`
        const mastery = masteryMap.get(key) || 0
        return mastery < 75 // Focus on unmastered core tenses
      })
      .slice(0, 3)
      .map((tense) => ({
        type: 'core_focus',
        priority: tense.priority + 20, // Boost core tense priority
        title: `🎯 Domina ${tense.mood}/${tense.tense}`,
        description: `Habilidad fundamental para tu nivel actual`,
        targetCombination: {
          mood: tense.mood,
          tense: tense.tense,
          priority: tense.priority
        },
        estimatedDuration: '8-12 min',
        difficulty: 'focused',
        reason: 'core_competency'
      }))
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
   * Obtiene combinaciones apropiadas para el nivel del usuario usando curriculum-driven logic
   * @param {string} userLevel - CEFR level (A1, A2, B1, B2, C1, C2) or legacy level
   * @param {Array} userProgress - Optional user progress data
   */
  getLevelAppropriateCombinations(userLevel, userProgress = null) {
    // Convert legacy level names to CEFR levels
    const levelMapping = {
      'beginner': 'A2',
      'intermediate': 'B1', 
      'advanced': 'B2'
    }
    
    const cefrLevel = levelMapping[userLevel] || userLevel
    
    // Use the Level-Driven Prioritizer for intelligent combination selection
    try {
      const prioritized = levelPrioritizer.getPrioritizedTenses(cefrLevel, userProgress)
      
      // Combine all categories into a single array with proper priorities
      const allCombinations = [
        ...prioritized.core,
        ...prioritized.review,
        ...prioritized.exploration
      ]
      
      // Sort by priority and return top combinations
      return allCombinations
        .sort((a, b) => b.priority - a.priority)
        .slice(0, 12) // Limit to top 12 combinations
        .map(combo => ({
          mood: combo.mood,
          tense: combo.tense,
          priority: combo.priority,
          category: this.categorizeByPriority(combo, prioritized)
        }))
      
    } catch (error) {
      console.error('Error getting curriculum-driven combinations, falling back to basic:', error)
      
      // Fallback to basic combinations for the level
      return this.getFallbackCombinations(cefrLevel)
    }
  }

  /**
   * Categorize a combination by its priority level
   */
  categorizeByPriority(combo, prioritized) {
    const key = `${combo.mood}|${combo.tense}`
    
    if (prioritized.core.some(c => `${c.mood}|${c.tense}` === key)) return 'core'
    if (prioritized.review.some(c => `${c.mood}|${c.tense}` === key)) return 'review'
    if (prioritized.exploration.some(c => `${c.mood}|${c.tense}` === key)) return 'exploration'
    
    return 'other'
  }

  /**
   * Fallback combinations for when curriculum system fails
   */
  getFallbackCombinations(cefrLevel) {
    const fallbackMap = {
      'A1': [
        { mood: 'indicative', tense: 'pres', priority: 80 }
      ],
      'A2': [
        { mood: 'indicative', tense: 'pres', priority: 70 },
        { mood: 'indicative', tense: 'pretIndef', priority: 80 },
        { mood: 'indicative', tense: 'impf', priority: 75 },
        { mood: 'indicative', tense: 'fut', priority: 70 }
      ],
      'B1': [
        { mood: 'subjunctive', tense: 'subjPres', priority: 90 },
        { mood: 'indicative', tense: 'pretPerf', priority: 85 },
        { mood: 'conditional', tense: 'cond', priority: 75 }
      ],
      'B2': [
        { mood: 'subjunctive', tense: 'subjImpf', priority: 90 },
        { mood: 'subjunctive', tense: 'subjPlusc', priority: 85 },
        { mood: 'conditional', tense: 'condPerf', priority: 80 }
      ],
      'C1': [
        { mood: 'indicative', tense: 'pres', priority: 60 },
        { mood: 'subjunctive', tense: 'subjPres', priority: 80 },
        { mood: 'subjunctive', tense: 'subjImpf', priority: 85 }
      ],
      'C2': [
        { mood: 'indicative', tense: 'pres', priority: 50 },
        { mood: 'subjunctive', tense: 'subjPres', priority: 70 },
        { mood: 'subjunctive', tense: 'subjImpf', priority: 80 }
      ]
    }
    
    return fallbackMap[cefrLevel] || fallbackMap['B1']
  }

  /**
   * Evalúa la dificultad percibida de una práctica usando curriculum-driven analysis
   * @param {Object} targetCombination - Combinación objetivo
   * @param {Object} userStats - Estadísticas del usuario  
   * @param {string} userLevel - Nivel CEFR del usuario
   * @returns {Object} Análisis de dificultad detallado
   */
  evaluateDifficulty(targetCombination, userStats, userLevel = 'B1') {
    const { mood, tense } = targetCombination
    
    try {
      // Get level-appropriate analysis from prioritizer
      const prioritized = levelPrioritizer.getPrioritizedTenses(userLevel)
      const key = `${mood}|${tense}`
      
      // Find the tense in prioritized categories
      let category = 'other'
      let intrinsicDifficulty = 3
      
      const coreTense = prioritized.core.find(c => `${c.mood}|${c.tense}` === key)
      if (coreTense) {
        category = 'core'
        intrinsicDifficulty = Math.min(5, Math.max(2, Math.round(coreTense.priority / 20)))
      } else {
        const reviewTense = prioritized.review.find(c => `${c.mood}|${c.tense}` === key)
        if (reviewTense) {
          category = 'review' 
          intrinsicDifficulty = Math.max(1, Math.round(reviewTense.priority / 25))
        } else {
          const explorationTense = prioritized.exploration.find(c => `${c.mood}|${c.tense}` === key)
          if (explorationTense) {
            category = 'exploration'
            intrinsicDifficulty = Math.min(5, Math.round(explorationTense.priority / 15))
          }
        }
      }

      // User performance adjustments
      let personalizedDifficulty = intrinsicDifficulty
      
      if (userStats) {
        // Reduce difficulty if user is performing well
        if (userStats.accuracy >= 85) personalizedDifficulty -= 1
        else if (userStats.accuracy >= 70) personalizedDifficulty -= 0.5
        else if (userStats.accuracy < 50) personalizedDifficulty += 1
        
        // Speed adjustments
        if (userStats.averageTime && userStats.averageTime > 15000) { // >15 seconds
          personalizedDifficulty += 0.5
        }
      }
      
      // Level-relative difficulty
      const levelDifficultyMap = {
        'A1': { threshold: 2, multiplier: 1.5 },
        'A2': { threshold: 2.5, multiplier: 1.3 },
        'B1': { threshold: 3, multiplier: 1.0 },
        'B2': { threshold: 3.5, multiplier: 0.9 },
        'C1': { threshold: 4, multiplier: 0.8 },
        'C2': { threshold: 4.5, multiplier: 0.7 }
      }
      
      const levelConfig = levelDifficultyMap[userLevel] || levelDifficultyMap.B1
      const relativeDifficulty = personalizedDifficulty * levelConfig.multiplier
      
      // Final difficulty classification
      let difficultyLevel
      if (relativeDifficulty <= levelConfig.threshold - 1) difficultyLevel = 'easy'
      else if (relativeDifficulty <= levelConfig.threshold) difficultyLevel = 'medium'
      else if (relativeDifficulty <= levelConfig.threshold + 1) difficultyLevel = 'hard'
      else difficultyLevel = 'very_hard'
      
      return {
        level: difficultyLevel,
        score: Math.round(relativeDifficulty * 10) / 10,
        category,
        intrinsic: intrinsicDifficulty,
        personalized: Math.round(personalizedDifficulty * 10) / 10,
        factors: {
          userAccuracy: userStats?.accuracy || 0,
          userSpeed: userStats?.averageTime || 0,
          levelAppropriate: category === 'core' || category === 'review'
        }
      }
      
    } catch (error) {
      console.error('Error evaluating difficulty, using fallback:', error)
      
      // Fallback to basic difficulty evaluation
      const basicDifficulty = this.getBasicDifficulty(mood, tense, userStats)
      return {
        level: basicDifficulty,
        score: 3.0,
        category: 'unknown',
        intrinsic: 3,
        personalized: 3,
        factors: { fallback: true }
      }
    }
  }

  /**
   * Fallback basic difficulty evaluation
   */
  getBasicDifficulty(mood, tense, userStats) {
    const basicMap = {
      'indicative-pres': 1,
      'indicative-pretIndef': 2,
      'indicative-impf': 2,
      'subjunctive-subjPres': 4,
      'subjunctive-subjImpf': 5,
      'imperative-impAff': 3,
      'conditional-cond': 3
    }
    
    const base = basicMap[`${mood}-${tense}`] || 3
    const adjusted = base + (userStats?.accuracy < 70 ? 1 : 0)
    
    if (adjusted <= 2) return 'easy'
    if (adjusted <= 3) return 'medium'
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

  /**
   * CRITICAL INTEGRATION: Validates recommendations to ensure they have available forms
   * This prevents "No forms available" and "Undefined - Undefined" errors
   * @param {Array} recommendations - Array of recommendation objects
   * @returns {Promise<Array>} Filtered array of valid recommendations
   */
  async validateRecommendations(recommendations) {
    try {
      // Get current user settings and forms
      const settings = useSettings.getState()
      const allForms = buildFormsForRegion(settings.region)
      
      console.log(`🔍 VALIDATION - Checking ${recommendations.length} recommendations`)
      
      const validRecommendations = []
      
      for (const rec of recommendations) {
        const { mood, tense } = rec.targetCombination || {}
        
        if (!mood || !tense) {
          console.log(`❌ VALIDATION - Skipping recommendation without mood/tense:`, rec.title)
          continue
        }
        
        // Use the validation function from generator.js
        const isValid = validateMoodTenseAvailability(mood, tense, settings, allForms)
        
        if (isValid) {
          validRecommendations.push(rec)
          console.log(`✅ VALIDATION - Valid: ${mood}/${tense}`)
        } else {
          console.log(`❌ VALIDATION - Invalid: ${mood}/${tense} - no forms available`)
        }
      }
      
      // If we filtered out all recommendations, provide safe fallbacks
      if (validRecommendations.length === 0 && recommendations.length > 0) {
        console.log('⚠️  VALIDATION - All recommendations were invalid, adding fallbacks')
        const fallbacks = await this.generateFallbackRecommendations(settings, allForms)
        validRecommendations.push(...fallbacks)
      }
      
      console.log(`🔍 VALIDATION - Filtered to ${validRecommendations.length} valid recommendations`)
      return validRecommendations
    } catch (error) {
      console.error('Error validating recommendations:', error)
      // Return original recommendations on error to avoid breaking the system
      return recommendations
    }
  }

  /**
   * Generates safe fallback recommendations when all original recommendations are invalid
   */
  async generateFallbackRecommendations(settings, allForms) {
    const level = settings.level || 'B1'
    const fallbacks = []
    
    // Try common safe combinations for the user's level
    const safeCombinations = [
      { mood: 'indicative', tense: 'pres' },
      { mood: 'indicative', tense: 'pretIndef' },
      { mood: 'indicative', tense: 'impf' },
      { mood: 'indicative', tense: 'fut' }
    ]
    
    for (const combo of safeCombinations) {
      if (validateMoodTenseAvailability(combo.mood, combo.tense, settings, allForms)) {
        fallbacks.push({
          type: 'fallback_safe_practice',
          priority: 50,
          title: `Práctica de ${combo.mood}/${combo.tense}`,
          description: 'Práctica general recomendada para tu nivel',
          targetCombination: combo,
          estimatedDuration: '5-10 min',
          difficulty: 'moderate',
          reason: 'safe_fallback'
        })
        
        if (fallbacks.length >= 3) break
      }
    }
    
    return fallbacks
  }
}

/**
 * Obtiene el próximo elemento recomendado para práctica
 * @returns {Promise<Object|null>} Elemento recomendado o null
 */
export async function getNextRecommendedItem(userLevel = null) {
  try {
    const engine = new AdaptivePracticeEngine()
    const recommendations = await engine.getPracticeRecommendations({ maxRecommendations: 1, userLevel })
    
    return recommendations.length > 0 ? recommendations[0] : null
  } catch (error) {
    console.error('Error obteniendo próximo elemento recomendado:', error)
    return null
  }
}