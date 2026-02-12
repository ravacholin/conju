import React from 'react'
import { syncNow, isSyncEnabled } from '../../lib/progress/userManager/index.js'
import useProgressDashboardData from './useProgressDashboardData.js'
import Toast from '../../components/Toast.jsx'
import SafeComponent from '../../components/SafeComponent.jsx'
import { useSRSQueue } from '../../hooks/useSRSQueue.js'
import { useSettings } from '../../state/settings.js'
import { buildDrillSettingsUpdate } from './drillNavigationConfig.js'
import { safeLazy } from '../../lib/utils/lazyImport.js'

// New streamlined components
import ProgressOverview from './ProgressOverview.jsx'
import PracticeReminders from './PracticeReminders.jsx'
import DailyPlanPanel from './DailyPlanPanel.jsx'
import ProgressUnlocksPanel from './ProgressUnlocksPanel.jsx'
import LearningJourneyPanel from './LearningJourneyPanel.jsx'
import CoachModePanel from './CoachModePanel.jsx'
import FocusModePanel from './FocusModePanel.jsx'
import FrequentErrorsPanel from './FrequentErrorsPanel.jsx'
const HeatMapSRS = safeLazy(() => import('./HeatMapSRS.jsx'))
const SmartPractice = safeLazy(() => import('./SmartPractice.jsx'))
const StudyInsights = safeLazy(() => import('./StudyInsights.jsx'))
const PronunciationStatsWidget = safeLazy(() => import('./PronunciationStatsWidget.jsx'))
const AccuracyTrendCard = safeLazy(() => import('./AccuracyTrendCard.jsx'))
const ErrorIntelligence = safeLazy(() => import('./ErrorIntelligence.jsx'))

import './progress-streamlined.css'
import { createLogger } from '../../lib/utils/logger.js'

const logger = createLogger('features:ProgressDashboard')


/**
 * Streamlined Progress Dashboard - Focused on actionable learning features
 * Consolidates 29+ components into 4 clean, purposeful sections
 */
export default function ProgressDashboard({
  onNavigateHome,
  onNavigateToDrill,
  onNavigateToStory,
  onNavigateToTimeline
}) {
  const [syncing, setSyncing] = React.useState(false)
  const [toast, setToast] = React.useState(null)
  const syncAvailable = isSyncEnabled()
  const setSettings = useSettings(state => state.set)
  const { stats: srsStats } = useSRSQueue()

  const {
    heatMapData,
    errorIntel,
    userStats,
    studyPlan,
    practiceReminders,
    loading,
    error,
    systemReady,
    refresh,
    pronunciationStats,
    sectionsStatus,
    initialSectionsReady
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

  const applyDrillConfigAndNavigate = React.useCallback((drillConfig = {}) => {
    if (typeof onNavigateToDrill !== 'function') {
      return
    }

    setSettings(buildDrillSettingsUpdate(drillConfig))
    onNavigateToDrill()
  }, [onNavigateToDrill, setSettings])

  const handleStartPlannedSession = React.useCallback((session) => {
    if (!session || typeof onNavigateToDrill !== 'function') {
      return
    }

    const drillConfig = session.drillConfig || {}
    applyDrillConfigAndNavigate(drillConfig)
  }, [applyDrillConfigAndNavigate, onNavigateToDrill])

  // Handle SRS Review Now action
  const handleSRSReviewNow = React.useCallback(() => {
    if (!onNavigateToDrill) return

    applyDrillConfigAndNavigate({ practiceMode: 'review' })
  }, [applyDrillConfigAndNavigate, onNavigateToDrill])

  const handleStartCoachSession = React.useCallback((sessionPlan) => {
    if (!sessionPlan?.drillConfig || typeof onNavigateToDrill !== 'function') {
      return
    }

    applyDrillConfigAndNavigate(sessionPlan.drillConfig)
  }, [applyDrillConfigAndNavigate, onNavigateToDrill])

  const handleStartFocusTrack = React.useCallback((track) => {
    if (!track?.drillConfig || typeof onNavigateToDrill !== 'function') {
      return
    }

    applyDrillConfigAndNavigate(track.drillConfig)
  }, [applyDrillConfigAndNavigate, onNavigateToDrill])

  const handleStartCorrectiveDrill = React.useCallback((item) => {
    if (!item?.mood || !item?.tense || typeof onNavigateToDrill !== 'function') {
      return
    }

    applyDrillConfigAndNavigate({
      practiceMode: 'specific',
      specificMood: item.mood,
      specificTense: item.tense
    })
  }, [applyDrillConfigAndNavigate, onNavigateToDrill])

  // Listen for progress navigation events (from heat map clicks, etc.)
  React.useEffect(() => {
    const handleProgressNavigate = (event) => {
      const { detail } = event
      if (!detail || !onNavigateToDrill) return

      try {
        // Settings are already set by the component that dispatched the event
        // Just navigate to drill mode - DrillMode will handle the rest
        logger.debug('Progress navigation event received:', detail)
        onNavigateToDrill()
      } catch (error) {
        logger.error('Error handling progress navigation:', error)
      }
    }

    window.addEventListener('progress:navigate', handleProgressNavigate)
    return () => window.removeEventListener('progress:navigate', handleProgressNavigate)
  }, [onNavigateToDrill])

  // Manual sync only - removed auto-sync to prevent double load on mount
  // Users can manually sync via the sync button if needed

  const getSectionState = React.useCallback((keys) => {
    const list = Array.isArray(keys) ? keys : [keys]

    if (list.some((key) => sectionsStatus?.[key] === 'error')) {
      return 'error'
    }

    if (list.some((key) => sectionsStatus?.[key] !== 'success')) {
      return 'loading'
    }

    return 'success'
  }, [sectionsStatus])

  const renderSection = (state, component, placeholderText, errorText) => {
    if (state === 'success') {
      return component
    }

    if (state === 'error') {
      return (
        <div className="section-placeholder section-placeholder-error">
          <span>{errorText || 'No pudimos cargar esta sección.'}</span>
          <button type="button" className="section-placeholder-action" onClick={refresh}>
            Reintentar
          </button>
        </div>
      )
    }

    return (
      <div className="section-placeholder">
        <div className="section-placeholder-spinner" />
        <span>{placeholderText}</span>
      </div>
    )
  }

  if (loading && !initialSectionsReady) {
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

  const overviewState = getSectionState(['userStats'])
  const pronunciationState = getSectionState(['pronunciationStats'])
  const heatMapState = getSectionState(['heatMap'])
  const smartPracticeState = getSectionState(['heatMap', 'recommendations'])
  const insightsState = getSectionState(['userStats', 'heatMap', 'studyPlan', 'advancedAnalytics'])
  const errorIntelState = getSectionState(['errorIntel'])

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

      <SafeComponent name="Practice Reminders">
        <PracticeReminders
          reminders={practiceReminders}
          userStats={userStats}
          onNavigateToDrill={onNavigateToDrill}
          onShowToast={handleShowToast}
        />
      </SafeComponent>

      <SafeComponent name="Daily Plan">
        <DailyPlanPanel
          studyPlan={studyPlan}
          onStartSession={handleStartPlannedSession}
        />
      </SafeComponent>

      <SafeComponent name="Learning Journey">
        <LearningJourneyPanel
          userStats={userStats}
          studyPlan={studyPlan}
          onNavigateToDrill={onNavigateToDrill}
        />
      </SafeComponent>

      <SafeComponent name="Coach Mode">
        <CoachModePanel
          userStats={userStats}
          heatMapData={heatMapData}
          onStartCoach={handleStartCoachSession}
        />
      </SafeComponent>

      <SafeComponent name="Focus Mode">
        <FocusModePanel
          userStats={userStats}
          heatMapData={heatMapData}
          onStartFocusTrack={handleStartFocusTrack}
        />
      </SafeComponent>

      <SafeComponent name="Frequent Errors">
        <FrequentErrorsPanel
          errorIntel={errorIntel}
          onStartCorrectiveDrill={handleStartCorrectiveDrill}
        />
      </SafeComponent>

      <SafeComponent name="Progress Unlocks">
        <ProgressUnlocksPanel
          userStats={userStats}
          onNavigateToStory={onNavigateToStory}
          onNavigateToTimeline={onNavigateToTimeline}
        />
      </SafeComponent>



      <SafeComponent name="Progress Overview">
        {renderSection(
          overviewState,
          (
            <ProgressOverview
              userStats={userStats}
              onNavigateHome={onNavigateHome}
              onNavigateToDrill={onNavigateToDrill}
              syncing={syncing}
              onSync={handleSync}
              syncEnabled={syncAvailable}
              onRefresh={refresh}
            />
          ),
          'Cargando resumen de progreso...',
          'No pudimos obtener tus estadísticas.'
        )}
      </SafeComponent>

      <SafeComponent name="Accuracy Trend">
        <React.Suspense fallback={<div className="section-placeholder"><span>Cargando tendencia...</span></div>}>
          <AccuracyTrendCard stats={pronunciationStats} />
        </React.Suspense>
      </SafeComponent>



      <SafeComponent name="Pronunciation Lab">
        <React.Suspense fallback={<div className="section-placeholder"><span>Analizando estadísticas de pronunciación...</span></div>}>
          {renderSection(
            pronunciationState,
            (
              <PronunciationStatsWidget
                stats={pronunciationStats}
                onNavigateToDrill={onNavigateToDrill}
              />
            ),
            'Analizando estadísticas de pronunciación...',
            'No pudimos cargar las estadísticas de pronunciación.'
          )}
        </React.Suspense>
      </SafeComponent>

      <SafeComponent name="Heat Map & SRS">
        <React.Suspense fallback={<div className="section-placeholder"><span>Cargando mapa de calor...</span></div>}>
          {renderSection(
            heatMapState,
            (
              <HeatMapSRS
                data={heatMapData}
                onNavigateToDrill={onNavigateToDrill}
              />
            ),
            'Cargando mapa de calor...',
            'No pudimos cargar el mapa de calor.'
          )}
        </React.Suspense>
      </SafeComponent>

      <SafeComponent name="Smart Practice">
        <React.Suspense fallback={<div className="section-placeholder"><span>Generando práctica inteligente...</span></div>}>
          {renderSection(
            smartPracticeState,
            (
              <SmartPractice
                heatMapData={heatMapData}
                userStats={userStats}
                onNavigateToDrill={onNavigateToDrill}
              />
            ),
            'Generando práctica inteligente...',
            'No pudimos preparar la práctica inteligente.'
          )}
        </React.Suspense>
      </SafeComponent>

      <SafeComponent name="Error Intelligence">
        <React.Suspense fallback={<div className="section-placeholder"><span>Cargando errores comunes...</span></div>}>
          {renderSection(
            errorIntelState,
            (
              <ErrorIntelligence data={errorIntel} onNavigateToDrill={onNavigateToDrill} />
            ),
            'Cargando errores comunes...',
            'No pudimos cargar el análisis de errores.'
          )}
        </React.Suspense>
      </SafeComponent>

      <SafeComponent name="Study Insights">
        <React.Suspense fallback={<div className="section-placeholder"><span>Calculando recomendaciones avanzadas...</span></div>}>
          {renderSection(
            insightsState,
            (
              <StudyInsights
                userStats={userStats}
                heatMapData={heatMapData}
                studyPlan={studyPlan}
                onNavigateToDrill={onNavigateToDrill}
              />
            ),
            'Calculando recomendaciones avanzadas...',
            'No pudimos calcular las analíticas de estudio.'
          )}
        </React.Suspense>
      </SafeComponent>

    </div>
  )
}
