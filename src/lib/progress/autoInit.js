// Inicialización automática del sistema de progreso

import { initProgressSystem } from './lib/progress/index.js'
import { initializeFullProgressSystem } from './lib/progress/fullInitialization.js'

/**
 * Inicializa automáticamente el sistema de progreso cuando se carga la aplicación
 * @returns {Promise<void>}
 */
export async function autoInitializeProgressSystem() {
  console.log('🚀 Inicializando automáticamente el sistema de progreso...')
  
  try {
    // Inicializar el sistema básico
    const userId = await initProgressSystem()
    console.log('✅ Sistema de progreso básico inicializado para usuario:', userId)
    
    // En una implementación completa, aquí se podría inicializar
    // el sistema completo en segundo plano
    /*
    // Inicializar sistema completo (en segundo plano)
    initializeFullProgressSystem()
      .then(() => {
        console.log('✅ Sistema de progreso completo inicializado')
      })
      .catch(error => {
        console.error('❌ Error al inicializar sistema completo:', error)
      })
    */
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
}

export default autoInitializeProgressSystem