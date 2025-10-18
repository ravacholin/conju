import React from 'react'
import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'

const useProgressDashboardDataMock = vi.fn()
const errorIntelligenceSpy = vi.fn()

vi.mock('../../lib/progress/userManager/index.js', () => ({
  syncNow: vi.fn(() => Promise.resolve({ success: true })),
  isSyncEnabled: vi.fn(() => true)
}))

vi.mock('./ProgressOverview.jsx', () => ({ default: () => <div data-testid="progress-overview" /> }))
vi.mock('./PracticeReminders.jsx', () => ({ default: () => <div data-testid="practice-reminders" /> }))
vi.mock('./PronunciationStatsWidget.jsx', () => ({ default: () => <div data-testid="pronunciation-widget" /> }))
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
  ...overrides
})

beforeEach(() => {
  vi.clearAllMocks()
  useProgressDashboardDataMock.mockReturnValue(createHookState())
})

describe('ProgressDashboard (smoke)', () => {
  it('renders core sections when data is ready', () => {
    render(<ProgressDashboard />)

    expect(screen.getByTestId('progress-overview')).toBeInTheDocument()
    expect(screen.getByTestId('practice-reminders')).toBeInTheDocument()
    expect(screen.getByTestId('pronunciation-widget')).toBeInTheDocument()
    expect(screen.getByTestId('heat-map')).toBeInTheDocument()
    expect(screen.getByTestId('smart-practice')).toBeInTheDocument()
    expect(screen.getByTestId('study-insights')).toBeInTheDocument()
    expect(screen.getByTestId('error-intelligence')).toBeInTheDocument()
  })

  it('defers rendering when data has not been loaded yet', () => {
    useProgressDashboardDataMock.mockReturnValue(createHookState({ heatMapData: null }))

    const { container } = render(<ProgressDashboard />)
    expect(container).toBeEmptyDOMElement()
  })

  it('passes error intelligence data from the hook without extra fetches', () => {
    const errorIntelData = { summary: 'top mistakes' }
    useProgressDashboardDataMock.mockReturnValue(
      createHookState({
        errorIntel: errorIntelData
      })
    )

    render(<ProgressDashboard />)

    expect(useProgressDashboardDataMock).toHaveBeenCalledTimes(1)
    expect(errorIntelligenceSpy).toHaveBeenCalledTimes(1)
    expect(errorIntelligenceSpy.mock.calls[0][0].data).toBe(errorIntelData)
  })
})
