// Componente Visual para Indicación de Estado de Flow
// Muestra el estado emocional y flow del usuario en tiempo real

import React, { useState, useEffect } from 'react'
import './flow-indicator.css'

/**
 * Indicador Visual de Estado de Flow
 */
export const FlowIndicator = ({ 
  flowState, 
  momentum, 
  metrics = {}, 
  onStateChange = null,
  position = 'top-right',
  size = 'normal',
  showDetails = false 
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [animationClass, setAnimationClass] = useState('')
  const [previousState, setPreviousState] = useState(null)

  // Detectar cambios de estado para animaciones
  useEffect(() => {
    if (previousState && previousState !== flowState) {
      setAnimationClass('flow-state-change')
      setTimeout(() => setAnimationClass(''), 1000)
      
      if (onStateChange) {
        onStateChange(previousState, flowState)
      }
    }
    setPreviousState(flowState)
  }, [flowState, previousState, onStateChange])

  // Configuración visual según estado
  const getStateConfig = (state) => {
    switch (state) {
      case 'deep_flow':
        return {
          color: 'var(--accent-green)',
          emoji: '🔥',
          label: 'En la Zona',
          description: 'Rendimiento máximo',
          pulse: true,
          glow: true
        }
      case 'light_flow':
        return {
          color: 'var(--success)',
          emoji: '✨',
          label: 'Buen Ritmo',
          description: 'Flow ligero',
          pulse: false,
          glow: true
        }
      case 'neutral':
        return {
          color: 'var(--text-secondary)',
          emoji: '📚',
          label: 'Normal',
          description: 'Aprendizaje constante',
          pulse: false,
          glow: false
        }
      case 'struggling':
        return {
          color: 'var(--warning)',
          emoji: '💪',
          label: 'Desafiado',
          description: 'Necesita apoyo',
          pulse: false,
          glow: false
        }
      case 'frustrated':
        return {
          color: 'var(--error)',
          emoji: '🌱',
          label: 'Recuperación',
          description: 'Tómate tu tiempo',
          pulse: false,
          glow: false
        }
      default:
        return {
          color: 'var(--text-muted)',
          emoji: '⚪',
          label: 'Iniciando',
          description: 'Preparándose...',
          pulse: false,
          glow: false
        }
    }
  }

  // Configuración visual según momentum
  const getMomentumConfig = (momentum) => {
    switch (momentum) {
      case 'peak_performance':
        return { icon: '🚀', label: 'Pico', color: 'var(--accent-gold)' }
      case 'confidence_building':
        return { icon: '📈', label: 'Creciendo', color: 'var(--accent-green)' }
      case 'steady_progress':
        return { icon: '⚡', label: 'Constante', color: 'var(--accent-blue)' }
      case 'minor_setback':
        return { icon: '🔄', label: 'Ajustando', color: 'var(--warning)' }
      case 'recovery_mode':
        return { icon: '💚', label: 'Recuperando', color: 'var(--success)' }
      case 'confidence_crisis':
        return { icon: '🌱', label: 'Reconstruyendo', color: 'var(--text-muted)' }
      default:
        return { icon: '⚪', label: 'Normal', color: 'var(--text-muted)' }
    }
  }

  const stateConfig = getStateConfig(flowState)
  const momentumConfig = getMomentumConfig(momentum)

  // Cálculo de porcentajes para métricas
  const getMetricPercentage = (value, max = 1) => {
    return Math.round((value / max) * 100)
  }

  // Formatear duración
  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div 
      className={`flow-indicator ${position} ${size} ${animationClass}`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      style={{ '--flow-color': stateConfig.color }}
    >
      {/* Indicador principal */}
      <div 
        className={`flow-indicator-main ${stateConfig.pulse ? 'pulse' : ''} ${stateConfig.glow ? 'glow' : ''}`}
        style={{ 
          backgroundColor: stateConfig.color,
          boxShadow: stateConfig.glow ? `0 0 20px ${stateConfig.color}40` : 'none'
        }}
      >
        <span className="flow-emoji">{stateConfig.emoji}</span>
        {size !== 'minimal' && (
          <span className="flow-label">{stateConfig.label}</span>
        )}
      </div>

      {/* Indicador de momentum */}
      {momentum && size !== 'minimal' && (
        <div 
          className="momentum-indicator"
          style={{ backgroundColor: momentumConfig.color }}
        >
          <span className="momentum-icon">{momentumConfig.icon}</span>
        </div>
      )}

      {/* Panel expandido */}
      {(isExpanded || showDetails) && (
        <div className="flow-details-panel">
          {/* Estado principal */}
          <div className="flow-state-section">
            <div className="state-header">
              <span className="state-emoji-large">{stateConfig.emoji}</span>
              <div className="state-info">
                <h4 className="state-title">{stateConfig.label}</h4>
                <p className="state-description">{stateConfig.description}</p>
              </div>
            </div>
          </div>

          {/* Momentum */}
          {momentum && (
            <div className="momentum-section">
              <div className="section-header">
                <span className="section-icon">📈</span>
                <span className="section-title">Momentum</span>
              </div>
              <div className="momentum-info">
                <span className="momentum-icon-large">{momentumConfig.icon}</span>
                <span className="momentum-label">{momentumConfig.label}</span>
              </div>
            </div>
          )}

          {/* Métricas clave */}
          {metrics && Object.keys(metrics).length > 0 && (
            <div className="metrics-section">
              <div className="section-header">
                <span className="section-icon">📊</span>
                <span className="section-title">Métricas</span>
              </div>
              
              <div className="metrics-grid">
                {/* Confianza */}
                {metrics.confidence !== undefined && (
                  <div className="metric-item">
                    <span className="metric-label">Confianza</span>
                    <div className="metric-bar">
                      <div 
                        className="metric-fill confidence"
                        style={{ width: `${getMetricPercentage(metrics.confidence)}%` }}
                      ></div>
                    </div>
                    <span className="metric-value">{getMetricPercentage(metrics.confidence)}%</span>
                  </div>
                )}

                {/* Streak actual */}
                {metrics.currentStreak && (
                  <div className="metric-item">
                    <span className="metric-label">Racha</span>
                    <div className="streak-display">
                      <span className="streak-number">{metrics.currentStreak.correct}</span>
                      <span className="streak-icon">🔥</span>
                    </div>
                  </div>
                )}

                {/* Tiempo en flow */}
                {metrics.flowPercentage !== undefined && (
                  <div className="metric-item">
                    <span className="metric-label">Tiempo en Flow</span>
                    <div className="metric-bar">
                      <div 
                        className="metric-fill flow-time"
                        style={{ width: `${metrics.flowPercentage}%` }}
                      ></div>
                    </div>
                    <span className="metric-value">{metrics.flowPercentage}%</span>
                  </div>
                )}

                {/* Consistencia */}
                {metrics.consistencyScore !== undefined && (
                  <div className="metric-item">
                    <span className="metric-label">Consistencia</span>
                    <div className="metric-bar">
                      <div 
                        className="metric-fill consistency"
                        style={{ width: `${metrics.consistencyScore}%` }}
                      ></div>
                    </div>
                    <span className="metric-value">{metrics.consistencyScore}%</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Estadísticas de sesión */}
          {metrics && (metrics.sessionDuration || metrics.totalResponses) && (
            <div className="session-section">
              <div className="section-header">
                <span className="section-icon">⏱️</span>
                <span className="section-title">Sesión</span>
              </div>
              
              <div className="session-stats">
                {metrics.sessionDuration && (
                  <div className="session-stat">
                    <span className="stat-label">Duración</span>
                    <span className="stat-value">{formatDuration(metrics.sessionDuration)}</span>
                  </div>
                )}
                
                {metrics.totalResponses && (
                  <div className="session-stat">
                    <span className="stat-label">Respuestas</span>
                    <span className="stat-value">{metrics.totalResponses}</span>
                  </div>
                )}

                {metrics.deepFlowSessions && (
                  <div className="session-stat">
                    <span className="stat-label">Flow Profundo</span>
                    <span className="stat-value">{metrics.deepFlowSessions}x</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Componente simplificado para indicación mínima
 */
export const MiniFlowIndicator = ({ flowState, momentum }) => (
  <FlowIndicator 
    flowState={flowState}
    momentum={momentum}
    position="top-right"
    size="minimal"
    showDetails={false}
  />
)

/**
 * Componente expandido para dashboard
 */
export const DetailedFlowIndicator = ({ flowState, momentum, metrics }) => (
  <FlowIndicator 
    flowState={flowState}
    momentum={momentum}
    metrics={metrics}
    position="static"
    size="large"
    showDetails={true}
  />
)

export default FlowIndicator