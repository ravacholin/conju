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
        <div className="option-title">VOS</div>
        <p>Argentina, Uruguay</p>
        <p className="example">vos tenés, vos hablás</p>
      </ClickableCard>

      <ClickableCard
        className="option-card"
        onClick={() => onSelectDialect('la_general')}
        title="Seleccionar dialecto latinoamericano general (tú)"
      >
        <div className="option-title">TÚ</div>
        <p>Latinoamérica</p>
        <p className="example">tú tienes, tú hablas</p>
      </ClickableCard>

      <ClickableCard
        className="option-card"
        onClick={() => onSelectDialect('peninsular')}
        title="Seleccionar dialecto peninsular (tú y vosotros)"
      >
        <div className="option-title">TÚ + VOSOTROS</div>
        <p>España</p>
        <p className="example">vosotros tenéis</p>
      </ClickableCard>

      <ClickableCard
        className="option-card"
        onClick={() => onSelectDialect('both')}
        title="Seleccionar todos los dialectos"
      >
        <div className="option-title">TODOS</div>
        <p>Global</p>
        <p className="example">tú, vos y vosotros</p>
      </ClickableCard>
    </div>
  )
}

export default DialectSelection