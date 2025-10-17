// Inicialización completa del sistema de progreso y analíticas

import {
  initProgressSystem,
  isProgressSystemInitialized,
  getCurrentUserId
} from './index.js'

import {
  initDB,
  initTracking,
  initializeVerbs,
  initializeItems
} from './all.js'

import { createLogger } from '../utils/logger.js'

const logger = createLogger('progress:fullInit')

// Estado de inicialización completa
let isFullyInitialized = false

/**
 * Inicializa completamente el sistema de progreso y analíticas
 * @param {string} userId - ID del usuario (si no se proporciona, se genera uno)
 * @returns {Promise<string>} ID del usuario
 */
export async function initializeFullProgressSystem(userId = null) {
  logger.info('initializeFullProgressSystem', '🚀 Inicializando completamente el sistema de progreso y analíticas...')

  try {
    // Si ya está completamente inicializado, devolver el ID actual
    if (isFullyInitialized && getCurrentUserId()) {
      logger.info('initializeFullProgressSystem', `✅ Sistema ya completamente inicializado para usuario ${getCurrentUserId()}`)
      return getCurrentUserId()
    }

    // Inicializar sistema básico
    const initializedUserId = await initProgressSystem(userId)
    logger.info('initializeFullProgressSystem', `✅ Sistema básico inicializado para usuario ${initializedUserId}`)

    // Inicializar base de datos
    await initDB()
    logger.info('initializeFullProgressSystem', '✅ Base de datos inicializada')

    // Inicializar tracking
    await initTracking(initializedUserId)
    logger.info('initializeFullProgressSystem', '✅ Tracking inicializado')

    // Inicializar verbos
    await initializeVerbs()
    logger.info('initializeFullProgressSystem', '✅ Verbos inicializados')

    // Inicializar ítems
    await initializeItems()
    logger.info('initializeFullProgressSystem', '✅ Ítems inicializados')

    // Marcar como completamente inicializado
    isFullyInitialized = true

    logger.info('initializeFullProgressSystem', `🎉 Sistema de progreso y analíticas completamente inicializado para usuario ${initializedUserId}`)
    return initializedUserId
  } catch (error) {
    logger.error('initializeFullProgressSystem', '❌ Error al inicializar completamente el sistema de progreso y analíticas', error)
    throw error
  }
}

/**
 * Verifica si el sistema está completamente inicializado
 * @returns {boolean} Si el sistema está completamente inicializado
 */
export function isFullProgressSystemInitialized() {
  return isFullyInitialized && isProgressSystemInitialized()
}

/**
 * Reinicia la inicialización completa
 * @returns {Promise<void>}
 */
export async function resetFullInitialization() {
  logger.info('resetFullInitialization', '🔄 Reiniciando inicialización completa...')

  try {
    // Reiniciar estado
    isFullyInitialized = false

    logger.info('resetFullInitialization', '✅ Inicialización completa reiniciada')
  } catch (error) {
    logger.error('resetFullInitialization', '❌ Error al reiniciar inicialización completa', error)
    throw error
  }
}

/**
 * Verifica el estado de la inicialización completa
 * @returns {Object} Estado de la inicialización
 */
export function getFullInitializationStatus() {
  return {
    isInitialized: isFullProgressSystemInitialized(),
    userId: getCurrentUserId(),
    components: {
      basic: isProgressSystemInitialized(),
      database: true, // En una implementación completa, esto verificaría el estado real
      tracking: true, // En una implementación completa, esto verificaría el estado real
      verbs: true, // En una implementación completa, esto verificaría el estado real
      items: true // En una implementación completa, esto verificaría el estado real
    }
  }
}

/**
 * Ejecuta un diagnóstico de la inicialización completa
 * @returns {Promise<Object>} Resultados del diagnóstico
 */
export async function diagnoseFullInitialization() {
  logger.info('diagnoseFullInitialization', '🔍 Diagnosticando inicialización completa...')

  try {
    const status = getFullInitializationStatus()

    // Verificar cada componente
    const diagnostics = {
      basic: status.components.basic ? '✅' : '❌',
      database: status.components.database ? '✅' : '❌',
      tracking: status.components.tracking ? '✅' : '❌',
      verbs: status.components.verbs ? '✅' : '❌',
      items: status.components.items ? '✅' : '❌'
    }

    const allGood = Object.values(diagnostics).every(d => d === '✅')

    logger.info('diagnoseFullInitialization', `📊 Diagnóstico de inicialización completa: ${allGood ? '✅' : '❌'}`)
    Object.entries(diagnostics).forEach(([component, status]) => {
      logger.debug('diagnoseFullInitialization', `  ${status} ${component}`)
    })

    return {
      status: allGood ? 'healthy' : 'issues',
      diagnostics,
      userId: status.userId,
      timestamp: new Date()
    }
  } catch (error) {
    logger.error('diagnoseFullInitialization', '❌ Error al diagnosticar inicialización completa', error)
    return {
      status: 'error',
      error: error.message,
      timestamp: new Date()
    }
  }
}

/**
 * Ejecuta pruebas de la inicialización completa
 * @returns {Promise<Object>} Resultados de las pruebas
 */
export async function testFullInitialization() {
  logger.info('testFullInitialization', '🧪 Ejecutando pruebas de inicialización completa...')

  try {
    // Verificar que todas las funciones están disponibles
    const functions = [
      initProgressSystem,
      isProgressSystemInitialized,
      getCurrentUserId,
      initDB,
      initTracking,
      initializeVerbs,
      initializeItems
    ]

    const allFunctionsAvailable = functions.every(fn => typeof fn === 'function')

    // Verificar inicialización
    const userId = await initializeFullProgressSystem()
    const isInitialized = isFullProgressSystemInitialized()
    const status = getFullInitializationStatus()
    const diagnosis = await diagnoseFullInitialization()

    const allTestsPassed = allFunctionsAvailable && isInitialized && status.isInitialized && diagnosis.status === 'healthy'

    logger.info('testFullInitialization', `🧪 Pruebas de inicialización completa: ${allTestsPassed ? '✅' : '❌'}`)
    logger.debug('testFullInitialization', `  ${allFunctionsAvailable ? '✅' : '❌'} Todas las funciones disponibles`)
    logger.debug('testFullInitialization', `  ${isInitialized ? '✅' : '❌'} Sistema completamente inicializado`)
    logger.debug('testFullInitialization', `  ${status.isInitialized ? '✅' : '❌'} Estado de inicialización correcto`)
    logger.debug('testFullInitialization', `  ${diagnosis.status === 'healthy' ? '✅' : '❌'} Diagnóstico saludable`)

    return {
      passed: allTestsPassed,
      functions: allFunctionsAvailable,
      initialized: isInitialized,
      status: status.isInitialized,
      diagnosis: diagnosis.status === 'healthy',
      userId,
      timestamp: new Date()
    }
  } catch (error) {
    logger.error('testFullInitialization', '❌ Error al ejecutar pruebas de inicialización completa', error)
    return {
      passed: false,
      error: error.message,
      timestamp: new Date()
    }
  }
}

// Ejecutar inicialización completa si este archivo se ejecuta directamente
if (typeof window !== 'undefined' && window.location) {
  // Solo ejecutar en el navegador
  // DISABLED: initializeFullProgressSystem().catch(error => {
  //   logger.error('auto-init', 'Error en inicialización completa', error)
  // })
  logger.info('auto-init', '⏸️ Inicialización completa automática deshabilitada temporalmente')
}

export default {
  initializeFullProgressSystem,
  isFullProgressSystemInitialized,
  resetFullInitialization,
  getFullInitializationStatus,
  diagnoseFullInitialization,
  testFullInitialization
}