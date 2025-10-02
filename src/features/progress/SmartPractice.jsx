import React, { useMemo } from 'react'
import { useSettings } from '../../state/settings.js'

/**
 * Smart Practice Panel - Intelligent, actionable practice recommendations
 * Replaces: 8 error components + 2 recommendation systems
 */
export default function SmartPractice({ heatMapData, userStats, onNavigateToDrill }) {
  const settings = useSettings()

  // Get user-friendly labels for mood/tense combinations
  const getMoodTenseLabel = (mood, tense) => {
    const labels = {
      'indicative-pres': 'Presente de Indicativo',
      'indicative-pretIndef': 'Pretérito Indefinido',
      'indicative-impf': 'Pretérito Imperfecto',
      'indicative-fut': 'Futuro Simple',
      'indicative-pretPerf': 'Pretérito Perfecto',
      'subjunctive-subjPres': 'Presente de Subjuntivo',
      'subjunctive-subjImpf': 'Imperfecto de Subjuntivo',
      'conditional-cond': 'Condicional Simple',
      'imperative-imper': 'Imperativo'
    }
    return labels[`${mood}-${tense}`] || `${mood} - ${tense}`
  }

  // Analyze user data to generate smart recommendations
  const recommendations = useMemo(() => {
    const recs = []

    if (!heatMapData?.heatMap || !userStats) {
      return [{
        type: 'get-started',
        title: 'Comenzar a practicar',
        description: 'Inicia tu primer ejercicio para generar recomendaciones personalizadas',
        action: 'Empezar',
        priority: 'high',
        icon: '/play.png'
      }]
    }

    const heatMap = heatMapData.heatMap
    const stats = userStats

    // Find weakest areas (low mastery, high attempts)
    const weakAreas = Object.entries(heatMap)
      .filter(([, data]) => data.attempts >= 3 && data.mastery < 0.6)
      .sort((a, b) => a[1].mastery - b[1].mastery)
      .slice(0, 3)

    if (weakAreas.length > 0) {
      const [combo] = weakAreas[0]
      const [mood, tense] = combo.split('-')
      recs.push({
        type: 'focus-weakness',
        title: 'Reforzar área débil',
        description: `Mejorar dominio en ${getMoodTenseLabel(mood, tense)}`,
        action: 'Practicar',
        priority: 'high',
        icon: '/diana.png',
        targetMood: mood,
        targetTense: tense,
        mastery: weakAreas[0][1].mastery
      })
    }

    // Find areas with no recent practice
    const staleCombos = Object.entries(heatMap)
      .filter(([, data]) => data.attempts > 0 && data.mastery >= 0.7)
      .filter(([, data]) => {
        const daysSinceLastAttempt = (Date.now() - data.lastAttempt) / (1000 * 60 * 60 * 24)
        return daysSinceLastAttempt > 7
      })
      .slice(0, 2)

    if (staleCombos.length > 0) {
      const [combo] = staleCombos[0]
      const [mood, tense] = combo.split('-')
      recs.push({
        type: 'maintain-mastery',
        title: 'Mantener dominio',
        description: `Repasar ${getMoodTenseLabel(mood, tense)} para mantener nivel alto`,
        action: 'Repasar',
        priority: 'medium',
        icon: '/icons/timer.png',
        targetMood: mood,
        targetTense: tense
      })
    }

    // Find completely new areas
    const allCombos = [
      'indicative-pres', 'indicative-pretIndef', 'indicative-impf', 'indicative-fut',
      'subjunctive-subjPres', 'subjunctive-subjImpf',
      'conditional-cond', 'imperative-imper'
    ]

    const unexploredCombos = allCombos.filter(combo => !heatMap[combo] || heatMap[combo].attempts === 0)

    if (unexploredCombos.length > 0) {
      const nextCombo = unexploredCombos[0]
      const [mood, tense] = nextCombo.split('-')
      recs.push({
        type: 'explore-new',
        title: 'Explorar nuevo tiempo',
        description: `Aprender ${getMoodTenseLabel(mood, tense)}`,
        action: 'Explorar',
        priority: 'low',
        icon: '/openbook.png',
        targetMood: mood,
        targetTense: tense
      })
    }

    // Mixed practice recommendation
    if (Object.keys(heatMap).length >= 3) {
      recs.push({
        type: 'mixed-practice',
        title: 'Práctica variada',
        description: 'Ejercicios mezclados para reforzar todo tu conocimiento',
        action: 'Practicar',
        priority: 'medium',
        icon: '/dice.png'
      })
    }

    return recs.slice(0, 3) // Max 3 recommendations
  }, [heatMapData, userStats, getMoodTenseLabel])

  // Handle recommendation click
  const handleRecommendationClick = (rec) => {
    if (!onNavigateToDrill) return

    const settingsUpdate = {}

    switch (rec.type) {
      case 'focus-weakness':
      case 'maintain-mastery':
      case 'explore-new':
        settingsUpdate.practiceMode = 'specific'
        settingsUpdate.specificMood = rec.targetMood
        settingsUpdate.specificTense = rec.targetTense
        break
      case 'mixed-practice':
        settingsUpdate.practiceMode = 'mixed'
        break
      case 'get-started':
        settingsUpdate.practiceMode = 'mixed'
        break
      default:
        settingsUpdate.practiceMode = 'mixed'
    }

    settings.set(settingsUpdate)
    onNavigateToDrill()
  }

  // Get error insights if available
  const errorInsights = useMemo(() => {
    try {
      // For now, return null since we're streamlining the interface
      // If error insights are needed, they'll be integrated into recommendations
      return null
    } catch (e) {
      console.warn('Error getting error stats:', e)
      return null
    }
  }, [userStats])

  const getErrorTypeLabel = (type) => {
    const labels = {
      'stem_change': 'Cambios de raíz',
      'orthographic': 'Cambios ortográficos',
      'irregular': 'Formas irregulares',
      'accent': 'Acentuación',
      'conjugation': 'Terminaciones',
      'person': 'Persona/número',
      'mood': 'Modo verbal',
      'tense': 'Tiempo verbal'
    }
    return labels[type] || type
  }

  return (
    <div className="smart-practice">
      <div className="section-header">
        <h2>
          <img src="/icons/robot.png" alt="Práctica Inteligente" className="section-icon" />
          Práctica Inteligente
        </h2>
        <p>Recomendaciones personalizadas basadas en tu progreso</p>
      </div>

      {/* Main recommendations */}
      <div className="recommendations-grid">
        {recommendations.map((rec, index) => (
          <div
            key={index}
            className={`recommendation-card priority-${rec.priority}`}
            onClick={() => handleRecommendationClick(rec)}
          >
            <div className="rec-header">
              <img src={rec.icon} alt={rec.title} className="rec-icon" />
              <div className="rec-content">
                <h3>{rec.title}</h3>
                <p>{rec.description}</p>
              </div>
            </div>

            <div className="rec-footer">
              {rec.mastery !== undefined && (
                <div className="rec-meta">
                  Dominio actual: {Math.round(rec.mastery * 100)}%
                </div>
              )}
              <button className="rec-action">
                {rec.action} →
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Error insights if available */}
      {errorInsights && errorInsights.length > 0 && (
        <div className="error-insights">
          <h3>
            <img src="/radar.png" alt="Patrones de Error" className="inline-icon" />
            Patrones de Error Frecuentes
          </h3>
          <div className="error-summary">
            {errorInsights.map((error, index) => (
              <div key={index} className="error-item">
                <span className="error-label">{error.label}</span>
                <span className="error-count">{error.count} {error.count === 1 ? 'error' : 'errores'}</span>
              </div>
            ))}
          </div>
          <p className="error-hint">
            Las recomendaciones arriba consideran estos patrones para ayudarte a mejorar.
          </p>
        </div>
      )}
    </div>
  )
}