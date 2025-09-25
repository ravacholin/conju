// Funciones de tracking para el sistema de progreso

import { 
  trackAttemptStarted as internalTrackAttemptStarted,
  trackAttemptSubmitted as internalTrackAttemptSubmitted,
  trackSessionEnded as internalTrackSessionEnded,
  trackHintShown as internalTrackHintShown,
  trackStreakIncremented as internalTrackStreakIncremented,
  trackTenseDrillStarted as internalTrackTenseDrillStarted,
  trackTenseDrillEnded as internalTrackTenseDrillEnded,
  getUserStats as internalGetUserStats
} from '../../lib/progress/tracking.js'
import { classifyError as internalClassifyError } from '../../lib/progress/errorClassification.js'

/**
 * Registra el inicio de un intento
 * @param {Object} item - Ítem que se va a practicar
 * @returns {string} ID del intento
 */
export function trackAttemptStarted(item) {
  try {
    const attemptId = internalTrackAttemptStarted(item)
    console.log(`🎯 Intento ${attemptId} iniciado para ítem ${item.id}`)
    return attemptId
  } catch (error) {
    console.error('❌ Error al iniciar intento:', error)
    // Generar ID de respaldo
    return `attempt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

/**
 * Registra la finalización de un intento
 * @param {string} attemptId - ID del intento
 * @param {Object} result - Resultado del intento
 * @returns {Promise<void>}
 */
export async function trackAttemptSubmitted(attemptId, result) {
  try {
    await internalTrackAttemptSubmitted(attemptId, result)
    console.log(`✅ Intento ${attemptId} registrado`)
  } catch (error) {
    console.error('❌ Error al registrar intento:', error)
  }
}

/**
 * Registra el final de una sesión
 * @param {Object} sessionData - Datos adicionales de la sesión
 * @returns {Promise<void>}
 */
export async function trackSessionEnded(sessionData = {}) {
  try {
    await internalTrackSessionEnded(sessionData)
    console.log('🔚 Sesión finalizada')
  } catch (error) {
    console.error('❌ Error al finalizar sesión:', error)
  }
}

/**
 * Registra que se mostró una pista
 * @returns {Promise<void>}
 */
export async function trackHintShown() {
  try {
    await internalTrackHintShown()
    console.log('💡 Pista mostrada')
  } catch (error) {
    console.error('❌ Error al mostrar pista:', error)
  }
}

/**
 * Registra que se incrementó una racha
 * @returns {Promise<void>}
 */
export async function trackStreakIncremented() {
  try {
    await internalTrackStreakIncremented()
    console.log('🔥 Racha incrementada')
  } catch (error) {
    console.error('❌ Error al incrementar racha:', error)
  }
}

/**
 * Registra el inicio de un drill de tiempo
 * @param {string} tense - Tiempo que se practica
 * @returns {Promise<void>}
 */
export async function trackTenseDrillStarted(tense) {
  try {
    await internalTrackTenseDrillStarted(tense)
    console.log(`🔁 Drill de tiempo ${tense} iniciado`)
  } catch (error) {
    console.error('❌ Error al iniciar drill de tiempo:', error)
  }
}

/**
 * Registra el final de un drill de tiempo
 * @param {string} tense - Tiempo que se practicaba
 * @returns {Promise<void>}
 */
export async function trackTenseDrillEnded(tense) {
  try {
    await internalTrackTenseDrillEnded(tense)
    console.log(`✅ Drill de tiempo ${tense} finalizado`)
  } catch (error) {
    console.error('❌ Error al finalizar drill de tiempo:', error)
  }
}

/**
 * Obtiene las estadísticas actuales del usuario
 * @returns {Promise<Object>} Estadísticas del usuario
 */
export async function getUserStats() {
  try {
    const stats = await internalGetUserStats()
    return stats
  } catch (error) {
    console.error('❌ Error al obtener estadísticas del usuario:', error)
    return {}
  }
}

/**
 * Clasifica un error de conjugación
 * @param {string} userAnswer - Respuesta del usuario
 * @param {string} correctAnswer - Respuesta correcta
 * @param {Object} item - Ítem practicado
 * @returns {string[]} Etiquetas de error
 */
export function classifyError(userAnswer, correctAnswer, item) {
  try {
    const errors = internalClassifyError(userAnswer, correctAnswer, item)
    return errors
  } catch (error) {
    console.error('❌ Error al clasificar error:', error)
    // Devolver error genérico si falla la clasificación
    return ['error_general']
  }
}
