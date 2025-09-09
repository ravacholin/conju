import React, { useEffect, useState, useMemo } from 'react'
import { getCurrentUserId } from '../../lib/progress/userManager.js'
import { getErrorIntelligence } from '../../lib/progress/analytics.js'
import { getAttemptsByUser } from '../../lib/progress/database.js'
import { useSettings } from '../../state/settings.js'

export default function ErrorIntelligence() {
  const [data, setData] = useState({ tags: [], heatmap: { moods: [], tenses: [], cells: [] }, leeches: [] })
  const [loading, setLoading] = useState(true)
  const settings = useSettings()

  useEffect(() => {
    (async () => {
      try {
        setLoading(true)
        const uid = getCurrentUserId()
        const d = await getErrorIntelligence(uid)
        setData(d)
      } catch (e) {
        console.warn('Error loading error intelligence:', e)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const heatmapMatrix = useMemo(() => {
    const { moods, tenses, cells } = data.heatmap || {}
    const map = new Map(cells.map(c => [`${c.mood}|${c.tense}`, c]))
    return { moods, tenses, map }
  }, [data.heatmap])

  const startMicroDrill = async (tagOrCombo) => {
    try {
      const uid = getCurrentUserId()
      const attempts = await getAttemptsByUser(uid)
      let combos = []
      if (tagOrCombo?.mood && tagOrCombo?.tense) {
        combos = [ { mood: tagOrCombo.mood, tense: tagOrCombo.tense } ]
      } else if (typeof tagOrCombo === 'string') {
        const recent = attempts.slice(-300).filter(a => Array.isArray(a.errorTags) && a.errorTags.includes(tagOrCombo))
        const freq = new Map()
        for (const a of recent) {
          const key = `${a.mood}|${a.tense}`
          freq.set(key, (freq.get(key) || 0) + 1)
        }
        combos = Array.from(freq.entries()).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([k])=>{ const [mood, tense]=k.split('|'); return { mood, tense } })
      }
      if (combos.length === 0) return
      settings.set({ practiceMode: 'mixed', currentBlock: { combos, itemsRemaining: 8 } })
      window.dispatchEvent(new CustomEvent('progress:navigate', { detail: { micro: { size: 8 } } }))
    } catch {}
  }

  if (loading) {
    return <div className="error-intelligence"><p>Cargando inteligencia de errores...</p></div>
  }

  return (
    <div className="error-intelligence" style={{ display: 'grid', gap: '1.5rem' }}>
      {/* Burbujas por tema con tendencia */}
      <section>
        <h4 style={{ margin: '0 0 0.75rem 0' }}>Temas prioritarios</h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {data.tags.map((t) => (
            <div key={t.tag} style={{
              background: 'rgba(17,17,17,0.7)',
              border: '1px solid rgba(245,245,245,0.08)',
              borderRadius: 14,
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              minWidth: 180,
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <strong>{t.label}</strong>
                <span style={{ opacity: 0.7, fontSize: 12 }}>({t.count})</span>
                <span style={{ marginLeft: 'auto', fontSize: 12, opacity: 0.9, color: t.trend==='up'?'#ff6b6b':t.trend==='down'?'#5ee6a5':'#ffd166' }}>
                  {t.trend==='up' ? '▲' : t.trend==='down' ? '▼' : '■'}
                </span>
              </div>
              <Sparkline values={t.sparkline} />
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button className="btn btn-compact" onClick={() => startMicroDrill(t.tag)}>Practicar</button>
                {t.topCombos?.[0] && (
                  <button className="btn btn-secondary btn-compact" onClick={() => startMicroDrill(t.topCombos[0])}>
                    Foco: {formatCombo(t.topCombos[0])}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Heatmap Modo x Tiempo por tasa de error */}
      <section>
        <h4 style={{ margin: '0 0 0.75rem 0' }}>Mapa de errores (Modo × Tiempo)</h4>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 500, opacity: 0.8 }}>Modo / Tiempo</th>
                {heatmapMatrix.tenses.map(t => (
                  <th key={t} style={{ padding: '6px 8px', fontWeight: 500, opacity: 0.8 }}>{formatTense(t)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {heatmapMatrix.moods.map(mood => (
                <tr key={mood}>
                  <td style={{ padding: '6px 8px', opacity: 0.9 }}>{formatMood(mood)}</td>
                  {heatmapMatrix.tenses.map(tense => {
                    const c = heatmapMatrix.map.get(`${mood}|${tense}`)
                    const rate = c?.errorRate || 0
                    const intensity = Math.round(rate * 100)
                    const bg = `rgba(220, 53, 69, ${Math.min(0.75, rate + 0.08)})`
                    return (
                      <td key={tense} title={`${Math.round(rate*100)}% · ${c?.attempts||0} ej.`}
                        onClick={() => c && startMicroDrill({ mood, tense })}
                        style={{ cursor: c?'pointer':'default', padding: 6, border: '1px solid rgba(245,245,245,0.06)', background: rate>0?bg:'rgba(17,17,17,0.5)', textAlign: 'center', fontSize: 12 }}>
                        {c ? `${intensity}%` : '—'}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Leeches prioritarios */}
      {data.leeches?.length > 0 && (
        <section>
          <h4 style={{ margin: '0 0 0.75rem 0' }}>Rescate de leeches</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {data.leeches.map((l, i) => (
              <div key={i} style={{
                background: 'rgba(17,17,17,0.7)',
                border: '1px solid rgba(245,245,245,0.08)',
                borderRadius: 12,
                padding: '10px 12px',
                minWidth: 220
              }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{formatCombo(l)}</div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>Lapses: {l.lapses} · Ease: {Math.round((l.ease||0)*100)/100}</div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>Próx.: {formatDue(l.nextDue)}</div>
                <div style={{ marginTop: 8 }}>
                  <button className="btn btn-compact" onClick={() => startMicroDrill({ mood: l.mood, tense: l.tense })}>Practicar</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function Sparkline({ values = [] }) {
  const max = Math.max(1, ...values)
  const pts = values.map((v, i) => {
    const x = (i / Math.max(1, values.length - 1)) * 100
    const y = 20 - (v / max) * 20
    return `${x},${y}`
  }).join(' ')
  return (
    <svg width="100%" height="24" viewBox="0 0 100 20">
      <polyline fill="none" stroke="#8eb4e3" strokeWidth="1.5" points={pts} />
    </svg>
  )
}

function formatCombo(obj) {
  if (!obj) return ''
  const mood = obj.mood, tense = obj.tense
  return `${formatMood(mood)} · ${formatTense(tense)}`
}

function formatMood(mood) {
  const M = { indicative: 'Indicativo', subjunctive: 'Subjuntivo', imperative: 'Imperativo', conditional: 'Condicional', nonfinite: 'No finito' }
  return M[mood] || mood
}
function formatTense(tense) {
  const T = { pres:'Pres', pretIndef:'Indef', impf:'Impf', fut:'Fut', pretPerf:'Perf', plusc:'Plusc', futPerf:'FutPerf', subjPres:'SubjPres', subjImpf:'SubjImpf', subjPerf:'SubjPerf', subjPlusc:'SubjPlusc', impAff:'Imp+', impNeg:'Imp–', cond:'Cond', condPerf:'CondPerf', ger:'Ger', part:'Part' }
  return T[tense] || tense
}
function formatDue(d) { try { const dt = new Date(d); return dt.toLocaleDateString() } catch { return '' } }

