import React, { useEffect, useState, useMemo } from 'react'
import { getCurrentUserId } from '../../lib/progress/userManager/index.js'
import { getErrorIntelligence } from '../../lib/progress/analytics.js'
import { getAttemptsByUser } from '../../lib/progress/database.js'
import { useSettings } from '../../state/settings.js'
import { createLogger } from '../../lib/utils/logger.js'

const logger = createLogger('features:ErrorIntelligence')


export default function ErrorIntelligence({ data: externalData = null, compact = true, onNavigateToDrill = null }) {
  const [data, setData] = useState({ tags: [], heatmap: { moods: [], tenses: [], cells: [] }, leeches: [] })
  const [loading, setLoading] = useState(!externalData)
  const [isCompact, setIsCompact] = useState(!!compact)
  const settings = useSettings()

  // If external data arrives, use it; otherwise fetch
  useEffect(() => {
    let cancelled = false
      ; (async () => {
        try {
          if (externalData) {
            setData(externalData)
            setLoading(false)
            return
          }
          setLoading(true)
          const uid = getCurrentUserId()
          const d = await getErrorIntelligence(uid)
          if (!cancelled) setData(d)
        } catch (e) {
          logger.warn('Error loading error intelligence:', e)
        } finally {
          if (!cancelled) setLoading(false)
        }
      })()
    return () => { cancelled = true }
  }, [externalData])

  // Sync internal compact state when prop changes
  useEffect(() => { setIsCompact(!!compact) }, [compact])

  const heatmapMatrix = useMemo(() => {
    const { moods = [], tenses = [], cells = [] } = data.heatmap || {}
    const map = new Map(cells.map(c => [`${c.mood}|${c.tense}`, c]))
    // In compact mode, show only top 6 tenses by total attempts
    let tensesToShow = tenses
    if (isCompact) {
      const tally = new Map()
      for (const c of cells) {
        tally.set(c.tense, (tally.get(c.tense) || 0) + (c.attempts || 0))
      }
      tensesToShow = Array.from(tally.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([t]) => t)
    }
    // In compact, also trim tags to top 3 (already sorted by impact at source)
    return { moods, tenses: tensesToShow, map }
  }, [data.heatmap, isCompact])

  const startMicroDrill = async (tagOrCombo) => {
    try {
      const uid = getCurrentUserId()
      const attempts = await getAttemptsByUser(uid)
      let combos = []
      if (tagOrCombo?.mood && tagOrCombo?.tense) {
        combos = [{ mood: tagOrCombo.mood, tense: tagOrCombo.tense }]
      } else if (typeof tagOrCombo === 'string') {
        const recent = attempts.slice(-300).filter(a => Array.isArray(a.errorTags) && a.errorTags.includes(tagOrCombo))
        const freq = new Map()
        for (const a of recent) {
          const key = `${a.mood}|${a.tense}`
          freq.set(key, (freq.get(key) || 0) + 1)
        }
        combos = Array.from(freq.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => { const [mood, tense] = k.split('|'); return { mood, tense } })
      }
      if (combos.length === 0) return
      settings.set({ practiceMode: 'mixed', currentBlock: { combos, itemsRemaining: 8 } })
      if (typeof onNavigateToDrill === 'function') onNavigateToDrill()
      else window.dispatchEvent(new CustomEvent('progress:navigate', { detail: { micro: { size: 8 } } }))
    } catch { /* Practice configuration error ignored */ }
  }

  if (loading) {
    return <div className="error-intelligence"><p>Cargando inteligencia de errores...</p></div>
  }

  return (
    <div className="error-intelligence" style={{ display: 'grid', gap: '1.25rem', fontSize: isCompact ? '0.95rem' : undefined }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <strong style={{ fontSize: '1.05rem' }}>Tasa de error (últimos 7 días):</strong>
          <span style={{ fontFamily: 'monospace' }}>
            {Math.round(((data.summary?.errorRate7 || 0) * 100))}%
          </span>
          <span style={{ opacity: 0.75, fontSize: 12 }}>
            {data.summary?.incorrect7 || 0} / {data.summary?.total7 || 0}
          </span>
          {data.summary && (
            <span style={{ marginLeft: 8, fontSize: 12, color: data.summary.trend === 'up' ? '#ff6b6b' : data.summary.trend === 'down' ? '#5ee6a5' : '#ffd166' }}>
              {data.summary.trend === 'up' ? '▲ peor' : data.summary.trend === 'down' ? '▼ mejor' : '■ estable'}
            </span>
          )}
        </div>
      </div>
      {/* (Se elimina "Temas prioritarios" para evitar redundancia con módulos superiores) */}

      {/* Heatmap Modo x Tiempo por tasa de error */}
      <section>
        <h4 style={{ margin: '0 0 0.5rem 0' }}>Mapa de errores (Modo × Tiempo)</h4>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: isCompact ? '4px 6px' : '6px 8px', fontWeight: 500, opacity: 0.8, whiteSpace: 'nowrap' }}>Modo / Tiempo</th>
                {heatmapMatrix.tenses.map(t => (
                  <th key={t} style={{ padding: isCompact ? '4px 6px' : '6px 8px', fontWeight: 500, opacity: 0.8, whiteSpace: 'nowrap' }}>{formatTense(t)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {heatmapMatrix.moods.map(mood => (
                <tr key={mood}>
                  <td style={{ padding: isCompact ? '4px 6px' : '6px 8px', opacity: 0.9, whiteSpace: 'nowrap' }}>{formatMood(mood)}</td>
                  {heatmapMatrix.tenses.map(tense => {
                    const c = heatmapMatrix.map.get(`${mood}|${tense}`)
                    const rate = c?.errorRate || 0
                    const intensity = Math.round(rate * 100)
                    const bg = `rgba(220, 53, 69, ${Math.min(0.75, rate + 0.08)})`
                    return (
                      <td key={tense} title={`${Math.round(rate * 100)}% · ${c?.attempts || 0} ej.`}
                        onClick={() => c && startMicroDrill({ mood, tense })}
                        style={{ cursor: c ? 'pointer' : 'default', padding: isCompact ? 4 : 6, border: '1px solid rgba(245,245,245,0.06)', background: rate > 0 ? bg : 'rgba(17,17,17,0.5)', textAlign: 'center', fontSize: isCompact ? 11 : 12 }}>
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
          <h4 style={{ margin: '0 0 0.5rem 0' }}>Rescate de leeches</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {data.leeches.map((l, i) => (
              <div key={i} style={{
                background: 'rgba(17,17,17,0.7)',
                border: '1px solid rgba(245,245,245,0.08)',
                borderRadius: 12,
                padding: isCompact ? '8px 10px' : '10px 12px',
                minWidth: isCompact ? 200 : 220
              }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{formatCombo(l)}</div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>Lapses: {l.lapses} · Ease: {Math.round((l.ease || 0) * 100) / 100}</div>
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

// (Sparkline eliminado junto con Temas prioritarios)

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
  const T = { pres: 'Pres', pretIndef: 'Indef', impf: 'Impf', fut: 'Fut', pretPerf: 'Perf', plusc: 'Plusc', futPerf: 'FutPerf', subjPres: 'SubjPres', subjImpf: 'SubjImpf', subjPerf: 'SubjPerf', subjPlusc: 'SubjPlusc', impAff: 'Imp+', impNeg: 'Imp–', cond: 'Cond', condPerf: 'CondPerf', ger: 'Ger', part: 'Part' }
  return T[tense] || tense
}
function formatDue(d) { try { const dt = new Date(d); return dt.toLocaleDateString() } catch { return '' } }
