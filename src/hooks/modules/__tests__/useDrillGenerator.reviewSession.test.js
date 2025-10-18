import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest'
import { renderHook, act } from '@testing-library/react'

let settingsState
let mockForms
let mockDueItems
let useDrillGenerator

const mockFilterForSpecificPractice = vi.fn()
const mockFilterByVerbType = vi.fn()
const mockApplyComprehensiveFiltering = vi.fn()
const mockFilterDueForSpecific = vi.fn()
const mockMatchesSpecific = vi.fn()
const mockAllowsPerson = vi.fn()
const mockAllowsLevel = vi.fn()
const mockGenerateAllFormsForRegion = vi.fn()
const mockGetFormsCacheKey = vi.fn()
const mockGetDueItems = vi.fn()
const mockGateDueItemsByCurriculum = vi.fn()
const mockGetCurrentUserId = vi.fn()
const mockChooseNext = vi.fn()
const mockVarietyEngine = { selectVariedForm: vi.fn() }
const mockGetNextRecommendedItem = vi.fn()
const mockValidateEligibleForms = vi.fn()
const mockPerformIntegrityGuard = vi.fn()
const mockValidateSpecificPracticeConfig = vi.fn()
const mockTryIntelligentFallback = vi.fn()
const mockFallbackToMixedPractice = vi.fn()
const mockGenerateDrillItem = vi.fn()
const mockGenerateDoubleModeItem = vi.fn()
const mockIsDoubleModeViable = vi.fn()

vi.mock('../../../state/settings.js', () => ({
  useSettings: () => settingsState
}))

vi.mock('../../../lib/progress/srs.js', () => ({
  getDueItems: mockGetDueItems
}))

vi.mock('../../../lib/core/curriculumGate.js', () => ({
  gateDueItemsByCurriculum: mockGateDueItemsByCurriculum
}))

vi.mock('../../../lib/progress/userManager/index.js', () => ({
  getCurrentUserId: mockGetCurrentUserId
}))

vi.mock('../../../lib/core/generator.js', () => ({
  chooseNext: mockChooseNext
}))

vi.mock('../../../lib/core/advancedVarietyEngine.js', () => ({
  varietyEngine: mockVarietyEngine
}))

vi.mock('../../../lib/progress/AdaptivePracticeEngine.js', () => ({
  getNextRecommendedItem: mockGetNextRecommendedItem
}))

vi.mock('../DrillFormFilters.js', () => ({
  filterForSpecificPractice: mockFilterForSpecificPractice,
  filterByVerbType: mockFilterByVerbType,
  applyComprehensiveFiltering: mockApplyComprehensiveFiltering,
  filterDueForSpecific: mockFilterDueForSpecific,
  matchesSpecific: mockMatchesSpecific,
  allowsPerson: mockAllowsPerson,
  allowsLevel: mockAllowsLevel,
  generateAllFormsForRegion: mockGenerateAllFormsForRegion,
  getFormsCacheKey: mockGetFormsCacheKey
}))

vi.mock('../DrillValidationSystem.js', () => ({
  validateEligibleForms: mockValidateEligibleForms,
  performIntegrityGuard: mockPerformIntegrityGuard,
  validateSpecificPracticeConfig: mockValidateSpecificPracticeConfig
}))

vi.mock('../DrillFallbackStrategies.js', () => ({
  tryIntelligentFallback: mockTryIntelligentFallback,
  fallbackToMixedPractice: mockFallbackToMixedPractice
}))

vi.mock('../DrillItemGenerator.js', () => ({
  generateDrillItem: mockGenerateDrillItem
}))

vi.mock('../DoubleModeManager.js', () => ({
  generateDoubleModeItem: mockGenerateDoubleModeItem,
  isDoubleModeViable: mockIsDoubleModeViable
}))

vi.mock('../../../lib/utils/logger.js', async () => {
  const actual = await vi.importActual('../../../lib/utils/logger.js')
  return {
    ...actual,
    createLogger: () => ({
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn()
    }),
    registerDebugTool: vi.fn()
  }
})

describe('useDrillGenerator - review filters', () => {
  beforeAll(async () => {
    const module = await import('../useDrillGenerator.js')
    useDrillGenerator = module.useDrillGenerator
  })

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-01T12:00:00Z'))

    mockForms = [
      { lemma: 'hablar', mood: 'indicative', tense: 'pres', person: '1s', value: 'hablo' },
      { lemma: 'comer', mood: 'indicative', tense: 'pretIndef', person: '1s', value: 'comí' },
      { lemma: 'vivir', mood: 'indicative', tense: 'pretIndef', person: '3s', value: 'vivió' }
    ]

    mockDueItems = [
      { mood: 'indicative', tense: 'pretIndef', person: '1s', nextDue: new Date('2023-12-31T12:00:00Z').toISOString() },
      { mood: 'indicative', tense: 'pres', person: '1s', nextDue: new Date('2024-01-01T16:00:00Z').toISOString() }
    ]

    settingsState = {
      verbType: 'all',
      selectedFamily: null,
      practiceMode: 'review',
      reviewSessionType: 'specific',
      reviewSessionFilter: {
        mood: 'indicative',
        tense: 'pretIndef',
        urgency: 'all'
      },
      specificMood: null,
      specificTense: null,
      level: 'A1',
      doubleActive: false,
      region: 'la_general'
    }

    mockGenerateAllFormsForRegion.mockImplementation(async () => mockForms)
    mockGetFormsCacheKey.mockReturnValue('test-cache-key')
    mockFilterForSpecificPractice.mockImplementation((forms, constraints = {}) => {
      if (!constraints?.isSpecific || !constraints.specificMood || !constraints.specificTense) {
        return forms
      }
      return forms.filter(
        form => form.mood === constraints.specificMood && form.tense === constraints.specificTense
      )
    })
    mockFilterByVerbType.mockImplementation(forms => forms)
    mockApplyComprehensiveFiltering.mockImplementation((forms, _settings, constraints = {}) => {
      if (!constraints?.isSpecific || !constraints.specificMood || !constraints.specificTense) {
        return forms
      }
      return forms.filter(
        form => form.mood === constraints.specificMood && form.tense === constraints.specificTense
      )
    })
    mockFilterDueForSpecific.mockImplementation((dueCells, constraints = {}) => {
      if (!constraints?.isSpecific || !constraints.specificMood || !constraints.specificTense) {
        return dueCells
      }
      return (dueCells || []).filter(
        cell => cell?.mood === constraints.specificMood && cell?.tense === constraints.specificTense
      )
    })
    mockMatchesSpecific.mockReturnValue(true)
    mockAllowsPerson.mockReturnValue(true)
    mockAllowsLevel.mockReturnValue(true)
    mockGetDueItems.mockImplementation(async () => mockDueItems)
    mockGateDueItemsByCurriculum.mockImplementation(dueItems => dueItems)
    mockGetCurrentUserId.mockReturnValue('user-123')
    mockChooseNext.mockImplementation(({ forms }) => forms?.[0] || null)
    mockVarietyEngine.selectVariedForm.mockImplementation(forms => forms?.[0] || null)
    mockGetNextRecommendedItem.mockResolvedValue(null)
    mockValidateEligibleForms.mockReturnValue(true)
    mockPerformIntegrityGuard.mockReturnValue({ success: true })
    mockValidateSpecificPracticeConfig.mockReturnValue({ valid: true })
    mockTryIntelligentFallback.mockResolvedValue(null)
    mockFallbackToMixedPractice.mockReturnValue(null)
    mockGenerateDrillItem.mockImplementation(form => ({
      id: `mock-${form?.lemma}-${form?.mood}-${form?.tense}-${form?.person}`,
      ...form,
      selectionMethod: 'mock'
    }))
    mockGenerateDoubleModeItem.mockResolvedValue(null)
    mockIsDoubleModeViable.mockReturnValue(false)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('prioritizes due cells that match the HeatMap review filter', async () => {
    const { result } = renderHook(() => useDrillGenerator())

    let generated
    await act(async () => {
      generated = await result.current.generateNextItem()
    })

    expect(generated).toBeTruthy()
    expect(generated.mood).toBe('indicative')
    expect(generated.tense).toBe('pretIndef')
    expect(generated.person).toBe('1s')

    expect(mockGetDueItems).toHaveBeenCalled()
    const appliedConstraints = mockApplyComprehensiveFiltering.mock.calls.at(-1)?.[2]
    expect(appliedConstraints).toMatchObject({
      isSpecific: true,
      specificMood: 'indicative',
      specificTense: 'pretIndef'
    })
  })

  it('filters out non-urgent cells when urgency filter is set', async () => {
    settingsState.reviewSessionType = 'due'
    settingsState.reviewSessionFilter = { urgency: 'urgent' }

    mockDueItems = [
      { mood: 'indicative', tense: 'pres', person: '1s', nextDue: new Date('2023-12-31T10:00:00Z').toISOString() },
      { mood: 'indicative', tense: 'pres', person: '1p', nextDue: new Date('2024-01-02T12:00:00Z').toISOString() }
    ]

    mockForms = [
      { lemma: 'hablar', mood: 'indicative', tense: 'pres', person: '1s', value: 'hablo' },
      { lemma: 'hablar', mood: 'indicative', tense: 'pres', person: '1p', value: 'hablamos' }
    ]

    mockGetDueItems.mockImplementation(async () => mockDueItems)
    mockGenerateAllFormsForRegion.mockImplementation(async () => mockForms)

    const { result } = renderHook(() => useDrillGenerator())

    let generated
    await act(async () => {
      generated = await result.current.generateNextItem()
    })

    expect(generated).toBeTruthy()
    expect(generated.person).toBe('1s')
  })
})
