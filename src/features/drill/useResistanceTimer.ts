import { useCallback, useEffect, useRef, useState } from 'react'
import { useSettings, RESISTANCE_MAX_MS } from '../../state/settings.js'
import { useSessionStore } from '../../state/session.js'
import { playGameSound } from '../../lib/audio/soundEffects.js'

/**
 * useResistanceTimer.ts
 * Encapsulates resistance/survival countdown behavior and HUD UI flags.
 *
 * The live countdown (msLeft) lives in local state/ref here, ticking every
 * 100ms, instead of the global persisted settings store. Writing it to the
 * store on every tick used to fan out a re-render (and a persist middleware
 * write) 10x/second to every component subscribed to useSettings(), for the
 * whole duration of resistance mode. Only the rare, meaningful transitions
 * (start/stop, new best time) still touch a store — GamesPanel seeds the
 * initial resistanceMsLeft/resistanceStartTs when toggling resistance mode on.
 *
 * The mode's on/off state is ephemeral and lives in useSessionStore, so it does
 * not survive a reload. Only the best-time record is a durable setting.
 */
export function useResistanceTimer() {
  const resistanceActive = useSessionStore((s) => s.resistanceActive)
  const setGameMode = useSessionStore((s) => s.setGameMode)
  const set = useSettings((s) => s.set)
  const [msLeft, setMsLeft] = useState(0)
  const [showExplosion, setShowExplosion] = useState(false)
  const [urgentTick, setUrgentTick] = useState(false)
  const [clockClickFeedback, setClockClickFeedback] = useState(false)
  const intervalRef = useRef<number | null>(null)
  const msLeftRef = useRef(0)
  // Último segundo entero al que ya le sonó el tick, para disparar el pip de
  // cuenta regresiva una sola vez por segundo (el interval corre cada 100ms).
  const lastTickSecondRef = useRef<number | null>(null)
  const urgentTickTimeoutRef = useRef<number | null>(null)
  const explosionTimeoutRef = useRef<number | null>(null)
  const clockClickTimeoutRef = useRef<number | null>(null)

  // Countdown tick and end-of-time effects
  useEffect(() => {
    const clearTimer = () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
    const clearPendingTimeouts = () => {
      if (urgentTickTimeoutRef.current !== null) {
        clearTimeout(urgentTickTimeoutRef.current)
        urgentTickTimeoutRef.current = null
      }
      if (explosionTimeoutRef.current !== null) {
        clearTimeout(explosionTimeoutRef.current)
        explosionTimeoutRef.current = null
      }
    }

    if (!resistanceActive) {
      clearTimer()
      clearPendingTimeouts()
      return
    }

    // Seed the local countdown from the value GamesPanel wrote when starting resistance mode.
    const initialMs = useSessionStore.getState().resistanceMsLeft || 0
    msLeftRef.current = initialMs
    setMsLeft(initialMs)
    lastTickSecondRef.current = null

    if (initialMs <= 0 || typeof window === 'undefined') {
      return
    }

    intervalRef.current = window.setInterval(() => {
      const left = Math.max(0, msLeftRef.current - 100)
      msLeftRef.current = left
      setMsLeft(left)

      if (left <= 5000 && left > 0) {
        setUrgentTick(true)
        if (urgentTickTimeoutRef.current !== null) {
          clearTimeout(urgentTickTimeoutRef.current)
        }
        urgentTickTimeoutRef.current = window.setTimeout(() => {
          urgentTickTimeoutRef.current = null
          setUrgentTick(false)
        }, 150)

        // Pip de cuenta regresiva: una vez por segundo entero (no cada 100ms).
        const second = Math.ceil(left / 1000)
        if (lastTickSecondRef.current !== second) {
          lastTickSecondRef.current = second
          playGameSound('tick')
        }
      }

      if (left === 0) {
        clearTimer()
        playGameSound('gameOver')
        setShowExplosion(true)
        explosionTimeoutRef.current = window.setTimeout(() => {
          explosionTimeoutRef.current = null
          setShowExplosion(false)
          const latest = (useSettings as any).getState()
          const lvl = latest.level || 'A1'
          const best = latest.resistanceBestMsByLevel || {}
          const startTs = useSessionStore.getState().resistanceStartTs
          const survived = Date.now() - (startTs || Date.now())
          if (!best[lvl] || survived > best[lvl]) {
            best[lvl] = survived
            set({ resistanceBestMsByLevel: { ...best } })
          }
          setGameMode({ resistanceActive: false })
        }, 2000)
      }
    }, 100)

    return () => {
      clearTimer()
      clearPendingTimeouts()
    }
  }, [resistanceActive, set, setGameMode])

  // Clear any pending timeouts if the component using this hook unmounts, so a stale
  // callback can't fire setState or write to the global settings store after unmount.
  useEffect(() => {
    return () => {
      if (urgentTickTimeoutRef.current !== null) clearTimeout(urgentTickTimeoutRef.current)
      if (explosionTimeoutRef.current !== null) clearTimeout(explosionTimeoutRef.current)
      if (clockClickTimeoutRef.current !== null) clearTimeout(clockClickTimeoutRef.current)
    }
  }, [])

  // On-clock click: add 5 seconds and feedback
  const handleClockClick = useCallback(() => {
    if (!resistanceActive || msLeftRef.current <= 0) return
    msLeftRef.current = Math.min(msLeftRef.current + 5000, RESISTANCE_MAX_MS)
    setMsLeft(msLeftRef.current)
    playGameSound('bonus')
    setClockClickFeedback(true)
    if (clockClickTimeoutRef.current !== null) {
      clearTimeout(clockClickTimeoutRef.current)
    }
    clockClickTimeoutRef.current = window.setTimeout(() => {
      clockClickTimeoutRef.current = null
      setClockClickFeedback(false)
    }, 300)
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
