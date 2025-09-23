// Sistema SRS (Spaced Repetition System) para el sistema de progreso

import { PROGRESS_CONFIG } from './config.js'
import { ERROR_TAGS } from './dataModels.js'
import { saveSchedule, getScheduleByCell, getDueSchedules } from './database.js'

// Helpers
const clamp = (n, min, max) => Math.min(max, Math.max(min, n))
const randomInRange = (min, max) => min + Math.random() * (max - min)

/**
 * Calcula el próximo intervalo basado en el desempeño
 * @param {Object} schedule - Schedule actual
 * @param {boolean} correct - Si la respuesta fue correcta
 * @param {number} hintsUsed - Número de pistas usadas
 * @returns {Object} Nuevo intervalo y fecha
 */
export function calculateNextInterval(schedule, correct, hintsUsed, meta = {}) {
  // Campos existentes + defaults razonables
  let {
    interval = 0,   // días
    ease = PROGRESS_CONFIG.SRS_ADVANCED?.EASE_START ?? 2.5,
    reps = 0,
    lapses = 0,
    leech = false
  } = schedule || {}

  const ADV = PROGRESS_CONFIG.SRS_ADVANCED || {}
  const intervals = PROGRESS_CONFIG.SRS_INTERVALS || [1, 3, 7, 14, 30, 90]

  // Derivar calificación (Q: 0-5) a partir del resultado y metadatos
  // Q=5: correcto sin pista y en tiempo normal; Q=4: correcto con pista o lento; Q=3: fallo leve (p.ej. acento)
  // Q<=2: fallo normal
  let q
  if (correct) {
    q = 5
    if (hintsUsed > 0) q -= ADV.HINT_Q_PENALTY || 1
    const slowMs = ADV.SPEED?.SLOW_MS ?? 6000
    if (typeof meta.latencyMs === 'number' && meta.latencyMs > slowMs) {
      q = Math.max(3, q - 1)
    }
  } else {
    // Detectar error leve: solo acentuación
    const onlyAccent = Array.isArray(meta.errorTags) && meta.errorTags.length > 0 &&
      meta.errorTags.every(t => t === ERROR_TAGS.ACCENT)
    q = onlyAccent ? 3 : 2
  }

  // SM-2 inspired adjustment of ease
  const deltaE = 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)
  ease = clamp(
    (ease ?? ADV.EASE_START ?? 2.5) + deltaE,
    ADV.EASE_MIN ?? 1.3,
    ADV.EASE_MAX ?? 3.2
  )

  // Calcular siguiente intervalo y reps
  if (q < 3) {
    // Lapse: reforzar pronto
    lapses = (lapses || 0) + 1
    reps = 0 // reiniciar aprendizaje
    const rl = ADV.RELEARN_STEPS || [0.25, 1]
    interval = rl[0] // 6 horas por defecto
    // Leech handling (no suspendemos, pero avisamos con intervalos cortos y ease penalizado)
    if (lapses >= (ADV.LEECH_THRESHOLD || 8)) {
      leech = true
      ease = Math.max(ADV.EASE_MIN ?? 1.3, ease - (ADV.LEECH_EASE_PENALTY || 0.4))
    }
  } else {
    // Correcto (Q>=3)
    if (hintsUsed > 0) {
      // Correcto con pistas: progresar sin subir reps (mid-point hacia el siguiente intervalo)
      const currentIdx = Math.max(0, Math.min(reps - 1, intervals.length - 1))
      const currentInterval = reps > 0 ? intervals[currentIdx] : (ADV.FIRST_STEPS?.[0] || 1)
      const nextIdx = Math.min(Math.max(reps, 0), intervals.length - 1)
      const nextInterval = intervals[nextIdx]
      interval = Math.max(ADV.FIRST_STEPS?.[0] || 1, Math.round((currentInterval + nextInterval) / 2))
    } else {
      // Correcto sin pistas: subir nivel
      if (reps === 0) {
        interval = (ADV.FIRST_STEPS?.[0] || 1)
        reps = 1
      } else if (reps === 1) {
        interval = (ADV.FIRST_STEPS?.[1] || 3)
        reps = 2
      } else {
        // Crecimiento multiplicativo por ease (estilo SM-2)
        interval = Math.max(1, Math.round((interval || intervals[reps - 1] || 1) * ease))
        reps += 1
      }
      // Afinar por calidad
      if (q === 3) interval = Math.max(1, Math.round(interval * 0.8))
      if (q === 5) interval = Math.max(1, Math.round(interval * 1.1))
    }
  }

  // Añadir fuzz para evitar concentraciones
  // Para respuestas con pistas, mantener el punto medio exacto (sin fuzz) para estabilidad
  let randomized = interval
  if (!(hintsUsed > 0)) {
    const fuzz = (ADV.FUZZ_RATIO ?? 0.1) * interval
    const randomizedRaw = randomInRange(Math.max(0, interval - fuzz), interval + fuzz)
    randomized = interval >= 1 ? Math.max(1, randomizedRaw) : randomizedRaw
  }

  // Calcular próxima fecha de revisión
  const now = new Date()
  const nextDue = new Date(now.getTime() + randomized * 24 * 60 * 60 * 1000)

  return { interval: randomized, ease, reps, lapses, leech, nextDue, lastAnswerCorrect: !!correct, lastLatencyMs: meta.latencyMs }
}

/**
 * Actualiza el schedule para una celda específica
 * @param {string} userId - ID del usuario
 * @param {Object} cell - Celda (modo, tiempo, persona)
 * @param {boolean} correct - Si la respuesta fue correcta
 * @param {number} hintsUsed - Número de pistas usadas
 * @returns {Promise<void>}
 */
export async function updateSchedule(userId, cell, correct, hintsUsed, meta = {}) {
  // Buscar schedule existente para esta celda
  let schedule = await getScheduleByCell(userId, cell.mood, cell.tense, cell.person)
  
  // Si no existe, crear uno nuevo
  if (!schedule) {
    schedule = {
      id: `${userId}|${cell.mood}|${cell.tense}|${cell.person}`,
      userId,
      mood: cell.mood,
      tense: cell.tense,
      person: cell.person,
      interval: 0,
      ease: PROGRESS_CONFIG.SRS_ADVANCED?.EASE_START ?? 2.5,
      reps: 0,
      lapses: 0,
      leech: false,
      nextDue: new Date(),
      createdAt: new Date()
    }
  }
  
  // Calcular nuevo intervalo
  const updatedSchedule = {
    ...schedule,
    ...calculateNextInterval(schedule, correct, hintsUsed, meta),
    updatedAt: new Date()
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
 * Extrae lemmas únicos de los horarios SRS para preloading de chunks
 * @param {string} userId - ID del usuario
 * @param {Date} currentDate - Fecha actual
 * @param {number} hoursAhead - Horas hacia adelante para incluir items próximos
 * @returns {Promise<Array<string>>} Lista de lemmas únicos
 */
export async function extractDueLemmas(userId, currentDate = new Date(), hoursAhead = 24) {
  try {
    const extendedDate = new Date(currentDate.getTime() + hoursAhead * 60 * 60 * 1000)
    const schedules = await getDueSchedules(userId, extendedDate)

    // Extraer lemmas únicos de los schedules
    const lemmas = new Set()
    schedules.forEach(schedule => {
      if (schedule.lemma) {
        lemmas.add(schedule.lemma)
      }
    })

    const uniqueLemmas = Array.from(lemmas)
    console.log(`📊 SRS: Found ${uniqueLemmas.length} unique due lemmas in next ${hoursAhead}h`)
    return uniqueLemmas
  } catch (error) {
    console.error('Error extracting due lemmas from SRS:', error)
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
export function calculateItemMastery() {
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
export function calculateCellMastery() {
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
export function calculateTimeOrMoodMastery() {
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
export function updateScheduleWithNewItem(schedule) {
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
