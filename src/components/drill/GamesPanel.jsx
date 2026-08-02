import React from 'react'
import { useSessionStore } from '../../state/session.js'

const RESISTANCE_BASE_MS_BY_LEVEL = {
  C2: 15000,
  C1: 16000,
  B2: 17000,
  B1: 18000,
  A2: 18000
}
const RESISTANCE_BASE_MS_DEFAULT = 20000

const GAME_MODES = [
  {
    id: 'resistance',
    icon: '/zombie.png',
    label: 'SUPERVIVENCIA',
    desc: 'Modo contrarreloj',
    isActive: (game) => game.resistanceActive,
    toggle: ({ game, setGameMode, settings, onClose }) => {
      if (game.resistanceActive) {
        setGameMode({ resistanceActive: false })
      } else {
        const baseMs = RESISTANCE_BASE_MS_BY_LEVEL[settings.level] ?? RESISTANCE_BASE_MS_DEFAULT
        setGameMode({ resistanceActive: true, resistanceMsLeft: baseMs, resistanceStartTs: Date.now() })
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
    isActive: (game) => game.reverseActive,
    toggle: ({ game, setGameMode, onClose, onRegen }) => {
      const active = !!game.reverseActive
      setGameMode({ reverseActive: !active })
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
    isActive: (game) => game.doubleActive,
    toggle: ({ game, setGameMode, onClose, onRegen }) => {
      const active = !!game.doubleActive
      setGameMode({ doubleActive: !active })
      onClose()
      if (!active) setTimeout(onRegen, 100)
    },
    needsRegen: true
  }
]

function GamesPanel({ settings, onClose, onRegenerateItem }) {
  const resistanceActive = useSessionStore((s) => s.resistanceActive)
  const reverseActive = useSessionStore((s) => s.reverseActive)
  const doubleActive = useSessionStore((s) => s.doubleActive)
  const setGameMode = useSessionStore((s) => s.setGameMode)

  const game = { resistanceActive, reverseActive, doubleActive }

  return (
    <div className="vd-games-panel quick-switch-panel">
      <div className="vd-games-label">MODOS DE JUEGO</div>
      <div className="vd-games-list">
        {GAME_MODES.map((mode) => {
          const active = mode.isActive(game)
          return (
            <button
              key={mode.id}
              className={`vd-game-btn${active ? ' vd-game-btn--active' : ''}`}
              onClick={() => mode.toggle({
                game,
                setGameMode,
                settings,
                onClose,
                onRegen: onRegenerateItem
              })}
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
