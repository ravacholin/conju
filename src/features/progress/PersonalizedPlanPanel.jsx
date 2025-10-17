import React, { useState, useEffect, useCallback } from 'react'
import { useSettings } from '../../state/settings.js'
import SessionCard from './SessionCard.jsx'
import {
  getActivePlan,
  initializePlan,
  markSessionAsStarted,
  getSessionStatus,
  getPlanProgress,
  invalidateActivePlan
} from '../../lib/progress/planTracking.js'
import './personalized-plan.css'
import { createLogger } from '../../lib/utils/logger.js'

const logger = createLogger('features:PersonalizedPlanPanel')


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

export default function PersonalizedPlanPanel({ plan, onRefresh, onNavigateToDrill }) {
  const settings = useSettings()
  const [activePlan, setActivePlan] = useState(null)
  const [planProgress, setPlanProgress] = useState({ completed: 0, total: 0, percentage: 0 })

  // Inicializar plan activo cuando se genera un nuevo plan
  useEffect(() => {
    if (plan && plan.sessionBlueprints?.sessions?.length > 0) {
      const currentActive = getActivePlan()

      // Si no hay plan activo o el plan cambió, inicializar nuevo
      if (!currentActive || currentActive.generatedAt !== plan.generatedAt) {
        const initialized = initializePlan(plan)
        if (initialized) {
          setActivePlan(initialized)
          updateProgress()
        }
      } else {
        setActivePlan(currentActive)
        updateProgress()
      }
    }
  }, [plan])

  // Actualizar progreso del plan
  const updateProgress = useCallback(() => {
    const progress = getPlanProgress()
    setPlanProgress(progress)
    setActivePlan(progress.activePlan)
  }, [])

  // Escuchar eventos de actualización del plan
  useEffect(() => {
    const handlePlanUpdate = () => {
      updateProgress()
    }

    window.addEventListener('progress:plan-updated', handlePlanUpdate)
    return () => window.removeEventListener('progress:plan-updated', handlePlanUpdate)
  }, [updateProgress])

  // Lanzar sesión
  const handleLaunchSession = useCallback((session) => {
    if (!session.drillConfig) {
      logger.warn('Session does not have drillConfig:', session)
      return
    }

    // Marcar sesión como iniciada
    markSessionAsStarted(session.id)

    // Configurar settings para el drill
    const drillConfig = {
      ...session.drillConfig,
      // Guardar referencia a la sesión activa para tracking
      activeSessionId: session.id,
      activePlanId: activePlan?.planId
    }

    settings.set(drillConfig)

    // Navegar al drill
    if (onNavigateToDrill) {
      onNavigateToDrill()
    }
  }, [settings, onNavigateToDrill, activePlan])

  // Regenerar plan
  const handleRefresh = useCallback(() => {
    // Invalidar plan activo
    invalidateActivePlan()

    // Llamar al refresh del componente padre
    if (onRefresh) {
      onRefresh()
    }
  }, [onRefresh])

  if (!plan) {
    return (
      <section className="dashboard-section">
        <h2>
          <img src="/icons/books.png" alt="Plan" className="section-icon" />
          Plan de estudio personalizado
        </h2>
        <div className="plan-placeholder">
          <p>Aún no hay suficientes datos para crear un plan personalizado. Practica un poco más y vuelve a intentarlo.</p>
        </div>
      </section>
    )
  }

  const { timeline, overview, microGoals, sessionBlueprints, scheduling, metrics } = plan
  const sessions = Array.isArray(sessionBlueprints?.sessions) ? sessionBlueprints.sessions : []
  const weeks = Array.isArray(timeline?.weeks) ? timeline.weeks : []
  const planGeneratedAt = new Date(plan.generatedAt || Date.now()).toLocaleString()

  return (
    <section className="dashboard-section personalized-plan">
      <div className="plan-header">
        <div className="plan-header-main">
          <h2>
            <img src="/icons/map.png" alt="Plan" className="section-icon" />
            Plan de estudio personalizado
          </h2>
          {planProgress.total > 0 && (
            <div className="plan-progress-compact">
              <span className="plan-progress-text">
                {planProgress.completed} de {planProgress.total} sesiones
              </span>
              <div className="plan-progress-bar-compact">
                <div
                  className="plan-progress-fill-compact"
                  style={{ width: `${planProgress.percentage}%` }}
                />
              </div>
            </div>
          )}
        </div>
        <div className="plan-actions">
          <span className="plan-timestamp">Actualizado {planGeneratedAt}</span>
          <button type="button" className="plan-refresh" onClick={handleRefresh}>
            <img src="/icons/refresh.png" alt="" />
            Regenerar
          </button>
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

      {/* Sesiones ejecutables */}
      {sessions.length > 0 && (
        <div className="plan-sessions-executable">
          <h3>
            <img src="/icons/calendar.png" alt="" className="inline-icon" />
            Sesiones recomendadas
          </h3>
          <div className="plan-sessions-grid">
            {sessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                status={getSessionStatus(session.id)}
                onLaunch={handleLaunchSession}
              />
            ))}
          </div>
        </div>
      )}

      {microGoals?.length > 0 && (
        <div className="plan-goals">
          <h3>
            <img src="/icons/trophy.png" alt="" className="inline-icon" />
            Micro-objetivos activos
          </h3>
          <div className="plan-goals-grid">
            {microGoals.slice(0, 4).map(renderMicroGoal)}
          </div>
        </div>
      )}

      {weeks.length > 0 && (
        <div className="plan-timeline">
          <h3>
            <img src="/icons/calendar.png" alt="" className="inline-icon" />
            Cronograma sugerido
          </h3>
          <div className="plan-weeks">
            {weeks.map(formatWeek)}
          </div>
        </div>
      )}

      <div className="plan-scheduling">
        <h3>
          <img src="/icons/timer.png" alt="" className="inline-icon" />
          Timing sugerido
        </h3>
        <p>
          {scheduling?.recommendation === 'now' && 'Es un buen momento para practicar ahora.'}
          {scheduling?.recommendation === 'later' && `Mejor practicar en ${scheduling.hoursUntilNextOptimal || 'unas horas'}.`}
          {scheduling?.guidance && <span> {scheduling.guidance}</span>}
        </p>
      </div>
    </section>
  )
}
