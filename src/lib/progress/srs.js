// Sistema SRS (Spaced Repetition System) para el sistema de progreso

import { PROGRESS_CONFIG } from './config.js'
import { saveSchedule, getScheduleByCell, getDueSchedules } from './database.js'

/**
 * Calcula el próximo intervalo basado en el desempeño
 * @param {Object} schedule - Schedule actual
 * @param {boolean} correct - Si la respuesta fue correcta
 * @param {number} hintsUsed - Número de pistas usadas
 * @returns {Object} Nuevo intervalo y fecha
 */
export function calculateNextInterval(schedule, correct, hintsUsed) {
  let { interval = 0, ease = 2.5, reps = 0 } = schedule
  
  if (!correct) {
    // Si falla, reiniciar al intervalo anterior
    reps = Math.max(0, reps - 1)
    interval = reps > 0 ? PROGRESS_CONFIG.SRS_INTERVALS[Math.min(reps, PROGRESS_CONFIG.SRS_INTERVALS.length - 1)] : 1
  } else {
    // Si acierta
    if (hintsUsed > 0) {
      // Si usó pistas, no subir de nivel
      // Mantener el mismo intervalo
    } else {
      // Si acierta sin pistas, subir de nivel
      reps += 1
      interval = PROGRESS_CONFIG.SRS_INTERVALS[Math.min(reps - 1, PROGRESS_CONFIG.SRS_INTERVALS.length - 1)]
    }
  }
  
  // Calcular próxima fecha de revisión
  const now = new Date()
  const nextDue = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000)
  
  return {
    interval,
    ease,
    reps,
    nextDue
  }
}

/**
 * Actualiza el schedule para una celda específica
 * @param {string} userId - ID del usuario
 * @param {Object} cell - Celda (modo, tiempo, persona)
 * @param {boolean} correct - Si la respuesta fue correcta
 * @param {number} hintsUsed - Número de pistas usadas
 * @returns {Promise<void>}
 */
export async function updateSchedule(userId, cell, correct, hintsUsed) {
  // Buscar schedule existente para esta celda
  let schedule = await getScheduleByCell(userId, cell.mood, cell.tense, cell.person)
  
  // Si no existe, crear uno nuevo
  if (!schedule) {
    schedule = {
      userId,
      mood: cell.mood,
      tense: cell.tense,
      person: cell.person,
      interval: 0,
      ease: 2.5,
      reps: 0,
      nextDue: new Date()
    }
  }
  
  // Calcular nuevo intervalo
  const updatedSchedule = {
    ...schedule,
    ...calculateNextInterval(schedule, correct, hintsUsed)
  }
  
  // Guardar en la base de datos
  await saveSchedule(updatedSchedule)
}

/**
 * Obtiene ítems pendientes para revisión
 * @param {string} userId - ID del usuario
 * @param {Date} currentDate - Fecha actual
 * @returns {Promise<Array>} Ítems pendientes
 */
export async function getDueItems(userId, currentDate = new Date()) {
  try {
    const schedules = await getDueSchedules(userId, currentDate)
    // Normalizar a celdas básicas y ordenar por fecha próxima
    return schedules
      .sort((a, b) => new Date(a.nextDue) - new Date(b.nextDue))
      .map(s => ({ mood: s.mood, tense: s.tense, person: s.person, nextDue: s.nextDue }))
  } catch (error) {
    console.error('Error obteniendo ítems SRS pendientes:', error)
    return []
  }
}

/**
 * Determina si un ítem necesita ser revisado según el SRS
 * @param {Object} schedule - Schedule del ítem
 * @param {Date} currentDate - Fecha actual
 * @returns {boolean} Si necesita revisión
 */
export function isItemDue(schedule, currentDate = new Date()) {
  if (!schedule || !schedule.nextDue) return true
  return new Date(schedule.nextDue) <= currentDate
}

/**
 * Calcula el mastery score para un ítem específico
 * @param {Object} attempt - Intento de práctica
 * @param {Object} verb - Verbo asociado
 * @returns {number} Mastery score (0-100)
 */
export function calculateItemMastery(attempt, verb) {
  // En una implementación completa, esto calcularía el mastery score
  // basado en el intento y las características del verbo
  
  // Por ahora, devolvemos un valor por defecto
  return 50
}

/**
 * Calcula el mastery score para una celda (modo-tiempo-persona)
 * @param {Array} attempts - Array de intentos
 * @param {Object} verbsMap - Mapa de verbos por ID
 * @returns {number} Mastery score (0-100)
 */
export function calculateCellMastery(attempts, verbsMap) {
  // En una implementación completa, esto calcularía el mastery score
  // para una celda basado en todos los intentos
  
  // Por ahora, devolvemos un valor por defecto
  return 50
}

/**
 * Calcula el mastery score para un tiempo o modo completo
 * @param {Array} cells - Array de celdas (cada una con sus mastery scores)
 * @param {Object} weights - Pesos para cada celda
 * @returns {number} Mastery score (0-100)
 */
export function calculateTimeOrMoodMastery(cells, weights) {
  // En una implementación completa, esto calcularía el mastery score
  // para un tiempo o modo completo basado en las celdas
  
  // Por ahora, devolvemos un valor por defecto
  return 50
}

/**
 * Actualiza el schedule con nueva información
 * @param {Object} schedule - Schedule actual
 * @param {Object} newItem - Nuevo ítem para programar
 * @returns {Object} Schedule actualizado
 */
export function updateScheduleWithNewItem(schedule, newItem) {
  // En una implementación completa, esto actualizaría el schedule
  // con información del nuevo ítem
  
  return {
    ...schedule,
    // En una implementación completa, aquí se añadiría la nueva información
  }
}

/**
 * Reinicia el schedule para una celda
 * @param {Object} schedule - Schedule a reiniciar
 * @returns {Object} Schedule reiniciado
 */
export function resetSchedule(schedule) {
  return {
    ...schedule,
    interval: 0,
    ease: 2.5,
    reps: 0,
    nextDue: new Date()
  }
}

/**
 * Acelera el schedule para un ítem fácil
 * @param {Object} schedule - Schedule actual
 * @returns {Object} Schedule acelerado
 */
export function accelerateSchedule(schedule) {
  // En una implementación completa, esto aceleraría el schedule
  // para ítems que el usuario domina fácilmente
  
  return {
    ...schedule,
    // En una implementación completa, aquí se aplicarían los cambios
  }
}

/**
 * Retrasa el schedule para un ítem difícil
 * @param {Object} schedule - Schedule actual
 * @returns {Object} Schedule retrasado
 */
export function delaySchedule(schedule) {
  // En una implementación completa, esto retrasaría el schedule
  // para ítems que el usuario encuentra difíciles
  
  return {
    ...schedule,
    // En una implementación completa, aquí se aplicarían los cambios
  }
}
