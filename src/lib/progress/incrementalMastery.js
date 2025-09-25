// Sistema de cálculo incremental de mastery para evitar O(N²) recomputación
// Mantiene cache de mastery scores y actualiza incrementalmente con nuevos intentos

import { getAttemptsByItem } from './database.js'
import { getVerbDifficulty } from './mastery.js'
import { calculateRecencyWeight } from './helpers.js'
import { PROGRESS_CONFIG } from './config.js'

/**
 * Cache de mastery scores para evitar recálculos O(N²)
 */
class IncrementalMasteryCache {
  constructor() {
    this.itemMasteryCache = new Map() // itemId -> { score, n, weightedAttempts, weightedCorrectSum, weightedTotalSum, hintPenalty, lastUpdated }
    this.cellMasteryCache = new Map() // cellKey -> { score, n, weightedN, items, lastUpdated }
    this.attemptCounts = new Map()    // itemId -> número de intentos conocidos
    this.cacheHits = 0
    this.cacheMisses = 0
    this.incrementalUpdates = 0
  }

  /**
   * Generar clave única para una celda
   */
  getCellKey(mood, tense, person) {
    return `${mood}-${tense}-${person}`
  }

  /**
   * Calcular mastery para un ítem con cache incremental
   * @param {string} itemId - ID del ítem
   * @param {Object} verb - Objeto verbo asociado
   * @param {boolean} forceRefresh - Forzar recálculo ignorando cache
   * @returns {Promise<{score: number, n: number, weightedAttempts: number}>}
   */
  async calculateMasteryForItemIncremental(itemId, verb, forceRefresh = false) {
    // Verificar cache si no se fuerza refresh
    if (!forceRefresh && this.itemMasteryCache.has(itemId)) {
      const cached = this.itemMasteryCache.get(itemId)

      // Verificar si necesita actualización incremental
      const currentAttempts = await this.getAttemptCount(itemId)
      const cachedAttempts = this.attemptCounts.get(itemId) || 0

      if (currentAttempts === cachedAttempts) {
        // Cache válido, devolver resultado
        this.cacheHits++
        return {
          score: cached.score,
          n: cached.n,
          weightedAttempts: cached.weightedAttempts
        }
      } else if (currentAttempts > cachedAttempts) {
        // Actualizar incrementalmente
        return await this.updateMasteryIncremental(itemId, verb, cached, cachedAttempts, currentAttempts)
      }
    }

    // Cache miss o refresh forzado - calcular desde cero
    this.cacheMisses++
    const fullResult = await this.calculateMasteryWithDetails(itemId, verb)

    // Actualizar cache con detalles completos
    this.itemMasteryCache.set(itemId, {
      score: fullResult.score,
      n: fullResult.n,
      weightedAttempts: fullResult.weightedAttempts,
      weightedCorrectSum: fullResult.weightedCorrectSum,
      weightedTotalSum: fullResult.weightedTotalSum,
      hintPenalty: fullResult.hintPenalty,
      lastUpdated: Date.now()
    })

    const attemptCount = await this.getAttemptCount(itemId)
    this.attemptCounts.set(itemId, attemptCount)

    return {
      score: fullResult.score,
      n: fullResult.n,
      weightedAttempts: fullResult.weightedAttempts
    }
  }

  /**
   * Calcular mastery con detalles internos para caching
   * @param {string} itemId - ID del ítem
   * @param {Object} verb - Objeto verbo asociado
   * @returns {Promise<{score: number, n: number, weightedAttempts: number, weightedCorrectSum: number, weightedTotalSum: number, hintPenalty: number}>}
   */
  async calculateMasteryWithDetails(itemId, verb) {
    const attempts = await getAttemptsByItem(itemId) || []

    if (attempts.length === 0) {
      return {
        score: 50,
        n: 0,
        weightedAttempts: 0,
        weightedCorrectSum: 0,
        weightedTotalSum: 0,
        hintPenalty: 0
      }
    }

    const difficulty = getVerbDifficulty(verb)
    let weightedCorrectSum = 0
    let weightedTotalSum = 0
    let totalHintPenalty = 0
    let weightedAttempts = 0

    for (const attempt of attempts) {
      const weight = calculateRecencyWeight(new Date(attempt.createdAt))
      const weightedValue = weight * difficulty

      weightedTotalSum += weightedValue
      weightedCorrectSum += weightedValue * (attempt.correct ? 1 : 0)
      weightedAttempts += weight

      if (attempt.correct) {
        const hintPenalty = Math.min(
          PROGRESS_CONFIG.MAX_HINT_PENALTY,
          (attempt.hintsUsed || 0) * PROGRESS_CONFIG.HINT_PENALTY
        )
        totalHintPenalty += hintPenalty
      }
    }

    let baseScore = 100
    if (weightedTotalSum > 0) {
      baseScore = 100 * (weightedCorrectSum / weightedTotalSum)
    }

    const finalScore = Math.max(0, baseScore - totalHintPenalty)
    const roundedScore = Math.round(finalScore * 100) / 100

    return {
      score: roundedScore,
      n: attempts.length,
      weightedAttempts: Math.round(weightedAttempts * 100) / 100,
      weightedCorrectSum: Math.round(weightedCorrectSum * 100) / 100,
      weightedTotalSum: Math.round(weightedTotalSum * 100) / 100,
      hintPenalty: Math.round(totalHintPenalty * 100) / 100
    }
  }

  /**
   * Actualizar mastery incrementalmente cuando hay nuevos intentos
   * @param {string} itemId - ID del ítem
   * @param {Object} verb - Objeto verbo
   * @param {Object} cachedResult - Resultado previo del cache
   * @param {number} oldAttemptCount - Número de intentos previos
   * @param {number} newAttemptCount - Número de intentos actual
   * @returns {Promise<{score: number, n: number, weightedAttempts: number}>}
   */
  async updateMasteryIncremental(itemId, verb, cachedResult, oldAttemptCount, newAttemptCount) {
    try {
      // Obtener solo los nuevos intentos (más eficiente que cargar todos)
      const allAttempts = await getAttemptsByItem(itemId) || []
      const newAttempts = allAttempts.slice(oldAttemptCount) // Solo los nuevos

      if (newAttempts.length === 0) {
        // No hay nuevos intentos realmente, mantener cache
        return {
          score: cachedResult.score,
          n: cachedResult.n,
          weightedAttempts: cachedResult.weightedAttempts
        }
      }

      // Usar totales previos guardados en cache (NO reconstruir desde score)
      let oldWeightedCorrectSum = cachedResult.weightedCorrectSum || 0
      let oldWeightedTotalSum = cachedResult.weightedTotalSum || 0
      let oldTotalHintPenalty = cachedResult.hintPenalty || 0

      // Procesar solo nuevos intentos
      const difficulty = getVerbDifficulty(verb)
      let newWeightedCorrectSum = 0
      let newWeightedTotalSum = 0
      let newTotalHintPenalty = 0
      let newWeightedAttempts = 0

      for (const attempt of newAttempts) {
        const weight = calculateRecencyWeight(new Date(attempt.createdAt))
        const weightedValue = weight * difficulty

        newWeightedTotalSum += weightedValue
        newWeightedCorrectSum += weightedValue * (attempt.correct ? 1 : 0)
        newWeightedAttempts += weight

        if (attempt.correct) {
          const hintPenalty = Math.min(
            PROGRESS_CONFIG.MAX_HINT_PENALTY,
            (attempt.hintsUsed || 0) * PROGRESS_CONFIG.HINT_PENALTY
          )
          newTotalHintPenalty += hintPenalty
        }
      }

      // Combinar totales previos con nuevos
      const totalWeightedCorrectSum = oldWeightedCorrectSum + newWeightedCorrectSum
      const totalWeightedTotalSum = oldWeightedTotalSum + newWeightedTotalSum
      const totalWeightedAttempts = cachedResult.weightedAttempts + newWeightedAttempts
      const totalHintPenalty = oldTotalHintPenalty + newTotalHintPenalty

      // Calcular nuevo mastery score
      let baseScore = 100
      if (totalWeightedTotalSum > 0) {
        baseScore = 100 * (totalWeightedCorrectSum / totalWeightedTotalSum)
      }

      const finalScore = Math.max(0, baseScore - totalHintPenalty)
      const roundedScore = Math.round(finalScore * 100) / 100

      const updatedResult = {
        score: roundedScore,
        n: newAttemptCount,
        weightedAttempts: Math.round(totalWeightedAttempts * 100) / 100
      }

      // Actualizar cache con los nuevos totales
      this.itemMasteryCache.set(itemId, {
        score: roundedScore,
        n: newAttemptCount,
        weightedAttempts: updatedResult.weightedAttempts,
        weightedCorrectSum: Math.round(totalWeightedCorrectSum * 100) / 100,
        weightedTotalSum: Math.round(totalWeightedTotalSum * 100) / 100,
        hintPenalty: Math.round(totalHintPenalty * 100) / 100,
        lastUpdated: Date.now()
      })

      this.attemptCounts.set(itemId, newAttemptCount)
      this.incrementalUpdates++

      return updatedResult

    } catch (error) {
      console.warn(`Error en actualización incremental para ${itemId}:`, error)
      // Fallback a cálculo completo
      const fullResult = await this.calculateMasteryWithDetails(itemId, verb)
      return {
        score: fullResult.score,
        n: fullResult.n,
        weightedAttempts: fullResult.weightedAttempts
      }
    }
  }

  /**
   * Obtener número de intentos para un ítem (más eficiente que cargar todos)
   * @param {string} itemId - ID del ítem
   * @returns {Promise<number>} Número de intentos
   */
  async getAttemptCount(itemId) {
    try {
      const attempts = await getAttemptsByItem(itemId) || []
      return attempts.length
    } catch (error) {
      console.warn(`Error obteniendo recuento de intentos para ${itemId}:`, error)
      return 0
    }
  }

  /**
   * Calcular mastery para una celda con cache inteligente
   * @param {Array} items - Array de ítems en la celda
   * @param {Object} verbsMap - Mapa de verbos por ID
   * @param {string} mood - Modo gramatical
   * @param {string} tense - Tiempo gramatical
   * @param {string} person - Persona gramatical
   * @returns {Promise<{score: number, n: number, weightedN: number}>}
   */
  async calculateMasteryForCellIncremental(items, verbsMap, mood, tense, person) {
    if (items.length === 0) {
      return { score: 50, n: 0, weightedN: 0 }
    }

    const cellKey = this.getCellKey(mood, tense, person)

    // Verificar cache de celda
    if (this.cellMasteryCache.has(cellKey)) {
      const cached = this.cellMasteryCache.get(cellKey)

      // Verificar si los ítems han cambiado
      const currentItemIds = items.map(item => item.id).sort()
      const cachedItemIds = cached.items || []

      if (JSON.stringify(currentItemIds) === JSON.stringify(cachedItemIds)) {
        // Verificar si algún ítem individual necesita actualización
        let needsUpdate = false
        for (const item of items) {
          const currentAttempts = await this.getAttemptCount(item.id)
          const cachedAttempts = this.attemptCounts.get(item.id) || 0
          if (currentAttempts !== cachedAttempts) {
            needsUpdate = true
            break
          }
        }

        if (!needsUpdate) {
          this.cacheHits++
          return {
            score: cached.score,
            n: cached.n,
            weightedN: cached.weightedN
          }
        }
      }
    }

    // Recalcular usando mastery incremental para cada ítem
    let totalScore = 0
    let totalAttempts = 0
    let totalWeightedAttempts = 0

    for (const item of items) {
      const verb = verbsMap[item.verbId]
      if (!verb) continue

      const mastery = await this.calculateMasteryForItemIncremental(item.id, verb)

      totalScore += mastery.score * mastery.weightedAttempts
      totalAttempts += mastery.n
      totalWeightedAttempts += mastery.weightedAttempts
    }

    // Calcular mastery score promedio ponderado
    let cellScore = 50
    if (totalWeightedAttempts > 0) {
      cellScore = totalScore / totalWeightedAttempts
    }

    const roundedScore = Math.round(cellScore * 100) / 100
    const result = {
      score: roundedScore,
      n: totalAttempts,
      weightedN: Math.round(totalWeightedAttempts * 100) / 100
    }

    // Actualizar cache de celda
    this.cellMasteryCache.set(cellKey, {
      ...result,
      items: items.map(item => item.id).sort(),
      lastUpdated: Date.now()
    })

    this.cacheMisses++
    return result
  }

  /**
   * Invalidar cache para un ítem específico (cuando se añade un nuevo intento)
   * @param {string} itemId - ID del ítem
   */
  invalidateItemCache(itemId) {
    this.itemMasteryCache.delete(itemId)
    this.attemptCounts.delete(itemId)

    // Invalidar caches de celdas que contengan este ítem
    for (const [cellKey, cellData] of this.cellMasteryCache.entries()) {
      if (cellData.items && cellData.items.includes(itemId)) {
        this.cellMasteryCache.delete(cellKey)
      }
    }
  }

  /**
   * Invalidar todo el cache
   */
  invalidateAll() {
    this.itemMasteryCache.clear()
    this.cellMasteryCache.clear()
    this.attemptCounts.clear()
    this.cacheHits = 0
    this.cacheMisses = 0
    this.incrementalUpdates = 0
  }

  /**
   * Obtener estadísticas del cache
   */
  getCacheStats() {
    const hitRate = this.cacheHits + this.cacheMisses > 0
      ? (this.cacheHits / (this.cacheHits + this.cacheMisses) * 100).toFixed(1)
      : 0

    return {
      itemCacheSize: this.itemMasteryCache.size,
      cellCacheSize: this.cellMasteryCache.size,
      cacheHits: this.cacheHits,
      cacheMisses: this.cacheMisses,
      hitRate: `${hitRate}%`,
      incrementalUpdates: this.incrementalUpdates,
      memoryUsage: {
        items: this.itemMasteryCache.size * 100, // Estimación en bytes
        cells: this.cellMasteryCache.size * 200
      }
    }
  }

  /**
   * Limpiar entradas antiguas del cache (cleanup periódico)
   * @param {number} maxAge - Edad máxima en ms (default: 30 minutos)
   */
  cleanupOldEntries(maxAge = 30 * 60 * 1000) {
    const now = Date.now()
    let cleanedItems = 0
    let cleanedCells = 0

    // Limpiar cache de ítems
    for (const [itemId, data] of this.itemMasteryCache.entries()) {
      if (now - data.lastUpdated > maxAge) {
        this.itemMasteryCache.delete(itemId)
        this.attemptCounts.delete(itemId)
        cleanedItems++
      }
    }

    // Limpiar cache de celdas
    for (const [cellKey, data] of this.cellMasteryCache.entries()) {
      if (now - data.lastUpdated > maxAge) {
        this.cellMasteryCache.delete(cellKey)
        cleanedCells++
      }
    }

    return { cleanedItems, cleanedCells }
  }
}

// Singleton para uso global
export const incrementalMasteryCache = new IncrementalMasteryCache()

/**
 * Función optimizada para calcular mastery de ítem con cache incremental
 * @param {string} itemId - ID del ítem
 * @param {Object} verb - Objeto verbo asociado
 * @param {boolean} forceRefresh - Forzar recálculo ignorando cache
 * @returns {Promise<{score: number, n: number, weightedAttempts: number}>}
 */
export function calculateMasteryForItem(itemId, verb, forceRefresh = false) {
  return incrementalMasteryCache.calculateMasteryForItemIncremental(itemId, verb, forceRefresh)
}

/**
 * Función optimizada para calcular mastery de celda con cache inteligente
 * @param {Array} items - Array de ítems en la celda
 * @param {Object} verbsMap - Mapa de verbos por ID
 * @param {string} mood - Modo gramatical (opcional, para cache)
 * @param {string} tense - Tiempo gramatical (opcional, para cache)
 * @param {string} person - Persona gramatical (opcional, para cache)
 * @returns {Promise<{score: number, n: number, weightedN: number}>}
 */
export function calculateMasteryForCell(items, verbsMap, mood = 'unknown', tense = 'unknown', person = 'unknown') {
  return incrementalMasteryCache.calculateMasteryForCellIncremental(items, verbsMap, mood, tense, person)
}

/**
 * Notificar al cache cuando se añade un nuevo intento
 * @param {string} itemId - ID del ítem que recibió un nuevo intento
 */
export function notifyNewAttempt(itemId) {
  incrementalMasteryCache.invalidateItemCache(itemId)
}

/**
 * Obtener estadísticas del cache de mastery
 */
export function getMasteryCacheStats() {
  return incrementalMasteryCache.getCacheStats()
}

/**
 * Limpiar todo el cache de mastery
 */
export function clearMasteryCache() {
  incrementalMasteryCache.invalidateAll()
}

/**
 * Cleanup periódico del cache (llamar cada 30 minutos)
 */
export function cleanupMasteryCache() {
  return incrementalMasteryCache.cleanupOldEntries()
}

// Exportar también el cache para acceso directo si es necesario
export { incrementalMasteryCache as masteryCache }
