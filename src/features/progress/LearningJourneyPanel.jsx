import React, { useMemo } from 'react'
import { buildLearningJourney } from './learningJourneyPlan.js'

export default function LearningJourneyPanel({ userStats, studyPlan, onNavigateToDrill }) {
  const journey = useMemo(
    () => buildLearningJourney({ userStats, studyPlan }),
    [userStats, studyPlan]
  )

  return (
    <section className="lj-container" data-testid="learning-journey-panel">
      <div className="lj-header">
        <h3 className="lj-title">Tu progreso</h3>
        <span className="lj-counter">{journey.totalCompleted}/{journey.totalCheckpoints} hitos</span>
      </div>
      <p className="lj-message">{journey.adaptiveMessage}</p>

      <div className="lj-checkpoints">
        {journey.checkpoints.map((checkpoint) => (
          <div key={checkpoint.id} className={`lj-checkpoint ${checkpoint.completed ? 'lj-completed' : ''}`}>
            <div className="lj-checkpoint-top">
              <div className="lj-checkpoint-info">
                <strong className="lj-checkpoint-title">
                  {checkpoint.completed ? '✓ ' : ''}{checkpoint.title}
                </strong>
                <span className="lj-checkpoint-desc">{checkpoint.description}</span>
              </div>
              <span className="lj-checkpoint-pct">{checkpoint.progress}%</span>
            </div>
            <div className="lj-progress-bar">
              <div
                className="lj-progress-fill"
                style={{ width: `${checkpoint.progress}%` }}
              />
            </div>
            {!checkpoint.completed && (
              <button
                type="button"
                className="lj-action-btn"
                onClick={() => onNavigateToDrill?.()}
              >
                {checkpoint.actionLabel}
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
