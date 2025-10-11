/**
 * sessionManager.js - Gestión de sesiones personalizadas
 *
 * Este módulo maneja el estado y progreso de sesiones personalizadas,
 * proporcionando funcionalidades para:
 * - Seguimiento de actividades dentro de una sesión
 * - Gestión de tiempo y progreso
 * - Transición automática entre actividades
 * - Métricas de sesión
 */

import { createLogger } from '../utils/logger.js'

const logger = createLogger('sessionManager')

/**
 * Clase para gestionar sesiones personalizadas
 */
export class SessionManager {
  constructor() {
    this.currentSession = null
    this.currentActivityIndex = 0
    this.sessionStartTime = null
    this.activityStartTime = null
    this.completedActivities = []
    this.sessionMetrics = {
      totalItems: 0,
      correctItems: 0,
      hintsUsed: 0,
      averageLatency: 0,
      activitiesCompleted: 0
    }
  }

  /**
   * Inicia una nueva sesión personalizada
   * @param {Object} session - Sesión del AdaptivePracticeEngine
   * @param {number} session.duration - Duración en minutos
   * @param {Array} session.activities - Array de actividades
   * @param {number} session.estimatedItems - Ítems estimados
   * @param {Array} session.focusAreas - Áreas de enfoque
   * @returns {boolean} - Éxito de inicialización
   */
  startSession(session) {
    try {
      if (!session || !Array.isArray(session.activities) || session.activities.length === 0) {
        logger.warn('startSession', 'Invalid session data provided', session)
        return false
      }

      this.currentSession = session
      this.currentActivityIndex = 0
      this.sessionStartTime = Date.now()
      this.activityStartTime = Date.now()
      this.completedActivities = []
      this.sessionMetrics = {
        totalItems: 0,
        correctItems: 0,
        hintsUsed: 0,
        averageLatency: 0,
        activitiesCompleted: 0
      }

      logger.info('startSession', 'Session started', {
        duration: session.duration,
        activities: session.activities.length,
        estimatedItems: session.estimatedItems,
        focusAreas: session.focusAreas
      })

      this.dispatchSessionUpdate('session_started')
      return true
    } catch (error) {
      logger.error('startSession', 'Error starting session', error)
      return false
    }
  }

  /**
   * Obtiene la actividad actual
   * @returns {Object|null} - Actividad actual o null si no hay sesión
   */
  getCurrentActivity() {
    if (!this.currentSession || !this.currentSession.activities) {
      return null
    }

    if (this.currentActivityIndex >= this.currentSession.activities.length) {
      return null // Sesión completada
    }

    return this.currentSession.activities[this.currentActivityIndex]
  }

  /**
   * Avanza a la siguiente actividad
   * @returns {Object|null} - Nueva actividad actual o null si sesión completada
   */
  nextActivity() {
    if (!this.currentSession) {
      return null
    }

    // Marcar actividad actual como completada
    const currentActivity = this.getCurrentActivity()
    if (currentActivity) {
      const activityDuration = Date.now() - this.activityStartTime
      this.completedActivities.push({
        ...currentActivity,
        actualDuration: activityDuration,
        completedAt: Date.now()
      })
      this.sessionMetrics.activitiesCompleted++
    }

    // Avanzar al siguiente
    this.currentActivityIndex++
    this.activityStartTime = Date.now()

    const nextActivity = this.getCurrentActivity()

    if (nextActivity) {
      logger.info('nextActivity', 'Advanced to next activity', {
        activityIndex: this.currentActivityIndex,
        activityType: nextActivity.type,
        title: nextActivity.title
      })
      this.dispatchSessionUpdate('activity_changed')
    } else {
      logger.info('nextActivity', 'Session completed', {
        totalActivities: this.currentSession.activities.length,
        completedActivities: this.completedActivities.length
      })
      this.dispatchSessionUpdate('session_completed')
    }

    return nextActivity
  }

  /**
   * Registra el resultado de un ítem de práctica
   * @param {Object} result - Resultado del ítem
   * @param {boolean} result.isCorrect - Si fue correcto
   * @param {number} result.latencyMs - Latencia en ms
   * @param {number} result.hintsUsed - Pistas utilizadas
   */
  recordItemResult(result) {
    if (!this.currentSession) {
      return
    }

    this.sessionMetrics.totalItems++
    if (result.isCorrect) {
      this.sessionMetrics.correctItems++
    }
    if (result.hintsUsed) {
      this.sessionMetrics.hintsUsed += result.hintsUsed
    }

    // Calcular latencia promedio
    const currentAvg = this.sessionMetrics.averageLatency
    const totalItems = this.sessionMetrics.totalItems
    this.sessionMetrics.averageLatency =
      (currentAvg * (totalItems - 1) + (result.latencyMs || 0)) / totalItems

    this.dispatchSessionUpdate('item_completed')
  }

  /**
   * Obtiene el progreso actual de la sesión
   * @returns {Object} - Progreso detallado
   */
  getSessionProgress() {
    if (!this.currentSession) {
      return null
    }

    const currentActivity = this.getCurrentActivity()
    const totalActivities = this.currentSession.activities.length
    const elapsedTime = this.sessionStartTime ? Date.now() - this.sessionStartTime : 0
    const elapsedMinutes = Math.floor(elapsedTime / 60000)

    return {
      sessionActive: true,
      currentActivity,
      currentActivityIndex: this.currentActivityIndex,
      totalActivities,
      progressPercentage: (this.currentActivityIndex / totalActivities) * 100,
      elapsedMinutes,
      plannedDuration: this.currentSession.duration,
      completedActivities: this.completedActivities.length,
      metrics: { ...this.sessionMetrics },
      focusAreas: this.currentSession.focusAreas || [],
      isCompleted: this.currentActivityIndex >= totalActivities
    }
  }

  /**
   * Verifica si debe avanzar automáticamente basado en tiempo transcurrido
   * @returns {boolean} - Si debe avanzar automáticamente
   */
  shouldAutoAdvance() {
    const currentActivity = this.getCurrentActivity()
    if (!currentActivity || !this.activityStartTime) {
      return false
    }

    const elapsedMinutes = (Date.now() - this.activityStartTime) / 60000
    const allocatedTime = currentActivity.allocatedTime || 5 // Default 5 min

    // Auto avance cuando se supera 150% del tiempo asignado
    return elapsedMinutes > (allocatedTime * 1.5)
  }

  /**
   * Verifica si hay suficientes ítems completados para la actividad actual
   * @returns {boolean} - Si debe considerar avanzar
   */
  shouldConsiderAdvancing() {
    const currentActivity = this.getCurrentActivity()
    if (!currentActivity) {
      return false
    }

    const estimatedItems = currentActivity.estimatedItems || 3
    const itemsInThisActivity = this.sessionMetrics.totalItems // Simplificado, en realidad necesitaríamos tracking por actividad

    // Considerar avance cuando se superan los ítems estimados
    return itemsInThisActivity >= estimatedItems
  }

  /**
   * Finaliza la sesión actual
   * @returns {Object} - Métricas finales de la sesión
   */
  endSession(options = {}) {
    if (!this.currentSession) {
      return null
    }

    const finalMetrics = {
      ...this.sessionMetrics,
      totalDuration: Date.now() - this.sessionStartTime,
      plannedDuration: this.currentSession.duration * 60000, // Convert to ms
      completionRate: this.sessionMetrics.activitiesCompleted / this.currentSession.activities.length,
      accuracyRate: this.sessionMetrics.totalItems > 0 ?
        this.sessionMetrics.correctItems / this.sessionMetrics.totalItems : 0,
      focusAreas: this.currentSession.focusAreas,
      activitiesCompleted: this.completedActivities
    }

    const manualEnd = Boolean(options.manualEnd)

    logger.info('endSession', 'Session ended', {
      ...finalMetrics,
      manualEnd
    })
    this.dispatchSessionUpdate('session_ended', finalMetrics, { manualEnd })

    // Limpiar estado
    this.currentSession = null
    this.currentActivityIndex = 0
    this.sessionStartTime = null
    this.activityStartTime = null
    this.completedActivities = []

    return finalMetrics
  }

  /**
   * Verifica si hay una sesión activa
   * @returns {boolean}
   */
  hasActiveSession() {
    return this.currentSession !== null
  }

  /**
   * Despacha eventos de actualización de sesión
   * @param {string} eventType - Tipo de evento
   * @param {Object} data - Datos adicionales
   */
  dispatchSessionUpdate(eventType, data = null, extraDetail = {}) {
    try {
      if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
        const eventData = {
          type: eventType,
          progress: this.getSessionProgress(),
          ...(data && { data }),
          ...extraDetail
        }

        const event = new CustomEvent('session-progress-update', {
          detail: eventData
        })
        window.dispatchEvent(event)
      }
    } catch (error) {
      logger.warn('dispatchSessionUpdate', 'Error dispatching event', error)
    }
  }
}

// Instancia singleton para uso global
export const sessionManager = new SessionManager()

/**
 * Hook para obtener el estado actual de la sesión
 * @returns {Object|null} - Estado de progreso de sesión o null
 */
export function getCurrentSessionProgress() {
  return sessionManager.getSessionProgress()
}

/**
 * Hook para verificar si hay sesión activa
 * @returns {boolean}
 */
export function hasActiveSession() {
  return sessionManager.hasActiveSession()
}

export default sessionManager