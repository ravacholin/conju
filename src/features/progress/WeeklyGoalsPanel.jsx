import React from 'react'

export default function WeeklyGoalsPanel({ weeklyGoals = {}, weeklyProgress = {}, userStats = {} }) {
  return (
    <section className="dashboard-section">
      <h2>
        <img src="/icons/trophy.png" alt="Objetivos" className="section-icon" />
        Objetivos Semanales
      </h2>
      <div className="weekly-goals">
        <div className="goal-card">
          <h3>Celdas a mejorar</h3>
          <p className="goal-value">
            {(weeklyProgress.cellsToImprove || 0)} / {(weeklyGoals.CELLS_TO_IMPROVE || 3)}
          </p>
        </div>
        <div className="goal-card">
          <h3>Puntaje mínimo</h3>
          <p className="goal-value">
            {(userStats.totalMastery || 0)}% / {(weeklyGoals.MIN_SCORE || 75)}%
          </p>
        </div>
        <div className="goal-card">
          <h3>Sesiones</h3>
          <p className="goal-value">
            {(weeklyProgress.sessionsCompleted || 0)} / {(weeklyGoals.SESSIONS || 5)}
          </p>
        </div>
      </div>
    </section>
  )
}
