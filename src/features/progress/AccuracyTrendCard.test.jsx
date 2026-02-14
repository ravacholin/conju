import React from 'react'
import { render, screen } from '@testing-library/react'

import AccuracyTrendCard from './AccuracyTrendCard.jsx'

describe('AccuracyTrendCard', () => {
  it('formats statistics and shows mastery distribution', () => {
    const userStats = {
      accuracy: 83,
      totalAttempts: 120,
      attemptsToday: 15,
      masteredCells: 5,
      inProgressCells: 3,
      strugglingCells: 2
    }
    const errorIntel = {
      summary: { errorRate7: 0.17, trend: 'down' }
    }

    render(<AccuracyTrendCard userStats={userStats} errorIntel={errorIntel} />)

    expect(screen.getByText('83%')).toBeInTheDocument()
    expect(screen.getByText('120')).toBeInTheDocument()
    expect(screen.getByText('15')).toBeInTheDocument()
    expect(screen.getByText(/Mejorando/i)).toBeInTheDocument()
    expect(screen.getByText(/Dominados/i)).toBeInTheDocument()
  })

  it('renders an empty state when there are no attempts', () => {
    render(<AccuracyTrendCard userStats={{ accuracy: 0, totalAttempts: 0 }} />)

    expect(screen.getByText(/Todavía no hay datos/i)).toBeInTheDocument()
  })
})
