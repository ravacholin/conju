// Punto de entrada para el sistema de progreso y analíticas

import { initTracking } from './tracking.js'
import { initDB } from './database.js'

// Estado del sistema
let isInitialized = false
let currentUserId = null

/**
 * Inicializa el sistema de progreso
 * @param {string} userId - ID del usuario (si no se proporciona, se genera uno)
 * @returns {Promise<string>} ID del usuario
 */
export async function initProgressSystem(userId = null) {
  try {
    // Si ya está inicializado, devolver el ID actual
    if (isInitialized && currentUserId) {
      return currentUserId
    }
    
    // Inicializar base de datos
    await initDB()
    
    // Si no se proporcionó ID de usuario, generar uno
    if (!userId) {
      userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }
    
    // Inicializar tracking
    await initTracking(userId)
    
    // Marcar como inicializado
    isInitialized = true
    currentUserId = userId
    
    console.log(`✅ Sistema de progreso inicializado para usuario ${userId}`)
    return userId
  } catch (error) {
    console.error('❌ Error al inicializar el sistema de progreso:', error)
    throw error
  }
}

/**
 * Verifica si el sistema está inicializado
 * @returns {boolean} Si el sistema está inicializado
 */
export function isProgressSystemInitialized() {
  return isInitialized
}

/**
 * Obtiene el ID del usuario actual
 * @returns {string|null} ID del usuario actual
 */
export function getCurrentUserId() {
  return currentUserId
}

/**
 * Finaliza la sesión actual
 * @returns {Promise<void>}
 */
export async function endCurrentSession() {
  // En una implementación completa, esto finalizaría la sesión actual
  console.log('🔚 Sesión finalizada')
}

// Exportar todos los módulos relevantes
export { 
  // Tracking
  initTracking,
  
  // Database
  initDB,
  
  // Mastery
  calculateMasteryForItem,
  
  // SRS
  updateSchedule,
  
  // Utils
  generateId
} from './utils.js'

// Exportar tipos y constantes
export { ERROR_TAGS, FREQUENCY_LEVELS, VERB_DIFFICULTY } from './dataModels.js'