import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import CoachModePanel from './CoachModePanel.jsx'

describe('CoachModePanel', () => {
  it('renders coach objective and duration', () => {
    render(
      <CoachModePanel
        userStats={{ totalMastery: 20, streakDays: 0 }}
        heatMapData={{ heatMap: {} }}
      />
    )

    expect(screen.getByText('Modo coach')).toBeInTheDocument()
    expect(screen.getByText(/Duración estimada/i)).toBeInTheDocument()
  })

  it('calls onStartCoach with generated plan', () => {
    const onStartCoach = vi.fn()
    render(
      <CoachModePanel
        userStats={{ totalMastery: 55, streakDays: 3 }}
        heatMapData={{
          heatMap: {
            'subjunctive-subjPres': { mastery: 0.2, attempts: 4 }
          }
        }}
        onStartCoach={onStartCoach}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /Iniciar coach 5 min/i }))
    expect(onStartCoach).toHaveBeenCalledTimes(1)
    expect(onStartCoach.mock.calls[0][0].drillConfig.practiceMode).toBe('specific')
  })
})
