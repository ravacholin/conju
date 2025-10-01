// Lazy initialization system for progress - non-blocking startup
// Eliminates blocking initialization on app startup

import { initProgressSystem } from './index.js'

let initPromise = null
let isInitialized = false

/**
 * Initialize progress system lazily (non-blocking)
 * @returns {Promise<string>} User ID
 */
export async function initProgressSystemLazy() {
  if (isInitialized) {
    return getCurrentUserId()
  }

  if (initPromise) {
    return initPromise
  }

  initPromise = (async () => {
    try {
      console.log('🔄 Initializing progress system lazily...')
      const userId = await initProgressSystem()
      isInitialized = true
      console.log('✅ Progress system initialized lazily for user:', userId)
      return userId
    } catch (error) {
      console.error('❌ Lazy progress system initialization failed:', error)
      initPromise = null // Reset so we can retry
      throw error
    }
  })()

  return initPromise
}

/**
 * Check if progress system is initialized
 * @returns {boolean}
 */
export function isProgressSystemInitialized() {
  return isInitialized
}

/**
 * Get current user ID if available, null otherwise
 * @returns {string|null}
 */
export function getCurrentUserId() {
  try {
    // Try to get from userManager if already imported
    if (typeof window !== 'undefined' && window.userManager) {
      return window.userManager.getCurrentUserId()
    }
    return null
  } catch {
    return null
  }
}

/**
 * Initialize progress system in background (fire and forget)
 */
export function preloadProgressSystem() {
  if (!isInitialized && !initPromise) {
    initProgressSystemLazy().catch(() => {})
  }
}

/**
 * Reset initialization state (for testing)
 */
export function resetProgressInitialization() {
  initPromise = null
  isInitialized = false
}