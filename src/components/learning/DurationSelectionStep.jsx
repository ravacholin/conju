import React from 'react'
import ClickableCard from '../shared/ClickableCard.jsx'
import { getSessionDurationOptions as getDefaultDurationOptions } from '../../lib/learning/learningConfig.js'

function DurationSelectionStep({
  selectedDuration,
  onSelectDuration,
  onStart,
  onBack,
  onHome,
  durationOptions = getDefaultDurationOptions()
}) {
  return (
    <div className="App">
      <div className="onboarding learn-flow">
        <ClickableCard className="app-logo" onClick={onHome} title="Volver al menú">
          <img src="/verbosmain_transparent.png" alt="VerbOS" width="180" height="180" />
        </ClickableCard>

        <div className="tense-section">
          <h2>Duración de la sesión</h2>

          <div className="options-grid">
            {durationOptions.map(durationConfig => (
              <ClickableCard
                key={durationConfig.minutes}
                className={`option-card${selectedDuration === durationConfig.minutes ? ' selected' : ''}`}
                onClick={() => onSelectDuration(durationConfig.minutes)}
                title={durationConfig.title}
              >
                <h3>{durationConfig.label}</h3>
                <p className="example">{durationConfig.description}</p>
              </ClickableCard>
            ))}
          </div>

          {selectedDuration && (
            <button
              className="btn start-learning-btn"
              onClick={onStart}
            >
              Continuar
            </button>
          )}
        </div>

        <button className="back-btn" onClick={onBack}>
          <img src="/back.png" alt="Volver" className="back-icon" />
        </button>
      </div>
    </div>
  )
}

export default DurationSelectionStep
