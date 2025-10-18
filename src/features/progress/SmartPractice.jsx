import React, { useMemo, useEffect, useState } from 'react'
import { useSettings } from '../../state/settings.js'
import { formatMoodTense } from '../../lib/utils/verbLabels.js'
import { SUPPORTED_HEATMAP_COMBOS, SUPPORTED_HEATMAP_COMBO_SET } from './heatMapConfig.js'
import { mlRecommendationEngine } from '../../lib/progress/mlRecommendations.js'
import { createLogger } from '../../lib/utils/logger.js'

const logger = createLogger('features:SmartPractice')

/**
 * Smart Practice Panel - Intelligent, actionable practice recommendations
 * Focuses on heatmap-based recommendations when no personalized plan is active
 */
export default function SmartPractice({ heatMapData, userStats, onNavigateToDrill }) {
  const settings = useSettings()
  const [mlRecommendations, setMLRecommendations] = useState(null)
  const [loadingML, setLoadingML] = useState(false)

  // Get user-friendly labels for mood/tense combinations
  const getMoodTenseLabel = (mood, tense) => {
    return formatMoodTense(mood, tense)
  }

  // Fetch ML recommendations when component mounts or userStats changes
  useEffect(() => {
    const fetchMLRecommendations = async () => {
      if (!userStats) return

      setLoadingML(true)
      try {
        const sessionPlan = await mlRecommendationEngine.generateSessionRecommendations({
          duration: 20,
          preferredDifficulty: 'medium',
          includeNewContent: true,
          adaptToState: true
        })
        setMLRecommendations(sessionPlan)
        logger.debug('ML recommendations generated', sessionPlan)
      } catch (error) {
        logger.error('Failed to generate ML recommendations', error)
        setMLRecommendations(null)
      } finally {
        setLoadingML(false)
      }
    }

    fetchMLRecommendations()
  }, [userStats])

  // Analyze user data to generate smart recommendations (fallback heuristics)
  const heuristicRecommendations = useMemo(() => {
    const recs = []

    if (!heatMapData?.heatMap || !userStats) {
      // Si no hay datos suficientes, sugerir empezar
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

    const supportedEntries = Object.entries(heatMap).filter(([combo]) =>
      SUPPORTED_HEATMAP_COMBO_SET.has(combo)
    )

    // Find weakest areas (low mastery, high attempts)
    const weakAreas = supportedEntries
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
    const staleCombos = supportedEntries
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
    const unexploredCombos = SUPPORTED_HEATMAP_COMBOS.filter(combo => !heatMap[combo] || heatMap[combo].attempts === 0)

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

  // Combine ML and heuristic recommendations
  const recommendations = useMemo(() => {
    if (loadingML) {
      return heuristicRecommendations // Show heuristics while loading
    }

    if (!mlRecommendations || !mlRecommendations.recommendations || mlRecommendations.recommendations.length === 0) {
      return heuristicRecommendations // Fallback to heuristics
    }

    // Convert ML recommendations to UI format
    const mlRecs = mlRecommendations.recommendations.map((rec) => {
      // Map ML recommendation types to UI format
      const recTypeMap = {
        'confidence_building': {
          title: 'Construir confianza',
          icon: '/diana.png',
          priority: rec.priority || 0.9
        },
        'guided_practice': {
          title: 'Práctica guiada',
          icon: '/openbook.png',
          priority: rec.priority || 0.7
        },
        'challenge_practice': {
          title: 'Desafío avanzado',
          icon: '/icons/robot.png',
          priority: rec.priority || 0.6
        },
        'calibration_practice': {
          title: 'Calibración',
          icon: '/diana.png',
          priority: rec.priority || 0.8
        },
        'timing_adjustment': {
          title: 'Ajuste de timing',
          icon: '/icons/timer.png',
          priority: rec.priority || 0.8
        },
        'timing_optimization': {
          title: 'Momento óptimo',
          icon: '/icons/timer.png',
          priority: rec.priority || 0.7
        },
        'fatigue_management': {
          title: 'Manejo de fatiga',
          icon: '/icons/chart.png',
          priority: rec.priority || 0.9
        },
        'flow_maintenance': {
          title: 'Mantener flow',
          icon: '/icons/robot.png',
          priority: rec.priority || 0.9
        },
        'flow_recovery': {
          title: 'Recuperar flow',
          icon: '/diana.png',
          priority: rec.priority || 0.95
        },
        'flow_support': {
          title: 'Soporte adaptativo',
          icon: '/openbook.png',
          priority: rec.priority || 0.8
        },
        'srs_optimization': {
          title: 'Optimizar SRS',
          icon: '/icons/timer.png',
          priority: rec.priority || 0.6
        },
        'emotional_balance': {
          title: 'Balance emocional',
          icon: '/icons/chart.png',
          priority: rec.priority || 0.7
        }
      }

      const mapping = recTypeMap[rec.type] || {
        title: rec.type?.replace(/_/g, ' ') || 'Recomendación',
        icon: '/icons/robot.png',
        priority: rec.priority || 0.5
      }

      return {
        type: rec.type,
        title: mapping.title,
        description: rec.message,
        action: 'Practicar',
        priority: mapping.priority >= 0.8 ? 'high' : mapping.priority >= 0.6 ? 'medium' : 'low',
        icon: mapping.icon,
        targetMood: rec.targetAreas?.[0],
        targetTense: rec.targetAreas?.[1],
        confidence: Math.round((rec.weightedPriority || rec.priority || 0.5) * 100),
        mlPowered: true,
        reason: rec.suggestedApproach
      }
    })

    // Mix ML recommendations with top heuristic ones
    const combinedRecs = [...mlRecs.slice(0, 2), ...heuristicRecommendations.slice(0, 1)]
    return combinedRecs.slice(0, 3)
  }, [mlRecommendations, heuristicRecommendations, loadingML])

  // Handle recommendation click
  const handleRecommendationClick = (rec) => {
    if (!onNavigateToDrill) return

    let settingsUpdate = {}

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
    // For now, return null since we're streamlining the interface
    // If error insights are needed, they'll be integrated into recommendations
    return null
  }, [userStats])

  const GET_ERROR_TYPE_LABEL = (type) => {
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
    <div className="smart-practice" data-testid="enhanced-error-analysis">
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
            className={`recommendation-card priority-${rec.priority} ${rec.mlPowered ? 'ml-powered' : ''}`}
            onClick={() => handleRecommendationClick(rec)}
          >
            <div className="rec-header">
              <img src={rec.icon} alt={rec.title} className="rec-icon" />
              <div className="rec-content">
                <div className="rec-title-row">
                  <h3>{rec.title}</h3>
                  {rec.mlPowered && (
                    <span className="ml-badge" title="Recomendación ML">
                      <img src="/icons/robot.png" alt="ML" className="ml-badge-icon" />
                    </span>
                  )}
                </div>
                <p>{rec.description}</p>
                {rec.reason && (
                  <p className="rec-reason">Enfoque: {rec.reason.replace(/_/g, ' ')}</p>
                )}
              </div>
            </div>

            <div className="rec-footer">
              {rec.mastery !== undefined && (
                <div className="rec-meta">
                  Dominio actual: {Math.round(rec.mastery * 100)}%
                </div>
              )}
              {rec.confidence !== undefined && rec.mlPowered && (
                <div className="rec-meta confidence">
                  Confianza: {rec.confidence}%
                </div>
              )}
              {rec.planProgress && (
                <div className="rec-meta">
                  {rec.planProgress} • {rec.estimatedDuration}
                </div>
              )}
              <button className="rec-action">
                {rec.action} →
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ML Metrics Display */}
      {mlRecommendations && mlRecommendations.metrics && (
        <div className="ml-metrics">
          <h4>Estado del sistema ML:</h4>
          <div className="metrics-grid">
            <div className="metric-item">
              <span className="metric-label">Nivel de confianza:</span>
              <span className="metric-value">{mlRecommendations.metrics.confidenceLevel || 'N/A'}</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Estado de flow:</span>
              <span className="metric-value">{mlRecommendations.metrics.flowState || 'N/A'}</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Timing óptimo:</span>
              <span className="metric-value">{mlRecommendations.metrics.optimalTiming ? 'Sí' : 'No'}</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Probabilidad de éxito:</span>
              <span className="metric-value">{Math.round((mlRecommendations.metrics.predictedSuccess || 0) * 100)}%</span>
            </div>
          </div>
        </div>
      )}

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
