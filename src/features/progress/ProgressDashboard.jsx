// Componente principal del dashboard de progreso

import { useEffect, useState, useRef } from 'react'
import { getHeatMapData, getUserStats, getWeeklyGoals, checkWeeklyProgress, getRecommendations } from '../../lib/progress/analytics.js'
import { getCurrentUserId } from '../../lib/progress/userManager.js'
import { progressDataCache } from '../../lib/cache/ProgressDataCache.js'
import VerbMasteryMap from './VerbMasteryMap.jsx'
import ErrorIntelligence from './ErrorIntelligence.jsx'
import PracticeRecommendations from './PracticeRecommendations.jsx'
import SRSPanel from './SRSPanel.jsx'
import ErrorInsights from './ErrorInsights.jsx'
import { useSettings } from '../../state/settings.js'
import { validateMoodTenseAvailability } from '../../lib/core/generator.js'
import { buildFormsForRegion } from '../../lib/core/eligibility.js'
import SafeComponent from '../../components/SafeComponent.jsx'
import { AsyncController } from '../../lib/utils/AsyncController.js'
import router from '../../lib/routing/Router.js'
import './progress.css'
import './practice-recommendations.css'

// Add styles for the refresh button
const refreshButtonStyles = `
  .dashboard-controls {
    margin: 0.5rem 0;
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }
  
  .refresh-btn {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.5rem;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 4px;
    color: white;
    font-size: 0.875rem;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .refresh-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.2);
  }
  
  .refresh-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .inline-icon {
    width: 14px;
    height: 14px;
    opacity: 0.8;
  }
`

// Inject styles
if (typeof document !== 'undefined' && !document.querySelector('#dashboard-refresh-styles')) {
  const styleElement = document.createElement('style')
  styleElement.id = 'dashboard-refresh-styles'
  styleElement.textContent = refreshButtonStyles
  document.head.appendChild(styleElement)
}

/**
 * Componente principal del dashboard de progreso
 */
export default function ProgressDashboard({ onNavigateHome, onNavigateToDrill }) {
  const settings = useSettings()
  const [heatMapData, setHeatMapData] = useState([])
  const [errorIntel, setErrorIntel] = useState(null)
  const [userStats, setUserStats] = useState({})
  const [weeklyGoals, setWeeklyGoals] = useState({})
  const [weeklyProgress, setWeeklyProgress] = useState({})
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [personFilter] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [systemReady, setSystemReady] = useState(false)
  
  // AsyncController for managing cancellable operations
  const asyncController = useRef(new AsyncController())

  // Handle generic (lower) recommendations click
  const handleGeneralRecommendation = (rec) => {
    try {
      switch (rec?.id) {
        case 'focus-struggling':
          // Mixed practice to let generator focus broadly; block handled by generator/history
          settings.set({ practiceMode: 'mixed', currentBlock: null })
          break
        case 'maintain-mastery':
          // Route to review session (today)
          settings.set({ practiceMode: 'review', reviewSessionType: 'today' })
          break
        case 'improve-accuracy':
        case 'improve-speed':
        case 'expand-variety':
        case 'keep-going':
        case 'general-practice':
        case 'get-started':
        default:
          // Default to drill with current settings
          break
      }
      if (typeof onNavigateToDrill === 'function') onNavigateToDrill()
    } catch (e) {
      console.error('Error handling general recommendation:', e)
    }
  }

  const loadData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
        setError(null)
      }
      
      // Cancel any previous data loading operations
      asyncController.current.cancel('loadDashboardData')
      
      // Get current user ID
      const userId = getCurrentUserId()
      if (!userId) {
        throw new Error('Usuario no inicializado. Espera un momento y reintenta.')
      }
      
      // Cache warmup for commonly used data
      if (!isRefresh) {
        const warmupLoaders = {
          userStats: () => getUserStats(userId),
          weeklyGoals: () => getWeeklyGoals(userId)
        }
        progressDataCache.warmup(userId, warmupLoaders)
      }
      
      // Define operations with cache integration
      const operations = {
        heatMap: async (signal) => {
          try {
            const cacheKey = `${userId}:heatMap:${personFilter || 'all'}`
            const result = await progressDataCache.get(
              cacheKey,
              () => getHeatMapData(userId, personFilter || null),
              'heatMap'
            )
            if (signal.aborted) throw new Error('Cancelled')
            return Array.isArray(result) ? result : []
          } catch (e) {
            if (!signal.aborted) console.warn('Failed to load heat map data:', e)
            return []
          }
        },
        
        errorIntel: async (signal) => {
          try {
            const cacheKey = `${userId}:errorIntel`
            const result = await progressDataCache.get(
              cacheKey,
              async () => {
                const { getErrorIntelligence } = await import('../../lib/progress/analytics.js')
                return getErrorIntelligence(userId)
              },
              'errorIntel'
            )
            if (signal.aborted) throw new Error('Cancelled')
            return result && typeof result === 'object' ? result : null
          } catch (e) {
            if (!signal.aborted) console.warn('Failed to load error intelligence data:', e)
            return null
          }
        },
        
        userStats: async (signal) => {
          try {
            const cacheKey = `${userId}:userStats`
            const result = await progressDataCache.get(
              cacheKey,
              () => getUserStats(userId),
              'userStats'
            )
            if (signal.aborted) throw new Error('Cancelled')
            return result && typeof result === 'object' ? result : {}
          } catch (e) {
            if (!signal.aborted) console.warn('Failed to load user stats:', e)
            return {}
          }
        },
        
        weeklyGoals: async (signal) => {
          try {
            const cacheKey = `${userId}:weeklyGoals`
            const result = await progressDataCache.get(
              cacheKey,
              () => getWeeklyGoals(userId),
              'weeklyGoals'
            )
            if (signal.aborted) throw new Error('Cancelled')
            return result && typeof result === 'object' ? result : {}
          } catch (e) {
            if (!signal.aborted) console.warn('Failed to load weekly goals:', e)
            return {}
          }
        },
        
        weeklyProgress: async (signal) => {
          try {
            const cacheKey = `${userId}:weeklyProgress`
            const result = await progressDataCache.get(
              cacheKey,
              () => checkWeeklyProgress(userId),
              'weeklyProgress'
            )
            if (signal.aborted) throw new Error('Cancelled')
            return result && typeof result === 'object' ? result : {}
          } catch (e) {
            if (!signal.aborted) console.warn('Failed to load weekly progress:', e)
            return {}
          }
        },
        
        recommendations: async (signal) => {
          try {
            const cacheKey = `${userId}:recommendations`
            const result = await progressDataCache.get(
              cacheKey,
              () => getRecommendations(userId),
              'recommendations'
            )
            if (signal.aborted) throw new Error('Cancelled')
            return Array.isArray(result) ? result : []
          } catch (e) {
            if (!signal.aborted) console.warn('Failed to load recommendations:', e)
            return []
          }
        }
      }
      
      // Execute all operations with proper cancellation and timeout
      const results = await asyncController.current.executeAll(operations, 10000)
      
      // Update state with results
      setHeatMapData(results.heatMap || [])
      setErrorIntel(results.errorIntel || null)
      setUserStats(results.userStats || {})
      setWeeklyGoals(results.weeklyGoals || {})
      setWeeklyProgress(results.weeklyProgress || {})
      setRecommendations(results.recommendations || [])
      
      setError(null)
      setLoading(false)
      setRefreshing(false)
    } catch (err) {
      console.error('Error al cargar datos del dashboard:', err)
      setError(err.message || 'Error desconocido al cargar datos')
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Check if progress system is ready
  useEffect(() => {
    const checkSystemReady = async () => {
      try {
        // Wait for user ID to be available
        let attempts = 0
        const maxAttempts = 50 // 5 seconds max
        
        while (attempts < maxAttempts) {
          const userId = getCurrentUserId()
          if (userId) {
            setSystemReady(true)
            loadData()
            return
          }
          await new Promise(resolve => setTimeout(resolve, 100))
          attempts++
        }
        
        // If we get here, system didn't initialize properly
        setError('Sistema de progreso no inicializado. Refresca la página.')
        setLoading(false)
      } catch (err) {
        console.error('Error checking system readiness:', err)
        setError('Error al verificar sistema de progreso')
        setLoading(false)
      }
    }
    
    checkSystemReady()
  }, [])

  useEffect(() => {
    if (systemReady) {
      loadData()
    }
  }, [personFilter, systemReady])

  // Escuchar eventos de actualización de progreso para refrescar automáticamente
  useEffect(() => {
    const handleProgressUpdate = (event) => {
      console.log('🔄 Datos de progreso actualizados, refrescando dashboard...', event.detail)
      // Recargar datos después de un breve delay para asegurar que se guardaron
      setTimeout(() => {
        loadData(true)
      }, 500)
    }

    window.addEventListener('progress:dataUpdated', handleProgressUpdate)
    
    return () => {
      window.removeEventListener('progress:dataUpdated', handleProgressUpdate)
    }
  }, [personFilter])

  // Cleanup async operations on component unmount
  useEffect(() => {
    return () => {
      asyncController.current.destroy()
    }
  }, [])

  // Debug cache performance in development
  useEffect(() => {
    if (import.meta.env?.DEV) {
      const logCacheStats = () => {
        const stats = progressDataCache.getStats()
        console.log('📊 Cache Stats:', stats)
      }
      
      // Log cache stats every 30 seconds in development
      const interval = setInterval(logCacheStats, 30000)
      return () => clearInterval(interval)
    }
  }, [])

  if (loading) {
    return (
      <div className="progress-dashboard loading">
        <div className="spinner"></div>
        <p>
          {!systemReady 
            ? 'Inicializando sistema de progreso...' 
            : 'Cargando datos de progreso...'
          }
        </p>
        <p style={{ fontSize: '0.875rem', opacity: 0.7 }}>
          {!systemReady 
            ? 'Preparando base de datos e indexando verbos...' 
            : 'Analizando tu progreso y generando recomendaciones...'
          }
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="progress-dashboard error">
        <h2>
          <img src="/icons/error.png" alt="Error" className="section-icon" />
          Error
        </h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>
          Recargar
        </button>
      </div>
    )
  }

  return (
    <div className="progress-dashboard">
      <header className="dashboard-header">
        <div className="header-top">
          <div className="icon-row">
            <button
              onClick={() => router.back()}
              className="icon-btn"
              title="Volver"
              aria-label="Volver"
            >
              <img src="/back.png" alt="Volver" className="menu-icon" />
            </button>
            {onNavigateHome && (
              <button onClick={onNavigateHome} className="icon-btn" title="Menú">
                <img src="/home.png" alt="Menú" className="menu-icon" />
              </button>
            )}
            {onNavigateToDrill && (
              <button onClick={onNavigateToDrill} className="icon-btn" title="Práctica">
                <img src="/verbosmain_transparent.png" alt="Práctica" className="menu-icon" />
              </button>
            )}
          </div>
        </div>
        <h1>
          <img src="/icons/chart.png" alt="Analíticas" className="section-icon" />
          Progreso y Analíticas
        </h1>
        <p>Seguimiento detallado de tu dominio del español</p>
        <div className="dashboard-controls">
          <button 
            onClick={() => {
              // Clear cache and force refresh
              const userId = getCurrentUserId()
              if (userId) {
                progressDataCache.invalidateUser(userId)
              }
              loadData(true)
            }}
            className="refresh-btn"
            disabled={loading || refreshing}
            title="Refrescar datos (bypasa caché)"
          >
            <img src="/icons/refresh.png" alt="Refrescar" className="inline-icon" />
            {refreshing ? 'Actualizando...' : 'Refrescar'}
          </button>
        </div>
        {refreshing && (
          <div className="refresh-indicator">
            <img src="/icons/refresh.png" alt="Actualizando" className="inline-icon" />
            <span>Actualizando métricas...</span>
          </div>
        )}
      </header>

      <SafeComponent name="Mapa de Dominio">
        <section className="dashboard-section">
          <VerbMasteryMap data={heatMapData} onNavigateToDrill={onNavigateToDrill} />
        </section>
      </SafeComponent>

      <SafeComponent name="Sistema SRS">
        <section className="dashboard-section">
          <h2>
            <img src="/icons/timer.png" alt="SRS" className="section-icon" />
            Repaso (SRS)
          </h2>
          <SRSPanel onNavigateToDrill={onNavigateToDrill} />
        </section>
      </SafeComponent>

      <SafeComponent name="Análisis de Errores">
        <section className="dashboard-section">
          <h2>
            <img src="/diana.png" alt="Errores" className="section-icon" />
            Análisis de Errores
          </h2>
          <ErrorInsights onNavigateToDrill={onNavigateToDrill} />
        </section>
      </SafeComponent>

      <SafeComponent name="Inteligencia de Errores">
        <section className="dashboard-section">
          <h2>
            <img src="/radar.png" alt="Errores" className="section-icon" />
            Inteligencia de Errores
          </h2>
          <ErrorIntelligence data={errorIntel} compact={true} onNavigateToDrill={onNavigateToDrill} />
        </section>
      </SafeComponent>

      <section className="dashboard-section">
        <h2>
          <img src="/icons/trophy.png" alt="Objetivos" className="section-icon" />
          Objetivos Semanales
        </h2>
        <div className="weekly-goals">
          <div className="goal-card">
            <h3>Celdas a mejorar</h3>
            <p className="goal-value">
              {weeklyProgress.cellsToImprove || 0} / {weeklyGoals.CELLS_TO_IMPROVE || 3}
            </p>
          </div>
          <div className="goal-card">
            <h3>Puntaje mínimo</h3>
            <p className="goal-value">
              {userStats.totalMastery || 0}% / {weeklyGoals.MIN_SCORE || 75}%
            </p>
          </div>
          <div className="goal-card">
            <h3>Sesiones</h3>
            <p className="goal-value">
              {weeklyProgress.sessionsCompleted || 0} / {weeklyGoals.SESSIONS || 5}
            </p>
          </div>
        </div>
      </section>

      <SafeComponent name="Recomendaciones de Práctica">
        <section className="dashboard-section">
          <h2>
            <img src="/icons/robot.png" alt="Recomendaciones" className="section-icon" />
            Práctica Recomendada
          </h2>
          <PracticeRecommendations 
            maxRecommendations={3}
            showDetailedView={false}
            onSelectRecommendation={(recommendation) => {
              try {
                if (recommendation?.type === 'personalized_session' && recommendation.session) {
                  // Build a currentBlock from session activities
                  const combos = []
                  ;(recommendation.session.activities || []).forEach(act => {
                    (act.combos || []).forEach(c => { if (c?.mood && c?.tense) combos.push({ mood: c.mood, tense: c.tense }) })
                  })
                  if (combos.length > 0) {
                    settings.set({ practiceMode: 'mixed', currentBlock: { combos, itemsRemaining: recommendation.session.estimatedItems || combos.length * 3 } })
                  } else {
                    settings.set({ practiceMode: 'mixed', currentBlock: null })
                  }
                  if (onNavigateToDrill) onNavigateToDrill()
                  return
                }

                const mood = recommendation?.targetCombination?.mood
                const tense = recommendation?.targetCombination?.tense
                if (!mood || !tense) return
                const allForms = buildFormsForRegion(settings.region)
                const isValid = validateMoodTenseAvailability(mood, tense, settings, allForms)
                if (!isValid) return
                settings.set({ practiceMode: 'specific', specificMood: mood, specificTense: tense })
                if (onNavigateToDrill) onNavigateToDrill()
              } catch (e) {
                console.error('Error processing recommendation:', e)
              }
            }}
          />
        </section>
      </SafeComponent>

      <section className="dashboard-section">
        <h2>
          <img src="/icons/lightbulb.png" alt="Recomendaciones" className="section-icon" />
          Recomendaciones
        </h2>
        <div className="recommendations">
          {recommendations.length > 0 ? (
            recommendations.slice(0,3).map((rec, index) => (
              <div 
                key={index} 
                className={`recommendation-card priority-${rec.priority}`}
                onClick={() => handleGeneralRecommendation(rec)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleGeneralRecommendation(rec) }}
              >
                <h3>{rec.title}</h3>
                <p>{rec.description}</p>
              </div>
            ))
          ) : (
            <p>Sigue practicando para recibir recomendaciones personalizadas.</p>
          )}
        </div>
      </section>
    </div>
  )
}

// Unused function - can be removed if not needed elsewhere
// function handleGeneralRecommendation(rec) {
//   try {
//     const evt = new CustomEvent('progress:generalRecommendation', { detail: rec })
//     window.dispatchEvent(evt)
//   } catch (e) {
//     console.warn('Failed to dispatch general recommendation event:', e)
//   }
// }
