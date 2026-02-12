import { describe, expect, it } from 'vitest'
import { normalize } from '../utils/accentUtils.js'
import { categorizeVerb } from '../data/irregularFamilies.js'
import { IRREGULAR_GOLDEN_FIXTURES } from '../data/fixtures/irregularGoldenFixtures.js'
import { getVerbForms } from './verbDataService.js'

describe('irregular golden - strong preterite', () => {
  it('keeps expected families and la_general forms for top irregular verbs', async () => {
    for (const fixture of IRREGULAR_GOLDEN_FIXTURES.preteriteStrong) {
      const families = categorizeVerb(fixture.lemma)
      expect(families).toContain(fixture.family)

      const forms = await getVerbForms(fixture.lemma, 'la_general')
      for (const [person, expectedValue] of Object.entries(fixture.forms)) {
        const match = forms.find(
          (form) =>
            form.mood === 'indicative' &&
            form.tense === 'pretIndef' &&
            form.person === person
        )

        expect(match, `${fixture.lemma} missing pretIndef ${person}`).toBeTruthy()
        expect(normalize(match.value)).toBe(normalize(expectedValue))
      }
    }
  })
})
