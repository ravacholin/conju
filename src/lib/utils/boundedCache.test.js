import { describe, expect, it } from 'vitest'
import { createBoundedCache } from './boundedCache.js'

describe('createBoundedCache', () => {
  it('evicts the oldest entry when max size is exceeded', () => {
    const cache = createBoundedCache({ maxSize: 2 })

    cache.set('first', 1)
    cache.set('second', 2)
    cache.set('third', 3)

    expect(cache.get('first')).toBeUndefined()
    expect(cache.get('second')).toBe(2)
    expect(cache.get('third')).toBe(3)
  })

  it('evicts expired entries when accessed', () => {
    let currentTime = 0
    const now = () => currentTime
    const cache = createBoundedCache({ maxSize: 2, maxAgeMinutes: 1, now })

    cache.set('recent', 'keep')
    cache.set('old', 'remove')

    currentTime = 30 * 1000
    expect(cache.get('recent')).toBe('keep')

    currentTime = 2 * 60 * 1000
    expect(cache.get('old')).toBeUndefined()
    expect(cache.has('old')).toBe(false)
  })
})
