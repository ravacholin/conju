import React from 'react'
import { syncNow, isSyncEnabled } from '../../lib/progress/userManager.js'
import useProgressDashboardData from './useProgressDashboardData.js'
import Toast from '../../components/Toast.jsx'
import SafeComponent from '../../components/SafeComponent.jsx'

// New streamlined components
import ProgressOverview from './ProgressOverview.jsx'
import HeatMapSRS from './HeatMapSRS.jsx'
import SmartPractice from './SmartPractice.jsx'
import StudyInsights from './StudyInsights.jsx'
import PracticeReminders from './PracticeReminders.jsx'
import PronunciationStatsWidget from './PronunciationStatsWidget.jsx'
import ErrorIntelligence from './ErrorIntelligence.jsx'

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
    studyPlan,
    loading,
    error,
    systemReady,
    refresh,
    practiceReminders,
    pronunciationStats
  } = useProgressDashboardData()

  const handleShowToast = React.useCallback((toastConfig) => {
    if (!toastConfig || !toastConfig.message) {
      return
    }
    setToast({
      message: toastConfig.message,
      type: toastConfig.type || 'info',
      duration: toastConfig.duration || 3200
    })
  }, [setToast])

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

  // Manual sync only - removed auto-sync to prevent double load on mount
  // Users can manually sync via the sync button if needed

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

      <SafeComponent name="Practice Reminders">
        <PracticeReminders
          reminders={practiceReminders}
          userStats={userStats}
          onNavigateToDrill={onNavigateToDrill}
          onShowToast={handleShowToast}
        />
      </SafeComponent>

      <SafeComponent name="Pronunciation Lab">
        <PronunciationStatsWidget
          stats={pronunciationStats}
          onNavigateToDrill={onNavigateToDrill}
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
          studyPlan={studyPlan}
          onNavigateToDrill={onNavigateToDrill}
        />
      </SafeComponent>

      <SafeComponent name="Error Intelligence">
        <ErrorIntelligence
          data={null}
          compact
          onNavigateToDrill={onNavigateToDrill}
        />
      </SafeComponent>
    </div>
  )
}
