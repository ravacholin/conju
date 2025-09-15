import { useCallback, useEffect, useState } from 'react'
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

  // Countdown tick and end-of-time effects
  useEffect(() => {
    if (!settings.resistanceActive) return
    if (settings.resistanceMsLeft <= 0) return

    const id = setInterval(() => {
      const left = Math.max(0, (useSettings as any).getState().resistanceMsLeft - 100)
      settings.set({ resistanceMsLeft: left })

      if (left <= 5000 && left > 0) {
        setUrgentTick(true)
        setTimeout(() => setUrgentTick(false), 150)
      }

      if (left === 0) {
        setShowExplosion(true)
        setTimeout(() => {
          setShowExplosion(false)
          const lvl = (useSettings as any).getState().level || 'A1'
          const best = (useSettings as any).getState().resistanceBestMsByLevel || {}
          const survived = Date.now() - ((useSettings as any).getState().resistanceStartTs || Date.now())
          if (!best[lvl] || survived > best[lvl]) {
            best[lvl] = survived
            settings.set({ resistanceBestMsByLevel: { ...best } })
          }
          settings.set({ resistanceActive: false })
        }, 2000)
      }
    }, 100)
    return () => clearInterval(id)
  }, [settings.resistanceActive, settings.resistanceMsLeft, settings])

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

