// Verificación de integración del sistema de progreso

import { isProgressSystemInitialized, getCurrentUserId } from './index.js'
import { getSyncStatus } from './cloudSync.js'

/**
 * Verifica la integración del sistema de progreso
 * @returns {Promise<boolean>} Si la integración es exitosa
 */
export async function verifyProgressIntegration() {
  console.log('🔍 Verificando integración del sistema de progreso...')
  
  try {
    // Verificar si el sistema está inicializado
    const isInitialized = isProgressSystemInitialized()
    if (!isInitialized) {
      console.error('❌ Sistema de progreso no está inicializado')
      return false
    }
    
    // Verificar si hay un usuario actual
    const userId = getCurrentUserId()
    if (!userId) {
      console.error('❌ No hay usuario actual')
      return false
    }
    
    // Verificar estado de sincronización
    const syncStatus = getSyncStatus()
    console.log('🔄 Estado de sincronización:', syncStatus)
    
    console.log('✅ Integración del sistema de progreso verificada')
    return true
  } catch (error) {
    console.error('❌ Error al verificar integración del sistema de progreso:', error)
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
    console.log('🎉 Sistema de progreso completamente integrado')
  } else {
    console.error('💥 Sistema de progreso no está completamente integrado')
  }
}

// Ejecutar verificación si este archivo se ejecuta directamente
if (typeof window !== 'undefined' && window.location) {
  // Solo ejecutar en el navegador
  runIntegrationCheck().catch(error => {
    console.error('Error en verificación de integración:', error)
  })
}

export default verifyProgressIntegration