/**
 * Utility for retrying failed dynamic imports with cache busting
 * Solves the common PWA issue where stale chunks fail to load after deployments
 */

/**
 * Retry dynamic import with cache busting
 * @param {Function} importFn - The import function to retry
 * @param {number} maxRetries - Maximum number of retries (default: 2)
 * @returns {Promise} - Promise resolving to the imported module
 */
export async function retryDynamicImport(importFn, maxRetries = 2) {
  let lastError

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await importFn()
    } catch (error) {
      lastError = error
      console.warn(`Dynamic import failed (attempt ${attempt + 1}/${maxRetries + 1}):`, error.message)

      // On failed attempts, try cache busting strategies
      if (attempt < maxRetries) {
        if (attempt === 0) {
          // First retry: clear module cache if available
          if ('caches' in window) {
            try {
              const cache = await caches.open('dynamic-assets')
              await cache.delete(error.message.match(/https?:\/\/[^\s]+/)?.[0] || '')
            } catch (cacheError) {
              console.debug('Cache clearing failed:', cacheError)
            }
          }
        } else {
          // Final retry: wait a bit before final attempt
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }
    }
  }

  // All retries failed - force page reload as last resort
  console.error('All dynamic import attempts failed, forcing page reload')
  if (typeof window !== 'undefined') {
    window.location.reload()
  }

  throw lastError
}

/**
 * Create a lazy component with automatic retry on import failure
 * @param {Function} importFn - The import function
 * @param {number} maxRetries - Maximum retries
 * @returns {React.ComponentType} - Lazy component with retry logic
 */
export function lazyWithRetry(importFn, maxRetries = 2) {
  return () => retryDynamicImport(importFn, maxRetries)
}