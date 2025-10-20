// Study Plan Generator V2 - Dynamic curriculum generation
// Creates personalized 30-day study plans aligned with CEFR levels

import { getMasteryByUser } from './database.js'
import { getCurrentUserId } from './userManager/index.js'
import { levelPrioritizer } from '../core/prioritizer/index.js'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('progress:studyPlansV2')

/**
 * CEFR Level Milestones and Time Estimates
 */
const LEVEL_MILESTONES = {
  A1: {
    name: 'Principiante',
    estimatedDays: 30,
    targetTenses: ['indicative-pres', 'indicative-pretIndef'],
    dailyMinutes: { min: 10, recommended: 15, intensive: 30 }
  },
  A2: {
    name: 'Elemental',
    estimatedDays: 45,
    targetTenses: ['indicative-pres', 'indicative-pretIndef', 'indicative-impf', 'indicative-fut'],
    dailyMinutes: { min: 15, recommended: 20, intensive: 40 }
  },
  B1: {
    name: 'Intermedio',
    estimatedDays: 60,
    targetTenses: ['subjunctive-subjPres', 'conditional-cond', 'indicative-pretPerf'],
    dailyMinutes: { min: 20, recommended: 30, intensive: 50 }
  },
  B2: {
    name: 'Intermedio Alto',
    estimatedDays: 75,
    targetTenses: ['subjunctive-subjImpf', 'subjunctive-subjPerf', 'conditional-condPerf'],
    dailyMinutes: { min: 25, recommended: 35, intensive: 60 }
  },
  C1: {
    name: 'Avanzado',
    estimatedDays: 90,
    targetTenses: ['subjunctive-subjPlusc', 'all_compound_tenses'],
    dailyMinutes: { min: 30, recommended: 45, intensive: 75 }
  },
  C2: {
    name: 'Maestría',
    estimatedDays: 120,
    targetTenses: ['all_tenses', 'nuanced_usage'],
    dailyMinutes: { min: 30, recommended: 50, intensive: 90 }
  }
}

/**
 * Generate a personalized study plan
 * @param {string} userLevel - CEFR level (A1-C2)
 * @param {Array<string>} goals - Learning goals
 * @param {number} timeAvailable - Minutes per day available
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Generated study plan
 */
export async function generateStudyPlan(userLevel = 'B1', goals = [], timeAvailable = 20, options = {}) {
  try {
    const {
      planDuration = 30, // days
      userId = null,
      includeReview = true,
      focusMode = 'balanced' // 'balanced', 'intensive', 'relaxed'
    } = options

    const targetUserId = userId || getCurrentUserId()
    if (!targetUserId) {
      throw new Error('User ID required for study plan generation')
    }

    // Get current user progress
    const masteryData = await getMasteryByUser(targetUserId)
    const prioritized = levelPrioritizer.getPrioritizedTenses(userLevel, masteryData)

    // Determine study intensity
    const levelConfig = LEVEL_MILESTONES[userLevel] || LEVEL_MILESTONES.B1
    const intensity = determineIntensity(timeAvailable, levelConfig.dailyMinutes)

    // Generate day-by-day breakdown
    const dailyPlan = generateDailyBreakdown({
      duration: planDuration,
      userLevel,
      timeAvailable,
      prioritized,
      masteryData,
      intensity,
      includeReview,
      goals
    })

    const plan = {
      id: `plan_${targetUserId}_${Date.now()}`,
      userId: targetUserId,
      level: userLevel,
      levelName: levelConfig.name,
      goals: goals.length > 0 ? goals : ['Dominar conjugaciones de nivel ' + userLevel],
      intensity,
      timeAvailable,
      planDuration,
      estimatedCompletionDays: levelConfig.estimatedDays,
      dailyPlan,
      createdAt: new Date().toISOString(),
      milestones: generateMilestones(dailyPlan, userLevel),
      metadata: {
        coreTenseCount: prioritized.core.length,
        reviewTenseCount: prioritized.review.length,
        explorationTenseCount: prioritized.exploration.length,
        currentMastery: calculateAverageMastery(masteryData)
      }
    }

    logger.debug('Generated study plan', {
      level: userLevel,
      days: planDuration,
      intensity,
      dailyTargets: dailyPlan.length
    })

    return plan
  } catch (error) {
    logger.error('Error generating study plan:', error)
    throw error
  }
}

/**
 * Determine study intensity based on time available
 */
function determineIntensity(timeAvailable, levelMinutes) {
  if (timeAvailable >= levelMinutes.intensive) return 'intensive'
  if (timeAvailable >= levelMinutes.recommended) return 'recommended'
  if (timeAvailable >= levelMinutes.min) return 'minimal'
  return 'light'
}

/**
 * Generate day-by-day breakdown
 */
function generateDailyBreakdown(params) {
  const {
    duration,
    userLevel,
    timeAvailable,
    prioritized,
    masteryData,
    intensity,
    includeReview
  } = params

  const dailyPlan = []
  const masteryMap = new Map(masteryData.map(m => [`${m.mood}|${m.tense}`, m.score]))

  // Cycle through core tenses primarily
  const focusItems = [
    ...prioritized.core,
    ...(includeReview ? prioritized.review : [])
  ]

  for (let day = 1; day <= duration; day++) {
    const dayType = getDayType(day, duration)
    const focusIndex = (day - 1) % focusItems.length
    const primaryFocus = focusItems[focusIndex] || prioritized.core[0]

    const dayPlan = {
      day,
      date: addDays(new Date(), day - 1).toISOString().split('T')[0],
      dayType,
      focus: {
        mood: primaryFocus.mood,
        tense: primaryFocus.tense,
        priority: primaryFocus.priority,
        category: primaryFocus.category
      },
      targets: {
        drills: intensity === 'intensive' ? 20 : intensity === 'recommended' ? 15 : 10,
        estimatedMinutes: timeAvailable,
        accuracyGoal: dayType === 'review' ? 90 : 85
      },
      activities: generateDayActivities(primaryFocus, dayType, timeAvailable, masteryMap),
      restDay: dayType === 'rest',
      checkpoint: dayType === 'checkpoint'
    }

    dailyPlan.push(dayPlan)
  }

  return dailyPlan
}

/**
 * Determine day type (learning, review, rest, checkpoint)
 */
function getDayType(day, totalDays) {
  // Every 7 days is a review day
  if (day % 7 === 0) return 'checkpoint'

  // Every 5 days includes rest elements
  if (day % 5 === 0) return 'review'

  // First 3 days of each week are intensive learning
  const weekDay = ((day - 1) % 7) + 1
  if (weekDay <= 3) return 'learning'

  // Last days of week are practice/consolidation
  return 'practice'
}

/**
 * Generate activities for a specific day
 */
function generateDayActivities(focus, dayType, timeAvailable, masteryMap) {
  const key = `${focus.mood}|${focus.tense}`
  const currentMastery = masteryMap.get(key) || 0

  const activities = []

  if (dayType === 'checkpoint') {
    activities.push({
      type: 'assessment',
      title: 'Evaluación Semanal',
      description: 'Prueba de todas las habilidades de la semana',
      estimatedMinutes: Math.min(20, timeAvailable * 0.7),
      mandatory: true
    })
    activities.push({
      type: 'review',
      title: 'Repaso General',
      description: 'Repasar áreas débiles identificadas',
      estimatedMinutes: Math.min(10, timeAvailable * 0.3),
      mandatory: false
    })
  } else if (dayType === 'review') {
    activities.push({
      type: 'spaced_repetition',
      title: 'Repaso SRS',
      description: 'Elementos programados para revisión',
      estimatedMinutes: timeAvailable * 0.6,
      mandatory: true
    })
    activities.push({
      type: 'weak_areas',
      title: 'Áreas Débiles',
      description: 'Practicar conjugaciones con <70% dominio',
      estimatedMinutes: timeAvailable * 0.4,
      mandatory: false
    })
  } else {
    // Learning or practice day
    const learningTime = dayType === 'learning' ? 0.7 : 0.5
    const practiceTime = 1 - learningTime

    activities.push({
      type: 'focused_practice',
      title: `Práctica: ${focus.tense}`,
      description: `Dominar ${focus.mood} - ${focus.tense}`,
      mood: focus.mood,
      tense: focus.tense,
      estimatedMinutes: timeAvailable * learningTime,
      targetAccuracy: currentMastery < 50 ? 70 : 85,
      mandatory: true
    })

    if (practiceTime > 0) {
      activities.push({
        type: 'mixed_practice',
        title: 'Práctica Variada',
        description: 'Mezcla de todas las habilidades actuales',
        estimatedMinutes: timeAvailable * practiceTime,
        mandatory: false
      })
    }
  }

  return activities
}

/**
 * Generate milestones for the plan
 */
function generateMilestones(dailyPlan, userLevel) {
  const milestones = []
  const checkpoints = dailyPlan.filter(d => d.checkpoint)

  checkpoints.forEach((checkpoint, index) => {
    milestones.push({
      day: checkpoint.day,
      title: `Hito ${index + 1}: Evaluación Semanal`,
      description: `Verifica tu progreso en ${checkpoint.focus.tense}`,
      type: 'assessment',
      requiredAccuracy: 80,
      estimatedMastery: 70 + (index * 5)
    })
  })

  // Add level completion milestone
  const finalDay = dailyPlan[dailyPlan.length - 1]
  if (finalDay) {
    milestones.push({
      day: finalDay.day,
      title: `Completar Nivel ${userLevel}`,
      description: `Dominar todas las conjugaciones de nivel ${userLevel}`,
      type: 'level_completion',
      requiredAccuracy: 85,
      estimatedMastery: 90
    })
  }

  return milestones
}

/**
 * Calculate average mastery across all tenses
 */
function calculateAverageMastery(masteryData) {
  if (!masteryData || masteryData.length === 0) return 0
  const total = masteryData.reduce((sum, m) => sum + (m.score || 0), 0)
  return Math.round(total / masteryData.length)
}

/**
 * Add days to a date
 */
function addDays(date, days) {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

/**
 * Get user's active study plan
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} Active plan or null
 */
export async function getActiveStudyPlan(userId = null) {
  const targetUserId = userId || getCurrentUserId()
  if (!targetUserId) return null

  // In production, this would fetch from database
  // For now, return null (plan must be generated)
  return null
}

/**
 * Update study plan progress
 * @param {string} planId - Plan ID
 * @param {number} day - Day number
 * @param {Object} results - Day results
 * @returns {Promise<Object>} Updated plan
 */
export async function updatePlanProgress(planId, day, results) {
  // In production, this would update the database
  logger.debug('Updating plan progress', { planId, day, results })

  return {
    success: true,
    completed: results.accuracy >= results.targetAccuracy,
    nextDay: day + 1
  }
}

export default {
  generateStudyPlan,
  getActiveStudyPlan,
  updatePlanProgress,
  LEVEL_MILESTONES
}
