import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { vi } from 'vitest'

const useProgressDashboardDataMock = vi.fn()

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

vi.mock('./SummaryStrip.jsx', () => ({ default: () => <div data-testid="summary-strip" /> }))
vi.mock('./UnifiedPracticeAction.jsx', () => ({ default: () => <div data-testid="unified-practice" /> }))
vi.mock('./HeatMapSRS.jsx', () => ({ default: () => <div data-testid="heat-map" /> }))
vi.mock('./DetailsPanel.jsx', () => ({
  default: ({ onExpandChange }) => (
    <div data-testid="details-panel">
      <button type="button" onClick={() => onExpandChange?.(true)}>Ver más</button>
    </div>
  )
}))
vi.mock('./AccuracyTrendCard.jsx', () => ({ default: () => <div data-testid="accuracy-trend-card" /> }))
vi.mock('./ErrorIntelligence.jsx', () => ({ default: () => <div data-testid="error-intelligence" /> }))
vi.mock('./LearningJourneyPanel.jsx', () => ({ default: () => <div data-testid="learning-journey-panel" /> }))

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

beforeEach(() => {
  vi.clearAllMocks()
  useProgressDashboardDataMock.mockReturnValue(createHookState())
})

describe('ProgressDashboard (smoke)', () => {
  it('renders all 5 sections when data is ready', async () => {
    render(<ProgressDashboard />)

    expect(screen.getByTestId('summary-strip')).toBeInTheDocument()
    expect(screen.getByTestId('unified-practice')).toBeInTheDocument()
    expect(await screen.findByTestId('heat-map')).toBeInTheDocument()
    expect(screen.getByTestId('details-panel')).toBeInTheDocument()
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

  it('renders nav bar with back, home, and practice buttons', () => {
    render(<ProgressDashboard />)

    expect(screen.getByTitle('Volver')).toBeInTheDocument()
    expect(screen.getByTitle('Inicio')).toBeInTheDocument()
    expect(screen.getByTitle('Practicar')).toBeInTheDocument()
  })
})
