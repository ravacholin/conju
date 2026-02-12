import { describe, expect, it } from 'vitest'
import {
  buildEligibleFormsKey,
  buildReviewFilterFingerprint,
  shouldCacheEligibleForms
} from './drillCacheKey.js'

describe('drillCacheKey', () => {
  it('creates stable fingerprints for equivalent review filters', () => {
    const a = buildReviewFilterFingerprint('due', { urgency: 'high', mood: 'indicative' })
    const b = buildReviewFilterFingerprint('due', { mood: 'indicative', urgency: 'high' })
    expect(a).toBe(b)
  })

  it('changes eligible key when review filter changes', () => {
    const settings = {
      practiceMode: 'review',
      level: 'B1',
      verbType: 'all',
      selectedFamily: null,
      practicePronoun: 'all',
      useVoseo: false,
      useVosotros: false,
      irregularityFilterMode: 'tense'
    }
    const specific = { isSpecific: false }
    const base = buildEligibleFormsKey('pool-a', settings, specific, 'due', { urgency: 'high' })
    const changed = buildEligibleFormsKey('pool-a', settings, specific, 'due', { urgency: 'low' })
    expect(base).not.toBe(changed)
  })

  it('disables eligible cache only for regular mode', () => {
    expect(shouldCacheEligibleForms({ verbType: 'regular' })).toBe(false)
    expect(shouldCacheEligibleForms({ verbType: 'all' })).toBe(true)
  })
})
