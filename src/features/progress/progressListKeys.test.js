import { describe, it, expect } from 'vitest'
import { buildStableListKey } from './progressListKeys.js'

describe('buildStableListKey', () => {
  it('builds deterministic keys from object fields', () => {
    const rec = {
      type: 'weak_area_practice',
      title: 'Reforzar área débil',
      targetCombination: { mood: 'subjunctive', tense: 'subjImpf' },
      priority: 80
    }

    expect(
      buildStableListKey('practice-rec', rec, ['type', 'title', 'targetCombination.mood', 'targetCombination.tense', 'priority'])
    ).toBe('practice-rec|weak_area_practice|Reforzar área débil|subjunctive|subjImpf|80')
  })

  it('supports primitive values and fallback keys', () => {
    expect(buildStableListKey('tag', 'stem_change')).toBe('tag|stem_change')
    expect(buildStableListKey('action', {}, ['id', 'type'], 'fallback-1')).toBe('action|fallback-1')
  })
})
