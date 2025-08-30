// Componente principal del dashboard de progreso

import { useEffect, useState } from 'react'
import { getHeatMapData, getCompetencyRadarData, getUserStats, getWeeklyGoals, checkWeeklyProgress, getRecommendations } from '../../lib/progress/analytics.js'
import { getCurrentUserId } from '../../lib/progress/userManager.js'
import { ProgressTracker } from './ProgressTracker.jsx'
import { HeatMap } from './HeatMap.jsx'
import { CompetencyRadar } from './CompetencyRadar.jsx'
import PracticeRecommendations from './PracticeRecommendations.jsx'
import SRSPanel from './SRSPanel.jsx'
import ErrorInsights from './ErrorInsights.jsx'
import { useSettings } from '../../state/settings.js'
import { validateMoodTenseAvailability } from '../../lib/core/generator.js'
import { buildFormsForRegion } from '../../lib/core/eligibility.js'
import './progress.css'
import './practice-recommendations.css'

/**
 * Componente principal del dashboard de progreso
 */
export default function ProgressDashboard() {
  const settings = useSettings()
  const [heatMapData, setHeatMapData] = useState([])
  const [radarData, setRadarData] = useState({})
  const [userStats, setUserStats] = useState({})
  const [weeklyGoals, setWeeklyGoals] = useState({})
  const [weeklyProgress, setWeeklyProgress] = useState({})
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [personFilter, setPersonFilter] = useState('')

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        
        // Obtener el ID del usuario actual
        const userId = getCurrentUserId()
        
        // Cargar todos los datos en paralelo
        const [
          heatMap,
          radar,
          stats,
          goals,
          progress,
          recs
        ] = await Promise.all([
          getHeatMapData(userId, personFilter || null),
          getCompetencyRadarData(userId),
          getUserStats(userId),
          getWeeklyGoals(userId),
          checkWeeklyProgress(userId),
          getRecommendations(userId)
        ])
        
        setHeatMapData(heatMap)
        setRadarData(radar)
        setUserStats(stats)
        setWeeklyGoals(goals)
        setWeeklyProgress(progress)
        setRecommendations(Array.isArray(recs) ? recs : [])
        
        setLoading(false)
      } catch (err) {
        console.error('Error al cargar datos del dashboard:', err)
        setError(err.message)
        setLoading(false)
      }
    }

    loadData()
  }, [personFilter])

  if (loading) {
    return (
      <div className="progress-dashboard loading">
        <div className="spinner"></div>
        <p>Cargando datos de progreso...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="progress-dashboard error">
        <h2>❌ Error</h2>
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
        <h1>📊 Progreso y Analíticas</h1>
        <p>Seguimiento detallado de tu dominio del español</p>
      </header>

      <section className="dashboard-section">
        <h2>📈 Estadísticas Generales</h2>
        <ProgressTracker stats={userStats} />
      </section>

      <section className="dashboard-section">
        <h2>🗺️ Mapa de Calor por Modo y Tiempo</h2>
        <div style={{ marginBottom: 8 }}>
          <label style={{ marginRight: 8 }}>Persona:</label>
          <select value={personFilter} onChange={e => setPersonFilter(e.target.value)}>
            <option value="">Todas</option>
            {/* Mostrar ambas 2ªs; la capa de práctica ya aplica dialecto */}
            <option value="1s">yo (1s)</option>
            <option value="2s_tu">tú (2s)</option>
            <option value="2s_vos">vos (2s)</option>
            <option value="3s">él/ella (3s)</option>
            <option value="1p">nosotros (1p)</option>
            <option value="2p_vosotros">vosotros (2p)</option>
            <option value="3p">ellos (3p)</option>
          </select>
        </div>
        <HeatMap data={heatMapData} />
      </section>

      <section className="dashboard-section">
        <h2>⏱️ Repaso (SRS)</h2>
        <SRSPanel />
      </section>

      <section className="dashboard-section">
        <h2>❌ Errores más comunes</h2>
        <ErrorInsights />
      </section>

      <section className="dashboard-section">
        <h2>🎯 Radar de Competencias</h2>
        <CompetencyRadar data={radarData} />
      </section>

      <section className="dashboard-section">
        <h2>🏆 Objetivos Semanales</h2>
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

      <section className="dashboard-section">
        <h2>🎯 Práctica Recomendada</h2>
        <PracticeRecommendations 
          maxRecommendations={3}
          showDetailedView={false}
          onSelectRecommendation={(recommendation) => {
            try {
              const mood = recommendation?.targetCombination?.mood
              const tense = recommendation?.targetCombination?.tense
              
              if (!mood || !tense) {
                console.error('❌ DASHBOARD - Invalid recommendation: missing mood or tense')
                return
              }
              
              // PRE-VALIDATION: Check if combination is available before proceeding
              const allForms = buildFormsForRegion(settings.region)
              const isValid = validateMoodTenseAvailability(mood, tense, settings, allForms)
              
              if (!isValid) {
                console.error(`❌ DASHBOARD - Invalid combination: ${mood}/${tense} not available`)
                return
              }
              
              // Update configuration for specific practice
              settings.set({ practiceMode: 'specific', specificMood: mood, specificTense: tense })
              // Navigate to practice
              window.dispatchEvent(new CustomEvent('progress:navigate', { detail: { mood, tense } }))
            } catch (e) {
              console.error('Error processing recommendation:', e)
            }
          }}
        />
      </section>

      <section className="dashboard-section">
        <h2>💡 Recomendaciones</h2>
        <div className="recommendations">
          {recommendations.length > 0 ? (
            recommendations.slice(0,3).map((rec, index) => (
              <div key={index} className={`recommendation-card priority-${rec.priority}`}>
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
