// Inicialización automática del sistema de progreso

import { initProgressSystem } from './index.js'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('progress:autoInit')


/**
 * Inicializa automáticamente el sistema de progreso cuando se carga la aplicación
 * @returns {Promise<void>}
 */
export async function autoInitializeProgressSystem() {
  logger.debug('🚀 Inicializando automáticamente el sistema de progreso...')
  
  try {
    // Inicializar el sistema de progreso
    const userId = await initProgressSystem()
    logger.debug('✅ Sistema de progreso inicializado para usuario:', userId)
  } catch (error) {
    logger.error('❌ Error al inicializar automáticamente el sistema de progreso:', error)
  }
}

// Ejecutar inicialización automática cuando se carga el módulo
if (typeof window !== 'undefined') {
  // Solo ejecutar en el navegador
  autoInitializeProgressSystem().catch(error => {
    logger.error('Error en inicialización automática:', error)
  })
  logger.debug('🚀 Inicialización automática del sistema de progreso habilitada')
}

export default autoInitializeProgressSystem