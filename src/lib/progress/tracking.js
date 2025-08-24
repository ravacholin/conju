// Sistema de tracking de eventos para el sistema de progreso

import { saveAttempt, saveMastery, saveSchedule } from './database.js'
import { calculateNextInterval, updateSchedule } from './srs.js'
// import { calculateMasteryForItem } from './mastery.js'  // Temporarily disabled
import { ERROR_TAGS } from './dataModels.js'

// Estado del tracking
let currentSession = null
let currentUserId = null

/**
 * Inicializa el sistema de tracking
 * @param {string} userId - ID del usuario
 * @returns {Promise<void>}
 */
export async function initTracking(userId) {
  console.log(`🎯 Inicializando tracking para usuario ${userId}`)
  
  try {
    // Crear sesión actual
    currentSession = {
      id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      startedAt: new Date(),
      endedAt: null
    }
    
    currentUserId = userId
    
    console.log(`✅ Tracking inicializado para sesión ${currentSession.id}`)
  } catch (error) {
    console.error('❌ Error al inicializar el sistema de tracking:', error)
    throw error
  }
}

/**
 * Registra el inicio de un intento
 * @param {Object} item - Ítem que se va a practicar
 * @returns {string} ID del intento
 */
export function trackAttemptStarted(item) {
  if (!currentSession) {
    throw new Error('Sistema de tracking no inicializado')
  }
  
  const attemptId = `attempt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  
  console.log(`🎯 Intento iniciado: ${attemptId} para ítem ${item.id}`)
  return attemptId
}

/**
 * Registra la finalización de un intento
 * @param {string} attemptId - ID del intento
 * @param {Object} result - Resultado del intento
 * @returns {Promise<void>}
 */
export async function trackAttemptSubmitted(attemptId, result) {
  if (!currentSession) {
    throw new Error('Sistema de tracking no inicializado')
  }
  
  try {
    // Clasificar errores si es incorrecto
    let errorTags = []
    if (!result.correct && !result.isAccentError) {
      errorTags = classifyError(result.userAnswer, result.correctAnswer, result.item)
    }
    
    // Crear objeto de intento
    const attempt = {
      id: attemptId,
      userId: currentSession.userId,
      itemId: result.itemId,
      correct: result.correct,
      latencyMs: result.latencyMs,
      hintsUsed: result.hintsUsed || 0,
      errorTags,
      createdAt: new Date()
    }
    
    // Guardar intento en la base de datos
    await saveAttempt(attempt)
    
    console.log(`✅ Intento registrado: ${attemptId}`, attempt)
  } catch (error) {
    console.error(`❌ Error al registrar intento ${attemptId}:`, error)
    throw error
  }
}

/**
 * Registra el final de una sesión
 * @param {Object} sessionData - Datos adicionales de la sesión
 * @returns {Promise<void>}
 */
export async function trackSessionEnded(sessionData = {}) {
  if (!currentSession) {
    throw new Error('Sistema de tracking no inicializado')
  }
  
  try {
    // Marcar fin de sesión
    currentSession.endedAt = new Date()
    
    console.log(`🔚 Sesión finalizada: ${currentSession.id}`, sessionData)
  } catch (error) {
    console.error('❌ Error al finalizar sesión:', error)
    throw error
  }
}

/**
 * Registra que se mostró una pista
 * @returns {Promise<void>}
 */
export async function trackHintShown() {
  try {
    // En una implementación completa, esto guardaría el evento
    console.log('💡 Pista mostrada')
  } catch (error) {
    console.error('❌ Error al mostrar pista:', error)
    throw error
  }
}

/**
 * Registra que se incrementó una racha
 * @returns {Promise<void>}
 */
export async function trackStreakIncremented() {
  try {
    // En una implementación completa, esto guardaría el evento
    console.log('🔥 Racha incrementada')
  } catch (error) {
    console.error('❌ Error al incrementar racha:', error)
    throw error
  }
}

/**
 * Registra el inicio de un drill de tiempo
 * @param {string} tense - Tiempo que se practica
 * @returns {Promise<void>}
 */
export async function trackTenseDrillStarted(tense) {
  try {
    // En una implementación completa, esto guardaría el evento
    console.log(`🔁 Drill de tiempo ${tense} iniciado`)
  } catch (error) {
    console.error('❌ Error al iniciar drill de tiempo:', error)
    throw error
  }
}

/**
 * Registra el final de un drill de tiempo
 * @param {string} tense - Tiempo que se practicaba
 * @returns {Promise<void>}
 */
export async function trackTenseDrillEnded(tense) {
  try {
    // En una implementación completa, esto guardaría el evento
    console.log(`✅ Drill de tiempo ${tense} finalizado`)
  } catch (error) {
    console.error('❌ Error al finalizar drill de tiempo:', error)
    throw error
  }
}

/**
 * Obtiene las estadísticas actuales del usuario
 * @returns {Promise<Object>} Estadísticas del usuario
 */
export async function getUserStats() {
  if (!currentUserId) {
    throw new Error('Sistema de tracking no inicializado')
  }
  
  try {
    // En una implementación completa, esto calcularía estadísticas reales
    // basadas en los datos de la base de datos
    
    return {
      userId: currentUserId,
      totalAttempts: 0,
      correctAttempts: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastActive: new Date()
    }
  } catch (error) {
    console.error('❌ Error al obtener estadísticas del usuario:', error)
    throw error
  }
}

/**
 * Clasifica un error específico
 * @param {string} userAnswer - Respuesta del usuario
 * @param {string} correctAnswer - Respuesta correcta
 * @param {Object} item - Ítem practicado
 * @returns {string[]} Etiquetas de error
 */
export function classifyError(userAnswer, correctAnswer, item) {
  const errors = []
  
  // Normalizar las respuestas para comparación
  const normalizedUser = normalizeAnswer(userAnswer)
  const normalizedCorrect = normalizeAnswer(correctAnswer)
  
  // Si las respuestas son idénticas, no hay error
  if (normalizedUser === normalizedCorrect) {
    return []
  }
  
  // Verificar errores específicos
  
  // 1. Persona equivocada (simplificado)
  // En una implementación completa, esto requeriría un análisis más detallado
  if (item.person && userAnswer && correctAnswer) {
    // Lógica simplificada para detectar errores
    // En la práctica, esto requeriría un análisis lingüístico más complejo
  }
  
  // Si no se identifican errores específicos, marcar como error general
  if (errors.length === 0) {
    errors.push(ERROR_TAGS.WRONG_PERSON) // Por defecto
  }
  
  return errors
}

/**
 * Normaliza una respuesta para comparación
 * @param {string} answer - Respuesta a normalizar
 * @returns {string} Respuesta normalizada
 */
function normalizeAnswer(answer) {
  if (!answer || typeof answer !== 'string') return ''
  
  return answer
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .replace(/\s+/g, ' ') // Normalizar espacios
    .trim()
}