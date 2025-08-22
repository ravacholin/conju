import ClickableCard from '../shared/ClickableCard.jsx'

function PracticeModeSelection({ onSelectPracticeMode, onBack, settings }) {
  return (
    <>
      <div className="options-grid">
        <ClickableCard 
          className="option-card" 
          onClick={() => onSelectPracticeMode('mixed')}
          title="Seleccionar práctica mixta"
        >
          <h3><img src="/dice.png" alt="Dado" className="option-icon" /> Práctica Mixta</h3>
          <p>Mezclá todos los tiempos y modos de tu nivel</p>
          <p className="example">Variedad completa para práctica general</p>
        </ClickableCard>
        
        <ClickableCard 
          className="option-card" 
          onClick={() => onSelectPracticeMode('specific')}
          title="Seleccionar formas específicas"
        >
          <h3><img src="/diana.png" alt="Diana" className="option-icon" /> Formas Específicas</h3>
          <p>Enfocate en un tiempo/modo específico de tu nivel</p>
          <p className="example">Ideal para dominar formas particulares</p>
        </ClickableCard>
      </div>
      
      <button onClick={onBack} className="back-btn">
        <img src="/back.png" alt="Volver" className="back-icon" />
      </button>
    </>
  )
}

export default PracticeModeSelection