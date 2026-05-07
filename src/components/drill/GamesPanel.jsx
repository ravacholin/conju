import React from 'react'

const GAME_MODES = [
  {
    id: 'resistance',
    icon: '/zombie.png',
    label: 'SUPERVIVENCIA',
    desc: 'Modo contrarreloj',
    isActive: (s) => s.resistanceActive,
    toggle: (settings, onClose) => {
      if (settings.resistanceActive) {
        settings.set({ resistanceActive: false, resistanceMsLeft: 0, resistanceStartTs: null })
      } else {
        const level = settings.level || 'A1'
        const baseMs = level==='C2'?15000: level==='C1'?16000: level==='B2'?17000: level==='B1'?18000: level==='A2'?18000:20000
        settings.set({ resistanceActive: true, resistanceMsLeft: baseMs, resistanceStartTs: Date.now() })
      }
      onClose()
    },
    needsRegen: false
  },
  {
    id: 'reverse',
    icon: '/sobrev.png',
    label: 'INVERSO',
    desc: 'Forma → pronombre',
    isActive: (s) => s.reverseActive,
    toggle: (settings, onClose, onRegen) => {
      const active = !!settings.reverseActive
      settings.set({ reverseActive: !active, doubleActive: false })
      onClose()
      if (!active) setTimeout(onRegen, 100)
    },
    needsRegen: true
  },
  {
    id: 'double',
    icon: '/verbosverbos.png',
    label: 'DOS × DOS',
    desc: 'Dos verbos a la vez',
    isActive: (s) => s.doubleActive,
    toggle: (settings, onClose, onRegen) => {
      const active = !!settings.doubleActive
      settings.set({ doubleActive: !active, reverseActive: false })
      onClose()
      if (!active) setTimeout(onRegen, 100)
    },
    needsRegen: true
  }
]

function GamesPanel({ settings, onClose, onRegenerateItem }) {
  return (
    <div className="vd-games-panel quick-switch-panel">
      <div className="vd-games-label">MODOS DE JUEGO</div>
      <div className="vd-games-list">
        {GAME_MODES.map((mode) => {
          const active = mode.isActive(settings)
          return (
            <button
              key={mode.id}
              className={`vd-game-btn${active ? ' vd-game-btn--active' : ''}`}
              onClick={() => mode.toggle(settings, onClose, onRegenerateItem)}
              aria-pressed={active}
            >
              <img src={mode.icon} alt="" className="vd-game-img" aria-hidden="true" />
              <span className="vd-game-info">
                <span className="vd-game-name">{mode.label}</span>
                <span className="vd-game-desc">{mode.desc}</span>
              </span>
              <span className="vd-game-state">{active ? 'ON' : 'OFF'}</span>
            </button>
          )
        })}
      </div>
      <div className="vd-qs-actions">
        <button className="btn btn-secondary" onClick={onClose}>Cerrar</button>
      </div>
    </div>
  )
}

export default GamesPanel
