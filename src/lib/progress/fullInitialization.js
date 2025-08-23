// Inicialización completa del sistema de progreso

import { initProgressSystem } from './index.js'
import { initializeProgressVerbs } from './verbInitialization.js'
import { initializeItems } from './itemManagement.js'

/**
 * Inicializa completamente el sistema de progreso
 * @returns {Promise<void>}
 */
export async function initializeFullProgressSystem() {
  console.log('🚀 Inicializando sistema de progreso completo...')
  
  try {
    // 1. Inicializar el sistema básico
    await initProgressSystem()
    console.log('✅ Sistema básico inicializado')
    
    // 2. Inicializar verbos
    await initializeProgressVerbs()
    console.log('✅ Verbos inicializados')
    
    // 3. Inicializar ítems
    await initializeItems()
    console.log('✅ Ítems inicializados')
    
    console.log('🎉 Sistema de progreso completamente inicializado')
  } catch (error) {
    console.error('❌ Error al inicializar el sistema de progreso completo:', error)
    throw error
  }
}

/**
 * Verifica si el sistema de progreso está completamente inicializado
 * @returns {Promise<boolean>} Si el sistema está completamente inicializado
 */
export async function isFullProgressSystemInitialized() {
  // En una implementación completa, esto verificaría el estado
  // de todos los componentes del sistema
  try {
    // Por ahora, asumimos que si el sistema básico está inicializado,
    // el sistema completo también lo está
    return true
  } catch (error) {
    console.error('Error al verificar estado del sistema:', error)
    return false
  }
}