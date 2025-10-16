// Sistema de tracking de planes de estudio personalizados
// Gestiona el progreso de sesiones dentro de planes generados

import { getCurrentUserId } from './userManager.js'
import { logger } from './logger.js'
import { saveToDB } from './database.js'
import { STORAGE_CONFIG } from './config.js'

const STORAGE_KEY = 'progress-plan-tracking'
const ACTIVE_PLAN_KEY = 'progress-active-plan'

/**
 * Estructura de un plan activo:
 * {
 *   planId: string,
 *   userId: string,
 *   generatedAt: timestamp,
 *   startedAt: timestamp,
 *   sessions: [
 *     {
 *       sessionId: string,
 *       status: 'pending' | 'in-progress' | 'completed',
 *       startedAt: timestamp | null,
 *       completedAt: timestamp | null,
 *       stats: { attempts: number, accuracy: number, duration: number } | null
 *     }
 *   ],
 *   progress: { completed: number, total: number },
 *   lastUpdated: timestamp
 * }
 */

/**
 * Obtiene el plan activo del usuario
 */
export function getActivePlan() {
  try {
    const userId = getCurrentUserId()
    if (!userId) return null

    const stored = localStorage.getItem(`${ACTIVE_PLAN_KEY}-${userId}`)
    if (!stored) return null

    const plan = JSON.parse(stored)
    return plan
  } catch (error) {
    logger.error('Error getting active plan:', error)
    return null
  }
}

/**
 * Guarda el plan activo
 */
function saveActivePlan(plan) {
  try {
    const userId = getCurrentUserId()
    if (!userId) return false

    plan.lastUpdated = Date.now()
    localStorage.setItem(`${ACTIVE_PLAN_KEY}-${userId}`, JSON.stringify(plan))

    // Disparar evento para actualizar UI
    window.dispatchEvent(new CustomEvent('progress:plan-updated', { detail: plan }))

    return true
  } catch (error) {
    logger.error('Error saving active plan:', error)
    return false
  }
}

/**
 * Inicializa un nuevo plan activo
 */
export function initializePlan(generatedPlan) {
  try {
    const userId = getCurrentUserId()
    if (!userId || !generatedPlan) return false

    // Extraer sesiones del plan generado
    const sessions = (generatedPlan.sessionBlueprints?.sessions || []).map((session, index) => ({
      sessionId: session.id || `session-${index}`,
      status: 'pending',
      startedAt: null,
      completedAt: null,
      stats: null,
      config: session.drillConfig || null
    }))

    const plan = {
      planId: `plan-${Date.now()}-${userId}`,
      userId,
      generatedAt: generatedPlan.generatedAt || new Date().toISOString(),
      startedAt: Date.now(),
      sessions,
      progress: {
        completed: 0,
        total: sessions.length
      },
      lastUpdated: Date.now()
    }

    saveActivePlan(plan)
    logger.info('Plan initialized:', plan.planId)

    return plan
  } catch (error) {
    logger.error('Error initializing plan:', error)
    return null
  }
}

/**
 * Marca una sesión como iniciada
 */
export function markSessionAsStarted(sessionId) {
  try {
    const plan = getActivePlan()
    if (!plan) return false

    const sessionIndex = plan.sessions.findIndex(s => s.sessionId === sessionId)
    if (sessionIndex === -1) return false

    plan.sessions[sessionIndex].status = 'in-progress'
    plan.sessions[sessionIndex].startedAt = Date.now()

    saveActivePlan(plan)
    logger.info('Session started:', sessionId)

    return true
  } catch (error) {
    logger.error('Error marking session as started:', error)
    return false
  }
}

function applyManualCompletionState(session, manualEnd = false) {
  session.manualEnd = manualEnd
}

/**
 * Marca una sesión como completada
 */
export async function markSessionAsCompleted(sessionId, stats = {}, options = {}) {
  try {
    const plan = getActivePlan()
    if (!plan) return false

    const sessionIndex = plan.sessions.findIndex(s => s.sessionId === sessionId)
    if (sessionIndex === -1) return false

    const manualEnd = Boolean(options.manualEnd ?? stats.manualEnd)
    plan.sessions[sessionIndex].status = 'completed'
    plan.sessions[sessionIndex].completedAt = Date.now()
    plan.sessions[sessionIndex].stats = {
      attempts: stats.attempts || 0,
      accuracy: stats.accuracy || 0,
      duration: stats.duration || 0,
      ...stats
    }

    plan.sessions[sessionIndex].stats.manualEnd = manualEnd
    applyManualCompletionState(plan.sessions[sessionIndex], manualEnd)

    // Actualizar progreso
    plan.progress.completed = plan.sessions.filter(s => s.status === 'completed').length

    saveActivePlan(plan)

    // Persistir en IndexedDB para sincronización
    await persistSessionCompletionToDb(plan.planId, sessionId, plan.sessions[sessionIndex].stats)

    logger.info('Session completed:', sessionId, stats)

    // Verificar si el plan está completo
    if (plan.progress.completed === plan.progress.total) {
      await completePlan(plan)
    }

    return true
  } catch (error) {
    logger.error('Error marking session as completed:', error)
    return false
  }
}

/**
 * Obtiene el estado de una sesión específica
 */
export function getSessionStatus(sessionId) {
  const plan = getActivePlan()
  if (!plan) return 'pending'

  const session = plan.sessions.find(s => s.sessionId === sessionId)
  return session?.status || 'pending'
}

/**
 * Obtiene la siguiente sesión pendiente
 */
export function getNextPendingSession() {
  const plan = getActivePlan()
  if (!plan) return null

  // Buscar primera sesión en progreso
  const inProgress = plan.sessions.find(s => s.status === 'in-progress')
  if (inProgress) return inProgress

  // Si no hay en progreso, buscar primera pendiente
  const pending = plan.sessions.find(s => s.status === 'pending')
  return pending || null
}

/**
 * Obtiene el progreso del plan
 */
export function getPlanProgress() {
  const plan = getActivePlan()
  if (!plan) {
    return {
      completed: 0,
      total: 0,
      percentage: 0,
      nextSession: null,
      activePlan: null
    }
  }

  const nextSession = getNextPendingSession()
  const percentage = plan.progress.total > 0
    ? Math.round((plan.progress.completed / plan.progress.total) * 100)
    : 0

  return {
    completed: plan.progress.completed,
    total: plan.progress.total,
    percentage,
    nextSession,
    activePlan: plan
  }
}

/**
 * Invalida el plan activo (cuando se regenera)
 */
export function invalidateActivePlan() {
  try {
    const userId = getCurrentUserId()
    if (!userId) return false

    // Mover plan actual a historial antes de invalidar
    const currentPlan = getActivePlan()
    if (currentPlan) {
      archivePlan(currentPlan)
    }

    localStorage.removeItem(`${ACTIVE_PLAN_KEY}-${userId}`)
    window.dispatchEvent(new CustomEvent('progress:plan-invalidated'))

    logger.info('Active plan invalidated')
    return true
  } catch (error) {
    logger.error('Error invalidating plan:', error)
    return false
  }
}

/**
 * Persiste la completación de sesión en IndexedDB
 */
async function persistSessionCompletionToDb(planId, sessionId, stats) {
  try {
    if (!db) return

    const userId = getCurrentUserId()
    if (!userId) return

    const event = {
      id: `${planId}-${sessionId}-${Date.now()}`,
      userId,
      type: 'session_completed',
      planId,
      sessionId,
      stats,
      timestamp: new Date().toISOString()
    }

    await db.put('events', event)
  } catch (error) {
    logger.warn('Could not persist session completion to DB:', error)
  }
}

/**
 * Completa el plan completo
 */
async function completePlan(plan) {
  try {
    const userId = getCurrentUserId()
    if (!userId) return

    // Guardar en historial
    archivePlan(plan)

    // Disparar evento de plan completado
    window.dispatchEvent(new CustomEvent('progress:plan-completed', {
      detail: { planId: plan.planId, stats: calculatePlanStats(plan) }
    }))

    logger.info('Plan completed:', plan.planId)
  } catch (error) {
    logger.error('Error completing plan:', error)
  }
}

/**
 * Archiva un plan en el historial
 */
function archivePlan(plan) {
  try {
    const userId = getCurrentUserId()
    if (!userId) return

    const historyKey = `${STORAGE_KEY}-history-${userId}`
    const history = JSON.parse(localStorage.getItem(historyKey) || '[]')

    // Agregar plan completado
    history.unshift({
      ...plan,
      archivedAt: Date.now()
    })

    // Mantener solo últimos 10 planes
    const trimmedHistory = history.slice(0, 10)

    localStorage.setItem(historyKey, JSON.stringify(trimmedHistory))
  } catch (error) {
    logger.error('Error archiving plan:', error)
  }
}

/**
 * Calcula estadísticas del plan
 */
function calculatePlanStats(plan) {
  const completedSessions = plan.sessions.filter(s => s.status === 'completed')

  if (completedSessions.length === 0) {
    return {
      totalAttempts: 0,
      avgAccuracy: 0,
      totalDuration: 0,
      completionTime: 0
    }
  }

  const totalAttempts = completedSessions.reduce((sum, s) => sum + (s.stats?.attempts || 0), 0)
  const avgAccuracy = completedSessions.reduce((sum, s) => sum + (s.stats?.accuracy || 0), 0) / completedSessions.length
  const totalDuration = completedSessions.reduce((sum, s) => sum + (s.stats?.duration || 0), 0)
  const completionTime = plan.lastUpdated - plan.startedAt

  return {
    totalAttempts,
    avgAccuracy: Math.round(avgAccuracy * 100) / 100,
    totalDuration: Math.round(totalDuration),
    completionTime: Math.round(completionTime / 1000 / 60) // minutos
  }
}

/**
 * Obtiene el historial de planes
 */
export function getPlanHistory() {
  try {
    const userId = getCurrentUserId()
    if (!userId) return []

    const historyKey = `${STORAGE_KEY}-history-${userId}`
    return JSON.parse(localStorage.getItem(historyKey) || '[]')
  } catch (error) {
    logger.error('Error getting plan history:', error)
    return []
  }
}

/**
 * Reinicia una sesión (si fue abandonada)
 */
export function resetSession(sessionId) {
  try {
    const plan = getActivePlan()
    if (!plan) return false

    const sessionIndex = plan.sessions.findIndex(s => s.sessionId === sessionId)
    if (sessionIndex === -1) return false

    plan.sessions[sessionIndex].status = 'pending'
    plan.sessions[sessionIndex].startedAt = null
    plan.sessions[sessionIndex].completedAt = null
    plan.sessions[sessionIndex].stats = null

    saveActivePlan(plan)
    logger.info('Session reset:', sessionId)

    return true
  } catch (error) {
    logger.error('Error resetting session:', error)
    return false
  }
}

/**
 * Incrementa el contador de intentos de la sesión activa
 */
export function incrementSessionAttempts(sessionId, isCorrect = false) {
  try {
    const plan = getActivePlan()
    if (!plan) return false

    const sessionIndex = plan.sessions.findIndex(s => s.sessionId === sessionId)
    if (sessionIndex === -1) return false

    // Inicializar stats si no existe
    if (!plan.sessions[sessionIndex].stats) {
      plan.sessions[sessionIndex].stats = {
        attempts: 0,
        correctAttempts: 0,
        accuracy: 0,
        duration: 0
      }
    }

    // Incrementar intentos
    plan.sessions[sessionIndex].stats.attempts++
    if (isCorrect) {
      plan.sessions[sessionIndex].stats.correctAttempts++
    }

    // Calcular precisión
    plan.sessions[sessionIndex].stats.accuracy =
      plan.sessions[sessionIndex].stats.correctAttempts / plan.sessions[sessionIndex].stats.attempts

    // Calcular duración
    if (plan.sessions[sessionIndex].startedAt) {
      plan.sessions[sessionIndex].stats.duration = Date.now() - plan.sessions[sessionIndex].startedAt
    }

    saveActivePlan(plan)

    // Verificar si se alcanzó el objetivo de intentos
    const targetAttempts = plan.sessions[sessionIndex].config?.targetAttempts || 15
    if (plan.sessions[sessionIndex].stats.attempts >= targetAttempts) {
      // Marcar como completada automáticamente
      markSessionAsCompleted(sessionId, plan.sessions[sessionIndex].stats)
    }

    return true
  } catch (error) {
    logger.error('Error incrementing session attempts:', error)
    return false
  }
}

/**
 * Obtiene el progreso de intentos de una sesión
 */
export function getSessionAttemptProgress(sessionId) {
  try {
    const plan = getActivePlan()
    if (!plan) return { attempts: 0, target: 15, percentage: 0 }

    const session = plan.sessions.find(s => s.sessionId === sessionId)
    if (!session) return { attempts: 0, target: 15, percentage: 0 }

    const attempts = session.stats?.attempts || 0
    const target = session.config?.targetAttempts || 15
    const percentage = Math.min(100, Math.round((attempts / target) * 100))

    return { attempts, target, percentage, accuracy: session.stats?.accuracy || 0 }
  } catch (error) {
    logger.error('Error getting session attempt progress:', error)
    return { attempts: 0, target: 15, percentage: 0 }
  }
}

// Debug helpers
if (typeof window !== 'undefined') {
  window.SpanishConjugator = window.SpanishConjugator || {}
  window.SpanishConjugator.PlanTracking = {
    getActivePlan,
    getPlanProgress,
    getNextPendingSession,
    getPlanHistory,
    invalidateActivePlan,
    markSessionAsStarted,
    markSessionAsCompleted,
    incrementSessionAttempts,
    getSessionAttemptProgress
  }
}
