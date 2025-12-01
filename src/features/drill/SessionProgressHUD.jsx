/**
 * SessionProgressHUD.jsx - HUD para mostrar progreso de sesiones personalizadas
 *
 * Muestra información específica cuando el usuario está en una sesión personalizada:
 * - Actividad actual y progreso entre actividades
 * - Tiempo transcurrido vs duración planificada
 * - Métricas de la sesión en curso
 * - Control de finalización anticipada
 */

import React, { useEffect, useState } from 'react'
import sessionManager, { getCurrentSessionProgress, hasActiveSession } from '../../lib/progress/sessionManager.js'
import { useSettings } from '../../state/settings.js'
import { getActivePlan, markSessionAsCompleted, getSessionAttemptProgress } from '../../lib/progress/planTracking.js'

export default function SessionProgressHUD() {
  const [sessionProgress, setSessionProgress] = useState(null)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [planSession, setPlanSession] = useState(null)
  const settings = useSettings()

  // Actualizar progreso de sesión
  useEffect(() => {
    const updateProgress = () => {
      // Verificar si hay sesión de plan activa
      if (settings.activeSessionId && settings.activePlanId) {
        const activePlan = getActivePlan()
        if (activePlan) {
          const session = activePlan.sessions.find(s => s.sessionId === settings.activeSessionId)
          if (session) {
            setPlanSession(session)
            setSessionProgress(null) // Limpiar progreso de sesión normal
            return
          }
        }
      }

      // Si no hay plan session, limpiar
      if (!settings.activeSessionId || !settings.activePlanId) {
        setPlanSession(null)
      }

      // Verificar sesión personalizada normal
      if (settings.practiceMode === 'personalized_session' && hasActiveSession()) {
        const progress = getCurrentSessionProgress()
        setSessionProgress(progress)

        if (progress && progress.sessionActive) {
          setTimeElapsed(progress.elapsedMinutes)
        }
      } else if (!settings.activeSessionId && !settings.activePlanId) {
        // Solo limpiar sessionProgress si NO hay plan session
        setSessionProgress(null)
        setTimeElapsed(0)
      }
    }

    // Actualización inicial
    updateProgress()

    // Escuchar eventos de progreso de sesión
    const handleSessionUpdate = (event) => {
      updateProgress()
    }

    // Escuchar eventos de plan
    const handlePlanUpdate = (event) => {
      updateProgress()
    }

    window.addEventListener('session-progress-update', handleSessionUpdate)
    window.addEventListener('progress:plan-updated', handlePlanUpdate)

    // Timer para actualizar tiempo transcurrido cada minuto
    const timer = setInterval(() => {
      if (sessionProgress && sessionProgress.sessionActive) {
        setTimeElapsed(prev => prev + 1)
      }
    }, 60000)

    return () => {
      window.removeEventListener('session-progress-update', handleSessionUpdate)
      window.removeEventListener('progress:plan-updated', handlePlanUpdate)
      clearInterval(timer)
    }
  }, [settings.practiceMode, settings.activeSessionId, settings.activePlanId, sessionProgress?.sessionActive])

  const formatTime = (minutes) => {
    if (minutes < 60) {
      return `${minutes}min`
    }
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}min`
  }

  const getActivityIcon = (activityType) => {
    const icons = {
      weak_area_practice: '/diana.png',
      spaced_review: '/icons/refresh.png',
      new_content: '/openbook.png',
      core_focus: '/icons/sparks.png',
      balanced_practice: '/icons/chart.png'
    }
    return icons[activityType] || '/play.png'
  }

  const handleEndSession = async () => {
    const confirmMessage = planSession
      ? '¿Estás seguro de que querés terminar la sesión del plan?'
      : '¿Estás seguro de que querés terminar la sesión personalizada?'

    if (window.confirm(confirmMessage)) {
      const finalMetrics = sessionManager.endSession({ manualEnd: true })

      if (planSession && settings.activeSessionId) {
        const attemptProgress = getSessionAttemptProgress(settings.activeSessionId)
        const stats = {
          attempts: attemptProgress.attempts,
          accuracy: attemptProgress.accuracy,
          duration: finalMetrics?.totalDuration || 0,
          manualEnd: true
        }

        await markSessionAsCompleted(settings.activeSessionId, stats, { manualEnd: true })
      }

      // Finalizar sesión y volver a modo normal
      settings.set({
        practiceMode: 'mixed',
        currentSession: null,
        currentActivityIndex: 0,
        sessionStartTime: null,
        activeSessionId: null,
        activePlanId: null
      })

      // Dispatch event para notificar finalización
      window.dispatchEvent(new CustomEvent('session-progress-update', {
        detail: { type: 'session_ended', manual: true, manualEnd: true, data: finalMetrics }
      }))
    }
  }

  // EARLY RETURN 1: No mostrar si no hay ninguna sesión activa
  if (!planSession && (!sessionProgress || !sessionProgress.sessionActive)) {
    return null
  }

  // EARLY RETURN 2: Renderizar HUD para sesión de plan
  if (planSession) {
    const activePlan = getActivePlan()
    const planProgress = activePlan
      ? {
          completed: activePlan.sessions.filter(s => s.status === 'completed').length,
          total: activePlan.sessions.length
        }
      : { completed: 0, total: 0 }

    const attemptProgress = getSessionAttemptProgress(settings.activeSessionId)

    return (
      <div className="session-progress-hud active plan-session">
        <div className="hud-header">
          <span className="session-title">
            <img src={planSession.config?.icon || '/play.png'} alt="" style={{ width: '18px', height: '18px', marginRight: '6px', opacity: 0.8 }} />
            Sesión del plan
          </span>
          <button
            className="btn btn-small btn-secondary"
            onClick={handleEndSession}
            title="Terminar sesión anticipadamente"
          >
            Terminar
          </button>
        </div>

        <div className="activity-progress">
          <div className="activity-info">
            <div className="activity-title">
              {planSession.config?.title || 'Práctica de plan de estudio'}
            </div>
            <div className="activity-meta">
              Sesión {planProgress.completed + 1} de {planProgress.total}
              {planSession.config?.estimatedDuration && (
                <span> • ~{planSession.config.estimatedDuration}</span>
              )}
            </div>
          </div>

          <div className="progress-bar-container">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${attemptProgress.percentage}%` }}
              />
            </div>
            <span className="progress-text">
              {attemptProgress.attempts} / {attemptProgress.target} ejercicios
            </span>
          </div>
        </div>

        <div className="session-stats">
          <div className="stat-item">
            <span className="stat-label">Progreso plan:</span>
            <span className="stat-value">
              {planProgress.completed} / {planProgress.total} sesiones
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Precisión:</span>
            <span className="stat-value">{Math.round(attemptProgress.accuracy * 100)}%</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Dificultad:</span>
            <span className="stat-value">{planSession.config?.difficulty || 'Medio'}</span>
          </div>
        </div>
      </div>
    )
  }

  // Si llegamos aquí, es una sesión personalizada normal (NO plan)
  // sessionProgress DEBE existir porque pasó el primer guard
  // PERO por timing de React, puede ser null durante la transición a plan session
  if (!sessionProgress) {
    return null
  }

  const {
    currentActivity,
    currentActivityIndex,
    totalActivities,
    progressPercentage,
    plannedDuration,
    plannedMinutes,
    completedActivities,
    metrics,
    focusAreas,
    isCompleted
  } = sessionProgress

  const sessionPlannedMinutes = Number.isFinite(plannedMinutes)
    ? plannedMinutes
    : Math.floor((plannedDuration || 0) / 60000)

  // EARLY RETURN 3: Sesión completada
  if (isCompleted) {
    return (
      <div className="session-progress-hud completed">
        <div className="hud-header">
          <span className="session-title">
            <img src="/icons/trophy.png" alt="" style={{ width: '18px', height: '18px', marginRight: '6px', opacity: 0.8 }} />
            ¡Sesión Completada!
          </span>
        </div>
        <div className="session-summary">
          <div className="summary-stat">
            <strong>Actividades:</strong> {completedActivities}/{totalActivities}
          </div>
          <div className="summary-stat">
            <strong>Tiempo:</strong> {formatTime(timeElapsed)}
          </div>
          <div className="summary-stat">
            <strong>Precisión:</strong> {metrics.totalItems > 0 ? Math.round((metrics.correctItems / metrics.totalItems) * 100) : 0}%
          </div>
          <div className="summary-stat">
            <strong>Ítems:</strong> {metrics.totalItems}
          </div>
        </div>
        <button
          className="btn btn-primary"
          onClick={handleEndSession}
        >
          Finalizar Sesión
        </button>
      </div>
    )
  }

  // RENDER FINAL: Sesión personalizada en progreso
  return (
    <div className="session-progress-hud active">
      <div className="hud-header">
        <span className="session-title">
          <img src={getActivityIcon(currentActivity?.type)} alt="" style={{ width: '18px', height: '18px', marginRight: '6px', opacity: 0.8 }} />
          Sesión Personalizada
        </span>
        <button
          className="btn btn-small btn-secondary"
          onClick={handleEndSession}
          title="Terminar sesión anticipadamente"
        >
          Terminar
        </button>
      </div>

      <div className="activity-progress">
        <div className="activity-info">
          <div className="activity-title">
            {currentActivity?.title || 'Cargando actividad...'}
          </div>
          <div className="activity-meta">
            Actividad {currentActivityIndex + 1} de {totalActivities}
            {currentActivity?.allocatedTime && (
              <span> • ~{currentActivity.allocatedTime}min</span>
            )}
          </div>
        </div>

        <div className="progress-bar-container">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <span className="progress-text">{Math.round(progressPercentage)}%</span>
        </div>
      </div>

      <div className="session-stats">
        <div className="stat-item">
          <span className="stat-label">Tiempo:</span>
          <span className="stat-value">
            {formatTime(timeElapsed)} / {formatTime(sessionPlannedMinutes)}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Ítems:</span>
          <span className="stat-value">{metrics.totalItems}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Precisión:</span>
          <span className="stat-value">
            {metrics.totalItems > 0 ? Math.round((metrics.correctItems / metrics.totalItems) * 100) : 0}%
          </span>
        </div>
      </div>

      {focusAreas && focusAreas.length > 0 && (
        <div className="focus-areas">
          <span className="focus-label">Enfoque:</span>
          <div className="focus-tags">
            {focusAreas.map((area, index) => (
              <span key={index} className="focus-tag">
                {area}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
