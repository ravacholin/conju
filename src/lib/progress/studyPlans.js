// Personalized study plan builder (Phase 3)

import { PROGRESS_CONFIG } from './config.js'
import { getCurrentUserId, getUserSettings } from './userManager.js'
import { PersonalizedCoach } from './personalizedCoaching.js'
import { getCurrentGoalsState, dynamicGoalsSystem } from './dynamicGoals.js'
import { learningPathPredictor } from './learningPathPredictor.js'
import { mlRecommendationEngine } from './mlRecommendations.js'
import { temporalIntelligence } from './temporalIntelligence.js'
import { momentumTracker } from './momentumTracker.js'
import confidenceEngine from './confidenceEngine.js'
import { getAdvancedAnalytics } from './analytics.js'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('progress:studyPlans')

const planCache = new Map()
const planListeners = new Set()

function clonePlan(plan) {
  if (!plan) return null
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(plan)
    } catch (error) {
      logger.warn('structuredClone fallback in study plan', error)
    }
  }
  return JSON.parse(JSON.stringify(plan))
}

function getCacheEntry(userId) {
  return planCache.get(userId)
}

function setCacheEntry(userId, plan) {
  planCache.set(userId, {
    plan,
    timestamp: Date.now()
  })
}

function isCacheValid(entry) {
  if (!entry) return false
  const ttl = PROGRESS_CONFIG.PERSONALIZATION.STUDY_PLAN.CACHE_TTL
  return Date.now() - entry.timestamp < ttl
}

function notifyPlanListeners(userId, plan) {
  const payload = { userId, plan: clonePlan(plan) }
  planListeners.forEach(listener => {
    try {
      listener(payload)
    } catch (error) {
      logger.warn('Error notifying study plan listener', error)
    }
  })
}

function buildPlanOverview(analysis, goalsState, analytics, profile) {
  return {
    focusArea: analysis?.primaryChallenge || null,
    strengths: analysis?.strengthsWeaknesses?.strengths?.slice?.(0, 3) || [],
    goalsSummary: goalsState?.progressSummary || null,
    personalizationStyle: profile?.style || 'balanced',
    analyticsHighlights: analytics?.retention?.trend || null
  }
}

function buildTimeline(analysis) {
  const defaultDuration = PROGRESS_CONFIG.PERSONALIZATION.STUDY_PLAN.DEFAULT_DURATION_WEEKS
  const studyPlan = analysis?.studyPlan || {}
  const weeks = Array.isArray(studyPlan.weeks) && studyPlan.weeks.length
    ? studyPlan.weeks
    : []

  return {
    durationWeeks: studyPlan.duration || defaultDuration,
    sessionsPerWeek: studyPlan.sessionsPerWeek || 4,
    sessionLength: studyPlan.sessionLength || '15-20 minutos',
    weeks
  }
}

function buildMicroGoals(goalsState) {
  const maxGoals = PROGRESS_CONFIG.PERSONALIZATION.STUDY_PLAN.MAX_GOALS_IN_PLAN
  const activeGoals = Array.isArray(goalsState?.activeGoals) ? goalsState.activeGoals : []
  return activeGoals.slice(0, maxGoals)
}

/**
 * Convierte recomendaciones ML en sesiones ejecutables con drillConfig
 */
function convertRecommendationsToExecutableSessions(recommendations, predictedSequence) {
  const sessions = []
  const maxSessions = PROGRESS_CONFIG.PERSONALIZATION.STUDY_PLAN.MAX_SESSION_RECOMMENDATIONS

  // Mapeo de íconos por tipo de recomendación
  const iconMap = {
    'confidence_building': '/openbook.png',
    'focus_weakness': '/diana.png',
    'maintain_mastery': '/icons/refresh.png',
    'explore_new': '/play.png',
    'mixed_practice': '/dice.png',
    'flow_maintenance': '/icons/sparks.png',
    'challenge_practice': '/diana.png',
    'review': '/icons/timer.png'
  }

  // Mapeo de dificultad
  const difficultyMap = {
    'easy': 'Fácil',
    'medium': 'Medio',
    'hard': 'Difícil'
  }

  // Procesar recomendaciones ML
  recommendations.slice(0, maxSessions).forEach((rec, index) => {
    let drillConfig = {
      practiceMode: 'mixed',
      duration: 20
    }

    let title = rec.title || rec.message || `Sesión ${index + 1}`
    let description = rec.description || rec.suggestedApproach || 'Práctica personalizada'

    // Determinar configuración ejecutable basada en tipo de recomendación
    if (rec.type === 'focus_weakness' || rec.type === 'maintain_mastery' || rec.type === 'explore_new') {
      if (rec.targetAreas && Array.isArray(rec.targetAreas)) {
        // Si hay áreas específicas, usar la primera
        const firstArea = rec.targetAreas[0]
        if (typeof firstArea === 'string' && firstArea.includes('/')) {
          const [mood, tense] = firstArea.split('/')
          drillConfig = {
            practiceMode: 'specific',
            specificMood: mood.trim(),
            specificTense: tense.trim(),
            duration: 20
          }
        }
      }
    } else if (rec.type === 'mixed_practice' || rec.type === 'challenge_practice') {
      drillConfig = {
        practiceMode: 'mixed',
        duration: rec.adjustments?.duration || 20
      }
    } else if (rec.type === 'review' || rec.type === 'srs_optimization') {
      drillConfig = {
        practiceMode: 'review',
        reviewSessionType: 'due',
        duration: 15
      }
    }

    sessions.push({
      id: `session-${Date.now()}-${index}`,
      title,
      description,
      drillConfig,
      icon: iconMap[rec.type] || '/play.png',
      difficulty: difficultyMap[rec.difficulty] || difficultyMap[rec.adjustments?.difficulty] || 'Medio',
      estimatedDuration: `${drillConfig.duration || 20} min`,
      type: rec.type,
      priority: rec.priority || 0.5,
      targetAttempts: drillConfig.duration ? Math.floor(drillConfig.duration * 0.75) : 15 // ~0.75 intentos por minuto
    })
  })

  // Si no hay suficientes sesiones, agregar desde predictedSequence
  if (sessions.length < 3 && Array.isArray(predictedSequence) && predictedSequence.length > 0) {
    const remaining = Math.min(3 - sessions.length, predictedSequence.length)

    predictedSequence.slice(0, remaining).forEach((combo, index) => {
      const sessionIndex = sessions.length
      sessions.push({
        id: `session-predicted-${Date.now()}-${index}`,
        title: `Práctica: ${combo.mood} - ${combo.tense}`,
        description: `Sesión enfocada en ${combo.mood} ${combo.tense}`,
        drillConfig: {
          practiceMode: 'specific',
          specificMood: combo.mood,
          specificTense: combo.tense,
          duration: 20
        },
        icon: '/play.png',
        difficulty: combo.difficulty || 'Medio',
        estimatedDuration: '20 min',
        type: 'predicted',
        priority: combo.predictionScore || 0.5,
        targetAttempts: 15
      })
    })
  }

  // Si aún no hay sesiones, agregar sesión por defecto
  if (sessions.length === 0) {
    sessions.push({
      id: `session-default-${Date.now()}`,
      title: 'Práctica general',
      description: 'Sesión de práctica mixta para mejorar en todas las áreas',
      drillConfig: {
        practiceMode: 'mixed',
        duration: 20
      },
      icon: '/dice.png',
      difficulty: 'Medio',
      estimatedDuration: '20 min',
      type: 'mixed_practice',
      priority: 0.5,
      targetAttempts: 15
    })
  }

  return sessions
}

function buildSessionBlueprints(mlPlan, predictedSequence) {
  const recommendations = Array.isArray(mlPlan?.recommendations) ? mlPlan.recommendations : []

  // Convertir recomendaciones en sesiones ejecutables
  const executableSessions = convertRecommendationsToExecutableSessions(recommendations, predictedSequence)

  return {
    sessions: executableSessions,
    predictedSequence: Array.isArray(predictedSequence) ? predictedSequence : [],
    sessionPlan: mlPlan?.sessionPlan || null
  }
}

function buildMetrics(analytics, momentumInsights, confidenceState) {
  return {
    momentum: momentumInsights || null,
    confidence: {
      overall: confidenceState?.overall ?? 0,
      level: confidenceState?.level || 'unknown',
      strongAreas: confidenceState?.strongAreas?.slice?.(0, 3) || [],
      focusAreas: confidenceState?.improvementAreas?.slice?.(0, 3) || []
    },
    analytics: analytics || null
  }
}

export async function generatePersonalizedStudyPlan(userId = null, options = {}) {
  const { signal, ...restOptions } = options
  if (signal?.aborted) {
    throw new Error('Operation was cancelled')
  }

  if (!PROGRESS_CONFIG.FEATURE_FLAGS.PERSONALIZED_STUDY_PLANS) {
    return null
  }

  const resolvedUserId = userId || getCurrentUserId()
  if (!resolvedUserId) {
    throw new Error('Usuario no disponible para generar plan de estudio')
  }

  if (!restOptions.forceRefresh) {
    const cached = getCacheEntry(resolvedUserId)
    if (isCacheValid(cached)) {
      return clonePlan(cached.plan)
    }
  }

  try {
    if (signal?.aborted) {
      throw new Error('Operation was cancelled')
    }
    const userSettings = getUserSettings(resolvedUserId)
    const profile = userSettings?.personalizationProfile || { style: 'balanced', intensity: 'standard' }
    const level = userSettings?.level || 'B1'

    const coach = new PersonalizedCoach(resolvedUserId)
    const analysis = await coach.getCoachingAnalysis(level)
    if (signal?.aborted) {
      throw new Error('Operation was cancelled')
    }

    const goalsState = typeof getCurrentGoalsState === 'function'
      ? getCurrentGoalsState()
      : dynamicGoalsSystem?.getCurrentGoalsState?.() || null

    const sessionDuration = restOptions.sessionDuration || 20
    const difficulty = restOptions.preferredDifficulty || (profile.intensity === 'intense' ? 'hard' : 'medium')

    const mlPlan = await mlRecommendationEngine.generateSessionRecommendations({
      duration: sessionDuration,
      preferredDifficulty: difficulty,
      includeNewContent: restOptions.includeNewContent ?? true
    })
    if (signal?.aborted) {
      throw new Error('Operation was cancelled')
    }

    const predictedSequence = await learningPathPredictor.predictNextOptimalCombinations({
      sessionLength: sessionDuration,
      maxCombinations: PROGRESS_CONFIG.PERSONALIZATION.STUDY_PLAN.MAX_SESSION_RECOMMENDATIONS,
      difficultyTolerance: difficulty
    })
    if (signal?.aborted) {
      throw new Error('Operation was cancelled')
    }

    const scheduling = temporalIntelligence.getSRSSchedulingRecommendations()
    const momentumInsights = momentumTracker.getMomentumInsights?.() || null
    const confidenceState = confidenceEngine.getCurrentConfidenceState?.() || {}

    const analytics = PROGRESS_CONFIG.FEATURE_FLAGS.ADVANCED_ANALYTICS
      ? await getAdvancedAnalytics(resolvedUserId, signal)
      : null

    if (signal?.aborted) {
      throw new Error('Operation was cancelled')
    }

    const plan = {
      userId: resolvedUserId,
      generatedAt: new Date().toISOString(),
      level,
      profile,
      overview: buildPlanOverview(analysis, goalsState, analytics, profile),
      timeline: buildTimeline(analysis),
      microGoals: buildMicroGoals(goalsState),
      sessionBlueprints: buildSessionBlueprints(mlPlan, predictedSequence),
      scheduling: {
        recommendation: scheduling?.recommendation || 'now',
        nextOptimalTime: scheduling?.nextOptimalTime ?? null,
        hoursUntilNextOptimal: scheduling?.hoursUntil ?? null,
        guidance: scheduling?.reason || null,
        confidence: scheduling?.confidence ?? null
      },
      metrics: buildMetrics(analytics, momentumInsights, confidenceState)
    }

    setCacheEntry(resolvedUserId, plan)
    notifyPlanListeners(resolvedUserId, plan)

    return clonePlan(plan)
  } catch (error) {
    logger.error('Error generating personalized study plan', error)
    throw error
  }
}

export function getCachedStudyPlan(userId = null) {
  const resolvedUserId = userId || getCurrentUserId()
  if (!resolvedUserId) return null
  const cached = getCacheEntry(resolvedUserId)
  if (!isCacheValid(cached)) return null
  return clonePlan(cached.plan)
}

export function invalidateStudyPlan(userId = null) {
  const resolvedUserId = userId || getCurrentUserId()
  if (!resolvedUserId) return
  planCache.delete(resolvedUserId)
}

export function onStudyPlanUpdated(listener, { immediate = false } = {}) {
  if (typeof listener !== 'function') {
    throw new Error('Study plan listener debe ser una función')
  }
  planListeners.add(listener)
  if (immediate) {
    const plan = getCachedStudyPlan()
    if (plan) {
      try {
        listener({ userId: getCurrentUserId(), plan })
      } catch (error) {
        logger.warn('Error delivering immediate study plan notification', error)
      }
    }
  }
  return () => planListeners.delete(listener)
}

if (typeof window !== 'undefined') {
  const invalidate = () => invalidateStudyPlan()
  window.addEventListener('progress:dataUpdated', invalidate)
  window.addEventListener('progress:challengeCompleted', invalidate)
  window.addEventListener('progress:user-settings-updated', invalidate)
  window.addEventListener('progress:srs-updated', invalidate)
}
