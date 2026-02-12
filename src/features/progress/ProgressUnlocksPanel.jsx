import React from 'react'

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function buildUnlocks(userStats = {}) {
  const totalAttempts = Number(userStats?.totalAttempts || 0)
  const streakDays = Number(userStats?.streakDays || 0)
  const mastery = Number(userStats?.totalMastery || 0)

  return [
    {
      id: 'story',
      title: 'Modo Historia',
      description: 'Desbloquea narrativa adaptativa basada en tu progreso.',
      unlocked: totalAttempts >= 15,
      progress: clamp(Math.round((totalAttempts / 15) * 100), 0, 100),
      requirement: `${totalAttempts}/15 intentos totales`
    },
    {
      id: 'timeline',
      title: 'Línea de Tiempo',
      description: 'Recorre hitos y práctica contextual por épocas.',
      unlocked: streakDays >= 3 || mastery >= 60,
      progress: clamp(Math.round(Math.max((streakDays / 3) * 100, (mastery / 60) * 100)), 0, 100),
      requirement: `${streakDays}/3 días de racha o ${Math.round(mastery)}/60 de dominio`
    }
  ]
}

export default function ProgressUnlocksPanel({ userStats, onNavigateToStory, onNavigateToTimeline }) {
  const unlocks = buildUnlocks(userStats)

  const handleNavigate = (id) => {
    if (id === 'story') {
      onNavigateToStory?.()
      return
    }
    if (id === 'timeline') {
      onNavigateToTimeline?.()
    }
  }

  return (
    <section className="progress-unlocks-panel" data-testid="progress-unlocks-panel">
      <div className="section-header">
        <h2>
          <img src="/icons/trophy.png" alt="Desbloqueos" className="section-icon" />
          Desbloqueos de experiencia
        </h2>
        <p>Conecta tu progreso real con recompensas jugables.</p>
      </div>

      <ul className="reminder-list">
        {unlocks.map((unlock) => (
          <li key={unlock.id} className={`reminder-card ${unlock.unlocked ? 'priority-low' : 'priority-medium'}`}>
            <div className="reminder-text">
              <strong>{unlock.title}</strong>
              <div>{unlock.description}</div>
              <small>{unlock.requirement}</small>
              {!unlock.unlocked && (
                <div className="section-placeholder" style={{ marginTop: 8 }}>
                  <span>Progreso: {unlock.progress}%</span>
                </div>
              )}
            </div>
            <div className="reminder-actions">
              <button
                type="button"
                className="reminder-button"
                disabled={!unlock.unlocked}
                onClick={() => handleNavigate(unlock.id)}
              >
                {unlock.unlocked ? 'Abrir ahora' : 'Bloqueado'}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
