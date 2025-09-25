import React from 'react'

const formatDateLabel = (isoDate) => {
  if (!isoDate) return 'Hoy'
  try {
    const date = new Date(isoDate)
    return date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })
  } catch {
    return 'Hoy'
  }
}

export default function DailyChallengesPanel({ dailyChallenges, onCompleteChallenge }) {
  const challenges = dailyChallenges?.challenges || []
  const metrics = dailyChallenges?.metrics || {}
  const dateLabel = formatDateLabel(dailyChallenges?.date)

  const summary = [
    { label: 'Intentos hoy', value: metrics.attemptsToday ?? 0 },
    {
      label: 'Precisión',
      value: Number.isFinite(metrics.accuracyToday)
        ? `${Math.round(metrics.accuracyToday)}%`
        : '—'
    },
    { label: 'Mejor racha', value: metrics.bestStreakToday ?? 0 },
    { label: 'Min enfocado', value: metrics.focusMinutesToday ?? 0 }
  ]

  return (
    <section className="dashboard-section">
      <h2>
        <img src="/icons/calendar.png" alt="Retos" className="section-icon" />
        Retos diarios · {dateLabel}
      </h2>

      <div className="daily-challenges-summary">
        {summary.map((item) => (
          <div key={item.label} className="summary-pill">
            <span className="summary-label">{item.label}</span>
            <span className="summary-value">{item.value}</span>
          </div>
        ))}
      </div>

      <div className="daily-challenges-list">
        {challenges.length === 0 && (
          <div className="empty-state">
            <img src="/icons/robot.png" alt="Sin retos" className="empty-icon" />
            <p className="empty-title">Sin datos de retos todavía</p>
            <p className="empty-description">Completa una sesión para generar métricas del día.</p>
          </div>
        )}

        {challenges.map((challenge) => {
          const progress = challenge.progress || { percentage: 0, label: '' }
          const isCompleted = challenge.status === 'completed'
          const canClaim = !isCompleted && challenge.requirementMet
          const rewardLabel = buildRewardLabel(challenge.reward)

          return (
            <article
              key={challenge.id}
              className={`challenge-card${isCompleted ? ' completed' : ''}${canClaim ? ' ready' : ''}`}
            >
              <header className="challenge-card-header">
                {challenge.icon && (
                  <img src={challenge.icon} alt="Icono reto" className="challenge-icon" />
                )}
                <div>
                  <h3>{challenge.title}</h3>
                  <p>{challenge.description}</p>
                </div>
              </header>

              <div className="challenge-progress">
                <div className="progress-bar">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${progress.percentage || 0}%` }}
                  />
                </div>
                <span className="progress-label">{progress.label}</span>
              </div>

              <footer className="challenge-footer">
                {rewardLabel && <span className="challenge-reward"> {rewardLabel}</span>}
                {isCompleted ? (
                  <span className="challenge-status completed">Completado</span>
                ) : canClaim ? (
                  <button
                    type="button"
                    className="challenge-action"
                    onClick={() => onCompleteChallenge?.(challenge.id)}
                  >
                    Reclamar
                  </button>
                ) : (
                  <span className="challenge-status in-progress">En progreso</span>
                )}
              </footer>
            </article>
          )
        })}
      </div>
    </section>
  )
}

function buildRewardLabel(reward) {
  if (!reward) return ''
  if (reward.type === 'xp') {
    return `+${reward.value} XP`
  }
  if (reward.type === 'booster') {
    return 'Impulso de precisión'
  }
  if (reward.type === 'streak') {
    return `Protección de racha (${reward.value})`
  }
  if (reward.type === 'token') {
    return `Token diario x${reward.value}`
  }
  return ''
}
