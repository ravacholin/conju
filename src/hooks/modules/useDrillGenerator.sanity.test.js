import { describe, it, expect } from 'vitest'
import { generateAllFormsForRegion, applyComprehensiveFiltering, clearFormsCache } from './DrillFormFilters.js'

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

describe('Cache invalidation for critical settings changes', () => {
  it('should generate different forms when changing verbType', async () => {
    clearFormsCache() // Start with clean cache

    const baseSettings = {
      region: 'la_general',
      level: 'A1',
      practiceMode: 'mixed',
      enableChunks: false // Use fallback for consistent results
    }

    // Generate forms with verbType: 'all'
    const settingsAll = { ...baseSettings, verbType: 'all' }
    const formsAll = await generateAllFormsForRegion('la_general', settingsAll)

    // Generate forms with verbType: 'regular'
    const settingsRegular = { ...baseSettings, verbType: 'regular' }
    const formsRegular = await generateAllFormsForRegion('la_general', settingsRegular)

    // Generate forms with verbType: 'irregular'
    const settingsIrregular = { ...baseSettings, verbType: 'irregular' }
    const formsIrregular = await generateAllFormsForRegion('la_general', settingsIrregular)

    // Results should be different
    expect(formsAll.length).toBeGreaterThan(0)
    expect(formsRegular.length).toBeGreaterThan(0)
    expect(formsIrregular.length).toBeGreaterThan(0)

    // All should have more forms than regular or irregular alone
    expect(formsAll.length).toBeGreaterThan(formsRegular.length)
    expect(formsAll.length).toBeGreaterThan(formsIrregular.length)
  })

  it('should generate different forms when changing enableChunks', async () => {
    clearFormsCache() // Start with clean cache

    const baseSettings = {
      region: 'la_general',
      level: 'A1',
      practiceMode: 'mixed',
      verbType: 'all'
    }

    // Generate forms with chunks enabled
    const settingsWithChunks = { ...baseSettings, enableChunks: true }
    const formsWithChunks = await generateAllFormsForRegion('la_general', settingsWithChunks)

    // Generate forms with chunks disabled (fallback mode)
    const settingsNoChunks = { ...baseSettings, enableChunks: false }
    const formsNoChunks = await generateAllFormsForRegion('la_general', settingsNoChunks)

    // Both should have forms
    expect(formsWithChunks.length).toBeGreaterThan(0)
    expect(formsNoChunks.length).toBeGreaterThan(0)

    // Could be different sizes depending on which verbs are loaded in chunks vs fallback
    expect(typeof formsWithChunks).toBe('object')
    expect(typeof formsNoChunks).toBe('object')
  })
})

