import { describe, it, expect, vi } from 'vitest'
import { retryDynamicImport, lazyWithRetry } from './dynamicImportRetry.js'

describe('dynamicImportRetry', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock window.location.reload
    Object.defineProperty(window, 'location', {
      value: { reload: vi.fn() },
      writable: true
    })
  })

  describe('retryDynamicImport', () => {
    it('should succeed on first attempt when import works', async () => {
      const mockImportFn = vi.fn().mockResolvedValue({ default: 'component' })

      const result = await retryDynamicImport(mockImportFn, 2)

      expect(result).toEqual({ default: 'component' })
      expect(mockImportFn).toHaveBeenCalledTimes(1)
    })

    it('should retry on failure and eventually succeed', async () => {
      const mockImportFn = vi.fn()
        .mockRejectedValueOnce(new Error('Failed to fetch'))
        .mockResolvedValueOnce({ default: 'component' })

      const result = await retryDynamicImport(mockImportFn, 2)

      expect(result).toEqual({ default: 'component' })
      expect(mockImportFn).toHaveBeenCalledTimes(2)
    })

    it('should clear cache on first retry attempt', async () => {
      const mockCache = {
        delete: vi.fn().mockResolvedValue(true)
      }
      global.caches = {
        open: vi.fn().mockResolvedValue(mockCache)
      }

      const mockImportFn = vi.fn()
        .mockRejectedValueOnce(new Error('Failed to fetch https://example.com/chunk.js'))
        .mockResolvedValueOnce({ default: 'component' })

      await retryDynamicImport(mockImportFn, 2)

      expect(global.caches.open).toHaveBeenCalledWith('dynamic-assets')
      expect(mockCache.delete).toHaveBeenCalledWith('https://example.com/chunk.js')
    })

    it('should reload page after all retries fail', async () => {
      const mockImportFn = vi.fn().mockRejectedValue(new Error('Persistent failure'))

      await expect(retryDynamicImport(mockImportFn, 1)).rejects.toThrow('Persistent failure')

      expect(mockImportFn).toHaveBeenCalledTimes(2) // initial + 1 retry
      expect(window.location.reload).toHaveBeenCalled()
    })

    it('should attempt retries when import fails', async () => {
      const mockImportFn = vi.fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockRejectedValueOnce(new Error('Second failure'))
        .mockRejectedValue(new Error('Final failure'))

      await expect(retryDynamicImport(mockImportFn, 1)).rejects.toThrow()

      // Should have attempted at least initial + 1 retry
      expect(mockImportFn).toHaveBeenCalledTimes(2)
    })
  })

  describe('lazyWithRetry', () => {
    it('should create a function that calls retryDynamicImport', async () => {
      const mockImportFn = vi.fn().mockResolvedValue({ default: 'component' })
      const lazyFn = lazyWithRetry(mockImportFn, 1)

      const result = await lazyFn()

      expect(result).toEqual({ default: 'component' })
      expect(mockImportFn).toHaveBeenCalledTimes(1)
    })

    it('should pass maxRetries to retryDynamicImport', async () => {
      const mockImportFn = vi.fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockResolvedValueOnce({ default: 'component' })

      const lazyFn = lazyWithRetry(mockImportFn, 3)

      const result = await lazyFn()

      expect(result).toEqual({ default: 'component' })
      expect(mockImportFn).toHaveBeenCalledTimes(2)
    })
  })

  describe('edge cases', () => {
    it('should handle missing caches API gracefully', async () => {
      global.caches = undefined

      const mockImportFn = vi.fn()
        .mockRejectedValueOnce(new Error('Failed to fetch'))
        .mockResolvedValueOnce({ default: 'component' })

      const result = await retryDynamicImport(mockImportFn, 1)

      expect(result).toEqual({ default: 'component' })
    })

    it('should handle cache operations that fail', async () => {
      const mockCache = {
        delete: vi.fn().mockRejectedValue(new Error('Cache error'))
      }
      global.caches = {
        open: vi.fn().mockResolvedValue(mockCache)
      }

      const mockImportFn = vi.fn()
        .mockRejectedValueOnce(new Error('Failed to fetch'))
        .mockResolvedValueOnce({ default: 'component' })

      const result = await retryDynamicImport(mockImportFn, 1)

      expect(result).toEqual({ default: 'component' })
      expect(mockCache.delete).toHaveBeenCalled()
    })

    it('should handle non-browser environment', async () => {
      const originalWindow = global.window
      global.window = undefined

      const mockImportFn = vi.fn().mockRejectedValue(new Error('Failed'))

      await expect(retryDynamicImport(mockImportFn, 0)).rejects.toThrow('Failed')

      global.window = originalWindow
    })

    it('should not throw when window is undefined and import succeeds', async () => {
      const originalWindow = global.window
      const originalCaches = global.caches

      global.window = undefined
      global.caches = undefined

      const mockImportFn = vi.fn().mockResolvedValue({ default: 'component' })

      await expect(retryDynamicImport(mockImportFn, 1)).resolves.toEqual({ default: 'component' })

      global.window = originalWindow
      global.caches = originalCaches
    })
  })
})
