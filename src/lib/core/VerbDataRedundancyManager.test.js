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
  })

  it('exposes primary verbs synchronously even before async initialization completes', async () => {
    vi.mock('../../data/verbs.js', () => ({ verbs: SAMPLE_VERBS }))

    const { getAllVerbsWithRedundancy, getRedundancyManager } = await import('./VerbDataRedundancyManager.js')

    const verbs = getAllVerbsWithRedundancy()
    expect(verbs).toEqual(SAMPLE_VERBS)
    expect(verbs.length).toBe(2)

    // Clean up to avoid leaking intervals in subsequent tests
    getRedundancyManager().destroy()
  })
})
