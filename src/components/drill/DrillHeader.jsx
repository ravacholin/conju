import React from 'react'

function DrillHeader({
  onToggleQuickSwitch,
  onToggleAccentKeys,
  onToggleGames,
  onTogglePronunciation,
  onNavigateToProgress,
  onNavigateToStory,
  onNavigateToTimeline,
  onHome,
  showQuickSwitch,
  showGames,
  showPronunciation: _showPronunciation
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
          onClick={onHome}
          className="icon-btn"
          title="Menú"
        >
          <img src="/home.png" alt="Menú" className="menu-icon" />
        </button>

        <button
          onClick={() => onTogglePronunciation()}
          className="icon-btn"
          title="Práctica de pronunciación"
        >
          <img src="/boca.png" alt="Pronunciación" className="menu-icon-pronunciation" />
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

        {typeof onNavigateToStory === 'function' && (
          <button
            onClick={() => onNavigateToStory()}
            className="icon-btn"
            title="Modo historias"
          >
            <img src="/openbook.png" alt="Modo historias" className="menu-icon" />
          </button>
        )}

        {typeof onNavigateToTimeline === 'function' && (
          <button
            onClick={() => onNavigateToTimeline()}
            className="icon-btn"
            title="Modo línea de tiempo"
          >
            <img src="/crono.png" alt="Modo línea de tiempo" className="menu-icon" />
          </button>
        )}

        <button
          onClick={() => onNavigateToProgress()}
          className="icon-btn"
          title="Progreso y Analíticas"
        >
          <img src="/icons/chart.png" alt="Progreso" className="menu-icon" />
        </button>
      </div>
    </header>
  )
}

export default DrillHeader
