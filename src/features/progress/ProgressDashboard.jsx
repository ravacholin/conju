// Componente principal del dashboard de progreso
import React from 'react'

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
import ProgressHeader from './ProgressHeader.jsx'
import WeeklyGoalsPanel from './WeeklyGoalsPanel.jsx'
import GeneralRecommendations from './GeneralRecommendations.jsx'
import useProgressDashboardData from './useProgressDashboardData.js'
import { syncNow, isSyncEnabled } from '../../lib/progress/userManager.js'
import Toast from '../../components/Toast.jsx'

// Styles moved to ProgressHeader.jsx

/**
 * Componente principal del dashboard de progreso
 */
export default function ProgressDashboard({ onNavigateHome, onNavigateToDrill }) {
  const settings = useSettings()
  const {
    heatMapData,
    errorIntel,
    userStats,
    weeklyGoals,
    weeklyProgress,
    recommendations,
    loading,
    error,
    refreshing,
    systemReady,
    refresh
  } = useProgressDashboardData()

  const [syncing, setSyncing] = React.useState(false)
  const [toast, setToast] = React.useState(null)
  const syncAvailable = isSyncEnabled()

  const handleSync = async () => {
    try {
      setSyncing(true)
      const res = await syncNow()
      if (res?.success) {
        setToast({ message: 'Sincronización completa', type: 'success' })
      } else {
        setToast({ message: 'No se pudo sincronizar (offline o deshabilitado)', type: 'info' })
      }
    } catch (e) {
      console.error('Error en sincronización:', e)
      setToast({ message: 'Error al sincronizar', type: 'error' })
    } finally {
      setSyncing(false)
    }
  }

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

  // Keep only component-specific effects (none at this moment)

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
      <ProgressHeader
        onNavigateHome={onNavigateHome}
        onNavigateToDrill={onNavigateToDrill}
        loading={loading}
        refreshing={refreshing}
        onRefresh={refresh}
        syncing={syncing}
        onSync={handleSync}
        syncEnabled={syncAvailable}
      />
      {toast?.message && (
        <Toast
          key={`${toast.type}-${toast.message}`}
          message={toast.message}
          type={toast.type}
          duration={1800}
          onClose={() => setToast(null)}
        />
      )}

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

      <WeeklyGoalsPanel weeklyGoals={weeklyGoals} weeklyProgress={weeklyProgress} userStats={userStats} />

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

      <GeneralRecommendations recommendations={recommendations} onSelect={handleGeneralRecommendation} />
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
