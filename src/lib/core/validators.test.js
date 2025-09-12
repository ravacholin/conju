import { describe, it, expect, vi, beforeEach } from 'vitest'
import { VerbValidator, FamilyValidator, SemanticValidator, validateAllData, quickValidation } from './validators.js'

// Mock the data imports to avoid loading large datasets in tests
vi.mock('../../data/verbs.js', () => ({
  verbs: [
    {
      id: 'verb-test',
      lemma: 'hablar',
      type: 'regular',
      paradigms: [{
        regionTags: ['la_general'],
        forms: [
          { mood: 'nonfinite', tense: 'inf', person: '', value: 'hablar' },
          { mood: 'indicative', tense: 'pres', person: '1s', value: 'hablo' },
          { mood: 'indicative', tense: 'pres', person: '3s', value: 'habla' }
        ]
      }]
    }
  ]
}))

vi.mock('../../data/priorityVerbs.js', () => ({
  getAllVerbsWithPriority: vi.fn((verbs) => verbs)
}))

vi.mock('../data/irregularFamilies.js', () => ({
  IRREGULAR_FAMILIES: {
    'test-family': {
      id: 'test-family',
      name: 'Test Family',
      examples: ['hablar', 'comer', 'vivir'],
      affectedTenses: ['pres']
    }
  }
}))

describe('Verb Validation System', () => {
  
  describe('VerbValidator', () => {
    let validator
    
    beforeEach(() => {
      validator = new VerbValidator()
    })
    
    it('should initialize with empty errors and warnings arrays', () => {
      expect(validator.errors).toEqual([])
      expect(validator.warnings).toEqual([])
    })
    
    describe('validateVerbStructure', () => {
      it('should validate a well-formed verb', () => {
        const validVerb = {
          id: 'verb-test',
          lemma: 'hablar',
          type: 'regular',
          paradigms: [{ regionTags: ['la_general'], forms: [] }]
        }
        
        const errors = validator.validateVerbStructure(validVerb)
        expect(errors).toEqual([])
      })
      
      it('should detect missing ID', () => {
        const verbWithoutId = {
          lemma: 'hablar',
          type: 'regular',
          paradigms: []
        }
        
        const errors = validator.validateVerbStructure(verbWithoutId)
        expect(errors.length).toBeGreaterThan(0)
        expect(errors.some(e => e.includes('missing or invalid ID'))).toBe(true)
      })
      
      it('should detect missing lemma', () => {
        const verbWithoutLemma = {
          id: 'verb-test',
          type: 'regular',
          paradigms: []
        }
        
        const errors = validator.validateVerbStructure(verbWithoutLemma)
        expect(errors.length).toBeGreaterThan(0)
        expect(errors.some(e => e.includes('missing or invalid lemma'))).toBe(true)
      })
      
      it('should detect invalid verb type', () => {
        const verbWithInvalidType = {
          id: 'verb-test',
          lemma: 'hablar',
          type: 'invalid',
          paradigms: []
        }
        
        const errors = validator.validateVerbStructure(verbWithInvalidType)
        expect(errors.length).toBeGreaterThan(0)
        expect(errors.some(e => e.includes('invalid type'))).toBe(true)
      })
      
      it('should detect missing paradigms', () => {
        const verbWithoutParadigms = {
          id: 'verb-test',
          lemma: 'hablar',
          type: 'regular'
        }
        
        const errors = validator.validateVerbStructure(verbWithoutParadigms)
        expect(errors.length).toBeGreaterThan(0)
        expect(errors.some(e => e.includes('missing paradigms'))).toBe(true)
      })
      
      it('should detect empty paradigms array', () => {
        const verbWithEmptyParadigms = {
          id: 'verb-test',
          lemma: 'hablar', 
          type: 'regular',
          paradigms: []
        }
        
        const errors = validator.validateVerbStructure(verbWithEmptyParadigms)
        expect(errors.length).toBeGreaterThan(0)
        expect(errors.some(e => e.includes('missing paradigms'))).toBe(true)
      })
    })
    
    describe('validateVerbForms', () => {
      it('should validate forms with regionTags and required forms', () => {
        const validVerb = {
          id: 'verb-test',
          lemma: 'hablar',
          type: 'regular',
          paradigms: [{
            regionTags: ['la_general'],
            forms: [
              { mood: 'nonfinite', tense: 'inf', person: '', value: 'hablar' },
              { mood: 'indicative', tense: 'pres', person: '1s', value: 'hablo' },
              { mood: 'indicative', tense: 'pres', person: '3s', value: 'habla' }
            ]
          }]
        }
        
        const result = validator.validateVerbForms(validVerb)
        expect(result.errors).toEqual([])
      })
      
      it('should detect missing regionTags', () => {
        const verbWithoutRegionTags = {
          lemma: 'hablar',
          paradigms: [{
            forms: [
              { mood: 'nonfinite', tense: 'inf', person: '', value: 'hablar' }
            ]
          }]
        }
        
        const result = validator.validateVerbForms(verbWithoutRegionTags)
        expect(result.errors.length).toBeGreaterThan(0)
        expect(result.errors.some(e => e.includes('missing regionTags'))).toBe(true)
      })
      
      it('should detect missing forms', () => {
        const verbWithoutForms = {
          lemma: 'hablar',
          paradigms: [{
            regionTags: ['la_general']
          }]
        }
        
        const result = validator.validateVerbForms(verbWithoutForms)
        expect(result.errors.length).toBeGreaterThan(0)
        expect(result.errors.some(e => e.includes('missing forms'))).toBe(true)
      })
      
      it('should detect forms with missing mood/tense', () => {
        const verbWithIncompleteForm = {
          lemma: 'hablar',
          paradigms: [{
            regionTags: ['la_general'],
            forms: [
              { person: '1s', value: 'hablo' } // Missing mood and tense
            ]
          }]
        }
        
        const result = validator.validateVerbForms(verbWithIncompleteForm)
        expect(result.errors.length).toBeGreaterThan(0)
        expect(result.errors.some(e => e.includes('missing mood/tense'))).toBe(true)
      })
    })
    
    describe('validateConjugationConsistency', () => {
      it('should validate regular verb conjugations', () => {
        const regularVerb = {
          lemma: 'hablar',
          type: 'regular',
          paradigms: [{
            forms: [
              { mood: 'indicative', tense: 'pres', person: '1s', value: 'hablo' },
              { mood: 'indicative', tense: 'pres', person: '2s_tu', value: 'hablas' },
              { mood: 'indicative', tense: 'pres', person: '3s', value: 'habla' }
            ]
          }]
        }
        
        const warnings = validator.validateConjugationConsistency(regularVerb)
        expect(Array.isArray(warnings)).toBe(true)
        // Should have no warnings for correct regular forms
        expect(warnings.length).toBe(0)
      })
      
      it('should detect irregular forms in regular verbs', () => {
        const regularVerbWithIrregularForm = {
          lemma: 'hablar',
          type: 'regular',
          paradigms: [{
            forms: [
              { mood: 'indicative', tense: 'pres', person: '1s', value: 'hablo' },
              { mood: 'indicative', tense: 'pres', person: '2s_tu', value: 'hables' } // Wrong - should be 'hablas'
            ]
          }]
        }
        
        const warnings = validator.validateConjugationConsistency(regularVerbWithIrregularForm)
        expect(warnings.length).toBeGreaterThan(0)
        expect(warnings.some(w => w.includes('irregular'))).toBe(true)
      })
    })
    
    describe('validateVerb (full validation)', () => {
      it('should run all validations and return combined results', () => {
        const testVerb = {
          id: 'verb-test',
          lemma: 'hablar',
          type: 'regular',
          paradigms: [{
            regionTags: ['la_general'],
            forms: [
              { mood: 'nonfinite', tense: 'inf', person: '', value: 'hablar' },
              { mood: 'indicative', tense: 'pres', person: '1s', value: 'hablo' }
            ]
          }]
        }
        
        const result = validator.validateVerb(testVerb)
        expect(result).toHaveProperty('errors')
        expect(result).toHaveProperty('warnings')
        expect(Array.isArray(result.errors)).toBe(true)
        expect(Array.isArray(result.warnings)).toBe(true)
      })
    })
    
    describe('getRegularForm helper', () => {
      it('should generate correct regular present forms', () => {
        expect(validator.getRegularForm('hablar', 'indicative', 'pres', '1s')).toBe('hablo')
        expect(validator.getRegularForm('hablar', 'indicative', 'pres', '2s_tu')).toBe('hablas')
        expect(validator.getRegularForm('hablar', 'indicative', 'pres', '3s')).toBe('habla')
        
        expect(validator.getRegularForm('comer', 'indicative', 'pres', '1s')).toBe('como')
        expect(validator.getRegularForm('vivir', 'indicative', 'pres', '1s')).toBe('vivo')
      })
      
      it('should generate correct regular imperfect forms', () => {
        expect(validator.getRegularForm('hablar', 'indicative', 'impf', '1s')).toBe('hablaba')
        expect(validator.getRegularForm('comer', 'indicative', 'impf', '1s')).toBe('comía')
        expect(validator.getRegularForm('vivir', 'indicative', 'impf', '1s')).toBe('vivía')
      })
      
      it('should handle invalid inputs gracefully', () => {
        expect(validator.getRegularForm('hablar', 'invalid', 'pres', '1s')).toBe(null)
        expect(validator.getRegularForm('invalid', 'indicative', 'pres', '1s')).toBe(null)
      })
    })
  })
  
  describe('FamilyValidator', () => {
    let validator
    
    beforeEach(() => {
      validator = new FamilyValidator()
    })
    
    it('should validate family structure', () => {
      const validFamily = {
        id: 'test-family',
        name: 'Test Family',
        examples: ['hablar', 'comer'],
        affectedTenses: ['pres']
      }
      
      const errors = validator.validateFamilyStructure(validFamily)
      expect(errors).toEqual([])
    })
    
    it('should detect missing family properties', () => {
      const incompleteFamily = {
        id: 'test-family'
        // Missing name, examples, affectedTenses
      }
      
      const errors = validator.validateFamilyStructure(incompleteFamily)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors.some(e => e.includes('missing name'))).toBe(true)
    })
    
    it('should validate family examples against verb database', () => {
      const family = {
        id: 'test-family',
        examples: ['hablar', 'nonexistent']
      }
      
      const mockVerbs = [{ lemma: 'hablar' }]
      const warnings = validator.validateFamilyExamples(family, mockVerbs)
      expect(warnings.length).toBeGreaterThan(0)
      expect(warnings.some(w => w.includes('not found in database'))).toBe(true)
    })
  })
  
  describe('SemanticValidator', () => {
    let validator
    
    beforeEach(() => {
      validator = new SemanticValidator()
    })
    
    it('should validate defective verbs', () => {
      const defectiveVerb = {
        lemma: 'soler',
        paradigms: [{
          forms: [
            { mood: 'imperative', tense: 'impAff', person: '2s_tu', value: 'suele' } // Should not exist
          ]
        }]
      }
      
      const result = validator.validateDefectiveVerb(defectiveVerb)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors.some(e => e.includes('no debe tener formas de imperative'))).toBe(true)
    })
    
    it('should validate third-person-only verbs', () => {
      const thirdPersonVerb = {
        lemma: 'concernir',
        paradigms: [{
          forms: [
            { mood: 'indicative', tense: 'pres', person: '1s', value: 'concierno' } // Should not exist
          ]
        }]
      }
      
      const result = validator.validateDefectiveVerb(thirdPersonVerb)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors.some(e => e.includes('solo se conjuga en'))).toBe(true)
    })
    
    it('should detect semantic inconsistencies', () => {
      const verbWithEmptyForm = {
        lemma: 'hablar',
        type: 'regular',
        paradigms: [{
          forms: [
            { mood: 'indicative', tense: 'pres', person: '1s', value: '' } // Empty value
          ]
        }]
      }
      
      const warnings = validator.validateSemanticConsistency(verbWithEmptyForm)
      expect(warnings.length).toBeGreaterThan(0)
      expect(warnings.some(w => w.includes('valor vacío'))).toBe(true)
    })
  })
  
  describe('Integration Functions', () => {
    it('should run quick validation', () => {
      const result = quickValidation()
      expect(result).toHaveProperty('isValid')
      expect(result).toHaveProperty('errors')
      expect(typeof result.isValid).toBe('boolean')
      expect(Array.isArray(result.errors)).toBe(true)
    })
    
    it('should run full validation', () => {
      // Mock console.log to avoid noise in tests
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const consoleGroupSpy = vi.spyOn(console, 'group').mockImplementation(() => {})
      
      const result = validateAllData()
      
      expect(result).toHaveProperty('totalErrors')
      expect(result).toHaveProperty('totalWarnings')
      expect(result).toHaveProperty('isValid')
      expect(typeof result.totalErrors).toBe('number')
      expect(typeof result.totalWarnings).toBe('number')
      expect(typeof result.isValid).toBe('boolean')
      
      // Restore console functions
      consoleSpy.mockRestore()
      consoleGroupSpy.mockRestore()
    })
  })
  
  describe('Edge Cases and Error Handling', () => {
    it('should handle verbs without paradigms gracefully', () => {
      const validator = new VerbValidator()
      const verbWithoutParadigms = {
        id: 'test',
        lemma: 'test',
        type: 'regular'
      }
      
      const result = validator.validateVerbForms(verbWithoutParadigms)
      expect(result.errors).toEqual([])
      expect(result.warnings).toEqual([])
    })
    
    it('should handle empty or malformed data', () => {
      const validator = new VerbValidator()
      
      expect(() => validator.validateVerbStructure({})).not.toThrow()
      expect(() => validator.validateVerbForms({})).not.toThrow()
      expect(() => validator.validateConjugationConsistency({})).not.toThrow()
    })
    
    it('should provide predictable interfaces for all validation methods', () => {
      const validator = new VerbValidator()
      
      // Test that all validation methods return expected types
      const testVerb = { id: 'test', lemma: 'test', type: 'regular', paradigms: [] }
      
      const structureResult = validator.validateVerbStructure(testVerb)
      expect(Array.isArray(structureResult)).toBe(true)
      
      const formsResult = validator.validateVerbForms(testVerb)
      expect(typeof formsResult).toBe('object')
      expect(formsResult).toHaveProperty('errors')
      expect(formsResult).toHaveProperty('warnings')
      
      const consistencyResult = validator.validateConjugationConsistency(testVerb)
      expect(Array.isArray(consistencyResult)).toBe(true)
      
      const fullResult = validator.validateVerb(testVerb)
      expect(typeof fullResult).toBe('object')
      expect(fullResult).toHaveProperty('errors')
      expect(fullResult).toHaveProperty('warnings')
    })
  })
})