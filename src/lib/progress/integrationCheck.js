// Verificación de integración del sistema de progreso

import { isProgressSystemInitialized, getCurrentUserId } from './index.js'
import { getSyncStatus } from './cloudSync.js'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('progress:integrationCheck')


/**
 * Verifica la integración del sistema de progreso
 * @returns {Promise<boolean>} Si la integración es exitosa
 */
export async function verifyProgressIntegration() {
  logger.debug('🔍 Verificando integración del sistema de progreso...')
  
  try {
    // Verificar si el sistema está inicializado
    const isInitialized = isProgressSystemInitialized()
    if (!isInitialized) {
      logger.error('❌ Sistema de progreso no está inicializado')
      return false
    }
    
    // Verificar si hay un usuario actual
    const userId = getCurrentUserId()
    if (!userId) {
      logger.error('❌ No hay usuario actual')
      return false
    }
    
    // Verificar estado de sincronización
    const syncStatus = getSyncStatus()
    logger.debug('🔄 Estado de sincronización:', syncStatus)
    
    logger.debug('✅ Integración del sistema de progreso verificada')
    return true
  } catch (error) {
    logger.error('❌ Error al verificar integración del sistema de progreso:', error)
    return false
  }
}

/**
 * Ejecuta verificación de integración
 * @returns {Promise<void>}
 */
export async function runIntegrationCheck() {
  const isIntegrated = await verifyProgressIntegration()
  if (isIntegrated) {
    logger.debug('🎉 Sistema de progreso completamente integrado')
  } else {
    logger.error('💥 Sistema de progreso no está completamente integrado')
  }
}

// Ejecutar verificación si este archivo se ejecuta directamente
if (typeof window !== 'undefined' && window.location) {
  // Solo ejecutar en el navegador
  runIntegrationCheck().catch(error => {
    logger.error('Error en verificación de integración:', error)
  })
}

export default verifyProgressIntegration