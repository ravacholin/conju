import React, { useMemo } from 'react'
import { buildCoachSessionPlan } from './coachSessionPlan.js'

export default function CoachModePanel({ userStats, heatMapData, onStartCoach }) {
  const plan = useMemo(
    () => buildCoachSessionPlan({ userStats, heatMapData }),
    [userStats, heatMapData]
  )

  return (
    <section className="coach-mode-panel" data-testid="coach-mode-panel">
      <div className="section-header">
        <h2>
          <img src="/icons/robot.png" alt="Modo coach" className="section-icon" />
          Modo coach
        </h2>
        <p>{plan.objective}</p>
      </div>

      <div className="weekly-goals-callout">
        <h3>{plan.title}</h3>
        <p>{plan.why}</p>
        <small>Duración estimada: {plan.estimatedMinutes} minutos</small>
      </div>

      <div className="reminder-actions" style={{ marginTop: 10 }}>
        <button
          type="button"
          className="reminder-button"
          onClick={() => onStartCoach?.(plan)}
        >
          Iniciar coach 5 min
        </button>
      </div>
    </section>
  )
}
