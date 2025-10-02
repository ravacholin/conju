import React from 'react'
import AccountButton from '../../components/auth/AccountButton.jsx'

/**
 * Progress Overview - Clean header with essential stats and navigation
 * Replaces: ProgressHeader, ProgressTracker, WeeklyGoalsPanel
 */
export default function ProgressOverview({
  userStats,
  onNavigateHome,
  onNavigateToDrill,
  syncing,
  onSync,
  syncEnabled,
  onRefresh
}) {
  const stats = userStats || {}
  const streak = stats.streakDays || 0
  const masteryLevel = stats.overallMastery || 0
  const itemsDue = stats.itemsDue || 0
  const totalAttempts = stats.totalAttempts || 0

  const getMasteryLevel = (mastery) => {
    if (mastery >= 0.8) return { level: 'Avanzado', color: 'var(--mastery-high)' }
    if (mastery >= 0.6) return { level: 'Intermedio', color: 'var(--mastery-medium)' }
    if (mastery >= 0.3) return { level: 'Básico', color: 'var(--mastery-low)' }
    return { level: 'Principiante', color: 'var(--mastery-no-data)' }
  }

  const masteryInfo = getMasteryLevel(masteryLevel)

  return (
    <div className="progress-overview">
      {/* Header with navigation */}
      <div className="overview-header">
        <div className="nav-actions">
          <div className="nav-left">
            <button
              className="nav-btn"
              onClick={() => window.history.back()}
              title="Volver atrás"
            >
              <img src="/icons/back.png" alt="Volver" className="nav-icon" />
            </button>

            <button
              className="nav-btn"
              onClick={onNavigateHome}
              title="Inicio"
            >
              <img src="/home.png" alt="Inicio" className="nav-icon" />
            </button>

            <button
              className="nav-btn logo-btn"
              onClick={onNavigateToDrill}
              title="Practicar"
            >
              <img src="/verbosmain.png" alt="Practicar" className="nav-icon logo-icon" />
            </button>
          </div>

          <div className="header-actions">
            <AccountButton />
          </div>
        </div>

        <h1>Progreso</h1>
        <p>Tu avance en el dominio de los verbos españoles</p>
      </div>

      {/* Key stats */}
      <div className="overview-stats">
        <div className="stat-card primary-action" onClick={onNavigateToDrill}>
          <div className="stat-icon">
            <img src="/play.png" alt="Practicar" className="section-icon" />
          </div>
          <div className="stat-content">
            <div className="stat-value highlight">
              {itemsDue > 0 ? itemsDue : 'Todo al día'}
            </div>
            <div className="stat-label">
              {itemsDue > 0 ? 'Elementos por repasar' : 'Listo para practicar'}
            </div>
          </div>
          <div className="stat-arrow">→</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <img src="/crono.png" alt="Racha" className="section-icon" />
          </div>
          <div className="stat-content">
            <div className="stat-value">{streak}</div>
            <div className="stat-label">Días de racha</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <img src="/icons/brain.png" alt="Nivel" className="section-icon" />
          </div>
          <div className="stat-content">
            <div
              className="stat-value"
              style={{ color: masteryInfo.color }}
            >
              {masteryInfo.level}
            </div>
            <div className="stat-label">Nivel de dominio</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <img src="/icons/chart.png" alt="Total" className="section-icon" />
          </div>
          <div className="stat-content">
            <div className="stat-value">{totalAttempts}</div>
            <div className="stat-label">Ejercicios completados</div>
          </div>
        </div>
      </div>
    </div>
  )
}