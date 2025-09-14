import React from 'react'
import { render, screen } from '@testing-library/react'
import WeeklyGoalsPanel from './WeeklyGoalsPanel.jsx'

describe('WeeklyGoalsPanel', () => {
  it('renders goal values correctly', () => {
    const weeklyGoals = { CELLS_TO_IMPROVE: 4, MIN_SCORE: 80, SESSIONS: 6 }
    const weeklyProgress = { cellsToImprove: 2, sessionsCompleted: 3 }
    const userStats = { totalMastery: 72 }

    render(
      <WeeklyGoalsPanel
        weeklyGoals={weeklyGoals}
        weeklyProgress={weeklyProgress}
        userStats={userStats}
      />
    )

    expect(screen.getByText(/Celdas a mejorar/i)).toBeInTheDocument()
    expect(screen.getByText('2 / 4')).toBeInTheDocument()
    expect(screen.getByText('72% / 80%')).toBeInTheDocument()
    expect(screen.getByText('3 / 6')).toBeInTheDocument()
  })
})
