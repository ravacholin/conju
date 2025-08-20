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
  // TESTS CRÍTICOS: Verificar que ambas formas del subjuntivo imperfecto y pluscuamperfecto sean aceptadas
  describe('Subjunctive imperfect and pluperfect forms (-ra/-se)', () => {
    test('should accept both -ra and -se forms for regular verbs in subjImpf', () => {
      // Verbo regular -ar (hablar)
      const expectedHablar = { value: 'hablara', mood: 'subjunctive', tense: 'subjImpf', person: '1s' }
      expect(grade('hablara', expectedHablar, mockSettings).correct).toBe(true)
      expect(grade('hablase', expectedHablar, mockSettings).correct).toBe(true)
      
      // Verbo regular -er (comer)
      const expectedComer = { value: 'comiera', mood: 'subjunctive', tense: 'subjImpf', person: '1s' }
      expect(grade('comiera', expectedComer, mockSettings).correct).toBe(true)
      expect(grade('comiese', expectedComer, mockSettings).correct).toBe(true)
      
      // Verbo regular -ir (vivir)
      const expectedVivir = { value: 'viviera', mood: 'subjunctive', tense: 'subjImpf', person: '1s' }
      expect(grade('viviera', expectedVivir, mockSettings).correct).toBe(true)
      expect(grade('viviese', expectedVivir, mockSettings).correct).toBe(true)
    })

    test('should accept both -ra and -se forms for irregular verbs in subjImpf', () => {
      // Verbo ser (altamente irregular)
      const expectedSer = { value: 'fuera', mood: 'subjunctive', tense: 'subjImpf', person: '1s' }
      expect(grade('fuera', expectedSer, mockSettings).correct).toBe(true)
      expect(grade('fuese', expectedSer, mockSettings).correct).toBe(true)
      
      // Verbo tener (irregular)
      const expectedTener = { value: 'tuviera', mood: 'subjunctive', tense: 'subjImpf', person: '1s' }
      expect(grade('tuviera', expectedTener, mockSettings).correct).toBe(true)
      expect(grade('tuviese', expectedTener, mockSettings).correct).toBe(true)
    })

    test('should accept both forms in all persons for subjImpf', () => {
      // Todas las personas del verbo tener
      const persons = [
        { person: '1s', ra: 'tuviera', se: 'tuviese' },
        { person: '2s_tu', ra: 'tuvieras', se: 'tuvieses' },
        { person: '3s', ra: 'tuviera', se: 'tuviese' },
        { person: '1p', ra: 'tuviéramos', se: 'tuviésemos' },
        { person: '2p_vosotros', ra: 'tuvierais', se: 'tuvieseis' },
        { person: '3p', ra: 'tuvieran', se: 'tuviesen' }
      ]
      
      persons.forEach(({ person, ra, se }) => {
        const expected = { value: ra, mood: 'subjunctive', tense: 'subjImpf', person }
        expect(grade(ra, expected, mockSettings).correct).toBe(true)
        expect(grade(se, expected, mockSettings).correct).toBe(true)
      })
    })

    test('should accept both forms for subjunctive pluperfect (subjPlusc)', () => {
      // Pluscuamperfecto de subjuntivo
      const expectedPlusc = { value: 'hubiera hablado', mood: 'subjunctive', tense: 'subjPlusc', person: '1s' }
      expect(grade('hubiera hablado', expectedPlusc, mockSettings).correct).toBe(true)
      expect(grade('hubiese hablado', expectedPlusc, mockSettings).correct).toBe(true)
      
      // Verificar otras personas
      const expectedPlusc3p = { value: 'hubieran comido', mood: 'subjunctive', tense: 'subjPlusc', person: '3p' }
      expect(grade('hubieran comido', expectedPlusc3p, mockSettings).correct).toBe(true)
      expect(grade('hubiesen comido', expectedPlusc3p, mockSettings).correct).toBe(true)
    })

    test('should work in all MCER levels (A1-C2)', () => {
      const allLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
      const expected = { value: 'fuera', mood: 'subjunctive', tense: 'subjImpf', person: '1s' }
      
      allLevels.forEach(level => {
        const settingsWithLevel = { ...mockSettings, level }
        expect(grade('fuera', expected, settingsWithLevel).correct).toBe(true)
        expect(grade('fuese', expected, settingsWithLevel).correct).toBe(true)
      })
    })
  })

  // TESTS CRÍTICOS: Verificar que SIEMPRE se muestre la forma correcta en los errores
  describe('Error messages must always show correct form', () => {
    test('should always show correct form in error messages for wrong answers', () => {
      const expected = { value: 'hablo', mood: 'indicative', tense: 'pres', person: '1s' }
      
      // Respuesta completamente incorrecta
      const result1 = grade('xyz', expected, mockSettings)
      expect(result1.correct).toBe(false)
      expect(result1.note).toContain('hablo')
      expect(result1.note).toContain('La forma correcta es')
      
      // Respuesta muy corta
      const result2 = grade('ab', expected, mockSettings)
      expect(result2.correct).toBe(false)
      expect(result2.note).toContain('hablo')
      expect(result2.note).toContain('La forma correcta es')
      
      // Respuesta con error de conjugación
      const result3 = grade('hablas', expected, mockSettings)
      expect(result3.correct).toBe(false)
      expect(result3.note).toContain('hablo')
      expect(result3.note).toContain('La forma correcta es')
    })

    test('should show correct form for irregular verbs', () => {
      const expected = { value: 'soy', mood: 'indicative', tense: 'pres', person: '1s' }
      
      const result = grade('so', expected, mockSettings)
      expect(result.correct).toBe(false)
      expect(result.note).toContain('soy')
      expect(result.note).toContain('La forma correcta es')
    })

    test('should show correct form for complex tenses', () => {
      const expected = { value: 'había hablado', mood: 'indicative', tense: 'plusc', person: '1s' }
      
      const result = grade('hable', expected, mockSettings)
      expect(result.correct).toBe(false)
      expect(result.note).toContain('había hablado')
      expect(result.note).toContain('La forma correcta es')
    })

    test('should work in all levels (A1-C2)', () => {
      const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
      const expected = { value: 'escribo', mood: 'indicative', tense: 'pres', person: '1s' }
      
      levels.forEach(level => {
        const settingsWithLevel = { ...mockSettings, level }
        const result = grade('escriba', expected, settingsWithLevel)
        expect(result.correct).toBe(false)
        expect(result.note).toContain('escribo')
        expect(result.note).toContain('La forma correcta es')
      })
    })

    test('should never show generic error without correct form', () => {
      const expected = { value: 'canto', mood: 'indicative', tense: 'pres', person: '1s' }
      
      // Varios tipos de errores
      const wrongInputs = ['cantas', 'cante', 'cantaba', 'cantaré', 'xyz', 'ab']
      
      wrongInputs.forEach(input => {
        const result = grade(input, expected, mockSettings)
        expect(result.correct).toBe(false)
        // NO debe contener mensajes genéricos sin forma correcta
        expect(result.note).not.toContain('Revisa la conjugación.')
        expect(result.note).not.toContain('Revisa la conjugación y los acentos.')
        // SÍ debe contener la forma correcta
        expect(result.note).toContain('canto')
      })
    })
  })

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