import React from 'react'
import SafeComponent from '../../components/SafeComponent.jsx'
import { safeLazy } from '../../lib/utils/lazyImport.js'

const AccuracyTrendCard = safeLazy(() => import('./AccuracyTrendCard.jsx'))
const ErrorIntelligence = safeLazy(() => import('./ErrorIntelligence.jsx'))
import LearningJourneyPanel from './LearningJourneyPanel.jsx'

export default function DetailsPanel({
  pronunciationStats,
  errorIntel,
  userStats,
  studyPlan,
  onNavigateToDrill,
  expanded,
  onExpandChange
}) {
  const toggleExpanded = () => {
    onExpandChange?.(!expanded)
  }

  return (
    <section className="details-panel">
      <button
        type="button"
        className="details-toggle"
        onClick={toggleExpanded}
      >
        {expanded ? 'Ocultar detalles' : 'Ver más'}
      </button>

      {expanded && (
        <div className="details-content">
          <SafeComponent name="Accuracy Trend">
            <React.Suspense fallback={<div className="section-placeholder"><span>Cargando tendencia...</span></div>}>
              <AccuracyTrendCard stats={pronunciationStats} />
            </React.Suspense>
          </SafeComponent>

          <SafeComponent name="Error Intelligence">
            <React.Suspense fallback={<div className="section-placeholder"><span>Cargando errores...</span></div>}>
              <ErrorIntelligence data={errorIntel} onNavigateToDrill={onNavigateToDrill} />
            </React.Suspense>
          </SafeComponent>

          <SafeComponent name="Learning Journey">
            <LearningJourneyPanel
              userStats={userStats}
              studyPlan={studyPlan}
              onNavigateToDrill={onNavigateToDrill}
            />
          </SafeComponent>
        </div>
      )}
    </section>
  )
}
