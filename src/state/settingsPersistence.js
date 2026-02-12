export function createSettingsPersistenceQueue({
  saveFn,
  getUserId,
  debounceMs = 1000,
  onError = () => {}
} = {}) {
  if (typeof saveFn !== 'function') {
    throw new Error('createSettingsPersistenceQueue requires saveFn')
  }
  if (typeof getUserId !== 'function') {
    throw new Error('createSettingsPersistenceQueue requires getUserId')
  }

  let timerId = null
  let queuedSnapshot = null
  let inFlight = false
  let drainPromise = Promise.resolve()
  let lastPersistedUpdatedAt = 0

  const clearTimer = () => {
    if (timerId !== null) {
      clearTimeout(timerId)
      timerId = null
    }
  }

  const persistIfNeeded = async (snapshot) => {
    const updatedAt = Number(snapshot?.lastUpdated || 0)
    if (updatedAt && updatedAt <= lastPersistedUpdatedAt) {
      return
    }

    const userId = getUserId()
    if (!userId) {
      return
    }

    await saveFn(userId, snapshot)
    if (updatedAt) {
      lastPersistedUpdatedAt = updatedAt
    }
  }

  const drain = async () => {
    if (inFlight) {
      return drainPromise
    }

    inFlight = true
    drainPromise = (async () => {
      while (queuedSnapshot) {
        const snapshot = queuedSnapshot
        queuedSnapshot = null
        try {
          await persistIfNeeded(snapshot)
        } catch (error) {
          onError(error)
        }
      }
    })().finally(() => {
      inFlight = false
    })

    return drainPromise
  }

  return {
    schedule(snapshot) {
      queuedSnapshot = snapshot
      clearTimer()
      timerId = setTimeout(() => {
        timerId = null
        void drain()
      }, debounceMs)
    },

    async flush(snapshot) {
      if (snapshot !== undefined) {
        queuedSnapshot = snapshot
      }
      clearTimer()
      await drain()
    },

    resetForTests() {
      clearTimer()
      queuedSnapshot = null
      inFlight = false
      drainPromise = Promise.resolve()
      lastPersistedUpdatedAt = 0
    }
  }
}
