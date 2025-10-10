import React from 'react'
import './session-card.css'

/**
 * SessionCard - Componente para mostrar sesiones ejecutables del plan
 * Diseño minimalista oscuro sin gradientes ni emojis
 */
export default function SessionCard({ session, status = 'pending', onLaunch, progress = null }) {
  const isPending = status === 'pending'
  const isInProgress = status === 'in-progress'
  const isCompleted = status === 'completed'

  const handleClick = () => {
    if (isCompleted) return // No permitir relanzar sesiones completadas
    if (onLaunch) onLaunch(session)
  }

  return (
    <div
      className={`session-card ${status}`}
      onClick={handleClick}
      role="button"
      tabIndex={isCompleted ? -1 : 0}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !isCompleted) {
          e.preventDefault()
          handleClick()
        }
      }}
    >
      <div className="session-icon">
        <img src={session.icon} alt="" />
      </div>

      <div className="session-content">
        <h4 className="session-title">{session.title}</h4>
        <p className="session-description">{session.description}</p>
        <div className="session-meta">
          <span className="session-duration">{session.estimatedDuration}</span>
          <span className="session-separator">·</span>
          <span className="session-difficulty">{session.difficulty}</span>
          {session.targetAttempts && (
            <>
              <span className="session-separator">·</span>
              <span className="session-attempts">{session.targetAttempts} ejercicios</span>
            </>
          )}
        </div>

        {/* Barra de progreso si está en progreso */}
        {isInProgress && progress && (
          <div className="session-progress-bar">
            <div
              className="session-progress-fill"
              style={{ width: `${progress.percentage || 0}%` }}
            />
          </div>
        )}
      </div>

      {/* Botón de acción */}
      <div className="session-action">
        {isPending && (
          <button
            className="session-launch-btn"
            onClick={(e) => {
              e.stopPropagation()
              handleClick()
            }}
            aria-label={`Iniciar ${session.title}`}
          >
            <img src="/play.png" alt="Iniciar" />
          </button>
        )}

        {isInProgress && (
          <button
            className="session-launch-btn in-progress"
            onClick={(e) => {
              e.stopPropagation()
              handleClick()
            }}
            aria-label={`Continuar ${session.title}`}
          >
            <img src="/play.png" alt="Continuar" />
          </button>
        )}

        {isCompleted && (
          <div className="session-completed-badge">
            <img src="/icons/trophy.png" alt="Completado" />
          </div>
        )}
      </div>
    </div>
  )
}
