import React from 'react'

import './accuracy-trend-card.css'

export default function AccuracyTrendCard({ userStats = {}, errorIntel = null }) {
  const accuracy = Math.round(Number(userStats.accuracy) || 0)
  const totalAttempts = Number(userStats.totalAttempts) || 0
  const attemptsToday = Number(userStats.attemptsToday) || 0
  const masteredCells = Number(userStats.masteredCells) || 0
  const inProgressCells = Number(userStats.inProgressCells) || 0
  const strugglingCells = Number(userStats.strugglingCells) || 0
  const totalCells = masteredCells + inProgressCells + strugglingCells

  const errorRate7 = errorIntel?.summary?.errorRate7
  const trend = errorIntel?.summary?.trend

  const trendLabel = trend === 'down' ? 'Mejorando' : trend === 'up' ? 'Empeorando' : 'Estable'
  const trendClass = trend === 'down' ? 'trend-up' : trend === 'up' ? 'trend-down' : 'trend-stable'

  // Build mastery distribution bar
  const masteredPct = totalCells > 0 ? Math.round((masteredCells / totalCells) * 100) : 0
  const inProgressPct = totalCells > 0 ? Math.round((inProgressCells / totalCells) * 100) : 0
  const strugglingPct = totalCells > 0 ? Math.round((strugglingCells / totalCells) * 100) : 0

  if (totalAttempts === 0) {
    return (
      <section className="accuracy-trend-card">
        <h2 className="accuracy-trend-title">Rendimiento reciente</h2>
        <p className="accuracy-empty">Todavía no hay datos. Empezá a practicar para ver tu progreso.</p>
      </section>
    )
  }

  return (
    <section className="accuracy-trend-card">
      <header className="accuracy-trend-header">
        <h2 className="accuracy-trend-title">Rendimiento reciente</h2>
        {trend && (
          <div className={`trend-chip ${trendClass}`} aria-live="polite">
            <span className="trend-label">{trendLabel}</span>
            {errorRate7 != null && (
              <span className="trend-delta">{Math.round(errorRate7 * 100)}% errores</span>
            )}
          </div>
        )}
      </header>

      <div className="accuracy-trend-summary">
        <div className="summary-item">
          <span className="summary-label">Precisión global</span>
          <strong className="summary-value">{accuracy}%</strong>
        </div>
        <div className="summary-item">
          <span className="summary-label">Hoy</span>
          <strong className="summary-value">{attemptsToday}</strong>
          <span className="summary-sub">intentos</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Total</span>
          <strong className="summary-value">{totalAttempts}</strong>
          <span className="summary-sub">intentos</span>
        </div>
      </div>

      {totalCells > 0 && (
        <div className="mastery-distribution">
          <h3 className="distribution-title">Distribución de dominio</h3>
          <div className="distribution-bar">
            {masteredPct > 0 && (
              <div
                className="distribution-segment distribution-mastered"
                style={{ width: `${masteredPct}%` }}
                title={`Dominados: ${masteredCells}`}
              />
            )}
            {inProgressPct > 0 && (
              <div
                className="distribution-segment distribution-progress"
                style={{ width: `${inProgressPct}%` }}
                title={`En progreso: ${inProgressCells}`}
              />
            )}
            {strugglingPct > 0 && (
              <div
                className="distribution-segment distribution-struggling"
                style={{ width: `${strugglingPct}%` }}
                title={`Necesitan refuerzo: ${strugglingCells}`}
              />
            )}
          </div>
          <div className="distribution-legend">
            <span className="legend-item">
              <span className="legend-dot legend-mastered" />
              Dominados ({masteredCells})
            </span>
            <span className="legend-item">
              <span className="legend-dot legend-progress" />
              En progreso ({inProgressCells})
            </span>
            <span className="legend-item">
              <span className="legend-dot legend-struggling" />
              Refuerzo ({strugglingCells})
            </span>
          </div>
        </div>
      )}
    </section>
  )
}
