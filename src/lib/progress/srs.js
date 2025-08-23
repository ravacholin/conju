// Sistema SRS (Spaced Repetition System)

import { getScheduleByCell, saveSchedule } from './database.js'

// Intervalos base en días para el sistema SRS
const BASE_INTERVALS = [1, 3, 7, 14, 30, 90]

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
    interval = reps > 0 ? BASE_INTERVALS[Math.min(reps, BASE_INTERVALS.length - 1)] : 1
  } else {
    // Si acierta
    if (hintsUsed > 0) {
      // Si usó pistas, no subir de nivel
      // Mantener el mismo intervalo
    } else {
      // Si acierta sin pistas, subir de nivel
      reps += 1
      interval = BASE_INTERVALS[Math.min(reps - 1, BASE_INTERVALS.length - 1)]
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
  // En una implementación completa, esto buscaría en la base de datos
  // los ítems cuya fecha de revisión sea anterior o igual a currentDate
  return []
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