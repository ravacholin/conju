import React from 'react'

import './accuracy-trend-card.css'

const DEFAULT_STATS = {
  averageAccuracy: 0,
  recentAttempts: []
}

const clampAccuracy = (value) => {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) {
    return null
  }
  return Math.max(0, Math.min(100, numeric))
}

const formatAverageAccuracy = (value) => {
  const clamped = clampAccuracy(value)
  if (!Number.isFinite(clamped) || clamped <= 0) {
    return '0%'
  }
  const rounded = Math.round(clamped * 10) / 10
  return `${Number.isInteger(rounded) ? Math.round(rounded) : rounded}%`
}

const formatAttemptAccuracy = (value) => {
  const clamped = clampAccuracy(value)
  if (!Number.isFinite(clamped)) {
    return '—'
  }
  const rounded = Math.round(clamped * 10) / 10
  return `${Number.isInteger(rounded) ? Math.round(rounded) : rounded}%`
}

const getAttemptAccuracy = (attempt) => {
  if (!attempt || typeof attempt !== 'object') {
    return null
  }
  if (Number.isFinite(attempt.accuracy)) {
    return clampAccuracy(attempt.accuracy)
  }
  if (Number.isFinite(attempt.score)) {
    return clampAccuracy(attempt.score)
  }
  if (typeof attempt.correct === 'boolean') {
    return attempt.correct ? 100 : 0
  }
  return null
}

const formatTimestamp = (isoString) => {
  if (!isoString) {
    return 'Reciente'
  }
  try {
    const date = new Date(isoString)
    if (Number.isNaN(date.getTime())) {
      return 'Reciente'
    }
    return date.toLocaleString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: 'short'
    })
  } catch (error) {
    return 'Reciente'
  }
}

const calculateTrend = (recentAttempts) => {
  const values = Array.isArray(recentAttempts)
    ? recentAttempts.map(getAttemptAccuracy).filter(value => Number.isFinite(value))
    : []

  if (values.length < 2) {
    return { direction: 'stable', label: 'Estable', delta: 0 }
  }

  const pivot = Math.max(1, Math.floor(values.length / 2))
  const recentSlice = values.slice(0, pivot)
  const previousSlice = values.slice(pivot)

  if (previousSlice.length === 0) {
    return { direction: 'stable', label: 'Estable', delta: 0 }
  }

  const average = (numbers) => numbers.reduce((sum, number) => sum + number, 0) / numbers.length
  const delta = average(recentSlice) - average(previousSlice)
  const roundedDelta = Math.round(delta * 10) / 10

  if (Math.abs(roundedDelta) <= 1) {
    return { direction: 'stable', label: 'Estable', delta: roundedDelta }
  }

  if (roundedDelta > 0) {
    return { direction: 'up', label: 'Mejora', delta: roundedDelta }
  }

  return { direction: 'down', label: 'Descenso', delta: roundedDelta }
}

const formatTrendDelta = (trend) => {
  if (!trend || trend.direction === 'stable') {
    return null
  }
  const delta = Number(trend.delta)
  if (!Number.isFinite(delta) || delta === 0) {
    return null
  }
  const rounded = Math.round(Math.abs(delta) * 10) / 10
  const value = rounded % 1 === 0 ? Math.round(rounded) : rounded
  const prefix = delta > 0 ? '+' : '-'
  return `${prefix}${value} pts`
}

export default function AccuracyTrendCard({ stats = DEFAULT_STATS }) {
  const mergedStats = {
    ...DEFAULT_STATS,
    ...(stats && typeof stats === 'object' ? stats : {})
  }

  const attempts = Array.isArray(mergedStats.recentAttempts)
    ? mergedStats.recentAttempts.slice(0, 6)
    : []

  const trend = calculateTrend(mergedStats.recentAttempts)
  const trendDelta = formatTrendDelta(trend)

  return (
    <section className="accuracy-trend-card">
      <header className="accuracy-trend-header">
        <div>
          <h2 className="accuracy-trend-title">Tendencia de precisión</h2>
          <p className="accuracy-trend-subtitle">
            Seguimiento de tus últimos intentos y cómo evoluciona tu exactitud.
          </p>
        </div>
        <div className={`trend-chip trend-${trend.direction}`} aria-live="polite">
          <span className="trend-label">{trend.label}</span>
          {trendDelta && <span className="trend-delta">{trendDelta}</span>}
        </div>
      </header>

      <div className="accuracy-trend-summary">
        <div className="summary-item">
          <span className="summary-label">Exactitud media</span>
          <strong className="summary-value">{formatAverageAccuracy(mergedStats.averageAccuracy)}</strong>
        </div>
        <div className="summary-item">
          <span className="summary-label">Intentos analizados</span>
          <strong className="summary-value">{attempts.length}</strong>
        </div>
      </div>

      <div>
        {attempts.length === 0 ? (
          <p className="accuracy-empty">Todavía no registramos intentos recientes.</p>
        ) : (
          <ul className="attempt-list">
            {attempts.map((attempt, index) => {
              const key = attempt?.id || `${attempt?.target || 'attempt'}-${index}`
              const accuracy = formatAttemptAccuracy(getAttemptAccuracy(attempt))
              const status = attempt?.correct ? 'correct' : 'incorrect'
              const statusSymbol = status === 'correct' ? '✓' : '✕'
              return (
                <li key={key} className="attempt-row">
                  <span className={`attempt-status ${status}`}>{statusSymbol}</span>
                  <div className="attempt-text">
                    <span className="attempt-target">{attempt?.target || 'Objetivo desconocido'}</span>
                    <span className="attempt-recognized">{attempt?.recognized || '—'}</span>
                  </div>
                  <div className="attempt-metrics">
                    <span className="attempt-accuracy">{accuracy}</span>
                    <span className="attempt-time">{formatTimestamp(attempt?.createdAt)}</span>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}
