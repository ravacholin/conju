import React from 'react'
import MenuOptionCard from './MenuOptionCard.jsx'

function DialectSelection({ onSelectDialect }) {
  return (
    <div className="options-grid dialect-selection">
      <MenuOptionCard
        eyebrow="CONTRASTE"
        badge="01"
        title="VOS"
        subtitle="Argentina y Uruguay"
        description="Sistema rioplatense con voseo como eje principal."
        detail="vos tenés, vos hablás"
        onClick={() => onSelectDialect('rioplatense')}
        cardTitle="Seleccionar dialecto rioplatense (vos)"
      />

      <MenuOptionCard
        eyebrow="BASE"
        badge="02"
        title="TÚ"
        subtitle="Latinoamérica"
        description="Variante general pensada para la mayoría de materiales estándar."
        detail="tú tienes, tú hablas"
        onClick={() => onSelectDialect('la_general')}
        cardTitle="Seleccionar dialecto latinoamericano general (tú)"
      />

      <MenuOptionCard
        eyebrow="PENINSULAR"
        badge="03"
        title="TÚ + VOSOTROS"
        subtitle="España"
        description="Incluye segunda persona plural y mantiene contraste castellano."
        detail="vosotros tenéis"
        onClick={() => onSelectDialect('peninsular')}
        cardTitle="Seleccionar dialecto peninsular (tú y vosotros)"
      />

      <MenuOptionCard
        eyebrow="AMPLIO"
        badge="04"
        title="TODOS"
        subtitle="Cobertura global"
        description="Mantiene abiertas todas las variantes para máxima mezcla."
        detail="tú, vos y vosotros"
        onClick={() => onSelectDialect('both')}
        cardTitle="Seleccionar todos los dialectos"
      />
    </div>
  )
}

export default DialectSelection
