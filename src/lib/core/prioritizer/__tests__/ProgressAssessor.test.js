/**
 * Tests for ProgressAssessor
 * Verifies progress assessment and readiness calculations
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { ProgressAssessor } from '../ProgressAssessor.js'
import { CurriculumProcessor } from '../CurriculumProcessor.js'

describe('ProgressAssessor', () => {
  let assessor
  let curriculum

  beforeEach(() => {
    curriculum = new CurriculumProcessor()
    assessor = new ProgressAssessor(curriculum)
  })

  describe('createMasteryMap', () => {
    it('should create a map from progress data', () => {
      const progress = [
        { mood: 'indicative', tense: 'pres', score: 85 },
        { mood: 'subjunctive', tense: 'subjPres', score: 65 }
      ]

      const masteryMap = assessor.createMasteryMap(progress)

      expect(masteryMap.get('indicative|pres')).toBe(85)
      expect(masteryMap.get('subjunctive|subjPres')).toBe(65)
    })

    it('should handle empty progress', () => {
      const masteryMap = assessor.createMasteryMap([])
      expect(masteryMap.size).toBe(0)
    })

    it('should handle null progress', () => {
      const masteryMap = assessor.createMasteryMap(null)
      expect(masteryMap.size).toBe(0)
    })
  })

  describe('assessReadiness', () => {
    it('should return 1.0 for tenses with no prerequisites', () => {
      const tense = { key: 'indicative|pres', mood: 'indicative', tense: 'pres' }
      const masteryMap = new Map()

      const readiness = assessor.assessReadiness(tense, masteryMap)
      expect(readiness).toBe(1.0)
    })

    it('should calculate readiness based on prerequisite mastery', () => {
      const tense = { key: 'subjunctive|subjPres', mood: 'subjunctive', tense: 'subjPres' }
      const masteryMap = new Map([
        ['indicative|pres', 80],
        ['indicative|pretIndef', 70]
      ])

      const readiness = assessor.assessReadiness(tense, masteryMap)

      // Average of prereqs: (80 + 70) / 2 = 75
      // Readiness: 75 / 75 = 1.0
      expect(readiness).toBe(1.0)
    })

    it('should return 0.5 when no prerequisite data available', () => {
      const tense = { key: 'subjunctive|subjPres', mood: 'subjunctive', tense: 'subjPres' }
      const masteryMap = new Map()

      const readiness = assessor.assessReadiness(tense, masteryMap)
      expect(readiness).toBe(0.5)
    })
  })

  describe('determineLearningStage', () => {
    it('should identify beginner stage', () => {
      const progress = [
        { mood: 'indicative', tense: 'pres', score: 10 }
      ]
      const masteryMap = assessor.createMasteryMap(progress)

      const stage = assessor.determineLearningStage('A1', masteryMap)

      expect(stage.stage).toBe('beginner')
      expect(stage.avgMastery).toBeLessThan(20)
    })

    it('should identify mastered stage', () => {
      const progress = [
        { mood: 'indicative', tense: 'pres', score: 85 },
        { mood: 'nonfinite', tense: 'ger', score: 80 },
        { mood: 'nonfinite', tense: 'part', score: 90 }
      ]
      const masteryMap = assessor.createMasteryMap(progress)

      const stage = assessor.determineLearningStage('A1', masteryMap)

      expect(stage.stage).toBe('mastered')
      expect(stage.avgMastery).toBeGreaterThanOrEqual(75)
    })

    it('should provide recommendations', () => {
      const masteryMap = new Map()
      const stage = assessor.determineLearningStage('B1', masteryMap)

      expect(stage.recommendation).toBeDefined()
      expect(typeof stage.recommendation).toBe('string')
    })
  })

  describe('getPrerequisiteGaps', () => {
    it('should identify missing prerequisites', () => {
      const progress = [
        { mood: 'indicative', tense: 'pres', score: 50 } // Below 70 threshold
      ]

      const gaps = assessor.getPrerequisiteGaps('B1', progress)

      expect(Array.isArray(gaps)).toBe(true)
      // Should have some gaps since pres is needed but not mastered
      expect(gaps.length).toBeGreaterThan(0)
    })

    it('should sort gaps by priority', () => {
      const progress = [
        { mood: 'indicative', tense: 'pres', score: 30 },
        { mood: 'indicative', tense: 'pretIndef', score: 60 }
      ]

      const gaps = assessor.getPrerequisiteGaps('B1', progress)

      // Lower mastery should have higher priority
      if (gaps.length >= 2) {
        expect(gaps[0].priority).toBeGreaterThanOrEqual(gaps[1].priority)
      }
    })
  })

  describe('getTenseFamilyGroups', () => {
    it('should group tenses by family', () => {
      const progress = [
        { mood: 'indicative', tense: 'pres', score: 70 }
      ]

      const groups = assessor.getTenseFamilyGroups('A1', progress)

      expect(groups).toBeDefined()
      expect(typeof groups).toBe('object')

      // Should have basic_present family for A1
      expect(groups.basic_present).toBeDefined()
    })

    it('should calculate completion status', () => {
      const progress = [
        { mood: 'indicative', tense: 'pres', score: 80 }
      ]

      const groups = assessor.getTenseFamilyGroups('A1', progress)
      const basicPresent = groups.basic_present

      expect(basicPresent.completionStatus).toBeDefined()
      expect(['not_started', 'started', 'in_progress', 'completed']).toContain(basicPresent.completionStatus)
    })
  })

  describe('getProgressionPath', () => {
    it('should return ready tenses', () => {
      const progress = [
        { mood: 'indicative', tense: 'pres', score: 80 }
      ]

      const path = assessor.getProgressionPath('A2', progress)

      expect(Array.isArray(path)).toBe(true)
      // Should have some tenses that are ready to learn
      expect(path.length).toBeGreaterThan(0)
    })

    it('should include mastery and readiness scores', () => {
      const progress = [
        { mood: 'indicative', tense: 'pres', score: 75 }
      ]

      const path = assessor.getProgressionPath('A2', progress)

      if (path.length > 0) {
        const firstTense = path[0]
        expect(firstTense.mastery).toBeDefined()
        expect(firstTense.readiness).toBeDefined()
        expect(firstTense.priority).toBeDefined()
      }
    })
  })
})
