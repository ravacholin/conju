import { describe, it, expect } from 'vitest'
import { buildGenerationDetail, buildGenerationSuggestions } from './generationDiagnostics.js'

describe('generationDiagnostics', () => {
  it('builds targeted suggestions for restrictive specific mode', () => {
    const suggestions = buildGenerationSuggestions({
      practiceMode: 'specific',
      specificMood: 'indicative',
      specificTense: 'pret',
      verbType: 'irregular',
      selectedFamily: 'stem_change',
      practicePronoun: '2s'
    })

    expect(suggestions.map((item) => item.id)).toEqual(
      expect.arrayContaining(['switch-to-mixed', 'verb-type-all', 'clear-family', 'pronoun-all'])
    )
  })

  it('returns region detail when there are no forms at all', () => {
    expect(buildGenerationDetail(0)).toBe('No se pudieron cargar formas para tu región.')
  })

  it('returns filtering detail when pool exists but no eligible forms', () => {
    expect(buildGenerationDetail(10)).toBe('No hay formas que cumplan la configuración actual.')
  })

  it('prioritizes causal suggestions when filtering report includes empty reason', () => {
    const suggestions = buildGenerationSuggestions(
      {
        practiceMode: 'specific',
        specificMood: 'indicative',
        specificTense: 'pret',
        verbType: 'all'
      },
      { emptyReason: 'verb_type_filter' }
    )

    expect(suggestions[0].id).toBe('verb-type-all')
    expect(suggestions[0].recommended).toBe(true)
  })

  it('returns reason-based detail when filtering report is present', () => {
    expect(buildGenerationDetail(100, { emptyReason: 'pronoun_region_filter' }))
      .toBe('Los pronombres/dialecto activos no tienen formas elegibles.')
  })
})
