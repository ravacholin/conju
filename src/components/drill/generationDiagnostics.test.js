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
})
