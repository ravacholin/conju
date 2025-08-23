// Verificación de integración del sistema de progreso

import { initProgressSystem, isProgressSystemInitialized } from './lib/progress/index.js'

/**
 * Verifica la integración del sistema de progreso
 * @returns {Promise<boolean>} Si la integración es exitosa
 */
export async function verifyProgressIntegration() {
  console.log('🔍 Verificando integración del sistema de progreso...')
  
  try {
    // Verificar si el sistema ya está inicializado
    if (isProgressSystemInitialized()) {
      console.log('✅ Sistema de progreso ya inicializado')
      return true
    }
    
    // Inicializar el sistema de progreso
    const userId = await initProgressSystem()
    console.log('✅ Sistema de progreso inicializado con userId:', userId)
    
    // Verificar que esté inicializado
    const isInitialized = isProgressSystemInitialized()
    if (isInitialized) {
      console.log('✅ Integración del sistema de progreso verificada')
      return true
    } else {
      console.error('❌ Sistema de progreso no está marcado como inicializado')
      return false
    }
  } catch (error) {
    console.error('❌ Error al verificar integración del sistema de progreso:', error)
    return false
  }
}

// Ejecutar verificación si este archivo se ejecuta directamente
if (typeof window !== 'undefined' && window.location) {
  // Solo ejecutar en el navegador
  verifyProgressIntegration().catch(error => {
    console.error('Error en verificación de integración:', error)
  })
}