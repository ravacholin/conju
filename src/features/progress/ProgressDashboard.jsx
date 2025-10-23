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
import ErrorIntelligence from './ErrorIntelligence.jsx'

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

  // Handle SRS Review Now action
  const handleSRSReviewNow = React.useCallback(() => {
    if (!onNavigateToDrill) return

    settings.set({
      practiceMode: 'review',
      reviewSessionType: 'due'
    })
    onNavigateToDrill()
  }, [onNavigateToDrill, settings])

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
  const remindersState = getSectionState(['userStats', 'weeklyGoals', 'weeklyProgress', 'dailyChallenges'])
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

      <SafeComponent name="Practice Reminders">
        {renderSection(
          remindersState,
          (
            <PracticeReminders
              reminders={practiceReminders}
              userStats={userStats}
              onNavigateToDrill={onNavigateToDrill}
              onShowToast={handleShowToast}
            />
          ),
          'Preparando recordatorios personalizados...',
          'No pudimos generar tus recordatorios.'
        )}
      </SafeComponent>

      <SafeComponent name="Pronunciation Lab">
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
      </SafeComponent>

      <SafeComponent name="Heat Map & SRS">
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
      </SafeComponent>

      <SafeComponent name="Smart Practice">
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
      </SafeComponent>

      <SafeComponent name="Study Insights">
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
      </SafeComponent>

      <SafeComponent name="Error Intelligence">
        {renderSection(
          errorIntelState,
          (
            <ErrorIntelligence
              data={errorIntel}
              compact
              onNavigateToDrill={onNavigateToDrill}
            />
          ),
          'Buscando patrones de error...',
          'No pudimos cargar el módulo de errores.'
        )}
      </SafeComponent>
    </div>
  )
}
