/**
 * Utility for managing async operations with cancellation support
 * Solves the issue of hanging requests and memory leaks in React components
 */

export class AsyncController {
  constructor() {
    this.activeOperations = new Map()
    this.abortController = new AbortController()
  }

  /**
   * Execute an async operation with cancellation support
   * @param {string} key - Unique identifier for the operation
   * @param {Function} operation - Async function to execute
   * @param {number} timeout - Timeout in milliseconds (default: 10000)
   * @returns {Promise} - Promise that resolves with the operation result
   */
  async execute(key, operation, timeout = 10000) {
    // Cancel any existing operation with the same key
    this.cancel(key)

    // Create operation-specific abort controller
    const operationController = new AbortController()
    const signal = operationController.signal

    // Store the operation for potential cancellation
    this.activeOperations.set(key, {
      controller: operationController,
      startTime: Date.now()
    })

    try {
      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        const timeoutId = setTimeout(() => {
          operationController.abort()
          reject(new Error(`Operation '${key}' timed out after ${timeout}ms`))
        }, timeout)

        // Clear timeout if operation completes or is cancelled
        signal.addEventListener('abort', () => clearTimeout(timeoutId))
      })

      // Execute the operation with signal
      const operationPromise = operation(signal)

      // Race between operation and timeout
      const result = await Promise.race([operationPromise, timeoutPromise])

      // Clean up successful operation
      this.activeOperations.delete(key)
      return result

    } catch (error) {
      // Clean up failed operation
      this.activeOperations.delete(key)
      
      if (signal.aborted) {
        throw new Error(`Operation '${key}' was cancelled`)
      }
      
      throw error
    }
  }

  /**
   * Execute multiple operations in parallel with individual cancellation
   * @param {Object} operations - Object with key-value pairs of operations
   * @param {number} timeout - Global timeout for all operations
   * @returns {Promise<Object>} - Object with results keyed by operation name
   */
  async executeAll(operations, timeout = 10000) {
    const promises = Object.entries(operations).map(([key, operation]) => {
      return this.execute(key, operation, timeout)
        .then(result => ({ key, result, success: true }))
        .catch(error => ({ key, error, success: false }))
    })

    const results = await Promise.all(promises)
    
    // Transform results back to object format
    const resultObject = {}
    const errors = {}
    
    results.forEach(({ key, result, error, success }) => {
      if (success) {
        resultObject[key] = result
      } else {
        errors[key] = error
        resultObject[key] = null // or provide fallback
      }
    })

    // Log any errors but don't throw (fail gracefully)
    if (Object.keys(errors).length > 0) {
      console.warn('Some async operations failed:', errors)
    }

    return resultObject
  }

  /**
   * Cancel a specific operation
   * @param {string} key - Key of the operation to cancel
   */
  cancel(key) {
    const operation = this.activeOperations.get(key)
    if (operation) {
      operation.controller.abort()
      this.activeOperations.delete(key)
      console.log(`🚫 Cancelled operation: ${key}`)
    }
  }

  /**
   * Cancel all active operations
   */
  cancelAll() {
    console.log(`🚫 Cancelling ${this.activeOperations.size} active operations`)
    
    this.activeOperations.forEach((operation) => {
      operation.controller.abort()
    })
    
    this.activeOperations.clear()
    
    // Also abort the main controller for any operations that might not be tracked
    this.abortController.abort()
    this.abortController = new AbortController()
  }

  /**
   * Get information about active operations
   */
  getActiveOperations() {
    const operations = []
    this.activeOperations.forEach((operation, key) => {
      operations.push({
        key,
        duration: Date.now() - operation.startTime
      })
    })
    return operations
  }

  /**
   * Check if a specific operation is active
   */
  isActive(key) {
    return this.activeOperations.has(key)
  }

  /**
   * Get the number of active operations
   */
  getActiveCount() {
    return this.activeOperations.size
  }

  /**
   * Cleanup all operations (call on component unmount)
   */
  destroy() {
    this.cancelAll()
  }
}

/**
 * Hook for using AsyncController in React components
 * Note: Import React in the component that uses this hook
 */
export function useAsyncController(React) {
  const controller = new AsyncController()

  // Cleanup on unmount
  React.useEffect(() => {
    return () => controller.destroy()
  }, [])

  return controller
}

/**
 * Utility function to make any promise cancellable
 * @param {Promise} promise - Promise to make cancellable
 * @param {AbortSignal} signal - AbortSignal to listen for cancellation
 * @returns {Promise} - Cancellable promise
 */
export function makeCancellable(promise, signal) {
  if (signal?.aborted) {
    return Promise.reject(new Error('Operation was already cancelled'))
  }

  return new Promise((resolve, reject) => {
    // Listen for cancellation
    const onAbort = () => {
      reject(new Error('Operation was cancelled'))
    }

    signal?.addEventListener('abort', onAbort)

    promise
      .then(resolve)
      .catch(reject)
      .finally(() => {
        signal?.removeEventListener('abort', onAbort)
      })
  })
}