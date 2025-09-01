// Test específico para replicar el bug reportado por el usuario
// Bug: Al seleccionar "indicativo, pretérito imperfecto, verbos irregulares"
// aparece "Condicional - Condicional" para "él/ella componer"

import { describe, it, expect, beforeEach } from 'vitest'
import { chooseNext } from './generator.js'
import { useSettings } from '../../state/settings.js'
import { buildFormsForRegion } from './eligibility.js'
import { clearAllCaches } from './optimizedCache.js'

describe('Bug Test: Incorrect mood/tense filtering', () => {
  beforeEach(() => {
    // Clear all caches before each test
    clearAllCaches()
    
    // Reset settings to default
    useSettings.setState({
      level: 'B1',
      practiceMode: 'mixed',
      specificMood: null,
      specificTense: null,
      verbType: 'all',
      region: 'la_general',
      useVoseo: true,
      useTuteo: true,
      useVosotros: false,
      cameFromTema: false
    })
  })

  it('CRITICAL: should never return conditional when imperfect is selected', () => {
    // Simulate user selection: "indicativo, pretérito imperfecto, verbos irregulares"
    const testSettings = {
      level: 'B2',
      practiceMode: 'specific',
      specificMood: 'indicative',
      specificTense: 'impf',
      verbType: 'irregular',
      region: 'la_general',
      useVoseo: true,
      useTuteo: true,
      useVosotros: false,
      cameFromTema: false
    }
    
    // Set these settings in the store
    useSettings.setState(testSettings)
    
    // Build forms for testing
    const forms = buildFormsForRegion('la_general')
    
    // Generate 100 exercises to catch the bug
    for (let i = 0; i < 100; i++) {
      const result = chooseNext({ 
        forms, 
        history: {}, 
        currentItem: null 
      })
      
      // CRITICAL ASSERTIONS: These should NEVER fail
      expect(result.mood, `Exercise ${i+1}: Wrong mood! Expected 'indicative', got '${result.mood}' for ${result.lemma} ${result.person} ${result.value}`).toBe('indicative')
      expect(result.tense, `Exercise ${i+1}: Wrong tense! Expected 'impf', got '${result.tense}' for ${result.lemma} ${result.person} ${result.value}`).toBe('impf')
      
      // Additional check: should never return conditional mood
      expect(result.mood, `Exercise ${i+1}: CRITICAL BUG - Returned conditional mood when indicative was selected!`).not.toBe('conditional')
      expect(result.tense, `Exercise ${i+1}: CRITICAL BUG - Returned conditional tense when imperfect was selected!`).not.toBe('cond')
    }
  })

  it('EDGE CASE: should handle componer verb correctly in imperfect', () => {
    // Specific test for "componer" verb mentioned in bug report
    const testSettings = {
      level: 'B2',
      practiceMode: 'specific',
      specificMood: 'indicative',
      specificTense: 'impf',
      verbType: 'irregular',
      region: 'la_general',
      useVoseo: true,
      useTuteo: true,
      useVosotros: false,
      cameFromTema: false,
      allowedLemmas: new Set(['componer']) // Force only componer
    }
    
    useSettings.setState(testSettings)
    const forms = buildFormsForRegion('la_general')
    
    // Filter to only componer forms in imperfect
    const componerImperfectForms = forms.filter(f => 
      f.lemma === 'componer' && 
      f.mood === 'indicative' && 
      f.tense === 'impf'
    )
    
    if (componerImperfectForms.length > 0) {
      // Test multiple times to ensure consistency
      for (let i = 0; i < 20; i++) {
        const result = chooseNext({ 
          forms: componerImperfectForms, 
          history: {}, 
          currentItem: null 
        })
        
        expect(result.lemma).toBe('componer')
        expect(result.mood).toBe('indicative')
        expect(result.tense).toBe('impf')
        expect(result.mood).not.toBe('conditional')
        expect(result.tense).not.toBe('cond')
      }
    }
  })

  it('VALIDATION: should throw error if no valid forms available', () => {
    // Test with impossible combination to ensure validation works
    const testSettings = {
      level: 'A1',
      practiceMode: 'specific',
      specificMood: 'nonexistent',  // Invalid mood
      specificTense: 'nonexistent', // Invalid tense
      verbType: 'irregular',
      region: 'la_general'
    }
    
    useSettings.setState(testSettings)
    const forms = buildFormsForRegion('la_general')
    
    expect(() => {
      chooseNext({ forms, history: {}, currentItem: null })
    }).toThrow()
  })

  it('CONSISTENCY: all specific practice should respect mood/tense settings', () => {
    const testCases = [
      { mood: 'indicative', tense: 'pres' },
      { mood: 'indicative', tense: 'pretIndef' },
      { mood: 'subjunctive', tense: 'subjPres' },
      { mood: 'conditional', tense: 'cond' },
    ]
    
    for (const { mood, tense } of testCases) {
      const testSettings = {
        level: 'B2',
        practiceMode: 'specific',
        specificMood: mood,
        specificTense: tense,
        verbType: 'all',
        region: 'la_general'
      }
      
      useSettings.setState(testSettings)
      const forms = buildFormsForRegion('la_general')
      
      // Test 10 exercises for each combination
      for (let i = 0; i < 10; i++) {
        const result = chooseNext({ forms, history: {}, currentItem: null })
        
        expect(result.mood, `${mood}/${tense} test ${i+1}: Wrong mood!`).toBe(mood)
        expect(result.tense, `${mood}/${tense} test ${i+1}: Wrong tense!`).toBe(tense)
      }
    }
  })
})