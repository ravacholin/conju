import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDrillMode } from './useDrillMode.js'

// Regression coverage for the drill reloading itself a beat after showing an
// exercise. `useDrillGenerator` lowers its own `isGenerating` as soon as the
// generator function returns, but `useDrillMode` only commits the item a few
// microtasks later. React can commit a render inside that gap, and both safety nets
// (AppRouter's effect and DrillMode's retry timer) read "no item + not generating"
// as permission to start another generation. The second one then overwrote the
// exercise the user was already reading.
//
// The generator mock below always reports `isGenerating: false`, i.e. the worst
// case: the only thing that can keep the window closed is useDrillMode's own flag.

const { useSettingsMock, mockGenerateNextItem } = vi.hoisted(() => {
  const state = {
    set: vi.fn(),
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

  const useSettings = vi.fn((selector) => (selector ? selector(state) : state))
  useSettings.getState = () => state

  return { useSettingsMock: useSettings, mockGenerateNextItem: vi.fn() }
})

vi.mock('../state/settings.js', () => ({ useSettings: useSettingsMock }))

vi.mock('./modules/useDrillGenerator.js', () => ({
  useDrillGenerator: vi.fn(() => ({
    generateNextItem: mockGenerateNextItem,
    isGenerationViable: vi.fn(() => true),
    getGenerationStats: vi.fn(() => ({})),
    // Deliberately never true: the fix must not depend on the generator's own flag.
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

vi.mock('../lib/core/prioritizer/index.js', () => ({
  debugLevelPrioritization: vi.fn()
}))

vi.mock('../lib/progress/flowStateDetection.js', () => ({
  getCurrentFlowState: vi.fn(() => 'neutral')
}))

vi.mock('../lib/progress/sessionManager.js', () => ({
  sessionManager: {
    hasActiveSession: vi.fn(() => false),
    startSession: vi.fn(),
    getCurrentActivity: vi.fn(() => null),
    recordItemResult: vi.fn(),
    shouldAutoAdvance: vi.fn(() => false),
    shouldConsiderAdvancing: vi.fn(() => false),
    nextActivity: vi.fn(() => null),
    endSession: vi.fn(),
    getSessionProgress: vi.fn(() => ({}))
  }
}))

vi.mock('../lib/utils/logger.js', () => ({
  createLogger: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() })
}))

const ITEM = {
  lemma: 'hablar',
  mood: 'indicative',
  tense: 'pres',
  person: '1s',
  form: { value: 'hablo' }
}

const deferred = () => {
  let resolve
  const promise = new Promise((res) => { resolve = res })
  return { promise, resolve }
}

/** Renders the hook while recording the (item, isGenerating) pair of every commit. */
const renderRecordingDrillMode = () => {
  const commits = []
  const hook = renderHook(() => {
    const drillMode = useDrillMode()
    commits.push({
      hasItem: !!drillMode.currentItem,
      isGenerating: drillMode.isGenerating
    })
    return drillMode
  })
  return { ...hook, commits }
}

describe('useDrillMode generation window', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('reports a generation in flight before the first await', async () => {
    const gate = deferred()
    mockGenerateNextItem.mockReturnValue(gate.promise)

    const { result } = renderRecordingDrillMode()
    expect(result.current.isGenerating).toBe(false)

    let pending
    act(() => {
      pending = result.current.generateNextItem(null, vi.fn(), vi.fn())
    })

    expect(result.current.isGenerating).toBe(true)
    expect(result.current.currentItem).toBeNull()

    await act(async () => {
      gate.resolve(ITEM)
      await pending
    })

    expect(result.current.currentItem).toMatchObject({ lemma: 'hablar' })
    expect(result.current.isGenerating).toBe(false)
  })

  it('never commits "no item and nothing generating" while an item is on its way', async () => {
    const gate = deferred()
    mockGenerateNextItem.mockReturnValue(gate.promise)

    const { result, rerender, commits } = renderRecordingDrillMode()
    const commitsBeforeRequest = commits.length

    let pending
    act(() => {
      pending = result.current.generateNextItem(null, vi.fn(), vi.fn())
    })

    // AppRouter re-renders constantly while a generation is in flight (settings
    // writes, session store updates). Force one so the in-flight window is actually
    // observed by a commit, the way it is in the app.
    act(() => {
      rerender()
    })

    await act(async () => {
      gate.resolve(ITEM)
      await pending
    })

    // Every commit from the request onwards must either show the item or advertise
    // that a generation is running. Anything else is the gap that made AppRouter and
    // DrillMode queue a competing generation.
    const gapCommits = commits
      .slice(commitsBeforeRequest)
      .filter((commit) => !commit.hasItem && !commit.isGenerating)

    expect(gapCommits).toEqual([])
  })

  it('keeps the flag up until the last of several overlapping generations settles', async () => {
    const first = deferred()
    const second = deferred()
    mockGenerateNextItem
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)

    const { result } = renderRecordingDrillMode()

    let firstPending
    let secondPending
    act(() => {
      firstPending = result.current.generateNextItem(null, vi.fn(), vi.fn())
      secondPending = result.current.generateNextItem(null, vi.fn(), vi.fn())
    })

    expect(result.current.isGenerating).toBe(true)

    await act(async () => {
      first.resolve(ITEM)
      await firstPending
    })

    expect(result.current.isGenerating).toBe(true)

    await act(async () => {
      second.resolve(ITEM)
      await secondPending
    })

    expect(result.current.isGenerating).toBe(false)
  })

  it('lowers the flag when generation throws so the safety nets can retry', async () => {
    mockGenerateNextItem.mockRejectedValue(new Error('boom'))

    const { result } = renderRecordingDrillMode()

    await act(async () => {
      await result.current.generateNextItem(null, vi.fn(), vi.fn())
    })

    expect(result.current.isGenerating).toBe(false)
  })
})
