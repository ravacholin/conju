// Verb chunking system by CEFR levels for optimal loading
// Only loads verbs needed for current level/practice mode

import { getVerbs } from './verbsLazy.js'

// Cache for verb chunks by level
const verbChunksCache = new Map()
const chunkPromises = new Map()

/**
 * Get verbs filtered by CEFR level with intelligent chunking
 * @param {string} level - CEFR level (A1, A2, B1, B2, C1, C2)
 * @param {boolean} includeHigherLevels - Include verbs from higher levels
 * @returns {Promise<Array>} Filtered verbs for the level
 */
export async function getVerbsForLevel(level, includeHigherLevels = true) {
  const cacheKey = `${level}-${includeHigherLevels}`

  // Return cached chunk if available
  if (verbChunksCache.has(cacheKey)) {
    return verbChunksCache.get(cacheKey)
  }

  // Return existing promise if already loading
  if (chunkPromises.has(cacheKey)) {
    return chunkPromises.get(cacheKey)
  }

  // Start loading chunk
  const promise = (async () => {
    console.log(`🔄 Loading verbs for level ${level}...`)

    // Get all verbs first
    const allVerbs = await getVerbs()

    // Define level priorities for verb selection
    const levelPriorities = {
      'A1': ['A1'],
      'A2': ['A1', 'A2'],
      'B1': ['A1', 'A2', 'B1'],
      'B2': ['A1', 'A2', 'B1', 'B2'],
      'C1': ['A1', 'A2', 'B1', 'B2', 'C1'],
      'C2': ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
    }

    const levelsToInclude = includeHigherLevels
      ? levelPriorities[level] || levelPriorities['B1']
      : [level]

    // Filter verbs based on level and frequency
    const filteredVerbs = allVerbs.filter(verb => {
      // Include high-frequency verbs for all levels
      const isHighFrequency = verb.frequency && verb.frequency <= 100

      // Include verbs by level tags or if no level specified
      const hasLevelTag = verb.level && levelsToInclude.includes(verb.level)
      const noLevelTag = !verb.level

      // Include essential verbs (type: regular, stem-changing, etc.)
      const isEssential = ['regular', 'stem-changing', 'irregular'].includes(verb.type)

      return (hasLevelTag || noLevelTag || isHighFrequency) && isEssential
    })

    console.log(`✅ Loaded ${filteredVerbs.length} verbs for level ${level}`)

    // Cache the result
    verbChunksCache.set(cacheKey, filteredVerbs)
    return filteredVerbs
  })()

  chunkPromises.set(cacheKey, promise)
  return promise
}

/**
 * Get essential verbs for immediate app functionality (smallest possible set)
 * @returns {Promise<Array>} Core verbs needed for basic functionality
 */
export async function getCoreVerbs() {
  const cacheKey = 'core-essential'

  if (verbChunksCache.has(cacheKey)) {
    return verbChunksCache.get(cacheKey)
  }

  if (chunkPromises.has(cacheKey)) {
    return chunkPromises.get(cacheKey)
  }

  const promise = (async () => {
    console.log('🔄 Loading core essential verbs...')

    const allVerbs = await getVerbs()

    // Most essential Spanish verbs for basic functionality
    const essentialLemmas = [
      'ser', 'estar', 'tener', 'hacer', 'ir', 'poder', 'decir', 'dar',
      'ver', 'querer', 'venir', 'saber', 'salir', 'poner', 'llegar',
      'hablar', 'vivir', 'comer', 'trabajar', 'estudiar'
    ]

    const coreVerbs = allVerbs.filter(verb =>
      essentialLemmas.includes(verb.lemma) ||
      (verb.frequency && verb.frequency <= 20)
    )

    console.log(`✅ Loaded ${coreVerbs.length} core essential verbs`)

    verbChunksCache.set(cacheKey, coreVerbs)
    return coreVerbs
  })()

  chunkPromises.set(cacheKey, promise)
  return promise
}

/**
 * Preload verbs for next likely level (progressive enhancement)
 * @param {string} currentLevel - Current user level
 */
export function preloadNextLevelVerbs(currentLevel) {
  const levelProgression = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
  const currentIndex = levelProgression.indexOf(currentLevel)

  if (currentIndex >= 0 && currentIndex < levelProgression.length - 1) {
    const nextLevel = levelProgression[currentIndex + 1]
    // Preload silently in background
    getVerbsForLevel(nextLevel).catch(() => {})
  }
}

/**
 * Clear verb chunks cache
 */
export function clearVerbChunksCache() {
  verbChunksCache.clear()
  chunkPromises.clear()
}

/**
 * Get cache statistics for debugging
 */
export function getVerbChunkStats() {
  return {
    cachedChunks: verbChunksCache.size,
    loadingChunks: chunkPromises.size,
    chunkKeys: Array.from(verbChunksCache.keys())
  }
}