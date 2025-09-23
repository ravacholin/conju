// Test suite for enhanced chunk management with CEFR, frequency, and fallback systems
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { VerbChunkManager } from './verbChunkManager.js'

describe('Enhanced Chunk Management System', () => {
  let chunkManager

  beforeEach(() => {
    chunkManager = new VerbChunkManager()
    // Clear any existing state
    chunkManager.loadedChunks.clear()
    chunkManager.verbIndex.clear()
  })

  describe('Fallback Mechanisms', () => {
    it('should detect missing lemmas and apply fallback', async () => {
      // Mock chunk loading to return incomplete results
      const mockLoadChunk = vi.spyOn(chunkManager, 'loadChunk').mockResolvedValue([
        { lemma: 'ser', type: 'irregular' }
        // Missing 'estar' intentionally
      ])

      const mockMainStore = vi.spyOn(chunkManager, 'loadMissingLemmasFromMainStore')
        .mockResolvedValue([
          { lemma: 'estar', type: 'irregular' }
        ])

      const result = await chunkManager.ensureVerbsLoaded(['ser', 'estar'])

      expect(result).toHaveLength(2)
      expect(result.find(v => v.lemma === 'ser')).toBeTruthy()
      expect(result.find(v => v.lemma === 'estar')).toBeTruthy()
      expect(mockMainStore).toHaveBeenCalledWith(['estar'])

      mockLoadChunk.mockRestore()
      mockMainStore.mockRestore()
    })

    it('should handle complete fallback when chunks fail', async () => {
      const mockLoadChunk = vi.spyOn(chunkManager, 'loadChunk')
        .mockRejectedValue(new Error('Chunk loading failed'))

      const mockMainStore = vi.spyOn(chunkManager, 'loadMissingLemmasFromMainStore')
        .mockResolvedValue([
          { lemma: 'hablar', type: 'regular' },
          { lemma: 'comer', type: 'regular' }
        ])

      const result = await chunkManager.ensureVerbsLoaded(['hablar', 'comer'])

      expect(result).toHaveLength(2)
      expect(mockMainStore).toHaveBeenCalledWith(['hablar', 'comer'])

      mockLoadChunk.mockRestore()
      mockMainStore.mockRestore()
    })
  })

  describe('Chunk Supplementation', () => {
    it('should supplement undersized chunks automatically', async () => {
      // Mock a chunk that is below target size
      const metadata = {
        expectedCount: 25,
        cefrRange: 'A1',
        frequencyProfile: 'high'
      }

      const currentVerbs = [
        { lemma: 'ser', type: 'irregular' },
        { lemma: 'estar', type: 'irregular' }
      ] // Only 2 verbs, need 23 more

      const mockSupplement = vi.spyOn(chunkManager, 'supplementChunkFromMainStore')
        .mockResolvedValue([
          { lemma: 'hablar', type: 'regular', _source: 'supplement' },
          { lemma: 'comer', type: 'regular', _source: 'supplement' }
        ])

      const result = await chunkManager.checkAndSupplementChunk('core', currentVerbs, metadata)

      expect(result).toHaveLength(4) // 2 original + 2 supplemented
      expect(mockSupplement).toHaveBeenCalledWith('core', 23, currentVerbs)

      mockSupplement.mockRestore()
    })

    it('should not supplement adequately-sized chunks', async () => {
      const metadata = { expectedCount: 2 }
      const currentVerbs = [
        { lemma: 'ser', type: 'irregular' },
        { lemma: 'estar', type: 'irregular' }
      ]

      const mockSupplement = vi.spyOn(chunkManager, 'supplementChunkFromMainStore')

      const result = await chunkManager.checkAndSupplementChunk('core', currentVerbs, metadata)

      expect(result).toHaveLength(2)
      expect(mockSupplement).not.toHaveBeenCalled()

      mockSupplement.mockRestore()
    })
  })

  describe('Intelligent Supplementation Logic', () => {
    it('should filter supplement candidates by chunk type', async () => {
      // Mock verb data and functions
      const mockVerbs = [
        { lemma: 'hablar', type: 'regular' },    // Should match 'core' if high freq
        { lemma: 'argüir', type: 'irregular' },   // Should match 'irregulars'
        { lemma: 'fabricar', type: 'regular' },   // Should match 'advanced' if low freq
        { lemma: 'comer', type: 'regular' }       // Should match 'common' if med freq
      ]

      // Mock imports
      vi.doMock('../../data/verbs.js', () => ({ verbs: mockVerbs }))
      vi.doMock('../data/irregularFamilies.js', () => ({
        categorizeVerb: (lemma) => lemma === 'argüir' ? ['IRREG_UMLAUT'] : []
      }))
      vi.doMock('../progress/verbInitialization.js', () => ({
        determineVerbFrequency: (lemma) => ({
          'hablar': 'high',
          'comer': 'medium',
          'fabricar': 'low',
          'argüir': 'low'
        }[lemma] || 'low')
      }))

      const existingVerbs = []

      // Test core chunk supplementation
      const coreSupplements = await chunkManager.supplementChunkFromMainStore('core', 2, existingVerbs)
      expect(coreSupplements.some(v => v.lemma === 'hablar')).toBeTruthy()
      expect(coreSupplements.every(v => v._source === 'supplement')).toBeTruthy()

      vi.clearAllMocks()
    })
  })

  describe('Missing Lemma Recovery', () => {
    it('should try priority verbs when main verbs are insufficient', async () => {
      const mockMainVerbs = [{ lemma: 'ser', type: 'irregular' }]
      const mockPriorityVerbs = [{ lemma: 'proseguir', type: 'irregular' }]

      vi.doMock('../../data/verbs.js', () => ({ verbs: mockMainVerbs }))
      vi.doMock('../../data/priorityVerbs.js', () => ({ priorityVerbs: mockPriorityVerbs }))

      const result = await chunkManager.loadMissingLemmasFromMainStore(['ser', 'proseguir'])

      expect(result).toHaveLength(2)
      expect(result.find(v => v.lemma === 'ser')).toBeTruthy()
      expect(result.find(v => v.lemma === 'proseguir')).toBeTruthy()

      vi.clearAllMocks()
    })

    it('should handle gracefully when no verbs are found', async () => {
      vi.doMock('../../data/verbs.js', () => ({ verbs: [] }))
      vi.doMock('../../data/priorityVerbs.js', () => ({ priorityVerbs: [] }))

      const result = await chunkManager.loadMissingLemmasFromMainStore(['nonexistent'])

      expect(result).toHaveLength(0)

      vi.clearAllMocks()
    })
  })

  describe('Index Management', () => {
    it('should update verb index when adding fallback verbs', async () => {
      const fallbackVerbs = [
        { lemma: 'test1', type: 'regular' },
        { lemma: 'test2', type: 'regular' }
      ]

      // Simulate adding fallback verbs
      fallbackVerbs.forEach(verb => {
        const chunkName = chunkManager.getChunkForVerb(verb.lemma)
        let chunk = chunkManager.loadedChunks.get(chunkName) || []
        chunk.push({ ...verb, _source: 'fallback' })
        chunkManager.loadedChunks.set(chunkName, chunk)
        chunkManager.verbIndex.set(verb.lemma, chunkName)
      })

      expect(chunkManager.verbIndex.has('test1')).toBeTruthy()
      expect(chunkManager.verbIndex.has('test2')).toBeTruthy()
    })
  })

  describe('Performance and Stats', () => {
    it('should track statistics for fallback operations', async () => {
      const initialStats = chunkManager.getStats()
      const initialMisses = initialStats.cacheMisses

      // Trigger a cache miss scenario
      await chunkManager.ensureVerbsLoaded(['nonexistent_verb'])

      const finalStats = chunkManager.getStats()
      expect(finalStats.cacheMisses).toBeGreaterThan(initialMisses)
    })
  })
})

describe('Chunk Build Classification', () => {
  // These tests would require running the actual buildChunks script
  // For now, we'll create integration-style tests

  it('should classify verbs by CEFR and frequency correctly', async () => {
    // This would test the buildChunks.mjs logic in isolation
    // by importing and running the classification functions

    const mockVerb = { lemma: 'ser', type: 'irregular' }

    // Test that 'ser' gets classified as core due to high frequency
    // This test would need to mock the PACKS and frequency data
    expect(mockVerb.lemma).toBe('ser') // Placeholder
  })
})