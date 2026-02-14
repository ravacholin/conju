import React from 'react'
import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import axe from 'axe-core'

const useProgressDashboardDataMock = vi.fn()

vi.mock('../../lib/progress/userManager/index.js', () => ({
  syncNow: vi.fn(() => Promise.resolve({ success: true })),
  isSyncEnabled: vi.fn(() => true),
  getCurrentUserId: vi.fn(() => 'test-user')
}))

vi.mock('../../hooks/useSRSQueue.js', () => ({
  useSRSQueue: () => ({ stats: null })
}))

vi.mock('./SummaryStrip.jsx', () => ({ default: () => <div>Summary</div> }))
vi.mock('./UnifiedPracticeAction.jsx', () => ({ default: () => <div>Practice</div> }))
vi.mock('./HeatMapSRS.jsx', () => ({ default: () => <div>Heat Map</div> }))
vi.mock('./DetailsPanel.jsx', () => ({ default: () => <div>Details</div> }))

vi.mock('./useProgressDashboardData.js', () => ({
  default: (...args) => useProgressDashboardDataMock(...args)
}))

import ProgressDashboard from './ProgressDashboard.jsx'

const createHookState = () => ({
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
    pronunciationStats: 'idle',
    heatMap: 'success',
    recommendations: 'success',
    studyPlan: 'success',
    advancedAnalytics: 'idle',
    errorIntel: 'success'
  },
  initialSectionsReady: true
})

describe('ProgressDashboard a11y', () => {
  it('has no critical accessibility violations', async () => {
    useProgressDashboardDataMock.mockReturnValue(createHookState())

    const { container } = render(<ProgressDashboard />)

    const result = await axe.run(container, {
      rules: {
        'color-contrast': { enabled: false }
      }
    })

    expect(result.violations).toEqual([])
  })
})
