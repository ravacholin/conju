// Inicialización automática del sistema de progreso

import { initProgressSystem } from './index.js'

/**
 * Inicializa automáticamente el sistema de progreso cuando se carga la aplicación
 * @returns {Promise<void>}
 */
export async function autoInitializeProgressSystem() {
  console.log(' Inicializando automáticamente el sistema de progreso...')
  
  try {
    // Inicializar el sistema de progreso
    const userId = await initProgressSystem()
    console.log('✅ Sistema de progreso inicializado para usuario:', userId)
  } catch (error) {
    console.error('❌ Error al inicializar automáticamente el sistema de progreso:', error)
  }
}

// Ejecutar inicialización automática cuando se carga el módulo
if (typeof window !== 'undefined') {
  // Solo ejecutar en el navegador
  autoInitializeProgressSystem().catch(error => {
    console.error('Error en inicialización automática:', error)
  })
  console.log(' Inicialización automática del sistema de progreso habilitada')
}

export default autoInitializeProgressSystem