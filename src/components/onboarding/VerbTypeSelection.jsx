import React from 'react'
import MenuOptionCard from './MenuOptionCard.jsx'

function VerbTypeSelection({ onSelectVerbType, onBack }) {
  return (
    <>
      <div className="options-grid">
        <MenuOptionCard
          eyebrow="AMPLIO"
          badge="ALL"
          title="TODOS"
          subtitle="Regulares e irregulares"
          description="No restringe el generador: deja entrar toda la variedad disponible."
          detail="Práctica completa"
          onClick={() => onSelectVerbType('all')}
          cardTitle="Seleccionar todos los tipos de verbos"
        />

        <MenuOptionCard
          eyebrow="SISTEMA"
          badge="REG"
          title="REGULARES"
          subtitle="Seguir la regla"
          description="Ideal para afinar terminaciones y consolidar patrones estables."
          detail="hablar, comer, vivir"
          onClick={() => onSelectVerbType('regular')}
          cardTitle="Seleccionar solo verbos regulares"
        />

        <MenuOptionCard
          eyebrow="TENSIÓN"
          badge="IRR"
          title="IRREGULARES"
          subtitle="Verbos especiales"
          description="Recorta el drill a los casos de mayor fricción y memoria."
          detail="ser, estar, tener, ir"
          onClick={() => onSelectVerbType('irregular')}
          cardTitle="Seleccionar solo verbos irregulares"
        />
      </div>

      <button onClick={onBack} className="back-btn">
        <img src="/back.png" alt="Volver" className="back-icon" />
      </button>
    </>
  )
}

export default VerbTypeSelection
