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
          <h3><img src="/books.png" alt="Libros" className="option-icon" /> Todos los Verbos</h3>
          <p>Regulares e irregulares</p>
          <p className="example">Práctica completa</p>
        </ClickableCard>
        
        <ClickableCard 
          className="option-card" 
          onClick={() => onSelectVerbType('regular')} 
          title="Seleccionar solo verbos regulares"
        >
          <h3><img src="/openbook.png" alt="Libro Abierto" className="option-icon" /> Verbos Regulares</h3>
          <p>Solo verbos que siguen las reglas</p>
          <p className="example">hablar, comer, vivir</p>
        </ClickableCard>
        
        <ClickableCard 
          className="option-card" 
          onClick={() => onSelectVerbType('irregular')} 
          title="Seleccionar solo verbos irregulares"
        >
          <h3><img src="/diana.png" alt="Diana" className="option-icon" /> Verbos Irregulares</h3>
          <p>Solo verbos con cambios especiales</p>
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