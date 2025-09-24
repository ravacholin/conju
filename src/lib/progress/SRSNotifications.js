const FIVE_MINUTES = 5 * 60 * 1000
let lastNotificationTs = 0

function canUseNotifications() {
  if (typeof window === 'undefined') return false
  if (typeof Notification === 'undefined') return false
  return true
}

function documentInactive() {
  if (typeof document === 'undefined') return true
  if (document.visibilityState && document.visibilityState !== 'visible') return true
  if (typeof document.hasFocus === 'function') {
    try {
      return !document.hasFocus()
    } catch {
      return true
    }
  }
  return true
}

function buildBodyText(stats, urgentThreshold, overdueThreshold) {
  const parts = []
  if (stats.overdue >= overdueThreshold) {
    parts.push(`${stats.overdue} vencidos`)
  }
  if (stats.urgent >= urgentThreshold) {
    parts.push(`${stats.urgent} urgentes listos`)
  }
  if (parts.length === 0) {
    parts.push(`Tenés ${stats.dueNow} por repasar`)
  }
  return parts.join(' · ')
}

export async function maybeNotifySRSReview(stats, options = {}) {
  if (!canUseNotifications()) return
  if (!stats) return

  const {
    enabled = true,
    urgentThreshold = 6,
    overdueThreshold = 2,
    cooldownMinutes = 45
  } = options

  if (!enabled) return
  if (!documentInactive()) return

  const urgent = stats.urgent ?? stats.dueNow ?? 0
  const overdue = stats.overdue ?? 0

  if (urgent < urgentThreshold && overdue < overdueThreshold) return

  const now = Date.now()
  const cooldownMs = Math.max(cooldownMinutes, 5) * 60 * 1000
  if (now - lastNotificationTs < cooldownMs) return

  let permission = Notification.permission
  if (permission === 'default') {
    try {
      permission = await Notification.requestPermission()
    } catch {
      return
    }
  }

  if (permission !== 'granted') return

  try {
    const notification = new Notification('Repaso pendiente', {
      body: buildBodyText(stats, urgentThreshold, overdueThreshold),
      tag: 'srs-review-reminder',
      renotify: false,
      data: { type: 'srs-review-reminder' }
    })
    notification.onclick = () => {
      window.focus?.()
    }
    lastNotificationTs = now
  } catch (error) {
    console.warn('No se pudo mostrar notificación SRS:', error)
  }
}

export function markSRSNotificationShown(ts = Date.now()) {
  lastNotificationTs = ts
}

export function resetSRSNotificationThrottle() {
  lastNotificationTs = Date.now() - FIVE_MINUTES
}
