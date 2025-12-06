import React from 'react'
import ClickableCard from '../shared/ClickableCard.jsx'

function DialectSelection({ onSelectDialect }) {
  return (
    <div className="options-grid dialect-selection">
      <ClickableCard
        className="option-card"
        onClick={() => onSelectDialect('rioplatense')}
        title="Seleccionar dialecto rioplatense (vos)"
      >
        <div style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '0.5rem' }}>VOS</div>
        <p>Argentina, Uruguay</p>
        <p className="example">vos tenés, vos hablás</p>
      </ClickableCard>

      <ClickableCard
        className="option-card"
        onClick={() => onSelectDialect('la_general')}
        title="Seleccionar dialecto latinoamericano general (tú)"
      >
        <div style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '0.5rem' }}>TÚ</div>
        <p>Latinoamérica</p>
        <p className="example">tú tienes, tú hablas</p>
      </ClickableCard>

      <ClickableCard
        className="option-card"
        onClick={() => onSelectDialect('peninsular')}
        title="Seleccionar dialecto peninsular (tú y vosotros)"
      >
        <div style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <span>TÚ</span>
          <span style={{ fontSize: '0.6em', opacity: 0.7 }}>+</span>
          <span>VOSOTROS</span>
        </div>
        <p>España</p>
        <p className="example">vosotros tenéis</p>
      </ClickableCard>

      <ClickableCard
        className="option-card"
        onClick={() => onSelectDialect('both')}
        title="Seleccionar todos los dialectos"
      >
        <div style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '0.5rem' }}>TODOS</div>
        <p>Global</p>
        <p className="example">tú, vos y vosotros</p>
      </ClickableCard>
    </div>
  )
}

export default DialectSelection