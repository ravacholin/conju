import React, { useMemo } from 'react'

const TYPE_REASON = {
  focus_weakness: 'Porque ataca tu punto más débil actual.',
  maintain_mastery: 'Porque refuerza lo que ya mejoraste para no perder nivel.',
  mixed_practice: 'Porque equilibra repaso y contenido nuevo.',
  review: 'Porque tenés repaso pendiente en SRS.',
  predicted: 'Porque es la siguiente combinación óptima para tu progreso.'
}

function resolveReason(session) {
  if (!session) return 'Porque hoy conviene mantener continuidad.'
  if (session.description) return session.description
  return TYPE_REASON[session.type] || 'Porque hoy conviene mantener continuidad.'
}

export default function DailyPlanPanel({ studyPlan, onStartSession }) {
  const sessions = useMemo(() => {
    const raw = studyPlan?.sessionBlueprints?.sessions
    if (!Array.isArray(raw)) return []
    return raw.slice(0, 3)
  }, [studyPlan])

  const scheduling = studyPlan?.scheduling || null
  const nextOptimal = scheduling?.nextOptimalTime
    ? new Date(scheduling.nextOptimalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <section className="daily-plan-panel" data-testid="daily-plan-panel">
      <div className="section-header">
        <h2>
          <img src="/icons/sparks.png" alt="Plan diario" className="section-icon" />
          Plan del día
        </h2>
        <p>
          Sesiones accionables para hoy, con el porqué de cada una.
          {nextOptimal ? ` Próxima franja óptima: ${nextOptimal}.` : ''}
        </p>
      </div>

      {sessions.length === 0 ? (
        <div className="section-placeholder">
          <span>Aún no hay un plan personalizado listo. Practicá una sesión y volvemos a calcularlo.</span>
        </div>
      ) : (
        <ul className="reminder-list">
          {sessions.map((session) => (
            <li key={session.id || session.title} className="reminder-card priority-medium">
              <div className="reminder-text">
                <strong>{session.title || 'Sesión recomendada'}</strong>
                <div>{resolveReason(session)}</div>
                <small>
                  {session.estimatedDuration || '20 min'} · {session.difficulty || 'Medio'}
                </small>
              </div>
              <div className="reminder-actions">
                <button
                  type="button"
                  className="reminder-button"
                  onClick={() => onStartSession?.(session)}
                >
                  Empezar sesión
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
