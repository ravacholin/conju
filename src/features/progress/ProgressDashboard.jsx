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

import '../../components/onboarding/OnboardingFlow.css'
import './progress-streamlined.css'
import { createLogger } from '../../lib/utils/logger.js'

const logger = createLogger('features:ProgressDashboard')

const ACCENT = '#ff4d1c'
const INK    = '#f4f1ea'
const INK2   = '#6e6a60'
const INK3   = '#2a2823'

function Crosshairs() {
  const positions = [
    { top: 56, left: 12 },
    { top: 56, right: 12 },
    { bottom: 44, left: 12 },
    { bottom: 44, right: 12 },
  ]
  return positions.map((pos, i) => (
    <div key={i} className="vo-crosshair" style={pos}>
      <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
        <path d="M0 7H14M7 0V14" stroke={ACCENT} strokeWidth="1" />
      </svg>
    </div>
  ))
}

/**
 * Progress Dashboard — 5 sections:
 * [0] Header nav bar (VERB/OS)
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
      <div className="verbos-onboarding vp-shell">
        <div className="vo-grid" aria-hidden="true" />
        <div className="vo-vignette" aria-hidden="true" />
        <header className="vo-header">
          <div className="vo-logo">
            <div className="vo-logo-dot" style={{ background: ACCENT }} />
            <span className="vo-logo-name">
              VERB<span style={{ color: ACCENT }}>/</span>OS
            </span>
            <span style={{ marginLeft: 8, color: INK2 }}>progreso</span>
          </div>
        </header>
        <div className="vp-content vp-loading">
          <div className="vp-spinner" />
          <p style={{ color: INK2, fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            {!systemReady ? 'Inicializando...' : 'Cargando progreso...'}
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="verbos-onboarding vp-shell">
        <div className="vo-grid" aria-hidden="true" />
        <div className="vo-vignette" aria-hidden="true" />
        <header className="vo-header">
          <div className="vo-logo">
            <div className="vo-logo-dot" style={{ background: ACCENT }} />
            <span className="vo-logo-name">
              VERB<span style={{ color: ACCENT }}>/</span>OS
            </span>
          </div>
        </header>
        <div className="vp-content vp-loading">
          <p style={{ color: ACCENT, fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 12 }}>
            ERROR
          </p>
          <p style={{ color: INK2, fontSize: 13, marginBottom: 20 }}>{error}</p>
          <button className="vp-retry-btn" onClick={() => window.location.reload()}>
            Recargar
          </button>
        </div>
      </div>
    )
  }

  const heatMapState = getSectionState(['heatMap'])

  return (
    <div className="verbos-onboarding vp-shell">
      <div className="vo-grid" aria-hidden="true" />
      <div className="vo-vignette" aria-hidden="true" />
      <Crosshairs />

      {toast?.message && (
        <Toast
          key={`${toast.type}-${toast.message}`}
          message={toast.message}
          type={toast.type}
          duration={3000}
          onClose={() => setToast(null)}
        />
      )}

      {/* [0] VERB/OS Header */}
      <header className="vo-header">
        <div className="vo-logo">
          <button
            type="button"
            className="vp-back-btn"
            onClick={() => window.history.back()}
            title="Volver"
            aria-label="Volver"
          >
            ←
          </button>
          <div className="vo-logo-dot" style={{ background: ACCENT }} />
          <span
            className="vo-logo-name"
            style={{ cursor: 'pointer' }}
            onClick={onNavigateHome}
            title="Inicio"
          >
            VERB<span style={{ color: ACCENT }}>/</span>OS
          </span>
          <span style={{ marginLeft: 8, color: INK2 }}>progreso</span>
        </div>

        <div className="vo-breadcrumb" aria-label="Estadísticas">
          {userStats && (
            <>
              <span>
                <span className="vo-breadcrumb-label">racha </span>
                <span className="vo-breadcrumb-val">{userStats.streakDays || 0}d</span>
              </span>
              <span className="vo-breadcrumb-sep">/</span>
              <span>
                <span className="vo-breadcrumb-label">dominio </span>
                <span className="vo-breadcrumb-val">
                  {Math.round(Math.min(100, Math.max(0,
                    (userStats.totalMastery ?? userStats.overallMastery ?? userStats.averageMastery ?? 0) > 1
                      ? (userStats.totalMastery ?? userStats.overallMastery ?? userStats.averageMastery ?? 0)
                      : (userStats.totalMastery ?? userStats.overallMastery ?? userStats.averageMastery ?? 0) * 100
                  )))}%
                </span>
              </span>
            </>
          )}
        </div>

        <AccountButton />
      </header>

      {/* Scrollable content */}
      <div className="vp-content vo-noscroll">
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

      {/* VERB/OS Footer */}
      <footer className="vo-footer">
        <div className="vo-footer-hints">
          <span><em>↑↓</em> navegar</span>
          <span><em>←</em> volver</span>
        </div>
        <div style={{ color: INK3 }}>VERB/OS · PROGRESS</div>
        <div style={{ color: INK3 }}>OK</div>
      </footer>
    </div>
  )
}
