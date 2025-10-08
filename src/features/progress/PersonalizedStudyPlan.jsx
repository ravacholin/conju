import React, { useMemo } from 'react'
import router from '../../lib/routing/Router.js'

function formatFocusArea(focusArea) {
  if (!focusArea) {
    return 'Seguimos recopilando datos para tu plan personalizado.'
  }
  return focusArea
}

function formatTargets(targets) {
  if (!Array.isArray(targets) || targets.length === 0) {
    return ['Objetivos dinámicos según tu progreso']
  }

  return targets.map((target, index) => {
    if (!target) {
      return `Objetivo ${index + 1}`
    }

    if (typeof target === 'string') {
      return target
    }

    if (target.mood && target.tense) {
      return `${target.mood} · ${target.tense}`
    }

    if (target.name) {
      return target.name
    }

    if (target.description) {
      return target.description
    }

    return `Objetivo ${index + 1}`
  })
}

function formatGoal(goal, index) {
  if (!goal) {
    return {
      title: `Meta ${index + 1}`,
      description: 'Seguiremos ajustándola a medida que practiques.'
    }
  }

  const title = goal.name || goal.title || `Meta ${index + 1}`
  const description = goal.description || goal.summary || goal.message || 'Objetivo adaptable a tu avance.'

  let progressDisplay = null
  const progress = goal.progress || {}

  if (typeof progress.percentage === 'number') {
    progressDisplay = `${Math.round(progress.percentage)}% completado`
  } else if (typeof progress.currentAccuracy === 'number') {
    progressDisplay = `${Math.round(progress.currentAccuracy * 100)}% precisión`
  } else if (typeof progress.currentStreak === 'number') {
    progressDisplay = `${progress.currentStreak} de racha`
  }

  return {
    title,
    description,
    progress: progressDisplay
  }
}

function determineSuggestedMode(session) {
  const type = session?.type?.toLowerCase?.() || ''
  const approach = session?.suggestedApproach?.toLowerCase?.() || ''

  if (type.includes('learn') || type.includes('lesson') || approach.includes('learn')) {
    return 'learning'
  }

  if (type.includes('exploration') || type.includes('guided')) {
    return 'learning'
  }

  return 'drill'
}

export default function PersonalizedStudyPlan({ plan }) {
  const timeline = plan?.timeline || {}
  const weeks = Array.isArray(timeline.weeks) ? timeline.weeks : []
  const microGoals = Array.isArray(plan?.microGoals) ? plan.microGoals : []
  const sessions = Array.isArray(plan?.sessionBlueprints?.sessions)
    ? plan.sessionBlueprints.sessions
    : []
  const predictedSequence = Array.isArray(plan?.sessionBlueprints?.predictedSequence)
    ? plan.sessionBlueprints.predictedSequence
    : []

  const durationLabel = useMemo(() => {
    if (typeof timeline.durationWeeks === 'number') {
      const value = timeline.durationWeeks
      const suffix = value === 1 ? 'semana' : 'semanas'
      return `${value} ${suffix}`
    }
    if (typeof timeline.durationWeeks === 'string') {
      return timeline.durationWeeks
    }
    return '4 semanas'
  }, [timeline.durationWeeks])

  const nextSession = sessions[0]

  const suggestedMode = useMemo(() => determineSuggestedMode(nextSession), [nextSession])

  const handleStartSuggestedSession = () => {
    router.navigate({ mode: suggestedMode })
  }

  const handleStartLearningSession = () => {
    router.navigate({ mode: 'learning' })
  }

  if (!plan) {
    return (
      <div className="personalized-plan empty-state">
        <h3>Plan personalizado en preparación</h3>
        <p>Estamos analizando tu progreso reciente para crear recomendaciones específicas.</p>
      </div>
    )
  }

  return (
    <div className="personalized-plan">
      <div className="plan-header">
        <div>
          <h2>
            <img src="/icons/target.png" alt="Enfoque" className="section-icon" />
            Enfoque sugerido
          </h2>
          <p>{formatFocusArea(plan?.overview?.focusArea)}</p>
        </div>

        <div className="plan-cta">
          <button className="cta-button primary" onClick={handleStartSuggestedSession}>
            {suggestedMode === 'learning' ? 'Abrir sesión guiada' : 'Iniciar práctica sugerida'}
          </button>
          {suggestedMode !== 'learning' && (
            <button className="cta-button secondary" onClick={handleStartLearningSession}>
              Revisar módulo de aprendizaje
            </button>
          )}
        </div>
      </div>

      <div className="plan-content">
        <div className="plan-timeline">
          <div className="timeline-summary">
            <h3>Calendario semanal</h3>
            <div className="timeline-meta">
              <span>{durationLabel}</span>
              <span>{timeline.sessionsPerWeek || 4} sesiones/sem</span>
              <span>{timeline.sessionLength || '15-20 minutos'}</span>
            </div>
          </div>

          <div className="timeline-weeks">
            {weeks.length === 0 ? (
              <div className="timeline-placeholder">
                Tu calendario se ajustará automáticamente cuando registremos más sesiones.
              </div>
            ) : (
              weeks.map(week => (
                <div key={week.number || week.focus} className="week-card">
                  <div className="week-header">
                    <span className="week-number">Semana {week.number || '?'}</span>
                    <span className="week-focus">{week.focus || 'Práctica focalizada'}</span>
                  </div>
                  <p className="week-goal">{week.goal || 'Meta adaptable a tu progreso actual.'}</p>
                  <ul className="week-targets">
                    {formatTargets(week.targets).map((target, index) => (
                      <li key={`${week.number || index}-${target}`}>{target}</li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="plan-micro-goals">
          <h3>Micro-metas activas</h3>
          {microGoals.length === 0 ? (
            <p className="micro-goals-empty">Tus micro-metas aparecerán aquí cuando haya suficientes datos.</p>
          ) : (
            <ul className="micro-goals-list">
              {microGoals.map((goal, index) => {
                const formatted = formatGoal(goal, index)
                return (
                  <li key={goal?.id || index} className="micro-goal-card">
                    <div className="micro-goal-header">
                      <span className="micro-goal-index">#{index + 1}</span>
                      <h4>{formatted.title}</h4>
                    </div>
                    <p className="micro-goal-description">{formatted.description}</p>
                    {formatted.progress && (
                      <span className="micro-goal-progress">{formatted.progress}</span>
                    )}
                  </li>
                )
              })}
            </ul>
          )}

          {predictedSequence.length > 0 && (
            <div className="predicted-sequence">
              <h4>Siguiente secuencia sugerida</h4>
              <div className="sequence-tags">
                {predictedSequence.slice(0, 6).map((item, index) => {
                  if (!item) return null
                  const label = typeof item === 'string'
                    ? item
                    : [item.mood, item.tense].filter(Boolean).join(' · ') || item.label || `Paso ${index + 1}`

                  return (
                    <span key={`${label}-${index}`} className="sequence-tag">
                      {label}
                    </span>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

