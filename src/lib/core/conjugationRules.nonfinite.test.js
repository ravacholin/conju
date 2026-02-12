import { describe, expect, it } from 'vitest'
import { hasIrregularParticiple } from './conjugationRules.js'

describe('conjugationRules nonfinite irregulars', () => {
  it('detects canonical irregular participles', () => {
    expect(hasIrregularParticiple('hacer')).toBe(true)
    expect(hasIrregularParticiple('decir')).toBe(true)
  })

  it('keeps legacy extended participles while migration is in progress', () => {
    expect(hasIrregularParticiple('satisfacer')).toBe(true)
  })

  it('returns false for regular participles', () => {
    expect(hasIrregularParticiple('hablar')).toBe(false)
  })
})
