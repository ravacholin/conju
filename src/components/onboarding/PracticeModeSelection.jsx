import React from 'react'
import MenuOptionCard from './MenuOptionCard.jsx'

function PracticeModeSelection({ onSelectPracticeMode, onBack }) {
  return (
    <>
      <div className="options-grid">
        <MenuOptionCard
          eyebrow="AMPLIO"
          badge="MIX"
          title="MIXTA"
          subtitle="Panorama completo"
          description="Mezcla modos y tiempos habilitados por tu nivel para trabajar variedad real."
          detail="Variedad completa para práctica general"
          onClick={() => onSelectPracticeMode('mixed')}
          cardTitle="Seleccionar práctica mixta"
        />

        <MenuOptionCard
          eyebrow="PRECISA"
          badge="FOCUS"
          title="ESPECÍFICA"
          subtitle="Un bloque a la vez"
          description="Aísla un modo y un tiempo para practicar con intención y repetición útil."
          detail="Ideal para dominar formas particulares"
          onClick={() => onSelectPracticeMode('specific')}
          cardTitle="Seleccionar formas específicas"
        />
      </div>

      <button onClick={onBack} className="back-btn">
        <img src="/back.png" alt="Volver" className="back-icon" />
      </button>
    </>
  )
}

export default PracticeModeSelection
