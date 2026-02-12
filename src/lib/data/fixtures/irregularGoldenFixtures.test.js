import { describe, expect, it } from 'vitest'
import { IRREGULAR_GOLDEN_FIXTURES } from './irregularGoldenFixtures.js'

describe('irregularGoldenFixtures', () => {
  it('defines stable nonfinite fixtures', () => {
    expect(IRREGULAR_GOLDEN_FIXTURES.nonfinite.length).toBeGreaterThanOrEqual(8)
    IRREGULAR_GOLDEN_FIXTURES.nonfinite.forEach((entry) => {
      expect(entry.lemma).toBeTruthy()
      expect(entry.gerund).toBeTruthy()
      expect(entry.participle).toBeTruthy()
    })
  })

  it('defines stable preterite strong fixtures', () => {
    expect(IRREGULAR_GOLDEN_FIXTURES.preteriteStrong.length).toBeGreaterThanOrEqual(7)
    IRREGULAR_GOLDEN_FIXTURES.preteriteStrong.forEach((entry) => {
      expect(entry.lemma).toBeTruthy()
      expect(entry.family).toBeTruthy()
      expect(entry.forms?.['1s']).toBeTruthy()
      expect(entry.forms?.['3s']).toBeTruthy()
      expect(entry.forms?.['3p']).toBeTruthy()
    })
  })
})
