// Componente principal del dashboard de progreso

import { useEffect, useState } from 'react'
import { getHeatMapData, getCompetencyRadarData, getUserStats, getWeeklyGoals, checkWeeklyProgress, getRecommendations } from '../../lib/progress/analytics.js'
import { getCurrentUserId } from '../../lib/progress/userManager.js'
import VerbMasteryMap from './VerbMasteryMap.jsx'
import ErrorIntelligence from './ErrorIntelligence.jsx'
import PracticeRecommendations from './PracticeRecommendations.jsx'
import SRSPanel from './SRSPanel.jsx'
import ErrorInsights from './ErrorInsights.jsx'
import { useSettings } from '../../state/settings.js'
import { validateMoodTenseAvailability } from '../../lib/core/generator.js'
import { buildFormsForRegion } from '../../lib/core/eligibility.js'
import SafeComponent from '../../components/SafeComponent.jsx'
import './progress.css'
import './practice-recommendations.css'

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
  const [personFilter, setPersonFilter] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [systemReady, setSystemReady] = useState(false)

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
        setError(null) // Clear previous errors
      }
      
      // Obtener el ID del usuario actual
      const userId = getCurrentUserId()
      if (!userId) {
        throw new Error('Usuario no inicializado. Espera un momento y reintenta.')
      }
      
      // Cargar todos los datos en paralelo con timeout y fallbacks
      const dataPromises = [
        getHeatMapData(userId, personFilter || null).catch(e => {
          console.warn('Failed to load heat map data:', e)
          return [] // fallback
        }),
        (async () => {
          try {
            const { getErrorIntelligence } = await import('../../lib/progress/analytics.js')
            return await getErrorIntelligence(userId)
          } catch (e) {
            console.warn('Failed to load error intelligence data:', e)
            return null
          }
        })(),
        getUserStats(userId).catch(e => {
          console.warn('Failed to load user stats:', e)
          return {} // fallback
        }),
        getWeeklyGoals(userId).catch(e => {
          console.warn('Failed to load weekly goals:', e)
          return {} // fallback
        }),
        checkWeeklyProgress(userId).catch(e => {
          console.warn('Failed to load weekly progress:', e)
          return {} // fallback
        }),
        getRecommendations(userId).catch(e => {
          console.warn('Failed to load recommendations:', e)
          return [] // fallback
        })
      ]
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout al cargar datos')), 10000)
      )
      
      const [
        heatMap,
        radar,
        stats,
        goals,
        progress,
        recs
      ] = await Promise.race([
        Promise.all(dataPromises),
        timeoutPromise
      ])
      
      // Defensive assignment with fallbacks
      setHeatMapData(Array.isArray(heatMap) ? heatMap : [])
      setErrorIntel(radar && typeof radar === 'object' ? radar : null)
      setUserStats(stats && typeof stats === 'object' ? stats : {})
      setWeeklyGoals(goals && typeof goals === 'object' ? goals : {})
      setWeeklyProgress(progress && typeof progress === 'object' ? progress : {})
      setRecommendations(Array.isArray(recs) ? recs : [])
      
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
          <div className="header-buttons">
            <button
              onClick={() => {
                try {
                  if (window.history && window.history.length > 1) {
                    window.history.back()
                  } else if (onNavigateHome) {
                    onNavigateHome()
                  }
                } catch (e) {
                  if (onNavigateHome) onNavigateHome()
                }
              }}
              className="nav-btn"
              title="Volver"
              aria-label="Volver"
            >
              <img src="/back.png" alt="Volver" className="nav-icon" />
            </button>
            {onNavigateHome && (
              <button onClick={onNavigateHome} className="nav-btn" title="Menú">
                <img src="/home.png" alt="Menú" className="nav-icon" />
              </button>
            )}
            {onNavigateToDrill && (
              <button onClick={onNavigateToDrill} className="nav-btn" title="Práctica">
                <img src="/verbosmain_transparent.png" alt="Práctica" className="nav-icon logo-icon" />
              </button>
            )}
          </div>
        </div>
        <h1>
          <img src="/icons/chart.png" alt="Analíticas" className="section-icon" />
          Progreso y Analíticas
        </h1>
        <p>Seguimiento detallado de tu dominio del español</p>
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

// Attach handler on component prototype (closure-friendly alternative)
// This function will be hoisted by JS; it accesses settings via window if needed (fallback)
function handleGeneralRecommendation(rec) {
  try {
    const evt = new CustomEvent('progress:generalRecommendation', { detail: rec })
    window.dispatchEvent(evt)
  } catch (e) {
    console.warn('Failed to dispatch general recommendation event:', e)
  }
}
