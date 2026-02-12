import React from 'react'
import { useSettings } from '../../state/settings.js'

function DrillHeader({
  onToggleQuickSwitch,
  onToggleAccentKeys,
  onToggleGames,
  onTogglePronunciation,
  onNavigateToProgress,
  onNavigateToStory: _onNavigateToStory,
  onNavigateToTimeline: _onNavigateToTimeline,
  onHome,
  showQuickSwitch,
  showGames,
  showPronunciation: _showPronunciation
}) {
  const settings = useSettings()
  const isReviewMode = settings.practiceMode === 'review'

  return (
    <header className="header">
      {isReviewMode && (
        <div className="srs-mode-badge">
          <img src="/icons/timer.png" alt="SRS" className="srs-badge-icon" />
          <span>Sesión de Repaso SRS</span>
        </div>
      )}
      <div className="icon-row">
        <button
          type="button"
          onClick={() => {
            if (showQuickSwitch) {
              onToggleQuickSwitch(false)
            } else {
              onToggleQuickSwitch(true)
            }
          }}
          className="icon-btn"
          title="Cambiar rápido"
          aria-label="Cambiar rápido"
        >
          <img src="/config.png" alt="Config" className="menu-icon" />
        </button>

        <button
          type="button"
          onClick={() => onToggleAccentKeys()}
          className="icon-btn"
          title="Tildes"
          aria-label="Tildes"
        >
          <img src="/enie.png" alt="Tildes" className="menu-icon" />
        </button>

        <button
          type="button"
          onClick={onHome}
          className="icon-btn"
          title="Menú"
          aria-label="Menú"
        >
          <img src="/home.png" alt="Menú" className="menu-icon" />
        </button>

        <button
          type="button"
          onClick={() => onTogglePronunciation()}
          className="icon-btn"
          title="Práctica de pronunciación"
          aria-label="Práctica de pronunciación"
        >
          <img src="/boca.png" alt="Pronunciación" className="menu-icon-pronunciation" />
        </button>

        <button
          type="button"
          onClick={() => {
            if (showGames) {
              onToggleGames(false)
            } else {
              onToggleGames(true)
            }
          }}
          className="icon-btn"
          title="Juegos"
          aria-label="Juegos"
        >
          <img src="/dice.png" alt="Juegos" className="menu-icon" />
        </button>

        <button
          type="button"
          onClick={() => onNavigateToProgress()}
          className="icon-btn"
          title="Progreso y Analíticas"
          aria-label="Progreso y Analíticas"
        >
          <img src="/icons/chart.png" alt="Progreso" className="menu-icon" />
        </button>
      </div>
    </header>
  )
}

export default DrillHeader
