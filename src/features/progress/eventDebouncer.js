export function createEventDebouncer({ delayMs = 250, onDebounced } = {}) {
  let timeoutId = null
  let lastPayload

  const clearTimer = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  return {
    trigger(payload) {
      lastPayload = payload
      clearTimer()
      timeoutId = setTimeout(() => {
        timeoutId = null
        onDebounced?.(lastPayload)
      }, delayMs)
    },
    cancel() {
      clearTimer()
      lastPayload = undefined
    }
  }
}
