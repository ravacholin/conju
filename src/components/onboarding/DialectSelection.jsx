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
        <h3><img src="/vos.png" alt="Vos" className="option-icon" /></h3>
        <p>Argentina, Uruguay, etc.</p>
        <p className="example">vos tenés, vos hablás</p>
      </ClickableCard>
      
      <ClickableCard 
        className="option-card" 
        onClick={() => onSelectDialect('la_general')} 
        title="Seleccionar dialecto latinoamericano general (tú)"
      >
        <h3><img src="/tu.png" alt="Tú" className="option-icon" /></h3>
        <p>México, Perú, Cuba, etc.</p>
        <p className="example">tú tienes, tú hablas</p>
      </ClickableCard>
      
      <ClickableCard 
        className="option-card" 
        onClick={() => onSelectDialect('peninsular')} 
        title="Seleccionar dialecto peninsular (tú y vosotros)"
      >
        <h3>
          <img src="/tu.png" alt="Tú" className="option-icon" />
          <img src="/vosotros.png" alt="Vosotros" className="option-icon" />
        </h3>
        <p>España, etc.</p>
        <p className="example">tú tienes, vosotros tenéis</p>
      </ClickableCard>
      
      <ClickableCard 
        className="option-card" 
        onClick={() => onSelectDialect('both')} 
        title="Seleccionar todos los dialectos (tú, vos y vosotros)"
      >
        <h3>
          <img src="/tu.png" alt="Tú" className="option-icon" />
          <img src="/vos.png" alt="Vos" className="option-icon" />
          <img src="/vosotros.png" alt="Vosotros" className="option-icon" />
        </h3>
        <p>México, Argentina, España, etc.</p>
        <p className="example">todas las formas</p>
      </ClickableCard>
    </div>
  )
}

export default DialectSelection