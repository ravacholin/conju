import React, { useEffect, useState, useMemo } from 'react'
import { getCurrentUserId } from '../../lib/progress/userManager.js'
import { getAttemptsByUser, getMasteryByUser } from '../../lib/progress/database.js'
import { getErrorIntelligence, getErrorRadarData } from '../../lib/progress/analytics.js'
import { useSettings } from '../../state/settings.js'
import { ERROR_TAGS } from '../../lib/progress/dataModels.js'
import './EnhancedErrorAnalysis.css'

export default function EnhancedErrorAnalysis({ onNavigateToDrill }) {
  const [analysisData, setAnalysisData] = useState({
    errorIntelligence: null,
    emotionalContext: {},
    patterns: [],
    challenges: [],
    timeline: [],
    loading: true
  })
  const [selectedView, setSelectedView] = useState('dashboard') // dashboard, patterns, challenges, forensics
  const [selectedError, setSelectedError] = useState(null)
  const settings = useSettings()

  useEffect(() => {
    loadErrorAnalysisData()
  }, [])

  async function loadErrorAnalysisData() {
    try {
      const uid = getCurrentUserId()
      const [attempts, mastery, errorIntel, errorRadar] = await Promise.all([
        getAttemptsByUser(uid),
        getMasteryByUser(uid),
        getErrorIntelligence(uid),
        getErrorRadarData(uid)
      ])

      // Procesar datos emocionales y contextuales
      const emotionalContext = processEmotionalContext(attempts)
      const patterns = detectErrorPatterns(attempts, mastery)
      const challenges = generateErrorChallenges(attempts, errorRadar)
      const timeline = buildErrorTimeline(attempts)

      setAnalysisData({
        errorIntelligence: errorIntel,
        emotionalContext,
        patterns,
        challenges,
        timeline,
        loading: false
      })
    } catch (error) {
      console.error('Error loading enhanced error analysis:', error)
      setAnalysisData(prev => ({ ...prev, loading: false }))
    }
  }

  function processEmotionalContext(attempts) {
    const recentAttempts = attempts.slice(-200)
    const errorsByEmotionalState = {}
    const errorsByTime = {}
    const errorsByConfidence = { high: 0, medium: 0, low: 0 }
    const errorsByMomentum = { positive: 0, steady: 0, declining: 0 }

    for (const attempt of recentAttempts) {
      if (!attempt.correct && Array.isArray(attempt.errorTags)) {
        // Agrupar por estado emocional
        const flowState = attempt.flowState || 'neutral'
        if (!errorsByEmotionalState[flowState]) {
          errorsByEmotionalState[flowState] = { count: 0, types: {} }
        }
        errorsByEmotionalState[flowState].count++

        // Agrupar por tiempo del día
        const hour = new Date(attempt.createdAt).getHours()
        const timeSlot = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening'
        if (!errorsByTime[timeSlot]) errorsByTime[timeSlot] = 0
        errorsByTime[timeSlot]++

        // Agrupar por confianza
        const confidence = attempt.confidenceOverall || 0.5
        if (confidence > 0.7) errorsByConfidence.high++
        else if (confidence > 0.4) errorsByConfidence.medium++
        else errorsByConfidence.low++

        // Agrupar por momentum
        const momentumType = attempt.momentumType || 'steady_progress'
        if (momentumType.includes('positive') || momentumType.includes('accelerat')) {
          errorsByMomentum.positive++
        } else if (momentumType.includes('declin') || momentumType.includes('struggl')) {
          errorsByMomentum.declining++
        } else {
          errorsByMomentum.steady++
        }

        // Tipos de error por estado emocional
        for (const tag of attempt.errorTags) {
          if (!errorsByEmotionalState[flowState].types[tag]) {
            errorsByEmotionalState[flowState].types[tag] = 0
          }
          errorsByEmotionalState[flowState].types[tag]++
        }
      }
    }

    return {
      byEmotionalState: errorsByEmotionalState,
      byTimeOfDay: errorsByTime,
      byConfidence: errorsByConfidence,
      byMomentum: errorsByMomentum
    }
  }

  function detectErrorPatterns(attempts, mastery) {
    const patterns = []
    const recentAttempts = attempts.slice(-300)

    // Patrón: Errores cuando está cansado/apurado (latencia baja)
    const fastErrors = recentAttempts.filter(a => !a.correct && a.latencyMs < 3000)
    if (fastErrors.length > 10) {
      patterns.push({
        id: 'rushed-errors',
        type: 'behavioral',
        title: 'Errores por Apuro',
        description: `Cometes ${Math.round((fastErrors.length/recentAttempts.filter(a => !a.correct).length) * 100)}% más errores cuando respondes muy rápido`,
        severity: 'medium',
        insight: 'Tomate un respiro antes de responder. La paciencia mejora tu precisión.',
        actionable: true,
        data: { fastErrorCount: fastErrors.length, averageLatency: fastErrors.reduce((sum, a) => sum + a.latencyMs, 0) / fastErrors.length }
      })
    }

    // Patrón: Errores por baja confianza
    const lowConfidenceErrors = recentAttempts.filter(a => !a.correct && (a.confidenceOverall || 0.5) < 0.3)
    if (lowConfidenceErrors.length > 8) {
      patterns.push({
        id: 'confidence-errors',
        type: 'emotional',
        title: 'Errores por Baja Confianza',
        description: `Fallas más cuando tu confianza está baja. ${lowConfidenceErrors.length} errores en estado de baja confianza`,
        severity: 'high',
        insight: 'Trabaja primero en verbos que domines para construir confianza.',
        actionable: true,
        data: { lowConfidenceErrorCount: lowConfidenceErrors.length }
      })
    }

    // Patrón: Persistencia de errores específicos
    const errorTags = recentAttempts
      .filter(a => !a.correct && Array.isArray(a.errorTags))
      .flatMap(a => a.errorTags)
    const tagCounts = {}
    errorTags.forEach(tag => tagCounts[tag] = (tagCounts[tag] || 0) + 1)

    Object.entries(tagCounts).forEach(([tag, count]) => {
      if (count > 15) {
        patterns.push({
          id: `persistent-${tag}`,
          type: 'linguistic',
          title: `Persistencia: ${getErrorTagLabel(tag)}`,
          description: `Este tipo de error se repite constantemente (${count} veces)`,
          severity: 'high',
          insight: 'Necesitas práctica focalizada en este patrón específico.',
          actionable: true,
          data: { errorTag: tag, count, examples: getErrorExamples(recentAttempts, tag) }
        })
      }
    })

    return patterns.sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 }
      return severityOrder[b.severity] - severityOrder[a.severity]
    })
  }

  function generateErrorChallenges(attempts, radarData) {
    const challenges = []
    const recentErrors = attempts.slice(-200).filter(a => !a.correct)

    if (radarData.axes && radarData.axes.length > 0) {
      // Challenge del "Boss Error" - El error más problemático
      const bossError = radarData.axes[0]
      challenges.push({
        id: 'boss-fight',
        type: 'boss',
        title: `🏆 Boss Fight: ${bossError.label}`,
        description: `Tu mayor desafío actual. ${bossError.count} errores recientes.`,
        difficulty: Math.min(5, Math.ceil(bossError.value / 20)),
        reward: '50 XP + Badge "Boss Slayer"',
        progress: 0,
        target: Math.max(10, Math.floor(bossError.count * 0.8)),
        actionable: true,
        errorTag: bossError.tag
      })
    }

    // Challenge de Rescue Mission para leeches
    const errorCounts = {}
    recentErrors.forEach(attempt => {
      if (Array.isArray(attempt.errorTags)) {
        attempt.errorTags.forEach(tag => {
          errorCounts[tag] = (errorCounts[tag] || 0) + 1
        })
      }
    })

    const topErrors = Object.entries(errorCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(1, 4) // Skip the boss error, take next 3

    topErrors.forEach(([tag, count], index) => {
      challenges.push({
        id: `rescue-${tag}`,
        type: 'rescue',
        title: `🚀 Rescue Mission: ${getErrorTagLabel(tag)}`,
        description: `Salva este patrón problemático. ${count} errores detectados.`,
        difficulty: Math.min(3, Math.ceil(count / 8)),
        reward: `${20 + index * 5} XP`,
        progress: 0,
        target: Math.max(5, Math.floor(count * 0.6)),
        actionable: true,
        errorTag: tag
      })
    })

    // Challenge de consistencia
    const last7Days = attempts.filter(a => {
      const daysDiff = (Date.now() - new Date(a.createdAt)) / (1000 * 60 * 60 * 24)
      return daysDiff <= 7
    })
    const dailyAccuracy = calculateDailyAccuracy(last7Days)
    const consistencyScore = calculateConsistencyScore(dailyAccuracy)

    if (consistencyScore < 0.7) {
      challenges.push({
        id: 'consistency-master',
        type: 'consistency',
        title: '📈 Consistency Master',
        description: `Mejora tu consistencia diaria. Puntuación actual: ${Math.round(consistencyScore * 100)}%`,
        difficulty: 2,
        reward: '30 XP + Badge "Steady Progress"',
        progress: consistencyScore,
        target: 0.8,
        actionable: false
      })
    }

    return challenges
  }

  function buildErrorTimeline(attempts) {
    const last30Days = attempts.filter(a => {
      const daysDiff = (Date.now() - new Date(a.createdAt)) / (1000 * 60 * 60 * 24)
      return daysDiff <= 30
    })

    const timeline = []
    const dailyData = {}

    last30Days.forEach(attempt => {
      const date = new Date(attempt.createdAt).toDateString()
      if (!dailyData[date]) {
        dailyData[date] = { total: 0, errors: 0, errorTypes: {}, emotionalState: [] }
      }

      dailyData[date].total++
      if (!attempt.correct) {
        dailyData[date].errors++
        if (Array.isArray(attempt.errorTags)) {
          attempt.errorTags.forEach(tag => {
            dailyData[date].errorTypes[tag] = (dailyData[date].errorTypes[tag] || 0) + 1
          })
        }
      }

      if (attempt.flowState) {
        dailyData[date].emotionalState.push(attempt.flowState)
      }
    })

    Object.entries(dailyData).forEach(([date, data]) => {
      const errorRate = data.total > 0 ? data.errors / data.total : 0
      const dominantEmotion = getMostFrequent(data.emotionalState) || 'neutral'
      const topErrorType = Object.entries(data.errorTypes)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || null

      timeline.push({
        date,
        errorRate,
        errorCount: data.errors,
        totalAttempts: data.total,
        dominantEmotion,
        topErrorType,
        errorTypes: data.errorTypes
      })
    })

    return timeline.sort((a, b) => new Date(a.date) - new Date(b.date))
  }

  async function startTargetedPractice(errorTag, size = 8) {
    try {
      const uid = getCurrentUserId()
      const attempts = await getAttemptsByUser(uid)
      const recent = attempts.slice(-300).filter(a =>
        Array.isArray(a.errorTags) && a.errorTags.includes(errorTag)
      )

      if (recent.length === 0) {
        if (typeof onNavigateToDrill === 'function') onNavigateToDrill()
        return
      }

      const freq = new Map()
      recent.forEach(a => {
        const key = `${a.mood}|${a.tense}`
        freq.set(key, (freq.get(key) || 0) + 1)
      })

      const topCombos = Array.from(freq.entries())
        .sort((a,b) => b[1] - a[1])
        .slice(0, 3)
        .map(([k]) => {
          const [mood, tense] = k.split('|')
          return { mood, tense }
        })

      if (topCombos.length === 0) return

      settings.set({
        practiceMode: 'mixed',
        currentBlock: { combos: topCombos, itemsRemaining: size }
      })

      if (typeof onNavigateToDrill === 'function') {
        onNavigateToDrill()
      } else {
        window.dispatchEvent(new CustomEvent('progress:navigate', {
          detail: { micro: { errorTag, size } }
        }))
      }
    } catch (error) {
      console.error('Error starting targeted practice:', error)
    }
  }

  // Utility functions
  function getErrorTagLabel(tag) {
    const labels = {
      [ERROR_TAGS.ACCENT]: 'Acentuación',
      [ERROR_TAGS.VERBAL_ENDING]: 'Terminaciones',
      [ERROR_TAGS.IRREGULAR_STEM]: 'Raíz Irregular',
      [ERROR_TAGS.WRONG_PERSON]: 'Persona Incorrecta',
      [ERROR_TAGS.WRONG_TENSE]: 'Tiempo Incorrecto',
      [ERROR_TAGS.WRONG_MOOD]: 'Modo Incorrecto',
      [ERROR_TAGS.CLITIC_PRONOUNS]: 'Pronombres Clíticos',
      [ERROR_TAGS.ORTHOGRAPHY_C_QU]: 'Ortografía C/QU',
      [ERROR_TAGS.ORTHOGRAPHY_G_GU]: 'Ortografía G/GU',
      [ERROR_TAGS.ORTHOGRAPHY_Z_C]: 'Ortografía Z/C',
      [ERROR_TAGS.OTHER_VALID_FORM]: 'Otra Forma Válida'
    }
    return labels[tag] || 'Error Desconocido'
  }

  function getErrorExamples(attempts, tag) {
    return attempts
      .filter(a => !a.correct && Array.isArray(a.errorTags) && a.errorTags.includes(tag))
      .slice(-3)
      .map(a => ({
        userAnswer: a.userAnswer,
        correctAnswer: a.correctAnswer,
        context: `${a.mood} ${a.tense}`
      }))
  }

  function getMostFrequent(array) {
    if (!array || array.length === 0) return null
    const counts = {}
    array.forEach(item => counts[item] = (counts[item] || 0) + 1)
    return Object.entries(counts).sort(([,a], [,b]) => b - a)[0]?.[0]
  }

  function calculateDailyAccuracy(attempts) {
    const dailyStats = {}
    attempts.forEach(attempt => {
      const date = new Date(attempt.createdAt).toDateString()
      if (!dailyStats[date]) {
        dailyStats[date] = { total: 0, correct: 0 }
      }
      dailyStats[date].total++
      if (attempt.correct) dailyStats[date].correct++
    })

    return Object.entries(dailyStats).map(([date, stats]) => ({
      date,
      accuracy: stats.total > 0 ? stats.correct / stats.total : 0
    }))
  }

  function calculateConsistencyScore(dailyAccuracy) {
    if (dailyAccuracy.length === 0) return 0
    const accuracies = dailyAccuracy.map(d => d.accuracy)
    const mean = accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length
    const variance = accuracies.reduce((sum, acc) => sum + Math.pow(acc - mean, 2), 0) / accuracies.length
    return Math.max(0, 1 - Math.sqrt(variance))
  }

  if (analysisData.loading) {
    return (
      <div className="enhanced-error-analysis loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Analizando patrones de error...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="enhanced-error-analysis">
      <div className="analysis-header">
        <div className="view-selector">
          <button
            className={`view-btn ${selectedView === 'dashboard' ? 'active' : ''}`}
            onClick={() => setSelectedView('dashboard')}
          >
            🏠 Dashboard
          </button>
          <button
            className={`view-btn ${selectedView === 'patterns' ? 'active' : ''}`}
            onClick={() => setSelectedView('patterns')}
          >
            🧩 Patrones
          </button>
          <button
            className={`view-btn ${selectedView === 'challenges' ? 'active' : ''}`}
            onClick={() => setSelectedView('challenges')}
          >
            🎯 Desafíos
          </button>
          <button
            className={`view-btn ${selectedView === 'forensics' ? 'active' : ''}`}
            onClick={() => setSelectedView('forensics')}
          >
            🔍 Análisis
          </button>
        </div>
      </div>

      <div className="analysis-content">
        {selectedView === 'dashboard' && (
          <DashboardView
            data={analysisData}
            onStartPractice={startTargetedPractice}
          />
        )}
        {selectedView === 'patterns' && (
          <PatternsView
            patterns={analysisData.patterns}
            emotionalContext={analysisData.emotionalContext}
            onStartPractice={startTargetedPractice}
          />
        )}
        {selectedView === 'challenges' && (
          <ChallengesView
            challenges={analysisData.challenges}
            onStartPractice={startTargetedPractice}
          />
        )}
        {selectedView === 'forensics' && (
          <ForensicsView
            timeline={analysisData.timeline}
            onStartPractice={startTargetedPractice}
          />
        )}
      </div>
    </div>
  )
}

// Sub-components
function DashboardView({ data, onStartPractice }) {
  const { emotionalContext, errorIntelligence } = data

  return (
    <div className="dashboard-view">
      <div className="dashboard-grid">
        <div className="dashboard-card emotional-insights">
          <h3>🧠 Insights Emocionales</h3>
          <div className="emotional-stats">
            <div className="stat-row">
              <span>Errores por confianza baja:</span>
              <span className="stat-value">{emotionalContext.byConfidence?.low || 0}</span>
            </div>
            <div className="stat-row">
              <span>Errores con momentum negativo:</span>
              <span className="stat-value">{emotionalContext.byMomentum?.declining || 0}</span>
            </div>
            <div className="stat-row">
              <span>Momento más problemático:</span>
              <span className="stat-value">
                {Object.entries(emotionalContext.byTimeOfDay || {})
                  .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'}
              </span>
            </div>
          </div>
        </div>

        <div className="dashboard-card quick-actions">
          <h3>⚡ Acciones Rápidas</h3>
          <div className="action-buttons">
            <button className="action-btn confidence-boost">
              🎯 Boost de Confianza
            </button>
            <button className="action-btn focused-practice">
              🔥 Práctica Enfocada
            </button>
            <button className="action-btn pattern-breaker">
              💥 Rompe Patrones
            </button>
          </div>
        </div>

        {errorIntelligence?.summary && (
          <div className="dashboard-card error-rate-card">
            <h3>📊 Tasa de Error (7 días)</h3>
            <div className="error-rate-display">
              <div className="rate-number">
                {Math.round((errorIntelligence.summary.errorRate7 || 0) * 100)}%
              </div>
              <div className="rate-trend">
                {errorIntelligence.summary.trend === 'down' ? '📉 Mejorando' :
                 errorIntelligence.summary.trend === 'up' ? '📈 Empeorando' : '➡️ Estable'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function PatternsView({ patterns, emotionalContext, onStartPractice }) {
  return (
    <div className="patterns-view">
      <h2>🧩 Patrones de Error Detectados</h2>
      <div className="patterns-grid">
        {patterns.length === 0 ? (
          <div className="no-patterns">
            <p>🎉 ¡Excelente! No se detectaron patrones problemáticos.</p>
          </div>
        ) : (
          patterns.map(pattern => (
            <div key={pattern.id} className={`pattern-card ${pattern.severity}`}>
              <div className="pattern-header">
                <h3>{pattern.title}</h3>
                <span className={`severity-badge ${pattern.severity}`}>
                  {pattern.severity === 'high' ? '🔴' : pattern.severity === 'medium' ? '🟡' : '🟢'}
                </span>
              </div>
              <p className="pattern-description">{pattern.description}</p>
              <div className="pattern-insight">
                💡 <em>{pattern.insight}</em>
              </div>
              {pattern.actionable && (
                <button
                  className="pattern-action-btn"
                  onClick={() => pattern.data?.errorTag && onStartPractice(pattern.data.errorTag)}
                >
                  Practicar Ahora
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function ChallengesView({ challenges, onStartPractice }) {
  return (
    <div className="challenges-view">
      <h2>🎯 Desafíos de Error</h2>
      <div className="challenges-grid">
        {challenges.map(challenge => (
          <div key={challenge.id} className={`challenge-card ${challenge.type}`}>
            <div className="challenge-header">
              <h3>{challenge.title}</h3>
              <div className="difficulty-stars">
                {Array.from({length: challenge.difficulty}, (_, i) => '⭐').join('')}
              </div>
            </div>
            <p>{challenge.description}</p>
            <div className="challenge-progress">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{width: `${(challenge.progress / challenge.target) * 100}%`}}
                ></div>
              </div>
              <span className="progress-text">
                {Math.round(challenge.progress)} / {challenge.target}
              </span>
            </div>
            <div className="challenge-reward">
              🏆 {challenge.reward}
            </div>
            {challenge.actionable && (
              <button
                className="challenge-btn"
                onClick={() => onStartPractice(challenge.errorTag)}
              >
                ¡Acepto el Desafío!
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function ForensicsView({ timeline, onStartPractice }) {
  return (
    <div className="forensics-view">
      <h2>🔍 Análisis Forense de Errores</h2>
      <div className="timeline-container">
        {timeline.map((day, index) => (
          <div key={day.date} className="timeline-day">
            <div className="timeline-date">
              {new Date(day.date).toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'short'
              })}
            </div>
            <div className={`timeline-content ${day.errorRate > 0.3 ? 'high-error' : ''}`}>
              <div className="error-rate-indicator">
                <div
                  className="error-rate-bar"
                  style={{
                    height: `${Math.max(10, day.errorRate * 100)}px`,
                    backgroundColor: day.errorRate > 0.3 ? '#dc3545' :
                                   day.errorRate > 0.15 ? '#ffc107' : '#28a745'
                  }}
                ></div>
              </div>
              <div className="day-details">
                <div className="error-summary">
                  {Math.round(day.errorRate * 100)}% errores
                  ({day.errorCount}/{day.totalAttempts})
                </div>
                {day.dominantEmotion && (
                  <div className="emotional-state">
                    Estado: {day.dominantEmotion}
                  </div>
                )}
                {day.topErrorType && (
                  <div className="top-error">
                    Principalmente: {day.topErrorType}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}