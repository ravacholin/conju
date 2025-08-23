// Sistema de cálculo de mastery score

import { getAttemptsByItem } from './database.js'
import { VERB_DIFFICULTY, FREQUENCY_DIFFICULTY_BONUS } from './dataModels.js'

// Constante de decaimiento para el cálculo de recencia (en días)
const DECAY_TAU = 10 // Valor recomendado en la propuesta

// Penalización por pistas usadas
const HINT_PENALTY = 5 // puntos por pista
const MAX_HINT_PENALTY = 15 // penalización máxima por intento

/**
 * Calcula el peso de un intento basado en su recencia
 * @param {Date} attemptDate - Fecha del intento
 * @returns {number} Peso (entre 0 y 1)
 */
export function calculateRecencyWeight(attemptDate) {
  const now = new Date()
  const diffTime = Math.abs(now - attemptDate)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  // Fórmula de decaimiento exponencial: w = e^(-Δdías/τ)
  const weight = Math.exp(-diffDays / DECAY_TAU)
  
  // Redondear a 2 decimales para evitar micro-ruido
  return Math.round(weight * 100) / 100
}

/**
 * Obtiene la dificultad base de un verbo
 * @param {Object} verb - Objeto verbo
 * @returns {number} Valor de dificultad (0.8 - 1.3)
 */
export function getVerbDifficulty(verb) {
  let difficulty = VERB_DIFFICULTY.REGULAR
  
  // Asignar dificultad base según tipo
  if (verb.type === 'irregular') {
    // Para verbos irregulares, determinar nivel de irregularidad
    // En una implementación completa, esto se basaría en las familias irregulares
    // Por ahora, asignamos una dificultad genérica alta
    difficulty = VERB_DIFFICULTY.HIGHLY_IRREGULAR
  }
  
  // Añadir bonus por frecuencia
  if (verb.frequency) {
    difficulty += FREQUENCY_DIFFICULTY_BONUS[verb.frequency] || 0
  }
  
  // Asegurar que esté en el rango válido
  return Math.max(0.8, Math.min(1.3, difficulty))
}

/**
 * Calcula la penalización por pistas
 * @param {number} hintsUsed - Número de pistas usadas
 * @returns {number} Penalización en puntos
 */
export function calculateHintPenalty(hintsUsed) {
  return Math.min(MAX_HINT_PENALTY, hintsUsed * HINT_PENALTY)
}

/**
 * Calcula el mastery score para una celda específica
 * @param {string} itemId - ID del ítem
 * @param {Object} verb - Objeto verbo asociado
 * @returns {Promise<{score: number, n: number, weightedAttempts: number}>} Mastery score y estadísticas
 */
export async function calculateMasteryForItem(itemId, verb) {
  // Obtener todos los intentos para este ítem
  const attempts = await getAttemptsByItem(itemId)
  
  if (attempts.length === 0) {
    // Si no hay intentos, devolver mastery score neutral
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
      totalHintPenalty += calculateHintPenalty(attempt.hintsUsed)
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

/**
 * Determina el nivel de confianza basado en el número efectivo de intentos
 * @param {number} weightedN - Número efectivo de intentos
 * @returns {Object} Nivel de confianza y si es suficiente
 */
export function getConfidenceLevel(weightedN) {
  const sufficient = weightedN >= 8
  let level = 'bajo'
  
  if (weightedN >= 20) {
    level = 'alto'
  } else if (weightedN >= 8) {
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
  
  if (score >= 80) {
    level = 'logrado'
    recommendation = 'Dominio consolidado. Revisar ocasionalmente para mantener el nivel.'
  } else if (score >= 60) {
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