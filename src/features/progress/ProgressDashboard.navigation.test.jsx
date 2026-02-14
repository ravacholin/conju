import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'

const useProgressDashboardDataMock = vi.fn()
const setSettingsMock = vi.fn()

vi.mock('../../lib/progress/userManager/index.js', () => ({
  syncNow: vi.fn(() => Promise.resolve({ success: true })),
  isSyncEnabled: vi.fn(() => true),
  getCurrentUserId: vi.fn(() => 'test-user')
}))

vi.mock('../../hooks/useSRSQueue.js', () => ({
  useSRSQueue: () => ({ stats: null })
}))

vi.mock('../../state/settings.js', () => ({
  useSettings: (selector) => selector({ set: setSettingsMock })
}))

vi.mock('./SummaryStrip.jsx', () => ({ default: () => <div data-testid="summary-strip" /> }))
vi.mock('./UnifiedPracticeAction.jsx', () => ({
  default: ({ onStartDrill }) => (
    <button type="button" onClick={() => onStartDrill({ practiceMode: 'specific', specificMood: 'indicative', specificTense: 'pres' })}>
      Start Practice
    </button>
  )
}))
vi.mock('./HeatMapSRS.jsx', () => ({ default: () => <div data-testid="heat-map" /> }))
vi.mock('./DetailsPanel.jsx', () => ({ default: () => <div data-testid="details-panel" /> }))

vi.mock('./useProgressDashboardData.js', () => ({
  default: (...args) => useProgressDashboardDataMock(...args)
}))

import ProgressDashboard from './ProgressDashboard.jsx'

let usingFakeTimers = false

const createHookState = (overrides = {}) => ({
  heatMapData: { heatMap: {}, range: 'all', updatedAt: Date.now() },
  errorIntel: null,
  userStats: { totalMastery: 0 },
  studyPlan: null,
  loading: false,
  error: null,
  systemReady: true,
  refresh: vi.fn(),
  practiceReminders: [],
  pronunciationStats: { totalAttempts: 0, recentAttempts: [] },
  sectionsStatus: {
    userStats: 'success',
    weeklyGoals: 'success',
    weeklyProgress: 'success',
    dailyChallenges: 'success',
    pronunciationStats: 'success',
    heatMap: 'success',
    recommendations: 'success',
    studyPlan: 'success',
    advancedAnalytics: 'success',
    errorIntel: 'success'
  },
  initialSectionsReady: true,
  ...overrides
})

describe('ProgressDashboard navigation wiring', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useProgressDashboardDataMock.mockReturnValue(createHookState())
  })

  afterEach(() => {
    if (usingFakeTimers) {
      vi.runOnlyPendingTimers()
      vi.useRealTimers()
      usingFakeTimers = false
    }
  })

  it('normalizes drill config before navigating from unified practice', async () => {
    const onNavigateToDrill = vi.fn()
    render(<ProgressDashboard onNavigateToDrill={onNavigateToDrill} />)
    await screen.findByRole('button', { name: /Start Practice/i })

    fireEvent.click(screen.getByRole('button', { name: /Start Practice/i }))

    expect(setSettingsMock).toHaveBeenCalledWith(expect.objectContaining({
      practiceMode: 'specific',
      specificMood: 'indicative',
      specificTense: 'pres',
      reviewSessionType: 'due',
      reviewSessionFilter: {}
    }))
    expect(onNavigateToDrill).toHaveBeenCalledTimes(1)
  })

  it('ignores duplicate rapid triggers and allows the next one after cooldown', () => {
    vi.useFakeTimers()
    usingFakeTimers = true
    const onNavigateToDrill = vi.fn()
    render(<ProgressDashboard onNavigateToDrill={onNavigateToDrill} />)

    const trigger = screen.getByRole('button', { name: /Start Practice/i })
    fireEvent.click(trigger)
    fireEvent.click(trigger)

    expect(onNavigateToDrill).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(300)
    fireEvent.click(trigger)

    expect(onNavigateToDrill).toHaveBeenCalledTimes(2)
  })
})
