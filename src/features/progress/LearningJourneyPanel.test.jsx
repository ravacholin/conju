import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import LearningJourneyPanel from './LearningJourneyPanel.jsx'

describe('LearningJourneyPanel', () => {
  it('renders journey checkpoints and next milestone', () => {
    render(
      <LearningJourneyPanel
        userStats={{ totalAttempts: 8, streakDays: 1, totalMastery: 25 }}
        studyPlan={null}
      />
    )

    expect(screen.getByText('Ruta de aprendizaje')).toBeInTheDocument()
    expect(screen.getByText(/Siguiente hito/i)).toBeInTheDocument()
  })

  it('triggers drill navigation for pending checkpoints', () => {
    const onNavigateToDrill = vi.fn()
    render(
      <LearningJourneyPanel
        userStats={{ totalAttempts: 8, streakDays: 1, totalMastery: 25 }}
        studyPlan={null}
        onNavigateToDrill={onNavigateToDrill}
      />
    )

    fireEvent.click(screen.getAllByRole('button', { name: /Practicar ahora/i })[0])
    expect(onNavigateToDrill).toHaveBeenCalledTimes(1)
  })
})
