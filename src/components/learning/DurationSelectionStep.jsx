import React from 'react'
import MenuOptionCard from '../onboarding/MenuOptionCard.jsx'
import LearningMenuLayout from './LearningMenuLayout.jsx'
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
    <LearningMenuLayout
      step="03"
      kicker="SESIÓN"
      title="Definí la duración"
      description="Ajustá el tamaño de la sesión antes de entrar al recorrido guiado. Podés usar una pasada breve o una tanda más profunda."
      onHome={onHome}
      footer={(
        <button className="back-btn" onClick={onBack}>
          <img src="/back.png" alt="Volver" className="back-icon" />
        </button>
      )}
    >
        <div className="tense-section">
          <h2>Duración de la sesión</h2>

          <div className="options-grid">
            {durationOptions.map(durationConfig => (
              <MenuOptionCard
                key={durationConfig.minutes}
                className={`learning-option-card${selectedDuration === durationConfig.minutes ? ' selected' : ''}`}
                eyebrow="RITMO"
                badge={`${durationConfig.minutes}M`}
                title={durationConfig.label}
                subtitle={durationConfig.title}
                description="Configura la longitud del bloque guiado."
                detail={durationConfig.description}
                onClick={() => onSelectDuration(durationConfig.minutes)}
                cardTitle={durationConfig.title}
              />
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
    </LearningMenuLayout>
  )
}

export default DurationSelectionStep
