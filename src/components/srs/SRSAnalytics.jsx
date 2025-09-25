import React, { useEffect, useState, useMemo } from 'react'
import { getCurrentUserId } from '../../lib/progress/userManager.js'
import { getAttemptsByUser, getDueSchedules } from '../../lib/progress/database.js'
import './SRSAnalytics.css'

export default function SRSAnalytics({ compact = false }) {
  const [data, setData] = useState({
    attempts: [],
    schedules: [],
    loading: true
  })

  useEffect(() => {
    loadAnalyticsData()
  }, [])

  const loadAnalyticsData = async () => {
    try {
      setData(prev => ({ ...prev, loading: true }))
      const userId = getCurrentUserId()
      if (!userId) return

      const [attempts, schedules] = await Promise.all([
        getAttemptsByUser(userId),
        getDueSchedules(userId, new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) // próximos 30 días
      ])

      setData({
        attempts,
        schedules,
        loading: false
      })
    } catch (error) {
      console.error('Error loading SRS analytics:', error)
      setData(prev => ({ ...prev, loading: false }))
    }
  }

  const analytics = useMemo(() => {
    if (data.loading || !data.attempts.length) return null

    const now = new Date()
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000)

    // Filtrar intentos recientes
    const recentAttempts = data.attempts.filter(a => new Date(a.createdAt) >= thirtyDaysAgo)
    const weeklyAttempts = data.attempts.filter(a => new Date(a.createdAt) >= sevenDaysAgo)

    // Calcular métricas de velocidad de aprendizaje
    const dailyStats = {}
    recentAttempts.forEach(attempt => {
      const date = new Date(attempt.createdAt).toDateString()
      if (!dailyStats[date]) {
        dailyStats[date] = { correct: 0, total: 0, totalTime: 0 }
      }
      dailyStats[date].total++
      if (attempt.correct) dailyStats[date].correct++
      if (attempt.metadata?.latencyMs) {
        dailyStats[date].totalTime += attempt.metadata.latencyMs
      }
    })

    // Calcular velocidad de aprendizaje (items correctos por día)
    const learningVelocity = Object.values(dailyStats).reduce((sum, day) => sum + day.correct, 0) / Math.max(Object.keys(dailyStats).length, 1)

    // Calcular precisión promedio
    const totalCorrect = recentAttempts.filter(a => a.correct).length
    const averageAccuracy = recentAttempts.length > 0 ? (totalCorrect / recentAttempts.length) * 100 : 0

    // Calcular tiempo de respuesta promedio
    const attemptsWithTime = recentAttempts.filter(a => a.metadata?.latencyMs)
    const averageResponseTime = attemptsWithTime.length > 0
      ? attemptsWithTime.reduce((sum, a) => sum + a.metadata.latencyMs, 0) / attemptsWithTime.length
      : 0

    // Tendencias (comparar última semana con la anterior)
    const lastWeekAttempts = recentAttempts.filter(a => {
      const date = new Date(a.createdAt)
      return date >= sevenDaysAgo && date <= now
    })

    const prevWeekAttempts = recentAttempts.filter(a => {
      const date = new Date(a.createdAt)
      const twoWeeksAgo = new Date(now - 14 * 24 * 60 * 60 * 1000)
      return date >= twoWeeksAgo && date < sevenDaysAgo
    })

    const accuracyTrend = lastWeekAttempts.length > 0 && prevWeekAttempts.length > 0
      ? ((lastWeekAttempts.filter(a => a.correct).length / lastWeekAttempts.length) -
         (prevWeekAttempts.filter(a => a.correct).length / prevWeekAttempts.length)) * 100
      : 0

    // Distribución de intervalos SRS
    const intervalDistribution = {}
    data.schedules.forEach(schedule => {
      const interval = schedule.interval || 0
      const bucket = interval < 1 ? '<1d' :
                    interval < 7 ? '1-6d' :
                    interval < 30 ? '1-4w' :
                    interval < 90 ? '1-3m' : '3m+'
      intervalDistribution[bucket] = (intervalDistribution[bucket] || 0) + 1
    })

    return {
      learningVelocity: Math.round(learningVelocity * 10) / 10,
      averageAccuracy: Math.round(averageAccuracy),
      averageResponseTime: Math.round(averageResponseTime / 1000 * 10) / 10,
      accuracyTrend: Math.round(accuracyTrend * 10) / 10,
      totalReviews: recentAttempts.length,
      weeklyReviews: weeklyAttempts.length,
      intervalDistribution,
      dailyStats
    }
  }, [data])

  if (data.loading) {
    return (
      <div className="srs-analytics loading">
        <div className="spinner small"></div>
        <p>Analizando patrones de aprendizaje...</p>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="srs-analytics empty">
        <div className="empty-icon">📊</div>
        <p>Necesitas más repasos para generar estadísticas</p>
      </div>
    )
  }

  const getTrendIcon = (trend) => {
    if (trend > 5) return '📈'
    if (trend < -5) return '📉'
    return '➡️'
  }

  const getTrendColor = (trend) => {
    if (trend > 0) return 'positive'
    if (trend < 0) return 'negative'
    return 'neutral'
  }

  if (compact) {
    return (
      <div className="srs-analytics compact">
        <div className="analytics-header">
          <h5>📊 Rendimiento (30 días)</h5>
        </div>
        <div className="metrics-row">
          <div className="metric-item">
            <span className="metric-value">{analytics.learningVelocity}</span>
            <span className="metric-label">Items/día</span>
          </div>
          <div className="metric-item">
            <span className="metric-value">{analytics.averageAccuracy}%</span>
            <span className="metric-label">Precisión</span>
          </div>
          <div className="metric-item">
            <span className="metric-value">{analytics.averageResponseTime}s</span>
            <span className="metric-label">Tiempo resp.</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="srs-analytics full">
      <div className="analytics-header">
        <h4>
          <img src="/icons/chart.png" alt="Análisis" className="section-icon" />
          Análisis de Rendimiento SRS
        </h4>
        <p className="analytics-subtitle">Insights de tus últimos 30 días de repaso</p>
      </div>

      <div className="analytics-grid">
        <div className="analytics-card velocity">
          <div className="card-header">
            <h5>Velocidad de Aprendizaje</h5>
            <div className="card-icon">🚀</div>
          </div>
          <div className="card-content">
            <div className="primary-metric">
              <span className="value">{analytics.learningVelocity}</span>
              <span className="unit">items correctos/día</span>
            </div>
            <div className="supporting-metrics">
              <div className="supporting-metric">
                <span className="label">Esta semana</span>
                <span className="value">{analytics.weeklyReviews} reviews</span>
              </div>
              <div className="supporting-metric">
                <span className="label">Total 30 días</span>
                <span className="value">{analytics.totalReviews} reviews</span>
              </div>
            </div>
          </div>
        </div>

        <div className="analytics-card accuracy">
          <div className="card-header">
            <h5>Precisión</h5>
            <div className="card-icon">🎯</div>
          </div>
          <div className="card-content">
            <div className="primary-metric">
              <span className="value">{analytics.averageAccuracy}%</span>
              <span className="unit">promedio</span>
            </div>
            <div className="trend-indicator">
              <span className={`trend ${getTrendColor(analytics.accuracyTrend)}`}>
                {getTrendIcon(analytics.accuracyTrend)} {Math.abs(analytics.accuracyTrend).toFixed(1)}%
              </span>
              <span className="trend-label">vs semana anterior</span>
            </div>
          </div>
        </div>

        <div className="analytics-card speed">
          <div className="card-header">
            <h5>Velocidad de Respuesta</h5>
            <div className="card-icon">⚡</div>
          </div>
          <div className="card-content">
            <div className="primary-metric">
              <span className="value">{analytics.averageResponseTime}</span>
              <span className="unit">segundos</span>
            </div>
            <div className="speed-assessment">
              {analytics.averageResponseTime < 3
                ? <span className="assessment good">🔥 Muy rápido</span>
                : analytics.averageResponseTime < 5
                ? <span className="assessment okay">👍 Bien</span>
                : <span className="assessment slow">🐢 Se puede mejorar</span>
              }
            </div>
          </div>
        </div>

        <div className="analytics-card intervals">
          <div className="card-header">
            <h5>Distribución de Intervalos</h5>
            <div className="card-icon">📅</div>
          </div>
          <div className="card-content">
            <div className="intervals-chart">
              {Object.entries(analytics.intervalDistribution).map(([interval, count]) => {
                const percentage = (count / data.schedules.length) * 100
                return (
                  <div key={interval} className="interval-bar">
                    <div className="interval-label">{interval}</div>
                    <div className="interval-progress">
                      <div
                        className="interval-fill"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <div className="interval-count">{count}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="learning-insights">
        <h5>💡 Insights Personalizados</h5>
        <div className="insights-list">
          {analytics.learningVelocity > 5 && (
            <div className="insight positive">
              <span className="insight-icon">🚀</span>
              <span className="insight-text">
                ¡Excelente ritmo! Estás aprendiendo {analytics.learningVelocity} items por día.
              </span>
            </div>
          )}

          {analytics.averageAccuracy > 85 && (
            <div className="insight positive">
              <span className="insight-icon">🎯</span>
              <span className="insight-text">
                Tu precisión de {analytics.averageAccuracy}% es impresionante. Mantén el buen trabajo.
              </span>
            </div>
          )}

          {analytics.accuracyTrend > 10 && (
            <div className="insight positive">
              <span className="insight-icon">📈</span>
              <span className="insight-text">
                ¡Gran mejora! Tu precisión ha aumentado {analytics.accuracyTrend.toFixed(1)}% esta semana.
              </span>
            </div>
          )}

          {analytics.averageResponseTime > 6 && (
            <div className="insight suggestion">
              <span className="insight-icon">⚡</span>
              <span className="insight-text">
                Intenta responder más rápido. Tiempos menores a 5 segundos indican mayor fluidez.
              </span>
            </div>
          )}

          {analytics.weeklyReviews < 20 && analytics.totalReviews > 50 && (
            <div className="insight suggestion">
              <span className="insight-icon">📅</span>
              <span className="insight-text">
                Considera aumentar la frecuencia de repaso para mantener el progreso.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}