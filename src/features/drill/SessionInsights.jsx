import React, { useEffect, useState } from 'react'
import { getRealUserStats } from '../../lib/progress/realTimeAnalytics.js'
import { getCurrentUserId } from '../../lib/progress/userManager.js'
import { initProgressSystem } from '../../lib/progress/index.js'

export default function SessionInsights() {
  const [insights, setInsights] = useState({
    sessionStreak: 0,
    sessionAccuracy: 0,
    totalMastery: 0,
    inFlow: false
  })
  const [showInsights, setShowInsights] = useState(false)
  const [missingUser, setMissingUser] = useState(false)
  const [registering, setRegistering] = useState(false)

  useEffect(() => {
    let mounted = true
    
    const updateInsights = async () => {
      try {
        const userId = getCurrentUserId()
        if (!userId) {
          setMissingUser(true)
          setShowInsights(false)
          return
        }
        const stats = await getRealUserStats(userId)
        
        if (!mounted) return
        
        // Only show meaningful metrics
        setInsights({
          sessionStreak: stats.currentSessionStreak,
          sessionAccuracy: stats.accuracy,
          totalMastery: stats.totalMastery,
          inFlow: stats.currentSessionStreak >= 5 && stats.accuracy >= 85
        })
        
        // Auto-show insights when user has meaningful progress
        setShowInsights(stats.totalAttempts > 5)
        
      } catch {
        /* fail silently */
      }
    }

    // Initial load
    updateInsights()
    
    // Update on progress events
    const handleProgressUpdate = () => updateInsights()
    window.addEventListener('progress:update', handleProgressUpdate)
    
    return () => {
      mounted = false
      window.removeEventListener('progress:update', handleProgressUpdate)
    }
  }, [])

  if (missingUser) {
    return (
      <div className="session-insights" style={{ padding: '8px 12px' }}>
        <div style={{ fontSize: 13, opacity: 0.9 }}>
          No se encontró un perfil de usuario. Crea un perfil local para habilitar métricas.
        </div>
        <div style={{ marginTop: 8 }}>
          <button
            className="btn"
            onClick={async () => {
              try {
                setRegistering(true)
                await initProgressSystem()
                setMissingUser(false)
                // Trigger refresh of insights after registration
                setShowInsights(false)
                setTimeout(() => {
                  const ev = new Event('progress:update')
                  window.dispatchEvent(ev)
                }, 50)
              } catch {
                setMissingUser(true)
              } finally {
                setRegistering(false)
              }
            }}
            disabled={registering}
            aria-label="Crear perfil local"
          >
            {registering ? 'Creando perfil…' : 'Crear perfil local'}
          </button>
        </div>
      </div>
    )
  }

  if (!showInsights) return null

  return (
    <div className="session-insights">
      <div className="insights-content">
        {insights.inFlow && (
          <div className="flow-indicator">
            <span className="flow-icon">🔥</span>
            <span className="flow-text">En racha</span>
          </div>
        )}
        
        <div className="key-metrics">
          {insights.sessionStreak > 0 && (
            <div className="metric">
              <span className="metric-value">{insights.sessionStreak}</span>
              <span className="metric-label">seguidas</span>
            </div>
          )}
          
          {insights.totalMastery > 0 && (
            <div className="metric">
              <span className="metric-value">{insights.totalMastery}%</span>
              <span className="metric-label">dominio</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
