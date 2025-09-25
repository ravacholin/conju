import React from 'react'
import './advanced-analytics-panel.css'

export default function AdvancedAnalyticsPanel({ analytics }) {
  if (!analytics) {
    return null
  }

  const { retention, engagement, timeOfDay, mastery } = analytics

  return (
    <section className="dashboard-section advanced-analytics">
      <h2>
        <img src="/icons/chart.png" alt="Analytics" className="section-icon" />
        Analítica avanzada de aprendizaje
      </h2>

      <div className="advanced-grid">
        <div className="advanced-card">
          <h3>Retención</h3>
          <p className="advanced-highlight">Precisión media: {retention?.overallAccuracy ?? 0}%</p>
          {retention?.trend && (
            <p className={`advanced-trend ${retention.trend.delta >= 0 ? 'positive' : 'negative'}`}>
              Tendencia última semana: {retention.trend.delta >= 0 ? '+' : ''}{retention.trend.delta}%
            </p>
          )}
          <div className="advanced-retention-series">
            {Array.isArray(retention?.dailyAccuracy) && retention.dailyAccuracy.slice(-7).map(day => (
              <div key={day.date} className="advanced-retention-item">
                <span>{day.date.slice(5)}</span>
                <strong>{day.accuracy}%</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="advanced-card">
          <h3>Engagement</h3>
          {engagement ? (
            <ul>
              <li>Sesiones/semana: <strong>{engagement.sessionsPerWeek}</strong></li>
              <li>Duración media: <strong>{engagement.averageSessionMinutes} min</strong></li>
              <li>Intentos por sesión: <strong>{engagement.averageAttemptsPerSession}</strong></li>
              <li>Racha actual: <strong>{engagement.currentStreak} días</strong> · Mejor racha: <strong>{engagement.bestStreak}</strong></li>
            </ul>
          ) : (
            <p>No hay datos suficientes aún.</p>
          )}
        </div>

        <div className="advanced-card">
          <h3>Mejores momentos del día</h3>
          <ul>
            {Array.isArray(timeOfDay) && timeOfDay.length > 0
              ? timeOfDay.map(segment => (
                  <li key={segment.key}>
                    <span>{segment.label}</span>
                    <strong>{segment.accuracy}%</strong>
                    <small>{segment.attempts} intentos</small>
                  </li>
                ))
              : <li>No hay datos suficientes todavía.</li>}
          </ul>
        </div>

        <div className="advanced-card">
          <h3>Distribución de dominio</h3>
          {mastery ? (
            <div className="advanced-mastery">
              <div>
                <span>Alto</span>
                <strong>{mastery.high}</strong>
              </div>
              <div>
                <span>Medio</span>
                <strong>{mastery.medium}</strong>
              </div>
              <div>
                <span>Bajo</span>
                <strong>{mastery.low}</strong>
              </div>
            </div>
          ) : (
            <p>Practica un poco más para ver tu progreso detallado.</p>
          )}
        </div>
      </div>
    </section>
  )
}
