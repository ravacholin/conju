// Simplified optimized cache without chunk complexity
// Provides global maps and intelligent caching for verb operations

import { getAllVerbs, getVerbByLemma, getVerbsByLemmas } from './verbDataService.js'

// Global Maps for fast lookups
export const VERB_LOOKUP_MAP = new Map()
export const FORM_LOOKUP_MAP = new Map()

// Intelligent Cache class (simplified)
class IntelligentCache {
  constructor(maxSize = 1000, ttl = 5 * 60 * 1000, masteryAware = false) {
    this.cache = new Map()
    this.accessTimes = new Map()
    this.maxSize = maxSize
    this.ttl = ttl
    this.hits = 0
    this.misses = 0
    this.masteryAware = masteryAware
    this.masteryScores = new Map()
    this.totalMasteryScore = 0
    this.predictions = 0
  }

  get(key) {
    const entry = this.cache.get(key)
    if (!entry) {
      this.misses++
      return null
    }

    // Check expiration
    const now = Date.now()
    if (now - entry.timestamp > this.ttl) {
      this.delete(key)
      this.misses++
      return null
    }

    // Cache hit - update access time for LRU
    this.hits++
    this.accessTimes.set(key, now)
    return entry.value
  }

  set(key, value, masteryScore) {
    // Clean cache if full
    if (this.cache.size >= this.maxSize) {
      this._evictOldest()
    }

    const timestamp = Date.now()
    this.cache.set(key, { value, timestamp })
    this.accessTimes.set(key, timestamp)

    if (this.masteryAware) {
      const score = Number.isFinite(masteryScore) ? masteryScore : 0
      if (this.masteryScores.has(key)) {
        this.totalMasteryScore -= this.masteryScores.get(key)
      }
      this.masteryScores.set(key, score)
      this.totalMasteryScore += score
    }
  }

  delete(key) {
    if (this.masteryAware && this.masteryScores.has(key)) {
      this.totalMasteryScore -= this.masteryScores.get(key)
      this.masteryScores.delete(key)
    }
    this.cache.delete(key)
    this.accessTimes.delete(key)
  }

  _evictOldest() {
    let oldestKey = null
    let oldestTime = Infinity

    for (const [key, time] of this.accessTimes) {
      if (time < oldestTime) {
        oldestTime = time
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.delete(oldestKey)
    }
  }

  clear() {
    this.cache.clear()
    this.accessTimes.clear()
    if (this.masteryAware) {
      this.masteryScores.clear()
      this.totalMasteryScore = 0
    }
    this.predictions = 0
  }

  getStats() {
    const hitRate = this.hits + this.misses > 0 ? (this.hits / (this.hits + this.misses) * 100).toFixed(1) : '0'
    const avgMastery = this.masteryAware && this.masteryScores.size > 0
      ? (this.totalMasteryScore / this.masteryScores.size).toFixed(1)
      : '0'

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hits: this.hits,
      misses: this.misses,
      hitRate: `${hitRate}%`,
      ttl: this.ttl,
      masteryAware: this.masteryAware,
      avgMastery: `${avgMastery}%`,
      predictions: this.predictions
    }
  }
}

// Cache instances
export const verbLookupCache = new IntelligentCache(500, 10 * 60 * 1000) // 10 minutes TTL
export const formFilterCache = new IntelligentCache(1000, 5 * 60 * 1000, true) // mastery-aware

// Initialize global maps synchronously
export function initializeMaps() {
  console.log('🚀 Initializing verb lookup maps...')
  const startTime = performance.now()

  try {
    const verbs = getAllVerbs()

    // Clear existing maps
    VERB_LOOKUP_MAP.clear()
    FORM_LOOKUP_MAP.clear()

    // Populate VERB_LOOKUP_MAP
    for (const verb of verbs) {
      if (verb?.lemma) {
        VERB_LOOKUP_MAP.set(verb.lemma, verb)
        if (verb.id) {
          VERB_LOOKUP_MAP.set(verb.id, verb)
        }
      }
    }

    // Populate FORM_LOOKUP_MAP
    for (const verb of verbs) {
      if (!verb?.paradigms) continue

      for (const paradigm of verb.paradigms) {
        if (!paradigm.forms) continue

        for (const form of paradigm.forms) {
          const key = `${verb.lemma}|${form.mood}|${form.tense}|${form.person || ''}`
          const enrichedForm = {
            ...form,
            lemma: verb.lemma,
            id: key,
            type: verb.type || 'regular',
            verbType: verb.type || 'regular'
          }
          FORM_LOOKUP_MAP.set(key, enrichedForm)
        }
      }
    }

    const endTime = performance.now()
    console.log(`✅ Maps initialized: ${VERB_LOOKUP_MAP.size} verbs, ${FORM_LOOKUP_MAP.size} forms (${(endTime - startTime).toFixed(2)}ms)`)

    return {
      verbCount: VERB_LOOKUP_MAP.size,
      formCount: FORM_LOOKUP_MAP.size,
      initTime: endTime - startTime
    }

  } catch (error) {
    console.error('❌ Failed to initialize verb maps:', error)
    throw error
  }
}

// Warmup caches (simplified)
export function warmupCaches() {
  console.log('🔥 Warming up caches...')

  // Basic warmup - cache some common verbs
  const commonVerbs = ['ser', 'estar', 'haber', 'tener', 'hacer', 'decir', 'ir', 'ver']

  for (const lemma of commonVerbs) {
    const verb = getVerbByLemma(lemma)
    if (verb) {
      verbLookupCache.set(`verb:${lemma}`, verb)
    }
  }

  console.log(`✅ Cache warmup complete`)
}

// Get verbs by lemmas with caching
export { getVerbsByLemmas }

// Re-export for compatibility
export { getVerbByLemma }

// Cache stats
export function getCacheStats() {
  return {
    globalMaps: {
      verbs: VERB_LOOKUP_MAP.size,
      forms: FORM_LOOKUP_MAP.size
    },
    verbLookupCache: verbLookupCache.getStats(),
    formFilterCache: formFilterCache.getStats()
  }
}

// Clear all caches
export function clearAllCaches() {
  verbLookupCache.clear()
  formFilterCache.clear()
  console.log('🧹 All caches cleared')
}

// Auto-initialize on import (for compatibility)
if (typeof window !== 'undefined') {
  // Only auto-initialize in browser environment
  try {
    initializeMaps()
    warmupCaches()
  } catch (error) {
    console.warn('Auto-initialization failed, maps may need manual initialization:', error)
  }
}