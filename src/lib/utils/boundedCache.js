const MINUTES_TO_MS = 60 * 1000

export function createBoundedCache({ maxSize = 20, maxAgeMinutes, now = () => Date.now() } = {}) {
  if (!Number.isInteger(maxSize) || maxSize <= 0) {
    throw new Error('maxSize must be a positive integer')
  }

  const store = new Map()

  function purgeOldestIfNeeded() {
    while (store.size > maxSize) {
      const oldestKey = store.keys().next().value
      if (typeof oldestKey === 'undefined') {
        break
      }
      store.delete(oldestKey)
    }
  }

  function set(key, value) {
    if (store.has(key)) {
      store.delete(key)
    }

    store.set(key, {
      value,
      timestamp: now()
    })

    purgeOldestIfNeeded()
  }

  function isExpired(entry) {
    if (typeof maxAgeMinutes !== 'number') {
      return false
    }

    const age = now() - entry.timestamp
    return age > maxAgeMinutes * MINUTES_TO_MS
  }

  function get(key) {
    const entry = store.get(key)

    if (!entry) {
      return undefined
    }

    if (isExpired(entry)) {
      store.delete(key)
      return undefined
    }

    return entry.value
  }

  function clear() {
    store.clear()
  }

  function deleteKey(key) {
    return store.delete(key)
  }

  function has(key) {
    return store.has(key)
  }

  function size() {
    return store.size
  }

  return {
    get,
    set,
    clear,
    delete: deleteKey,
    has,
    size
  }
}
