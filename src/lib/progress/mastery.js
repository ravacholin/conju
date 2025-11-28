// Funciones de cálculo de mastery para el sistema de progreso

import { getAttemptsByItem, getAttemptsByUser } from './database.js'
import { PROGRESS_CONFIG, VERB_DIFFICULTY, FREQUENCY_DIFFICULTY_BONUS } from './config.js'
import { calculateRecencyWeight } from './helpers.js'
// import { applyPenalties } from './penalties.js'
// import { getIrregularTenses, getVerbIrregularityStats } from '../utils/irregularityUtils.js'
import { getVerbIrregularityStats } from '../utils/irregularityUtils.js'
import { createLogger } from '../utils/logger.js'
import { getVerbMetadata } from './verbMetadataProvider.js'

const logger = createLogger('progress:mastery')


/**
 * Obtiene la dificultad base de un verbo
 * @param {Object} verb - Objeto verbo
 * @returns {number} Valor de dificultad (0.8 - 1.3)
 */
export function getVerbDifficulty(verb) {
  // Tolerancia a entradas inválidas
  const safeVerb = verb && typeof verb === 'object' ? verb : {}
  let difficulty = VERB_DIFFICULTY.REGULAR
  
  // Enhanced difficulty calculation using per-tense irregularity data
  if (safeVerb.irregularTenses && safeVerb.irregularityMatrix) {
    const stats = getVerbIrregularityStats(safeVerb)
    
    // Calculate difficulty based on irregularity percentage
    if (stats.irregularityPercentage > 50) {
      difficulty = VERB_DIFFICULTY.HIGHLY_IRREGULAR
    } else if (stats.irregularityPercentage > 25) {
      difficulty = VERB_DIFFICULTY.HIGHLY_IRREGULAR * 0.8 // Intermediate irregularity
    } else if (stats.irregularityPercentage > 0) {
      difficulty = VERB_DIFFICULTY.DIPHTHONG // Some irregularity
    } else {
      difficulty = VERB_DIFFICULTY.REGULAR
    }
  } 
  // Fallback to legacy classification
  else if (safeVerb.type === 'irregular') {
    difficulty = VERB_DIFFICULTY.HIGHLY_IRREGULAR
  } else if (safeVerb.type === 'diphtong') {
    difficulty = VERB_DIFFICULTY.DIPHTHONG
  } else if (safeVerb.type === 'orthographic_change') {
    difficulty = VERB_DIFFICULTY.ORTHOGRAPHIC_CHANGE
  }
  
  // Añadir bonus por frecuencia
  if (safeVerb.frequency) {
    difficulty += FREQUENCY_DIFFICULTY_BONUS[safeVerb.frequency] || 0
  }
  
  // Asegurar que esté en el rango válido
  return Math.max(0.8, Math.min(1.3, difficulty))
}

/**
 * Obtiene la dificultad específica de un verbo para un tiempo verbal
 * @param {Object} verb - Objeto verbo con datos de irregularidad por tiempo
 * @param {string} tense - Tiempo verbal específico
 * @returns {number} Valor de dificultad ajustado para el tiempo
 */
export function getVerbTenseDifficulty(verb, tense) {
  const baseDifficulty = getVerbDifficulty(verb)
  
  // If verb has per-tense data, adjust based on specific tense irregularity
  if (verb?.irregularityMatrix && typeof verb.irregularityMatrix[tense] === 'boolean') {
    const isIrregularInTense = verb.irregularityMatrix[tense]
    
    if (isIrregularInTense) {
      // Irregular in this tense: increase difficulty
      return Math.min(1.3, baseDifficulty + 0.2)
    } else {
      // Regular in this tense: slightly decrease difficulty
      return Math.max(0.8, baseDifficulty - 0.1)
    }
  }
  
  // Fallback to base difficulty
  return baseDifficulty
}

/**
 * Calcula el mastery score para un ítem específico
 * @param {string} itemId - ID del ítem
 * @param {Object} verb - Objeto verbo asociado
 * @returns {Promise<{score: number, n: number, weightedAttempts: number}>} Mastery score y estadísticas
 */
export function calculateMasteryFromAttempts(attempts, verb) {
  if (!attempts || attempts.length === 0) {
    return { score: 50, n: 0, weightedAttempts: 0 }
  }

  // Calcular la dificultad del verbo
  const difficulty = getVerbDifficulty(verb)

  // Acumuladores para el cálculo
  let weightedCorrectSum = 0
  let weightedTotalSum = 0
  let totalHintPenalty = 0
  let weightedAttempts = 0

  // Procesar cada intento
  for (const attempt of attempts) {
    // Calcular peso por recencia
    const weight = calculateRecencyWeight(new Date(attempt.createdAt))

    // Calcular valor ponderado
    const weightedValue = weight * difficulty

    // Sumar a los totales
    weightedTotalSum += weightedValue
    weightedCorrectSum += weightedValue * (attempt.correct ? 1 : 0)
    weightedAttempts += weight

    // Acumular penalización por pistas (solo para intentos correctos)
    if (attempt.correct) {
      // Calcular penalización por pistas
      const hintPenalty = Math.min(
        PROGRESS_CONFIG.MAX_HINT_PENALTY,
        (attempt.hintsUsed || 0) * PROGRESS_CONFIG.HINT_PENALTY
      )
      totalHintPenalty += hintPenalty
    }
  }

  // Calcular mastery score base (0-100)
  let baseScore = 100
  if (weightedTotalSum > 0) {
    baseScore = 100 * (weightedCorrectSum / weightedTotalSum)
  }

  // Aplicar penalización por pistas
  const finalScore = Math.max(0, baseScore - totalHintPenalty)

  // Redondear a 2 decimales
  const roundedScore = Math.round(finalScore * 100) / 100

  return {
    score: roundedScore,
    n: attempts.length,
    weightedAttempts: Math.round(weightedAttempts * 100) / 100
  }
}

export async function calculateMasteryForItem(itemId, verb) {
  const attempts = await getAttemptsByItem(itemId) || []
  return calculateMasteryFromAttempts(attempts, verb)
}

/**
 * Calcula el mastery score para una celda (modo-tiempo-persona)
 * @param {Array} items - Array de ítems en la celda
 * @param {Object} verbsMap - Mapa de verbos por ID
 * @returns {Promise<{score: number, n: number, weightedN: number}>} Mastery score agregado
 */
export async function calculateMasteryForCell(items, verbsMap) {
  if (items.length === 0) {
    return { score: 50, n: 0, weightedN: 0 }
  }
  
  // Acumuladores para el cálculo agregado
  let totalScore = 0
  let totalAttempts = 0
  let totalWeightedAttempts = 0
  
  // Calcular mastery para cada ítem en la celda
  for (const item of items) {
    const verb = verbsMap[item.verbId]
    if (!verb) continue
    
    const mastery = await calculateMasteryForItem(item.id, verb)
    
    totalScore += mastery.score * mastery.weightedAttempts
    totalAttempts += mastery.n
    totalWeightedAttempts += mastery.weightedAttempts
  }
  
  // Calcular mastery score promedio ponderado
  let cellScore = 50 // Valor por defecto si no hay datos
  if (totalWeightedAttempts > 0) {
    cellScore = totalScore / totalWeightedAttempts
  }
  
  // Redondear a 2 decimales
  const roundedScore = Math.round(cellScore * 100) / 100
  
  return {
    score: roundedScore,
    n: totalAttempts,
    weightedN: Math.round(totalWeightedAttempts * 100) / 100
  }
}

/**
 * Calcula el mastery score para un tiempo o modo completo
 * @param {Array} cells - Array de celdas (cada una con sus ítems y mastery)
 * @param {Object} weights - Pesos para cada celda
 * @returns {number} Mastery score agregado
 */
export function calculateMasteryForTimeOrMood(cells, weights) {
  if (cells.length === 0) {
    return 50
  }
  
  // Acumuladores para el cálculo agregado
  let weightedScoreSum = 0
  let totalWeight = 0
  
  // Calcular mastery ponderado
  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i]
    const weight = weights[i] || 1
    
    weightedScoreSum += cell.score * weight
    totalWeight += weight
  }
  
  // Calcular mastery score promedio ponderado
  let aggregateScore = 50 // Valor por defecto si no hay datos
  if (totalWeight > 0) {
    aggregateScore = weightedScoreSum / totalWeight
  }
  
  // Redondear a 2 decimales
  return Math.round(aggregateScore * 100) / 100
}

function normalizeVerbFromAttempt(attempt) {
  const lemma = attempt?.lemma || attempt?.verb || attempt?.verbId || 'unknown_verb'
  const metadata = getVerbMetadata(lemma)
  if (metadata) {
    return metadata
  }
  return {
    lemma,
    type: attempt?.verbType || 'regular',
    frequency: attempt?.frequency || 'medium'
  }
}

export async function getMasterySnapshotForUser(userId, options = {}) {
  const attempts = options.attempts || await getAttemptsByUser(userId) || []

  if (!attempts || attempts.length === 0) {
    return []
  }

  const cells = new Map()

  for (const attempt of attempts) {
    const mood = attempt?.mood
    const tense = attempt?.tense
    const person = attempt?.person || ''
    if (!mood || !tense) continue

    const key = `${mood}|${tense}|${person}`
    if (!cells.has(key)) {
      cells.set(key, {
        mood,
        tense,
        person,
        items: new Map(),
        lastAttempt: 0
      })
    }

    const cell = cells.get(key)
    const itemId = attempt.itemId || `${attempt.verbId || attempt.lemma || 'item'}-${mood}-${tense}-${person}`
    const verbId = attempt.verbId || attempt.lemma || itemId
    if (!cell.items.has(itemId)) {
      cell.items.set(itemId, { verb: normalizeVerbFromAttempt({ ...attempt, verbId }), attempts: [] })
    }

    const normalizedAttempt = {
      ...attempt,
      createdAt: attempt.createdAt || attempt.timestamp || new Date().toISOString()
    }
    cell.items.get(itemId).attempts.push(normalizedAttempt)
    const ts = new Date(normalizedAttempt.createdAt).getTime()
    if (Number.isFinite(ts) && ts > cell.lastAttempt) {
      cell.lastAttempt = ts
    }
  }

  const masteryRecords = []

  for (const cell of cells.values()) {
    let totalScore = 0
    let totalAttempts = 0
    let totalWeightedAttempts = 0

    for (const { attempts: itemAttempts, verb } of cell.items.values()) {
      const mastery = calculateMasteryFromAttempts(itemAttempts, verb)
      totalScore += mastery.score * mastery.weightedAttempts
      totalAttempts += mastery.n
      totalWeightedAttempts += mastery.weightedAttempts
    }

    const score = totalWeightedAttempts > 0
      ? totalScore / totalWeightedAttempts
      : 50

    masteryRecords.push({
      id: `${userId}|${cell.mood}|${cell.tense}|${cell.person}`,
      userId,
      mood: cell.mood,
      tense: cell.tense,
      person: cell.person || null,
      score: Math.round(score * 100) / 100,
      n: totalAttempts,
      weightedAttempts: Math.round(totalWeightedAttempts * 100) / 100,
      updatedAt: cell.lastAttempt ? new Date(cell.lastAttempt).toISOString() : new Date().toISOString(),
      lastAttempt: cell.lastAttempt || null,
      count: totalAttempts
    })
  }

  return masteryRecords
}

/**
 * Determina el nivel de confianza basado en el número efectivo de intentos
 * @param {number} weightedN - Número efectivo de intentos
 * @returns {Object} Nivel de confianza y si es suficiente
 */
export function getConfidenceLevel(weightedN) {
  const sufficient = weightedN >= PROGRESS_CONFIG.MIN_CONFIDENCE_N
  let level = 'bajo'
  
  if (weightedN >= PROGRESS_CONFIG.CONFIDENCE_LEVELS.HIGH) {
    level = 'alto'
  } else if (weightedN >= PROGRESS_CONFIG.CONFIDENCE_LEVELS.MEDIUM) {
    level = 'medio'
  }
  
  return {
    level,
    sufficient,
    message: sufficient ? 
      'Datos suficientes para una evaluación confiable' : 
      'Datos insuficientes - se necesitan más intentos para una evaluación confiable'
  }
}

/**
 * Clasifica el nivel de mastery
 * @param {number} score - Mastery score
 * @param {number} weightedN - Número efectivo de intentos
 * @param {number} avgLatency - Latencia promedio en ms
 * @returns {Object} Clasificación y recomendaciones
 */
export function classifyMasteryLevel(score, weightedN, avgLatency) {
  const confidence = getConfidenceLevel(weightedN)
  
  // Si no hay suficientes datos, no clasificar
  if (!confidence.sufficient) {
    return {
      level: 'insuficiente',
      confidence,
      recommendation: 'Practica más para obtener una evaluación precisa'
    }
  }
  
  let level = 'crítico'
  let recommendation = ''
  
  if (score >= PROGRESS_CONFIG.MASTERY_LEVELS.ACHIEVED) {
    level = 'logrado'
    recommendation = 'Dominio consolidado. Revisar ocasionalmente para mantener el nivel.'
  } else if (score >= PROGRESS_CONFIG.MASTERY_LEVELS.ATTENTION) {
    level = 'atención'
    recommendation = 'Practicar regularmente para consolidar el conocimiento.'
  }
  
  // Considerar latencia si está disponible
  if (avgLatency && avgLatency > 6000) { // 6 segundos
    recommendation += ' Trabajar en la velocidad de respuesta.'
  }
  
  return {
    level,
    confidence,
    recommendation
  }
}

/**
 * Obtiene el mastery score para una combinación específica mood/tense
 * @param {string} userId - ID del usuario
 * @param {Object} params - Parámetros de la consulta
 * @param {string} params.mood - Modo gramatical
 * @param {string} params.tense - Tiempo gramatical
 * @param {string} params.verbId - ID del verbo (opcional)
 * @returns {Promise<number>} Mastery score (0-100)
 */
export async function getMasteryScore(userId, { mood, tense, verbId }) {
  try {
    // Si tenemos un verbId específico, calcular para ese ítem
    if (verbId) {
      const itemId = `${verbId}-${mood}-${tense}`
      const verb = { id: verbId } // Objeto verbo simplificado
      const result = await calculateMasteryForItem(itemId, verb)
      return result.score
    }
    
    // Si no tenemos verbId, devolver un valor por defecto o promedio
    // En una implementación completa, esto consultaría todos los verbos
    // para esta combinación mood/tense
    return 50 // Valor neutral por defecto
  } catch (error) {
    logger.error('Error al obtener mastery score:', error)
    return null
  }
}
