import React from 'react'
import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'

vi.mock('../../state/settings.js', () => ({
  useSettings: vi.fn(() => ({
    region: 'rioplatense',
    level: 'A2',
    practiceMode: 'mixed',
    set: vi.fn(),
  }))
}))

vi.mock('./SRSPanel.jsx', () => ({ default: () => <div data-testid="srs-panel" /> }))
vi.mock('./VerbMasteryMap.jsx', () => ({ default: () => <div data-testid="mastery-map" /> }))
vi.mock('./EnhancedErrorAnalysis.jsx', () => ({ default: () => <div data-testid="enhanced-error-analysis" /> }))
vi.mock('./ErrorIntelligence.jsx', () => ({ default: () => <div data-testid="error-intelligence" /> }))
vi.mock('./PracticeRecommendations.jsx', () => ({ default: () => <div data-testid="practice-recos" /> }))

vi.mock('./useProgressDashboardData.js', () => ({
  default: () => ({
    heatMapData: { heatMap: {}, range: 'all' },
    errorIntel: null,
    userStats: { totalMastery: 0 },
    weeklyGoals: { CELLS_TO_IMPROVE: 3, MIN_SCORE: 75, SESSIONS: 5 },
    weeklyProgress: { cellsToImprove: 0, sessionsCompleted: 0 },
    recommendations: [],
    loading: false,
    error: null,
    refreshing: false,
    systemReady: true,
    refresh: vi.fn(),
  })
}))

import ProgressDashboard from './ProgressDashboard.jsx'

describe('ProgressDashboard (smoke)', () => {
  it('renders core sections without crashing', () => {
    render(<ProgressDashboard />)
    expect(screen.getByText(/Progreso y Analíticas/i)).toBeInTheDocument()
    expect(screen.getByTestId('mastery-map')).toBeInTheDocument()
    expect(screen.getByTestId('srs-panel')).toBeInTheDocument()
    expect(screen.getByTestId('enhanced-error-analysis')).toBeInTheDocument()
    expect(screen.getByTestId('error-intelligence')).toBeInTheDocument()
    expect(screen.getByText(/Objetivos Semanales/i)).toBeInTheDocument()
  })
})

