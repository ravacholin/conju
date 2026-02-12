import React, { useEffect, useMemo, useState } from 'react'
import { readChecklistState, writeChecklistState } from './dailyPlanChecklist.js'

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
  const [checklist, setChecklist] = useState({})

  const sessions = useMemo(() => {
    const raw = studyPlan?.sessionBlueprints?.sessions
    if (!Array.isArray(raw)) return []
    return raw.slice(0, 3)
  }, [studyPlan])

  const scheduling = studyPlan?.scheduling || null
  const nextOptimal = scheduling?.nextOptimalTime
    ? new Date(scheduling.nextOptimalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null
  const completedCount = sessions.filter((session) => checklist[session.id]).length

  useEffect(() => {
    setChecklist(readChecklistState())
  }, [studyPlan])

  useEffect(() => {
    writeChecklistState(checklist)
  }, [checklist])

  const toggleSessionDone = (sessionId) => {
    if (!sessionId) return
    setChecklist((prev) => ({
      ...prev,
      [sessionId]: !prev[sessionId]
    }))
  }

  return (
    <section className="daily-plan-panel" data-testid="daily-plan-panel">
      <div className="section-header">
        <h2>
          <img src="/icons/sparks.png" alt="Plan diario" className="section-icon" />
          Plan del día
        </h2>
        <p>
          Sesiones accionables para hoy, con el porqué de cada una.
          {nextOptimal ? ` Próxima franja óptima: ${nextOptimal}.` : ''}{' '}
          {sessions.length > 0 ? `Checklist: ${completedCount}/${sessions.length}.` : ''}
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
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <input
                    type="checkbox"
                    checked={!!checklist[session.id]}
                    onChange={() => toggleSessionDone(session.id)}
                  />
                  Hecha
                </label>
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
