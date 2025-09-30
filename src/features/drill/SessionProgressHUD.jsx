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
import { getCurrentSessionProgress, hasActiveSession } from '../../lib/progress/sessionManager.js'
import { useSettings } from '../../state/settings.js'

export default function SessionProgressHUD() {
  const [sessionProgress, setSessionProgress] = useState(null)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const settings = useSettings()

  // Actualizar progreso de sesión
  useEffect(() => {
    const updateProgress = () => {
      if (settings.practiceMode === 'personalized_session' && hasActiveSession()) {
        const progress = getCurrentSessionProgress()
        setSessionProgress(progress)

        if (progress && progress.sessionActive) {
          setTimeElapsed(progress.elapsedMinutes)
        }
      } else {
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

    window.addEventListener('session-progress-update', handleSessionUpdate)

    // Timer para actualizar tiempo transcurrido cada minuto
    const timer = setInterval(() => {
      if (sessionProgress && sessionProgress.sessionActive) {
        setTimeElapsed(prev => prev + 1)
      }
    }, 60000)

    return () => {
      window.removeEventListener('session-progress-update', handleSessionUpdate)
      clearInterval(timer)
    }
  }, [settings.practiceMode, sessionProgress?.sessionActive])

  // No mostrar si no hay sesión activa
  if (!sessionProgress || !sessionProgress.sessionActive) {
    return null
  }

  const {
    currentActivity,
    currentActivityIndex,
    totalActivities,
    progressPercentage,
    plannedDuration,
    completedActivities,
    metrics,
    focusAreas,
    isCompleted
  } = sessionProgress

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
      weak_area_practice: '🎯',
      spaced_review: '🔄',
      new_content: '📚',
      core_focus: '⭐',
      balanced_practice: '⚖️'
    }
    return icons[activityType] || '📝'
  }

  const handleEndSession = () => {
    if (window.confirm('¿Estás seguro de que querés terminar la sesión personalizada?')) {
      // Finalizar sesión y volver a modo normal
      settings.set({
        practiceMode: 'mixed',
        currentSession: null,
        currentActivityIndex: 0,
        sessionStartTime: null
      })

      // Dispatch event para notificar finalización
      window.dispatchEvent(new CustomEvent('session-progress-update', {
        detail: { type: 'session_ended', manual: true }
      }))
    }
  }

  if (isCompleted) {
    return (
      <div className="session-progress-hud completed">
        <div className="hud-header">
          <span className="session-title">🎉 ¡Sesión Completada!</span>
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

  return (
    <div className="session-progress-hud active">
      <div className="hud-header">
        <span className="session-title">
          {getActivityIcon(currentActivity?.type)} Sesión Personalizada
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
            {formatTime(timeElapsed)} / {formatTime(plannedDuration)}
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