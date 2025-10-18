import React, { useEffect, useRef, useState } from 'react'
import { getRealUserStats } from '../../lib/progress/realTimeAnalytics.js'
import { getCurrentUserId } from '../../lib/progress/userManager/index.js'
import { initProgressSystem } from '../../lib/progress/index.js'
import Toast from '../../components/Toast.jsx'

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
  const [toast, setToast] = useState(null)
  const requestSeq = useRef(0)
  const activeRequest = useRef(null)

  useEffect(() => {
    let mounted = true
    
    const updateInsights = async () => {
      const requestId = requestSeq.current + 1
      requestSeq.current = requestId
      activeRequest.current?.abort()
      const controller = new AbortController()
      activeRequest.current = controller

      try {
        const userId = getCurrentUserId()
        if (!userId) {
          setMissingUser(true)
          setShowInsights(false)
          if (activeRequest.current === controller) {
            activeRequest.current = null
          }
          return
        }
        const stats = await getRealUserStats(userId, controller.signal)
        
        if (!mounted || requestSeq.current !== requestId) return
        
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
      } finally {
        if (activeRequest.current === controller) {
          activeRequest.current = null
        }
      }
    }

    // Initial load
    updateInsights()
    
    // Update on progress events
    const handleProgressUpdate = (event) => {
      const detailUserId = event?.detail?.userId
      if (detailUserId) {
        const currentUserId = getCurrentUserId()
        if (!currentUserId || detailUserId !== currentUserId) {
          return
        }
      }
      updateInsights()
    }
    window.addEventListener('progress:dataUpdated', handleProgressUpdate)

    return () => {
      mounted = false
      activeRequest.current?.abort()
      window.removeEventListener('progress:dataUpdated', handleProgressUpdate)
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
                setToast({ message: 'Perfil creado, cargando métricas…', type: 'success' })
                setTimeout(() => {
                  const currentUser = getCurrentUserId()
                  window.dispatchEvent(
                    new CustomEvent('progress:dataUpdated', {
                      detail: {
                        source: 'profile:init',
                        userId: currentUser || undefined
                      }
                    })
                  )
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
        {toast?.message && (
          <Toast
            key={`${toast.type}-${toast.message}`}
            message={toast.message}
            type={toast.type}
            duration={1600}
            onClose={() => setToast(null)}
          />
        )}
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
