import React from 'react'
import { syncNow, isSyncEnabled } from '../../lib/progress/userManager/index.js'
import {
  initializePlan,
  getPlanProgress,
  getActivePlan,
  markSessionAsStarted
} from '../../lib/progress/planTracking.js'
import { generatePersonalizedStudyPlan } from '../../lib/progress/studyPlans.js'
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


const emptyPlanProgress = {
  completed: 0,
  total: 0,
  percentage: 0,
  nextSession: null,
  activePlan: null
}


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

  const [planProgress, setPlanProgress] = React.useState(() => {
    try {
      return getPlanProgress() || emptyPlanProgress
    } catch (error) {
      logger.warn('No se pudo obtener el progreso del plan activo al iniciar', error)
      return emptyPlanProgress
    }
  })
  const [generatingPlan, setGeneratingPlan] = React.useState(false)

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

  const updatePlanProgress = React.useCallback(() => {
    try {
      const progress = getPlanProgress()
      setPlanProgress((prev) => {
        const next = progress || emptyPlanProgress

        if (
          prev
          && prev.completed === next.completed
          && prev.total === next.total
          && prev.percentage === next.percentage
          && prev.nextSession === next.nextSession
          && prev.activePlan === next.activePlan
        ) {
          return prev
        }

        return next
      })
    } catch (error) {
      logger.warn('No se pudo actualizar el progreso del plan activo', error)
      setPlanProgress(emptyPlanProgress)
    }
  }, [])

  React.useEffect(() => {
    updatePlanProgress()

    const handlePlanUpdate = () => updatePlanProgress()
    window.addEventListener('progress:plan-updated', handlePlanUpdate)
    window.addEventListener('progress:plan-invalidated', handlePlanUpdate)
    window.addEventListener('progress:plan-completed', handlePlanUpdate)

    return () => {
      window.removeEventListener('progress:plan-updated', handlePlanUpdate)
      window.removeEventListener('progress:plan-invalidated', handlePlanUpdate)
      window.removeEventListener('progress:plan-completed', handlePlanUpdate)
    }
  }, [updatePlanProgress])

  React.useEffect(() => {
    const hasSessions = Array.isArray(studyPlan?.sessionBlueprints?.sessions)
      && studyPlan.sessionBlueprints.sessions.length > 0

    if (!hasSessions) {
      return
    }

    try {
      const activePlan = getActivePlan()
      const generatedAt = studyPlan.generatedAt || null

      if (activePlan && generatedAt && activePlan.generatedAt === generatedAt) {
        updatePlanProgress()
        return
      }

      const initialized = initializePlan(studyPlan)
      if (initialized) {
        updatePlanProgress()
      }
    } catch (error) {
      logger.warn('No se pudo inicializar el plan personalizado', error)
    }
  }, [studyPlan, updatePlanProgress])

  const nextSessionBlueprint = React.useMemo(() => {
    if (!studyPlan?.sessionBlueprints?.sessions || !planProgress?.nextSession) {
      return null
    }

    const sessions = studyPlan.sessionBlueprints.sessions
    return sessions.find(session => {
      const sessionId = session.id || session.sessionId
      return sessionId === planProgress.nextSession.sessionId
    }) || null
  }, [studyPlan, planProgress])

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

  const handleGeneratePlan = React.useCallback(async () => {
    if (generatingPlan) return

    setGeneratingPlan(true)
    try {
      await generatePersonalizedStudyPlan(null, { forceRefresh: true })
      await refresh()
      handleShowToast({
        message: 'Nuevo plan generado. Revisá tus sesiones recomendadas.',
        type: 'success'
      })
    } catch (error) {
      logger.error('No se pudo generar el plan personalizado', error)
      handleShowToast({
        message: 'No pudimos generar el plan. Intentá nuevamente.',
        type: 'error'
      })
    } finally {
      setGeneratingPlan(false)
    }
  }, [generatingPlan, refresh, handleShowToast])

  // Handle SRS Review Now action
  const handleSRSReviewNow = React.useCallback(() => {
    if (!onNavigateToDrill) return

    settings.set({
      practiceMode: 'review',
      reviewSessionType: 'due'
    })
    onNavigateToDrill()
  }, [onNavigateToDrill, settings])

  const handleStartStudyPlan = React.useCallback(() => {
    const nextSession = planProgress?.nextSession

    if (!nextSession || !nextSession.config) {
      handleShowToast({
        message: 'No hay una sesión disponible en tu plan activo.',
        type: 'info'
      })
      return
    }

    try {
      const started = markSessionAsStarted(nextSession.sessionId)
      if (!started) {
        handleShowToast({
          message: 'No pudimos iniciar la sesión del plan.',
          type: 'error'
        })
        return
      }

      settings.set({
        ...nextSession.config,
        activeSessionId: nextSession.sessionId,
        activePlanId: planProgress?.activePlan?.planId || null
      })

      if (onNavigateToDrill) {
        onNavigateToDrill()
      }
    } catch (error) {
      logger.error('No se pudo iniciar el plan activo', error)
      handleShowToast({
        message: 'Ocurrió un error al iniciar el plan.',
        type: 'error'
      })
    }
  }, [planProgress, settings, onNavigateToDrill, handleShowToast])

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

      {studyPlan ? (
        <div className="study-plan-summary-card" data-testid="plan-summary-card">
          <div className="plan-summary-info">
            <h3>Plan personalizado activo</h3>
            <p>
              Enfoque: {studyPlan?.overview?.focusArea || 'progreso equilibrado'} ·{' '}
              {studyPlan?.timeline?.sessionsPerWeek || 0} sesiones/semana
            </p>
            <div className="plan-summary-progress">
              <div className="plan-summary-progress-bar" aria-hidden="true">
                <div
                  className="plan-summary-progress-fill"
                  style={{ width: `${Math.min(planProgress?.percentage ?? 0, 100)}%` }}
                />
              </div>
              <span className="plan-summary-progress-label">
                {planProgress?.completed || 0} de {planProgress?.total || 0} sesiones completadas
              </span>
            </div>
          </div>

          <div className="plan-summary-actions">
            {nextSessionBlueprint ? (
              <div className="plan-next-session">
                <span className="plan-next-session-label">Próxima sesión</span>
                <strong>{nextSessionBlueprint.title || 'Sesión guiada'}</strong>
                <span className="plan-next-session-meta">
                  {nextSessionBlueprint.estimatedDuration || 'Duración flexible'} ·{' '}
                  {nextSessionBlueprint.difficulty || 'Medio'}
                </span>
              </div>
            ) : (
              <div className="plan-next-session">
                <span className="plan-next-session-label">Plan completo</span>
                <strong>Generá un nuevo plan para seguir avanzando</strong>
              </div>
            )}

            <button
              type="button"
              className="plan-summary-action"
              onClick={nextSessionBlueprint ? handleStartStudyPlan : handleGeneratePlan}
              disabled={generatingPlan && !nextSessionBlueprint}
            >
              {nextSessionBlueprint
                ? planProgress?.nextSession?.status === 'in-progress'
                  ? 'Retomar plan'
                  : 'Iniciar plan'
                : generatingPlan
                  ? 'Generando…'
                  : 'Generar nuevo plan'}
            </button>
          </div>
        </div>
      ) : (
        <div className="study-plan-summary-card empty" data-testid="plan-summary-empty">
          <div className="plan-summary-info">
            <h3>Plan personalizado</h3>
            <p>Generá un plan guiado con sesiones recomendadas para tus objetivos.</p>
          </div>
          <button
            type="button"
            className="plan-summary-action"
            onClick={handleGeneratePlan}
            disabled={generatingPlan}
          >
            {generatingPlan ? 'Generando…' : 'Generar plan'}
          </button>
        </div>
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
          data={errorIntel}
          compact
          onNavigateToDrill={onNavigateToDrill}
        />
      </SafeComponent>
    </div>
  )
}
