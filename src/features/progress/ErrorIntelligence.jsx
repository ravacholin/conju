import React, { useEffect, useState, useMemo } from 'react'
import { getCurrentUserId } from '../../lib/progress/userManager/index.js'
import { getErrorIntelligence } from '../../lib/progress/analytics.js'
import { getAttemptsByUser } from '../../lib/progress/database.js'
import { useSettings } from '../../state/settings.js'
import { useSessionStore } from '../../state/session.js'
import { createLogger } from '../../lib/utils/logger.js'
import { buildErrorFeedbackCards } from './errorFeedbackCoach.js'
import { buildDrillSettingsUpdate } from './drillNavigationConfig.js'
import { emitProgressEvent, PROGRESS_EVENTS } from '../../lib/events/progressEventBus.js'

const logger = createLogger('features:ErrorIntelligence')


export default function ErrorIntelligence({ data: externalData = null, compact = true, onNavigateToDrill = null }) {
  const [data, setData] = useState({ tags: [], heatmap: { moods: [], tenses: [], cells: [] }, leeches: [] })
  const [loading, setLoading] = useState(!externalData)
  const [isCompact, setIsCompact] = useState(!!compact)
  const settings = useSettings()
  const setDrillRuntimeContext = useSessionStore((state) => state.setDrillRuntimeContext)

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

  useEffect(() => { setIsCompact(!!compact) }, [compact])

  const heatmapMatrix = useMemo(() => {
    const { moods = [], tenses = [], cells = [] } = data.heatmap || {}
    const map = new Map(cells.map(c => [`${c.mood}|${c.tense}`, c]))
    let tensesToShow = tenses
    if (isCompact) {
      const tally = new Map()
      for (const c of cells) {
        tally.set(c.tense, (tally.get(c.tense) || 0) + (c.attempts || 0))
      }
      tensesToShow = Array.from(tally.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([t]) => t)
    }
    return { moods, tenses: tensesToShow, map }
  }, [data.heatmap, isCompact])

  const feedbackCards = useMemo(() => buildErrorFeedbackCards(data), [data])

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
      settings.set(buildDrillSettingsUpdate({}, { practiceMode: 'mixed' }))
      setDrillRuntimeContext({ currentBlock: { combos, itemsRemaining: 8 } })
      if (typeof onNavigateToDrill === 'function') onNavigateToDrill()
      else emitProgressEvent(PROGRESS_EVENTS.NAVIGATE, { micro: { size: 8 } })
    } catch { /* Practice configuration error ignored */ }
  }

  if (loading) {
    return <div className="ei-container"><p className="ei-loading">Cargando análisis de errores...</p></div>
  }

  const errorRate = Math.round(((data.summary?.errorRate7 || 0) * 100))
  const incorrect = data.summary?.incorrect7 || 0
  const total = data.summary?.total7 || 0
  const trend = data.summary?.trend

  return (
    <div className={`ei-container ${isCompact ? 'ei-compact' : ''}`}>
      {/* Error Rate Summary */}
      <div className="ei-rate-summary">
        <div className="ei-rate-main">
          <h3 className="ei-section-title">Errores recientes</h3>
          <span className="ei-rate-value">{errorRate}%</span>
          <span className="ei-rate-detail">{incorrect} de {total} intentos (7 días)</span>
        </div>
        {trend && (
          <span className={`ei-trend ei-trend-${trend === 'up' ? 'worse' : trend === 'down' ? 'better' : 'stable'}`}>
            {trend === 'up' ? '▲ Empeorando' : trend === 'down' ? '▼ Mejorando' : '■ Estable'}
          </span>
        )}
      </div>

      {/* Error Heatmap */}
      {heatmapMatrix.tenses.length > 0 && (
        <section className="ei-heatmap-section">
          <h4 className="ei-section-title">Mapa de errores</h4>
          <p className="ei-section-hint">Tocá una celda para practicar esa combinación</p>
          <div className="ei-heatmap-scroll">
            <table className="ei-heatmap-table">
              <thead>
                <tr>
                  <th className="ei-heatmap-header ei-heatmap-corner">Modo</th>
                  {heatmapMatrix.tenses.map(t => (
                    <th key={t} className="ei-heatmap-header">{formatTense(t)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heatmapMatrix.moods.map(mood => (
                  <tr key={mood}>
                    <td className="ei-heatmap-mood">{formatMood(mood)}</td>
                    {heatmapMatrix.tenses.map(tense => {
                      const c = heatmapMatrix.map.get(`${mood}|${tense}`)
                      const rate = c?.errorRate || 0
                      const intensity = Math.round(rate * 100)
                      const bg = rate > 0
                        ? `rgba(220, 53, 69, ${Math.min(0.75, rate + 0.08)})`
                        : 'rgba(17,17,17,0.5)'
                      return (
                        <td
                          key={tense}
                          className={`ei-heatmap-cell ${c ? 'ei-heatmap-clickable' : ''}`}
                          title={c ? `${intensity}% error en ${c.attempts} intentos — click para practicar` : ''}
                          onClick={() => c && startMicroDrill({ mood, tense })}
                          style={{ background: bg }}
                        >
                          {c ? `${intensity}%` : '·'}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Difficult Verbs (formerly "Leeches") */}
      {data.leeches?.length > 0 && (
        <section className="ei-difficult-section">
          <h4 className="ei-section-title">Verbos que necesitan refuerzo</h4>
          <div className="ei-difficult-list">
            {data.leeches.map((l, i) => (
              <div key={i} className="ei-difficult-card">
                <div className="ei-difficult-info">
                  <strong className="ei-difficult-combo">{formatCombo(l)}</strong>
                  <span className="ei-difficult-meta">
                    {l.lapses} {l.lapses === 1 ? 'error repetido' : 'errores repetidos'}
                  </span>
                  <span className="ei-difficult-meta">Repasar: {formatDue(l.nextDue)}</span>
                </div>
                <button
                  type="button"
                  className="ei-practice-btn"
                  onClick={() => startMicroDrill({ mood: l.mood, tense: l.tense })}
                >
                  Practicar
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Feedback Cards */}
      {feedbackCards.length > 0 && (
        <section className="ei-feedback-section">
          <h4 className="ei-section-title">Reglas y tips</h4>
          <div className="ei-feedback-list">
            {feedbackCards.map((card) => (
              <div key={card.id} className="ei-feedback-card">
                <div className="ei-feedback-header">
                  <strong className="ei-feedback-title">{card.title}</strong>
                  <span className="ei-feedback-rate">{card.errorRate}% error</span>
                </div>
                <div className="ei-feedback-body">
                  <p className="ei-feedback-rule"><strong>Regla:</strong> {card.rule}</p>
                  <p className="ei-feedback-example"><strong>Ejemplo:</strong> {card.example}</p>
                  <p className="ei-feedback-counter"><strong>Evitá:</strong> {card.counterExample}</p>
                </div>
                <button
                  type="button"
                  className="ei-practice-btn"
                  onClick={() => {
                    const [mood, tense] = card.id.split('|')
                    if (mood && tense) startMicroDrill({ mood, tense })
                  }}
                >
                  Practicar esto
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function formatCombo(obj) {
  if (!obj) return ''
  return `${formatMood(obj.mood)} · ${formatTense(obj.tense)}`
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
