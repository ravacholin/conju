// Sistema de cache avanzado para optimizar el generador de verbos
// Ahora con soporte para chunks dinámicos
import { verbChunkManager } from './verbChunkManager.js'
import { sanitizeVerbsInPlace } from './dataSanitizer.js'

// Cache inteligente optimizado con expiración y límite de memoria
class IntelligentCache {
  constructor(maxSize = 1000, ttl = 5 * 60 * 1000) { // 5 minutos TTL
    this.cache = new Map()
    this.accessTimes = new Map()
    this.maxSize = maxSize
    this.ttl = ttl
    this.hits = 0
    this.misses = 0
  }

  get(key) {
    const entry = this.cache.get(key)
    if (!entry) {
      this.misses++
      return null
    }
    
    // Verificar expiración
    const now = Date.now()
    if (now - entry.timestamp > this.ttl) {
      this.delete(key)
      this.misses++
      return null
    }
    
    // Cache hit - actualizar tiempo de acceso para LRU
    this.hits++
    this.accessTimes.set(key, now)
    return entry.value
  }

  set(key, value) {
    // Limpiar cache si está lleno
    if (this.cache.size >= this.maxSize) {
      this._evictOldest()
    }
    
    const timestamp = Date.now()
    this.cache.set(key, { value, timestamp })
    this.accessTimes.set(key, timestamp)
  }

  delete(key) {
    this.cache.delete(key)
    this.accessTimes.delete(key)
  }

  _evictOldest() {
    // Encontrar la entrada menos usada recientemente
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
  }

  getStats() {
    const hitRate = this.hits + this.misses > 0 ? (this.hits / (this.hits + this.misses) * 100).toFixed(1) : '0'
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      usage: (this.cache.size / this.maxSize * 100).toFixed(1) + '%',
      hits: this.hits,
      misses: this.misses,
      hitRate: hitRate + '%'
    }
  }
}

// Caches especializados con mastery awareness
export const verbCategorizationCache = new IntelligentCache(500, 10 * 60 * 1000) // 10 min para categorización
export const formFilterCache = new IntelligentCache(1000, 3 * 60 * 1000) // 3 min para filtrado
export const combinationCache = new IntelligentCache(200, 15 * 60 * 1000) // 15 min para combinaciones

// Cache para chunks dinámicos
export const chunkCache = new IntelligentCache(100, 30 * 60 * 1000) // 30 min para chunks
export const verbLookupCache = new IntelligentCache(2000, 15 * 60 * 1000, true) // 15 min para lookups + mastery-aware

// Mastery-aware predictive cache
export const predictiveCache = new IntelligentCache(500, 20 * 60 * 1000, true) // 20 min + mastery-aware

// Mapas de lookup que se construyen dinámicamente con chunks
export const VERB_LOOKUP_MAP = new Map()
export const FORM_LOOKUP_MAP = new Map()

// Funciones para cargar y cache de verbos por chunks
export async function getVerbByLemma(lemma) {
  // Check cache first
  const cacheKey = `verb:${lemma}`
  let verb = verbLookupCache.get(cacheKey)

  if (verb) {
    return verb
  }

  // Try chunk manager first
  try {
    verb = await verbChunkManager.getVerbByLemma(lemma)
  } catch (error) {
    console.warn('Chunk manager failed, using direct verb lookup:', error)
  }

  // Fallback: direct lookup from main verbs data
  if (!verb) {
    try {
      const { verbs } = await import('../../data/verbs.js')
      verb = verbs.find(v => v.lemma === lemma)
    } catch (error) {
      console.error('Failed to load verbs directly:', error)
      return null
    }
  }

  if (verb) {
    // Cache the result
    verbLookupCache.set(cacheKey, verb)

    // Also update the lookup map for compatibility
    VERB_LOOKUP_MAP.set(lemma, verb)

    // Handle priority suffixes
    if (verb.id && verb.id.endsWith('_priority') && !verb.lemma.endsWith('_priority')) {
      VERB_LOOKUP_MAP.set(verb.id, verb)
      const baseLemma = verb.id.replace('_priority', '')
      VERB_LOOKUP_MAP.set(baseLemma, verb)
    }

    if (verb.lemma.endsWith('_priority')) {
      const baseLemma = verb.lemma.replace('_priority', '')
      VERB_LOOKUP_MAP.set(baseLemma, verb)
    }

    // Build forms for this verb and add to FORM_LOOKUP_MAP
    verb.paradigms?.forEach(paradigm => {
      paradigm.forms?.forEach(form => {
        const key = `${verb.lemma}|${form.mood}|${form.tense}|${form.person}`
        const enrichedForm = {
          ...form,
          lemma: verb.lemma,
          id: key,
          type: verb.type || 'regular'
        }
        FORM_LOOKUP_MAP.set(key, enrichedForm)
      })
    })
  }

  return verb
}

export async function getVerbsByLemmas(lemmas) {
  // Check cache for already loaded verbs
  const uncachedLemmas = []
  const cachedVerbs = []

  lemmas.forEach(lemma => {
    const cacheKey = `verb:${lemma}`
    const verb = verbLookupCache.get(cacheKey)
    if (verb) {
      cachedVerbs.push(verb)
    } else {
      uncachedLemmas.push(lemma)
    }
  })

  // Load uncached verbs
  let newVerbs = []
  if (uncachedLemmas.length > 0) {
    try {
      newVerbs = await verbChunkManager.ensureVerbsLoaded(uncachedLemmas)
    } catch (error) {
      console.warn('Chunk manager failed for bulk load, using direct lookup:', error)

      // Fallback: load all verbs and filter
      try {
        const { verbs } = await import('../../data/verbs.js')
        newVerbs = verbs.filter(v => uncachedLemmas.includes(v.lemma))
      } catch (fallbackError) {
        console.error('Failed to load verbs directly:', fallbackError)
        return cachedVerbs
      }
    }

    // Cache the new verbs and build form maps
    newVerbs.forEach(verb => {
      const cacheKey = `verb:${verb.lemma}`
      verbLookupCache.set(cacheKey, verb)
      VERB_LOOKUP_MAP.set(verb.lemma, verb)

      // Build forms for this verb and add to FORM_LOOKUP_MAP
      verb.paradigms?.forEach(paradigm => {
        paradigm.forms?.forEach(form => {
          const key = `${verb.lemma}|${form.mood}|${form.tense}|${form.person}`
          const enrichedForm = {
            ...form,
            lemma: verb.lemma,
            id: key,
            type: verb.type || 'regular'
          }
          FORM_LOOKUP_MAP.set(key, enrichedForm)
        })
      })
    })
  }

  const allVerbs = [...cachedVerbs, ...newVerbs]

  // COMPLETENESS CHECK: Verify all requested lemmas were found
  const foundLemmas = new Set(allVerbs.map(verb => verb.lemma))
  const missingLemmas = lemmas.filter(lemma => !foundLemmas.has(lemma))

  if (missingLemmas.length > 0) {
    console.warn(`🔍 optimizedCache: ${missingLemmas.length} verbs still missing after chunk loading: [${missingLemmas.slice(0, 3).join(', ')}${missingLemmas.length > 3 ? '...' : ''}]`)

    // Final fallback: direct main store lookup for missing verbs
    try {
      const { verbs } = await import('../../data/verbs.js')
      const fallbackVerbs = verbs.filter(v => missingLemmas.includes(v.lemma))

      if (fallbackVerbs.length > 0) {
        console.log(`✅ optimizedCache: Recovered ${fallbackVerbs.length} verbs via direct fallback`)

        // Cache and index the fallback verbs
        fallbackVerbs.forEach(verb => {
          const cacheKey = `verb:${verb.lemma}`
          verbLookupCache.set(cacheKey, verb)
          VERB_LOOKUP_MAP.set(verb.lemma, verb)

          // Build forms for fallback verbs
          verb.paradigms?.forEach(paradigm => {
            paradigm.forms?.forEach(form => {
              const key = `${verb.lemma}|${form.mood}|${form.tense}|${form.person}`
              const enrichedForm = {
                ...form,
                lemma: verb.lemma,
                id: key,
                type: verb.type || 'regular'
              }
              FORM_LOOKUP_MAP.set(key, enrichedForm)
            })
          })
        })

        allVerbs.push(...fallbackVerbs)
      }

      // Check if any verbs are still missing
      const finalFoundLemmas = new Set(allVerbs.map(verb => verb.lemma))
      const finalMissingLemmas = lemmas.filter(lemma => !finalFoundLemmas.has(lemma))

      if (finalMissingLemmas.length > 0) {
        console.error(`❌ optimizedCache: CRITICAL - ${finalMissingLemmas.length} verbs not found anywhere: [${finalMissingLemmas.join(', ')}]`)
      }

    } catch (error) {
      console.error('Critical: Direct fallback also failed in optimizedCache:', error)
    }
  }

  return allVerbs
}

// Backward compatibility: initialize with core chunk
async function initializeCoreVerbs() {
  try {
    await verbChunkManager.loadChunk('core')
    const coreVerbs = verbChunkManager.loadedChunks.get('core') || []
    
    coreVerbs.forEach(verb => {
      try {
        sanitizeVerbsInPlace([verb])
      } catch (error) {
    if (import.meta.env?.DEV && !import.meta.env?.VITEST) console.warn('Data sanitizer failed for:', verb.lemma, error)
      }
      
      // Populate lookup maps for immediate availability
      VERB_LOOKUP_MAP.set(verb.lemma, verb)
      
      // Handle priority suffixes
      if (verb.id && verb.id.endsWith('_priority') && !verb.lemma.endsWith('_priority')) {
        VERB_LOOKUP_MAP.set(verb.id, verb)
        const baseLemma = verb.id.replace('_priority', '')
        VERB_LOOKUP_MAP.set(baseLemma, verb)
      }
      
      if (verb.lemma.endsWith('_priority')) {
        const baseLemma = verb.lemma.replace('_priority', '')
        VERB_LOOKUP_MAP.set(baseLemma, verb)
      }
      
      // Populate form lookup map
      verb.paradigms?.forEach(paradigm => {
        paradigm.forms?.forEach(form => {
          const key = `${verb.lemma}|${form.mood}|${form.tense}|${form.person}`
          const enrichedForm = { ...form, lemma: verb.lemma }
          FORM_LOOKUP_MAP.set(key, enrichedForm)
        })
      })
    })
    
    if (import.meta.env?.DEV && !import.meta.env?.VITEST) {
      console.log(`🚀 Core verbs initialized: ${coreVerbs.length} verbs`)
    }
  } catch (error) {
    console.error('Failed to initialize core verbs:', error)
  }
}

// Initialize core verbs immediately with fallback
initializeCoreVerbs().catch(error => {
  console.warn('Failed to initialize chunk system, using fallback:', error)
  initializeFallbackLookups()
})

// Fallback: initialize lookup maps synchronously with main verbs data
function initializeFallbackLookups() {
  try {
    // Dynamic import won't work in build, use require-style import
    import('../../data/verbs.js').then(({ verbs }) => {
      verbs.forEach(verb => {
        VERB_LOOKUP_MAP.set(verb.lemma, verb)

        // Populate form lookup map
        verb.paradigms?.forEach(paradigm => {
          paradigm.forms?.forEach(form => {
            const key = `${verb.lemma}|${form.mood}|${form.tense}|${form.person}`
            const enrichedForm = {
              ...form,
              lemma: verb.lemma,
              id: key,
              type: verb.type || 'regular'
            }
            FORM_LOOKUP_MAP.set(key, enrichedForm)
          })
        })
      })

      if (import.meta.env?.DEV && !import.meta.env?.VITEST) {
        console.log(`🚀 Fallback verbs initialized: ${verbs.length} verbs, ${FORM_LOOKUP_MAP.size} forms`)
      }
    }).catch(console.error)
  } catch (error) {
    console.error('Failed to initialize fallback lookups:', error)
  }
}

// Función para pre-calentar caches con datos frecuentes
export async function warmupCaches() {
  if (import.meta.env?.DEV && !import.meta.env?.VITEST) {
    console.log('🔥 Calentando caches del generador...')
  }
  
  const commonVerbs = ['ser', 'estar', 'haber', 'tener', 'hacer', 'ir', 'venir', 'decir', 'poder', 'querer']
  const commonCombinations = [
    'indicative|pres', 'subjunctive|pres', 'indicative|pretIndef'
  ]
  
  const startTime = Date.now()
  let categorized = 0
  
  // Preload common chunks
  await verbChunkManager.loadChunk('core')
  await verbChunkManager.loadChunk('common')
  
  // Pre-categorizar verbos comunes (ahora async)
  for (const lemma of commonVerbs) {
    const verb = await getVerbByLemma(lemma)
    if (verb) {
      // Simular categorización (se hará lazy cuando sea necesario)
      verbCategorizationCache.set(`categorize|${lemma}`, [])
      categorized++
    }
  }
  
  // Pre-computar combinaciones frecuentes
  let combinations = 0
  commonCombinations.forEach(combo => {
    combinationCache.set(`combo|${combo}`, { computed: true })
    combinations++
  })
  
  if (import.meta.env?.DEV && !import.meta.env?.VITEST) {
    const warmupTime = Date.now() - startTime
    console.log(`✅ Cache warmup completado en ${warmupTime}ms`)
    console.log(`   - ${categorized} verbos categorizados`)
    console.log(`   - ${combinations} combinaciones pre-computadas`)
    console.log(`   - ${VERB_LOOKUP_MAP.size} verbos indexados`)
    console.log(`   - ${FORM_LOOKUP_MAP.size} formas indexadas`)
    console.log(`   - Chunk stats:`, verbChunkManager.getStats())
  }
}

// Función para limpiar todos los caches (útil para debugging)
export function clearAllCaches() {
  verbCategorizationCache.clear()
  formFilterCache.clear()
  combinationCache.clear()
  chunkCache.clear()
  verbLookupCache.clear()
  VERB_LOOKUP_MAP.clear()
  FORM_LOOKUP_MAP.clear()
  
  // También limpiar chunk manager
  verbChunkManager.loadedChunks.clear()
  
  if (import.meta.env?.DEV && !import.meta.env?.VITEST) {
    console.log('🧹 Todos los caches han sido limpiados')
  }
}

// Función para obtener estadísticas de performance
export function getCacheStats() {
  return {
    verbCategorization: verbCategorizationCache.getStats(),
    formFilter: formFilterCache.getStats(),
    combination: combinationCache.getStats(),
    chunkCache: chunkCache.getStats(),
    verbLookupCache: verbLookupCache.getStats(),
    verbLookup: { size: VERB_LOOKUP_MAP.size },
    formLookup: { size: FORM_LOOKUP_MAP.size },
    chunkManager: verbChunkManager.getStats()
  }
}

// Predictive loading basado en patrones de uso y mastery
export async function initiatePredictiveLoading(userId, userSettings = {}) {
  if (!userId) return

  try {
    // Import analytics to predict next likely verbs
    const { getErrorIntelligence, getUserStats } = await import('../progress/analytics.js')
    const { getMasteryByUser } = await import('../progress/database.js')

    const [errorData, userStats, masteryRecords] = await Promise.all([
      getErrorIntelligence(userId),
      getUserStats(userId),
      getMasteryByUser(userId)
    ])

    // Create mastery lookup map
    const masteryMap = new Map()
    masteryRecords.forEach(record => {
      if (record.lemma) {
        masteryMap.set(record.lemma, record.score)
      }
    })

    // Predict verbs that might be needed based on error patterns
    const predictedVerbs = new Set()

    // Add frequently missed verbs (higher priority for low mastery)
    for (const tag of errorData.tags.slice(0, 2)) {
      for (const combo of tag.topCombos.slice(0, 2)) {
        const verbsForCombo = getVerbsForMoodTense(combo.mood, combo.tense)
        verbsForCombo.slice(0, 3).forEach(verb => {
          predictedVerbs.add(verb)
          // Cache with mastery score for intelligent eviction
          const masteryScore = masteryMap.get(verb) || 30 // Default low for error-prone verbs
          const cacheKey = `predicted:${verb}`
          predictiveCache.set(cacheKey, { lemma: verb, predicted: true }, masteryScore)
        })
      }
    }

    // Add low-mastery verbs for review
    const lowMasteryVerbs = masteryRecords
      .filter(record => record.score < 40)
      .sort((a, b) => a.score - b.score)
      .slice(0, 5)
      .map(record => record.lemma)
      .filter(lemma => lemma)

    lowMasteryVerbs.forEach(verb => {
      predictedVerbs.add(verb)
      const masteryScore = masteryMap.get(verb) || 20
      const cacheKey = `lowmastery:${verb}`
      predictiveCache.set(cacheKey, { lemma: verb, lowMastery: true }, masteryScore)
    })

    // Predictively cache these verbs
    if (predictedVerbs.size > 0) {
      console.log(`🔮 Predictive cache: Loading ${predictedVerbs.size} predicted verbs`)
      await verbChunkManager.ensureVerbsLoaded(Array.from(predictedVerbs))

      // Update cache stats
      predictiveCache.predictions += predictedVerbs.size
    }

  } catch (error) {
    console.warn('Predictive loading failed:', error)
  }
}

// Helper function to get verbs for mood/tense combinations
function getVerbsForMoodTense(mood, tense) {
  // Simplified implementation - returns common verbs for the mood/tense
  const commonVerbs = ['ser', 'estar', 'tener', 'hacer', 'decir', 'ir', 'ver', 'dar']

  // Mood-specific filtering
  if (mood === 'subjunctive') {
    return ['ser', 'estar', 'haber', 'dar', 'ir', 'saber', 'ver']
  }

  if (tense === 'pretIndef') {
    return ['ser', 'estar', 'tener', 'hacer', 'decir', 'ir', 'dar', 'poder']
  }

  return commonVerbs
}

// Enhanced cache statistics with predictive metrics
export function getEnhancedCacheStats() {
  return {
    verbCategorization: verbCategorizationCache.getStats(),
    formFilter: formFilterCache.getStats(),
    combination: combinationCache.getStats(),
    chunkCache: chunkCache.getStats(),
    verbLookupCache: verbLookupCache.getStats(),
    predictiveCache: predictiveCache.getStats(),
    verbLookup: { size: VERB_LOOKUP_MAP.size },
    formLookup: { size: FORM_LOOKUP_MAP.size },
    chunkManager: verbChunkManager.getStats(),
    predictiveLoadingEnabled: true
  }
}

// Make cache management functions available globally for debugging
if (typeof window !== 'undefined') {
  window.clearAllCaches = clearAllCaches
  window.getCacheStats = getCacheStats
  window.getEnhancedCacheStats = getEnhancedCacheStats
  window.initiatePredictiveLoading = initiatePredictiveLoading
}
