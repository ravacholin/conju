import React from 'react'
import ClickableCard from '../shared/ClickableCard.jsx'

function LevelSelection({ onSelectLevel, onSelectPracticeMode, onGoToLevelDetails, onBack, showLevelDetails = false }) {
  if (showLevelDetails) {
    // Step 3: Specific level selection
    return (
      <>
        <div className="options-grid">
          <ClickableCard 
            className="option-card" 
            onClick={() => onSelectLevel('A1')} 
            title="Seleccionar nivel A1 - Principiante"
          >
            <h3><img src="/a1.png" alt="A1" className="option-icon" /> Principiante</h3>
            <p>Te presentás, describís personas y rutinas, pedís y das datos básicos.</p>
            <p className="example">Indicativo: Presente</p>
          </ClickableCard>
          
          <ClickableCard 
            className="option-card" 
            onClick={() => onSelectLevel('A2')} 
            title="Seleccionar nivel A2 - Elemental"
          >
            <h3><img src="/a2.png" alt="A2" className="option-icon" /> Elemental</h3>
            <p>Contás experiencias y planes, seguís instrucciones y resolvés gestiones simples.</p>
            <p className="example">Indicativo: Pretéritos, Futuro | Imperativo: Afirmativo</p>
          </ClickableCard>
          
          <ClickableCard 
            className="option-card" 
            onClick={() => onSelectLevel('B1')} 
            title="Seleccionar nivel B1 - Intermedio"
          >
            <h3><img src="/B1.png" alt="B1" className="option-icon" /> Intermedio</h3>
            <p>Narrás con orden, comparás pasados, explicás causas y fundamentás opiniones.</p>
            <p className="example">Pluscuamperfecto, Futuro compuesto, Subjuntivo presente, Condicional</p>
          </ClickableCard>
          
          <ClickableCard 
            className="option-card" 
            onClick={() => onSelectLevel('B2')} 
            title="Seleccionar nivel B2 - Intermedio alto"
          >
            <h3><img src="/b2.png" alt="B2" className="option-icon" /> Intermedio alto</h3>
            <p>Argumentás con matices, manejás hipótesis y concesiones, pedís y das aclaraciones complejas.</p>
            <p className="example">Subjuntivo imperfecto/pluscuamperfecto, Condicional compuesto</p>
          </ClickableCard>
          
          <ClickableCard 
            className="option-card" 
            onClick={() => onSelectLevel('C1')} 
            title="Seleccionar nivel C1 - Avanzado"
          >
            <h3><img src="/c1.png" alt="C1" className="option-icon" /> Avanzado</h3>
            <p>Producís discursos precisos y cohesionados, adaptás registro y reformulás con naturalidad.</p>
            <p className="example">Todas las formas verbales</p>
          </ClickableCard>
          
          <ClickableCard 
            className="option-card" 
            onClick={() => onSelectLevel('C2')} 
            title="Seleccionar nivel C2 - Superior"
          >
            <h3><img src="/c2.png" alt="C2" className="option-icon" /> Superior</h3>
            <p>Usás recursos idiomáticos y tonos variados con dominio casi nativo.</p>
            <p className="example">Todas las formas verbales</p>
          </ClickableCard>
        </div>
        
        <button onClick={onBack} className="back-btn">
          <img src="/back.png" alt="Volver" className="back-icon" />
        </button>
      </>
    )
  }

  // Step 2: Unified level selection - direct to level selection
  return (
    <>
      <div className="options-grid">
        <ClickableCard 
          className="option-card" 
          onClick={onGoToLevelDetails} 
          title="Practicar por nivel específico (A1-C2)"
        >
          <h3><img src="/books.png" alt="Libros" className="option-icon" /> Por nivel</h3>
          <p>Practicá según tu nivel de español (A1, A2, B1, B2, C1, C2)</p>
          <p className="example">Formas verbales según el Marco Común Europeo</p>
        </ClickableCard>
        
        <ClickableCard 
          className="option-card" 
          onClick={() => onSelectPracticeMode('theme')} 
          title="Practicar temas específicos (presente, subjuntivo, etc.)"
        >
          <h3><img src="/diana.png" alt="Diana" className="option-icon" /> Por tema</h3>
          <p>Elegí un tiempo o modo verbal específico para practicar</p>
          <p className="example">Presente, subjuntivo, imperativo, etc.</p>
        </ClickableCard>
      </div>
      
      <button onClick={onBack} className="back-btn">
        <img src="/back.png" alt="Volver" className="back-icon" />
      </button>
    </>
  )
}

export default LevelSelection