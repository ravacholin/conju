import { describe, it, expect } from 'vitest'
import {
  LEARNING_IRREGULAR_FAMILIES,
  getLearningFamiliesByLevel,
  getLearningFamiliesByConcept,
  getLearningFamilyById,
  convertLearningFamilyToOld,
  getLearningFamiliesForTense,
} from './learningIrregularFamilies.js'

describe('learningIrregularFamilies helpers', () => {
  it('getLearningFamiliesByLevel limits by CEFR level', () => {
    const a1 = getLearningFamiliesByLevel('A1')
    expect(a1.length).toBeGreaterThan(0)
    // Only A1 families included
    expect(a1.every(f => f.level === 'A1')).toBe(true)

    const a2 = getLearningFamiliesByLevel('A2')
    // A2 includes A1 and A2
    expect(a2.some(f => f.level === 'A1')).toBe(true)
    expect(a2.some(f => f.level === 'A2')).toBe(true)
  })

  it('unknown level returns all families', () => {
    const all = getLearningFamiliesByLevel('Z9')
    expect(all.length).toBe(Object.values(LEARNING_IRREGULAR_FAMILIES).length)
  })

  it('getLearningFamiliesByConcept filters by concept', () => {
    const orth = getLearningFamiliesByConcept('orthographic')
    const ids = orth.map(f => f.id)
    expect(ids).toContain('LEARNING_ORTH_CAR')
  })

  it('getLearningFamilyById returns a known family', () => {
    const fam = getLearningFamilyById('LEARNING_YO_G_PRESENT')
    expect(fam).toBeTruthy()
    expect(fam.level).toBe('A2')
  })

  it('convertLearningFamilyToOld maps to legacy ids', () => {
    expect(convertLearningFamilyToOld('LEARNING_YO_G_PRESENT')).toBe('G_VERBS')
    expect(convertLearningFamilyToOld('LEARNING_DIPHTHONGS')).toBeTruthy()
  })

  it('getLearningFamiliesForTense maps old families for present to learning families', () => {
    const fams = getLearningFamiliesForTense('pres')
    const ids = fams.map(f => f.id)
    // Present should include diptongos and yo-g group
    expect(ids).toContain('LEARNING_DIPHTHONGS')
    expect(ids).toContain('LEARNING_YO_G_PRESENT')
  })
})

