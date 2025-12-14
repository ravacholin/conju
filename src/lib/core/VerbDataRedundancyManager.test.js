import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const SAMPLE_VERBS = [
  {
    id: 'amar',
    lemma: 'amar',
    type: 'regular',
    paradigms: [
      {
        regionTags: ['la_general'],
        forms: [
          { mood: 'indicative', tense: 'pres', person: '1s', value: 'amo' }
        ]
      }
    ]
  },
  {
    id: 'ser',
    lemma: 'ser',
    type: 'irregular',
    paradigms: [
      {
        regionTags: ['la_general'],
        forms: [
          { mood: 'indicative', tense: 'pres', person: '1s', value: 'soy' }
        ]
      }
    ]
  }
]

describe('VerbDataRedundancyManager immediate availability', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.unmock('../../data/verbs.js')
    vi.unmock('../../data/verbsLazy.js')
  })

  it('exposes emergency verbs synchronously and upgrades after initialization', async () => {
    vi.mock('../../data/verbsLazy.js', () => ({
      getVerbs: vi.fn(async () => SAMPLE_VERBS)
    }))

    const { getAllVerbsWithRedundancy, getRedundancyManager, initializeRedundancyManager } = await import('./VerbDataRedundancyManager.js')

    const immediateVerbs = getAllVerbsWithRedundancy()
    expect(Array.isArray(immediateVerbs)).toBe(true)
    expect(immediateVerbs.length).toBeGreaterThan(0)

    await initializeRedundancyManager()
    const upgradedVerbs = getAllVerbsWithRedundancy()
    expect(upgradedVerbs).toEqual(SAMPLE_VERBS)

    // Clean up to avoid leaking intervals in subsequent tests
    getRedundancyManager().destroy()
  })
})
