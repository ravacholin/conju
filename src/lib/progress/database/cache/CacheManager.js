/**
 * CacheManager - In-memory cache for database operations
 *
 * Responsibilities:
 * - Manage in-memory caches for hot paths
 * - Provide cache TTL (time-to-live) management
 * - Minimize repeated IndexedDB hits
 * - Cache invalidation and statistics
 *
 * Extracted from database.js Phase 1 refactoring
 */

const CACHE_TTL_MS = 4000 // 4 seconds

// Simple in-memory caches to avoid hitting IndexedDB repeatedly for hot paths
const attemptsCache = new Map()
const masteryCache = new Map()

/**
 * Freeze records to prevent mutation
 * @param {Array|Object} records - Records to freeze
 * @returns {Array|Object} Frozen records
 */
function freezeRecords(records) {
  if (!Array.isArray(records)) {
    return records
  }
  const normalized = records.map(record => {
    if (record && typeof record === 'object') {
      return Object.isFrozen(record) ? record : Object.freeze({ ...record })
    }
    return record
  })
  return Object.freeze(normalized)
}

/**
 * Set cache entry with timestamp
 * @param {Map} map - Cache map
 * @param {string} key - Cache key
 * @param {*} records - Records to cache
 */
export function setCacheEntry(map, key, records) {
  if (!key) return
  map.set(key, {
    value: freezeRecords(records),
    timestamp: Date.now()
  })
}

/**
 * Append records to existing cache entry
 * @param {Map} map - Cache map
 * @param {string} key - Cache key
 * @param {Array} records - Records to append
 */
export function appendCacheEntry(map, key, records) {
  if (!key || !Array.isArray(records) || records.length === 0) return
  const existing = map.get(key)
  if (!existing) {
    setCacheEntry(map, key, records)
    return
  }
  const merged = [...existing.value, ...records]
  map.set(key, {
    value: freezeRecords(merged),
    timestamp: Date.now()
  })
}

/**
 * Get cache entry if not expired
 * @param {Map} map - Cache map
 * @param {string} key - Cache key
 * @returns {*|null} Cached value or null if expired/not found
 */
export function getCacheEntry(map, key) {
  if (!key) return null
  const entry = map.get(key)
  if (!entry) return null
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    map.delete(key)
    return null
  }
  return entry.value
}

/**
 * Invalidate specific cache entry
 * @param {Map} map - Cache map
 * @param {string} key - Cache key to invalidate
 */
export function invalidateCacheEntry(map, key) {
  if (typeof key === 'undefined' || key === null) return
  map.delete(key)
}

/**
 * Reset all memory caches
 */
export function resetMemoryCaches() {
  attemptsCache.clear()
  masteryCache.clear()
}

/**
 * Clear all caches
 * @returns {Promise<void>}
 */
export async function clearAllCaches() {
  resetMemoryCaches()
}

/**
 * Get cache statistics
 * @returns {Promise<Object>} Cache stats
 */
export async function getCacheStats() {
  return {
    attempts: {
      size: attemptsCache.size,
      entries: Array.from(attemptsCache.keys())
    },
    mastery: {
      size: masteryCache.size,
      entries: Array.from(masteryCache.keys())
    }
  }
}

/**
 * Get attempts cache (for repository use)
 * @returns {Map}
 */
export function getAttemptsCache() {
  return attemptsCache
}

/**
 * Get mastery cache (for repository use)
 * @returns {Map}
 */
export function getMasteryCache() {
  return masteryCache
}

/**
 * Clear progress database caches (for testing)
 * @private
 */
export function __clearProgressDatabaseCaches() {
  resetMemoryCaches()
}
