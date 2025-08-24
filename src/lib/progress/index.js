// Punto de entrada principal para el sistema de progreso y analíticas

import { initDB } from './database.js'
import { initTracking } from './tracking.js'
import { initializeVerbs } from './verbInitialization.js'
import { initializeItems } from './itemManagement.js'
import { PROGRESS_CONFIG } from './config.js'

// Estado del sistema
let isInitialized = false
let currentUserId = null

/**
 * Inicializa completamente el sistema de progreso
 * @param {string} userId - ID del usuario (si no se proporciona, se genera uno)
 * @returns {Promise<string>} ID del usuario
 */
export async function initProgressSystem(userId = null) {
  try {
    console.log('🚀 Inicializando completamente el sistema de progreso...')
    
    // Si ya está inicializado, devolver el ID actual
    if (isInitialized && currentUserId) {
      return currentUserId
    }
    
    // Inicializar base de datos
    await initDB()
    console.log('✅ Base de datos inicializada')
    
    // Si no se proporcionó ID de usuario, generar uno
    if (!userId) {
      userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }
    
    // Inicializar tracking
    await initTracking(userId)
    console.log('✅ Tracking inicializado')
    
    // Inicializar verbos
    await initializeVerbs()
    console.log('✅ Verbos inicializados')
    
    // Inicializar ítems
    await initializeItems()
    console.log('✅ Ítems inicializados')
    
    // Marcar como inicializado
    isInitialized = true
    currentUserId = userId
    
    console.log(`🎉 Sistema de progreso completamente inicializado para usuario ${userId}`)
    return userId
  } catch (error) {
    console.error('❌ Error al inicializar el sistema de progreso:', error)
    throw error
  }
}

/**
 * Verifica si el sistema está completamente inicializado
 * @returns {boolean} Si el sistema está completamente inicializado
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
  try {
    // En una implementación completa, esto finalizaría la sesión actual
    console.log('🔚 Sesión finalizada')
  } catch (error) {
    console.error('❌ Error al finalizar sesión:', error)
    throw error
  }
}

/**
 * Reinicia el sistema de progreso
 * @returns {Promise<void>}
 */
export async function resetProgressSystem() {
  try {
    console.log('🔄 Reiniciando sistema de progreso...')
    
    // Reiniciar estado
    isInitialized = false
    currentUserId = null
    
    console.log('✅ Sistema de progreso reiniciado')
  } catch (error) {
    console.error('❌ Error al reiniciar sistema de progreso:', error)
    throw error
  }
}

// Exportar todas las funciones principales
export {
  // Database
  initDB,
  
  // Tracking
  initTracking,
  
  // Verb Initialization
  initializeVerbs,
  
  // Item Management
  initializeItems,
  
  // Mastery
  calculateMasteryForItem,
  calculateMasteryForCell,
  calculateMasteryForTimeOrMood,
  
  // SRS
  updateSchedule,
  getDueItems,
  isItemDue,
  
  // Utils
  generateId,
  formatDate,
  dateDiffInDays,
  msToSeconds,
  groupBy,
  average,
  maxBy,
  minBy,
  
  // UI Utils
  formatPercentage,
  formatTime,
  getMasteryColorClass,
  getMasteryLevelText,
  getMasteryIcon,
  formatRelativeDate,
  
  // Analytics
  getHeatMapData,
  getCompetencyRadarData,
  getProgressLineData,
  getUserStats,
  
  // Goals
  getWeeklyGoals,
  checkWeeklyProgress,
  getRecommendations,
  
  // Teacher Mode
  generateStudentReport,
  exportToCSV,
  generateSessionCode,
  getClassStats,
  
  // Diagnosis
  performInitialDiagnosis,
  scheduleMonthlyRecalibration,
  performRecalibration,
  
  // Cloud Sync
  syncWithCloud,
  getSyncStatus,
  setIncognitoMode,
  hasPendingSyncData,
  forceSync,
  exportDataForBackup,
  importDataFromBackup
} from './all.js'

// Exportar tipos y constantes
export { ERROR_TAGS, FREQUENCY_LEVELS, VERB_DIFFICULTY } from './dataModels.js'
export { PROGRESS_CONFIG } from './config.js'

export default {
  initProgressSystem,
  isProgressSystemInitialized,
  getCurrentUserId,
  endCurrentSession,
  resetProgressSystem,
  // Todas las demás funciones exportadas
  initDB,
  initTracking,
  initializeVerbs,
  initializeItems,
  calculateMasteryForItem,
  calculateMasteryForCell,
  calculateMasteryForTimeOrMood,
  updateSchedule,
  getDueItems,
  isItemDue,
  generateId,
  formatDate,
  dateDiffInDays,
  msToSeconds,
  groupBy,
  average,
  maxBy,
  minBy,
  formatPercentage,
  formatTime,
  getMasteryColorClass,
  getMasteryLevelText,
  getMasteryIcon,
  formatRelativeDate,
  getHeatMapData,
  getCompetencyRadarData,
  getProgressLineData,
  getUserStats,
  getWeeklyGoals,
  checkWeeklyProgress,
  getRecommendations,
  generateStudentReport,
  exportToCSV,
  generateSessionCode,
  getClassStats,
  performInitialDiagnosis,
  scheduleMonthlyRecalibration,
  performRecalibration,
  syncWithCloud,
  getSyncStatus,
  setIncognitoMode,
  hasPendingSyncData,
  forceSync,
  exportDataForBackup,
  importDataFromBackup,
  ERROR_TAGS,
  FREQUENCY_LEVELS,
  VERB_DIFFICULTY,
  PROGRESS_CONFIG
}