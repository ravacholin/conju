import React from 'react'
import ClickableCard from '../shared/ClickableCard.jsx'

function VerbTypeSelection({ onSelectVerbType, onBack }) {
  return (
    <>
      <div className="options-grid">
        <ClickableCard
          className="option-card"
          onClick={() => onSelectVerbType('all')}
          title="Seleccionar todos los tipos de verbos"
        >
          <div style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '0.5rem' }}>TODOS</div>
          <p>REGULARES E IRREGULARES</p>
          <p className="example">Práctica completa</p>
        </ClickableCard>

        <ClickableCard
          className="option-card"
          onClick={() => onSelectVerbType('regular')}
          title="Seleccionar solo verbos regulares"
        >
          <div style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '0.5rem' }}>REGULARES</div>
          <p>SEGUIR LA REGLA</p>
          <p className="example">hablar, comer, vivir</p>
        </ClickableCard>

        <ClickableCard
          className="option-card"
          onClick={() => onSelectVerbType('irregular')}
          title="Seleccionar solo verbos irregulares"
        >
          <div style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '0.5rem' }}>IRREGULARES</div>
          <p>VERBOS ESPECIALES</p>
          <p className="example">ser, estar, tener, ir</p>
        </ClickableCard>
      </div>

      <button onClick={onBack} className="back-btn">
        <img src="/back.png" alt="Volver" className="back-icon" />
      </button>
    </>
  )
}

export default VerbTypeSelection