import { vi } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import useProgressDashboardData from './useProgressDashboardData.js'
import { getHeatMapData, getAdvancedAnalytics } from '../../lib/progress/analytics.js'
import { __triggerReady, onProgressSystemReady, isProgressSystemReady } from '../../lib/progress/index.js'

const defaultExecuteAllImplementation = async (operations) => {
  const entries = await Promise.all(
    Object.entries(operations).map(async ([key, operation]) => [
      key,
      await operation({ aborted: false })
    ])
  )
  return Object.fromEntries(entries)
}

const executeAllMock = vi.fn(defaultExecuteAllImplementation)

vi.mock('../../lib/progress/analytics.js', () => ({
  getHeatMapData: vi.fn().mockResolvedValue([
    { mood: 'indicative', tense: 'present', score: 100, count: 1 }
  ]),
  getUserStats: vi.fn().mockResolvedValue({}),
  getWeeklyGoals: vi.fn().mockResolvedValue({}),
  checkWeeklyProgress: vi.fn().mockResolvedValue({}),
  getRecommendations: vi.fn().mockResolvedValue([]),
  getAdvancedAnalytics: vi.fn().mockResolvedValue({}),
  getErrorIntelligence: vi.fn().mockResolvedValue({})
}))

vi.mock('../../lib/progress/userManager.js', () => ({
  getCurrentUserId: vi.fn(() => 'user-123')
}))

vi.mock('../../lib/cache/ProgressDataCache.js', () => ({
  progressDataCache: {
    warmup: vi.fn(),
    get: vi.fn(async (_key, loader, _namespace, options = {}) => loader({ signal: options?.signal ?? { aborted: false } })),
    invalidate: vi.fn(),
    invalidateUser: vi.fn(),
    getStats: vi.fn(() => ({}))
  }
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
    isProgressSystemReady.mockReturnValue(false)
    executeAllMock.mockReset()
    executeAllMock.mockImplementation(defaultExecuteAllImplementation)

    const idleSpy = vi.fn((callback) => {
      callback({ didTimeout: false, timeRemaining: () => 1 })
      return 1
    })
    const cancelIdleSpy = vi.fn()
    global.requestIdleCallback = idleSpy
    global.cancelIdleCallback = cancelIdleSpy
    if (typeof window !== 'undefined') {
      window.requestIdleCallback = idleSpy
      window.cancelIdleCallback = cancelIdleSpy
    }
  })

  afterEach(() => {
    delete global.requestIdleCallback
    delete global.cancelIdleCallback
    if (typeof window !== 'undefined') {
      delete window.requestIdleCallback
      delete window.cancelIdleCallback
    }
  })

  it('solo ejecuta la carga inicial una vez cuando el sistema se marca como listo', async () => {
    const { result } = renderHook(() => useProgressDashboardData())

    await waitFor(() => {
      expect(onProgressSystemReady).toHaveBeenCalledTimes(1)
    })

    await act(async () => {
      __triggerReady(true)
      await Promise.resolve()
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(getHeatMapData).toHaveBeenCalledTimes(1)
    })

    await waitFor(() => {
      expect(getAdvancedAnalytics).toHaveBeenCalledTimes(1)
      expect(result.current.advancedLoading).toBe(false)
    })

    expect(executeAllMock).toHaveBeenCalledTimes(2)
  })

  it('mantiene métricas críticas aunque falle la fase avanzada', async () => {
    executeAllMock.mockImplementationOnce(defaultExecuteAllImplementation)
    executeAllMock.mockImplementationOnce(async () => {
      throw new Error('advanced-failure')
    })

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { result } = renderHook(() => useProgressDashboardData())

    await act(async () => {
      __triggerReady(true)
      await Promise.resolve()
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(getHeatMapData).toHaveBeenCalledTimes(1)
    })

    expect(result.current.heatMapData?.heatMap).toBeDefined()
    expect(result.current.userStats).toEqual({})
    expect(result.current.weeklyGoals).toEqual({})

    await waitFor(() => {
      expect(result.current.advancedLoading).toBe(false)
    })

    expect(result.current.error).toBe(null)
    expect(executeAllMock).toHaveBeenCalledTimes(2)

    consoleErrorSpy.mockRestore()
  })
})
