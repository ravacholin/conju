import { vi } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import useProgressDashboardData from './useProgressDashboardData.js'
import { getHeatMapData, getAdvancedAnalytics, getPronunciationStats } from '../../lib/progress/analytics.js'
import { generatePersonalizedStudyPlan } from '../../lib/progress/studyPlans.js'
import { __triggerReady, onProgressSystemReady, isProgressSystemReady } from '../../lib/progress/index.js'

const { executeAllMock } = vi.hoisted(() => ({
  executeAllMock: vi.fn()
}))

const defaultExecuteAllImpl = async (operations) => {
  const entries = await Promise.all(
    Object.entries(operations).map(async ([key, operation]) => [
      key,
      await operation({ aborted: false })
    ])
  )
  return Object.fromEntries(entries)
}

vi.mock('../../lib/progress/analytics.js', () => ({
  getHeatMapData: vi.fn().mockResolvedValue([
    { mood: 'indicative', tense: 'present', score: 100, count: 1 }
  ]),
  getUserStats: vi.fn().mockResolvedValue({}),
  getWeeklyGoals: vi.fn().mockResolvedValue({}),
  checkWeeklyProgress: vi.fn().mockResolvedValue({}),
  getRecommendations: vi.fn().mockResolvedValue([]),
  getAdvancedAnalytics: vi.fn().mockResolvedValue({}),
  getErrorIntelligence: vi.fn().mockResolvedValue({}),
  getPronunciationStats: vi.fn().mockResolvedValue({
    totalAttempts: 0,
    successRate: 0,
    averageAccuracy: 0,
    averagePedagogicalScore: 0,
    averageConfidence: 0,
    recentAttempts: []
  })
}))

vi.mock('../../lib/progress/userManager/index.js', () => ({
  getCurrentUserId: vi.fn(() => 'user-123')
}))

vi.mock('../../lib/cache/ProgressDataCache.js', () => ({
  progressDataCache: {
    warmup: vi.fn(),
    get: vi.fn(async (_key, loader, _type, options = {}) => {
      const invocationArg = options && Object.prototype.hasOwnProperty.call(options, 'signal')
        ? { signal: options.signal }
        : {}
      return loader(invocationArg)
    }),
    invalidate: vi.fn(),
    invalidateByDataType: vi.fn(),
    invalidateUser: vi.fn(),
    getStats: vi.fn(() => ({}))
  },
  resolveProgressUpdateKeys: vi.fn((detail = {}) => {
    if (!detail || detail.forceFullRefresh || detail.fullRefresh || detail.type === 'sync') {
      return null
    }

    if (detail.type === 'drill_result' || detail.type === 'practice_session') {
      return ['heatMap', 'userStats', 'weeklyGoals', 'weeklyProgress', 'recommendations', 'dailyChallenges', 'pronunciationStats']
    }

    if (detail.attemptId || detail.mood || detail.tense || detail.person) {
      return ['heatMap', 'userStats', 'weeklyGoals', 'weeklyProgress', 'recommendations', 'dailyChallenges', 'pronunciationStats']
    }

    if (detail.challengeId) {
      return ['dailyChallenges']
    }

    return null
  })
}))

vi.mock('../../lib/utils/AsyncController.js', () => ({
  AsyncController: class {
    cancelAll() {}
    async executeAll(operations) {
      return executeAllMock(operations)
    }
    destroy() {}
  }
}))

vi.mock('../../lib/progress/challenges.js', () => ({
  getDailyChallengeSnapshot: vi.fn().mockResolvedValue({
    date: '2024-01-01',
    metrics: {},
    challenges: []
  }),
  markChallengeCompleted: vi.fn().mockResolvedValue({ challenges: [] })
}))

vi.mock('../../lib/progress/studyPlans.js', () => ({
  generatePersonalizedStudyPlan: vi.fn().mockResolvedValue(null),
  invalidateStudyPlan: vi.fn(),
  onStudyPlanUpdated: vi.fn((handler, options = {}) => {
    if (options.immediate) {
      handler({ plan: null })
    }
    return () => {}
  })
}))

vi.mock('../../lib/progress/social.js', () => ({
  getCommunitySnapshot: vi.fn().mockResolvedValue(null),
  onCommunitySnapshot: vi.fn((handler) => {
    handler({ snapshot: null })
    return () => {}
  }),
  clearCommunityCache: vi.fn()
}))

vi.mock('../../lib/progress/offlineSupport.js', () => ({
  getOfflineStatus: vi.fn().mockResolvedValue(null),
  onOfflineStatusChange: vi.fn((handler) => {
    handler(null)
    return () => {}
  }),
  clearOfflineCache: vi.fn()
}))

vi.mock('../../lib/progress/expertMode.js', () => ({
  getExpertModeSettings: vi.fn(() => ({})),
  onExpertModeChange: vi.fn((handler) => {
    handler({ settings: {} })
    return () => {}
  })
}))

vi.mock('../../lib/levels/userLevelProfile.js', () => ({
  getGlobalDynamicEvaluation: vi.fn().mockResolvedValue(null),
  getGlobalDynamicProgress: vi.fn().mockResolvedValue(null),
  getGlobalDynamicLevelInfo: vi.fn().mockResolvedValue(null),
  checkGlobalLevelRecommendation: vi.fn().mockResolvedValue(null)
}))

vi.mock('../../lib/progress/index.js', () => {
  const readySpy = {
    callback: null
  }
  return {
    isProgressSystemReady: vi.fn(() => false),
    onProgressSystemReady: vi.fn((callback) => {
      readySpy.callback = callback
      return () => {
        if (readySpy.callback === callback) {
          readySpy.callback = null
        }
      }
    }),
    __triggerReady: (ready) => {
      readySpy.callback?.(ready)
    }
  }
})

describe('useProgressDashboardData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    executeAllMock.mockImplementation(defaultExecuteAllImpl)
    isProgressSystemReady.mockReturnValue(false)
  })

  it('solo ejecuta la carga inicial una vez cuando el sistema se marca como listo', async () => {
    renderHook(() => useProgressDashboardData())

    await waitFor(() => {
      expect(onProgressSystemReady).toHaveBeenCalledTimes(1)
    })

    await act(async () => {
      __triggerReady(true)
      await Promise.resolve()
    })

    await waitFor(() => {
      expect(getHeatMapData).toHaveBeenCalledTimes(1)
    })

    await waitFor(() => {
      expect(getPronunciationStats).toHaveBeenCalledTimes(1)
    })

    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(getHeatMapData).toHaveBeenCalledTimes(1)
    expect(getPronunciationStats).toHaveBeenCalledTimes(1)
  })

  it('usa refreshFromEvent para cambios acotados sin disparar analíticas pesadas', async () => {
    renderHook(() => useProgressDashboardData())

    await waitFor(() => {
      expect(onProgressSystemReady).toHaveBeenCalledTimes(1)
    })

    await act(async () => {
      __triggerReady(true)
      await Promise.resolve()
    })

    await waitFor(() => {
      expect(getHeatMapData).toHaveBeenCalledTimes(1)
    })

    // Wait for both CORE_DATA_KEYS and HEAVY_ANALYTICS_KEYS to load completely
    // The heavy analytics are loaded via setTimeout(100ms), so we need to wait for that
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 150))
    })

    // Capture initial call counts after all initial loading completes
    // Note: Functions may be called multiple times during initial load due to
    // concurrent CORE_DATA_KEYS and HEAVY_ANALYTICS_KEYS loading
    const initialHeatMapCalls = getHeatMapData.mock.calls.length
    const initialAdvancedCalls = getAdvancedAnalytics.mock.calls.length
    const initialStudyPlanCalls = generatePersonalizedStudyPlan.mock.calls.length
    const initialPronunciationCalls = getPronunciationStats.mock.calls.length

    await act(async () => {
      window.dispatchEvent(
        new CustomEvent('progress:dataUpdated', {
          detail: { attemptId: 'attempt-1', userId: 'user-123' }
        })
      )
      await new Promise(resolve => setTimeout(resolve, 600))
    })

    await waitFor(() => {
      expect(getHeatMapData).toHaveBeenCalledTimes(initialHeatMapCalls + 1)
    })

    expect(getAdvancedAnalytics).toHaveBeenCalledTimes(initialAdvancedCalls)
    expect(generatePersonalizedStudyPlan).toHaveBeenCalledTimes(initialStudyPlanCalls)
    expect(getPronunciationStats).toHaveBeenCalledTimes(initialPronunciationCalls + 1)
  })

  it('recarga todo el dashboard cuando el evento indica una sincronización', async () => {
    renderHook(() => useProgressDashboardData())

    await waitFor(() => {
      expect(onProgressSystemReady).toHaveBeenCalledTimes(1)
    })

    await act(async () => {
      __triggerReady(true)
      await Promise.resolve()
    })

    await waitFor(() => {
      expect(getHeatMapData).toHaveBeenCalledTimes(1)
    })

    await waitFor(() => {
      expect(getAdvancedAnalytics).toHaveBeenCalledTimes(1)
    })

    await waitFor(() => {
      expect(generatePersonalizedStudyPlan).toHaveBeenCalledTimes(1)
    })

    getHeatMapData.mockClear()
    getAdvancedAnalytics.mockClear()
    generatePersonalizedStudyPlan.mockClear()

    await act(async () => {
      window.dispatchEvent(
        new CustomEvent('progress:dataUpdated', {
          detail: { type: 'sync', userId: 'user-123' }
        })
      )
      await new Promise(resolve => setTimeout(resolve, 600))
    })

    await waitFor(() => {
      expect(getHeatMapData).toHaveBeenCalledTimes(1)
    })

    expect(getAdvancedAnalytics).toHaveBeenCalledTimes(1)
    expect(generatePersonalizedStudyPlan).toHaveBeenCalledTimes(1)
  })

  it('hace fallback a recarga total si falla un refresh parcial', async () => {
    renderHook(() => useProgressDashboardData())

    await waitFor(() => {
      expect(onProgressSystemReady).toHaveBeenCalledTimes(1)
    })

    await act(async () => {
      __triggerReady(true)
      await Promise.resolve()
    })

    await waitFor(() => {
      expect(getHeatMapData).toHaveBeenCalled()
      expect(getAdvancedAnalytics).toHaveBeenCalled()
    })

    getAdvancedAnalytics.mockClear()
    generatePersonalizedStudyPlan.mockClear()

    executeAllMock.mockImplementationOnce(async (operations) =>
      Object.fromEntries(Object.keys(operations).map((key) => [key, null]))
    )

    await act(async () => {
      window.dispatchEvent(
        new CustomEvent('progress:dataUpdated', {
          detail: { attemptId: 'attempt-2', userId: 'user-123' }
        })
      )
      await new Promise(resolve => setTimeout(resolve, 700))
    })

    await waitFor(() => {
      expect(getAdvancedAnalytics).toHaveBeenCalledTimes(1)
      expect(generatePersonalizedStudyPlan).toHaveBeenCalledTimes(1)
    })
  })

  it('genera recordatorios cuando no hay práctica reciente', async () => {
    const { result } = renderHook(() => useProgressDashboardData())

    await waitFor(() => {
      expect(onProgressSystemReady).toHaveBeenCalledTimes(1)
    })

    await act(async () => {
      __triggerReady(true)
      await Promise.resolve()
    })

    await waitFor(() => {
      expect(Array.isArray(result.current.practiceReminders)).toBe(true)
    })

    expect(result.current.practiceReminders.some(reminder => reminder.id === 'no-practice-yet')).toBe(true)
  })
})
