import React from 'react'
import { useSettings } from '../../state/settings.js'
import { syncNow, isSyncEnabled } from '../../lib/progress/userManager.js'
import useProgressDashboardData from './useProgressDashboardData.js'
import Toast from '../../components/Toast.jsx'
import SafeComponent from '../../components/SafeComponent.jsx'

// New streamlined components
import ProgressOverview from './ProgressOverview.jsx'
import HeatMapSRS from './HeatMapSRS.jsx'
import SmartPractice from './SmartPractice.jsx'
import StudyInsights from './StudyInsights.jsx'
import DailyChallengesPanel from './DailyChallengesPanel.jsx'

import './progress-streamlined.css'

/**
 * Streamlined Progress Dashboard - Focused on actionable learning features
 * Consolidates 29+ components into 4 clean, purposeful sections
 */
export default function ProgressDashboard({ onNavigateHome, onNavigateToDrill }) {
  const [syncing, setSyncing] = React.useState(false)
  const [toast, setToast] = React.useState(null)
  const syncAvailable = isSyncEnabled()

  const {
    heatMapData,
    userStats,
    dailyChallenges,
    loading,
    error,
    systemReady,
    refresh,
    completeChallenge
  } = useProgressDashboardData()

  const handleSync = async () => {
    try {
      if (!syncAvailable) {
        setToast({
          message: 'Sincronización no disponible.',
          type: 'info'
        })
        return
      }

      setSyncing(true)
      const res = await syncNow()

      if (res?.success) {
        setToast({
          message: 'Sincronización completa.',
          type: 'success'
        })
        refresh()
      } else {
        setToast({
          message: 'Error al sincronizar. Verificá tu conexión.',
          type: 'error'
        })
      }
    } catch (e) {
      console.error('Error en sincronización:', e)
      setToast({
        message: 'Error al sincronizar.',
        type: 'error'
      })
    } finally {
      setSyncing(false)
    }
  }

  // Auto-sync on mount
  React.useEffect(() => {
    if (syncAvailable && !loading && systemReady) {
      handleSync()
    }
  }, [syncAvailable, loading, systemReady])

  if (loading) {
    return (
      <div className="progress-dashboard loading">
        <div className="spinner"></div>
        <p>{!systemReady ? 'Inicializando...' : 'Cargando progreso...'}</p>
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
      {toast?.message && (
        <Toast
          key={`${toast.type}-${toast.message}`}
          message={toast.message}
          type={toast.type}
          duration={3000}
          onClose={() => setToast(null)}
        />
      )}

      <SafeComponent name="Progress Overview">
        <ProgressOverview
          userStats={userStats}
          onNavigateHome={onNavigateHome}
          onNavigateToDrill={onNavigateToDrill}
          syncing={syncing}
          onSync={handleSync}
          syncEnabled={syncAvailable}
          onRefresh={refresh}
        />
      </SafeComponent>

      <SafeComponent name="Daily Challenges">
        <DailyChallengesPanel
          dailyChallenges={dailyChallenges}
          onCompleteChallenge={completeChallenge}
        />
      </SafeComponent>

      <SafeComponent name="Heat Map & SRS">
        <HeatMapSRS
          data={heatMapData}
          onNavigateToDrill={onNavigateToDrill}
        />
      </SafeComponent>

      <SafeComponent name="Smart Practice">
        <SmartPractice
          heatMapData={heatMapData}
          userStats={userStats}
          onNavigateToDrill={onNavigateToDrill}
        />
      </SafeComponent>

      <SafeComponent name="Study Insights">
        <StudyInsights
          userStats={userStats}
          heatMapData={heatMapData}
        />
      </SafeComponent>
    </div>
  )
}