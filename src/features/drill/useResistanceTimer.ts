import { useCallback, useEffect, useRef, useState } from 'react'
import { useSettings, RESISTANCE_MAX_MS } from '../../state/settings.js'

/**
 * useResistanceTimer.ts
 * Encapsulates resistance/survival countdown behavior and HUD UI flags.
 *
 * The live countdown (msLeft) lives in local state/ref here, ticking every
 * 100ms, instead of the global persisted settings store. Writing it to the
 * store on every tick used to fan out a re-render (and a persist middleware
 * write) 10x/second to every component subscribed to useSettings(), for the
 * whole duration of resistance mode. Only the rare, meaningful transitions
 * (start/stop, new best time) still touch the store — GamesPanel seeds the
 * initial resistanceMsLeft/resistanceStartTs when toggling resistance mode on.
 */
export function useResistanceTimer() {
  const resistanceActive = useSettings((s) => s.resistanceActive)
  const set = useSettings((s) => s.set)
  const [msLeft, setMsLeft] = useState(0)
  const [showExplosion, setShowExplosion] = useState(false)
  const [urgentTick, setUrgentTick] = useState(false)
  const [clockClickFeedback, setClockClickFeedback] = useState(false)
  const intervalRef = useRef<number | null>(null)
  const msLeftRef = useRef(0)

  // Countdown tick and end-of-time effects
  useEffect(() => {
    const clearTimer = () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    if (!resistanceActive) {
      clearTimer()
      return
    }

    // Seed the local countdown from the value GamesPanel wrote when starting resistance mode.
    const initialMs = (useSettings as any).getState().resistanceMsLeft || 0
    msLeftRef.current = initialMs
    setMsLeft(initialMs)

    if (initialMs <= 0 || typeof window === 'undefined') {
      return
    }

    intervalRef.current = window.setInterval(() => {
      const left = Math.max(0, msLeftRef.current - 100)
      msLeftRef.current = left
      setMsLeft(left)

      if (left <= 5000 && left > 0) {
        setUrgentTick(true)
        setTimeout(() => setUrgentTick(false), 150)
      }

      if (left === 0) {
        clearTimer()
        setShowExplosion(true)
        setTimeout(() => {
          setShowExplosion(false)
          const latest = (useSettings as any).getState()
          const lvl = latest.level || 'A1'
          const best = latest.resistanceBestMsByLevel || {}
          const survived = Date.now() - (latest.resistanceStartTs || Date.now())
          if (!best[lvl] || survived > best[lvl]) {
            best[lvl] = survived
            set({ resistanceBestMsByLevel: { ...best } })
          }
          set({ resistanceActive: false })
        }, 2000)
      }
    }, 100)

    return () => {
      clearTimer()
    }
  }, [resistanceActive, set])

  // On-clock click: add 5 seconds and feedback
  const handleClockClick = useCallback(() => {
    if (!resistanceActive || msLeftRef.current <= 0) return
    msLeftRef.current = Math.min(msLeftRef.current + 5000, RESISTANCE_MAX_MS)
    setMsLeft(msLeftRef.current)
    setClockClickFeedback(true)
    setTimeout(() => setClockClickFeedback(false), 300)
  }, [resistanceActive])

  // Called by Drill on a correct answer to add bonus time.
  const addTime = useCallback((ms: number) => {
    msLeftRef.current = Math.min(msLeftRef.current + ms, RESISTANCE_MAX_MS)
    setMsLeft(msLeftRef.current)
  }, [])

  return {
    msLeft,
    showExplosion,
    urgentTick,
    clockClickFeedback,
    handleClockClick,
    addTime
  }
}
