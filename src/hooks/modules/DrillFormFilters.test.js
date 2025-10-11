import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('../../lib/core/verbDataService.js', () => ({
  getFormsForRegion: vi.fn()
}))

import { generateAllFormsForRegion, clearFormsCache } from './DrillFormFilters.js'
import { getFormsForRegion } from '../../lib/core/verbDataService.js'

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
