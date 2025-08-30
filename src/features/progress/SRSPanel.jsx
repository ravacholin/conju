import React, { useEffect, useState } from 'react'
import { getSRSStats } from '../../lib/progress/analytics.js'
import { getCurrentUserId } from '../../lib/progress/userManager.js'

export default function SRSPanel() {
  const [stats, setStats] = useState({ dueNow: 0, dueToday: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        setLoading(true)
        const uid = getCurrentUserId()
        const s = await getSRSStats(uid)
        setStats(s)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  return (
    <div className="srs-panel">
      {loading ? (
        <div className="srs-loading">Calculando cola de repaso…</div>
      ) : (
        <div className="srs-stats">
          <div className="srs-card">
            <div className="srs-value">{stats.dueNow}</div>
            <div className="srs-label">Pendientes ahora</div>
          </div>
          <div className="srs-card">
            <div className="srs-value">{stats.dueToday}</div>
            <div className="srs-label">Para hoy</div>
          </div>
          <button
            className="btn"
            onClick={() => {
              // Señal mínima: que el Drill enfatique el repaso (la lógica interna ya prioriza due)
              window.dispatchEvent(new CustomEvent('progress:navigate', { detail: { focus: 'review' } }))
            }}
          >
            Empezar repaso
          </button>
        </div>
      )}
    </div>
  )
}

