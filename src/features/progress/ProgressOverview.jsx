import React from 'react'
import AccountButton from '../../components/auth/AccountButton.jsx'
import { useSettings } from '../../state/settings.js'

/**
 * Progress Overview - Clean header with essential stats and navigation
 * Replaces: ProgressHeader, ProgressTracker, WeeklyGoalsPanel
 */
export default function ProgressOverview({
  userStats,
  onNavigateHome,
  onNavigateToDrill,
  _syncing,
  _onSync,
  _syncEnabled,
  _onRefresh
}) {
  const settings = useSettings()
  const stats = userStats || {}
  const streak = stats.streakDays || 0
  const masteryLevel = stats.overallMastery || 0
  const itemsDue = stats.itemsDue || 0
  const totalAttempts = stats.totalAttempts || 0

  const getDominanceLevel = (userLevel, masteryScore) => {
    // Primary level is user's CEFR level
    const cefrLevel = userLevel || 'A1'

    // Get CEFR level colors and descriptions
    const cefrInfo = {
      'A1': { label: 'A1 - Principiante', color: '#4a5568', description: 'Nivel básico inicial' },
      'A2': { label: 'A2 - Elemental', color: '#2d3748', description: 'Nivel básico consolidado' },
      'B1': { label: 'B1 - Intermedio', color: '#2a69ac', description: 'Nivel intermedio' },
      'B2': { label: 'B2 - Intermedio alto', color: '#1a365d', description: 'Nivel intermedio avanzado' },
      'C1': { label: 'C1 - Avanzado', color: '#744210', description: 'Nivel avanzado' },
      'C2': { label: 'C2 - Superior', color: '#553c0e', description: 'Nivel de dominio nativo' }
    }

    const baseInfo = cefrInfo[cefrLevel] || cefrInfo['A1']

    // Add mastery qualifier based on performance within level
    let qualifier = ''
    if (masteryScore >= 0.85) {
      qualifier = ' (Sólido)'
    } else if (masteryScore >= 0.7) {
      qualifier = ' (En progreso)'
    } else if (masteryScore >= 0.4) {
      qualifier = ' (Inicial)'
    } else if (totalAttempts >= 10) {
      qualifier = ' (En desarrollo)'
    }

    return {
      level: baseInfo.label + qualifier,
      color: baseInfo.color,
      description: baseInfo.description
    }
  }

  const masteryInfo = getDominanceLevel(settings.userLevel, masteryLevel)

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
              <img src="/back.png" alt="Volver" className="nav-icon" />
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