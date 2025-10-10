// Test para verificar la clasificación de errores

import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest'
import { classifyError } from './errorClassification.js'
import { ERROR_TAGS } from './dataModels.js'
import { VERB_LOOKUP_MAP } from '../core/optimizedCache.js'

const getAllVerbsSyncMock = vi.hoisted(() => vi.fn())

vi.mock('../core/verbDataService.js', () => ({
  getAllVerbsSync: getAllVerbsSyncMock
}))

const originalHablarEntry = VERB_LOOKUP_MAP.get('hablar')
const originalHasHablar = VERB_LOOKUP_MAP.has('hablar')

beforeEach(() => {
  getAllVerbsSyncMock.mockReset()
  getAllVerbsSyncMock.mockReturnValue([])
  VERB_LOOKUP_MAP.set('hablar', {
    paradigms: [
      {
        forms: [
          { mood: 'indicative', tense: 'pres', person: '1s', value: 'hablo' },
          { mood: 'subjunctive', tense: 'pres', person: '1s', value: 'hable' }
        ]
      }
    ]
  })
})

afterAll(() => {
  if (originalHasHablar) {
    VERB_LOOKUP_MAP.set('hablar', originalHablarEntry)
  } else {
    VERB_LOOKUP_MAP.delete('hablar')
  }
})

describe('Error Classification', () => {
  it('should classify accent errors correctly', () => {
    const item = { lemma: 'hablar', person: '2s_tu', tense: 'pretIndef', verbType: 'regular' }
    const errors = classifyError('hablaste', 'hablásté', item) // Error de acento añadido
    console.log('Accent test - errors found:', errors)
    expect(errors).toContain(ERROR_TAGS.ACCENT)
  })

  it('should classify person errors correctly', () => {
    const item = { lemma: 'hablar', person: '1s', tense: 'pres', verbType: 'regular' }
    const errors = classifyError('hablas', 'hablo', item) // Error de persona (2s vs 1s)
    expect(errors).toContain(ERROR_TAGS.WRONG_PERSON)
  })

  it('should classify verbal ending errors correctly', () => {
    const item = { lemma: 'comer', person: '1s', tense: 'pres', verbType: 'regular' }
    const _errors = classifyError('como', 'como', item) // Misma raíz, diferente terminación
    // Caso más obvio: 
    const errors2 = classifyError('coma', 'como', item) // Error de terminación
    expect(errors2).toContain(ERROR_TAGS.VERBAL_ENDING)
  })

  it('should classify orthographic g/gu errors correctly', () => {
    const item = { lemma: 'seguir', person: '2s_tu', tense: 'pres', verbType: 'irregular' }
    const errors = classifyError('segues', 'sigues', item) // Error ortográfico g/gu
    console.log('G/GU test - errors found:', errors)
    expect(errors).toContain(ERROR_TAGS.ORTHOGRAPHY_G_GU)
  })

  it('should classify orthographic c/qu errors correctly', () => {
    const item = { lemma: 'tocar', person: '1s', tense: 'subjPres', verbType: 'regular' }
    const errors = classifyError('toce', 'toque', item) // Error ortográfico c/qu
    expect(errors).toContain(ERROR_TAGS.ORTHOGRAPHY_C_QU)
  })

  it('should classify irregular stem errors correctly', () => {
    getAllVerbsSyncMock.mockReturnValueOnce([
      {
        lemma: 'tener',
        type: 'irregular',
        irregularityMatrix: { pres: true }
      }
    ])
    const item = { lemma: 'tener', person: '1s', tense: 'pres', verbType: 'regular' }
    const errors = classifyError('teno', 'tengo', item) // Error en raíz irregular
    expect(errors).toContain(ERROR_TAGS.IRREGULAR_STEM)
  })

  it('should classify mood errors correctly', () => {
    const item = { lemma: 'hablar', person: '1s', tense: 'pres', verbType: 'regular' }
    const errors = classifyError('hable', 'hablo', item) // Error de modo (subjuntivo vs indicativo)
    expect(errors).toContain(ERROR_TAGS.WRONG_MOOD)
  })

  it('should not return empty error arrays', () => {
    const item = { lemma: 'hablar', person: '1s', tense: 'pres', verbType: 'regular' }
    const errors = classifyError('completamente_incorrecto', 'hablo', item)
    expect(errors.length).toBeGreaterThan(0)
  })

  it('should return empty array for correct answers', () => {
    const item = { lemma: 'hablar', person: '1s', tense: 'pres', verbType: 'regular' }
    const errors = classifyError('hablo', 'hablo', item)
    expect(errors).toEqual([])
  })

  it('should handle multiple error types', () => {
    const item = { lemma: 'seguir', person: '2s_tu', tense: 'pres', verbType: 'irregular' }
    const errors = classifyError('sigás', 'sigues', item) // Múltiples errores potenciales
    expect(errors.length).toBeGreaterThan(0)
  })
})