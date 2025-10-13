/**
 * @fileoverview Gestor centralizado de tokens de autenticación y configuración de sincronización
 *
 * Este módulo maneja la configuración y gestión de tokens de autenticación para el sistema
 * de sincronización de progreso. Proporciona una capa de abstracción sobre diferentes
 * fuentes de autenticación y configuración de endpoints.
 *
 * @module progress/AuthTokenManager
 * @requires ../auth/authService
 * @requires ../config/syncConfig
 * @requires ../utils/logger
 *
 * @responsibilities
 * - Gestión de tokens de autenticación con estrategia de fallback multi-nivel
 * - Configuración dinámica de endpoints de sincronización (dev/prod)
 * - Configuración de headers HTTP personalizados para autenticación
 * - Detección inteligente de entorno (localhost/production)
 * - Persistencia opcional de configuración en localStorage
 *
 * @example
 * // Configurar endpoint de sincronización
 * import AuthTokenManager from './AuthTokenManager.js'
 *
 * // El módulo se auto-inicializa, pero puedes re-configurar:
 * AuthTokenManager.setSyncEndpoint('https://api.example.com')
 *
 * // Obtener token con fallback automático
 * const token = AuthTokenManager.getSyncAuthToken() // Google auth → manual → localStorage → env
 *
 * // Verificar estado de autenticación
 * if (AuthTokenManager.isAuthenticatedWithGoogle()) {
 *   const user = AuthTokenManager.getAuthenticatedUser()
 *   console.log('Usuario:', user.user.email)
 * }
 */

import authService from '../auth/authService.js'
import { getSyncApiBase, getSyncAuthHeaderName as getSyncAuthHeaderNameFromConfig } from '../config/syncConfig.js'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('progress:AuthTokenManager')
const isDev = import.meta?.env?.DEV

/**
 * Claves de localStorage para persistencia de configuración
 * @const {Object}
 * @private
 */
const STORAGE_KEYS = {
  /** @type {string} Clave para endpoint de sincronización */
  ENDPOINT: 'progress-sync-endpoint',
  /** @type {string} Clave para token de autenticación */
  AUTH_TOKEN: 'progress-sync-auth-token',
  /** @type {string} Clave para nombre de header de autenticación */
  AUTH_HEADER_NAME: 'progress-sync-auth-header-name'
}

// Backwards compatibility
const SYNC_ENDPOINT_KEY = STORAGE_KEYS.ENDPOINT
const SYNC_AUTH_TOKEN_KEY = STORAGE_KEYS.AUTH_TOKEN
const SYNC_AUTH_HEADER_NAME_KEY = STORAGE_KEYS.AUTH_HEADER_NAME

/**
 * Estado interno del módulo
 * @private
 */
/** @type {string|null} URL base del endpoint de sincronización */
let SYNC_BASE_URL = null
/** @type {string|null} Token de autenticación configurado manualmente */
let SYNC_AUTH_TOKEN = null
/** @type {string} Nombre del header HTTP para autenticación */
let SYNC_AUTH_HEADER_NAME = null

// ============================================
// Inicialización y Configuración
// ============================================

/**
 * Inicializa el módulo con configuración inteligente basada en el entorno
 *
 * Este método se ejecuta automáticamente al importar el módulo y configura:
 * - URL de sincronización (localhost en dev, producción en prod)
 * - Nombre del header de autenticación
 *
 * @function initializeAuthTokenManager
 * @returns {void}
 *
 * @sideeffects
 * - Modifica las variables de estado del módulo
 * - Puede leer de localStorage si hay configuración persistida
 * - Registra información de debug en desarrollo
 *
 * @example
 * // Se ejecuta automáticamente, pero puede llamarse manualmente
 * initializeAuthTokenManager()
 * // Logs en dev: "Módulo inicializado { hasSyncUrl: true, headerName: 'Authorization' }"
 */
export function initializeAuthTokenManager() {
  // Resolver sync base URL usando detección inteligente de entorno
  SYNC_BASE_URL = resolveSyncBaseUrl()

  // Resolver header name
  SYNC_AUTH_HEADER_NAME = getSyncAuthHeaderNameFromConfig()

  if (isDev) {
    logger.debug('initializeAuthTokenManager', 'Módulo inicializado', {
      hasSyncUrl: !!SYNC_BASE_URL,
      headerName: SYNC_AUTH_HEADER_NAME
    })
  }
}

/**
 * Resuelve la URL base de sincronización con detección inteligente de entorno
 *
 * Estrategia de resolución (en orden de prioridad):
 * 1. **Override manual en localStorage** - Para testing/debugging
 * 2. **Detección automática de entorno** - `getSyncApiBase()` detecta dev/prod
 *
 * @function resolveSyncBaseUrl
 * @private
 * @returns {string|null} URL base de sincronización o null si no está configurado
 *
 * @example
 * // En desarrollo: http://localhost:8787/api
 * // En producción: https://conju.onrender.com/api
 * // Con override: cualquier URL personalizada
 *
 * @see {@link getSyncApiBase} para la lógica de detección de entorno
 */
function resolveSyncBaseUrl() {
  try {
    // Prioridad 1: Override en localStorage
    if (typeof window !== 'undefined') {
      const override = window.localStorage.getItem(SYNC_ENDPOINT_KEY)
      if (override) {
        if (isDev) {
          logger.info('resolveSyncBaseUrl', 'Usando override de localStorage', {
            overrideLength: override.length
          })
        }
        return override
      }
    }
  } catch {}

  // Prioridad 2: Detección inteligente de entorno
  return getSyncApiBase()
}

/**
 * Detecta si una URL es un endpoint local de desarrollo
 *
 * Útil para determinar si estamos en modo de desarrollo local y aplicar
 * configuraciones específicas (ej: deshabilitar HTTPS, timeouts más largos)
 *
 * @function isLocalPlaceholderUrl
 * @private
 * @param {string} url - URL a verificar
 * @returns {boolean} true si la URL apunta a localhost/127.0.0.1/0.0.0.0
 *
 * @example
 * isLocalPlaceholderUrl('http://localhost:8787/api') // true
 * isLocalPlaceholderUrl('http://127.0.0.1:3000') // true
 * isLocalPlaceholderUrl('https://conju.onrender.com') // false
 */
function isLocalPlaceholderUrl(url) {
  if (!url) return false
  return url.includes('localhost:') || url.includes('127.0.0.1:') || url.includes('0.0.0.0:')
}

// ============================================
// Gestión de Endpoint de Sincronización
// ============================================

/**
 * Configura el endpoint de sincronización manualmente
 *
 * Permite sobrescribir la detección automática de entorno con una URL personalizada.
 * Útil para testing, desarrollo local, o apuntar a servidores alternativos.
 *
 * @function setSyncEndpoint
 * @public
 * @param {string|null} url - URL del endpoint de sincronización (null para deshabilitar)
 * @returns {void}
 *
 * @sideeffects
 * - Actualiza la variable de estado `SYNC_BASE_URL`
 * - Persiste la URL en localStorage
 * - Registra debug logs en desarrollo
 *
 * @example
 * // Configurar endpoint personalizado
 * setSyncEndpoint('https://api-staging.example.com')
 *
 * // Deshabilitar sincronización
 * setSyncEndpoint(null)
 *
 * // Usar servidor local
 * setSyncEndpoint('http://localhost:3000/api')
 */
export function setSyncEndpoint(url) {
  SYNC_BASE_URL = url || null
  try {
    if (typeof window !== 'undefined') {
      if (url) {
        window.localStorage.setItem(SYNC_ENDPOINT_KEY, url)
      } else {
        window.localStorage.removeItem(SYNC_ENDPOINT_KEY)
      }
    }
  } catch (error) {
    logger.warn('setSyncEndpoint', 'No se pudo guardar en localStorage', error)
  }

  if (isDev) {
    logger.debug('setSyncEndpoint', 'Endpoint actualizado', { url })
  }
}

/**
 * Obtiene el endpoint de sincronización configurado
 * @returns {string|null}
 */
export function getSyncEndpoint() {
  return SYNC_BASE_URL
}

/**
 * Verifica si la sincronización está habilitada
 * @returns {boolean}
 */
export function isSyncEnabled() {
  return !!SYNC_BASE_URL
}

/**
 * Verifica si estamos en modo sync local (desarrollo)
 * @returns {boolean}
 */
export function isLocalSyncMode() {
  return !!SYNC_BASE_URL && isLocalPlaceholderUrl(SYNC_BASE_URL)
}

// ============================================
// Gestión de Tokens de Autenticación
// ============================================

/**
 * Configura el token de autenticación
 * @param {string|null} token - Token de autenticación
 * @param {Object} options - Opciones de configuración
 * @param {boolean} [options.persist=false] - Si debe persistirse en localStorage
 */
export function setSyncAuthToken(token, { persist = false } = {}) {
  SYNC_AUTH_TOKEN = token || null
  try {
    if (typeof window !== 'undefined') {
      if (persist && token) {
        window.localStorage.setItem(SYNC_AUTH_TOKEN_KEY, token)
      } else if (!persist) {
        window.localStorage.removeItem(SYNC_AUTH_TOKEN_KEY)
      }
    }
  } catch (error) {
    logger.warn('setSyncAuthToken', 'No se pudo guardar token en localStorage', error)
  }

  if (isDev) {
    logger.debug('setSyncAuthToken', 'Token actualizado', {
      hasToken: !!token,
      persist
    })
  }
}

/**
 * Obtiene el token de autenticación con estrategia de fallback multi-nivel
 *
 * Implementa una cascada inteligente de fuentes de autenticación para maximizar
 * la disponibilidad del servicio de sincronización en diferentes contextos.
 *
 * **Estrategia de Fallback (en orden de prioridad):**
 * 1. **authService.getToken()** - Usuario autenticado con Google OAuth
 * 2. **SYNC_AUTH_TOKEN** - Token configurado manualmente vía `setSyncAuthToken()`
 * 3. **localStorage** - Token persistido en sesión anterior
 * 4. **VITE_PROGRESS_SYNC_TOKEN** - Variable de entorno (para testing/CI)
 *
 * @function getSyncAuthToken
 * @public
 * @returns {string|null} Token de autenticación o null si no hay ninguno disponible
 *
 * @example
 * // Usuario logueado con Google
 * const token = getSyncAuthToken()
 * // → JWT token desde authService
 *
 * // Usuario sin login, pero con token manual
 * setSyncAuthToken('custom-api-key-123')
 * const token = getSyncAuthToken()
 * // → 'custom-api-key-123'
 *
 * // Sin ninguna autenticación
 * const token = getSyncAuthToken()
 * // → null
 *
 * @see {@link setSyncAuthToken} para configurar token manualmente
 * @see {@link isAuthenticatedWithGoogle} para verificar autenticación Google
 */
export function getSyncAuthToken() {
  // Prioridad 1: Token del authService (usuario autenticado con Google)
  const authToken = authService.getToken()
  if (authToken) {
    return authToken
  }

  // Prioridad 2: Token configurado manualmente
  if (SYNC_AUTH_TOKEN) {
    return SYNC_AUTH_TOKEN
  }

  // Prioridad 3: Token almacenado en localStorage
  try {
    if (typeof window !== 'undefined') {
      const storedToken = window.localStorage.getItem(SYNC_AUTH_TOKEN_KEY)
      if (storedToken) {
        return storedToken
      }
    }
  } catch {}

  // Prioridad 4: Token de variable de entorno
  const envToken = (typeof import.meta !== 'undefined' && import.meta?.env?.VITE_PROGRESS_SYNC_TOKEN) ||
                   (typeof process !== 'undefined' && process?.env?.VITE_PROGRESS_SYNC_TOKEN) ||
                   null

  return envToken || null
}

/**
 * Limpia el token de autenticación
 */
export function clearSyncAuthToken() {
  SYNC_AUTH_TOKEN = null
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(SYNC_AUTH_TOKEN_KEY)
    }
  } catch (error) {
    logger.warn('clearSyncAuthToken', 'No se pudo eliminar token de localStorage', error)
  }

  if (isDev) {
    logger.debug('clearSyncAuthToken', 'Token eliminado')
  }
}

// ============================================
// Gestión de Headers de Autenticación
// ============================================

/**
 * Configura el nombre del header de autenticación
 * @param {string} name - Nombre del header (por defecto 'Authorization')
 */
export function setSyncAuthHeaderName(name) {
  SYNC_AUTH_HEADER_NAME = name || 'Authorization'
  try {
    if (typeof window !== 'undefined') {
      if (name) {
        window.localStorage.setItem(SYNC_AUTH_HEADER_NAME_KEY, name)
      } else {
        window.localStorage.removeItem(SYNC_AUTH_HEADER_NAME_KEY)
      }
    }
  } catch (error) {
    logger.warn('setSyncAuthHeaderName', 'No se pudo guardar header name', error)
  }

  if (isDev) {
    logger.debug('setSyncAuthHeaderName', 'Header name actualizado', { name })
  }
}

/**
 * Obtiene el nombre del header de autenticación configurado
 * @returns {string}
 */
export function getSyncAuthHeaderName() {
  if (SYNC_AUTH_HEADER_NAME) {
    return SYNC_AUTH_HEADER_NAME
  }

  // Fallback a valor por defecto
  return 'Authorization'
}

// ============================================
// Helpers de Autenticación
// ============================================

/**
 * Verifica si hay un token válido disponible
 * @returns {boolean}
 */
export function hasValidToken() {
  const token = getSyncAuthToken()
  return !!token && token.length > 0
}

/**
 * Verifica si el usuario está autenticado con Google
 * @returns {boolean}
 */
export function isAuthenticatedWithGoogle() {
  return authService.isLoggedIn() && !!authService.getToken()
}

/**
 * @typedef {Object} AuthenticatedUserInfo
 * @property {Object} user - Información del usuario desde authService
 * @property {string} user.id - ID único del usuario
 * @property {string} user.email - Email del usuario
 * @property {string} user.name - Nombre completo del usuario
 * @property {Object} account - Información de la cuenta Google
 * @property {string} account.email - Email de la cuenta
 * @property {string} account.id - ID de la cuenta Google
 * @property {string} token - JWT token de autenticación
 */

/**
 * Obtiene información completa del usuario autenticado con Google
 *
 * Proporciona acceso a toda la información de autenticación del usuario,
 * incluyendo datos del perfil, cuenta y token JWT.
 *
 * @function getAuthenticatedUser
 * @public
 * @returns {AuthenticatedUserInfo|null} Objeto con información del usuario o null si no está autenticado
 *
 * @example
 * const userInfo = getAuthenticatedUser()
 * if (userInfo) {
 *   console.log('Usuario:', userInfo.user.name)
 *   console.log('Email:', userInfo.user.email)
 *   console.log('Token:', userInfo.token.substring(0, 20) + '...')
 * } else {
 *   console.log('Usuario no autenticado con Google')
 * }
 *
 * @see {@link isAuthenticatedWithGoogle} para verificación rápida de autenticación
 */
export function getAuthenticatedUser() {
  if (!isAuthenticatedWithGoogle()) {
    return null
  }

  return {
    user: authService.getUser(),
    account: authService.getAccount(),
    token: authService.getToken()
  }
}

// ============================================
// Export default
// ============================================

// Inicializar al cargar el módulo
initializeAuthTokenManager()

export default {
  // Endpoint management
  setSyncEndpoint,
  getSyncEndpoint,
  isSyncEnabled,
  isLocalSyncMode,

  // Token management
  setSyncAuthToken,
  getSyncAuthToken,
  clearSyncAuthToken,
  hasValidToken,

  // Header management
  setSyncAuthHeaderName,
  getSyncAuthHeaderName,

  // Auth helpers
  isAuthenticatedWithGoogle,
  getAuthenticatedUser,

  // Initialization
  initializeAuthTokenManager
}
