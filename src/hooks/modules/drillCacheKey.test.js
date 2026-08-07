import { describe, expect, it } from 'vitest'
import {
  buildBlockFingerprint,
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

  // Regression for the progress micro-drill leak: the eligible pool is narrowed by
  // currentBlock, so the block MUST be part of the cache key or a pool built for one
  // block (or for plain mixed practice) gets reused for another.
  it('changes eligible key when the currentBlock combos change', () => {
    const settings = {
      practiceMode: 'mixed',
      level: 'B1',
      verbType: 'all',
      selectedFamily: null,
      practicePronoun: 'all',
      useVoseo: false,
      useVosotros: false,
      irregularityFilterMode: 'tense'
    }
    const specific = { isSpecific: false }

    const noBlock = buildEligibleFormsKey('pool-a', settings, specific, 'due', {})
    const impfBlock = buildEligibleFormsKey(
      'pool-a',
      { ...settings, currentBlock: { combos: [{ mood: 'indicative', tense: 'impf' }] } },
      specific, 'due', {}
    )
    const subjBlock = buildEligibleFormsKey(
      'pool-a',
      { ...settings, currentBlock: { combos: [{ mood: 'subjunctive', tense: 'subjPres' }] } },
      specific, 'due', {}
    )

    expect(noBlock).not.toBe(impfBlock)
    expect(impfBlock).not.toBe(subjBlock)
  })

  it('fingerprints blocks by their targeting, not identity', () => {
    expect(buildBlockFingerprint(null)).toBe('no_block')
    expect(buildBlockFingerprint({ combos: [{ mood: 'indicative', tense: 'impf' }] }))
      .toBe('c:indicative|impf')
    expect(buildBlockFingerprint({ cells: [{ mood: 'subjunctive', tense: 'subjPres', person: '1s' }] }))
      .toBe('x:subjunctive|subjPres|1s')
  })
})
