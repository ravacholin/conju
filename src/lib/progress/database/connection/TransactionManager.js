/**
 * TransactionManager - Utilities for safe transaction handling
 *
 * Responsibilities:
 * - Wrap transactions with timeout protection
 * - Prevent hanging database operations
 *
 * Extracted from database.js Phase 1 refactoring
 */

// Timeout configuration for IndexedDB transactions
export const DB_TRANSACTION_TIMEOUT = 10000 // 10 seconds

/**
 * Wraps a promise with a timeout to prevent hanging transactions
 * @param {Promise} promise - Promise to wrap
 * @param {number} timeout - Timeout in milliseconds
 * @param {string} operation - Operation name for error messages
 * @returns {Promise} Promise that rejects if timeout is reached
 */
export function withTimeout(promise, timeout, operation) {
  let timeoutId = null
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(
      () => reject(new Error(`${operation} timed out after ${timeout}ms`)),
      timeout
    )
  })

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  })
}
