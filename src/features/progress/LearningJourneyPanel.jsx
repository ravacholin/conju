import React, { useMemo } from 'react'
import { buildLearningJourney } from './learningJourneyPlan.js'

export default function LearningJourneyPanel({ userStats, studyPlan, onNavigateToDrill }) {
  const journey = useMemo(
    () => buildLearningJourney({ userStats, studyPlan }),
    [userStats, studyPlan]
  )

  return (
    <section className="learning-journey-panel" data-testid="learning-journey-panel">
      <div className="section-header">
        <h2>
          <img src="/icons/openbook.png" alt="Ruta de aprendizaje" className="section-icon" />
          Ruta de aprendizaje
        </h2>
        <p>{journey.adaptiveMessage}</p>
      </div>

      <ul className="reminder-list">
        {journey.checkpoints.map((checkpoint) => (
          <li key={checkpoint.id} className={`reminder-card ${checkpoint.completed ? 'priority-low' : 'priority-medium'}`}>
            <div className="reminder-text">
              <strong>{checkpoint.title}</strong>
              <div>{checkpoint.description}</div>
              <small>Progreso: {checkpoint.progress}%</small>
            </div>
            {!checkpoint.completed && (
              <div className="reminder-actions">
                <button type="button" className="reminder-button secondary" onClick={() => onNavigateToDrill?.()}>
                  Practicar ahora
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>

      {journey.nextCheckpoint && !journey.nextCheckpoint.completed && (
        <div className="weekly-goals-callout">
          <h3>Siguiente hito</h3>
          <p>
            {journey.nextCheckpoint.title}: {journey.nextCheckpoint.progress}% completado.
          </p>
        </div>
      )}
    </section>
  )
}
