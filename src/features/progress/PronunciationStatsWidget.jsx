import React from 'react'

const DEFAULT_STATS = {
  totalAttempts: 0,
  successRate: 0,
  averageAccuracy: 0,
  averagePedagogicalScore: 0,
  averageConfidence: 0,
  recentAttempts: []
}

const formatPercent = (value) => {
  if (!Number.isFinite(value) || value <= 0) return '0%'
  const rounded = Math.round(value * 10) / 10
  return `${rounded % 1 === 0 ? Math.round(rounded) : rounded}%`
}

const formatScore = (value) => {
  if (!Number.isFinite(value) || value <= 0) return '—'
  const rounded = Math.round(value * 10) / 10
  return rounded % 1 === 0 ? Math.round(rounded) : rounded
}

const formatTiming = (timingMs) => {
  if (!Number.isFinite(timingMs) || timingMs <= 0) {
    return '—'
  }
  if (timingMs >= 1000) {
    const seconds = Math.round((timingMs / 1000) * 10) / 10
    return `${seconds}s`
  }
  return `${Math.round(timingMs)}ms`
}

const formatTimestamp = (isoString) => {
  if (!isoString) return 'Reciente'
  try {
    const date = new Date(isoString)
    if (Number.isNaN(date.getTime())) return 'Reciente'
    return date.toLocaleString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: 'short'
    })
  } catch {
    return 'Reciente'
  }
}

export default function PronunciationStatsWidget({ stats = DEFAULT_STATS, onNavigateToDrill }) {
  const mergedStats = {
    ...DEFAULT_STATS,
    ...(stats && typeof stats === 'object' ? stats : {})
  }

  const recentAttempts = Array.isArray(mergedStats.recentAttempts)
    ? mergedStats.recentAttempts.slice(0, 5)
    : []

  return (
    <div className="pronunciation-widget">
      <div className="pronunciation-header">
        <div>
          <h2>Pronunciación</h2>
          <p className="pronunciation-subtitle">
            Seguimiento en vivo de tu precisión y progreso oral.
          </p>
        </div>
        {typeof onNavigateToDrill === 'function' && (
          <button
            type="button"
            className="pronunciation-practice-btn"
            onClick={onNavigateToDrill}
          >
            Practicar ahora
          </button>
        )}
      </div>

      <div className="pronunciation-summary">
        <div className="pronunciation-card">
          <span className="pronunciation-card-label">Intentos</span>
          <strong className="pronunciation-card-value">{mergedStats.totalAttempts}</strong>
        </div>
        <div className="pronunciation-card">
          <span className="pronunciation-card-label">Precisión</span>
          <strong className="pronunciation-card-value">{formatPercent(mergedStats.successRate)}</strong>
        </div>
        <div className="pronunciation-card">
          <span className="pronunciation-card-label">Exactitud media</span>
          <strong className="pronunciation-card-value">{formatScore(mergedStats.averageAccuracy)}</strong>
        </div>
        <div className="pronunciation-card">
          <span className="pronunciation-card-label">Confianza media</span>
          <strong className="pronunciation-card-value">{formatScore(mergedStats.averageConfidence)}</strong>
        </div>
      </div>

      <div className="pronunciation-history">
        <h3>Últimos intentos</h3>
        {recentAttempts.length === 0 ? (
          <p className="pronunciation-empty">Todavía no registramos intentos de pronunciación.</p>
        ) : (
          <ul>
            {recentAttempts.map((attempt, index) => {
              const key = attempt.id || `${attempt.target || 'attempt'}-${index}`
              const correct = Boolean(attempt.correct)
              return (
                <li key={key} className={correct ? 'attempt-correct' : 'attempt-incorrect'}>
                  <div className="attempt-summary">
                    <span className="attempt-target">{attempt.target || 'Objetivo desconocido'}</span>
                    <span className="attempt-recognized">{attempt.recognized || '—'}</span>
                  </div>
                  <div className="attempt-metrics">
                    <span>{formatTimestamp(attempt.createdAt)}</span>
                    <span>Exactitud {formatScore(attempt.accuracy)}</span>
                    <span>Conf. {formatScore(attempt.confidence)}</span>
                    <span>{formatTiming(attempt.timingMs)}</span>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
