// Componente para mostrar recomendaciones de práctica adaptativa

import { useState, useEffect } from 'react'
import { AdaptivePracticeEngine } from '../../lib/progress/AdaptivePracticeEngine.js'
import { getCurrentUserId } from '../../lib/progress/userManager.js'

/**
 * Componente que muestra recomendaciones de práctica personalizadas
 */
export default function PracticeRecommendations({ 
  onSelectRecommendation, 
  maxRecommendations = 3,
  showDetailedView = false,
  focusMode: initialFocusMode = 'balanced' 
}) {
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedSession, setSelectedSession] = useState(null)
  const [focusMode, setFocusMode] = useState(initialFocusMode)

  useEffect(() => {
    loadRecommendations()
  }, [focusMode, maxRecommendations])

  const loadRecommendations = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const userId = getCurrentUserId()
      const engine = new AdaptivePracticeEngine(userId)
      
      const recs = await engine.getPracticeRecommendations({
        maxRecommendations,
        focusMode,
        includeNewContent: true
      })
      
      setRecommendations(recs)
    } catch (err) {
      console.error('Error cargando recomendaciones:', err)
      setError('Error al cargar recomendaciones de práctica')
    } finally {
      setLoading(false)
    }
  }

  const handleRecommendationClick = (recommendation) => {
    if (onSelectRecommendation) {
      onSelectRecommendation(recommendation)
    }
  }

  const loadPersonalizedSession = async (duration = 15) => {
    try {
      const userId = getCurrentUserId()
      const engine = new AdaptivePracticeEngine(userId)
      const session = await engine.getPersonalizedSession(duration)
      setSelectedSession(session)
    } catch (err) {
      console.error('Error cargando sesión personalizada:', err)
    }
  }

  const getRecommendationIcon = (type) => {
    const icons = {
      weak_area_practice: '🎯',
      spaced_review: '🔄',
      new_content: '📚',
      balanced_practice: '⚖️'
    }
    return icons[type] || '📝'
  }

  const getPriorityColor = (priority) => {
    if (priority >= 80) return 'high'
    if (priority >= 60) return 'medium'
    return 'low'
  }

  const getDifficultyBadge = (difficulty) => {
    const badges = {
      easy: { text: 'Fácil', color: 'green' },
      medium: { text: 'Medio', color: 'orange' },
      hard: { text: 'Difícil', color: 'red' },
      focused: { text: 'Enfocado', color: 'blue' },
      review: { text: 'Repaso', color: 'purple' },
      learning: { text: 'Nuevo', color: 'teal' }
    }
    return badges[difficulty] || { text: 'Normal', color: 'gray' }
  }

  if (loading) {
    return (
      <div className="practice-recommendations loading">
        <div className="recommendations-header">
          <h3>🤖 Recomendaciones de Práctica</h3>
        </div>
        <div className="loading-content">
          <div className="spinner"></div>
          <p>Analizando tu progreso...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="practice-recommendations error">
        <div className="recommendations-header">
          <h3>🤖 Recomendaciones de Práctica</h3>
        </div>
        <div className="error-content">
          <p>❌ {error}</p>
          <button onClick={loadRecommendations} className="retry-btn">
            Intentar de nuevo
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="practice-recommendations">
      <div className="recommendations-header">
        <h3>🤖 Recomendaciones de Práctica</h3>
        <div className="focus-mode-selector">
          <select 
            value={focusMode} 
            onChange={(e) => setFocusMode(e.target.value)}
            className="mode-select"
          >
            <option value="balanced">⚖️ Balanceado</option>
            <option value="weak_areas">🎯 Áreas débiles</option>
            <option value="review">🔄 Repaso</option>
            <option value="new">📚 Contenido nuevo</option>
          </select>
        </div>
      </div>

      {recommendations.length === 0 ? (
        <div className="no-recommendations">
          <p>🎉 ¡Excelente! No hay recomendaciones específicas.</p>
          <p>Continúa con tu práctica regular.</p>
        </div>
      ) : (
        <div className="recommendations-list">
          {recommendations.map((rec, index) => {
            const difficultyBadge = getDifficultyBadge(rec.difficulty)
            const priorityClass = getPriorityColor(rec.priority)
            
            return (
              <div 
                key={index}
                className={`recommendation-card ${priorityClass}`}
                onClick={() => handleRecommendationClick(rec)}
              >
                <div className="recommendation-header">
                  <span className="recommendation-icon">
                    {getRecommendationIcon(rec.type)}
                  </span>
                  <h4 className="recommendation-title">{rec.title}</h4>
                  <span className={`priority-badge ${priorityClass}`}>
                    {rec.priority >= 80 ? 'Alta' : rec.priority >= 60 ? 'Media' : 'Baja'}
                  </span>
                </div>
                
                <p className="recommendation-description">{rec.description}</p>
                
                <div className="recommendation-meta">
                  <span className={`difficulty-badge ${difficultyBadge.color}`}>
                    {difficultyBadge.text}
                  </span>
                  <span className="duration-badge">
                    ⏱️ {rec.estimatedDuration}
                  </span>
                  {rec.targetCombination && (
                    <span className="target-badge">
                      {rec.targetCombination.mood}/{rec.targetCombination.tense}
                    </span>
                  )}
                </div>

                {showDetailedView && (
                  <div className="recommendation-details">
                    <div className="detail-item">
                      <strong>Razón:</strong> {rec.reason}
                    </div>
                    <div className="detail-item">
                      <strong>Prioridad:</strong> {rec.priority}/100
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div className="session-planner">
        <h4>📅 Sesión Personalizada</h4>
        <div className="session-controls">
          <button 
            onClick={() => loadPersonalizedSession(10)}
            className="session-btn short"
          >
            Sesión Corta (10 min)
          </button>
          <button 
            onClick={() => loadPersonalizedSession(15)}
            className="session-btn medium"
          >
            Sesión Media (15 min)
          </button>
          <button 
            onClick={() => loadPersonalizedSession(20)}
            className="session-btn long"
          >
            Sesión Larga (20 min)
          </button>
        </div>

        {selectedSession && (
          <div className="session-preview">
            <h5>Plan de Sesión ({selectedSession.duration} min)</h5>
            <div className="session-stats">
              <span>📝 ~{selectedSession.estimatedItems} elementos</span>
              <span>🎯 {selectedSession.focusAreas.join(', ')}</span>
            </div>
            <div className="session-activities">
              {selectedSession.activities.map((activity, index) => (
                <div key={index} className="session-activity">
                  <span className="activity-icon">{getRecommendationIcon(activity.type)}</span>
                  <span className="activity-title">{activity.title}</span>
                  <span className="activity-time">⏱️ {activity.allocatedTime}min</span>
                </div>
              ))}
            </div>
            <button 
              className="start-session-btn"
              onClick={() => handleRecommendationClick({ 
                type: 'personalized_session', 
                session: selectedSession 
              })}
            >
              🚀 Iniciar Sesión
            </button>
          </div>
        )}
      </div>

      <div className="recommendations-footer">
        <button onClick={loadRecommendations} className="refresh-btn">
          🔄 Actualizar Recomendaciones
        </button>
        <p className="update-note">
          Las recomendaciones se actualizan basándose en tu progreso reciente.
        </p>
      </div>
    </div>
  )
}