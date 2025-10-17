import React, { useState, useMemo, useCallback } from 'react'
import { formatMoodTense } from '../../lib/utils/verbLabels.js'
import { generatePersonalizedStudyPlan } from '../../lib/progress/studyPlans.js'
import PersonalizedPlanPanel from './PersonalizedPlanPanel.jsx'
import { createLogger } from '../../lib/utils/logger.js'

const logger = createLogger('features:StudyInsights')


function StudyPlanSection({ plan, onGeneratePlan, onNavigateToDrill, generating, error }) {
  if (!plan) {
    return (
      <div className="study-plan-section empty">
        <div className="section-subheader">
          <h3>Plan de estudio personalizado</h3>
          <p>Generá un plan guiado con sesiones recomendadas para tu nivel.</p>
        </div>
        <button
          type="button"
          className="primary-button"
          onClick={onGeneratePlan}
          disabled={generating}
        >
          {generating ? 'Generando…' : 'Generar plan'}
        </button>
        {error && <p className="error-text">{error}</p>}
      </div>
    )
  }

  // Si hay plan, usar PersonalizedPlanPanel para mostrar todo
  return (
    <PersonalizedPlanPanel
      plan={plan}
      onRefresh={onGeneratePlan}
      onNavigateToDrill={onNavigateToDrill}
    />
  )
}

/**
 * Study Insights - Minimal, collapsible analytics for users who want detail
 * Replaces: AdvancedAnalyticsPanel, CommunityPulse, DailyChallengesPanel
 */
export default function StudyInsights({ userStats, heatMapData, studyPlan, onNavigateToDrill }) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [generatingPlan, setGeneratingPlan] = useState(false)
  const [planError, setPlanError] = useState(null)

  // Calculate useful insights
  const insights = useMemo(() => {
    if (!userStats || !heatMapData?.heatMap) {
      return {
        totalSessions: 0,
        averageAccuracy: 0,
        strongestArea: null,
        weekestArea: null,
        totalProgress: 0
      }
    }

    const heatMap = heatMapData.heatMap
    const stats = userStats

    // Find strongest and weakest areas
    const areas = Object.entries(heatMap)
      .filter(([, data]) => data.attempts >= 3)
      .map(([combo, data]) => ({
        combo,
        mastery: data.mastery,
        attempts: data.attempts
      }))

    const strongestArea = areas.length > 0
      ? areas.reduce((best, current) => current.mastery > best.mastery ? current : best)
      : null

    const weakestArea = areas.length > 0
      ? areas.reduce((worst, current) => current.mastery < worst.mastery ? current : worst)
      : null

    // Calculate total progress (areas with >60% mastery)
    const masteredAreas = areas.filter(area => area.mastery >= 0.6).length
    const totalAreas = areas.length || 1
    const totalProgress = masteredAreas / totalAreas

    return {
      totalSessions: stats.totalAttempts || 0,
      averageAccuracy: stats.overallAccuracy || 0,
      strongestArea,
      weakestArea,
      totalProgress,
      areasCount: totalAreas
    }
  }, [userStats, heatMapData])

  const getMoodTenseLabel = (combo) => {
    const [mood, tense] = combo.split('-')
    return formatMoodTense(mood, tense)
  }

  const handleGeneratePlan = useCallback(async () => {
    if (generatingPlan) return
    setPlanError(null)
    try {
      setGeneratingPlan(true)
      await generatePersonalizedStudyPlan(null, { forceRefresh: true })
    } catch (error) {
      logger.error('No se pudo generar el plan de estudio', error)
      setPlanError('No pudimos generar el plan. Intentá nuevamente en unos segundos.')
    } finally {
      setGeneratingPlan(false)
    }
  }, [generatingPlan])

  if (insights.totalSessions === 0) {
    return (
      <div className="study-insights empty">
        <div className="section-header">
          <h2>
            <img src="/icons/chart.png" alt="Estadísticas" className="section-icon" />
            Estadísticas de Estudio
          </h2>
        </div>
        <div className="empty-state">
          <img src="/icons/chart.png" alt="Sin datos" className="empty-icon" />
          <p>Completa algunos ejercicios para ver tus estadísticas de progreso.</p>
          <StudyPlanSection
            plan={studyPlan}
            onGeneratePlan={handleGeneratePlan}
            onNavigateToDrill={onNavigateToDrill}
            generating={generatingPlan}
            error={planError}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="study-insights">
      <div className="section-header" onClick={() => setIsExpanded(!isExpanded)}>
        <h2>
          <img src="/icons/chart.png" alt="Estadísticas" className="section-icon" />
          Estadísticas de Estudio
          <span className={`expand-arrow ${isExpanded ? 'expanded' : ''}`}>
            {isExpanded ? '▼' : '▶'}
          </span>
        </h2>
        <p>Detalles sobre tu progreso y rendimiento</p>
      </div>

      {isExpanded && (
        <div className="insights-content">
          {/* Quick Stats */}
          <div className="insights-grid">
            <div className="insight-card">
              <div className="insight-value">{insights.totalSessions}</div>
              <div className="insight-label">Ejercicios completados</div>
            </div>

            <div className="insight-card">
              <div className="insight-value">
                {Math.round(insights.averageAccuracy * 100)}%
              </div>
              <div className="insight-label">Precisión promedio</div>
            </div>

            <div className="insight-card">
              <div className="insight-value">
                {Math.round(insights.totalProgress * 100)}%
              </div>
              <div className="insight-label">Progreso general</div>
            </div>

            <div className="insight-card">
              <div className="insight-value">{insights.areasCount}</div>
              <div className="insight-label">Áreas practicadas</div>
            </div>
          </div>

          {/* Strongest/Weakest Areas */}
          {(insights.strongestArea || insights.weakestArea) && (
            <div className="areas-summary">
              {insights.strongestArea && (
                <div className="area-highlight strong">
                  <div className="area-icon">
                    <img src="/icons/trophy.png" alt="Fuerte" className="inline-icon" />
                  </div>
                  <div className="area-content">
                    <div className="area-label">Área más fuerte</div>
                    <div className="area-name">
                      {getMoodTenseLabel(insights.strongestArea.combo)}
                    </div>
                    <div className="area-score">
                      {Math.round(insights.strongestArea.mastery * 100)}% de dominio
                    </div>
                  </div>
                </div>
              )}

              {insights.weakestArea && (
                <div className="area-highlight weak">
                  <div className="area-icon">
                    <img src="/diana.png" alt="Débil" className="inline-icon" />
                  </div>
                  <div className="area-content">
                    <div className="area-label">Área por mejorar</div>
                    <div className="area-name">
                      {getMoodTenseLabel(insights.weakestArea.combo)}
                    </div>
                    <div className="area-score">
                      {Math.round(insights.weakestArea.mastery * 100)}% de dominio
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Progress motivation */}
          <div className="progress-motivation">
            <div className="motivation-content">
              <img src="/icons/lightbulb.png" alt="Consejo" className="motivation-icon" />
              <div className="motivation-text">
                {insights.totalProgress >= 0.8 ? (
                  <>
                    <strong>¡Excelente progreso!</strong> Dominas la mayoría de las áreas.
                    Considera explorar tiempos más avanzados.
                  </>
                ) : insights.totalProgress >= 0.5 ? (
                  <>
                    <strong>Buen avance.</strong> Sigue practicando las áreas más débiles
                    para consolidar tu conocimiento.
                  </>
                ) : (
                  <>
                    <strong>Sigue adelante.</strong> La práctica constante es clave.
                    Enfócate en dominar los tiempos básicos primero.
                  </>
                )}
              </div>
            </div>
          </div>

          <StudyPlanSection
            plan={studyPlan}
            onGeneratePlan={handleGeneratePlan}
            onNavigateToDrill={onNavigateToDrill}
            generating={generatingPlan}
            error={planError}
          />
        </div>
      )}
    </div>
  )
}