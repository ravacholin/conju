// Sistema de tracking de eventos y progreso

import { v4 as uuidv4 } from 'uuid'
import { 
  saveUser, saveVerb, saveItem, saveAttempt, 
  saveMastery, saveSchedule, getUser 
} from './database.js'
import { calculateMasteryForItem } from './mastery.js'
import { ERROR_TAGS } from './dataModels.js'
import { classifyError } from './errorClassification.js'

// Estado del usuario actual
let currentUser = null
let currentSession = null

/**
 * Inicializa el sistema de tracking para un usuario
 * @param {string} userId - ID del usuario
 * @returns {Promise<void>}
 */
export async function initTracking(userId) {
  // Verificar si el usuario existe, si no, crearlo
  let user = await getUser(userId)
  if (!user) {
    user = {
      id: userId,
      createdAt: new Date(),
      lastActive: new Date()
    }
    await saveUser(user)
  } else {
    // Actualizar última actividad
    user.lastActive = new Date()
    await saveUser(user)
  }
  
  currentUser = user
  currentSession = {
    id: uuidv4(),
    userId: userId,
    startedAt: new Date(),
    endedAt: null
  }
  
  console.log(`✅ Sistema de tracking inicializado para usuario ${userId}`)
}

/**
 * Registra el inicio de un intento
 * @param {Object} item - Ítem que se va a practicar
 * @returns {string} ID del intento
 */
export function trackAttemptStarted(item) {
  if (!currentUser) {
    throw new Error('Sistema de tracking no inicializado')
  }
  
  const attemptId = uuidv4()
  
  // Guardar en el estado de la sesión
  if (!currentSession.attempts) {
    currentSession.attempts = {}
  }
  
  currentSession.attempts[attemptId] = {
    itemId: item.id,
    startedAt: new Date()
  }
  
  return attemptId
}

/**
 * Registra la finalización de un intento
 * @param {string} attemptId - ID del intento
 * @param {Object} result - Resultado del intento
 * @param {boolean} result.correct - Si fue correcto
 * @param {number} result.latencyMs - Tiempo de respuesta en ms
 * @param {number} result.hintsUsed - Pistas utilizadas
 * @param {string[]} result.errorTags - Etiquetas de error
 * @returns {Promise<void>}
 */
export async function trackAttemptSubmitted(attemptId, result) {
  if (!currentUser || !currentSession.attempts || !currentSession.attempts[attemptId]) {
    throw new Error('Intento no encontrado')
  }
  
  const attemptRecord = currentSession.attempts[attemptId]
  
  // Crear objeto de intento
  const attempt = {
    id: attemptId,
    itemId: attemptRecord.itemId,
    correct: result.correct,
    latencyMs: result.latencyMs,
    hintsUsed: result.hintsUsed || 0,
    errorTags: result.errorTags || [],
    createdAt: attemptRecord.startedAt
  }
  
  // Guardar en la base de datos
  await saveAttempt(attempt)
  
  // Eliminar del estado de sesión
  delete currentSession.attempts[attemptId]
  
  // Actualizar mastery score para este ítem
  await updateMasteryForItem(attempt.itemId)
}

/**
 * Registra el final de una sesión
 * @param {Object} sessionData - Datos adicionales de la sesión
 * @returns {Promise<void>}
 */
export async function trackSessionEnded(sessionData = {}) {
  if (!currentUser || !currentSession) {
    throw new Error('Sistema de tracking no inicializado')
  }
  
  // Marcar fin de sesión
  currentSession.endedAt = new Date()
  
  // Aquí se podrían guardar estadísticas de la sesión
  console.log(`✅ Sesión finalizada para usuario ${currentUser.id}`)
  
  // Limpiar estado
  currentSession = null
}

/**
 * Registra que se mostró una pista
 * @returns {Promise<void>}
 */
export async function trackHintShown() {
  // En una implementación completa, se guardaría este evento
  console.log('💡 Pista mostrada')
}

/**
 * Registra que se incrementó una racha
 * @returns {Promise<void>}
 */
export async function trackStreakIncremented() {
  // En una implementación completa, se guardaría este evento
  console.log('🔥 Racha incrementada')
}

/**
 * Registra el inicio de un drill de tiempo
 * @param {string} tense - Tiempo que se practica
 * @returns {Promise<void>}
 */
export async function trackTenseDrillStarted(tense) {
  // En una implementación completa, se guardaría este evento
  console.log(`🔁 Drill de tiempo ${tense} iniciado`)
}

/**
 * Registra el final de un drill de tiempo
 * @param {string} tense - Tiempo que se practicaba
 * @returns {Promise<void>}
 */
export async function trackTenseDrillEnded(tense) {
  // En una implementación completa, se guardaría este evento
  console.log(`✅ Drill de tiempo ${tense} finalizado`)
}

/**
 * Actualiza el mastery score para un ítem específico
 * @param {string} itemId - ID del ítem
 * @returns {Promise<void>}
 */
async function updateMasteryForItem(itemId) {
  // En una implementación completa, se obtendría el verbo asociado al ítem
  // y se calcularía el mastery score usando calculateMasteryForItem
  console.log(`🔄 Mastery actualizado para ítem ${itemId}`)
}

/**
 * Obtiene las estadísticas actuales del usuario
 * @returns {Promise<Object>} Estadísticas del usuario
 */
export async function getUserStats() {
  if (!currentUser) {
    throw new Error('Sistema de tracking no inicializado')
  }
  
  // En una implementación completa, se calcularían estadísticas reales
  return {
    userId: currentUser.id,
    totalAttempts: 0,
    correctAttempts: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastActive: currentUser.lastActive
  }
}

/**
 * Clasifica un error en una o más categorías
 * @param {string} userAnswer - Respuesta del usuario
 * @param {string} correctAnswer - Respuesta correcta
 * @param {Object} item - Ítem practicado
 * @returns {string[]} Etiquetas de error
 */
export function classifyError(userAnswer, correctAnswer, item) {
  // Usar la implementación completa de clasificación de errores
  return classifyError(userAnswer, correctAnswer, item)
}

// Exportar funciones de tracking
export {
  trackAttemptStarted,
  trackAttemptSubmitted,
  trackSessionEnded,
  trackHintShown,
  trackStreakIncremented,
  trackTenseDrillStarted,
  trackTenseDrillEnded
}