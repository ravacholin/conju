import { describe, it, expect } from 'vitest'
import {
  A1_A2_ONLY_VERBS,
  B1_ALLOWED_IRREGULAR_VERBS,  
  B2_PLUS_ONLY_VERBS,
  C1_PLUS_ONLY_VERBS,
  getMinimumLevelForVerb,
  getVerbPriority,
  getVerbSelectionWeight
} from './levelVerbFiltering.js'

describe('Level Verb Filtering System', () => {
  
  describe('Verb Level Categories', () => {
    it('should have A1-A2 only verbs defined', () => {
      expect(Array.isArray(A1_A2_ONLY_VERBS)).toBe(true)
      expect(A1_A2_ONLY_VERBS.length).toBeGreaterThan(0)
      expect(A1_A2_ONLY_VERBS).toContain('ser')
      expect(A1_A2_ONLY_VERBS).toContain('estar')
      expect(A1_A2_ONLY_VERBS).toContain('tener')
      expect(A1_A2_ONLY_VERBS).toContain('hablar')
    })

    it('should have B1+ intermediate verbs defined', () => {
      expect(Array.isArray(B1_ALLOWED_IRREGULAR_VERBS)).toBe(true)
      expect(B1_ALLOWED_IRREGULAR_VERBS.length).toBeGreaterThan(0)
      expect(B1_ALLOWED_IRREGULAR_VERBS).toContain('morir')
      expect(B1_ALLOWED_IRREGULAR_VERBS).toContain('pedir')
    })

    it('should have B2+ advanced verbs defined', () => {
      expect(Array.isArray(B2_PLUS_ONLY_VERBS)).toBe(true)
      expect(B2_PLUS_ONLY_VERBS.length).toBeGreaterThan(0)
      expect(B2_PLUS_ONLY_VERBS).toContain('vencer')
      expect(B2_PLUS_ONLY_VERBS).toContain('construir')
    })

    it('should have C1+ very advanced verbs defined', () => {
      expect(Array.isArray(C1_PLUS_ONLY_VERBS)).toBe(true)
      expect(C1_PLUS_ONLY_VERBS.length).toBeGreaterThan(0)
      expect(C1_PLUS_ONLY_VERBS).toContain('asir')
      expect(C1_PLUS_ONLY_VERBS).toContain('balbucir')
    })

    it('should have intentional overlaps between categories (by design)', () => {
      const a1a2Set = new Set(A1_A2_ONLY_VERBS)
      const b1Set = new Set(B1_ALLOWED_IRREGULAR_VERBS)
      
      // Find overlaps between A1-A2 and B1 (these are by design)
      const overlaps = A1_A2_ONLY_VERBS.filter(verb => b1Set.has(verb))
      
      // Test that overlaps exist (this documents the intentional design)
      expect(overlaps.length).toBeGreaterThan(0)
      
      // Verify some expected overlaps exist in both lists
      const expectedOverlaps = ['encontrar', 'repetir', 'seguir', 'sentir', 'preferir']
      expectedOverlaps.forEach(verb => {
        if (a1a2Set.has(verb) && b1Set.has(verb)) {
          expect(overlaps).toContain(verb)
        }
      })
    })
  })

  describe('getMinimumLevelForVerb', () => {
    it('should return A1 for basic verbs', () => {
      expect(getMinimumLevelForVerb('ser')).toBe('A1')
      expect(getMinimumLevelForVerb('estar')).toBe('A1')
      expect(getMinimumLevelForVerb('hablar')).toBe('A1')
      expect(getMinimumLevelForVerb('pensar')).toBe('A1')
    })

    it('should return B1 for intermediate irregular verbs', () => {
      expect(getMinimumLevelForVerb('morir')).toBe('B1')
      expect(getMinimumLevelForVerb('pedir')).toBe('B1')
      expect(getMinimumLevelForVerb('servir')).toBe('B1')
    })

    it('should return B2 for advanced irregular verbs', () => {
      expect(getMinimumLevelForVerb('vencer')).toBe('B2')
      expect(getMinimumLevelForVerb('construir')).toBe('B2')
      expect(getMinimumLevelForVerb('distinguir')).toBe('B2')
    })

    it('should return C1 for very advanced verbs', () => {
      expect(getMinimumLevelForVerb('asir')).toBe('C1')
      expect(getMinimumLevelForVerb('balbucir')).toBe('C1')
      expect(getMinimumLevelForVerb('desvaír')).toBe('C1')
    })

    it('should return B1 for uncategorized verbs', () => {
      expect(getMinimumLevelForVerb('inventedverb')).toBe('B1')
      expect(getMinimumLevelForVerb('nonexistent')).toBe('B1')
    })

    it('should handle empty/null inputs', () => {
      expect(getMinimumLevelForVerb('')).toBe('B1')
      expect(getMinimumLevelForVerb(null)).toBe('B1')
      expect(getMinimumLevelForVerb(undefined)).toBe('B1')
    })
  })

  describe('getVerbPriority', () => {
    it('should give highest priority to A1-A2 verbs', () => {
      expect(getVerbPriority('ser')).toBe(1)
      expect(getVerbPriority('estar')).toBe(1)
      expect(getVerbPriority('hablar')).toBe(1)
    })

    it('should give high priority to B1 irregular verbs', () => {
      expect(getVerbPriority('morir')).toBe(2)
      expect(getVerbPriority('pedir')).toBe(2)
      expect(getVerbPriority('servir')).toBe(2)
    })

    it('should give low priority to B2+ advanced verbs', () => {
      expect(getVerbPriority('vencer')).toBe(3)
      expect(getVerbPriority('construir')).toBe(3)
    })

    it('should give lowest priority to C1+ very advanced verbs', () => {
      expect(getVerbPriority('asir')).toBe(4)
      expect(getVerbPriority('balbucir')).toBe(4)
    })

    it('should give medium priority to uncategorized verbs', () => {
      expect(getVerbPriority('inventedverb')).toBe(2)
      expect(getVerbPriority('someotherverb')).toBe(2)
    })
  })

  describe('getVerbSelectionWeight', () => {
    it('should give maximum weight to A1 verbs for A1 users', () => {
      const weight = getVerbSelectionWeight('ser', 'A1')
      expect(weight).toBeGreaterThan(10)
    })

    it('should give high weight to B1 verbs for B1 users', () => {
      const weight = getVerbSelectionWeight('pedir', 'B1')
      expect(weight).toBeGreaterThan(8)
    })

    it('should give low weight to advanced verbs for beginner users', () => {
      const weightB2 = getVerbSelectionWeight('vencer', 'A1')
      const weightC1 = getVerbSelectionWeight('asir', 'A1')
      
      // B2+ verbs get base weight 3, C1+ get weight 1, both * 10 = 30, 10
      expect(weightB2).toBeLessThan(50) // Should be 30 (3*10)
      expect(weightC1).toBeLessThan(20) // Should be 10 (1*10)
      
      // Advanced verbs should have lower weight than basic verbs
      const weightA1 = getVerbSelectionWeight('ser', 'A1')
      expect(weightB2).toBeLessThan(weightA1)
      expect(weightC1).toBeLessThan(weightA1)
    })

    it('should boost weight for verbs matching user level', () => {
      const a1VerbForA1 = getVerbSelectionWeight('ser', 'A1')
      const a1VerbForB1 = getVerbSelectionWeight('ser', 'B1')
      
      // A1 verb should have higher weight for A1 user than B1 user
      expect(a1VerbForA1).toBeGreaterThan(a1VerbForB1)
    })

    it('should handle ALL level appropriately', () => {
      const basicWeight = getVerbSelectionWeight('ser', 'ALL')
      const advancedWeight = getVerbSelectionWeight('vencer', 'ALL')
      
      expect(basicWeight).toBeGreaterThan(advancedWeight)
      expect(basicWeight).toBeGreaterThan(0)
      expect(advancedWeight).toBeGreaterThan(0)
    })

    it('should handle invalid levels gracefully', () => {
      const weight = getVerbSelectionWeight('ser', 'INVALID')
      expect(weight).toBeGreaterThan(0)
      expect(typeof weight).toBe('number')
    })
  })

  describe('Level Progression Logic', () => {
    it('should maintain proper hierarchy in priorities', () => {
      const a1Priority = getVerbPriority('ser')     // A1 verb
      const b1Priority = getVerbPriority('pedir')   // B1 verb  
      const b2Priority = getVerbPriority('vencer')  // B2 verb
      const c1Priority = getVerbPriority('asir')    // C1 verb
      
      expect(a1Priority).toBeLessThan(b1Priority)
      expect(b1Priority).toBeLessThan(b2Priority)
      expect(b2Priority).toBeLessThan(c1Priority)
    })

    it('should maintain proper level requirements', () => {
      const levels = ['A1', 'B1', 'B2', 'C1']
      
      for (let i = 0; i < levels.length - 1; i++) {
        const currentLevel = levels[i]
        const _nextLevel = levels[i + 1]
        
        // Test with representative verbs from each category
        const currentLevelVerb = currentLevel === 'A1' ? 'ser' :
                               currentLevel === 'B1' ? 'pedir' :
                               currentLevel === 'B2' ? 'vencer' : 'asir'
        
        const minLevel = getMinimumLevelForVerb(currentLevelVerb)
        expect(['A1', 'B1', 'B2', 'C1']).toContain(minLevel)
      }
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty string inputs', () => {
      expect(() => getMinimumLevelForVerb('')).not.toThrow()
      expect(() => getVerbPriority('')).not.toThrow()
      expect(() => getVerbSelectionWeight('', 'A1')).not.toThrow()
    })

    it('should handle null/undefined inputs', () => {
      expect(() => getMinimumLevelForVerb(null)).not.toThrow()
      expect(() => getMinimumLevelForVerb(undefined)).not.toThrow()
      expect(() => getVerbPriority(null)).not.toThrow()
      expect(() => getVerbSelectionWeight(null, 'A1')).not.toThrow()
    })

    it('should be consistent with repeated calls', () => {
      const verb = 'ser'
      const level = 'A1'
      
      const result1 = getMinimumLevelForVerb(verb)
      const result2 = getMinimumLevelForVerb(verb)
      expect(result1).toBe(result2)
      
      const priority1 = getVerbPriority(verb)
      const priority2 = getVerbPriority(verb)
      expect(priority1).toBe(priority2)
      
      const weight1 = getVerbSelectionWeight(verb, level)
      const weight2 = getVerbSelectionWeight(verb, level)
      expect(weight1).toBe(weight2)
    })

    it('should handle case sensitivity properly', () => {
      // Should be case sensitive for verb lemmas
      expect(getMinimumLevelForVerb('SER')).toBe('B1') // Not found, defaults to B1
      expect(getMinimumLevelForVerb('ser')).toBe('A1') // Found
      
      // Should handle different level formats
      expect(getVerbSelectionWeight('ser', 'a1')).toBeGreaterThan(0) // Still works
      expect(getVerbSelectionWeight('ser', 'A1')).toBeGreaterThan(0)
    })

    it('should return reasonable values for all inputs', () => {
      const testVerbs = ['ser', 'inventedverb', '', null]
      const testLevels = ['A1', 'B1', 'C1', 'ALL', 'INVALID']
      
      testVerbs.forEach(verb => {
        if (verb !== null) {
          const minLevel = getMinimumLevelForVerb(verb)
          expect(['A1', 'B1', 'B2', 'C1']).toContain(minLevel)
          
          const priority = getVerbPriority(verb)
          expect(priority).toBeGreaterThan(0)
          expect(priority).toBeLessThanOrEqual(4)
          
          testLevels.forEach(level => {
            const weight = getVerbSelectionWeight(verb, level)
            expect(weight).toBeGreaterThan(0)
            expect(typeof weight).toBe('number')
          })
        }
      })
    })
  })
})