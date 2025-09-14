// Componente para mostrar recomendaciones de práctica adaptativa

import { useState, useEffect } from 'react'
import { AdaptivePracticeEngine } from '../../lib/progress/AdaptivePracticeEngine.js'
import { formatMoodTense } from '../../lib/utils/verbLabels.js'
import { getCurrentUserId } from '../../lib/progress/userManager.js'

// Use centralized formatter for consistency

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
      // Defensive: ensure array shape
      setRecommendations(Array.isArray(recs) ? recs : [])
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

  const getRecommendationIconPath = (type) => {
    const icons = {
      weak_area_practice: '/icons/chart.png',
      spaced_review: '/icons/refresh.png',
      new_content: '/openbook.png',
      balanced_practice: '/icons/chart.png'
    }
    return icons[type] || '/icons/chart.png'
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
          <h3>
            <img src="/icons/robot.png" alt="Recomendaciones" className="section-icon" />
            Recomendaciones de Práctica
          </h3>
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
          <h3>
            <img src="/icons/robot.png" alt="Recomendaciones" className="section-icon" />
            Recomendaciones de Práctica
          </h3>
        </div>
        <div className="error-content">
          <p>
            <img src="/icons/error.png" alt="Error" className="inline-icon" />
            {error}
          </p>
          <button onClick={loadRecommendations} className="retry-btn">
            Intentá de nuevo
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="practice-recommendations">
      <div className="recommendations-header">
        <h3>
          <img src="/icons/robot.png" alt="Recomendaciones" className="section-icon" />
          Recomendaciones de Práctica
        </h3>
        <div className="focus-mode-selector">
          <select 
            value={focusMode} 
            onChange={(e) => setFocusMode(e.target.value)}
            className="mode-select"
          >
            <option value="balanced">Balanceado</option>
            <option value="weak_areas">Áreas débiles</option>
            <option value="review">Repaso</option>
            <option value="new">Contenido nuevo</option>
          </select>
        </div>
      </div>

      {recommendations.length === 0 ? (
        <div className="no-recommendations">
          <p>
            <img src="/icons/sparks.png" alt="Listo" className="inline-icon" />
            ¡Excelente! No hay recomendaciones específicas.
          </p>
          <p>Continuá con tu práctica regular.</p>
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
                    <img src={getRecommendationIconPath(rec.type)} alt={rec.type} className="inline-icon" />
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
                    <img src="/icons/timer.png" alt="Duración" className="inline-icon" />
                    {rec.estimatedDuration}
                  </span>
                  {rec.targetCombination && (
                    <span className="target-badge">
                      {formatMoodTense(rec.targetCombination.mood, rec.targetCombination.tense)}
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
        <h4>
          <img src="/icons/calendar.png" alt="Sesión" className="inline-icon lg" />
          Sesión personalizada
        </h4>
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

        {(selectedSession && Array.isArray(selectedSession.activities)) && (
          <div className="session-preview">
            <h5>Plan de Sesión ({selectedSession.duration} min)</h5>
            <div className="session-stats">
              <span>~{selectedSession.estimatedItems} elementos</span>
              <span>{(selectedSession.focusAreas || []).join(', ')}</span>
            </div>
            <div className="session-activities">
              {(selectedSession.activities || []).map((activity, index) => (
                <div key={index} className="session-activity">
                  <span className="activity-icon">{getRecommendationIconPath(activity.type)}</span>
                  <span className="activity-title">{activity.title}</span>
                  <span className="activity-time">
                    <img src="/icons/timer.png" alt="Tiempo" className="inline-icon" />
                    {activity.allocatedTime}min
                  </span>
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
              Iniciá sesión
            </button>
          </div>
        )}
      </div>

      <div className="recommendations-footer">
        <button onClick={loadRecommendations} className="refresh-btn">
          <img src="/icons/refresh.png" alt="Actualizar" className="inline-icon" />
          Actualizá recomendaciones
        </button>
        <p className="update-note">
          Las recomendaciones se actualizan basándose en tu progreso reciente.
        </p>
      </div>
    </div>
  )
}
