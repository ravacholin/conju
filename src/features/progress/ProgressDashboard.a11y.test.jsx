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

vi.mock('./ProgressOverview.jsx', () => ({ default: () => <div>Progress Overview</div> }))
vi.mock('./PracticeReminders.jsx', () => ({ default: () => <div>Practice Reminders</div> }))
vi.mock('./DailyPlanPanel.jsx', () => ({ default: () => <div>Daily Plan</div> }))
vi.mock('./ProgressUnlocksPanel.jsx', () => ({ default: () => <div>Progress Unlocks</div> }))
vi.mock('./LearningJourneyPanel.jsx', () => ({ default: () => <div>Learning Journey</div> }))
vi.mock('./CoachModePanel.jsx', () => ({ default: () => <div>Coach Mode</div> }))
vi.mock('./FocusModePanel.jsx', () => ({ default: () => <div>Focus Mode</div> }))
vi.mock('./FrequentErrorsPanel.jsx', () => ({ default: () => <div>Frequent Errors</div> }))
vi.mock('./PronunciationStatsWidget.jsx', () => ({ default: () => <div>Pronunciation Stats</div> }))
vi.mock('./AccuracyTrendCard.jsx', () => ({ default: () => <div>Accuracy Trend</div> }))
vi.mock('./HeatMapSRS.jsx', () => ({ default: () => <div>Heat Map</div> }))
vi.mock('./SmartPractice.jsx', () => ({ default: () => <div>Smart Practice</div> }))
vi.mock('./StudyInsights.jsx', () => ({ default: () => <div>Study Insights</div> }))
vi.mock('./ErrorIntelligence.jsx', () => ({ default: () => <div>Error Intelligence</div> }))

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
  it('has no critical accessibility violations in first view', async () => {
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
