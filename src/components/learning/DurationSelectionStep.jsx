import React, { useMemo } from 'react'
import LearningStepView from './LearningStepView.jsx'
import { getSessionDurationOptions as getDefaultDurationOptions } from '../../lib/learning/learningConfig.js'

function DurationSelectionStep({
  selectedDuration,
  onSelectDuration,
  onStart,
  onBack,
  onHome,
  durationOptions = getDefaultDurationOptions()
}) {
  const options = useMemo(() =>
    durationOptions.map(d => ({
      id: String(d.minutes),
      label: d.label,
      tag: `${d.minutes}M`,
      gloss: d.title || d.label,
      ex: d.description,
      onSelect: () => {
        onSelectDuration(d.minutes)
        // Avanza automáticamente si ya hay una duración seleccionada o si se confirma la misma
        if (selectedDuration === d.minutes) {
          onStart?.()
        }
      },
    })),
    [durationOptions, selectedDuration, onSelectDuration, onStart]
  )

  const stepConfig = {
    n: '03',
    kicker: 'DURACIÓN',
    prompt: 'La sesión dura...',
    aux: 'Ajustá el bloque antes de entrar al recorrido guiado.',
    options,
  }

  return (
    <LearningStepView
      stepConfig={stepConfig}
      onBack={onBack}
      breadcrumb={[
        { label: 'FLUJO', value: 'aprender' },
        { label: 'SESIÓN', value: selectedDuration ? `${selectedDuration}min` : '—' },
      ]}
      stepNum={3}
      totalSteps={3}
      selectedId={selectedDuration != null ? String(selectedDuration) : undefined}
    />
  )
}

export default DurationSelectionStep
