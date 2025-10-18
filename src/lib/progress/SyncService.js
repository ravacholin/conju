/**
 * @fileoverview Servicio de sincronización remota para el sistema de progreso
 *
 * Este módulo maneja todas las operaciones de sincronización con el servidor remoto,
 * incluyendo comunicación HTTP/REST, gestión de cola offline, y recuperación ante fallos.
 *
 * @module progress/SyncService
 * @requires ../auth/authService
 * @requires ./config
 * @requires ../utils/logger
 * @requires ./userManager
 * @requires ./AuthTokenManager
 *
 * @responsibilities
 * - **Operaciones HTTP/REST**: POST/GET requests con autenticación y timeouts
 * - **Cola offline**: Encolar operaciones cuando no hay conexión
 * - **Wake-up del servidor**: Despertar Render free tier (~15 min sleep)
 * - **Reintentos inteligentes**: Manejo de errores temporales vs permanentes
 * - **Generación de mensajes**: Feedback user-friendly sobre sync status
 *
 * @architecture
 * - **Stateless**: No mantiene estado entre requests (usa localStorage para cola)
 * - **Fault-tolerant**: Reintenta operaciones fallidas automáticamente
 * - **Mobile-friendly**: Timeouts ajustados para conexiones lentas (25s wake-up)
 *
 * @example
 * // Sincronizar datos con el servidor
 * import SyncService from './SyncService.js'
 *
 * // Verificar conectividad
 * if (SyncService.isBrowserOnline()) {
 *   // Despertar servidor si es necesario
 *   await SyncService.wakeUpServer()
 *
 *   // Subir datos
 *   const result = await SyncService.tryBulk('attempts', attemptData)
 *
 *   // Procesar cola offline
 *   await SyncService.flushSyncQueue()
 * } else {
 *   // Encolar para más tarde
 *   SyncService.enqueue('attempts', attemptData)
 * }
 */

import authService from '../auth/authService.js'
import { STORAGE_CONFIG } from './config.js'
import { createLogger } from '../utils/logger.js'
import { getCurrentUserId } from './userManager/index.js'
import AuthTokenManager from './AuthTokenManager.js'

const logger = createLogger('progress:SyncService')
const isDev = import.meta?.env?.DEV

/**
 * Clave de localStorage para la cola de sincronización offline
 * @const {string}
 * @private
 */
const SYNC_QUEUE_KEY = 'progress-sync-queue-v1'

// ============================================
// Helpers de Conectividad
// ============================================

/**
 * Verifica si el navegador tiene conectividad de red
 *
 * Utiliza la API `navigator.onLine` del navegador para detectar conectividad.
 * En entornos sin navegador (SSR, Node.js), asume conectividad por defecto.
 *
 * @function isBrowserOnline
 * @public
 * @returns {boolean} true si hay conexión, false si está offline
 *
 * @note
 * - `navigator.onLine` no garantiza acceso a Internet, solo a la red local
 * - Puede dar falsos positivos si hay red local pero no Internet
 * - En SSR/Node.js siempre retorna true (asume conectividad)
 *
 * @example
 * if (isBrowserOnline()) {
 *   await syncNow()
 * } else {
 *   enqueue('attempts', data) // Encolar para más tarde
 * }
 */
export function isBrowserOnline() {
  try {
    return typeof navigator === 'undefined' ? true : !!navigator.onLine
  } catch {
    return true
  }
}

// ============================================
// Gestión de Cola de Sincronización Offline
// ============================================

/**
 * Obtiene la cola de sincronización offline
 * @returns {Array}
 */
function getQueue() {
  try {
    if (typeof window === 'undefined') return []
    const raw = window.localStorage.getItem(SYNC_QUEUE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

/**
 * Guarda la cola de sincronización offline
 * @param {Array} q - Cola de sincronización
 */
function setQueue(q) {
  try {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(q))
  } catch (error) {
    logger.warn('setQueue', 'No se pudo guardar cola', error)
  }
}

/**
 * Encola una operación de sincronización para procesarla cuando vuelva la conectividad
 *
 * Útil para mantener la disponibilidad de la aplicación en modo offline.
 * Las operaciones encoladas se procesarán automáticamente cuando:
 * - El navegador detecte conexión (evento 'online')
 * - El usuario vuelva a la app (evento 'visibilitychange')
 * - Se llame manualmente a `flushSyncQueue()`
 *
 * @function enqueue
 * @public
 * @param {('attempts'|'mastery'|'schedules'|'sessions')} type - Tipo de dato a sincronizar
 * @param {Object} payload - Datos a enviar al servidor
 * @returns {void}
 *
 * @sideeffects
 * - Guarda la operación en localStorage bajo `SYNC_QUEUE_KEY`
 * - Registra debug logs en desarrollo
 *
 * @example
 * // Usuario está offline
 * if (!isBrowserOnline()) {
 *   // Encolar para procesar más tarde
 *   enqueue('attempts', {
 *     verbId: 'estar',
 *     mood: 'indicative',
 *     tense: 'present',
 *     person: '1s',
 *     correct: true,
 *     timestamp: Date.now()
 *   })
 * }
 *
 * @see {@link flushSyncQueue} para procesar la cola manualmente
 */
export function enqueue(type, payload) {
  const q = getQueue()
  q.push({ type, payload, enqueuedAt: Date.now() })
  setQueue(q)

  if (isDev) {
    logger.debug('enqueue', `Operación encolada: ${type}`, { queueSize: q.length })
  }
}

/**
 * Vacía la cola de sincronización enviando todas las operaciones pendientes
 * @returns {Promise<{flushed: number}>}
 */
export async function flushSyncQueue() {
  if (!AuthTokenManager.isSyncEnabled() || !isBrowserOnline()) {
    return { flushed: 0 }
  }

  const q = getQueue()
  if (q.length === 0) {
    return { flushed: 0 }
  }

  const pending = [...q]
  setQueue([])
  let ok = 0

  for (const entry of pending) {
    try {
      await postJSON(`/progress/${entry.type}`, entry.payload)
      ok++
    } catch (error) {
      logger.warn('flushSyncQueue', `Error procesando ${entry.type}`, error)
      // Re-encolar si vuelve a fallar
      enqueue(entry.type, entry.payload)
    }
  }

  if (isDev) {
    logger.info('flushSyncQueue', `Cola vaciada: ${ok}/${pending.length} exitosos`)
  }

  return { flushed: ok }
}

// ============================================
// Operaciones HTTP/REST
// ============================================

/**
 * Wake up the server (Render free tier sleeps after 15 min)
 * @returns {Promise<boolean>}
 */
export async function wakeUpServer() {
  const SYNC_BASE_URL = AuthTokenManager.getSyncEndpoint()
  if (!SYNC_BASE_URL) return false

  try {
    if (isDev) {
      logger.info('wakeUpServer', 'Intentando despertar servidor')
    }

    let requestUrl = SYNC_BASE_URL

    try {
      const syncUrl = new URL(SYNC_BASE_URL)

      // Remove query/hash noise so we ping the actual host
      syncUrl.search = ''
      syncUrl.hash = ''

      const trimmedPath = syncUrl.pathname.replace(/\/$/, '')
      if (trimmedPath.endsWith('/api')) {
        const segments = trimmedPath.split('/')
        segments.pop()
        const newPath = segments.join('/') || '/'
        syncUrl.pathname = newPath || '/'
      }

      requestUrl = syncUrl.toString()
      if (requestUrl.endsWith('/')) {
        requestUrl = requestUrl.slice(0, -1)
      }
    } catch (urlError) {
      logger.warn('wakeUpServer', 'URL de sincronización inválida, usando fallback', {
        message: urlError?.message
      })
      requestUrl = SYNC_BASE_URL.replace(/\/api\/?$/, '')
    }

    // Mobile-compatible timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 25000)

    const response = await fetch(requestUrl, {
      method: 'GET',
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (response.status === 404) {
      logger.warn('wakeUpServer: el servidor de sincronización respondió 404', {
        url: requestUrl,
        status: response.status,
        statusText: response.statusText
      })
      return false
    }

    if (response.ok) {
      if (isDev) {
        logger.info('wakeUpServer', 'Servidor responde OK')
      }
      return true
    }

    logger.warn('wakeUpServer', 'No se pudo despertar el servidor', {
      status: response.status,
      statusText: response.statusText
    })
    return false
  } catch (error) {
    logger.warn('wakeUpServer', 'Error al intentar despertar servidor', {
      message: error?.message,
      name: error?.name
    })
    // Even if wake-up fails, continue with sync attempt
    return false
  }
}

/**
 * Realiza una petición POST JSON al servidor de sincronización
 * @param {string} path - Path del endpoint (ej: '/progress/attempts/bulk')
 * @param {Object} body - Cuerpo de la petición
 * @param {number} [timeoutMs=30000] - Timeout en milisegundos
 * @returns {Promise<Object>}
 */
export async function postJSON(path, body, timeoutMs = 30000) {
  const SYNC_BASE_URL = AuthTokenManager.getSyncEndpoint()

  if (!SYNC_BASE_URL || typeof fetch === 'undefined') {
    throw new Error('Sync endpoint not configured')
  }

  const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null
  const t = ctrl ? setTimeout(() => {
    logger.warn('postJSON', 'Timeout alcanzado', { path, timeoutMs })
    ctrl.abort()
  }, timeoutMs) : null

  try {
    const headers = { 'Content-Type': 'application/json' }
    const token = AuthTokenManager.getSyncAuthToken()
    const headerName = AuthTokenManager.getSyncAuthHeaderName()
    const authToken = typeof authService?.getToken === 'function' ? authService.getToken() : null
    const isJwt = typeof authToken === 'string' && authToken.split('.').length === 3
    const resolvedUserId =
      (typeof authService?.getUser === 'function' && authService.getUser()?.id) ||
      getCurrentUserId()

    if (isDev) {
      logger.debug('postJSON', `Configurando headers para ${path}`, {
        hasToken: !!token,
        tokenLength: token ? token.length : 0,
        headerName,
        hasJwt: isJwt
      })
    }

    if (isJwt) {
      headers.Authorization = `Bearer ${authToken}`

      if (headerName && headerName.toLowerCase() !== 'authorization') {
        if (headerName.toLowerCase() === 'x-user-id' && resolvedUserId) {
          headers[headerName] = resolvedUserId
        } else if (token) {
          headers[headerName] = token
        }
      }

      if (!headers['X-User-Id'] && resolvedUserId) {
        headers['X-User-Id'] = resolvedUserId
      }
    } else if (token && headerName) {
      const normalizedHeader = headerName.toLowerCase()
      headers[headerName] = normalizedHeader === 'authorization' ? `Bearer ${token}` : token

      if (!headers['X-User-Id'] && normalizedHeader !== 'x-user-id' && resolvedUserId) {
        headers['X-User-Id'] = resolvedUserId
      }
    } else if (resolvedUserId) {
      headers['X-User-Id'] = resolvedUserId
      if (isDev) {
        logger.debug('postJSON', 'Usando X-User-Id por falta de token')
      }
    }

    if (isDev) {
      logger.info('postJSON', 'Enviando solicitud', { path, timeoutMs })
    }

    const startTime = Date.now()

    const res = await fetch(`${SYNC_BASE_URL}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: ctrl?.signal
    })

    const elapsed = Date.now() - startTime

    if (isDev) {
      logger.info('postJSON', 'Solicitud completada', { path, elapsed, status: res.status })
    }

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      logger.warn('postJSON', 'Respuesta con error del servidor', {
        status: res.status,
        statusText: res.statusText,
        path,
        url: `${SYNC_BASE_URL}${path}`
      })
      throw new Error(`HTTP ${res.status}: ${text}`)
    }

    const jsonResponse = await res.json().catch(() => ({}))

    if (isDev) {
      logger.debug('postJSON', 'Respuesta exitosa', { keys: Object.keys(jsonResponse) })
    }

    return jsonResponse
  } catch (error) {
    logger.error('postJSON', 'Error durante la solicitud', {
      path,
      errorName: error?.name,
      errorMessage: error?.message
    })
    throw error
  } finally {
    if (t) clearTimeout(t)
  }
}

/**
 * Sube múltiples registros en batch (bulk operation)
 * @param {string} type - Tipo de dato (attempts, mastery, schedules, sessions)
 * @param {Array} records - Registros a subir
 * @returns {Promise<Object>}
 */
export async function tryBulk(type, records) {
  if (!records || records.length === 0) {
    return { success: true, count: 0 }
  }

  const path = `/progress/${type}/bulk`

  // Strip local-only fields before upload
  const sanitize = (obj) => {
    if (!obj || typeof obj !== 'object') return obj
    const { syncPriority: _SYNC_PRIORITY, migratedAt: _MIGRATED_AT, ...rest } = obj
    return rest
  }

  const body = { records: records.map(sanitize) }
  const res = await postJSON(path, body)

  return { success: true, ...res }
}

// ============================================
// Helpers de Mensajes de Éxito
// ============================================

/**
 * Genera mensaje de éxito según la estrategia de sincronización
 * @param {string} strategy - Estrategia usada (account, legacy, account+legacy)
 * @param {Object} results - Resultados de la sincronización
 * @param {Object} accountSyncResult - Resultado de account sync
 * @returns {string}
 */
export function getSyncSuccessMessage(strategy, results, accountSyncResult) {
  const legacyUploaded = (results.attempts?.uploaded || 0) +
                        (results.mastery?.uploaded || 0) +
                        (results.schedules?.uploaded || 0) +
                        (results.sessions?.uploaded || 0)

  const accountDownloaded = accountSyncResult?.downloaded ?
    (accountSyncResult.downloaded.attempts || 0) +
    (accountSyncResult.downloaded.mastery || 0) +
    (accountSyncResult.downloaded.schedules || 0) +
    (accountSyncResult.downloaded.sessions || 0) : 0

  const accountMerged = accountSyncResult?.merged ?
    (accountSyncResult.merged.attempts || 0) +
    (accountSyncResult.merged.mastery || 0) +
    (accountSyncResult.merged.schedules || 0) +
    (accountSyncResult.merged.sessions || 0) : 0

  switch (strategy) {
    case 'account+legacy': {
      const uploadsSummary = `${results.attempts?.uploaded || 0} intentos, ${results.mastery?.uploaded || 0} mastery, ${results.schedules?.uploaded || 0} srs, ${results.sessions?.uploaded || 0} sesiones`
      return `✅ Sincronización completa (descargados: ${accountSyncResult?.downloaded?.attempts || 0} intentos, ${accountSyncResult?.downloaded?.mastery || 0} mastery, ${accountSyncResult?.downloaded?.schedules || 0} srs, ${accountSyncResult?.downloaded?.sessions || 0} sesiones | subidos: ${uploadsSummary}). Datos alineados entre todos tus dispositivos.`
    }
    case 'account':
      if (accountDownloaded > 0) {
        return `✅ Sincronización completa (descargados: ${accountSyncResult.downloaded.attempts} intentos, ${accountSyncResult.downloaded.mastery} mastery, ${accountSyncResult.downloaded.schedules} srs, ${accountSyncResult.downloaded.sessions || 0} sesiones | aplicados: ${accountMerged} nuevos registros). Datos sincronizados desde tu cuenta Google.`
      } else {
        return `ℹ️ Sincronización completa (descargados: 0 intentos, 0 mastery, 0 srs, 0 sesiones). No hay datos nuevos en tu cuenta Google. Asegúrate de haber practicado en otros dispositivos.`
      }

    case 'legacy-fallback':
      if (legacyUploaded > 0) {
        return `⚠️ Account sync falló, pero legacy sync exitoso (subidos: ${results.attempts?.uploaded || 0} intentos, ${results.mastery?.uploaded || 0} mastery, ${results.schedules?.uploaded || 0} srs, ${results.sessions?.uploaded || 0} sesiones). Datos locales enviados al servidor.`
      } else {
        return `⚠️ Account sync falló y no hay datos locales para subir. Intenta practicar algo primero o verifica tu conexión.`
      }

    case 'legacy':
    default:
      if (legacyUploaded > 0) {
        return `✅ Sincronización legacy completa (subidos: ${results.attempts?.uploaded || 0} intentos, ${results.mastery?.uploaded || 0} mastery, ${results.schedules?.uploaded || 0} srs, ${results.sessions?.uploaded || 0} sesiones). Para sincronización entre dispositivos, haz login con Google.`
      } else {
        return `ℹ️ Sincronización legacy completa (subidos: 0). No hay datos locales nuevos para enviar. Para sincronización entre dispositivos, haz login con Google.`
      }
  }
}

// ============================================
// Export default
// ============================================

export default {
  // Conectividad
  isBrowserOnline,

  // Cola offline
  enqueue,
  flushSyncQueue,

  // HTTP/REST
  wakeUpServer,
  postJSON,
  tryBulk,

  // Helpers
  getSyncSuccessMessage
}
