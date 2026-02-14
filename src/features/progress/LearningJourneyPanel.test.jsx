import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import LearningJourneyPanel from './LearningJourneyPanel.jsx'

describe('LearningJourneyPanel', () => {
  it('renders journey checkpoints and progress counter', () => {
    render(
      <LearningJourneyPanel
        userStats={{ totalAttempts: 8, streakDays: 1, totalMastery: 25, accuracy: 40, masteredCells: 1 }}
        studyPlan={null}
      />
    )

    expect(screen.getByText('Tu progreso')).toBeInTheDocument()
    expect(screen.getByText(/hitos/i)).toBeInTheDocument()
  })

  it('triggers drill navigation for pending checkpoints', () => {
    const onNavigateToDrill = vi.fn()
    render(
      <LearningJourneyPanel
        userStats={{ totalAttempts: 8, streakDays: 1, totalMastery: 25, accuracy: 40, masteredCells: 1 }}
        studyPlan={null}
        onNavigateToDrill={onNavigateToDrill}
      />
    )

    const buttons = screen.getAllByRole('button')
    fireEvent.click(buttons[0])
    expect(onNavigateToDrill).toHaveBeenCalledTimes(1)
  })
})
