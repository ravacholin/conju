import { describe, expect, it } from 'vitest'
import { normalize } from '../utils/accentUtils.js'
import { buildGerund, buildParticiple } from './nonfiniteBuilder.js'
import { IRREGULAR_GOLDEN_FIXTURES } from '../data/fixtures/irregularGoldenFixtures.js'

describe('irregular golden - nonfinite', () => {
  it('matches canonical/expected gerund and participle fixtures', () => {
    IRREGULAR_GOLDEN_FIXTURES.nonfinite.forEach((entry) => {
      expect(normalize(buildGerund(entry.lemma))).toBe(normalize(entry.gerund))
      expect(normalize(buildParticiple(entry.lemma))).toBe(normalize(entry.participle))
    })
  })
})
