import React, { useEffect, useState } from 'react'
import { getAttemptsByUser } from '../../lib/progress/database.js'
import { getCurrentUserId } from '../../lib/progress/userManager.js'
import { useSettings } from '../../state/settings.js'

export default function ErrorInsights() {
  const [topErrors, setTopErrors] = useState([])
  const settings = useSettings()

  useEffect(() => {
    (async () => {
      try {
        const uid = getCurrentUserId()
        const attempts = await getAttemptsByUser(uid)
        const recent = attempts.slice(-500)
        const freq = new Map()
        recent.forEach(a => (a.errorTags || []).forEach(t => freq.set(t, (freq.get(t) || 0) + 1)))
        const top = Array.from(freq.entries()).sort((a,b)=>b[1]-a[1]).slice(0,5)
        setTopErrors(top)
      } catch {}
    })()
  }, [])

  const startMicroDrill = async (tag) => {
    try {
      const uid = getCurrentUserId()
      const attempts = await getAttemptsByUser(uid)
      const recent = attempts.slice(-300).filter(a => (a.errorTags || []).includes(tag))
      if (recent.length === 0) return
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
      settings.set({ practiceMode: 'mixed', currentBlock: { combos: topCombos, itemsRemaining: 5 } })
      window.dispatchEvent(new CustomEvent('progress:navigate', { detail: { micro: { errorTag: tag, size: 5 } } }))
    } catch {}
  }

  if (topErrors.length === 0) {
    return <div className="error-insights">Sin errores destacados recientes.</div>
  }

  return (
    <div className="error-insights">
      <ul>
        {topErrors.map(([tag, n]) => (
          <li key={tag} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span><strong>{tag}</strong> · {n} veces</span>
            <button className="btn btn-small" onClick={() => startMicroDrill(tag)}>Practicar 5</button>
          </li>
        ))}
      </ul>
    </div>
  )
}

