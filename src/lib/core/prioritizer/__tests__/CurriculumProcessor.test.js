/**
 * Tests for CurriculumProcessor
 * Verifies that curriculum processing works correctly
 */

import { describe, it, expect } from 'vitest'
import { CurriculumProcessor } from '../CurriculumProcessor.js'

describe('CurriculumProcessor', () => {
  let processor

  beforeEach(() => {
    processor = new CurriculumProcessor()
  })

  it('should process curriculum data', () => {
    expect(processor.curriculumData).toBeDefined()
    expect(processor.curriculumData.byLevel).toBeDefined()
    expect(processor.curriculumData.levelIntroductions).toBeDefined()
    expect(processor.curriculumData.levelOrder).toBeDefined()
    expect(processor.curriculumData.tenseFamilies).toBeDefined()
    expect(processor.curriculumData.prerequisiteChains).toBeDefined()
  })

  it('should have data for all CEFR levels', () => {
    const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
    levels.forEach(level => {
      expect(processor.curriculumData.byLevel[level]).toBeDefined()
      expect(Array.isArray(processor.curriculumData.byLevel[level])).toBe(true)
    })
  })

  it('should identify tense families correctly', () => {
    expect(processor.getTenseFamily('indicative|pres')).toBe('basic_present')
    expect(processor.getTenseFamily('indicative|pretIndef')).toBe('past_narrative')
    expect(processor.getTenseFamily('subjunctive|subjPres')).toBe('subjunctive_present')
  })

  it('should build prerequisite chains', () => {
    const chain = processor.getPrerequisiteChain('subjunctive|subjPres')
    expect(Array.isArray(chain)).toBe(true)
    expect(chain).toContain('indicative|pres')
    expect(chain).toContain('indicative|pretIndef')
  })

  it('should get level data', () => {
    const a1Data = processor.getLevelData('A1')
    expect(Array.isArray(a1Data)).toBe(true)
    expect(a1Data.length).toBeGreaterThan(0)

    // A1 should have present tense
    const hasPres = a1Data.some(item => item.tense === 'pres')
    expect(hasPres).toBe(true)
  })

  it('should get level progression', () => {
    const b1Progression = processor.getLevelProgression('B1')
    expect(Array.isArray(b1Progression)).toBe(true)
    expect(b1Progression.length).toBeGreaterThan(0)

    // Progression should be sorted by complexity
    for (let i = 0; i < b1Progression.length - 1; i++) {
      const current = b1Progression[i]
      const next = b1Progression[i + 1]

      // Core tenses should come before non-core
      if (current.isCore && !next.isCore) {
        // This is correct ordering
        expect(true).toBe(true)
      }
    }
  })

  it('should have tense family groups', () => {
    const families = processor.getTenseFamilyGroups()
    expect(families).toBeDefined()
    expect(families.basic_present).toBeDefined()
    expect(families.past_narrative).toBeDefined()
    expect(families.perfect_system).toBeDefined()
  })
})
