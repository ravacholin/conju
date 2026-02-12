import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('../../lib/core/verbDataService.js', () => ({
  getFormsForRegion: vi.fn()
}))

import {
  generateAllFormsForRegion,
  clearFormsCache,
  filterForSpecificPractice
} from './DrillFormFilters.js'
import { getFormsForRegion } from '../../lib/core/verbDataService.js'
import { createFormsCombinationIndex } from './formsPoolService.js'

describe('DrillFormFilters - global pool', () => {
  const sharedForm = {
    lemma: 'comer',
    mood: 'indicative',
    tense: 'pres',
    person: '1s',
    value: 'como'
  }
  const rioplatenseOnly = {
    lemma: 'hablar',
    mood: 'indicative',
    tense: 'pres',
    person: '2s_vos',
    value: 'hablás'
  }
  const peninsularOnly = {
    lemma: 'hablar',
    mood: 'indicative',
    tense: 'pres',
    person: '2p_vosotros',
    value: 'habláis'
  }
  const laGeneralOnly = {
    lemma: 'hablar',
    mood: 'indicative',
    tense: 'pres',
    person: '2p_ustedes',
    value: 'hablan'
  }

  beforeEach(() => {
    clearFormsCache()
    vi.clearAllMocks()
    getFormsForRegion.mockImplementation(async region => {
      if (region === 'rioplatense') {
        return [sharedForm, rioplatenseOnly]
      }
      if (region === 'peninsular') {
        return [sharedForm, peninsularOnly]
      }
      if (region === 'la_general') {
        return [sharedForm, laGeneralOnly]
      }
      return []
    })
  })

  it('incluye formas exclusivas de la_general en el pool global', async () => {
    const forms = await generateAllFormsForRegion('global', {})

    expect(getFormsForRegion).toHaveBeenCalledWith('la_general', {})
    expect(forms).toEqual(
      expect.arrayContaining([
        expect.objectContaining(laGeneralOnly)
      ])
    )
  })
})

describe('DrillFormFilters - specific practice indexing', () => {
  beforeEach(() => {
    clearFormsCache()
  })

  it('filters a specific mood/tense without scanning every call', () => {
    const forms = [
      { lemma: 'hablar', mood: 'indicative', tense: 'pres', person: '1s', value: 'hablo' },
      { lemma: 'hablar', mood: 'indicative', tense: 'pretIndef', person: '1s', value: 'hable' },
      { lemma: 'comer', mood: 'subjunctive', tense: 'subjPres', person: '1s', value: 'coma' }
    ]

    const specificConstraints = {
      isSpecific: true,
      specificMood: 'indicative',
      specificTense: 'pres'
    }

    const result = filterForSpecificPractice(forms, specificConstraints)

    expect(result).toHaveLength(1)
    expect(result[0].tense).toBe('pres')
    expect(result[0].mood).toBe('indicative')
  })

  it('supports mixed imperative specific filtering', () => {
    const forms = [
      { lemma: 'hablar', mood: 'imperative', tense: 'impAff', person: '2s_tu', value: 'habla' },
      { lemma: 'hablar', mood: 'imperative', tense: 'impNeg', person: '2s_tu', value: 'no hables' },
      { lemma: 'hablar', mood: 'indicative', tense: 'pres', person: '1s', value: 'hablo' }
    ]

    const specificConstraints = {
      isSpecific: true,
      specificMood: 'imperative',
      specificTense: 'impMixed'
    }

    const result = filterForSpecificPractice(forms, specificConstraints)
    const tenses = new Set(result.map((item) => item.tense))

    expect(result).toHaveLength(2)
    expect(tenses.has('impAff')).toBe(true)
    expect(tenses.has('impNeg')).toBe(true)
  })

  it('filters by specific person when provided', () => {
    const forms = [
      { lemma: 'hablar', mood: 'indicative', tense: 'pres', person: '1s', value: 'hablo' },
      { lemma: 'hablar', mood: 'indicative', tense: 'pres', person: '2s_tu', value: 'hablas' }
    ]

    const specificConstraints = {
      isSpecific: true,
      specificMood: 'indicative',
      specificTense: 'pres',
      specificPerson: '2s_tu'
    }

    const result = filterForSpecificPractice(forms, specificConstraints)

    expect(result).toHaveLength(1)
    expect(result[0].person).toBe('2s_tu')
  })

  it('prioritizes region-aware buckets when index contains multiple regions', () => {
    const forms = [
      { lemma: 'hablar', mood: 'indicative', tense: 'pres', person: '2s_tu', value: 'hablas', region: 'la_general' },
      { lemma: 'hablar', mood: 'indicative', tense: 'pres', person: '2s_tu', value: 'hablas', region: 'peninsular' },
      { lemma: 'hablar', mood: 'indicative', tense: 'pres', person: '2s_vos', value: 'hablás', region: 'rioplatense' }
    ]
    const index = createFormsCombinationIndex(forms)
    const specificConstraints = {
      isSpecific: true,
      specificMood: 'indicative',
      specificTense: 'pres',
      specificPerson: '2s_tu'
    }

    const result = filterForSpecificPractice(forms, specificConstraints, index, 'la_general')

    expect(result).toHaveLength(1)
    expect(result[0].region).toBe('la_general')
  })
})
