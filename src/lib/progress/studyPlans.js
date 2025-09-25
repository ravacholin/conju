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
import logger from './logger.js'
import { getAdvancedAnalytics } from './analytics.js'

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

function buildSessionBlueprints(mlPlan, predictedSequence) {
  const recommendations = Array.isArray(mlPlan?.recommendations) ? mlPlan.recommendations : []
  return {
    sessions: recommendations,
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
  if (!PROGRESS_CONFIG.FEATURE_FLAGS.PERSONALIZED_STUDY_PLANS) {
    return null
  }

  const resolvedUserId = userId || getCurrentUserId()
  if (!resolvedUserId) {
    throw new Error('Usuario no disponible para generar plan de estudio')
  }

  if (!options.forceRefresh) {
    const cached = getCacheEntry(resolvedUserId)
    if (isCacheValid(cached)) {
      return clonePlan(cached.plan)
    }
  }

  try {
    const userSettings = getUserSettings(resolvedUserId)
    const profile = userSettings?.personalizationProfile || { style: 'balanced', intensity: 'standard' }
    const level = userSettings?.level || 'B1'

    const coach = new PersonalizedCoach(resolvedUserId)
    const analysis = await coach.getCoachingAnalysis(level)

    const goalsState = typeof getCurrentGoalsState === 'function'
      ? getCurrentGoalsState()
      : dynamicGoalsSystem?.getCurrentGoalsState?.() || null

    const sessionDuration = options.sessionDuration || 20
    const difficulty = options.preferredDifficulty || (profile.intensity === 'intense' ? 'hard' : 'medium')

    const mlPlan = await mlRecommendationEngine.generateSessionRecommendations({
      duration: sessionDuration,
      preferredDifficulty: difficulty,
      includeNewContent: options.includeNewContent ?? true
    })

    const predictedSequence = await learningPathPredictor.predictNextOptimalCombinations({
      sessionLength: sessionDuration,
      maxCombinations: PROGRESS_CONFIG.PERSONALIZATION.STUDY_PLAN.MAX_SESSION_RECOMMENDATIONS,
      difficultyTolerance: difficulty
    })

    const scheduling = temporalIntelligence.getSRSSchedulingRecommendations()
    const momentumInsights = momentumTracker.getMomentumInsights?.() || null
    const confidenceState = confidenceEngine.getCurrentConfidenceState?.() || {}

    const analytics = PROGRESS_CONFIG.FEATURE_FLAGS.ADVANCED_ANALYTICS
      ? await getAdvancedAnalytics(resolvedUserId)
      : null

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
