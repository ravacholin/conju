import React from 'react'
import { syncNow, isSyncEnabled } from '../../lib/progress/userManager/index.js'
import useProgressDashboardData from './useProgressDashboardData.js'
import Toast from '../../components/Toast.jsx'
import SafeComponent from '../../components/SafeComponent.jsx'
import { useSRSQueue } from '../../hooks/useSRSQueue.js'
import { useSettings } from '../../state/settings.js'

// New streamlined components
import ProgressOverview from './ProgressOverview.jsx'
import HeatMapSRS from './HeatMapSRS.jsx'
import SmartPractice from './SmartPractice.jsx'
import StudyInsights from './StudyInsights.jsx'
import PracticeReminders from './PracticeReminders.jsx'
import PronunciationStatsWidget from './PronunciationStatsWidget.jsx'
import AccuracyTrendCard from './AccuracyTrendCard.jsx'
import ErrorIntelligence from './ErrorIntelligence.jsx'
import SRSReviewQueue from './SRSReviewQueue.jsx'

import './progress-streamlined.css'
import { createLogger } from '../../lib/utils/logger.js'

const logger = createLogger('features:ProgressDashboard')


/**
 * Streamlined Progress Dashboard - Focused on actionable learning features
 * Consolidates 29+ components into 4 clean, purposeful sections
 */
export default function ProgressDashboard({ onNavigateHome, onNavigateToDrill }) {
  const [syncing, setSyncing] = React.useState(false)
  const [toast, setToast] = React.useState(null)
  const syncAvailable = isSyncEnabled()
  const settings = useSettings()
  const { stats: srsStats } = useSRSQueue()

  const {
    heatMapData,
    errorIntel,
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
      logger.error('Error en sincronización:', e)
      setToast({
        message: 'Error al sincronizar.',
        type: 'error'
      })
    } finally {
      setSyncing(false)
    }
  }

  // Handle SRS Review Now action
  const handleSRSReviewNow = React.useCallback(() => {
    if (!onNavigateToDrill) return

    settings.set({
      practiceMode: 'review',
      reviewSessionType: 'due',
      reviewSessionFilter: {}
    })
    onNavigateToDrill()
  }, [onNavigateToDrill, settings])

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

  if (!heatMapData && !error) {
    return null
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

      {/* SRS Review Queue Banner */}
      {srsStats && srsStats.total > 0 && (
        <div className="srs-review-banner" onClick={handleSRSReviewNow}>
          <div className="srs-banner-content">
            <img src="/icons/timer.png" alt="SRS Review" className="srs-banner-icon" />
            <div className="srs-banner-text">
              <strong>{srsStats.total}</strong> {srsStats.total === 1 ? 'elemento listo' : 'elementos listos'} para repasar
              {srsStats.overdue > 0 && (
                <span className="srs-urgent"> • {srsStats.overdue} {srsStats.overdue === 1 ? 'vencido' : 'vencidos'}</span>
              )}
            </div>
          </div>
          <button className="srs-banner-action">
            Revisar ahora →
          </button>
        </div>
      )}

      <SRSReviewQueue onNavigateToDrill={onNavigateToDrill} />

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

      <SafeComponent name="Accuracy Trend">
        <AccuracyTrendCard stats={pronunciationStats} />
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
          data={errorIntel}
          compact
          onNavigateToDrill={onNavigateToDrill}
        />
      </SafeComponent>
    </div>
  )
}
