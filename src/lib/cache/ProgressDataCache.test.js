import { describe, it, expect, vi } from 'vitest'
import { ProgressDataCache } from './ProgressDataCache.js'

describe('ProgressDataCache cancellation', () => {
  it('rejects pending loads when aborted', async () => {
    const cache = new ProgressDataCache()
    const controller = new AbortController()

    const loadFn = vi.fn(({ signal }) => {
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => resolve('data'), 100)
        if (signal) {
          signal.addEventListener('abort', () => {
            clearTimeout(timer)
            reject(new Error('load aborted'))
          }, { once: true })
        }
      })
    })

    const promise = cache.get('user:test', loadFn, 'userStats', { signal: controller.signal })
    controller.abort()

    await expect(promise).rejects.toThrow('Operation was cancelled')
    expect(loadFn).toHaveBeenCalledTimes(1)
  })
})
