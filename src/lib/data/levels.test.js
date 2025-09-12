import { describe, it, expect } from 'vitest'
import { LEVELS, isPersonAllowed, buildItemSpec } from './levels.js'

describe('levels helpers', () => {
  it('isPersonAllowed respects defective behavior by level', () => {
    // A2 warns, so always true
    expect(isPersonAllowed('llover', '1sg', 'A2')).toBe(true)
    // B2 blocks invalid persons for unipersonales
    expect(isPersonAllowed('llover', '1sg', 'B2')).toBe(false)
    expect(isPersonAllowed('llover', '3sg', 'B2')).toBe(true)
  })

  it('buildItemSpec composes policies and clitics handling', () => {
    const specB2 = buildItemSpec({
      lemma: 'hablar', mood: 'imperativo', tense: 'impAff', person: '2sg', level: 'B2', treatment: 'vos', clitics: 'me',
    })
    expect(specB2.target.tense).toBe('impAff')
    expect(specB2.policies.level).toBe('B2')
    // B2 clitics position is any, exact string is preserved when provided
    expect(specB2.policies.clitics.exact).toBe('me')

    const specC1 = buildItemSpec({
      lemma: 'hablar', mood: 'imperativo', tense: 'impAff', person: '2sg', level: 'C1', treatment: 'vos', clitics: 'me lo',
    })
    // For enclitic position, exact string must be null
    expect(specC1.policies.clitics.position).toBe('enclitic')
    expect(specC1.policies.clitics.exact).toBeNull()
  })

  it('buildItemSpec variant notes reflect enforceVariantSe flag and level variants', () => {
    const specC1Enforce = buildItemSpec({
      lemma: 'amar', mood: 'subjuntivo', tense: 'subjImpf', person: '3pl', level: 'C1', enforceVariantSe: true,
    })
    expect(specC1Enforce.policies.variants.note).toBe('forma en -se')

    const specC1Default = buildItemSpec({
      lemma: 'amar', mood: 'subjuntivo', tense: 'subjImpf', person: '3pl', level: 'C1',
    })
    expect(specC1Default.policies.variants.note).toBe('variante especificada en consigna')
  })
})

