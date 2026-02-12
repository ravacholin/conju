const STORAGE_KEY = 'conju-daily-plan-checklist-v1'

function getTodayKey() {
  const now = new Date()
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`
}

export function readChecklistState() {
  if (typeof window === 'undefined') {
    return {}
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return {}
    if (parsed.day !== getTodayKey()) return {}
    return parsed.items || {}
  } catch {
    return {}
  }
}

export function writeChecklistState(items) {
  if (typeof window === 'undefined') {
    return
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
      day: getTodayKey(),
      items
    }))
  } catch {
    // ignore storage errors
  }
}
