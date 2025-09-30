/**
 * Tests para PronunciationAnalyzer
 * Verifica la precisión del sistema de corrección, validación semántica y feedback educacional
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import PronunciationAnalyzer from '../pronunciationAnalyzer.js'

// Mock semantic validator
vi.mock('../semanticValidator.js', () => ({
  semanticValidator: {
    validateConjugation: vi.fn()
  }
}))

describe('PronunciationAnalyzer', () => {
  let analyzer

  beforeEach(() => {
    analyzer = new PronunciationAnalyzer()
    vi.clearAllMocks()
  })

  describe('Initialization', () => {
    it('should initialize with strict pedagogical thresholds', () => {
      expect(analyzer.thresholds.perfect).toBe(100)
      expect(analyzer.thresholds.excellent).toBe(95)
      expect(analyzer.thresholds.good).toBe(85)
      expect(analyzer.passingThreshold).toBe(90) // Strict threshold
    })

    it('should initialize with enhanced error patterns', () => {
      expect(analyzer.commonSpanishErrors.vowelErrors).toBeInstanceOf(Map)
      expect(analyzer.commonSpanishErrors.consonantErrors).toBeInstanceOf(Map)
      expect(analyzer.commonSpanishErrors.silentLetters).toContain('h')
    })
  })

  describe('Strict Pronunciation Analysis', () => {
    it('should return perfect score for exact matches', () => {
      const mockSemanticResult = {
        type: 'exact_match',
        pedagogicalScore: 100,
        suggestion: null
      }

      analyzer.semanticValidator.validateConjugation.mockReturnValue(mockSemanticResult)

      const result = analyzer.analyzePronunciation('hablo', 'hablo', {
        verb: 'hablar',
        mood: 'indicative',
        tense: 'pres',
        person: '1s'
      })

      expect(result.accuracy).toBe(100)
      expect(result.pedagogicalScore).toBe(100)
      expect(result.isCorrectForSRS).toBe(true)
      expect(result.feedback).toContain('Perfecto')
    })

    it('should use strict 90% threshold for SRS correctness', () => {
      const mockSemanticResult = {
        type: 'valid_conjugation',
        pedagogicalScore: 95,
        suggestion: null
      }

      analyzer.semanticValidator.validateConjugation.mockReturnValue(mockSemanticResult)

      const result = analyzer.analyzePronunciation('como', 'como', {})

      expect(result.accuracy).toBe(95)
      expect(result.isCorrectForSRS).toBe(true) // 95% >= 90%

      // Test boundary case
      mockSemanticResult.pedagogicalScore = 89
      const lowResult = analyzer.analyzePronunciation('como', 'coma', {})
      expect(lowResult.isCorrectForSRS).toBe(false) // 89% < 90%
    })

    it('should handle accent errors appropriately', () => {
      const mockSemanticResult = {
        type: 'accent_error',
        pedagogicalScore: 85,
        message: 'Conjugación correcta pero falta acento',
        suggestion: 'Practica la acentuación española'
      }

      analyzer.semanticValidator.validateConjugation.mockReturnValue(mockSemanticResult)

      const result = analyzer.analyzePronunciation('comí', 'comi', {})

      expect(result.accuracy).toBe(85)
      expect(result.isCorrectForSRS).toBe(false) // Below 90% threshold
      expect(result.feedback).toContain('acentuación')
    })

    it('should reject wrong conjugations strictly', () => {
      const mockSemanticResult = {
        type: 'different_verb',
        pedagogicalScore: 10,
        message: 'Es conjugación de otro verbo',
        suggestion: 'Pronuncia la conjugación correcta'
      }

      analyzer.semanticValidator.validateConjugation.mockReturnValue(mockSemanticResult)

      const result = analyzer.analyzePronunciation('hablo', 'como', {})

      expect(result.accuracy).toBe(10)
      expect(result.isCorrectForSRS).toBe(false)
      expect(result.feedback).toContain('otro verbo')
    })
  })

  describe('Enhanced Error Detection', () => {
    it('should detect vowel confusion patterns', () => {
      const errors = analyzer.detectCommonErrors('hablo', 'hiblo')

      const vowelErrors = errors.filter(e => e.type === 'vowel_confusion')
      expect(vowelErrors.length).toBeGreaterThan(0)
      expect(vowelErrors[0].description).toContain('a/i')
      expect(vowelErrors[0].suggestion).toContain('diferencia entre "a" y "i"')
    })

    it('should detect consonant confusion patterns', () => {
      const errors = analyzer.detectCommonErrors('hablo', 'havlo')

      const consonantErrors = errors.filter(e => e.type === 'consonant_confusion')
      expect(consonantErrors.length).toBeGreaterThan(0)
      expect(consonantErrors[0].description).toContain('b/v')
    })

    it('should detect silent letter errors', () => {
      const errors = analyzer.detectCommonErrors('hablo', 'ablo')

      const silentErrors = errors.filter(e => e.type === 'silent_letter_error')
      expect(silentErrors.length).toBeGreaterThan(0)
      expect(silentErrors[0].description).toContain('h" es muda')
    })

    it('should detect accent position errors', () => {
      const errors = analyzer._detectAccentErrors('comió', 'cómio')

      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].type).toBe('accent_position_error')
      expect(errors[0].description).toContain('posición incorrecta')
    })

    it('should detect accent count errors', () => {
      const errors = analyzer._detectAccentErrors('comió', 'comío')

      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].type).toBe('accent_count_error')
      expect(errors[0].description).toContain('Número incorrecto')
    })

    it('should assign appropriate error severities', () => {
      // High severity: r/rr confusion
      expect(analyzer._getConsonantErrorSeverity('r', 'rr')).toBe('high')
      expect(analyzer._getConsonantErrorSeverity('ñ', 'n')).toBe('high')

      // Medium severity: b/v confusion
      expect(analyzer._getConsonantErrorSeverity('b', 'v')).toBe('medium')
      expect(analyzer._getConsonantErrorSeverity('c', 's')).toBe('medium')

      // Low severity: other confusions
      expect(analyzer._getConsonantErrorSeverity('d', 't')).toBe('low')
    })
  })

  describe('Educational Suggestions', () => {
    it('should generate specific suggestions for vowel errors', () => {
      const mockSemanticResult = {
        type: 'minor_pronunciation',
        suggestion: 'Articula mejor'
      }

      const mockDetailedAnalysis = {
        phoneticAnalysis: {
          common_errors: [
            {
              type: 'vowel_confusion',
              description: 'Confusión e/i',
              suggestion: 'Practica vocales'
            }
          ]
        }
      }

      const suggestions = analyzer.generateEducationalSuggestions(mockSemanticResult, mockDetailedAnalysis)

      expect(suggestions).toContain('Articula mejor')
      expect(suggestions.some(s => s.includes('vocales'))).toBe(true)
      expect(suggestions.some(s => s.includes('a, e, i, o, u'))).toBe(true)
    })

    it('should generate specific suggestions for consonant errors', () => {
      const mockSemanticResult = { type: 'minor_pronunciation' }
      const mockDetailedAnalysis = {
        phoneticAnalysis: {
          common_errors: [
            {
              type: 'consonant_confusion',
              severity: 'high',
              suggestion: 'Practica la rr vibrante'
            }
          ]
        }
      }

      const suggestions = analyzer.generateEducationalSuggestions(mockSemanticResult, mockDetailedAnalysis)

      expect(suggestions.some(s => s.includes('rr vibrante'))).toBe(true)
      expect(suggestions.some(s => s.includes('consonantes españolas'))).toBe(true)
    })

    it('should generate accent-specific suggestions', () => {
      const mockSemanticResult = { type: 'accent_error' }
      const mockDetailedAnalysis = {
        phoneticAnalysis: {
          common_errors: [
            {
              type: 'accent_errors',
              description: 'Problema de acentuación'
            }
          ]
        }
      }

      const suggestions = analyzer.generateEducationalSuggestions(mockSemanticResult, mockDetailedAnalysis)

      expect(suggestions.some(s => s.includes('agudas'))).toBe(true)
      expect(suggestions.some(s => s.includes('llanas'))).toBe(true)
      expect(suggestions.some(s => s.includes('esdrújulas'))).toBe(true)
    })

    it('should limit suggestions to most relevant ones', () => {
      const mockSemanticResult = {
        type: 'wrong_context',
        suggestion: 'Revisa el tiempo'
      }

      const mockDetailedAnalysis = {
        phoneticAnalysis: {
          common_errors: Array(10).fill({
            type: 'vowel_confusion',
            description: 'Muchos errores'
          })
        }
      }

      const suggestions = analyzer.generateEducationalSuggestions(mockSemanticResult, mockDetailedAnalysis)

      expect(suggestions.length).toBeLessThanOrEqual(4) // Limited to 4 suggestions
      expect(new Set(suggestions).size).toBe(suggestions.length) // No duplicates
    })
  })

  describe('Phonetic Analysis', () => {
    it('should calculate vowel accuracy correctly', () => {
      const accuracy1 = analyzer.analyzeVowels('hablo', 'hiblo')
      expect(accuracy1).toBe(80) // 4/5 vowels correct

      const accuracy2 = analyzer.analyzeVowels('como', 'como')
      expect(accuracy2).toBe(100) // Perfect match
    })

    it('should calculate consonant accuracy correctly', () => {
      const accuracy = analyzer.analyzeConsonants('hablo', 'havlo')
      expect(accuracy).toBeLessThan(100) // b/v substitution detected
      expect(accuracy).toBeGreaterThan(0)
    })

    it('should handle diphthong analysis', () => {
      const accuracy1 = analyzer.analyzeDiphthongs('viene', 'viene')
      expect(accuracy1).toBe(100) // Perfect ie diphthong

      const accuracy2 = analyzer.analyzeDiphthongs('viene', 'veine')
      expect(accuracy2).toBeLessThan(100) // ie/ei confusion
    })
  })

  describe('Text Similarity', () => {
    it('should detect exact matches', () => {
      const similarity = analyzer.analyzeTextSimilarity('hablo', 'hablo')
      expect(similarity.similarity).toBe(100)
      expect(similarity.exact_match).toBe(true)
      expect(similarity.distance).toBe(0)
    })

    it('should calculate Levenshtein distance correctly', () => {
      const distance1 = analyzer.levenshteinDistance('hablo', 'hiblo')
      expect(distance1).toBe(1) // One substitution

      const distance2 = analyzer.levenshteinDistance('como', 'coma')
      expect(distance2).toBe(1) // One substitution

      const distance3 = analyzer.levenshteinDistance('hablar', 'comer')
      expect(distance3).toBeGreaterThan(3) // Multiple changes
    })
  })

  describe('Stress Pattern Analysis', () => {
    it('should count syllables correctly', () => {
      expect(analyzer.countSyllables('hablo')).toBe(2) // ha-blo
      expect(analyzer.countSyllables('conjugación')).toBe(4) // con-ju-ga-ción
      expect(analyzer.countSyllables('está')).toBe(2) // es-tá
    })

    it('should determine stress types correctly', () => {
      expect(analyzer.getStressType('habló')).toBe('esdrújula') // Has written accent
      expect(analyzer.getStressType('hablo')).toBe('llana') // Ends in vowel
      expect(analyzer.getStressType('amor')).toBe('aguda') // Ends in consonant
    })

    it('should handle diphthongs in syllable counting', () => {
      expect(analyzer.countSyllables('tiene')).toBe(2) // tie-ne (ie is diphthong)
      expect(analyzer.countSyllables('piano')).toBe(2) // pia-no (ia is diphthong)
    })
  })

  describe('Error Handling', () => {
    it('should handle analysis errors gracefully', () => {
      // Mock semantic validator to throw error
      analyzer.semanticValidator.validateConjugation.mockImplementation(() => {
        throw new Error('Validation failed')
      })

      const result = analyzer.analyzePronunciation('hablo', 'hablo', {})

      expect(result.accuracy).toBe(0)
      expect(result.isCorrectForSRS).toBe(false)
      expect(result.feedback).toContain('Error en el análisis')
      expect(result.suggestions).toContain('Inténtalo de nuevo - error técnico')
    })

    it('should handle empty inputs', () => {
      const mockSemanticResult = {
        type: 'incorrect_word',
        pedagogicalScore: 0
      }

      analyzer.semanticValidator.validateConjugation.mockReturnValue(mockSemanticResult)

      const result = analyzer.analyzePronunciation('', '', {})

      expect(result.accuracy).toBe(0)
      expect(result.isCorrectForSRS).toBe(false)
    })
  })

  describe('Backwards Compatibility', () => {
    it('should maintain legacy phonetic scoring method', () => {
      const mockAnalysis = {
        textSimilarity: { similarity: 90 },
        phoneticAnalysis: { overall_score: 85 },
        stressAnalysis: { accuracy: 80 },
        fluentAnalysis: { confidence_score: 75 }
      }

      const legacyScore = analyzer.calculateLegacyPhoneticScore(mockAnalysis)
      expect(legacyScore).toBeGreaterThan(70)
      expect(legacyScore).toBeLessThan(95)
    })

    it('should maintain legacy feedback generation', () => {
      const feedback = analyzer.generateLegacyFeedback(95, {
        textSimilarity: { exact_match: false }
      })

      expect(feedback).toContain('Excelente pronunciación')
    })
  })
})