import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

const resolveFormsPoolMock = vi.fn()
const getReviewSessionContextMock = vi.fn()
const buildSpecificConstraintsMock = vi.fn()
const selectNextFormMock = vi.fn()
const validateSpecificPracticeConfigMock = vi.fn()
const validateEligibleFormsMock = vi.fn()
const performIntegrityGuardMock = vi.fn()
const fallbackToMixedPracticeMock = vi.fn()
const tryIntelligentFallbackMock = vi.fn()
const generateDrillItemMock = vi.fn()
const getFilteringDiagnosticsMock = vi.fn((forms) => ({ filtered: forms, stages: [], emptyReason: null }))

vi.mock('./formsPoolService.js', () => ({
  resolveFormsPool: resolveFormsPoolMock
}))

vi.mock('./specificConstraints.js', () => ({
  getReviewSessionContext: getReviewSessionContextMock,
  buildSpecificConstraints: buildSpecificConstraintsMock,
  applyReviewSessionFilter: vi.fn((items) => items),
  selectDueCandidate: vi.fn()
}))

vi.mock('./hierarchicalSelection.js', () => ({
  selectNextForm: selectNextFormMock
}))

vi.mock('./DrillFormFilters.js', () => ({
  filterForSpecificPractice: vi.fn(),
  filterByVerbType: vi.fn((forms) => forms),
  applyComprehensiveFiltering: vi.fn((forms) => forms),
  getFilteringDiagnostics: getFilteringDiagnosticsMock,
  filterDueForSpecific: vi.fn((items) => items),
  matchesSpecific: vi.fn(),
  allowsPerson: vi.fn(),
  allowsLevel: vi.fn(),
  generateAllFormsForRegion: vi.fn(),
  getFormsCacheKey: vi.fn()
}))

vi.mock('./DrillValidationSystem.js', () => ({
  validateEligibleForms: validateEligibleFormsMock,
  performIntegrityGuard: performIntegrityGuardMock,
  validateSpecificPracticeConfig: validateSpecificPracticeConfigMock
}))

vi.mock('./DrillFallbackStrategies.js', () => ({
  tryIntelligentFallback: tryIntelligentFallbackMock,
  fallbackToMixedPractice: fallbackToMixedPracticeMock
}))

vi.mock('./DrillItemGenerator.js', () => ({
  generateDrillItem: generateDrillItemMock
}))

vi.mock('./DoubleModeManager.js', () => ({
  generateDoubleModeItem: vi.fn().mockResolvedValue(null),
  isDoubleModeViable: vi.fn().mockReturnValue(false)
}))

vi.mock('../../lib/progress/srs.js', () => ({
  getDueItems: vi.fn().mockResolvedValue([])
}))

vi.mock('../../lib/core/curriculumGate.js', () => ({
  gateDueItemsByCurriculum: vi.fn((items) => items)
}))

vi.mock('../../lib/progress/userManager.js', () => ({
  getCurrentUserId: vi.fn().mockReturnValue(null)
}))

vi.mock('../../lib/core/advancedVarietyEngine.js', () => ({
  varietyEngine: {
    selectVariedForm: vi.fn(() => null)
  }
}))

vi.mock('../../lib/progress/AdaptivePracticeEngine.js', () => ({
  getNextRecommendedItem: vi.fn()
}))

vi.mock('../../lib/core/generator.js', () => ({
  chooseNext: vi.fn()
}))

vi.mock('../../lib/utils/logger.js', () => ({
  createLogger: () => ({
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    systemInit: vi.fn()
  }),
  registerDebugTool: vi.fn()
}))

describe('useDrillGenerator.generateNextItem integration', () => {
  beforeEach(() => {
    resolveFormsPoolMock.mockResolvedValue({
      forms: [
        { lemma: 'hablar', mood: 'indicative', tense: 'pres', person: '1s' }
      ],
      signature: 'sig',
      reused: false,
      durationMs: 10,
      cache: { signature: 'sig', forms: [{ lemma: 'hablar', mood: 'indicative', tense: 'pres', person: '1s' }] }
    })
    getReviewSessionContextMock.mockReturnValue({ reviewSessionType: 'due', reviewSessionFilter: {} })
    buildSpecificConstraintsMock.mockReturnValue({ isSpecific: false, specificMood: null, specificTense: null })
    selectNextFormMock.mockResolvedValue({
      form: { lemma: 'hablar', mood: 'indicative', tense: 'pres', person: '1s' },
      selectionMethod: 'hierarchy',
      errors: []
    })
    validateSpecificPracticeConfigMock.mockReturnValue({ valid: true })
    validateEligibleFormsMock.mockImplementation(() => {})
    performIntegrityGuardMock.mockReturnValue({ success: true })
    fallbackToMixedPracticeMock.mockReturnValue(null)
    tryIntelligentFallbackMock.mockResolvedValue(null)
    generateDrillItemMock.mockReturnValue({
      id: 'drill-1',
      lemma: 'hablar',
      mood: 'indicative',
      tense: 'pres',
      person: '1s'
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('chains pool resolution, constraint prep and hierarchical selection', async () => {
    const { useDrillGenerator } = await import('./useDrillGenerator.js')
    const { result } = renderHook(() => useDrillGenerator())

    let generated
    await act(async () => {
      generated = await result.current.generateNextItem()
    })

    expect(resolveFormsPoolMock).toHaveBeenCalled()
    expect(getReviewSessionContextMock).toHaveBeenCalled()
    expect(buildSpecificConstraintsMock).toHaveBeenCalledWith(expect.any(Object), 'due', {})
    expect(selectNextFormMock).toHaveBeenCalled()
    expect(generateDrillItemMock).toHaveBeenCalledWith(
      { lemma: 'hablar', mood: 'indicative', tense: 'pres', person: '1s' },
      expect.any(Object),
      expect.any(Array)
    )
    expect(generated).toMatchObject({
      id: 'drill-1',
      lemma: 'hablar',
      selectionMethod: 'hierarchy'
    })
  })

  it('exposes last filtering report through getGenerationStats', async () => {
    getFilteringDiagnosticsMock.mockReturnValueOnce({
      filtered: [],
      emptyReason: 'pronoun_region_filter',
      stages: [
        {
          id: 'pronoun_region',
          reason: 'pronoun_region_filter',
          before: 20,
          after: 0,
          dropped: 20,
          skipped: false
        }
      ]
    })

    const { useDrillGenerator } = await import('./useDrillGenerator.js')
    const { result } = renderHook(() => useDrillGenerator())

    let stats
    await act(async () => {
      stats = await result.current.getGenerationStats()
    })

    expect(stats.eligibleForms).toBe(0)
    expect(stats.lastFilteringReport).toMatchObject({
      totalForms: 1,
      eligibleForms: 0,
      emptyReason: 'pronoun_region_filter'
    })
    expect(stats.lastFilteringReport.stages).toHaveLength(1)
  })
})
