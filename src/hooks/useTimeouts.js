import { useCallback, useEffect, useRef } from 'react'

export default function useTimeouts() {
  const timeoutsRef = useRef(new Map())

  const clearAllTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(timeoutId => {
      clearTimeout(timeoutId)
    })
    timeoutsRef.current.clear()
  }, [])

  const cancelTimeout = useCallback((key) => {
    const timeoutId = timeoutsRef.current.get(key)
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId)
      timeoutsRef.current.delete(key)
    }
  }, [])

  const scheduleTimeout = useCallback(
    (key, callback, delay) => {
      cancelTimeout(key)

      const timeoutId = setTimeout(() => {
        timeoutsRef.current.delete(key)
        callback()
      }, delay)

      timeoutsRef.current.set(key, timeoutId)
      return timeoutId
    },
    [cancelTimeout]
  )

  useEffect(() => {
    return () => {
      clearAllTimeouts()
    }
  }, [clearAllTimeouts])

  return {
    scheduleTimeout,
    cancelTimeout,
    clearAllTimeouts
  }
}
