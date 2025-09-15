import React from 'react'

/**
 * ResistanceHUD.jsx
 * Heads-up display for the Survival/Resistance mode timer.
 * Keeps original DOM/classNames to preserve styles and tests.
 */
export default function ResistanceHUD({
  isActive,
  msLeft,
  showExplosion,
  urgentTick,
  clockClickFeedback,
  onClockClick
}) {
  const s = Math.max(0, Math.floor((msLeft || 0) / 1000))
  const mm = String(Math.floor(s / 60)).padStart(2, '0')
  const ss = String(s % 60).padStart(2, '0')
  const str = `${mm}:${ss}`

  return (
    <div className="resistance-hud">
      <div
        className={`digit-clock ${
          (msLeft || 0) <= 5000 ? 'urgent' : ''
        } ${showExplosion ? 'shake' : ''} ${clockClickFeedback ? 'click-feedback' : ''} ${urgentTick ? 'urgent-tick' : ''}`}
        onClick={() => {
          if (isActive && (msLeft || 0) > 0 && onClockClick) onClockClick()
        }}
        style={{ cursor: isActive && (msLeft || 0) > 0 ? 'pointer' : 'default' }}
        title={isActive && (msLeft || 0) > 0 ? 'Click para agregar 5 segundos' : '¡Tiempo agotado!'}
      >
        {str.split('').map((ch, i) => (
          <span key={i} className={`digit ${ch === ':' ? 'colon' : ''}`}>
            {ch}
          </span>
        ))}
      </div>
      <div className="resistance-caption">
        {showExplosion ? '¡Tiempo agotado!' : 'Modo Supervivencia'}
      </div>
    </div>
  )
}

