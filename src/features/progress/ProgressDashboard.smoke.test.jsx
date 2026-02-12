import React from 'react'
import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'

const useProgressDashboardDataMock = vi.fn()
const errorIntelligenceSpy = vi.fn()

vi.mock('../../lib/progress/userManager/index.js', () => ({
  syncNow: vi.fn(() => Promise.resolve({ success: true })),
  isSyncEnabled: vi.fn(() => true),
  getCurrentUserId: vi.fn(() => 'test-user')
}))

vi.mock('../../hooks/useSRSQueue.js', () => ({
  useSRSQueue: () => ({
    queue: [],
    loading: false,
    error: '',
    stats: null,
    lastUpdated: null,
    reload: vi.fn()
  })
}))

vi.mock('./ProgressOverview.jsx', () => ({ default: () => <div data-testid="progress-overview" /> }))
vi.mock('./PracticeReminders.jsx', () => ({ default: () => <div data-testid="practice-reminders" /> }))
vi.mock('./DailyPlanPanel.jsx', () => ({ default: () => <div data-testid="daily-plan-panel" /> }))
vi.mock('./ProgressUnlocksPanel.jsx', () => ({ default: () => <div data-testid="progress-unlocks-panel" /> }))
vi.mock('./LearningJourneyPanel.jsx', () => ({ default: () => <div data-testid="learning-journey-panel" /> }))
vi.mock('./CoachModePanel.jsx', () => ({ default: () => <div data-testid="coach-mode-panel" /> }))
vi.mock('./FocusModePanel.jsx', () => ({ default: () => <div data-testid="focus-mode-panel" /> }))
vi.mock('./FrequentErrorsPanel.jsx', () => ({ default: () => <div data-testid="frequent-errors-panel" /> }))
vi.mock('./PronunciationStatsWidget.jsx', () => ({ default: () => <div data-testid="pronunciation-widget" /> }))
vi.mock('./AccuracyTrendCard.jsx', () => ({ default: () => <div data-testid="accuracy-trend-card" /> }))
vi.mock('./HeatMapSRS.jsx', () => ({ default: () => <div data-testid="heat-map" /> }))
vi.mock('./SmartPractice.jsx', () => ({ default: () => <div data-testid="smart-practice" /> }))
vi.mock('./StudyInsights.jsx', () => ({ default: () => <div data-testid="study-insights" /> }))
vi.mock('./ErrorIntelligence.jsx', () => ({
  default: (props) => {
    errorIntelligenceSpy(props)
    return <div data-testid="error-intelligence" />
  }
}))

vi.mock('./useProgressDashboardData.js', () => ({
  default: (...args) => useProgressDashboardDataMock(...args)
}))

vi.mock('../../hooks/useSRSQueue.js', () => ({
  useSRSQueue: () => ({ stats: null })
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

beforeEach(() => {
  vi.clearAllMocks()
  useProgressDashboardDataMock.mockReturnValue(createHookState())
})

describe('ProgressDashboard (smoke)', () => {
  it('renders core sections when data is ready', async () => {
    render(<ProgressDashboard />)

    expect(screen.getByTestId('progress-overview')).toBeInTheDocument()
    expect(screen.getByTestId('practice-reminders')).toBeInTheDocument()
    expect(screen.getByTestId('daily-plan-panel')).toBeInTheDocument()
    expect(screen.getByTestId('progress-unlocks-panel')).toBeInTheDocument()
    expect(screen.getByTestId('learning-journey-panel')).toBeInTheDocument()
    expect(screen.getByTestId('coach-mode-panel')).toBeInTheDocument()
    expect(screen.getByTestId('focus-mode-panel')).toBeInTheDocument()
    expect(screen.getByTestId('frequent-errors-panel')).toBeInTheDocument()
    expect(await screen.findByTestId('accuracy-trend-card')).toBeInTheDocument()
    expect(await screen.findByTestId('pronunciation-widget')).toBeInTheDocument()
    expect(await screen.findByTestId('heat-map')).toBeInTheDocument()
    expect(await screen.findByTestId('smart-practice')).toBeInTheDocument()
    expect(await screen.findByTestId('study-insights')).toBeInTheDocument()
    expect(await screen.findByTestId('error-intelligence')).toBeInTheDocument()
  })

  it('defers rendering when data has not been loaded yet', () => {
    useProgressDashboardDataMock.mockReturnValue(
      createHookState({
        heatMapData: null,
        loading: true,
        initialSectionsReady: false,
        sectionsStatus: {}
      })
    )

    render(<ProgressDashboard />)

    expect(screen.getByText('Cargando progreso...')).toBeInTheDocument()
  })

  it('passes error intelligence data from the hook without extra fetches', async () => {
    const errorIntelData = { summary: 'top mistakes' }
    useProgressDashboardDataMock.mockReturnValue(
      createHookState({
        errorIntel: errorIntelData
      })
    )

    render(<ProgressDashboard />)

    expect(useProgressDashboardDataMock).toHaveBeenCalledTimes(1)
    await screen.findByTestId('error-intelligence')
    expect(errorIntelligenceSpy).toHaveBeenCalledTimes(1)
    expect(errorIntelligenceSpy.mock.calls[0][0].data).toBe(errorIntelData)
  })
})
