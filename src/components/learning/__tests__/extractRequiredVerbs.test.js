/**
 * Tests para extractRequiredVerbs
 * Verifica que los lemmas se deriven correctamente usando datos morfológicos
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

const optimizedCacheMocks = vi.hoisted(() => ({
  formLookupMap: new Map(),
  warmupCaches: vi.fn()
}))

// Mock de verbDataService
const mockAllVerbs = [
  {
    lemma: 'tener',
    type: 'irregular',
    paradigms: [{
      regionTags: ['la_general'],
      forms: [
        { mood: 'indicative', tense: 'pres', person: '1s', value: 'tengo' },
        { mood: 'indicative', tense: 'pres', person: '3s', value: 'tiene' },
        { mood: 'indicative', tense: 'pretIndef', person: '1s', value: 'tuve' },
        { mood: 'indicative', tense: 'pretIndef', person: '3s', value: 'tuvo' }
      ]
    }]
  },
  {
    lemma: 'oír',
    type: 'irregular',
    paradigms: [{
      regionTags: ['la_general'],
      forms: [
        { mood: 'indicative', tense: 'pres', person: '1s', value: 'oigo' },
        { mood: 'indicative', tense: 'pres', person: '3s', value: 'oye' },
        { mood: 'indicative', tense: 'pretIndef', person: '1s', value: 'oí' },
        { mood: 'indicative', tense: 'pretIndef', person: '3s', value: 'oyó' }
      ]
    }]
  },
  {
    lemma: 'ser',
    type: 'irregular',
    paradigms: [{
      regionTags: ['la_general'],
      forms: [
        { mood: 'indicative', tense: 'pres', person: '1s', value: 'soy' },
        { mood: 'indicative', tense: 'pres', person: '3s', value: 'es' },
        { mood: 'indicative', tense: 'pretIndef', person: '1s', value: 'fui' },
        { mood: 'indicative', tense: 'pretIndef', person: '3s', value: 'fue' }
      ]
    }]
  },
  {
    lemma: 'hacer',
    type: 'irregular',
    paradigms: [{
      regionTags: ['la_general'],
      forms: [
        { mood: 'indicative', tense: 'pres', person: '1s', value: 'hago' },
        { mood: 'indicative', tense: 'pres', person: '3s', value: 'hace' },
        { mood: 'indicative', tense: 'pretIndef', person: '1s', value: 'hice' },
        { mood: 'indicative', tense: 'pretIndef', person: '3s', value: 'hizo' }
      ]
    }]
  },
  {
    lemma: 'hablar',
    type: 'regular',
    paradigms: [{
      regionTags: ['la_general'],
      forms: [
        { mood: 'indicative', tense: 'pres', person: '1s', value: 'hablo' },
        { mood: 'indicative', tense: 'pres', person: '3s', value: 'habla' },
        { mood: 'indicative', tense: 'pretIndef', person: '1s', value: 'hablé' },
        { mood: 'indicative', tense: 'pretIndef', person: '3s', value: 'habló' }
      ]
    }]
  }
]

vi.mock('../../../lib/core/optimizedCache.js', () => ({
  FORM_LOOKUP_MAP: optimizedCacheMocks.formLookupMap,
  warmupCaches: optimizedCacheMocks.warmupCaches
}))

vi.mock('../../../lib/core/verbDataService.js', () => ({
  getAllVerbsSync: vi.fn(() => mockAllVerbs)
}))

// Importar las funciones después del mock
const {
  getLemmaFromConjugatedForm,
  deriveLemmaFallback,
  extractRequiredVerbs,
  invalidateLemmaCache
} = await import('../MeaningfulPractice.jsx')

const { getAllVerbsSync } = await import('../../../lib/core/verbDataService.js')

beforeEach(() => {
  optimizedCacheMocks.formLookupMap.clear()
  optimizedCacheMocks.warmupCaches.mockClear()
  getAllVerbsSync.mockClear()
  getAllVerbsSync.mockImplementation(() => mockAllVerbs)
  invalidateLemmaCache()
})

describe('getLemmaFromConjugatedForm', () => {
  describe('Irregular Verbs', () => {
    it('should correctly identify lemma for "tener" conjugations', () => {
      expect(getLemmaFromConjugatedForm('tengo')).toBe('tener')
      expect(getLemmaFromConjugatedForm('tiene')).toBe('tener')
      expect(getLemmaFromConjugatedForm('tuve')).toBe('tener')
      expect(getLemmaFromConjugatedForm('tuvo')).toBe('tener')
    })

    it('should correctly identify lemma for "oír" conjugations', () => {
      expect(getLemmaFromConjugatedForm('oigo')).toBe('oír')
      expect(getLemmaFromConjugatedForm('oye')).toBe('oír')
      expect(getLemmaFromConjugatedForm('oí')).toBe('oír')
      expect(getLemmaFromConjugatedForm('oyó')).toBe('oír')
    })

    it('should correctly identify lemma for "ser" conjugations', () => {
      expect(getLemmaFromConjugatedForm('soy')).toBe('ser')
      expect(getLemmaFromConjugatedForm('es')).toBe('ser')
      expect(getLemmaFromConjugatedForm('fui')).toBe('ser')
      expect(getLemmaFromConjugatedForm('fue')).toBe('ser')
    })

    it('should correctly identify lemma for "hacer" conjugations', () => {
      expect(getLemmaFromConjugatedForm('hago')).toBe('hacer')
      expect(getLemmaFromConjugatedForm('hace')).toBe('hacer')
      expect(getLemmaFromConjugatedForm('hice')).toBe('hacer')
      expect(getLemmaFromConjugatedForm('hizo')).toBe('hacer')
    })
  })

  describe('Regular Verbs', () => {
    it('should correctly identify lemma for "hablar" conjugations', () => {
      expect(getLemmaFromConjugatedForm('hablo')).toBe('hablar')
      expect(getLemmaFromConjugatedForm('habla')).toBe('hablar')
      expect(getLemmaFromConjugatedForm('hablé')).toBe('hablar')
      expect(getLemmaFromConjugatedForm('habló')).toBe('hablar')
    })
  })

  describe('Edge Cases', () => {
    it('should handle case-insensitive matching', () => {
      expect(getLemmaFromConjugatedForm('TENGO')).toBe('tener')
      expect(getLemmaFromConjugatedForm('Tuvo')).toBe('tener')
    })

    it('should return null for unknown conjugations', () => {
      expect(getLemmaFromConjugatedForm('xyz123')).toBe(null)
      expect(getLemmaFromConjugatedForm('notaverb')).toBe(null)
    })

    it('should handle invalid inputs', () => {
      expect(getLemmaFromConjugatedForm(null)).toBe(null)
      expect(getLemmaFromConjugatedForm(undefined)).toBe(null)
      expect(getLemmaFromConjugatedForm('')).toBe(null)
      expect(getLemmaFromConjugatedForm(123)).toBe(null)
    })
  })
})

describe('Lemma cache performance', () => {
  it('reutiliza los resultados de getAllVerbsSync tras la primera carga', () => {
    const firstResult = getLemmaFromConjugatedForm('tengo')
    expect(firstResult).toBe('tener')
    expect(getAllVerbsSync).toHaveBeenCalledTimes(1)

    const secondResult = getLemmaFromConjugatedForm('tiene')
    expect(secondResult).toBe('tener')
    expect(getAllVerbsSync).toHaveBeenCalledTimes(1)

    const thirdResult = getLemmaFromConjugatedForm('tengo')
    expect(thirdResult).toBe('tener')
    expect(getAllVerbsSync).toHaveBeenCalledTimes(1)
  })

  it('permite invalidar la caché y recalentarla usando optimizedCache', () => {
    getLemmaFromConjugatedForm('tengo')
    expect(getAllVerbsSync).toHaveBeenCalledTimes(1)

    optimizedCacheMocks.formLookupMap.clear()
    optimizedCacheMocks.formLookupMap.set('caminar|indicative|pretIndef|3p', {
      value: 'caminaron',
      lemma: 'caminar',
      mood: 'indicative',
      tense: 'pretIndef',
      person: '3p'
    })

    getAllVerbsSync.mockClear()
    getAllVerbsSync.mockImplementation(() => [])

    invalidateLemmaCache({ warm: true })
    expect(optimizedCacheMocks.warmupCaches).toHaveBeenCalledTimes(1)

    const result = getLemmaFromConjugatedForm('caminaron')
    expect(result).toBe('caminar')
    expect(getAllVerbsSync).not.toHaveBeenCalled()
  })
})

describe('deriveLemmaFallback', () => {
  describe('Regular Verb Patterns', () => {
    it('should derive -ar verbs from pretérito', () => {
      expect(deriveLemmaFallback('cantó')).toBe('cantar')
      expect(deriveLemmaFallback('bailaron')).toBe('bailar')
    })

    it('should derive -ir verbs from pretérito', () => {
      expect(deriveLemmaFallback('vivió')).toBe('vivir')
    })

    it('should derive -er verbs from pretérito (with limitations)', () => {
      // Nota: Este método tiene limitaciones y puede fallar con irregulares
      expect(deriveLemmaFallback('comieron')).toBe('comer')
    })

    it('should handle present tense patterns', () => {
      expect(deriveLemmaFallback('cantan')).toBe('cantar')
      expect(deriveLemmaFallback('comen')).toBe('comer')
    })

    it('should handle imperfect patterns', () => {
      expect(deriveLemmaFallback('vivía')).toBe('vivir')
    })
  })

  describe('Limitations with Irregular Verbs', () => {
    it('should fail for irregular verbs (expected behavior)', () => {
      // Estas son limitaciones conocidas del fallback regex
      // Por eso priorizamos usar getLemmaFromConjugatedForm
      expect(deriveLemmaFallback('tuvo')).not.toBe('tener')  // Fallará
      expect(deriveLemmaFallback('hizo')).not.toBe('hacer')  // Fallará
      expect(deriveLemmaFallback('fue')).not.toBe('ser')     // Fallará
    })
  })

  describe('Edge Cases', () => {
    it('should handle infinitives', () => {
      // Si ya es infinitivo, debería devolverlo (o algo parecido)
      const result = deriveLemmaFallback('hablar')
      expect(result).toBeTruthy()
    })
  })
})

describe('extractRequiredVerbs', () => {
  describe('Priority 1: Using eligibleForms with lemmas', () => {
    it('should prioritize lemmas from eligibleForms', () => {
      const eligibleForms = [
        { lemma: 'tener', tense: 'pres', mood: 'indicative', value: 'tengo' },
        { lemma: 'tener', tense: 'pres', mood: 'indicative', value: 'tiene' },
        { lemma: 'hacer', tense: 'pres', mood: 'indicative', value: 'hago' },
        { lemma: 'hacer', tense: 'pres', mood: 'indicative', value: 'hace' }
      ]

      const result = extractRequiredVerbs(
        {},
        eligibleForms,
        'pres',
        'indicative'
      )

      expect(result.lemmas).toContain('tener')
      expect(result.lemmas).toContain('hacer')
      expect(result.lemmas.length).toBe(2)
      expect(result.conjugatedExamples).toContain('tengo')
      expect(result.conjugatedExamples).toContain('hago')
    })

    it('should filter conjugated examples by tense and mood', () => {
      const eligibleForms = [
        { lemma: 'tener', tense: 'pres', mood: 'indicative', value: 'tengo' },
        { lemma: 'tener', tense: 'pretIndef', mood: 'indicative', value: 'tuve' },
        { lemma: 'hacer', tense: 'pres', mood: 'indicative', value: 'hago' }
      ]

      const result = extractRequiredVerbs(
        {},
        eligibleForms,
        'pres',
        'indicative'
      )

      expect(result.conjugatedExamples).toContain('tengo')
      expect(result.conjugatedExamples).toContain('hago')
      expect(result.conjugatedExamples).not.toContain('tuve') // Different tense
    })

    it('should limit to 8 verbs maximum', () => {
      const eligibleForms = Array.from({ length: 20 }, (_, i) => ({
        lemma: `verb${i}`,
        tense: 'pres',
        mood: 'indicative',
        value: `form${i}`
      }))

      const result = extractRequiredVerbs(
        {},
        eligibleForms,
        'pres',
        'indicative'
      )

      expect(result.lemmas.length).toBeLessThanOrEqual(8)
      expect(result.conjugatedExamples.length).toBeLessThanOrEqual(8)
    })
  })

  describe('Priority 2: Using exercise.expectedVerbs with morphological lookup', () => {
    it('should use morphological data for irregular verbs', () => {
      const exercise = {
        expectedVerbs: ['tuvo', 'hizo', 'fue', 'oye']
      }

      const result = extractRequiredVerbs(
        exercise,
        [],
        'pretIndef',
        'indicative'
      )

      // Debería encontrar los lemmas correctos usando getLemmaFromConjugatedForm
      expect(result.lemmas).toContain('tener')
      expect(result.lemmas).toContain('hacer')
      expect(result.lemmas).toContain('ser')
      expect(result.lemmas).toContain('oír')
      expect(result.conjugatedExamples).toEqual(['tuvo', 'hizo', 'fue', 'oye'])
    })

    it('should use fallback for unknown conjugations', () => {
      const exercise = {
        expectedVerbs: ['cantó', 'bailó'] // No están en mockAllVerbs
      }

      const result = extractRequiredVerbs(
        exercise,
        [],
        'pretIndef',
        'indicative'
      )

      // Debería usar deriveLemmaFallback
      expect(result.lemmas).toContain('cantar')
      expect(result.lemmas).toContain('bailar')
    })

    it('should use verbInstructions if provided', () => {
      const exercise = {
        expectedVerbs: ['tuvo', 'hizo'],
        verbInstructions: 'Instrucción personalizada del ejercicio'
      }

      const result = extractRequiredVerbs(
        exercise,
        [],
        'pretIndef',
        'indicative'
      )

      expect(result.instructions).toBe('Instrucción personalizada del ejercicio')
    })
  })

  describe('Priority 3: Fallback to common verbs', () => {
    it('should use common verbs for presente when no data available', () => {
      const result = extractRequiredVerbs(
        {},
        [],
        'pres',
        'indicative'
      )

      expect(result.lemmas).toContain('ser')
      expect(result.lemmas).toContain('estar')
      expect(result.lemmas).toContain('tener')
    })

    it('should use common verbs for pretérito indefinido', () => {
      const result = extractRequiredVerbs(
        {},
        [],
        'pretIndef',
        'indicative'
      )

      expect(result.lemmas).toContain('ir')
      expect(result.lemmas).toContain('hacer')
      expect(result.lemmas).toContain('decir')
    })

    it('should use default common verbs for unknown tenses', () => {
      const result = extractRequiredVerbs(
        {},
        [],
        'unknownTense',
        'indicative'
      )

      expect(result.lemmas).toContain('ser')
      expect(result.lemmas).toContain('estar')
      expect(result.lemmas).toContain('tener')
    })
  })

  describe('Instruction Generation', () => {
    it('should generate instructions with conjugated examples when available', () => {
      const eligibleForms = [
        { lemma: 'tener', tense: 'pres', mood: 'indicative', value: 'tengo' },
        { lemma: 'hacer', tense: 'pres', mood: 'indicative', value: 'hago' }
      ]

      const result = extractRequiredVerbs(
        {},
        eligibleForms,
        'pres',
        'indicative'
      )

      expect(result.instructions).toContain('presente')
      expect(result.instructions).toContain('tengo')
      expect(result.instructions).toContain('hago')
    })

    it('should generate instructions with lemmas when no conjugated examples', () => {
      const result = extractRequiredVerbs(
        {},
        [],
        'pres',
        'indicative'
      )

      expect(result.instructions).toContain('presente')
      expect(result.instructions).toContain('ser')
      expect(result.instructions).toContain('estar')
    })

    it('should use correct tense names in instructions', () => {
      const tenseTests = [
        { tense: 'pres', expected: 'presente' },
        { tense: 'pretIndef', expected: 'pretérito indefinido' },
        { tense: 'impf', expected: 'imperfecto' },
        { tense: 'fut', expected: 'futuro' },
        { tense: 'cond', expected: 'condicional' }
      ]

      tenseTests.forEach(({ tense, expected }) => {
        const result = extractRequiredVerbs({}, [], tense, 'indicative')
        expect(result.instructions).toContain(expected)
      })
    })
  })
})
