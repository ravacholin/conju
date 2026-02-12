function normalizeKeys(keys) {
  if (!Array.isArray(keys)) {
    return []
  }
  return keys.filter(Boolean)
}

export function createProgressUpdateBatcher({
  delay = 400,
  schedule = (cb, timeout) => setTimeout(cb, timeout),
  clear = (id) => clearTimeout(id),
  onFlush
} = {}) {
  let timerId = null
  let disposed = false
  let requiresFullRefresh = false
  const pendingKeys = new Set()

  const flush = () => {
    if (disposed) {
      return
    }

    if (timerId) {
      clear(timerId)
      timerId = null
    }

    const payload = {
      fullRefresh: requiresFullRefresh,
      keys: Array.from(pendingKeys)
    }

    requiresFullRefresh = false
    pendingKeys.clear()

    onFlush?.(payload)
  }

  const scheduleFlush = () => {
    if (disposed) {
      return
    }
    if (timerId) {
      clear(timerId)
    }
    timerId = schedule(flush, delay)
  }

  return {
    addUpdate(keys) {
      if (disposed) {
        return
      }

      const normalized = normalizeKeys(keys)
      if (normalized.length === 0) {
        requiresFullRefresh = true
      } else if (!requiresFullRefresh) {
        normalized.forEach((key) => pendingKeys.add(key))
      }

      scheduleFlush()
    },
    flush,
    dispose() {
      disposed = true
      if (timerId) {
        clear(timerId)
        timerId = null
      }
      pendingKeys.clear()
      requiresFullRefresh = false
    }
  }
}
