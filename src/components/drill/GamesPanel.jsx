import React from 'react'

function GamesPanel({ settings, onClose, onRegenerateItem }) {
  const handleResistanceToggle = () => {
    if (settings.resistanceActive) {
      // Deactivate
      settings.set({ resistanceActive: false, resistanceMsLeft: 0, resistanceStartTs: null })
    } else {
      const level = settings.level || 'A1'
      // Supervivencia: A1 20s, A2 18s, B1 18s, B2 17s, C1 16s, C2 15s
      const baseMs = level==='C2'?15000: level==='C1'?16000: level==='B2'?17000: level==='B1'?18000: level==='A2'?18000:20000
      settings.set({ resistanceActive: true, resistanceMsLeft: baseMs, resistanceStartTs: Date.now() })
    }
    onClose()
  }

  const handleReverseToggle = () => {
    // Toggle reverse mode
    const active = !!settings.reverseActive
    settings.set({ reverseActive: !active, doubleActive: false })
    onClose()
    
    // CRÍTICO: Si se activa el modo reverso, regenerar inmediatamente
    if (!active) {
      setTimeout(() => {
        onRegenerateItem()
      }, 100)
    }
  }

  const handleDoubleToggle = () => {
    // Toggle double mode
    const active = !!settings.doubleActive
    settings.set({ doubleActive: !active, reverseActive: false })
    onClose()
    
    // CRÍTICO: Si se activa el modo doble, regenerar inmediatamente
    if (!active) {
      setTimeout(() => {
        onRegenerateItem()
      }, 100)
    }
  }

  const handleKeyDown = (e, callback) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      callback()
    }
  }

  return (
    <div className="games-panel quick-switch-panel" aria-label="Juegos">
      <div className="options-grid">
        <div 
          className="option-card compact" 
          onClick={handleResistanceToggle} 
          aria-label="Survivor"
          role="button"
          tabIndex="0"
          onKeyDown={(e) => handleKeyDown(e, handleResistanceToggle)}
        >
          <img src="/zombie.png" alt="Survivor" className="game-icon" />
          <p className="conjugation-example">Modo supervivencia</p>
        </div>
        
        <div 
          className="option-card compact" 
          onClick={handleReverseToggle} 
          aria-label="Reverso"
          role="button"
          tabIndex="0"
          onKeyDown={(e) => handleKeyDown(e, handleReverseToggle)}
        >
          <img src="/sobrev.png" alt="Reverso" className="game-icon" />
          <p className="conjugation-example">Invertí la consigna</p>
        </div>
        
        <div 
          className="option-card compact" 
          onClick={handleDoubleToggle} 
          aria-label="Dos juntos dos"
          role="button"
          tabIndex="0"
          onKeyDown={(e) => handleKeyDown(e, handleDoubleToggle)}
        >
          <img src="/verbosverbos.png" alt="De a dos" className="game-icon" />
          <p className="conjugation-example">Dos juntos dos</p>
        </div>
      </div>
      
      <div style={{ textAlign: 'center' }}>
        <button className="btn btn-secondary" onClick={onClose}>Cerrar</button>
      </div>
    </div>
  )
}

export default GamesPanel