import React from 'react'

function DrillHeader({ 
  onToggleQuickSwitch, 
  onToggleAccentKeys, 
  onToggleGames, 
  onToggleProgress,
  onHome,
  showQuickSwitch,
  showGames,
  showProgress
}) {
  return (
    <header className="header">
      <div className="icon-row">
        <button 
          onClick={() => {
            if (showQuickSwitch) {
              onToggleQuickSwitch(false)
            } else {
              onToggleQuickSwitch(true)
            }
          }}
          className="icon-btn"
          title="Cambiar rápido"
        >
          <img src="/config.png" alt="Config" className="menu-icon" />
        </button>
        
        
        <button
          onClick={() => onToggleAccentKeys()}
          className="icon-btn"
          title="Tildes"
        >
          <img src="/enie.png" alt="Tildes" className="menu-icon" />
        </button>
        
        <button
          onClick={() => {
            if (showGames) {
              onToggleGames(false)
            } else {
              onToggleGames(true)
            }
          }}
          className="icon-btn"
          title="Juegos"
        >
          <img src="/dice.png" alt="Juegos" className="menu-icon" />
        </button>
        
        <button
          onClick={() => {
            if (showProgress) {
              onToggleProgress(false)
            } else {
              onToggleProgress(true)
            }
          }}
          className="icon-btn"
          title="Progreso"
        >
          <img src="/diana.png" alt="Progreso" className="menu-icon" />
        </button>
        
        <button 
          onClick={onHome}
          className="icon-btn"
          title="Menú"
        >
          <img src="/home.png" alt="Menú" className="menu-icon" />
        </button>
      </div>
    </header>
  )
}

export default DrillHeader