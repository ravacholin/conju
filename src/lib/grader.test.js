import { expect, test, describe } from 'vitest'
import { grade } from './core/grader.js'

// Mock settings for testing
const mockSettings = {
  region: 'rioplatense',
  useVoseo: true,
  useTuteo: false,
  useVosotros: false,
  strict: true,
  accentTolerance: 'warn'
}

const mockSettingsGeneral = {
  region: 'la_general',
  useVoseo: false,
  useTuteo: true,
  useVosotros: false,
  strict: true,
  accentTolerance: 'warn'
}

describe('Grade function', () => {
  test('should accept correct form with accent', () => {
    const result = grade('escribís', { value: 'escribís' }, mockSettings)
    expect(result.correct).toBe(true)
  })

  test('should reject form without accent', () => {
    const result = grade('escribis', { value: 'escribís' }, mockSettings)
    expect(result.correct).toBe(false)
    expect(result.note).toContain('le falta la tilde')
  })

  test('should reject tú form in rioplatense', () => {
    const result = grade('escribes', { value: 'escribís' }, mockSettings)
    expect(result.correct).toBe(false)
    expect(result.note).toContain('español rioplatense')
  })

  test('should reject vos form in general Spanish', () => {
    const result = grade('escribís', { value: 'escribes' }, mockSettingsGeneral)
    expect(result.correct).toBe(false)
  })

  test('should accept input with extra spaces', () => {
    const result = grade('  escribís  ', { value: 'escribís' }, mockSettings)
    expect(result.correct).toBe(true)
    if (result.warnings) {
      expect(result.warnings).toContain('Se eliminaron espacios extra')
    }
  })

  test('should accept input with uppercase', () => {
    const result = grade('ESCRIBÍS', { value: 'escribís' }, mockSettings)
    expect(result.correct).toBe(true)
    if (result.warnings) {
      expect(result.warnings).toContain('Se convirtió a minúsculas')
    }
  })

  test('should reject empty input', () => {
    const result = grade('', { value: 'escribís' }, mockSettings)
    expect(result.correct).toBe(false)
  })

  test('should reject very short input', () => {
    const result = grade('ab', { value: 'escribís' }, mockSettings)
    expect(result.correct).toBe(false)
    expect(result.note).toContain('muy corta')
  })

  test('should handle lenient mode with alternatives', () => {
    const lenientSettings = { 
      ...mockSettings, 
      strict: false,
      useTuteo: true,
      useVoseo: true
    }
    const expected = { 
      value: 'vení', 
      accepts: { tu: 'ven' }
    }
    const result = grade('ven', expected, lenientSettings)
    expect(result.correct).toBe(true)
  })

  test('should reject alternatives in strict mode', () => {
    const expected = { 
      value: 'vení', 
      accepts: { tu: 'ven' }
    }
    const result = grade('ven', expected, mockSettings)
    expect(result.correct).toBe(false)
  })
}) 