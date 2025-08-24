// Funciones de penalización para el sistema de progreso

import { PROGRESS_CONFIG } from './config.js'

/**
 * Calcula la penalización por pistas usadas
 * @param {number} hintsUsed - Número de pistas usadas
 * @returns {number} Penalización en puntos
 */
export function calculateHintPenalty(hintsUsed) {
  if (typeof hintsUsed !== 'number' || hintsUsed < 0) return 0
  
  // Calcular penalización: puntos por pista, con máximo
  const penalty = hintsUsed * PROGRESS_CONFIG.HINT_PENALTY
  return Math.min(PROGRESS_CONFIG.MAX_HINT_PENALTY, penalty)
}

/**
 * Calcula la penalización por errores de tiempo
 * @param {number} latencyMs - Latencia en milisegundos
 * @param {number} thresholdMs - Umbral de latencia en milisegundos
 * @returns {number} Penalización en puntos
 */
export function calculateLatencyPenalty(latencyMs, thresholdMs = 6000) {
  if (typeof latencyMs !== 'number' || latencyMs <= thresholdMs) return 0
  
  // Calcular penalización proporcional al exceso de tiempo
  const excess = latencyMs - thresholdMs
  const penalty = Math.min(10, Math.floor(excess / 1000)) // Máximo 10 puntos
  return penalty
}

/**
 * Calcula la penalización por errores repetidos
 * @param {number} consecutiveErrors - Número de errores consecutivos
 * @returns {number} Penalización en puntos
 */
export function calculateConsecutiveErrorPenalty(consecutiveErrors) {
  if (typeof consecutiveErrors !== 'number' || consecutiveErrors <= 1) return 0
  
  // Penalización creciente por errores consecutivos
  const penalty = Math.min(5, consecutiveErrors - 1) // Máximo 5 puntos
  return penalty
}

/**
 * Calcula la penalización total para un intento
 * @param {Object} attempt - Intento con detalles
 * @returns {number} Penalización total en puntos
 */
export function calculateTotalPenalty(attempt) {
  const hintPenalty = calculateHintPenalty(attempt.hintsUsed || 0)
  const latencyPenalty = calculateLatencyPenalty(attempt.latencyMs || 0)
  const errorPenalty = calculateConsecutiveErrorPenalty(attempt.consecutiveErrors || 0)
  
  // Penalización total con máximo
  const totalPenalty = hintPenalty + latencyPenalty + errorPenalty
  return Math.min(20, totalPenalty) // Máximo 20 puntos de penalización
}

/**
 * Aplica penalizaciones al mastery score
 * @param {number} baseScore - Mastery score base
 * @param {Object} attempt - Intento con detalles
 * @returns {number} Mastery score con penalizaciones aplicadas
 */
export function applyPenalties(baseScore, attempt) {
  const totalPenalty = calculateTotalPenalty(attempt)
  const finalScore = Math.max(0, baseScore - totalPenalty)
  
  // Redondear a 2 decimales
  return Math.round(finalScore * 100) / 100
}