import React, { useMemo } from 'react'
import { buildFocusTracks } from './focusTracks.js'

export default function FocusModePanel({ heatMapData, userStats, onStartFocusTrack }) {
  const tracks = useMemo(
    () => buildFocusTracks({ heatMapData, userStats }),
    [heatMapData, userStats]
  )

  return (
    <section className="focus-mode-panel" data-testid="focus-mode-panel">
      <div className="section-header">
        <h2>
          <img src="/icons/diana.png" alt="Focus mode" className="section-icon" />
          Focus mode
        </h2>
        <p>Elige un único objetivo y evita mezclar frentes en la misma sesión.</p>
      </div>

      <ul className="reminder-list">
        {tracks.map((track) => (
          <li key={track.id} className="reminder-card priority-medium">
            <div className="reminder-text">
              <strong>{track.title}</strong>
              <div>{track.description}</div>
              <small>Intensidad: {track.level}</small>
            </div>
            <div className="reminder-actions">
              <button
                type="button"
                className="reminder-button secondary"
                onClick={() => onStartFocusTrack?.(track)}
              >
                Entrenar este foco
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
