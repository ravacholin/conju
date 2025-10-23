import React from 'react'
import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'

const useProgressDashboardDataMock = vi.fn()
const errorIntelligenceSpy = vi.fn()
const initializePlanMock = vi.fn()
const getPlanProgressMock = vi.fn()
const getActivePlanMock = vi.fn()
const markSessionAsStartedMock = vi.fn()
const generatePlanMock = vi.fn()

vi.mock('../../lib/progress/userManager/index.js', () => ({
  syncNow: vi.fn(() => Promise.resolve({ success: true })),
  isSyncEnabled: vi.fn(() => true),
  getCurrentUserId: vi.fn(() => null)
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
vi.mock('../../hooks/useSRSQueue.js', () => ({
  useSRSQueue: () => ({
    queue: [],
    loading: false,
    error: '',
    stats: { total: 0, overdue: 0, urgent: 0, scheduled: 0 },
    lastUpdated: null,
    reload: vi.fn()
  })
}))

vi.mock('../../lib/progress/planTracking.js', () => ({
  initializePlan: (...args) => initializePlanMock(...args),
  getPlanProgress: (...args) => getPlanProgressMock(...args),
  getActivePlan: (...args) => getActivePlanMock(...args),
  markSessionAsStarted: (...args) => markSessionAsStartedMock(...args)
}))

vi.mock('../../lib/progress/studyPlans.js', () => ({
  generatePersonalizedStudyPlan: (...args) => generatePlanMock(...args)
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
  getPlanProgressMock.mockReturnValue({
    completed: 0,
    total: 0,
    percentage: 0,
    nextSession: null,
    activePlan: null
  })
  getActivePlanMock.mockReturnValue(null)
  initializePlanMock.mockReturnValue(null)
  markSessionAsStartedMock.mockReturnValue(true)
  generatePlanMock.mockResolvedValue(null)
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

  it('renders the study plan summary when a plan is available', () => {
    const samplePlan = {
      generatedAt: '2024-01-01T00:00:00.000Z',
      overview: { focusArea: 'Verbos irregulares' },
      timeline: { sessionsPerWeek: 4 },
      sessionBlueprints: {
        sessions: [
          {
            id: 'session-1',
            title: 'Repaso intensivo',
            estimatedDuration: '20 min',
            difficulty: 'Medio',
            drillConfig: { practiceMode: 'mixed' }
          }
        ]
      }
    }

    getActivePlanMock.mockReturnValue({ planId: 'plan-123', generatedAt: samplePlan.generatedAt })
    getPlanProgressMock.mockReturnValue({
      completed: 1,
      total: 3,
      percentage: 33,
      nextSession: {
        sessionId: 'session-1',
        status: 'pending',
        config: { practiceMode: 'mixed' }
      },
      activePlan: { planId: 'plan-123', generatedAt: samplePlan.generatedAt }
    })

    useProgressDashboardDataMock.mockReturnValue(createHookState({ studyPlan: samplePlan }))

    render(<ProgressDashboard />)

    expect(screen.getByTestId('plan-summary-card')).toBeInTheDocument()
    expect(screen.getByText(/Plan personalizado activo/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Iniciar plan/i })).toBeInTheDocument()
  })

  it('offers plan generation when no study plan exists', () => {
    useProgressDashboardDataMock.mockReturnValue(createHookState({ studyPlan: null }))

    render(<ProgressDashboard />)

    expect(screen.getByTestId('plan-summary-empty')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Generar plan/i })).toBeInTheDocument()
  })
})
