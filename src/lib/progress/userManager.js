// Gestor mínimo de usuario y ajustes persistentes en el cliente

import { getCurrentUserId as getId } from './index.js'

const LS_KEY = 'progress-user-settings'

export function getCurrentUserId() {
  try {
    return getId()
  } catch {
    return null
  }
}

export function getUserSettings(_userId) { // eslint-disable-line no-unused-vars
  try {
    if (typeof window === 'undefined') {
      return defaultSettings()
    }
    const raw = window.localStorage.getItem(LS_KEY)
    if (!raw) return defaultSettings()
    const parsed = JSON.parse(raw)
    // Si hay múltiples usuarios en el futuro, se podría indexar por userId
    return {
      ...defaultSettings(),
      ...parsed
    }
  } catch (error) {
    console.warn('Fallo leyendo user settings; usando valores por defecto', error)
    return defaultSettings()
  }
}

function defaultSettings() {
  return {
    totalSessions: 0,
    createdAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    weeklyGoals: {
      CELLS_TO_IMPROVE: 3,
      MIN_SCORE: 75,
      SESSIONS: 5
    }
  }
}

export function incrementSessionCount(_userId) { // eslint-disable-line no-unused-vars
  try {
    if (typeof window === 'undefined') return
    const raw = window.localStorage.getItem(LS_KEY)
    const base = raw ? JSON.parse(raw) : defaultSettings()
    const next = {
      ...base,
      totalSessions: (base.totalSessions || 0) + 1,
      lastActiveAt: new Date().toISOString()
    }
    window.localStorage.setItem(LS_KEY, JSON.stringify(next))
  } catch {
    // Silencioso en producción; no bloquear UX
  }
}

export default {
  getCurrentUserId,
  getUserSettings,
  incrementSessionCount
}
