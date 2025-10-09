import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, beforeAll, beforeEach, vi, expect } from 'vitest'

const routerMocks = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  getCurrentRouteMock: vi.fn()
}))

vi.mock('../state/settings.js', () => ({
  useSettings: () => ({
    level: 'A1',
    practiceMode: 'mixed',
    specificMood: null,
    specificTense: null,
    useVoseo: false,
    useTuteo: false,
    useVosotros: false
  })
}))

vi.mock('../lib/routing/Router.js', () => ({
  __esModule: true,
  default: {
    navigate: routerMocks.navigateMock,
    getCurrentRoute: routerMocks.getCurrentRouteMock
  }
}))

const { navigateMock, getCurrentRouteMock } = routerMocks

let useOnboardingFlow

beforeAll(async () => {
  ;({ useOnboardingFlow } = await import('./useOnboardingFlow.js'))
})

describe('useOnboardingFlow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not trigger onboarding navigation when already on a non-onboarding route', async () => {
    getCurrentRouteMock.mockReturnValue({ mode: 'progress', step: null })

    renderHook(() => useOnboardingFlow())

    await waitFor(() => {
      expect(navigateMock).not.toHaveBeenCalled()
    })
  })

  it('keeps initializing onboarding when no valid route information exists', async () => {
    getCurrentRouteMock.mockReturnValue({ mode: 'onboarding', step: null })

    renderHook(() => useOnboardingFlow())

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith({ mode: 'onboarding', step: 1 }, { replace: true })
    })
  })
})
