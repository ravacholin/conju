import React from 'react'
import useProgressDashboardData from './useProgressDashboardData.js'
import Toast from '../../components/Toast.jsx'
import SafeComponent from '../../components/SafeComponent.jsx'
import { useSRSQueue } from '../../hooks/useSRSQueue.js'
import { useSettings } from '../../state/settings.js'
import { useSessionStore } from '../../state/session.js'
import { buildDrillSettingsUpdate } from './drillNavigationConfig.js'
import { createActionCooldown } from './actionCooldown.js'
import { safeLazy } from '../../lib/utils/lazyImport.js'
import { onProgressEvent, PROGRESS_EVENTS } from '../../lib/events/progressEventBus.js'
import AccountButton from '../../components/auth/AccountButton.jsx'
import SummaryStrip from './SummaryStrip.jsx'
import UnifiedPracticeAction from './UnifiedPracticeAction.jsx'
import DetailsPanel from './DetailsPanel.jsx'

const HeatMapSRS = safeLazy(() => import('./HeatMapSRS.jsx'))

import './progress-streamlined.css'
import { createLogger } from '../../lib/utils/logger.js'

const logger = createLogger('features:ProgressDashboard')

/**
 * Progress Dashboard — 5 sections:
 * [0] Header nav bar
 * [1] Summary strip (4 key numbers)
 * [2] Unified practice action (1 primary + 2 secondary)
 * [3] Heat map (mood × tense mastery)
 * [4] Details panel (expandable)
 */
export default function ProgressDashboard({
  onNavigateHome,
  onNavigateToDrill
}) {
  const [toast, setToast] = React.useState(null)
  const [detailsExpanded, setDetailsExpanded] = React.useState(false)
  const drillCooldownRef = React.useRef(createActionCooldown({ delayMs: 250 }))
  const setSettings = useSettings(state => state.set)
  const setDrillRuntimeContext = useSessionStore((state) => state.setDrillRuntimeContext)
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
    pronunciationStats,
    sectionsStatus,
    initialSectionsReady
  } = useProgressDashboardData({ enableSecondaryData: detailsExpanded })

  const applyDrillConfigAndNavigate = React.useCallback((drillConfig = {}) => {
    if (typeof onNavigateToDrill !== 'function') return

    drillCooldownRef.current.run(() => {
      setSettings(buildDrillSettingsUpdate(drillConfig))
      setDrillRuntimeContext({
        currentBlock: drillConfig?.currentBlock ?? null,
        reviewSessionType: drillConfig?.reviewSessionType || 'due',
        reviewSessionFilter: drillConfig?.reviewSessionFilter || {}
      })
      onNavigateToDrill()
    })
  }, [onNavigateToDrill, setSettings, setDrillRuntimeContext])

  React.useEffect(() => () => {
    drillCooldownRef.current.cancel()
  }, [])

  const handleSRSReview = React.useCallback(() => {
    applyDrillConfigAndNavigate({ practiceMode: 'review' })
  }, [applyDrillConfigAndNavigate])

  // Listen for progress navigation events (from heat map clicks)
  React.useEffect(() => {
    const handleNav = (detail) => {
      if (!detail || !onNavigateToDrill) return
      logger.debug('Progress navigation event received:', detail)
      onNavigateToDrill()
    }
    return onProgressEvent(PROGRESS_EVENTS.NAVIGATE, handleNav, { validate: true })
  }, [onNavigateToDrill])

  const getSectionState = React.useCallback((keys) => {
    const list = Array.isArray(keys) ? keys : [keys]
    if (list.some((k) => sectionsStatus?.[k] === 'error')) return 'error'
    if (list.some((k) => sectionsStatus?.[k] !== 'success')) return 'loading'
    return 'success'
  }, [sectionsStatus])

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
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Recargar</button>
      </div>
    )
  }

  const heatMapState = getSectionState(['heatMap'])

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

      {/* [0] Header Bar */}
      <nav className="dashboard-nav">
        <div className="dashboard-nav-left">
          <button type="button" className="nav-btn" onClick={() => window.history.back()} title="Volver">
            <img src="/back.png" alt="Volver" className="nav-icon" />
          </button>
          <button type="button" className="nav-btn" onClick={onNavigateHome} title="Inicio">
            <img src="/home.png" alt="Inicio" className="nav-icon" />
          </button>
          <button type="button" className="nav-btn logo-btn" onClick={() => onNavigateToDrill?.()} title="Practicar">
            <img src="/verbosmain.png" alt="Practicar" className="nav-icon logo-icon" />
          </button>
        </div>
        <AccountButton />
      </nav>

      {/* [1] Summary Strip */}
      <SafeComponent name="Summary">
        <SummaryStrip
          srsStats={srsStats}
          userStats={userStats}
          onSRSReview={handleSRSReview}
        />
      </SafeComponent>

      {/* [2] Unified Practice Action */}
      <SafeComponent name="Practice Action">
        <UnifiedPracticeAction
          srsStats={srsStats}
          userStats={userStats}
          heatMapData={heatMapData}
          errorIntel={errorIntel}
          onStartDrill={applyDrillConfigAndNavigate}
        />
      </SafeComponent>

      {/* [3] Heat Map */}
      <SafeComponent name="Heat Map">
        <React.Suspense fallback={<div className="section-placeholder"><span>Cargando mapa de calor...</span></div>}>
          {heatMapState === 'success' ? (
            <HeatMapSRS data={heatMapData} onNavigateToDrill={onNavigateToDrill} />
          ) : heatMapState === 'error' ? (
            <div className="section-placeholder section-placeholder-error">
              <span>No pudimos cargar el mapa de calor.</span>
              <button type="button" className="section-placeholder-action" onClick={refresh}>Reintentar</button>
            </div>
          ) : (
            <div className="section-placeholder">
              <div className="section-placeholder-spinner" />
              <span>Cargando mapa de calor...</span>
            </div>
          )}
        </React.Suspense>
      </SafeComponent>

      {/* [4] Details (expandable) */}
      <SafeComponent name="Details">
        <DetailsPanel
          errorIntel={errorIntel}
          userStats={userStats}
          studyPlan={studyPlan}
          onNavigateToDrill={onNavigateToDrill}
          expanded={detailsExpanded}
          onExpandChange={setDetailsExpanded}
        />
      </SafeComponent>
    </div>
  )
}
