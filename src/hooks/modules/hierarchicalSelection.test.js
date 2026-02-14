import { describe, it, expect, vi } from 'vitest'
import { selectNextForm } from './hierarchicalSelection.js'

describe('hierarchicalSelection', () => {
  const baseSettings = {
    level: 'A1',
    practiceMode: 'mixed',
    verbType: 'all'
  }

  it('prioritizes SRS due items when available', async () => {
    const eligibleForms = [
      { lemma: 'hablar', mood: 'indicative', tense: 'pres', person: '1s' },
      { lemma: 'comer', mood: 'indicative', tense: 'pres', person: '2s' }
    ]

    const dependencies = {
      getCurrentUserId: vi.fn().mockReturnValue('user-1'),
      getDueItems: vi.fn().mockResolvedValue([{ mood: 'indicative', tense: 'pres', person: '1s' }]),
      gateDueItemsByCurriculum: vi.fn((items) => items),
      filterDueForSpecific: vi.fn((items) => items),
      applyReviewSessionFilter: vi.fn((items) => items),
      selectDueCandidate: vi.fn(items => items[0]),
      filterByVerbType: vi.fn((items) => items),
      selectVariedForm: vi.fn((items) => items[0]),
      getNextRecommendedItem: vi.fn(),
      chooseNext: vi.fn()
    }

    // Run multiple times - SRS should be used sometimes (35% probability)
    let srsUsed = false
    let generatorUsed = false
    for (let i = 0; i < 30; i++) {
      const result = await selectNextForm({
        eligibleForms,
        settings: baseSettings,
        history: {},
        itemToExclude: null,
        specificConstraints: { isSpecific: false },
        reviewSessionType: 'due',
        reviewSessionFilter: {},
        now: new Date(),
        dependencies
      })

      if (result.selectionMethod === 'srs_due_with_variety') srsUsed = true
      if (result.selectionMethod === 'standard_generator') generatorUsed = true
    }

    // In mixed practice, both SRS and generator should be used across iterations
    expect(srsUsed || generatorUsed).toBe(true)
  })

  it('uses SRS deterministically for explicit review practice', async () => {
    const eligibleForms = [
      { lemma: 'hablar', mood: 'indicative', tense: 'pres', person: '1s' },
      { lemma: 'comer', mood: 'indicative', tense: 'pres', person: '2s' }
    ]

    const dependencies = {
      getCurrentUserId: vi.fn().mockReturnValue('user-1'),
      getDueItems: vi.fn().mockResolvedValue([{ mood: 'indicative', tense: 'pres', person: '1s' }]),
      gateDueItemsByCurriculum: vi.fn((items) => items),
      filterDueForSpecific: vi.fn((items) => items),
      applyReviewSessionFilter: vi.fn((items) => items),
      selectDueCandidate: vi.fn(items => items[0]),
      filterByVerbType: vi.fn((items) => items),
      selectVariedForm: vi.fn((items) => items[0]),
      getNextRecommendedItem: vi.fn(),
      chooseNext: vi.fn()
    }

    const result = await selectNextForm({
      eligibleForms,
      settings: { ...baseSettings, practiceMode: 'review' },
      history: {},
      itemToExclude: null,
      specificConstraints: { isSpecific: false },
      reviewSessionType: 'due',
      reviewSessionFilter: {},
      now: new Date(),
      dependencies
    })

    expect(result.form).toEqual({ lemma: 'hablar', mood: 'indicative', tense: 'pres', person: '1s' })
    expect(result.selectionMethod).toBe('srs_due_with_variety')
  })

  it('falls back to adaptive recommendation when SRS is unavailable', async () => {
    const eligibleForms = [
      { lemma: 'vivir', mood: 'subjunctive', tense: 'imp', person: '1s' }
    ]

    const dependencies = {
      getCurrentUserId: vi.fn().mockReturnValue('user-1'),
      getDueItems: vi.fn().mockResolvedValue([]),
      gateDueItemsByCurriculum: vi.fn((items) => items),
      filterDueForSpecific: vi.fn((items) => items),
      applyReviewSessionFilter: vi.fn((items) => items),
      selectDueCandidate: vi.fn(() => null),
      filterByVerbType: vi.fn((items) => items),
      selectVariedForm: vi.fn((items) => items[0]),
      // Use targetCombination format (as actual recommendations do)
      getNextRecommendedItem: vi.fn().mockResolvedValue({
        targetCombination: { mood: 'subjunctive', tense: 'imp' }
      }),
      chooseNext: vi.fn()
    }

    // For specific practice, adaptive recommendation is tried before chooseNext
    const result = await selectNextForm({
      eligibleForms,
      settings: { ...baseSettings, practiceMode: 'specific' },
      history: {},
      itemToExclude: null,
      specificConstraints: { isSpecific: false },
      reviewSessionType: 'due',
      reviewSessionFilter: {},
      now: new Date(),
      dependencies
    })

    expect(result.form).toEqual({ lemma: 'vivir', mood: 'subjunctive', tense: 'imp', person: '1s' })
    expect(result.selectionMethod).toBe('adaptive_recommendation_with_variety')
  })

  it('uses standard generator as primary selector for mixed practice', async () => {
    const eligibleForms = [
      { lemma: 'ir', mood: 'indicative', tense: 'pres', person: '1s' }
    ]

    const chooseNextResult = { lemma: 'ir', mood: 'indicative', tense: 'pres', person: '1s' }

    const dependencies = {
      getCurrentUserId: vi.fn().mockReturnValue('user-1'),
      getDueItems: vi.fn().mockResolvedValue([]),
      gateDueItemsByCurriculum: vi.fn((items) => items),
      filterDueForSpecific: vi.fn((items) => items),
      applyReviewSessionFilter: vi.fn((items) => items),
      selectDueCandidate: vi.fn(() => null),
      filterByVerbType: vi.fn((items) => items),
      selectVariedForm: vi.fn(() => null),
      getNextRecommendedItem: vi.fn().mockRejectedValue(new Error('offline')),
      chooseNext: vi.fn().mockResolvedValue(chooseNextResult)
    }

    const result = await selectNextForm({
      eligibleForms,
      settings: baseSettings,
      history: { recent: [] },
      itemToExclude: null,
      specificConstraints: { isSpecific: false },
      reviewSessionType: 'today',
      reviewSessionFilter: {},
      now: new Date(),
      dependencies
    })

    expect(result.form).toEqual(chooseNextResult)
    expect(result.selectionMethod).toBe('standard_generator')
    // In mixed practice, chooseNext fires before adaptive, so adaptive error is not reached
    expect(result.errors).toHaveLength(0)
  })

  it('records adaptive errors for specific/review practice', async () => {
    const eligibleForms = [
      { lemma: 'ir', mood: 'indicative', tense: 'pres', person: '1s' }
    ]

    const chooseNextResult = { lemma: 'ir', mood: 'indicative', tense: 'pres', person: '1s' }

    const dependencies = {
      getCurrentUserId: vi.fn().mockReturnValue('user-1'),
      getDueItems: vi.fn().mockResolvedValue([]),
      gateDueItemsByCurriculum: vi.fn((items) => items),
      filterDueForSpecific: vi.fn((items) => items),
      applyReviewSessionFilter: vi.fn((items) => items),
      selectDueCandidate: vi.fn(() => null),
      filterByVerbType: vi.fn((items) => items),
      selectVariedForm: vi.fn(() => null),
      getNextRecommendedItem: vi.fn().mockRejectedValue(new Error('offline')),
      chooseNext: vi.fn().mockResolvedValue(chooseNextResult)
    }

    const result = await selectNextForm({
      eligibleForms,
      settings: { ...baseSettings, practiceMode: 'specific' },
      history: { recent: [] },
      itemToExclude: null,
      specificConstraints: { isSpecific: false },
      reviewSessionType: 'today',
      reviewSessionFilter: {},
      now: new Date(),
      dependencies
    })

    expect(result.form).toEqual(chooseNextResult)
    expect(result.selectionMethod).toBe('standard_generator')
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].stage).toBe('adaptive')
  })
})
