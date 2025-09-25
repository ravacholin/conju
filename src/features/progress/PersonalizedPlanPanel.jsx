import React from 'react'
import './personalized-plan.css'

function formatWeek(week) {
  if (!week) return null
  return (
    <div key={week.number} className="plan-week">
      <div className="plan-week-header">
        <span className="plan-week-number">Semana {week.number}</span>
        {week.focus && <span className="plan-week-focus">{week.focus}</span>}
      </div>
      {Array.isArray(week.targets) && week.targets.length > 0 && (
        <ul className="plan-week-targets">
          {week.targets.map((target, idx) => (
            <li key={idx}>{`${target?.mood || target?.moodName || ''} ${target?.tense || target?.tenseName || ''}`.trim() || 'Objetivo específico'}</li>
          ))}
        </ul>
      )}
      {week.goal && <p className="plan-week-goal">{week.goal}</p>}
    </div>
  )
}

function renderMicroGoal(goal) {
  return (
    <div key={goal.id || goal.name} className="plan-goal-card">
      <div className="plan-goal-header">
        <h4>{goal.name}</h4>
        {goal.motivationalBonus && (
          <span className="plan-goal-bonus">x{goal.motivationalBonus.toFixed?.(2) || goal.motivationalBonus}</span>
        )}
      </div>
      <p className="plan-goal-description">{goal.description}</p>
      {goal.requirements && (
        <div className="plan-goal-meta">
          {goal.requirements.target && <span>Objetivo: {goal.requirements.target}</span>}
          {goal.requirements.minAttempts && <span>Mín. intentos: {goal.requirements.minAttempts}</span>}
        </div>
      )}
    </div>
  )
}

export default function PersonalizedPlanPanel({ plan, onRefresh }) {
  if (!plan) {
    return (
      <section className="dashboard-section">
        <h2>
          <img src="/icons/map.png" alt="Plan" className="section-icon" />
          Plan de estudio personalizado
        </h2>
        <div className="plan-placeholder">
          <p>Aún no hay suficientes datos para crear un plan personalizado. Practica un poco más y vuelve a intentarlo.</p>
        </div>
      </section>
    )
  }

  const { timeline, overview, microGoals, sessionBlueprints, scheduling, metrics } = plan
  const sessions = Array.isArray(sessionBlueprints?.sessions) ? sessionBlueprints.sessions.slice(0, 3) : []
  const predictedSequence = sessionBlueprints?.predictedSequence?.slice?.(0, 5) || []
  const weeks = Array.isArray(timeline?.weeks) ? timeline.weeks : []
  const planGeneratedAt = new Date(plan.generatedAt || Date.now()).toLocaleString()

  return (
    <section className="dashboard-section personalized-plan">
      <div className="plan-header">
        <h2>
          <img src="/icons/journey.png" alt="Plan" className="section-icon" />
          Plan de estudio personalizado
        </h2>
        <div className="plan-actions">
          <span className="plan-timestamp">Actualizado {planGeneratedAt}</span>
          <button type="button" className="plan-refresh" onClick={onRefresh}>Regenerar</button>
        </div>
      </div>

      <div className="plan-overview">
        <div>
          <h3>Visión general</h3>
          <ul>
            <li><strong>Duración:</strong> {timeline?.durationWeeks || 4} semanas · {timeline?.sessionsPerWeek || 4} sesiones/semana</li>
            <li><strong>Enfoque:</strong> {overview?.focusArea || 'Progreso equilibrado'}</li>
            <li><strong>Estilo:</strong> {overview?.personalizationStyle || 'balanced'}</li>
          </ul>
        </div>
        <div className="plan-overview-metrics">
          <div>
            <span className="metric-label">Confianza</span>
            <span className="metric-value">{Math.round((metrics?.confidence?.overall ?? 0) * 100) / 100}</span>
          </div>
          <div>
            <span className="metric-label">Momentum</span>
            <span className="metric-value">{metrics?.momentum?.momentumScore ?? 0}</span>
          </div>
          <div>
            <span className="metric-label">Precisión objetivo</span>
            <span className="metric-value">{metrics?.analytics?.retention?.overallAccuracy ?? 0}%</span>
          </div>
        </div>
      </div>

      {microGoals?.length > 0 && (
        <div className="plan-goals">
          <h3>Micro-objetivos activos</h3>
          <div className="plan-goals-grid">
            {microGoals.slice(0, 4).map(renderMicroGoal)}
          </div>
        </div>
      )}

      {weeks.length > 0 && (
        <div className="plan-timeline">
          <h3>Cronograma sugerido</h3>
          <div className="plan-weeks">
            {weeks.map(formatWeek)}
          </div>
        </div>
      )}

      <div className="plan-sessions">
        <div className="plan-session-block">
          <h3>Sesiones recomendadas</h3>
          {sessions.length === 0 ? (
            <p>No hay sesiones personalizadas todavía. Mantén tu práctica para desbloquearlas.</p>
          ) : (
            <ul>
              {sessions.map((session, idx) => (
                <li key={session.id || idx}>
                  <strong>{session.title || `Sesión ${idx + 1}`}</strong>
                  {session.description && <p>{session.description}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="plan-session-block">
          <h3>Secuencia prioritaria</h3>
          {predictedSequence.length === 0 ? (
            <p>El sistema necesita más datos para predecir una secuencia óptima.</p>
          ) : (
            <ol>
              {predictedSequence.map((combo, idx) => (
                <li key={`${combo.mood}-${combo.tense}-${idx}`}>
                  {combo.mood} · {combo.tense}
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      <div className="plan-scheduling">
        <h3>Timing sugerido</h3>
        <p>
          {scheduling?.recommendation === 'now' && 'Es un buen momento para practicar ahora.'}
          {scheduling?.recommendation === 'later' && `Mejor practicar en ${scheduling.hoursUntilNextOptimal || 'unas horas'}.`}
          {scheduling?.guidance && <span> {scheduling.guidance}</span>}
        </p>
      </div>
    </section>
  )
}
