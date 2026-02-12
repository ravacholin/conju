import { describe, expect, it } from 'vitest'
import {
  IRREGULAR_CANONICAL,
  getCanonicalFutureRoot,
  getCanonicalGerund,
  getCanonicalParticiple,
  validateIrregularCanonical
} from './irregularCanonical.js'

describe('irregularCanonical', () => {
  it('exposes canonical entries for nonfinite forms', () => {
    expect(getCanonicalGerund('decir')).toBe('diciendo')
    expect(getCanonicalParticiple('hacer')).toMatchObject({
      primary: 'hecho'
    })
  })

  it('exposes canonical future/conditional roots', () => {
    expect(getCanonicalFutureRoot('tener')).toMatchObject({
      root: 'tendr'
    })
  })

  it('contains normalized canonical structure', () => {
    expect(IRREGULAR_CANONICAL).toHaveProperty('nonfinite.gerund')
    expect(IRREGULAR_CANONICAL).toHaveProperty('nonfinite.participle')
    expect(IRREGULAR_CANONICAL).toHaveProperty('finite.futureConditionalRoots')
    expect(IRREGULAR_CANONICAL.nonfinite.participle.freír.alternates).toEqual(['freído'])
  })

  it('passes canonical self-validation', () => {
    const result = validateIrregularCanonical()
    expect(result.valid).toBe(true)
    expect(result.errors).toEqual([])
  })
})
