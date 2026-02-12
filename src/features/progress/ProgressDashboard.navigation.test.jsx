import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, beforeEach, vi } from 'vitest'

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

vi.mock('./ProgressOverview.jsx', () => ({ default: () => <div data-testid="progress-overview" /> }))
vi.mock('./PracticeReminders.jsx', () => ({ default: () => <div data-testid="practice-reminders" /> }))
vi.mock('./DailyPlanPanel.jsx', () => ({
  default: ({ onStartSession }) => (
    <button type="button" onClick={() => onStartSession({ drillConfig: { practiceMode: 'specific', specificMood: 'indicative', specificTense: 'pres' } })}>
      Start Daily Plan Session
    </button>
  )
}))
vi.mock('./CoachModePanel.jsx', () => ({ default: () => <div data-testid="coach-mode-panel" /> }))
vi.mock('./FocusModePanel.jsx', () => ({ default: () => <div data-testid="focus-mode-panel" /> }))
vi.mock('./FrequentErrorsPanel.jsx', () => ({ default: () => <div data-testid="frequent-errors-panel" /> }))
vi.mock('./LearningJourneyPanel.jsx', () => ({ default: () => <div data-testid="learning-journey-panel" /> }))
vi.mock('./ProgressUnlocksPanel.jsx', () => ({ default: () => <div data-testid="progress-unlocks-panel" /> }))
vi.mock('./PronunciationStatsWidget.jsx', () => ({ default: () => <div data-testid="pronunciation-widget" /> }))
vi.mock('./AccuracyTrendCard.jsx', () => ({ default: () => <div data-testid="accuracy-trend-card" /> }))
vi.mock('./HeatMapSRS.jsx', () => ({ default: () => <div data-testid="heat-map" /> }))
vi.mock('./SmartPractice.jsx', () => ({ default: () => <div data-testid="smart-practice" /> }))
vi.mock('./StudyInsights.jsx', () => ({ default: () => <div data-testid="study-insights" /> }))
vi.mock('./ErrorIntelligence.jsx', () => ({ default: () => <div data-testid="error-intelligence" /> }))

vi.mock('./useProgressDashboardData.js', () => ({
  default: (...args) => useProgressDashboardDataMock(...args)
}))

import ProgressDashboard from './ProgressDashboard.jsx'

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

  it('normalizes drill config before navigating from daily plan', async () => {
    const onNavigateToDrill = vi.fn()
    render(<ProgressDashboard onNavigateToDrill={onNavigateToDrill} />)
    await screen.findByTestId('accuracy-trend-card')

    fireEvent.click(screen.getByRole('button', { name: /Start Daily Plan Session/i }))

    expect(setSettingsMock).toHaveBeenCalledWith(expect.objectContaining({
      practiceMode: 'specific',
      specificMood: 'indicative',
      specificTense: 'pres',
      reviewSessionType: 'due',
      reviewSessionFilter: {}
    }))
    expect(onNavigateToDrill).toHaveBeenCalledTimes(1)
  })
})
