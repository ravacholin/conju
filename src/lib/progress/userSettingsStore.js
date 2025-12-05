import { getCurrentUserId as getIdFromProgress } from './index.js'
import { PROGRESS_CONFIG } from './config.js'
import { createSafeLogger } from './safeLogger.js'

const safeLogger = createSafeLogger('progress:userManager')

const LS_KEY = 'progress-user-settings'
const USER_ID_STORAGE_KEY = 'progress-system-user-id'

function defaultSettings() {
  return {
    totalSessions: 0,
    createdAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    weeklyGoals: {
      CELLS_TO_IMPROVE: 3,
      MIN_SCORE: 75,
      SESSIONS: 5
    },
    expertMode: {
      enabled: PROGRESS_CONFIG?.EXPERT_MODE?.DEFAULT_ENABLED ?? false,
      overrides: {
        srs: { ...(PROGRESS_CONFIG?.EXPERT_MODE?.SRS || {}) },
        fsrs: { ...(PROGRESS_CONFIG?.EXPERT_MODE?.FSRS || {}) },
        customIntervals: PROGRESS_CONFIG?.EXPERT_MODE?.CUSTOM_INTERVALS || null
      },
      lastUpdatedAt: null
    },
    personalizationProfile: {
      style: 'balanced',
      intensity: 'standard',
      goalFocus: 'mixed'
    },
    socialPreferences: {
      communityChallenges: true,
      shareProgress: false
    },
    offlinePreferences: {
      prefetchReviews: true
    }
  }
}

export function getCurrentUserId() {
  // PRIORITY 1: Progress system userId (source of truth for local DB)
  try {
    const id = getIdFromProgress()
    if (id && typeof id === 'string') {
      // console.log('🔑 getCurrentUserId: Using progress system userId:', id)
      return id
    }
  } catch {
    // Continue with fallbacks
  }

  // PRIORITY 2: Authenticated user (if progress not initialized yet)
  try {
    if (typeof window !== 'undefined' && window.authService?.isLoggedIn?.()) {
      const authUserId = window.authService?.getUser?.()?.id
      if (authUserId && typeof authUserId === 'string') {
        // console.log('🔑 getCurrentUserId: Using AUTHENTICATED userId:', authUserId)
        return authUserId
      }
    }
  } catch {
    // Continue with fallbacks
  }

  // PRIORITY 3: LocalStorage persistent ID (anonymous user)
  try {
    if (typeof window !== 'undefined' && window?.localStorage) {
      let userId = window.localStorage.getItem(USER_ID_STORAGE_KEY)
      if (!userId || typeof userId !== 'string') {
        userId = `user-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
        window.localStorage.setItem(USER_ID_STORAGE_KEY, userId)
        // console.warn('⚠️ getCurrentUserId: Generated NEW userId (no existing ID found):', userId)
      } else {
        // console.log('🔑 getCurrentUserId: Using userId from localStorage:', userId)
      }
      return userId
    }
  } catch {
    // Continue to fallback
  }

  const tempId = `user-temp-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
  // console.warn('⚠️ getCurrentUserId: Using TEMP userId (fallback):', tempId)
  return tempId
}

export function getUserSettings(userId) {
  try {
    if (typeof window === 'undefined') {
      return defaultSettings()
    }
    const raw = window.localStorage.getItem(LS_KEY)
    const store = raw ? JSON.parse(raw) : {}
    const key = userId || getCurrentUserId() || 'default'
    const userCfg = store[key] || {}
    return { ...defaultSettings(), ...userCfg }
  } catch (error) {
    safeLogger.warn('Fallo leyendo user settings; usando valores por defecto', {
      message: error?.message || String(error),
      name: error?.name
    })
    return defaultSettings()
  }
}

export function updateUserSettings(userId, updater) {
  try {
    if (typeof window === 'undefined') {
      return defaultSettings()
    }

    const key = userId || getCurrentUserId() || 'default'
    const raw = window.localStorage.getItem(LS_KEY)
    const store = raw ? JSON.parse(raw) : {}
    const current = { ...defaultSettings(), ...(store[key] || {}) }
    const nextState = typeof updater === 'function'
      ? { ...current, ...updater(current) }
      : { ...current, ...updater }

    const persisted = {
      ...defaultSettings(),
      ...nextState,
      lastActiveAt: nextState.lastActiveAt || new Date().toISOString()
    }

    store[key] = persisted
    window.localStorage.setItem(LS_KEY, JSON.stringify(store))

    try {
      window.dispatchEvent(new CustomEvent('progress:user-settings-updated', {
        detail: { userId: key, settings: persisted }
      }))
    } catch (eventError) {
      safeLogger.warn('No se pudo emitir evento de actualización de settings', {
        message: eventError?.message || String(eventError),
        name: eventError?.name
      })
    }

    return persisted
  } catch (error) {
    safeLogger.warn('Fallo actualizando user settings; conservando valores actuales', {
      message: error?.message || String(error),
      name: error?.name
    })
    return defaultSettings()
  }
}

export function incrementSessionCount(userId) {
  try {
    if (typeof window === 'undefined') return
    const raw = window.localStorage.getItem(LS_KEY)
    const store = raw ? JSON.parse(raw) : {}
    const key = userId || getCurrentUserId() || 'default'
    const base = store[key] || defaultSettings()
    store[key] = {
      ...base,
      totalSessions: (base.totalSessions || 0) + 1,
      lastActiveAt: new Date().toISOString()
    }
    window.localStorage.setItem(LS_KEY, JSON.stringify(store))
  } catch {
    // Silent failure
  }
}

export const __testing = {
  defaultSettings,
  LS_KEY,
  USER_ID_STORAGE_KEY
}
