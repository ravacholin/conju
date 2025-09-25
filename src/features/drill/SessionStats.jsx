// Componente para mostrar estadísticas de la sesión en tiempo real

import { useState, useEffect } from 'react'

/**
 * Componente que muestra estadísticas de la sesión actual
 */
export default function SessionStats({ 
  localCorrect, 
  errorsCount, 
  currentStreak, 
  bestStreak,
  latencies,
  sessionStartTime 
}) {
  const [sessionTime, setSessionTime] = useState(0)
  const [isCollapsed, setIsCollapsed] = useState(true)

  // Actualizar tiempo de sesión cada segundo
  useEffect(() => {
    if (!sessionStartTime) return

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - sessionStartTime) / 1000)
      setSessionTime(elapsed)
    }, 1000)

    return () => clearInterval(interval)
  }, [sessionStartTime])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getAccuracy = () => {
    const total = localCorrect + errorsCount
    if (total === 0) return 0
    return Math.round((localCorrect / total) * 100)
  }

  const getAverageLatency = () => {
    if (latencies.length === 0) return 0
    const sum = latencies.reduce((acc, lat) => acc + lat, 0)
    return Math.round(sum / latencies.length / 1000) // Convertir a segundos
  }

  const getStreakEmoji = (streak) => {
    if (streak >= 10) return '🔥'
    if (streak >= 5) return '⚡'
    if (streak >= 3) return '✨'
    return '👍'
  }

  return (
    <div className={`session-stats ${isCollapsed ? 'collapsed' : 'expanded'}`}>
      <button 
        className="stats-toggle"
        onClick={() => setIsCollapsed(!isCollapsed)}
        title="Estadísticas de sesión"
      >
        📊 {isCollapsed ? 'Ver Stats' : 'Ocultar'}
      </button>
      
      {!isCollapsed && (
        <div className="stats-content">
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-label">Tiempo</div>
              <div className="stat-value">{formatTime(sessionTime)}</div>
            </div>
            
            <div className="stat-item">
              <div className="stat-label">Precisión</div>
              <div className="stat-value">{getAccuracy()}%</div>
            </div>
            
            <div className="stat-item">
              <div className="stat-label">Correctas</div>
              <div className="stat-value correct">{localCorrect}</div>
            </div>
            
            <div className="stat-item">
              <div className="stat-label">Errores</div>
              <div className="stat-value errors">{errorsCount}</div>
            </div>
            
            <div className="stat-item">
              <div className="stat-label">Racha</div>
              <div className="stat-value streak">
                {getStreakEmoji(currentStreak)} {currentStreak}
              </div>
            </div>
            
            <div className="stat-item">
              <div className="stat-label">Mejor Racha</div>
              <div className="stat-value best-streak">{bestStreak}</div>
            </div>
            
            {latencies.length > 0 && (
              <div className="stat-item">
                <div className="stat-label">Velocidad Prom.</div>
                <div className="stat-value speed">{getAverageLatency()}s</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}