export function createActionCooldown({ delayMs = 250 } = {}) {
  let locked = false
  let releaseTimer = null

  const clearReleaseTimer = () => {
    if (releaseTimer) {
      clearTimeout(releaseTimer)
      releaseTimer = null
    }
  }

  return {
    run(action) {
      if (locked || typeof action !== 'function') {
        return false
      }

      locked = true
      clearReleaseTimer()

      action()

      releaseTimer = setTimeout(() => {
        locked = false
        releaseTimer = null
      }, delayMs)

      return true
    },
    cancel() {
      locked = false
      clearReleaseTimer()
    },
    isLocked() {
      return locked
    }
  }
}
