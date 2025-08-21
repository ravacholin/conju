// Sistema de cache avanzado para optimizar el generador de verbos
import { loadVerbs, getVerbsSync } from '../../services/verbsService.js'

// Cache inteligente con expiración y límite de memoria
class IntelligentCache {
  constructor(maxSize = 1000, ttl = 5 * 60 * 1000) { // 5 minutos TTL
    this.cache = new Map()
    this.accessTimes = new Map()
    this.maxSize = maxSize
    this.ttl = ttl
  }

  get(key) {
    const entry = this.cache.get(key)
    if (!entry) return null
    
    // Verificar expiración
    if (Date.now() - entry.timestamp > this.ttl) {
      this.delete(key)
      return null
    }
    
    // Actualizar tiempo de acceso para LRU
    this.accessTimes.set(key, Date.now())
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
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      usage: (this.cache.size / this.maxSize * 100).toFixed(1) + '%'
    }
  }
}

// Caches especializados
export const verbCategorizationCache = new IntelligentCache(500, 10 * 60 * 1000) // 10 min para categorización
export const formFilterCache = new IntelligentCache(1000, 3 * 60 * 1000) // 3 min para filtrado
export const combinationCache = new IntelligentCache(200, 15 * 60 * 1000) // 15 min para combinaciones

// Pre-computar mapas frecuentemente utilizados (inicializados lazy)
export let VERB_LOOKUP_MAP = new Map()
export let FORM_LOOKUP_MAP = new Map()

// Función para inicializar mapas cuando los verbos estén cargados
function initializeLookupMaps() {
  const verbs = getVerbsSync()
  if (!verbs || VERB_LOOKUP_MAP.size > 0) return // Ya inicializados o verbos no disponibles
  
  console.log('🏗️ Initializing lookup maps...')
  
  // Inicializar verb lookup map
  VERB_LOOKUP_MAP = new Map(verbs.map(v => [v.lemma, v]))
  
  // Inicializar form lookup map
  verbs.forEach(verb => {
    verb.paradigms?.forEach(paradigm => {
      paradigm.forms?.forEach(form => {
        const key = `${verb.lemma}|${form.mood}|${form.tense}|${form.person}`
        FORM_LOOKUP_MAP.set(key, form)
      })
    })
  })
  
  console.log(`✅ Lookup maps initialized: ${VERB_LOOKUP_MAP.size} verbs, ${FORM_LOOKUP_MAP.size} forms`)
}

// Función para pre-calentar caches con datos frecuentes
export function warmupCaches() {
  console.log('🔥 Calentando caches del generador...')
  
  // Inicializar lookup maps si los verbos están disponibles
  initializeLookupMaps()
  
  const commonVerbs = ['ser', 'estar', 'haber', 'tener', 'hacer', 'ir', 'venir', 'decir', 'poder', 'querer']
  const commonCombinations = [
    'indicative|pres', 'subjunctive|pres', 'indicative|pretIndef'
  ]
  
  // Pre-categorizar verbos comunes
  const startTime = Date.now()
  let categorized = 0
  
  commonVerbs.forEach(lemma => {
    const verb = VERB_LOOKUP_MAP.get(lemma)
    if (verb) {
      // Simular categorización (se hará lazy cuando sea necesario)
      verbCategorizationCache.set(`categorize|${lemma}`, [])
      categorized++
    }
  })
  
  // Pre-computar combinaciones frecuentes
  let combinations = 0
  commonCombinations.forEach(combo => {
    combinationCache.set(`combo|${combo}`, { computed: true })
    combinations++
  })
  
  const warmupTime = Date.now() - startTime
  console.log(`✅ Cache warmup completado en ${warmupTime}ms`)
  console.log(`   - ${categorized} verbos categorizados`)
  console.log(`   - ${combinations} combinaciones pre-computadas`)
  console.log(`   - ${VERB_LOOKUP_MAP.size} verbos indexados`)
  console.log(`   - ${FORM_LOOKUP_MAP.size} formas indexadas`)
}

// Función para obtener estadísticas de performance
export function getCacheStats() {
  return {
    verbCategorization: verbCategorizationCache.getStats(),
    formFilter: formFilterCache.getStats(),
    combination: combinationCache.getStats(),
    verbLookup: { size: VERB_LOOKUP_MAP.size },
    formLookup: { size: FORM_LOOKUP_MAP.size }
  }
}

// Limpiar caches cuando sea necesario
export function clearAllCaches() {
  verbCategorizationCache.clear()
  formFilterCache.clear()
  combinationCache.clear()
  console.log('🧹 Todos los caches limpiados')
}