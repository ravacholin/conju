import { lazy } from 'react'

/**
 * Wraps React.lazy to handle chunk load errors by reloading the page.
 * This is useful when a new version is deployed and old chunks are missing.
 * 
 * @param {Function} importFn - The dynamic import function, e.g., () => import('./Component')
 * @returns {React.LazyExoticComponent}
 */
export function safeLazy(importFn) {
    return lazy(async () => {
        try {
            return await importFn()
        } catch (error) {
            const isChunkError = error.message?.includes('Failed to fetch dynamically imported module') ||
                error.message?.includes('Importing a module script failed')

            if (isChunkError) {
                // Check if we already tried to reload for this session
                const storageKey = 'chunk_load_error_reload'
                const hasReloaded = window.sessionStorage.getItem(storageKey)

                if (!hasReloaded) {
                    window.sessionStorage.setItem(storageKey, 'true')
                    window.location.reload()
                    // Return a never-resolving promise to prevent error boundary from showing while reloading
                    return new Promise(() => { })
                }
            }

            // If not a chunk error or we already reloaded, rethrow
            throw error
        }
    })
}
