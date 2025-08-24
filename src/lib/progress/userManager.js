// Sistema de gestión de usuarios para el tracking de progreso

/**
 * Gestiona la identificación persistente de usuarios para el sistema de progreso
 */

const USER_STORAGE_KEY = 'conju_user_id'
const USER_SETTINGS_KEY = 'conju_user_settings'

/**
 * Genera un ID único para el usuario
 * @returns {string} ID único basado en timestamp y random
 */
function generateUserId() {
  const timestamp = Date.now().toString(36)
  const randomStr = Math.random().toString(36).substring(2, 8)
  return `user_${timestamp}_${randomStr}`
}

/**
 * Obtiene o crea el ID del usuario actual
 * @returns {string} ID del usuario
 */
export function getCurrentUserId() {
  try {
    // Intentar recuperar ID existente
    let userId = localStorage.getItem(USER_STORAGE_KEY)
    
    if (!userId) {
      // Si no existe, crear nuevo ID
      userId = generateUserId()
      localStorage.setItem(USER_STORAGE_KEY, userId)
      
      // Inicializar configuraciones del usuario
      const userSettings = {
        createdAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
        totalSessions: 0,
        weeklyGoals: {
          cellsToImprove: 3,
          minScore: 75,
          sessions: 5,
          attempts: 50,
          focusTime: 60
        }
      }
      
      localStorage.setItem(USER_SETTINGS_KEY, JSON.stringify(userSettings))
      
      console.log(`🆔 Nuevo usuario creado: ${userId}`)
    } else {
      // Actualizar última actividad
      updateLastActivity(userId)
    }
    
    return userId
  } catch (error) {
    console.error('Error al gestionar user ID:', error)
    // Fallback a un ID de sesión temporal
    return `session_${Date.now()}`
  }
}

/**
 * Actualiza la última actividad del usuario
 * @param {string} userId - ID del usuario
 */
function updateLastActivity(userId) {
  try {
    const settingsStr = localStorage.getItem(USER_SETTINGS_KEY)
    if (settingsStr) {
      const settings = JSON.parse(settingsStr)
      settings.lastActiveAt = new Date().toISOString()
      localStorage.setItem(USER_SETTINGS_KEY, JSON.stringify(settings))
    }
  } catch (error) {
    console.warn('Error al actualizar última actividad:', error)
  }
}

/**
 * Obtiene las configuraciones del usuario
 * @param {string} userId - ID del usuario
 * @returns {Object} Configuraciones del usuario
 */
export function getUserSettings(userId) {
  try {
    const settingsStr = localStorage.getItem(USER_SETTINGS_KEY)
    if (settingsStr) {
      return JSON.parse(settingsStr)
    }
  } catch (error) {
    console.warn('Error al obtener configuraciones del usuario:', error)
  }
  
  // Configuraciones por defecto
  return {
    createdAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    totalSessions: 0,
    weeklyGoals: {
      cellsToImprove: 3,
      minScore: 75,
      sessions: 5,
      attempts: 50,
      focusTime: 60
    }
  }
}

/**
 * Actualiza las configuraciones del usuario
 * @param {string} userId - ID del usuario
 * @param {Object} updates - Actualizaciones a aplicar
 */
export function updateUserSettings(userId, updates) {
  try {
    const currentSettings = getUserSettings(userId)
    const newSettings = {
      ...currentSettings,
      ...updates,
      lastActiveAt: new Date().toISOString()
    }
    
    localStorage.setItem(USER_SETTINGS_KEY, JSON.stringify(newSettings))
    console.log('⚙️ Configuraciones de usuario actualizadas')
  } catch (error) {
    console.error('Error al actualizar configuraciones:', error)
  }
}

/**
 * Incrementa el contador de sesiones del usuario
 * @param {string} userId - ID del usuario
 */
export function incrementSessionCount(userId) {
  const currentSettings = getUserSettings(userId)
  updateUserSettings(userId, {
    totalSessions: (currentSettings.totalSessions || 0) + 1
  })
}

/**
 * Actualiza los objetivos semanales del usuario
 * @param {string} userId - ID del usuario
 * @param {Object} goals - Nuevos objetivos
 */
export function updateWeeklyGoals(userId, goals) {
  const currentSettings = getUserSettings(userId)
  updateUserSettings(userId, {
    weeklyGoals: {
      ...currentSettings.weeklyGoals,
      ...goals
    }
  })
}

/**
 * Obtiene estadísticas básicas del usuario
 * @param {string} userId - ID del usuario
 * @returns {Object} Estadísticas del usuario
 */
export function getUserStats(userId) {
  const settings = getUserSettings(userId)
  const createdAt = new Date(settings.createdAt)
  const now = new Date()
  const daysActive = Math.ceil((now - createdAt) / (1000 * 60 * 60 * 24))
  
  return {
    userId,
    createdAt: settings.createdAt,
    lastActiveAt: settings.lastActiveAt,
    totalSessions: settings.totalSessions || 0,
    daysActive,
    weeklyGoals: settings.weeklyGoals
  }
}

/**
 * Limpia los datos del usuario (para testing o reset)
 * @param {string} userId - ID del usuario
 */
export function clearUserData(userId) {
  try {
    localStorage.removeItem(USER_STORAGE_KEY)
    localStorage.removeItem(USER_SETTINGS_KEY)
    console.log('🗑️ Datos de usuario limpiados')
  } catch (error) {
    console.error('Error al limpiar datos de usuario:', error)
  }
}

/**
 * Verifica si el usuario es nuevo (menos de 24 horas desde creación)
 * @param {string} userId - ID del usuario
 * @returns {boolean} True si es usuario nuevo
 */
export function isNewUser(userId) {
  const settings = getUserSettings(userId)
  const createdAt = new Date(settings.createdAt)
  const now = new Date()
  const hoursActive = (now - createdAt) / (1000 * 60 * 60)
  
  return hoursActive < 24
}