import React from 'react'
import './community-pulse.css'

export default function CommunityPulse({ snapshot }) {
  if (!snapshot) {
    return null
  }

  const { communityGoal, leaderboard, communitySize, userMetrics } = snapshot
  const progressAttempts = Math.min(1, (communityGoal?.progress?.attempts || 0) / (communityGoal?.target?.attempts || 1))
  const progressXp = Math.min(1, (communityGoal?.progress?.xp || 0) / (communityGoal?.target?.xp || 1))

  return (
    <section className="dashboard-section community-pulse">
      <h2>
        <img src="/icons/trophy.png" alt="Comunidad" className="section-icon" />
        Pulso de la comunidad
      </h2>

      <div className="community-summary">
        <div>
          <span className="community-label">Participantes estimados</span>
          <strong>{communitySize?.toLocaleString?.() || 0}</strong>
        </div>
        <div>
          <span className="community-label">Tu contribución hoy</span>
          <strong>{userMetrics?.lastContribution || 0} pts</strong>
        </div>
      </div>

      <div className="community-goal">
        <h3>Meta comunitaria</h3>
        <div className="community-progress">
          <span>Intentos</span>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${Math.round(progressAttempts * 100)}%` }}></div>
          </div>
          <span>{communityGoal?.progress?.attempts || 0} / {communityGoal?.target?.attempts || 0}</span>
        </div>
        <div className="community-progress">
          <span>XP</span>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${Math.round(progressXp * 100)}%` }}></div>
          </div>
          <span>{communityGoal?.progress?.xp || 0} / {communityGoal?.target?.xp || 0}</span>
        </div>
      </div>

      <div className="community-leaderboard">
        <h3>Leaderboard del día</h3>
        <ol>
          {Array.isArray(leaderboard) && leaderboard.map((entry, index) => (
            <li key={entry.alias} className={entry.alias === (snapshot.userAlias || 'Tú') ? 'current-user' : ''}>
              <span className="community-rank">#{index + 1}</span>
              <div className="community-player">
                <strong>{entry.alias}</strong>
                <span>{entry.xp} XP · racha {entry.streak}</span>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
