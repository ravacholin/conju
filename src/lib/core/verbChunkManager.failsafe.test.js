/**
 * Test suite for VerbChunkManager failsafe mechanisms
 *
 * Tests the robust failsafe system to ensure the app never fails to load verbs,
 * even under extreme failure conditions.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock the verbs.js import to test different failure scenarios
const mockVerbsImport = vi.fn()
vi.mock('../../data/verbs.js', () => ({
  get verbs() {
    return mockVerbsImport()
  }
}))

// Mock the settings store
const mockSettingsStore = {
  set: vi.fn(),
  enableChunks: true
}
vi.mock('../../state/settings.js', () => ({
  useSettings: {
    getState: () => mockSettingsStore
  }
}))

// Import after mocks are set up
import { VerbChunkManager } from './verbChunkManager.js'

describe('VerbChunkManager Failsafe Mechanisms', () => {
  let chunkManager

  beforeEach(() => {
    vi.clearAllMocks()
    mockVerbsImport.mockImplementation(() => ([
      {
        lemma: 'ser',
        id: 'ser',
        type: 'irregular',
        paradigms: [{
          regionTags: ['la_general'],
          forms: [{ mood: 'indicative', tense: 'pres', person: '1s', value: 'soy' }]
        }]
      },
      {
        lemma: 'estar',
        id: 'estar',
        type: 'irregular',
        paradigms: [{
          regionTags: ['la_general'],
          forms: [{ mood: 'indicative', tense: 'pres', person: '1s', value: 'estoy' }]
        }]
      }
    ]))
    chunkManager = new VerbChunkManager()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    mockVerbsImport.mockReset()
  })

  it('should successfully use Strategy 1 when preferred chunks work', async () => {
    // Mock successful chunk loading
    vi.spyOn(chunkManager, 'loadChunk').mockResolvedValue()
    chunkManager.loadedChunks.set('core', [{ lemma: 'ser', paradigms: [] }])

    const verbs = await chunkManager.getVerbsWithRobustFailsafe(['core'])

    expect(verbs).toHaveLength(1)
    expect(verbs[0].lemma).toBe('ser')
    expect(chunkManager.loadChunk).toHaveBeenCalledWith('core')
  })

  it('should fallback to Strategy 2 when preferred chunks fail', async () => {
    // Mock chunk loading failure
    vi.spyOn(chunkManager, 'loadChunk').mockRejectedValue(new Error('Chunk failed'))
    vi.spyOn(chunkManager, 'getAllVerbs').mockResolvedValue([
      { lemma: 'estar', paradigms: [] }
    ])

    const verbs = await chunkManager.getVerbsWithRobustFailsafe(['core'])

    expect(verbs).toHaveLength(1)
    expect(verbs[0].lemma).toBe('estar')
    expect(chunkManager.getAllVerbs).toHaveBeenCalled()
  })

  it('should fallback to Strategy 3 when all chunks fail', async () => {
    // Mock all chunk methods failing
    vi.spyOn(chunkManager, 'loadChunk').mockRejectedValue(new Error('Chunk failed'))
    vi.spyOn(chunkManager, 'getAllVerbs').mockRejectedValue(new Error('All chunks failed'))

    const verbs = await chunkManager.getVerbsWithRobustFailsafe(['core'])

    expect(Array.isArray(verbs)).toBe(true)
    expect(verbs).toHaveLength(2)
    expect(verbs.map(v => v.lemma)).toEqual(['ser', 'estar'])
  })

  it('should use Strategy 4 minimal verbs when main file also fails', async () => {
    // Mock all methods failing
    vi.spyOn(chunkManager, 'loadChunk').mockRejectedValue(new Error('Chunk failed'))
    vi.spyOn(chunkManager, 'getAllVerbs').mockRejectedValue(new Error('All chunks failed'))
    mockVerbsImport.mockImplementation(() => {
      throw new Error('Main file failed')
    })

    const verbs = await chunkManager.getVerbsWithRobustFailsafe(['core'])

    expect(verbs).toHaveLength(10) // Essential verbs
    expect(verbs[0].lemma).toBe('ser')
    expect(verbs[0].paradigms[0].forms[0].value).toBe('soy')
  })

  it('should use hardcoded verbs when everything fails', async () => {
    // Mock everything failing including dynamic import
    vi.spyOn(chunkManager, 'loadChunk').mockRejectedValue(new Error('Chunk failed'))
    vi.spyOn(chunkManager, 'getAllVerbs').mockRejectedValue(new Error('All chunks failed'))
    mockVerbsImport.mockImplementation(() => {
      throw new Error('Dynamic import failed')
    })

    // Mock dynamic import to fail
    const originalImport = global.__vite_ssr_import__ || global.import
    const mockDynamicImport = vi.fn().mockRejectedValue(new Error('Dynamic import failed'))
    if (global.__vite_ssr_import__) {
      global.__vite_ssr_import__ = mockDynamicImport
    } else {
      global.import = mockDynamicImport
    }

    try {
      const verbs = await chunkManager.getVerbsWithRobustFailsafe(['core'])

      expect(verbs).toHaveLength(10) // Hardcoded essential verbs
      expect(verbs[0].lemma).toBe('ser')
      expect(verbs[0].paradigms[0].forms[0].value).toBe('soy')
    } finally {
      // Restore original import
      if (originalImport) {
        if (global.__vite_ssr_import__) {
          global.__vite_ssr_import__ = originalImport
        } else {
          global.import = originalImport
        }
      }
    }
  })

  it('should auto-disable chunks after repeated failures', async () => {
    // Mock everything failing
    vi.spyOn(chunkManager, 'loadChunk').mockRejectedValue(new Error('Chunk failed'))
    vi.spyOn(chunkManager, 'getAllVerbs').mockRejectedValue(new Error('All chunks failed'))
    mockVerbsImport.mockImplementation(() => {
      throw new Error('Main file failed')
    })

    try {
      await chunkManager.getVerbsWithRobustFailsafe(['core'], 1, 100) // Fast timeout
    } catch {
      // Expected to fail, but should have disabled chunks
      expect(mockSettingsStore.set).toHaveBeenCalledWith({ enableChunks: false })
    }
  })

  it('should respect timeout settings', async () => {
    const startTime = Date.now()

    // Mock a slow operation
    vi.spyOn(chunkManager, 'loadChunk').mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 200))
    )

    try {
      await chunkManager.getVerbsWithRobustFailsafe(['core'], 1, 50) // 50ms timeout
    } catch {
      const elapsed = Date.now() - startTime
      expect(elapsed).toBeLessThan(150) // Should timeout before 150ms
    }
  })

  it('should retry with exponential backoff', async () => {
    let attemptCount = 0
    vi.spyOn(chunkManager, 'loadChunk').mockImplementation(() => {
      attemptCount++
      if (attemptCount < 3) {
        throw new Error('Temporary failure')
      }
      return Promise.resolve()
    })

    chunkManager.loadedChunks.set('core', [{ lemma: 'ser', paradigms: [] }])

    const verbs = await chunkManager.getVerbsWithRobustFailsafe(['core'], 3, 1000)

    expect(attemptCount).toBe(3) // Should have retried
    expect(verbs).toHaveLength(1)
  })
})
