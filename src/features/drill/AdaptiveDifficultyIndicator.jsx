import { useState, useEffect } from 'react'
import { getAdaptiveEngine } from '../../lib/progress/AdaptiveDifficultyEngine.js'
import { FLOW_STATES } from '../../lib/progress/flowStateDetection.js'
import './adaptive-difficulty-indicator.css'

/**
 * AdaptiveDifficultyIndicator - Muestra el estado de flow y dificultad adaptativa
 *
 * Diseño minimalista que muestra:
 * - Estado de flow actual del usuario
 * - Nivel de dificultad ajustado (-2 a +2)
 * - Mensaje motivacional basado en el estado
 *
 * Se actualiza automáticamente cuando el adaptive engine cambia la dificultad
 */
export default function AdaptiveDifficultyIndicator({ compact = false }) {
  const [flowState, setFlowState] = useState(FLOW_STATES.NEUTRAL)
  const [difficultyBoost, setDifficultyBoost] = useState(0)
  const [lastAdjustment, setLastAdjustment] = useState(null)
  const [showAdjustment, setShowAdjustment] = useState(false)

  useEffect(() => {
    // Escuchar eventos de cambio de dificultad
    const handleDifficultyChange = (event) => {
      const { boost, adjustment } = event.detail
      setDifficultyBoost(boost)
      setLastAdjustment(adjustment)
      setShowAdjustment(true)

      // Ocultar mensaje de ajuste después de 3 segundos
      setTimeout(() => setShowAdjustment(false), 3000)
    }

    window.addEventListener('adaptive-difficulty-changed', handleDifficultyChange)

    // Obtener estado inicial
    try {
      const engine = getAdaptiveEngine()
      const stats = engine.getSessionStats()
      setFlowState(stats.flowState)
      setDifficultyBoost(stats.currentBoost)
    } catch (error) {
      // Engine not available, use defaults
    }

    return () => {
      window.removeEventListener('adaptive-difficulty-changed', handleDifficultyChange)
    }
  }, [])

  // Mapeo de estados de flow a descripciones y colores
  const flowStateConfig = {
    [FLOW_STATES.DEEP_FLOW]: {
      label: 'Flow Profundo',
      emoji: '🔥',
      color: '#10b981', // green
      message: 'Estás en tu mejor momento'
    },
    [FLOW_STATES.LIGHT_FLOW]: {
      label: 'En Flow',
      emoji: '✨',
      color: '#3b82f6', // blue
      message: 'Buen ritmo de aprendizaje'
    },
    [FLOW_STATES.NEUTRAL]: {
      label: 'Neutral',
      emoji: '⚖️',
      color: '#6b7280', // gray
      message: 'Calentando motores'
    },
    [FLOW_STATES.STRUGGLING]: {
      label: 'Desafiante',
      emoji: '💪',
      color: '#f59e0b', // amber
      message: 'Sigue adelante, lo tienes'
    },
    [FLOW_STATES.FRUSTRATED]: {
      label: 'Difícil',
      emoji: '🎯',
      color: '#ef4444', // red
      message: 'Vamos a facilitarlo un poco'
    }
  }

  const config = flowStateConfig[flowState] || flowStateConfig[FLOW_STATES.NEUTRAL]

  // Mapeo de boost a descripción de dificultad
  const getDifficultyLabel = (boost) => {
    if (boost <= -2) return 'Muy Fácil'
    if (boost === -1) return 'Fácil'
    if (boost === 0) return 'Normal'
    if (boost === 1) return 'Desafiante'
    if (boost >= 2) return 'Muy Difícil'
    return 'Normal'
  }

  if (compact) {
    return (
      <div className="adaptive-indicator-compact" style={{ '--flow-color': config.color }}>
        <span className="flow-emoji">{config.emoji}</span>
        <span className="flow-label">{config.label}</span>
      </div>
    )
  }

  return (
    <div className="adaptive-difficulty-indicator">
      {/* Estado de Flow */}
      <div className="flow-state-card" style={{ '--flow-color': config.color }}>
        <div className="flow-state-header">
          <span className="flow-emoji">{config.emoji}</span>
          <span className="flow-label">{config.label}</span>
        </div>
        <div className="flow-message">{config.message}</div>
      </div>

      {/* Nivel de Dificultad */}
      <div className="difficulty-level">
        <div className="difficulty-label">
          Dificultad: <strong>{getDifficultyLabel(difficultyBoost)}</strong>
        </div>
        <div className="difficulty-bar">
          <div className="difficulty-track">
            {[-2, -1, 0, 1, 2].map((level) => (
              <div
                key={level}
                className={`difficulty-segment ${difficultyBoost === level ? 'active' : ''}`}
                style={{
                  backgroundColor: difficultyBoost === level ? config.color : 'rgba(255,255,255,0.1)'
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Mensaje de Ajuste (temporal) */}
      {showAdjustment && lastAdjustment && (
        <div className="adjustment-notification" style={{ '--flow-color': config.color }}>
          <div className="adjustment-icon">🎯</div>
          <div className="adjustment-text">{lastAdjustment.reason}</div>
        </div>
      )}
    </div>
  )
}
