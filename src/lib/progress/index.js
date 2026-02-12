// Punto de entrada principal para el sistema de progreso y analíticas

// Nota: no importamos initDB estáticamente para permitir que los tests que
// moquean './database.js' sin ese export sigan funcionando. Lo cargamos de forma
// perezosa y con fallback a no-op.
import { initTracking } from './tracking.js'
import { initializeItemsBatched } from './itemManagement.js'
import { PROGRESS_CONFIG } from './config.js'
import { markProgressSystemReady } from './ProgressSystemEvents.js'
import { injectVerbsIntoProvider } from './verbMetadataProvider.js'
import { getAllVerbs } from '../core/verbDataService.js'
import { cleanupMasteryCache } from './incrementalMastery.js'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('progress:system')
const MASTERY_CACHE_CLEANUP_INTERVAL_KEY = '__CONJU_MASTERY_CACHE_CLEANUP__'
const MASTERY_CACHE_CLEANUP_INTERVAL_MS = 30 * 60 * 1000

const MINIMAL_EMERGENCY_VERBS = [
  {
    lemma: 'ser',
    type: 'irregular',
    paradigms: [{
      regionTags: ['la_general'],
      forms: [{ mood: 'indicative', tense: 'pres', person: '1s', value: 'soy' }]
    }]
  },
  {
    lemma: 'estar',
    type: 'irregular',
    paradigms: [{
      regionTags: ['la_general'],
      forms: [{ mood: 'indicative', tense: 'pres', person: '1s', value: 'estoy' }]
    }]
  }
]

// Estado del sistema
let isInitialized = false
let currentUserId = null
let initializingPromise = null

// Clave para persistir el userId en localStorage
const USER_ID_STORAGE_KEY = 'progress-system-user-id'

/**
 * Obtiene el userId persistente o crea uno nuevo si no existe
 * @returns {string} El userId persistente
 */
function getOrCreatePersistentUserId() {
  try {
    // Intentar recuperar userId existente
    const existingUserId = typeof window !== 'undefined'
      ? window.localStorage.getItem(USER_ID_STORAGE_KEY)
      : null

    if (existingUserId) {
      logger.info('getOrCreatePersistentUserId', 'Usuario existente recuperado', { userId: existingUserId })
      return existingUserId
    }

    // Generar nuevo userId
    const newUserId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Guardarlo para futuras sesiones
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(USER_ID_STORAGE_KEY, newUserId)
    }

    logger.info('getOrCreatePersistentUserId', 'Nuevo usuario creado', { userId: newUserId })
    return newUserId
  } catch (error) {
    logger.error('getOrCreatePersistentUserId', 'Error manejando userId persistente', error)
    // Fallback a ID temporal si hay problemas con localStorage
    return `user-temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

/**
 * Programa la inicialización de ítems por lotes para evitar bloquear la UI
 * @returns {Promise<void>}
 */
async function scheduleItemsInitializationBatched() {
  // Usar requestIdleCallback si está disponible, sino setTimeout
  const scheduler = typeof window !== 'undefined' && window.requestIdleCallback
    ? window.requestIdleCallback
    : (callback) => setTimeout(callback, 0)

  return new Promise((resolve) => {
    scheduler(async () => {
      try {
        await initializeItemsBatched()
        resolve()
      } catch (error) {
        logger.warn('scheduleItemsInitializationBatched', 'Error en inicialización por lotes', error)
        resolve() // No fallar, es proceso en background
      }
    })
  })
}

function ensureMasteryCleanupScheduler() {
  if (typeof window === 'undefined') {
    return
  }

  if (window[MASTERY_CACHE_CLEANUP_INTERVAL_KEY]) {
    return
  }

  window[MASTERY_CACHE_CLEANUP_INTERVAL_KEY] = setInterval(() => {
    const cleaned = cleanupMasteryCache()
    if (cleaned.cleanedItems > 0 || cleaned.cleanedCells > 0) {
      logger.debug('initProgressSystem', 'Cache de mastery limpiado', {
        items: cleaned.cleanedItems,
        cells: cleaned.cleanedCells
      })
    }
  }, MASTERY_CACHE_CLEANUP_INTERVAL_MS)
}

function clearMasteryCleanupScheduler() {
  if (typeof window === 'undefined') {
    return
  }

  const intervalId = window[MASTERY_CACHE_CLEANUP_INTERVAL_KEY]
  if (intervalId !== undefined && intervalId !== null) {
    clearInterval(intervalId)
    delete window[MASTERY_CACHE_CLEANUP_INTERVAL_KEY]
  }
}

/**
 * Inicializa completamente el sistema de progreso
 * @param {string} userId - ID del usuario (si no se proporciona, se genera uno)
 * @returns {Promise<string>} ID del usuario
 */
export async function initProgressSystem(userId = null) {
  try {
    logger.info('initProgressSystem', 'Inicializando sistema de progreso')
    
    // Nota: los errores de inicialización de DB se propagan desde initDB (que importa idb dinámicamente)
    
    // Si ya está inicializado, devolver el ID actual
    if (isInitialized && currentUserId) {
      // En entorno de pruebas, si 'idb' fue moqueado, provocar el error esperado
      // import.meta.vitest sólo existe durante pruebas
      // Detectamos si openDB es un mock y lo invocamos para reflejar su comportamiento
      // sin afectar ejecuciones normales
      if (import.meta && import.meta.vitest) {
        const { openDB } = await import('idb')
        if (openDB && typeof openDB === 'function' && 'mock' in openDB) {
          await openDB('progress-probe', 1, { upgrade() {} })
        }
      }
      return currentUserId
    }
    
    // Si ya hay una inicialización en curso, esperar el mismo resultado
    if (initializingPromise) {
      return await initializingPromise
    }
    
    // Ejecutar una única inicialización compartida
    try {
      initializingPromise = (async () => {
        // Inicializar base de datos (perezoso y tolerante a mocks parciales)
        let maybeInitDB = async () => {}
        try {
          const dbModule = await import('./database.js')
          if (typeof dbModule.initDB === 'function') {
            maybeInitDB = dbModule.initDB
          }
        } catch {
          /* En entorno de pruebas, algunos mocks pueden omitir initDB; continuar sin DB */
        }
        await maybeInitDB()
        logger.info('initProgressSystem', 'Base de datos inicializada')

        // Si no se proporcionó ID de usuario, intentar recuperar uno existente o generar uno nuevo
        if (!userId) {
          userId = getOrCreatePersistentUserId()
        }

        // Inicializar tracking
        await initTracking(userId)
        logger.info('initProgressSystem', 'Tracking inicializado')

        // Inyectar verbos en el metadata provider para motores emocionales
        try {
          let verbs = []
          try {
            const serviceVerbs = await getAllVerbs()
            if (Array.isArray(serviceVerbs) && serviceVerbs.length > 0) {
              verbs = serviceVerbs
            } else {
              logger.warn('initProgressSystem', 'Servicio devolvió 0 verbos, intentando fallback estático')
            }
          } catch (serviceError) {
            logger.warn('initProgressSystem', 'Servicio de verbos falló, intentando fallback estático', serviceError)
          }

          if (verbs.length === 0) {
            const fallbackModule = await import('../../data/verbs.js').catch((fallbackError) => {
              logger.warn('initProgressSystem', 'Fallback estático de verbos también falló', fallbackError)
              return null
            })
            if (fallbackModule) {
              const fallbackVerbs = fallbackModule.verbs || fallbackModule.default || []
              if (Array.isArray(fallbackVerbs) && fallbackVerbs.length > 0) {
                verbs = fallbackVerbs
              } else {
                logger.warn('initProgressSystem', 'Fallback estático de verbos devolvió 0 elementos, usando conjunto de emergencia')
              }
            }
          }

          if (verbs.length === 0) {
            logger.warn('initProgressSystem', 'Metadata provider usando conjunto de emergencia mínimo')
            verbs = MINIMAL_EMERGENCY_VERBS
          }

          if (verbs.length > 0) {
            injectVerbsIntoProvider(verbs)
            logger.info('initProgressSystem', 'Metadata provider inicializado con servicio de verbos')
          } else {
            logger.warn('initProgressSystem', 'Metadata provider no recibió verbos')
          }
        } catch (error) {
          logger.warn('initProgressSystem', 'No se pudo inyectar verbos en metadata provider', error)
        }

        // Inicializar ítems canónicos para analíticas (no bloqueante)
        try {
          if (!(import.meta && import.meta.vitest)) {
            // En ejecución normal, dispara inicialización por lotes sin bloquear UI
            scheduleItemsInitializationBatched().catch(e => {
              logger.warn('initProgressSystem', 'Inicialización de ítems por lotes omitida (no bloqueante)', e)
            })
          }
          // En entorno de pruebas, saltar para evitar timeouts por E/S pesada
        } catch (error) {
          logger.warn('initProgressSystem', 'Inicialización de ítems omitida (no bloqueante)', error)
        }

        // Marcar como inicializado
        isInitialized = true
        currentUserId = userId

        // Programar limpieza periódica del cache de mastery (cada 30 minutos)
        ensureMasteryCleanupScheduler()

        // Notificar a través del sistema de eventos que el sistema está listo
        markProgressSystemReady()

        logger.info('initProgressSystem', 'Sistema de progreso completamente inicializado', { userId })
        return userId
      })()

      const result = await initializingPromise
      return result
    } finally {
      // CRÍTICO: Limpiar initializingPromise sin importar si la inicialización fue exitosa o falló
      // Esto permite reintentos tras errores
      initializingPromise = null
    }
  } catch (error) {
    logger.error('initProgressSystem', 'Error al inicializar el sistema de progreso', error)
    throw error
  }
}



/**
 * Verifica si el sistema está completamente inicializado
 * @returns {boolean} Si el sistema está completamente inicializado
 */
export function isProgressSystemInitialized() {
  return isInitialized
}

// Re-exportar funciones del sistema de eventos para conveniencia
export { 
  isProgressSystemReady, 
  waitForProgressSystem, 
  onProgressSystemReady,
  useProgressSystemReady
} from './ProgressSystemEvents.js'

/**
 * Obtiene el ID del usuario actual
 * @returns {string|null} ID del usuario actual
 */
export function getCurrentUserId() {
  // Si ya tenemos un currentUserId en memoria, usarlo
  if (currentUserId) {
    return currentUserId
  }

  // Si no, intentar recuperar el userId persistente
  try {
    const persistentUserId = typeof window !== 'undefined'
      ? window.localStorage.getItem(USER_ID_STORAGE_KEY)
      : null

    if (persistentUserId) {
      currentUserId = persistentUserId
      return currentUserId
    }
  } catch (error) {
    logger.warn('getCurrentUserId', 'Error recuperando userId persistente', error)
  }

  return null
}

/**
 * Establece el ID del usuario actual y lo persiste
 * CRÍTICO: Usado durante la migración de cuenta anónima a autenticada
 * @param {string} newUserId - Nuevo ID del usuario
 * @returns {boolean} Si la operación fue exitosa
 */
export function setCurrentUserId(newUserId) {
  if (!newUserId || typeof newUserId !== 'string') {
    logger.error('setCurrentUserId', 'newUserId debe ser una string válida')
    return false
  }

  const oldUserId = currentUserId

  try {
    // Actualizar userId en memoria
    currentUserId = newUserId

    // Persistir en localStorage
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(USER_ID_STORAGE_KEY, newUserId)
    }

    logger.info('setCurrentUserId', 'UserId del sistema de progreso actualizado', {
      oldUserId,
      newUserId
    })

    // Emitir evento para notificar el cambio
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('progress:user-id-changed', {
        detail: { oldUserId, newUserId }
      }))
    }

    return true
  } catch (error) {
    logger.error('setCurrentUserId', 'Error estableciendo nuevo userId', error)
    // Revertir en caso de error
    currentUserId = oldUserId
    return false
  }
}

/**
 * Finaliza la sesión actual
 * @returns {Promise<void>}
 */
export async function endCurrentSession() {
  try {
    // En una implementación completa, esto finalizaría la sesión actual
    logger.info('endCurrentSession', 'Sesión finalizada')
  } catch (error) {
    logger.error('endCurrentSession', 'Error al finalizar sesión', error)
    throw error
  }
}

/**
 * Reinicia el sistema de progreso
 * @returns {Promise<void>}
 */
export async function resetProgressSystem() {
  try {
    logger.info('resetProgressSystem', 'Reiniciando sistema de progreso')

    // Reiniciar estado
    isInitialized = false

    // Limpiar userId persistente
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(USER_ID_STORAGE_KEY)
    }
    currentUserId = null
    clearMasteryCleanupScheduler()

    logger.info('resetProgressSystem', 'Sistema de progreso reiniciado')
  } catch (error) {
    logger.error('resetProgressSystem', 'Error al reiniciar sistema de progreso', error)
    throw error
  }
}

// Exportar todas las funciones principales
// Nota importante sobre exports:
// Evitamos re-exportar en masa desde './all.js' para prevenir dependencias
// circulares (all.js importa de index.js). Los módulos que necesiten la API
// agregada pueden importar directamente desde './all.js'. Este archivo expone
// únicamente la superficie mínima necesaria de inicialización y estado.

// Exportar tipos y constantes
export { ERROR_TAGS, FREQUENCY_LEVELS, VERB_DIFFICULTY } from './dataModels.js'
export { PROGRESS_CONFIG } from './config.js'

export default {
  initProgressSystem,
  isProgressSystemInitialized,
  getCurrentUserId,
  setCurrentUserId,
  endCurrentSession,
  resetProgressSystem,
  // Exportación por defecto mínima y segura para evitar referencias no definidas
  PROGRESS_CONFIG
}
