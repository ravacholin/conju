function DrillHeader({ 
  onToggleQuickSwitch, 
  onToggleChallenges, 
  onToggleAccentKeys, 
  onToggleGames, 
  onHome,
  showQuickSwitch,
  showChallenges,
  showGames 
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
          onClick={() => {
            if (showChallenges) {
              onToggleChallenges(false)
            } else {
              onToggleChallenges(true)
            }
          }}
          className="icon-btn"
          title="Cronometría"
        >
          <img src="/crono.png" alt="Cronometría" className="menu-icon" />
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