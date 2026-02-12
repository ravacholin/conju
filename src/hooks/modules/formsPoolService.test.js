import { describe, expect, it, vi } from 'vitest'
import { createFormsCombinationIndex, resolveFormsPool } from './formsPoolService.js'

describe('formsPoolService', () => {
  it('builds mood/tense/person combination index', () => {
    const forms = [
      { mood: 'indicative', tense: 'pres', person: '1s', value: 'hablo' },
      { mood: 'indicative', tense: 'pres', person: '2s_tu', value: 'hablas' },
      { mood: 'subjunctive', tense: 'subjPres', person: '1s', value: 'hable' }
    ]

    const index = createFormsCombinationIndex(forms)
    expect(index.byMoodTense.get('indicative|pres')).toHaveLength(2)
    expect(index.byMoodTensePerson.get('indicative|pres|1s')).toHaveLength(1)
    expect(index.byMoodTensePerson.get('subjunctive|subjPres|1s')).toHaveLength(1)
  })

  it('stores and reuses precomputed index in cache', async () => {
    const forms = [{ mood: 'indicative', tense: 'pres', person: '1s', value: 'hablo' }]
    const generateAllFormsForRegion = vi.fn().mockResolvedValue(forms)
    const getFormsCacheKey = vi.fn().mockReturnValue('pool-key')

    const first = await resolveFormsPool({
      settings: { region: 'la_general' },
      region: 'la_general',
      cache: { signature: null, forms: null },
      generateAllFormsForRegion,
      getFormsCacheKey
    })

    const second = await resolveFormsPool({
      settings: { region: 'la_general' },
      region: 'la_general',
      cache: first.cache,
      generateAllFormsForRegion,
      getFormsCacheKey
    })

    expect(first.index.byMoodTense.get('indicative|pres')).toHaveLength(1)
    expect(second.reused).toBe(true)
    expect(second.index.byMoodTense.get('indicative|pres')).toHaveLength(1)
    expect(generateAllFormsForRegion).toHaveBeenCalledTimes(1)
  })
})
