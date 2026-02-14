import React, { useMemo } from 'react'
import { buildCoachSessionPlan } from './coachSessionPlan.js'
import { buildFocusTracks } from './focusTracks.js'
import { buildFrequentErrorsPlan } from './frequentErrorsPlan.js'

function pickPrimaryAction({ srsStats, userStats, heatMapData, errorIntel }) {
  // Priority 1: SRS overdue items
  if (srsStats?.overdue > 0) {
    return {
      title: `Repasar ${srsStats.overdue} elemento${srsStats.overdue !== 1 ? 's' : ''} vencido${srsStats.overdue !== 1 ? 's' : ''}`,
      reason: 'El repaso espaciado es más efectivo cuando no se acumula.',
      drillConfig: { practiceMode: 'review', reviewSessionType: 'due', reviewSessionFilter: {} },
      type: 'srs'
    }
  }

  // Priority 2: Frequent errors with enough data
  const errorsPlan = buildFrequentErrorsPlan(errorIntel)
  if (errorsPlan.items.length > 0) {
    const top = errorsPlan.items[0]
    return {
      title: `Corregir ${top.mood} / ${top.tense}`,
      reason: `Tasa de error: ${top.errorRate}% en ${top.attempts} intentos.`,
      drillConfig: { practiceMode: 'specific', specificMood: top.mood, specificTense: top.tense },
      type: 'error'
    }
  }

  // Priority 3: Coach session (weakness-targeted)
  const coach = buildCoachSessionPlan({ userStats, heatMapData })
  if (coach.mode === 'targeted') {
    return {
      title: coach.title.replace(' (5 min)', ''),
      reason: coach.why,
      drillConfig: coach.drillConfig,
      type: 'coach'
    }
  }

  // Priority 4: Focus tracks (stale mastery reactivation)
  const tracks = buildFocusTracks({ heatMapData, userStats })
  const reactivateTrack = tracks.find(t => t.id === 'reactivate-mastery')
  if (reactivateTrack) {
    return {
      title: reactivateTrack.title,
      reason: reactivateTrack.description,
      drillConfig: reactivateTrack.drillConfig,
      type: 'focus'
    }
  }

  // Priority 5: SRS items due (not overdue)
  if (srsStats?.total > 0) {
    return {
      title: `Repasar ${srsStats.total} elemento${srsStats.total !== 1 ? 's' : ''}`,
      reason: 'Tenés elementos listos para repaso espaciado.',
      drillConfig: { practiceMode: 'review', reviewSessionType: 'due', reviewSessionFilter: {} },
      type: 'srs'
    }
  }

  // Fallback: coach recommendation (mixed or confidence)
  return {
    title: coach.mode === 'confidence' ? 'Sesión de repaso' : 'Práctica mixta',
    reason: coach.objective,
    drillConfig: coach.drillConfig,
    type: 'mixed'
  }
}

function pickSecondaryActions({ srsStats, userStats, heatMapData, primaryType }) {
  const actions = []

  // SRS review if primary isn't SRS
  if (primaryType !== 'srs' && srsStats?.total > 0) {
    actions.push({
      title: 'Repaso SRS',
      drillConfig: { practiceMode: 'review', reviewSessionType: 'due', reviewSessionFilter: {} }
    })
  }

  // Mixed practice if primary isn't mixed
  if (primaryType !== 'mixed') {
    const mastery = Number(userStats?.totalMastery || 0)
    actions.push({
      title: 'Práctica variada',
      drillConfig: {
        practiceMode: mastery < 50 ? 'review' : 'mixed',
        reviewSessionType: 'due',
        reviewSessionFilter: {}
      }
    })
  }

  // Weakness track if primary isn't error/coach
  if (primaryType !== 'error' && primaryType !== 'coach') {
    const tracks = buildFocusTracks({ heatMapData, userStats })
    const weakTrack = tracks.find(t => t.id === 'repair-weakness')
    if (weakTrack) {
      actions.push({
        title: 'Punto débil',
        drillConfig: weakTrack.drillConfig
      })
    }
  }

  return actions.slice(0, 2)
}

export default function UnifiedPracticeAction({
  srsStats,
  userStats,
  heatMapData,
  errorIntel,
  onStartDrill
}) {
  const primary = useMemo(
    () => pickPrimaryAction({ srsStats, userStats, heatMapData, errorIntel }),
    [srsStats, userStats, heatMapData, errorIntel]
  )

  const secondary = useMemo(
    () => pickSecondaryActions({ srsStats, userStats, heatMapData, primaryType: primary.type }),
    [srsStats, userStats, heatMapData, primary.type]
  )

  return (
    <section className="unified-practice">
      <h2 className="unified-practice-heading">Practicar</h2>

      <div
        className="practice-primary"
        onClick={() => onStartDrill?.(primary.drillConfig)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onStartDrill?.(primary.drillConfig)
          }
        }}
      >
        <div className="practice-primary-title">{primary.title}</div>
        <div className="practice-primary-reason">{primary.reason}</div>
        <div className="practice-primary-cta">Empezar →</div>
      </div>

      {secondary.length > 0 && (
        <div className="practice-secondary-row">
          {secondary.map((action, i) => (
            <button
              key={i}
              type="button"
              className="practice-secondary"
              onClick={() => onStartDrill?.(action.drillConfig)}
            >
              {action.title}
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
