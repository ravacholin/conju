import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDrillMode } from './useDrillMode.js'

// Mock the settings store with shallow selector support
const { useSettingsMock, mockGenerateNextItem } = vi.hoisted(() => {
  const mockSet = vi.fn()
  const state = {
    set: mockSet,
    currentSession: null,
    verbType: 'all',
    selectedFamily: null,
    level: 'A1',
    useVoseo: false,
    useVosotros: false,
    practiceMode: 'mixed',
    specificMood: null,
    specificTense: null,
    region: 'la_general'
  }

  const selectorAwareUseSettings = vi.fn((selector) => (selector ? selector(state) : state))
  const generatorMock = vi.fn()

  return { useSettingsMock: selectorAwareUseSettings, mockGenerateNextItem: generatorMock }
})

vi.mock('../state/settings.js', () => ({
  useSettings: useSettingsMock
}))

// Mock the specialized hooks
vi.mock('./modules/useDrillGenerator.js', () => ({
  useDrillGenerator: vi.fn(() => ({
    generateNextItem: mockGenerateNextItem,
    isGenerationViable: vi.fn(() => true),
    getGenerationStats: vi.fn(() => ({})),
    isGenerating: false
  }))
}))

vi.mock('./modules/useDrillProgress.js', () => ({
  useDrillProgress: vi.fn(() => ({
    handleResponse: vi.fn(),
    handleHintShown: vi.fn(),
    getProgressInsights: vi.fn(() => ({})),
    resetProgressStats: vi.fn(),
    isProcessing: false
  }))
}))

vi.mock('./modules/useDrillValidation.js', () => ({
  useDrillValidation: vi.fn(() => ({
    validateItem: vi.fn(() => ({ valid: true })),
    validateSettings: vi.fn(() => ({ valid: true })),
    getValidationInsights: vi.fn(() => ({})),
    isValidating: false
  }))
}))

vi.mock('../lib/progress/personalizedCoaching.js', () => ({
  getMotivationalInsights: vi.fn(() => Promise.resolve([]))
}))

vi.mock('../lib/core/levelDrivenPrioritizer.js', () => ({
  debugLevelPrioritization: vi.fn()
}))

vi.mock('../lib/progress/flowStateDetection.js', () => ({
  getCurrentFlowState: vi.fn(() => 'neutral')
}))

vi.mock('../lib/utils/logger.js', async () => {
  const actual = await vi.importActual('../lib/utils/logger.js')
  return {
    ...actual,
    createLogger: vi.fn(() => ({
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn()
    })),
    registerDebugTool: vi.fn()
  }
})

let randomSpy

describe('useDrillMode item generation smoke test', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    randomSpy = vi.spyOn(Math, 'random').mockReturnValue(1)
  })

  afterEach(() => {
    randomSpy.mockRestore()
  })

  it('generates and stores a new drill item', async () => {
    const generatedItem = {
      id: 'item-1',
      lemma: 'hablar',
      mood: 'indicative',
      tense: 'pres',
      form: { value: 'hablo' }
    }

    mockGenerateNextItem.mockResolvedValueOnce(generatedItem)

    const { result } = renderHook(() => useDrillMode())

    const getAvailableMoodsForLevel = vi.fn()
    const getAvailableTensesForLevelAndMood = vi.fn()

    await act(async () => {
      await result.current.generateNextItem(null, getAvailableMoodsForLevel, getAvailableTensesForLevelAndMood)
    })

    expect(mockGenerateNextItem).toHaveBeenCalledWith(
      null,
      getAvailableMoodsForLevel,
      getAvailableTensesForLevelAndMood,
      {}
    )

    expect(result.current.currentItem).toEqual(generatedItem)
  })
})
