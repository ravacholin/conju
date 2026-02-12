export function createLazyTaskScheduler({
  scheduleTimeout = (fn, delay) => setTimeout(fn, delay),
  clearScheduledTimeout = (id) => clearTimeout(id),
  scheduleIdle = (fn, timeout) => {
    if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
      return window.requestIdleCallback(fn, { timeout })
    }
    return scheduleTimeout(fn, 100)
  },
  cancelIdle = (id) => {
    if (typeof window !== 'undefined' && typeof window.cancelIdleCallback === 'function') {
      window.cancelIdleCallback(id)
    } else {
      clearScheduledTimeout(id)
    }
  }
} = {}) {
  let timeoutId = null
  let idleId = null
  let executed = false

  const runTask = (task) => {
    if (executed) {
      return
    }
    executed = true

    if (timeoutId) {
      clearScheduledTimeout(timeoutId)
      timeoutId = null
    }
    if (idleId) {
      cancelIdle(idleId)
      idleId = null
    }

    task?.()
  }

  return {
    schedule(task, { idleTimeout = 3000, fallbackTimeout = 5000, onFallback } = {}) {
      this.cancel()
      executed = false

      idleId = scheduleIdle(() => runTask(task), idleTimeout)
      timeoutId = scheduleTimeout(() => {
        onFallback?.()
        runTask(task)
      }, fallbackTimeout)
    },
    cancel() {
      executed = true
      if (timeoutId) {
        clearScheduledTimeout(timeoutId)
        timeoutId = null
      }
      if (idleId) {
        cancelIdle(idleId)
        idleId = null
      }
    }
  }
}
