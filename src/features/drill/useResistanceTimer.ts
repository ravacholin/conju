import { useCallback, useEffect, useRef, useState } from 'react'
import { useSettings } from '../../state/settings.js'

/**
 * useResistanceTimer.ts
 * Encapsulates resistance/survival countdown behavior and HUD UI flags.
 */
export function useResistanceTimer() {
  const settings = useSettings()
  const [showExplosion, setShowExplosion] = useState(false)
  const [urgentTick, setUrgentTick] = useState(false)
  const [clockClickFeedback, setClockClickFeedback] = useState(false)
  const intervalRef = useRef<number | null>(null)

  // Countdown tick and end-of-time effects
  useEffect(() => {
    const clearTimer = () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    if (!settings.resistanceActive) {
      clearTimer()
      return
    }

    const currentState = (useSettings as any).getState()
    if (currentState.resistanceMsLeft <= 0) {
      clearTimer()
      return
    }

    if (typeof window === 'undefined') {
      return
    }

    intervalRef.current = window.setInterval(() => {
      const state = (useSettings as any).getState()
      const left = Math.max(0, (state.resistanceMsLeft || 0) - 100)
      settings.set({ resistanceMsLeft: left })

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
            settings.set({ resistanceBestMsByLevel: { ...best } })
          }
          settings.set({ resistanceActive: false })
        }, 2000)
      }
    }, 100)

    return () => {
      clearTimer()
    }
  }, [settings.resistanceActive])

  // On-clock click: add 5 seconds and feedback
  const handleClockClick = useCallback(() => {
    if (!settings.resistanceActive || settings.resistanceMsLeft <= 0) return
    const currentMs = settings.resistanceMsLeft
    settings.set({ resistanceMsLeft: currentMs + 5000 })
    setClockClickFeedback(true)
    setTimeout(() => setClockClickFeedback(false), 300)
  }, [settings])

  return {
    showExplosion,
    urgentTick,
    clockClickFeedback,
    handleClockClick
  }
}
