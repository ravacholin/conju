import React, { useEffect, useState } from 'react'
import { getRealUserStats } from '../../lib/progress/realTimeAnalytics.js'
import { getAttemptsByUser } from '../../lib/progress/database.js'
import { getCurrentUserId } from '../../lib/progress/userManager.js'
import { useSettings } from '../../state/settings.js'

export default function SessionHUD() {
  const [stats, setStats] = useState({ accuracy: 0, avgLatency: 0, currentSessionStreak: 0 })
  const [topErrors, setTopErrors] = useState([])
  const settings = useSettings()

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
      } catch {
        /* ignore error */
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
          <div style={{ marginTop: 6, display: 'flex', gap: 8 }}>
            {topErrors.map(([tag]) => (
              <button
                key={tag}
                className="btn btn-small"
                onClick={async () => {
                  try {
                    const uid = getCurrentUserId()
                    const attempts = await getAttemptsByUser(uid)
                    const recent = attempts.slice(-300).filter(a => (a.errorTags || []).includes(tag))
                    if (recent.length === 0) return
                    // Agrupar por combo y priorizar los más frecuentes
                    const freq = new Map()
                    recent.forEach(a => {
                      const key = `${a.mood}|${a.tense}`
                      freq.set(key, (freq.get(key) || 0) + 1)
                    })
                    const topCombos = Array.from(freq.entries())
                      .sort((a,b)=>b[1]-a[1])
                      .slice(0,3)
                      .map(([k]) => { const [mood,tense]=k.split('|'); return { mood, tense } })
                    if (topCombos.length === 0) return
                    // Configurar bloque de micro-drill
                    settings.set({
                      practiceMode: 'mixed',
                      currentBlock: { combos: topCombos, itemsRemaining: 5 }
                    })
                    window.dispatchEvent(new CustomEvent('progress:navigate', { detail: { micro: { errorTag: tag, size: 5 } } }))
                  } catch {
                    /* ignore error */
                  }
                }}
              >
                Practicar 5 ({tag})
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
