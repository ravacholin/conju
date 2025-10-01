// Lazy loading system for verbs data
// Eliminates 4.1MB initial bundle size by loading verbs on-demand

let verbsCache = null
let verbsPromise = null

/**
 * Lazy load verbs data only when needed
 * @returns {Promise<Array>} Verbs array
 */
export async function getVerbs() {
  // Return cached verbs if already loaded
  if (verbsCache) {
    return verbsCache
  }

  // Return existing promise if already loading
  if (verbsPromise) {
    return verbsPromise
  }

  // Start loading verbs dynamically
  verbsPromise = (async () => {
    console.log('🔄 Loading verbs data lazily...')
    try {
      const { verbs } = await import('./verbs.js')
      verbsCache = verbs
      console.log(`✅ Loaded ${verbs.length} verbs lazily`)
      return verbs
    } catch (error) {
      console.error('❌ Failed to load verbs:', error)
      verbsPromise = null // Reset promise so we can retry
      throw error
    }
  })()

  return verbsPromise
}

/**
 * Get verbs synchronously if already loaded, null otherwise
 * @returns {Array|null} Verbs array or null if not loaded
 */
export function getVerbsSync() {
  return verbsCache
}

/**
 * Check if verbs are already loaded
 * @returns {boolean} True if verbs are cached
 */
export function areVerbsLoaded() {
  return verbsCache !== null
}

/**
 * Preload verbs in background (non-blocking)
 */
export function preloadVerbs() {
  if (!verbsCache && !verbsPromise) {
    getVerbs().catch(() => {}) // Silent preload
  }
}

/**
 * Clear verbs cache (for testing/development)
 */
export function clearVerbsCache() {
  verbsCache = null
  verbsPromise = null
}

// Export original verbs as default for compatibility
export default getVerbs