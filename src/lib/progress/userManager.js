// Gestor de usuario y ajustes persistentes en el cliente

import { getCurrentUserId as getIdFromProgress } from './index.js'
import { 
  getAttemptsByUser,
  getMasteryByUser,
  updateInDB,
  getAllFromDB
} from './database.js'
import { STORAGE_CONFIG } from './config.js'

const LS_KEY = 'progress-user-settings'
const USER_ID_STORAGE_KEY = 'progress-system-user-id'
const SYNC_QUEUE_KEY = 'progress-sync-queue-v1'
const SYNC_ENDPOINT_KEY = 'progress-sync-endpoint'
const SYNC_AUTH_TOKEN_KEY = 'progress-sync-auth-token'
const SYNC_AUTH_HEADER_NAME_KEY = 'progress-sync-auth-header-name'

// Resolve sync base URL from env or localStorage override
function resolveSyncBaseUrl() {
  try {
    if (typeof window !== 'undefined') {
      const override = window.localStorage.getItem(SYNC_ENDPOINT_KEY)
      if (override) return override
    }
  } catch {}
  // Vite-style env or generic
  const envUrl = (typeof import.meta !== 'undefined' && import.meta?.env?.VITE_PROGRESS_SYNC_URL) ||
                 (typeof process !== 'undefined' && process?.env?.VITE_PROGRESS_SYNC_URL) ||
                 null
  // Fallback por defecto a servidor local
  return envUrl || 'http://localhost:8787/api'
}

let SYNC_BASE_URL = resolveSyncBaseUrl()
let SYNC_AUTH_TOKEN = null
let SYNC_AUTH_HEADER_NAME = (typeof import.meta !== 'undefined' && import.meta?.env?.VITE_PROGRESS_SYNC_AUTH_HEADER_NAME) || 'Authorization'

export function setSyncEndpoint(url) {
  SYNC_BASE_URL = url || null
  try {
    if (typeof window !== 'undefined') {
      if (url) window.localStorage.setItem(SYNC_ENDPOINT_KEY, url)
      else window.localStorage.removeItem(SYNC_ENDPOINT_KEY)
    }
  } catch {}
}

export function getSyncEndpoint() {
  return SYNC_BASE_URL
}

export function isSyncEnabled() {
  return !!SYNC_BASE_URL
}

export function setSyncAuthToken(token, { persist = false } = {}) {
  SYNC_AUTH_TOKEN = token || null
  try {
    if (typeof window !== 'undefined') {
      if (persist && token) window.localStorage.setItem(SYNC_AUTH_TOKEN_KEY, token)
      else if (!persist) window.localStorage.removeItem(SYNC_AUTH_TOKEN_KEY)
    }
  } catch {}
}

export function getSyncAuthToken() {
  if (SYNC_AUTH_TOKEN) return SYNC_AUTH_TOKEN
  try {
    if (typeof window !== 'undefined') {
      const t = window.localStorage.getItem(SYNC_AUTH_TOKEN_KEY)
      if (t) return t
    }
  } catch {}
  const envToken = (typeof import.meta !== 'undefined' && import.meta?.env?.VITE_PROGRESS_SYNC_TOKEN) ||
                   (typeof process !== 'undefined' && process?.env?.VITE_PROGRESS_SYNC_TOKEN) ||
                   null
  return envToken || null
}

export function clearSyncAuthToken() {
  SYNC_AUTH_TOKEN = null
  try {
    if (typeof window !== 'undefined') window.localStorage.removeItem(SYNC_AUTH_TOKEN_KEY)
  } catch {}
}

export function setSyncAuthHeaderName(name) {
  SYNC_AUTH_HEADER_NAME = name || 'Authorization'
  try {
    if (typeof window !== 'undefined') {
      if (name) window.localStorage.setItem(SYNC_AUTH_HEADER_NAME_KEY, name)
      else window.localStorage.removeItem(SYNC_AUTH_HEADER_NAME_KEY)
    }
  } catch {}
}

export function getSyncAuthHeaderName() {
  try {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem(SYNC_AUTH_HEADER_NAME_KEY)
      if (saved) return saved
    }
  } catch {}
  return SYNC_AUTH_HEADER_NAME
}

/**
 * Obtiene un ID de usuario robusto para usar en tracking/analytics.
 * Prioriza el ID del sistema de progreso; si no existe aún, intenta
 * recuperar o crear uno persistente en localStorage. Como último
 * recurso (SSR o storage inaccesible), genera un ID temporal.
 *
 * @returns {string} userId (persistente si es posible)
 */
export function getCurrentUserId() {
  // 1) Intentar usar el ID del sistema de progreso (si ya está inicializado)
  try {
    const id = getIdFromProgress()
    if (id && typeof id === 'string') return id
  } catch (_e) {
    // Continuar con fallbacks sin interrumpir flujo
  }

  // 2) Recuperar o crear un ID persistente en localStorage
  try {
    if (typeof window !== 'undefined' && window?.localStorage) {
      let userId = window.localStorage.getItem(USER_ID_STORAGE_KEY)
      if (!userId || typeof userId !== 'string') {
        userId = `user-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
        window.localStorage.setItem(USER_ID_STORAGE_KEY, userId)
      }
      return userId
    }
  } catch (_e) {
    // Si localStorage falla (modo privado, permisos, etc.), continuar al fallback temporal
  }

  // 3) Fallback temporal (no persistente) para entornos sin window/localStorage
  return `user-temp-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
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
    // Silencioso en producción; no bloquear UX
  }
}

// --------------------------
// Remote Sync Service (REST)
// --------------------------

function isBrowserOnline() {
  try {
    return typeof navigator === 'undefined' ? true : !!navigator.onLine
  } catch {
    return true
  }
}

function getQueue() {
  try {
    if (typeof window === 'undefined') return []
    const raw = window.localStorage.getItem(SYNC_QUEUE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function setQueue(q) {
  try {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(q))
  } catch {}
}

function enqueue(type, payload) {
  const q = getQueue()
  q.push({ type, payload, enqueuedAt: Date.now() })
  setQueue(q)
}

async function postJSON(path, body, timeoutMs = 30000) {
  if (!SYNC_BASE_URL || typeof fetch === 'undefined') {
    throw new Error('Sync endpoint not configured')
  }
  const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null
  const t = ctrl ? setTimeout(() => ctrl.abort(), timeoutMs) : null
  try {
    const headers = { 'Content-Type': 'application/json' }
    const token = getSyncAuthToken()
    const headerName = getSyncAuthHeaderName()
    if (token && headerName) {
      headers[headerName] = headerName.toLowerCase() === 'authorization' ? `Bearer ${token}` : token
    } else {
      // Sin token configurado: enviar userId local como X-User-Id
      const uid = getCurrentUserId()
      if (uid) headers['X-User-Id'] = uid
    }

    const res = await fetch(`${SYNC_BASE_URL}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: ctrl?.signal
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`HTTP ${res.status}: ${text}`)
    }
    return await res.json().catch(() => ({}))
  } finally {
    if (t) clearTimeout(t)
  }
}

async function tryBulk(type, records) {
  if (!records || records.length === 0) return { success: true, count: 0 }
  const path = `/progress/${type}/bulk`
  const body = { records }
  const res = await postJSON(path, body)
  return { success: true, ...res }
}

async function markSynced(storeName, ids) {
  try {
    for (const id of ids) {
      await updateInDB(storeName, id, { syncedAt: new Date() })
    }
  } catch (e) {
    console.warn('No se pudo marcar como sincronizado:', e)
  }
}

/**
 * Wake up the server (Render free tier sleeps after 15 min)
 */
async function wakeUpServer() {
  if (!SYNC_BASE_URL) return false
  try {
    console.log('☁️ Despertando servidor...')
    const baseUrl = SYNC_BASE_URL.replace('/api', '')
    await fetch(baseUrl, {
      method: 'GET',
      signal: AbortSignal.timeout(25000) // 25 second timeout for wake-up
    })
    return true
  } catch (error) {
    console.warn('⚠️ No se pudo despertar el servidor:', error.message)
    return false
  }
}

/**
 * Sincroniza intentos, mastery y schedules del usuario actual.
 * Envia solo registros sin syncedAt.
 */
export async function syncNow({ include = ['attempts','mastery','schedules'] } = {}) {
  const userId = getCurrentUserId()
  if (!userId) return { success: false, reason: 'no_user' }
  if (!isSyncEnabled() || !isBrowserOnline()) return { success: false, reason: 'offline_or_disabled' }

  // Wake up server first (Render free tier issue)
  await wakeUpServer()

  const results = {}
  try {
    if (include.includes('attempts')) {
      const all = await getAttemptsByUser(userId)
      const unsynced = all.filter(a => !a.syncedAt)
      if (unsynced.length) {
        const res = await tryBulk('attempts', unsynced)
        await markSynced(STORAGE_CONFIG.STORES.ATTEMPTS, unsynced.map(a => a.id))
        results.attempts = { uploaded: unsynced.length, server: res }
      } else {
        results.attempts = { uploaded: 0 }
      }
    }

    if (include.includes('mastery')) {
      const all = await getMasteryByUser(userId)
      const unsynced = all.filter(m => !m.syncedAt)
      if (unsynced.length) {
        const res = await tryBulk('mastery', unsynced)
        await markSynced(STORAGE_CONFIG.STORES.MASTERY, unsynced.map(m => m.id))
        results.mastery = { uploaded: unsynced.length, server: res }
      } else {
        results.mastery = { uploaded: 0 }
      }
    }

    if (include.includes('schedules')) {
      // Without a direct getter by user for all schedules, fetch all and filter
      const allSchedules = await getAllFromDB(STORAGE_CONFIG.STORES.SCHEDULES)
      const userSchedules = allSchedules.filter(s => s.userId === userId)
      const unsynced = userSchedules.filter(s => !s.syncedAt)
      if (unsynced.length) {
        const res = await tryBulk('schedules', unsynced)
        await markSynced(STORAGE_CONFIG.STORES.SCHEDULES, unsynced.map(s => s.id))
        results.schedules = { uploaded: unsynced.length, server: res }
      } else {
        results.schedules = { uploaded: 0 }
      }
    }

    // Procesar cola offline (si hubiera)
    await flushSyncQueue()

    return { success: true, ...results }
  } catch (error) {
    console.warn('Fallo de sincronización, encolando para más tarde:', error?.message)
    // Encolar lotes para reintentar
    Object.entries(results).forEach(([type, info]) => {
      if (info?.uploaded > 0) return
    })
    return { success: false, error: String(error) }
  }
}

export async function flushSyncQueue() {
  if (!isSyncEnabled() || !isBrowserOnline()) return { flushed: 0 }
  const q = getQueue()
  if (q.length === 0) return { flushed: 0 }
  const pending = [...q]
  setQueue([])
  let ok = 0
  for (const entry of pending) {
    try {
      await postJSON(`/progress/${entry.type}`, entry.payload)
      ok++
    } catch (e) {
      // Re-encolar si vuelve a fallar
      enqueue(entry.type, entry.payload)
    }
  }
  return { flushed: ok }
}

// Intento de auto-flush cuando vuelve la conectividad
if (typeof window !== 'undefined') {
  try {
    window.addEventListener('online', () => {
      flushSyncQueue().catch(() => {})
      // Intentar sync completo en background
      syncNow().catch(() => {})
    })
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        // Al volver a la app, intentar sincronizar en background
        setTimeout(() => { syncNow().catch(() => {}) }, 500)
      }
    })
  } catch {}
}

export default {
  getCurrentUserId,
  getUserSettings,
  incrementSessionCount,
  setSyncEndpoint,
  getSyncEndpoint,
  isSyncEnabled,
  syncNow,
  flushSyncQueue,
  setSyncAuthToken,
  getSyncAuthToken,
  clearSyncAuthToken,
  setSyncAuthHeaderName,
  getSyncAuthHeaderName
}
