import React, { useEffect, useState } from 'react'
import { getRealUserStats } from '../../lib/progress/realTimeAnalytics.js'
import { getAttemptsByUser } from '../../lib/progress/database.js'
import { getCurrentUserId } from '../../lib/progress/userManager.js'

export default function SessionHUD() {
  const [stats, setStats] = useState({ accuracy: 0, avgLatency: 0, currentSessionStreak: 0 })
  const [topErrors, setTopErrors] = useState([])

  useEffect(() => {
    (async () => {
      try {
        const uid = getCurrentUserId()
        const s = await getRealUserStats(uid)
        setStats({
          accuracy: s.accuracy || 0,
          avgLatency: s.avgLatency || 0,
          currentSessionStreak: s.currentSessionStreak || 0
        })
        const attempts = await getAttemptsByUser(uid)
        const recent = attempts.slice(-50)
        const freq = new Map()
        recent.forEach(a => {
          ;(a.errorTags || []).forEach(tag => freq.set(tag, (freq.get(tag) || 0) + 1))
        })
        const top = Array.from(freq.entries()).sort((a,b)=>b[1]-a[1]).slice(0,3)
        setTopErrors(top)
      } catch (e) {
        // ignore
      }
    })()
  }, [])

  const msToSec = (ms) => Math.round((ms || 0) / 100) / 10

  return (
    <div className="session-hud" style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', margin: '8px 0' }}>
      <div className="hud-card" title="Precisión global (aprox.)">
        <strong>Precisión</strong>: {stats.accuracy}%
      </div>
      <div className="hud-card" title="Tiempo medio por ítem">
        <strong>Tiempo</strong>: {msToSec(stats.avgLatency)}s
      </div>
      <div className="hud-card" title="Racha en esta sesión">
        <strong>Racha</strong>: {stats.currentSessionStreak}
      </div>
      {topErrors.length > 0 && (
        <div className="hud-card" title="Errores más comunes (últimos 50)">
          <strong>Errores</strong>: {topErrors.map(([tag, n]) => `${tag}(${n})`).join(' · ')}
        </div>
      )}
    </div>
  )
}

