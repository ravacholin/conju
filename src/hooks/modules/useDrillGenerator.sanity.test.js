import { describe, it, expect } from 'vitest'
import { generateAllFormsForRegion, applyComprehensiveFiltering } from './DrillFormFilters.js'

describe('Sanity: eligible forms for Vos + A1 + specific indicativo/presente + regulares', () => {
  it('should have eligible forms', async () => {
    const settings = {
      region: 'rioplatense',
      level: 'A1',
      practiceMode: 'specific',
      specificMood: 'indicative',
      specificTense: 'pres',
      verbType: 'regular',
      practicePronoun: 'all'
    }
    const forms = await generateAllFormsForRegion(settings.region, settings)
    const constraints = { isSpecific: true, specificMood: 'indicative', specificTense: 'pres' }
    const eligible = applyComprehensiveFiltering(forms, settings, constraints)
    expect(eligible.length).toBeGreaterThan(0)
  })
})

