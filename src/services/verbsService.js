/**
 * Servicio para carga lazy del dataset de verbos
 * 
 * Este servicio gestiona la carga asíncrona del archivo verbs.js (~4.2MB)
 * para evitar que forme parte del bundle inicial y ralentice la carga.
 */

let verbsCache = null
let loadingPromise = null

/**
 * Carga asíncrona del dataset de verbos
 * @returns {Promise<Array>} Array de verbos
 */
export async function loadVerbs() {
  // Si ya están cargados, devolver cache
  if (verbsCache) {
    return verbsCache
  }

  // Si ya está cargando, esperar la promesa existente
  if (loadingPromise) {
    return loadingPromise
  }

  // Iniciar carga con dynamic import
  loadingPromise = (async () => {
    try {
      console.log('🔄 Loading verbs dataset...')
      const startTime = performance.now()
      
      const { verbs } = await import('../data/verbs.js')
      
      const loadTime = performance.now() - startTime
      console.log(`✅ Verbs dataset loaded in ${loadTime.toFixed(2)}ms`)
      console.log(`📊 Loaded ${verbs.length} verbs`)
      
      verbsCache = verbs
      return verbs
    } catch (error) {
      console.error('❌ Failed to load verbs dataset:', error)
      loadingPromise = null // Reset para permitir reintentos
      throw error
    }
  })()

  return loadingPromise
}

/**
 * Obtiene verbos desde cache (síncrono)
 * @returns {Array|null} Array de verbos o null si no están cargados
 */
export function getVerbsSync() {
  return verbsCache
}

/**
 * Verifica si los verbos están cargados
 * @returns {boolean} true si están cargados
 */
export function areVerbsLoaded() {
  return verbsCache !== null
}

/**
 * Precarga los verbos en background
 * Útil para iniciar la carga antes de que el usuario los necesite
 */
export function preloadVerbs() {
  if (!verbsCache && !loadingPromise) {
    loadVerbs().catch(console.error)
  }
}

/**
 * Limpia el cache (útil para testing)
 */
export function clearVerbsCache() {
  verbsCache = null
  loadingPromise = null
}