// Dynamic Recommendations - Context-aware suggestions
// Provides time-aware, personalized learning recommendations

import { getRealUserStats } from './realTimeAnalytics.js'
import { getCurrentUserId } from './userManager/index.js'
import { getDueSchedules, getMasteryByUser } from './database.js'
import { flowDetector } from './flowStateDetection.js'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('progress:dynamicRecommendations')

/**
 * Time of day patterns for optimal learning
 */
const TIME_PATTERNS = {
  morning: { // 6am - 12pm
    energy: 'high',
    recommended: ['intensive_learning', 'new_content', 'challenging'],
    avoid: ['long_sessions', 'review_only']
  },
  afternoon: { // 12pm - 6pm
    energy: 'moderate',
    recommended: ['balanced', 'review', 'practice'],
    avoid: ['purely_new', 'very_challenging']
  },
  evening: { // 6pm - 11pm
    energy: 'moderate-low',
    recommended: ['review', 'light_practice', 'relaxed'],
    avoid: ['intensive', 'new_complex_content']
  },
  night: { // 11pm - 6am
    energy: 'low',
    recommended: ['light_review', 'quick_drills'],
    avoid: ['new_learning', 'intensive']
  }
}

/**
 * Week patterns (handle mid-week slump)
 */
const WEEK_PATTERNS = {
  monday: { motivation: 0.9, recommended: 'start_strong' },
  tuesday: { motivation: 0.95, recommended: 'maintain_momentum' },
  wednesday: { motivation: 0.75, recommended: 'lighter_load' }, // Mid-week slump
  thursday: { motivation: 0.8, recommended: 'gentle_challenge' },
  friday: { motivation: 0.85, recommended: 'weekend_prep' },
  saturday: { motivation: 1.0, recommended: 'exploration' },
  sunday: { motivation: 0.9, recommended: 'reflection_review' }
}

/**
 * Get contextual recommendation based on time, user state, and progress
 * @param {Object} userStats - User statistics
 * @param {string} timeOfDay - Time of day ('morning', 'afternoon', 'evening', 'night')
 * @returns {Promise<Object>} Contextual recommendation
 */
export async function getContextualRecommendation(userStats = null, timeOfDay = null) {
  try {
    const userId = getCurrentUserId()
    if (!userId) {
      throw new Error('User ID required for recommendations')
    }

    // Get current stats if not provided
    const stats = userStats || await getRealUserStats(userId)

    // Determine time of day if not provided
    const currentTime = timeOfDay || getCurrentTimeOfDay()
    const timePattern = TIME_PATTERNS[currentTime]

    // Get day of week
    const dayOfWeek = getDayOfWeek()
    const weekPattern = WEEK_PATTERNS[dayOfWeek]

    // Get flow state
    const flowMetrics = flowDetector.getFlowMetrics()
    const flowRecommendations = flowDetector.getSRSSchedulingRecommendations()

    // Get SRS due items
    const dueItems = await getDueSchedules(userId, new Date())
    const masteryData = await getMasteryByUser(userId)

    // Build recommendation
    const recommendation = buildRecommendation({
      stats,
      timePattern,
      weekPattern,
      flowMetrics,
      flowRecommendations,
      dueItems,
      masteryData,
      currentTime
    })

    logger.debug('Generated contextual recommendation', {
      timeOfDay: currentTime,
      mode: recommendation.mode,
      priority: recommendation.priority
    })

    return recommendation
  } catch (error) {
    logger.error('Error generating contextual recommendation:', error)
    return getFallbackRecommendation()
  }
}

/**
 * Get current time of day category
 */
function getCurrentTimeOfDay() {
  const hour = new Date().getHours()

  if (hour >= 6 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 18) return 'afternoon'
  if (hour >= 18 && hour < 23) return 'evening'
  return 'night'
}

/**
 * Get day of week
 */
function getDayOfWeek() {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  return days[new Date().getDay()]
}

/**
 * Build recommendation based on all context
 */
function buildRecommendation(context) {
  const {
    stats,
    timePattern,
    weekPattern,
    flowMetrics,
    flowRecommendations,
    dueItems,
    masteryData,
    currentTime
  } = context

  let mode = 'balanced'
  let priority = 'medium'
  let reasoning = []
  let suggestedDuration = 15 // minutes

  // Flow state considerations
  if (flowMetrics.currentState === 'deep_flow') {
    mode = 'intensive'
    priority = 'high'
    suggestedDuration = 30
    reasoning.push('Estás en estado de flow profundo - aprovecha este momento')
  } else if (flowMetrics.currentState === 'struggling') {
    mode = 'light_review'
    priority = 'low'
    suggestedDuration = 10
    reasoning.push('Te noto con dificultades - hagamos un repaso ligero')
  }

  // Time of day considerations
  if (currentTime === 'morning' && mode !== 'intensive') {
    mode = 'challenging'
    suggestedDuration = 20
    reasoning.push('Es mañana - tu energía está alta para contenido desafiante')
  } else if (currentTime === 'evening') {
    suggestedDuration = Math.min(suggestedDuration, 15)
    reasoning.push('Es tarde - mantengamos la sesión breve pero efectiva')
  } else if (currentTime === 'night') {
    mode = 'light_review'
    suggestedDuration = 10
    reasoning.push('Es muy tarde - solo repaso rápido recomendado')
  }

  // Week pattern considerations (mid-week slump)
  if (weekPattern.motivation < 0.8) {
    mode = mode === 'intensive' ? 'balanced' : mode
    suggestedDuration = Math.max(10, suggestedDuration - 5)
    reasoning.push('Mitad de semana - ajustamos la carga para mantener motivación')
  }

  // SRS urgency
  const overdueSRS = dueItems.filter(item => {
    const dueDate = new Date(item.nextDue)
    const now = new Date()
    return dueDate < now
  })

  if (overdueSRS.length > 5) {
    mode = 'srs_review'
    priority = 'high'
    reasoning.push(`Tienes ${overdueSRS.length} elementos vencidos - prioridad en repaso SRS`)
  }

  // Recent performance
  if (stats.accuracy < 60) {
    mode = 'weak_areas'
    priority = 'high'
    reasoning.push('Tu precisión reciente es baja - enfoquémonos en áreas débiles')
  } else if (stats.accuracy > 90) {
    mode = 'exploration'
    priority = 'medium'
    reasoning.push('Excelente precisión - es tiempo de explorar contenido nuevo')
  }

  // Streak maintenance
  if (stats.currentStreak > 7 && stats.lastActivityDate !== getTodayDate()) {
    priority = 'high'
    reasoning.push(`¡Protege tu racha de ${stats.currentStreak} días!`)
  }

  return {
    mode,
    priority,
    suggestedDuration,
    reasoning,
    context: {
      timeOfDay: currentTime,
      dayOfWeek: weekPattern,
      flowState: flowMetrics.currentState,
      dueItems: dueItems.length,
      overdueItems: overdueSRS.length
    },
    activities: generateActivities(mode, suggestedDuration, masteryData, dueItems)
  }
}

/**
 * Generate specific activities based on mode
 */
function generateActivities(mode, duration, masteryData, dueItems) {
  const activities = []

  switch (mode) {
    case 'intensive':
    case 'challenging':
      activities.push({
        type: 'new_content',
        title: 'Aprende Nuevo Contenido',
        estimatedMinutes: duration * 0.6,
        description: 'Domina una nueva combinación de tiempo verbal'
      })
      activities.push({
        type: 'practice',
        title: 'Práctica Intensiva',
        estimatedMinutes: duration * 0.4,
        description: 'Refuerza lo aprendido con ejercicios'
      })
      break

    case 'srs_review':
      activities.push({
        type: 'spaced_repetition',
        title: 'Repaso SRS Urgente',
        estimatedMinutes: duration * 0.8,
        description: `Revisar ${Math.min(dueItems.length, 20)} elementos vencidos`,
        itemCount: Math.min(dueItems.length, 20)
      })
      activities.push({
        type: 'quick_drills',
        title: 'Ejercicios Rápidos',
        estimatedMinutes: duration * 0.2,
        description: 'Mantén el ritmo con drills cortos'
      })
      break

    case 'light_review':
      activities.push({
        type: 'review',
        title: 'Repaso Ligero',
        estimatedMinutes: duration,
        description: 'Repasa conceptos familiares sin presión'
      })
      break

    case 'weak_areas':
      // Find weakest areas from mastery data
      const weakAreas = masteryData
        .filter(m => m.score < 70)
        .sort((a, b) => a.score - b.score)
        .slice(0, 3)

      weakAreas.forEach((area, index) => {
        activities.push({
          type: 'focused_practice',
          title: `Refuerza ${area.tense}`,
          estimatedMinutes: duration / Math.max(weakAreas.length, 1),
          description: `Dominio actual: ${Math.round(area.score)}%`,
          mood: area.mood,
          tense: area.tense
        })
      })
      break

    case 'exploration':
      activities.push({
        type: 'explore',
        title: 'Explora Contenido Avanzado',
        estimatedMinutes: duration,
        description: 'Prueba combinaciones más desafiantes'
      })
      break

    default: // 'balanced'
      activities.push({
        type: 'mixed',
        title: 'Sesión Balanceada',
        estimatedMinutes: duration,
        description: 'Mezcla de repaso y contenido nuevo'
      })
  }

  return activities
}

/**
 * Get today's date as YYYY-MM-DD
 */
function getTodayDate() {
  return new Date().toISOString().split('T')[0]
}

/**
 * Fallback recommendation when errors occur
 */
function getFallbackRecommendation() {
  return {
    mode: 'balanced',
    priority: 'medium',
    suggestedDuration: 15,
    reasoning: ['Recomendación estándar'],
    context: {},
    activities: [
      {
        type: 'mixed',
        title: 'Práctica General',
        estimatedMinutes: 15,
        description: 'Sesión balanceada de práctica'
      }
    ]
  }
}

export default {
  getContextualRecommendation
}
