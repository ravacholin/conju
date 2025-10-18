// Expert Mode configuration management for SRS/FSRS advanced users

import { PROGRESS_CONFIG } from './config.js'
import { getCurrentUserId, getUserSettings, updateUserSettings } from './userManager/index.js'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('progress:expertMode')

const expertModeCache = new Map()
const listeners = new Set()

const DEFAULT_SETTINGS = normalizeExpertMode()

function normalizeExpertMode(raw = {}) {
  const baseOverrides = raw?.overrides || raw
  const srsOverrides = sanitizeOverrides(baseOverrides?.srs || raw?.srs)
  const fsrsOverrides = sanitizeOverrides(baseOverrides?.fsrs || raw?.fsrs)
  const customIntervals = sanitizeIntervals(baseOverrides?.customIntervals || raw?.customIntervals)

  return {
    enabled: Boolean(raw?.enabled ?? PROGRESS_CONFIG.EXPERT_MODE.DEFAULT_ENABLED),
    lastUpdatedAt: raw?.lastUpdatedAt || null,
    overrides: {
      srs: { ...PROGRESS_CONFIG.EXPERT_MODE.SRS, ...srsOverrides },
      fsrs: { ...PROGRESS_CONFIG.EXPERT_MODE.FSRS, ...fsrsOverrides },
      customIntervals: customIntervals?.length ? customIntervals : PROGRESS_CONFIG.EXPERT_MODE.CUSTOM_INTERVALS || null
    }
  }
}

function sanitizeOverrides(overrides) {
  if (!overrides || typeof overrides !== 'object') {
    return {}
  }
  const result = {}
  for (const [key, value] of Object.entries(overrides)) {
    if (value === null || value === undefined) continue
    if (Array.isArray(value)) {
      result[key] = [...value]
    } else if (typeof value === 'object') {
      result[key] = { ...value }
    } else if (Number.isFinite(value) || typeof value === 'string' || typeof value === 'boolean') {
      result[key] = value
    }
  }
  return result
}

function sanitizeIntervals(intervals) {
  if (!Array.isArray(intervals)) return null
  const normalized = intervals
    .map(value => Number(value))
    .filter(value => Number.isFinite(value) && value > 0)
    .sort((a, b) => a - b)

  return normalized.length ? Array.from(new Set(normalized)) : null
}

function cloneExpertMode(settings) {
  return {
    enabled: settings.enabled,
    lastUpdatedAt: settings.lastUpdatedAt,
    overrides: {
      srs: { ...settings.overrides.srs },
      fsrs: { ...settings.overrides.fsrs },
      customIntervals: settings.overrides.customIntervals ? [...settings.overrides.customIntervals] : null
    }
  }
}

function cacheSettings(userId, settings) {
  const normalized = normalizeExpertMode(settings)
  expertModeCache.set(userId, normalized)
  return normalized
}

function notifyChange(userId, settings) {
  const payload = { userId, settings: cloneExpertMode(settings) }
  listeners.forEach(listener => {
    try {
      listener(payload)
    } catch (error) {
      logger.warn('Error notifying expert mode listener', error)
    }
  })
}

export function getExpertModeSettings(userId = null) {
  const resolvedUserId = userId || getCurrentUserId()
  if (!resolvedUserId) {
    return cloneExpertMode(DEFAULT_SETTINGS)
  }

  if (expertModeCache.has(resolvedUserId)) {
    return cloneExpertMode(expertModeCache.get(resolvedUserId))
  }

  const userSettings = getUserSettings(resolvedUserId) || {}
  const normalized = cacheSettings(resolvedUserId, userSettings.expertMode || DEFAULT_SETTINGS)
  return cloneExpertMode(normalized)
}

export function setExpertModeSettings(userId, updates) {
  const resolvedUserId = userId || getCurrentUserId()
  if (!resolvedUserId) {
    logger.warn('No se pudo aplicar modo experto: userId no disponible')
    return cloneExpertMode(DEFAULT_SETTINGS)
  }

  const settings = updateUserSettings(resolvedUserId, (current) => {
    const currentSettings = normalizeExpertMode(current.expertMode || DEFAULT_SETTINGS)
    const incomingOverrides = updates?.overrides || {}

    const mergedSRS = {
      ...currentSettings.overrides.srs,
      ...sanitizeOverrides(incomingOverrides.srs)
    }
    const mergedFSRS = {
      ...currentSettings.overrides.fsrs,
      ...sanitizeOverrides(incomingOverrides.fsrs)
    }
    const mergedIntervals = sanitizeIntervals(incomingOverrides.customIntervals) || currentSettings.overrides.customIntervals

    const next = {
      enabled: updates?.enabled ?? currentSettings.enabled,
      lastUpdatedAt: new Date().toISOString(),
      overrides: {
        srs: mergedSRS,
        fsrs: mergedFSRS,
        customIntervals: mergedIntervals
      }
    }

    cacheSettings(resolvedUserId, next)
    notifyChange(resolvedUserId, next)

    return { expertMode: next }
  })

  const normalized = normalizeExpertMode(settings.expertMode || DEFAULT_SETTINGS)
  return cloneExpertMode(normalized)
}

export function toggleExpertMode(userId, enabled) {
  return setExpertModeSettings(userId, { enabled })
}

export function resetExpertMode(userId = null) {
  const resolvedUserId = userId || getCurrentUserId()
  if (!resolvedUserId) {
    return cloneExpertMode(DEFAULT_SETTINGS)
  }
  expertModeCache.delete(resolvedUserId)
  return setExpertModeSettings(resolvedUserId, { enabled: PROGRESS_CONFIG.EXPERT_MODE.DEFAULT_ENABLED, overrides: DEFAULT_SETTINGS.overrides })
}

export function getActiveSRSConfig(userId = null) {
  const base = PROGRESS_CONFIG.SRS_ADVANCED
  const settings = getExpertModeSettings(userId)
  if (!settings.enabled) {
    return { ...base, SPEED: { ...base.SPEED } }
  }
  return mergeConfigs(base, settings.overrides.srs)
}

export function getActiveSRSIntervals(userId = null) {
  const settings = getExpertModeSettings(userId)
  if (settings.enabled && settings.overrides.customIntervals && settings.overrides.customIntervals.length) {
    return [...settings.overrides.customIntervals]
  }
  return [...PROGRESS_CONFIG.SRS_INTERVALS]
}

export function getActiveFSRSConfig(userId = null) {
  const base = PROGRESS_CONFIG.FSRS
  const settings = getExpertModeSettings(userId)
  if (!settings.enabled) {
    return { ...base }
  }
  return mergeConfigs(base, settings.overrides.fsrs)
}

export function onExpertModeChange(listener, { immediate = false } = {}) {
  if (typeof listener !== 'function') {
    throw new Error('Expert mode listener must be a function')
  }
  listeners.add(listener)
  if (immediate) {
    try {
      const currentSettings = getExpertModeSettings()
      listener({ userId: getCurrentUserId(), settings: currentSettings })
    } catch (error) {
      logger.warn('Error delivering immediate expert mode notification', error)
    }
  }
  return () => listeners.delete(listener)
}

function mergeConfigs(base, overrides) {
  const merged = { ...base }
  for (const [key, value] of Object.entries(overrides || {})) {
    if (value === undefined || value === null) continue

    if (Array.isArray(value)) {
      merged[key] = [...value]
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      merged[key] = { ...(base[key] || {}), ...value }
    } else {
      merged[key] = value
    }
  }

  if (base.SPEED && !merged.SPEED) {
    merged.SPEED = { ...base.SPEED }
  }

  return merged
}

if (typeof window !== 'undefined') {
  window.addEventListener('progress:user-settings-updated', (event) => {
    const { userId, settings } = event.detail || {}
    if (!userId || !settings?.expertMode) return
    const normalized = cacheSettings(userId, settings.expertMode)
    notifyChange(userId, normalized)
  })
}
