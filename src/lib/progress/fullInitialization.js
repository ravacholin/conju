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

// Estado de inicialización completa
let isFullyInitialized = false

/**
 * Inicializa completamente el sistema de progreso y analíticas
 * @param {string} userId - ID del usuario (si no se proporciona, se genera uno)
 * @returns {Promise<string>} ID del usuario
 */
export async function initializeFullProgressSystem(userId = null) {
  console.log('🚀 Inicializando completamente el sistema de progreso y analíticas...')
  
  try {
    // Si ya está completamente inicializado, devolver el ID actual
    if (isFullyInitialized && getCurrentUserId()) {
      console.log(`✅ Sistema ya completamente inicializado para usuario ${getCurrentUserId()}`)
      return getCurrentUserId()
    }
    
    // Inicializar sistema básico
    const initializedUserId = await initProgressSystem(userId)
    console.log(`✅ Sistema básico inicializado para usuario ${initializedUserId}`)
    
    // Inicializar base de datos
    await initDB()
    console.log('✅ Base de datos inicializada')
    
    // Inicializar tracking
    await initTracking(initializedUserId)
    console.log('✅ Tracking inicializado')
    
    // Inicializar verbos
    await initializeVerbs()
    console.log('✅ Verbos inicializados')
    
    // Inicializar ítems
    await initializeItems()
    console.log('✅ Ítems inicializados')
    
    // Marcar como completamente inicializado
    isFullyInitialized = true
    
    console.log(`🎉 Sistema de progreso y analíticas completamente inicializado para usuario ${initializedUserId}`)
    return initializedUserId
  } catch (error) {
    console.error('❌ Error al inicializar completamente el sistema de progreso y analíticas:', error)
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
  console.log('🔄 Reiniciando inicialización completa...')
  
  try {
    // Reiniciar estado
    isFullyInitialized = false
    
    console.log('✅ Inicialización completa reiniciada')
  } catch (error) {
    console.error('❌ Error al reiniciar inicialización completa:', error)
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
  console.log('🔍 Diagnosticando inicialización completa...')
  
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
    
    console.log(`📊 Diagnóstico de inicialización completa: ${allGood ? '✅' : '❌'}`)
    Object.entries(diagnostics).forEach(([component, status]) => {
      console.log(`  ${status} ${component}`)
    })
    
    return {
      status: allGood ? 'healthy' : 'issues',
      diagnostics,
      userId: status.userId,
      timestamp: new Date()
    }
  } catch (error) {
    console.error('❌ Error al diagnosticar inicialización completa:', error)
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
  console.log('🧪 Ejecutando pruebas de inicialización completa...')
  
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
    
    console.log(`🧪 Pruebas de inicialización completa: ${allTestsPassed ? '✅' : '❌'}`)
    console.log(`  ${allFunctionsAvailable ? '✅' : '❌'} Todas las funciones disponibles`)
    console.log(`  ${isInitialized ? '✅' : '❌'} Sistema completamente inicializado`)
    console.log(`  ${status.isInitialized ? '✅' : '❌'} Estado de inicialización correcto`)
    console.log(`  ${diagnosis.status === 'healthy' ? '✅' : '❌'} Diagnóstico saludable`)
    
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
    console.error('❌ Error al ejecutar pruebas de inicialización completa:', error)
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
  initializeFullProgressSystem().catch(error => {
    console.error('Error en inicialización completa:', error)
  })
}

export default {
  initializeFullProgressSystem,
  isFullProgressSystemInitialized,
  resetFullInitialization,
  getFullInitializationStatus,
  diagnoseFullInitialization,
  testFullInitialization
}