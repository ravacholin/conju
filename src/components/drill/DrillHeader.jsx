import React from 'react'
import { useSettings } from '../../state/settings.js'
import { getSafeMoodTenseLabels } from '../../lib/utils/moodTenseValidator.js'

const DIALECT_LABEL = {
  rioplatense: 'vos',
  la_general:  'tú',
  peninsular:  'tú·vos',
  both:        'todos',
}

const MODE_LABEL = {
  mixed:  'mixto',
  specific: 'específico',
  review: 'repaso srs',
  theme:  'por tema',
}

function buildBreadcrumb(settings) {
  const items = []

  if (settings.region) {
    items.push({ label: 'DIALECTO', value: DIALECT_LABEL[settings.region] || settings.region })
  }

  if (settings.level) {
    items.push({ label: 'NIVEL', value: settings.level })
  }

  if (settings.practiceMode) {
    items.push({ label: 'MODO', value: MODE_LABEL[settings.practiceMode] || settings.practiceMode })
  }

  if (settings.practiceMode === 'specific' && settings.specificMood && settings.specificTense) {
    const { tenseLabel } = getSafeMoodTenseLabels(settings.specificMood, settings.specificTense)
    items.push({ label: 'FOCO', value: tenseLabel })
  }

  return items.slice(-3)
}

const MicSvg = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" style={{ width: 20, height: 20 }}>
    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
  </svg>
)

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
  showPronunciation,
  isRecording
}) {
  const settings = useSettings()
  const isReviewMode = settings.practiceMode === 'review'
  const breadcrumb = buildBreadcrumb(settings)

  return (
    <header className="header">
      {/* Left: VERB/OS logo → home */}
      <div className="vd-logo" onClick={onHome} title="Ir al inicio">
        <div className="vd-logo-dot" />
        <span className="vd-logo-name">
          VERB<span style={{ color: '#ff4d1c' }}>/</span>OS
        </span>
      </div>

      {/* Center: practice context breadcrumb */}
      <div className="vd-breadcrumb" aria-label="Contexto de práctica">
        {isReviewMode ? (
          <span className="srs-mode-badge">
            <img src="/icons/timer.png" alt="SRS" className="srs-badge-icon" />
            <span>REPASO SRS</span>
          </span>
        ) : breadcrumb.length === 0 ? (
          <span style={{ color: '#2a2823' }}>— · —</span>
        ) : (
          breadcrumb.map((item, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span className="vd-breadcrumb-sep">/</span>}
              <span>
                <span className="vd-breadcrumb-label">{item.label} </span>
                <span className="vd-breadcrumb-val">{item.value}</span>
              </span>
            </React.Fragment>
          ))
        )}
      </div>

      {/* Right: action icon buttons */}
      <div className="icon-row">
        <button
          type="button"
          onClick={() => onToggleQuickSwitch(showQuickSwitch ? false : true)}
          className={`icon-btn${showQuickSwitch ? ' active' : ''}`}
          title="Configuración rápida"
          aria-label="Configuración rápida"
          aria-pressed={showQuickSwitch}
        >
          <img src="/config.png" alt="Config" />
        </button>

        <button
          type="button"
          onClick={() => onToggleAccentKeys()}
          className="icon-btn"
          title="Tildes especiales"
          aria-label="Tildes especiales"
        >
          <img src="/enie.png" alt="Tildes" />
        </button>

        <button
          type="button"
          onClick={() => onTogglePronunciation()}
          className={`icon-btn${showPronunciation ? ' active' : ''}${isRecording ? ' recording' : ''}`}
          title="Pronunciación"
          aria-label="Pronunciación"
          aria-pressed={showPronunciation}
        >
          <MicSvg />
        </button>

        <button
          type="button"
          onClick={() => onToggleGames(showGames ? false : true)}
          className={`icon-btn${showGames ? ' active' : ''}`}
          title="Modos de juego"
          aria-label="Modos de juego"
          aria-pressed={showGames}
        >
          <img src="/dice.png" alt="Juegos" />
        </button>

        <button
          type="button"
          onClick={() => onNavigateToProgress()}
          className="icon-btn"
          title="Progreso"
          aria-label="Progreso"
        >
          <img src="/icons/chart.png" alt="Progreso" />
        </button>
      </div>
    </header>
  )
}

export default DrillHeader
