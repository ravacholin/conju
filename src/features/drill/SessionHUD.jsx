import React, { useCallback, useEffect, useRef, useState } from 'react'
import { getRealUserStats } from '../../lib/progress/realTimeAnalytics.js'
import { getRecentAttempts } from '../../lib/progress/database.js'
import { getDueItems } from '../../lib/progress/srs.js'
import { getCurrentUserId } from '../../lib/progress/userManager.js'
import { useSettings } from '../../state/settings.js'

const DUE_LOOKAHEAD_MS = 6 * 60 * 60 * 1000 // six hours

export default function SessionHUD() {
  const [stats, setStats] = useState({ accuracy: 0, avgLatency: 0, currentSessionStreak: 0 })
  const [topErrors, setTopErrors] = useState([])
  const [dueSummary, setDueSummary] = useState({
    total: 0,
    overdue: 0,
    dueSoon: 0,
    nextDueInMinutes: null,
    combos: [],
    cells: []
  })
  const settings = useSettings()
  const requestSeq = useRef(0)
  const analyticsController = useRef(null)

  useEffect(() => {
    let isActive = true

    const loadSessionData = async () => {
      const uid = getCurrentUserId()
      if (!uid) return

      const requestId = requestSeq.current + 1
      requestSeq.current = requestId

      analyticsController.current?.abort()
      const controller = new AbortController()
      analyticsController.current = controller

      try {
        const now = Date.now()
        const cutoff = new Date(now + DUE_LOOKAHEAD_MS)
        const [s, attempts, dueItems] = await Promise.all([
          getRealUserStats(uid, controller.signal),
          getRecentAttempts(uid, 400),
          getDueItems(uid, cutoff)
        ])

        if (!isActive || requestSeq.current !== requestId) return

        setStats({
          accuracy: s.accuracy || 0,
          avgLatency: s.avgLatency || 0,
          currentSessionStreak: s.currentSessionStreak || 0
        })

        const recent = attempts.slice(0, 50)
        const freq = new Map()
        recent.forEach(a => {
          ;(a.errorTags || []).forEach(tag => {
            freq.set(tag, (freq.get(tag) || 0) + 1)
          })
        })
        const top = Array.from(freq.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
        setTopErrors(top)

        const combosMap = new Map()
        const cells = []
        let overdue = 0
        let dueSoon = 0
        let nextDueTs = null

        for (const item of dueItems) {
          if (!item) continue
          const dueTs = new Date(item.nextDue || 0).getTime()
          if (Number.isFinite(dueTs)) {
            if (dueTs <= now) overdue += 1
            else dueSoon += 1
            if (nextDueTs === null || dueTs < nextDueTs) {
              nextDueTs = dueTs
            }
          }
          const comboKey = `${item.mood}|${item.tense}`
          if (!combosMap.has(comboKey) && combosMap.size < 8) {
            combosMap.set(comboKey, { mood: item.mood, tense: item.tense })
          }
          if (cells.length < 24) {
            cells.push({ mood: item.mood, tense: item.tense, person: item.person })
          }
        }

        const total = dueItems.length
        const nextDueInMinutes =
          nextDueTs === null ? null : Math.max(0, Math.round((nextDueTs - now) / 60000))

        setDueSummary({
          total,
          overdue,
          dueSoon,
          nextDueInMinutes,
          combos: Array.from(combosMap.values()),
          cells
        })
      } catch (error) {
        if (error?.name === 'AbortError') return
        if (import.meta.env?.DEV) {
          console.warn('SessionHUD loadSessionData failed', error)
        }
      } finally {
        if (analyticsController.current === controller) {
          analyticsController.current = null
        }
      }
    }

    const handleProgressUpdate = () => {
      loadSessionData()
    }

    loadSessionData()
    window.addEventListener('progress:dataUpdated', handleProgressUpdate)

    return () => {
      isActive = false
      analyticsController.current?.abort()
      window.removeEventListener('progress:dataUpdated', handleProgressUpdate)
    }
  }, [])

  const msToSec = (ms) => Math.round((ms || 0) / 100) / 10

  const handleStartDueReview = useCallback(() => {
    if (dueSummary.total === 0 || dueSummary.combos.length === 0) {
      return
    }
    const sessionSize = Math.min(12, Math.max(6, dueSummary.total))
    settings.set({
      practiceMode: 'mixed',
      currentBlock: {
        id: 'srs-due-review',
        label: 'Revisión SRS',
        combos: dueSummary.combos,
        cells: dueSummary.cells,
        itemsRemaining: sessionSize,
        focus: 'srs'
      }
    })
    window.dispatchEvent(
      new CustomEvent('progress:navigate', {
        detail: {
          micro: {
            dueReview: true,
            size: sessionSize
          }
        }
      })
    )
  }, [dueSummary, settings])

  return (
    <div
      className="session-hud"
      style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', margin: '8px 0' }}
    >
      <div className="hud-card" title="Precisión global (aprox.)">
        <strong>Precisión</strong>: {stats.accuracy}%
      </div>
      <div className="hud-card" title="Tiempo medio por ítem">
        <strong>Tiempo</strong>: {msToSec(stats.avgLatency)}s
      </div>
      <div className="hud-card" title="Racha en esta sesión">
        <strong>Racha</strong>: {stats.currentSessionStreak}
      </div>
      <div
        className="hud-card"
        title="Resumen de revisión SRS (pendientes y próximas en ventana de 6h)"
        style={{ minWidth: 190 }}
      >
        <strong>Revisión</strong>:{' '}
        {dueSummary.total > 0 ? (
          <>
            {dueSummary.overdue} vencidas
            {dueSummary.dueSoon > 0 ? ` · ${dueSummary.dueSoon} próximas` : ''}
            {typeof dueSummary.nextDueInMinutes === 'number' && (
              <span style={{ display: 'block', fontSize: 12, opacity: 0.85, marginTop: 4 }}>
                Próxima en ~{dueSummary.nextDueInMinutes} min
              </span>
            )}
            <div style={{ marginTop: 6 }}>
              <button
                className="btn btn-small"
                onClick={handleStartDueReview}
                disabled={dueSummary.total === 0}
              >
                Repasar {Math.min(12, Math.max(6, dueSummary.total))} ahora
              </button>
            </div>
          </>
        ) : (
          <span>al día</span>
        )}
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
                    const attempts = await getRecentAttempts(uid, 400)
                    const recent = attempts
                      .filter(a => (a.errorTags || []).includes(tag))
                      .slice(0, 300)
                    if (recent.length === 0) return
                    const freq = new Map()
                    recent.forEach(a => {
                      const key = `${a.mood}|${a.tense}`
                      freq.set(key, (freq.get(key) || 0) + 1)
                    })
                    const topCombos = Array.from(freq.entries())
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 3)
                      .map(([key]) => {
                        const [mood, tense] = key.split('|')
                        return { mood, tense }
                      })
                    if (topCombos.length === 0) return
                    settings.set({
                      practiceMode: 'mixed',
                      currentBlock: { combos: topCombos, itemsRemaining: 5 }
                    })
                    window.dispatchEvent(
                      new CustomEvent('progress:navigate', { detail: { micro: { errorTag: tag, size: 5 } } })
                    )
                  } catch (error) {
                    if (import.meta.env?.DEV) {
                      console.warn('Error launching micro drill from SessionHUD', error)
                    }
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
