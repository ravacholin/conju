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

/* Inline SVG icon components — use currentColor so CSS color/opacity applies cleanly */
const ConfigSvg = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
    <line x1="4" y1="6" x2="20" y2="6"/>
    <line x1="4" y1="12" x2="20" y2="12"/>
    <line x1="4" y1="18" x2="20" y2="18"/>
    <circle cx="8" cy="6" r="2" fill="currentColor" stroke="none"/>
    <circle cx="16" cy="12" r="2" fill="currentColor" stroke="none"/>
    <circle cx="10" cy="18" r="2" fill="currentColor" stroke="none"/>
  </svg>
)

const AccentsSvg = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <text x="2" y="19" fontFamily="serif" fontSize="18" fontWeight="bold" fill="currentColor">Ñ</text>
  </svg>
)

const MicSvg = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
  </svg>
)

const DiceSvg = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <circle cx="8.5" cy="8.5" r="1.2" fill="currentColor" stroke="none"/>
    <circle cx="15.5" cy="8.5" r="1.2" fill="currentColor" stroke="none"/>
    <circle cx="8.5" cy="15.5" r="1.2" fill="currentColor" stroke="none"/>
    <circle cx="15.5" cy="15.5" r="1.2" fill="currentColor" stroke="none"/>
    <circle cx="8.5" cy="12" r="1.2" fill="currentColor" stroke="none"/>
    <circle cx="15.5" cy="12" r="1.2" fill="currentColor" stroke="none"/>
  </svg>
)

const ChartSvg = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="12" width="4" height="9" rx="0.5"/>
    <rect x="10" y="6" width="4" height="15" rx="0.5"/>
    <rect x="17" y="9" width="4" height="12" rx="0.5"/>
    <line x1="2" y1="21.5" x2="22" y2="21.5" stroke="currentColor" strokeWidth="1.5"/>
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
          <ConfigSvg />
        </button>

        <button
          type="button"
          onClick={() => onToggleAccentKeys()}
          className="icon-btn"
          title="Tildes especiales"
          aria-label="Tildes especiales"
        >
          <AccentsSvg />
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
          <DiceSvg />
        </button>

        <button
          type="button"
          onClick={() => onNavigateToProgress()}
          className="icon-btn"
          title="Progreso"
          aria-label="Progreso"
        >
          <ChartSvg />
        </button>
      </div>
    </header>
  )
}

export default DrillHeader
