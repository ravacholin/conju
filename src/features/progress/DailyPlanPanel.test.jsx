import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import DailyPlanPanel from './DailyPlanPanel.jsx'

describe('DailyPlanPanel', () => {
  it('renders empty state when there is no plan', () => {
    render(<DailyPlanPanel studyPlan={null} onStartSession={vi.fn()} />)
    expect(screen.getByText(/Aún no hay un plan personalizado listo/i)).toBeInTheDocument()
  })

  it('renders sessions and triggers start action', () => {
    const onStartSession = vi.fn()
    const studyPlan = {
      scheduling: { nextOptimalTime: '2026-02-12T20:00:00.000Z' },
      sessionBlueprints: {
        sessions: [
          {
            id: 's1',
            title: 'Práctica: Pretérito',
            description: 'Enfocada en tus errores recientes.',
            estimatedDuration: '20 min',
            difficulty: 'Medio',
            drillConfig: { practiceMode: 'specific', specificMood: 'indicative', specificTense: 'pret' }
          }
        ]
      }
    }

    render(<DailyPlanPanel studyPlan={studyPlan} onStartSession={onStartSession} />)

    expect(screen.getByText('Práctica: Pretérito')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Empezar sesión/i }))
    expect(onStartSession).toHaveBeenCalledTimes(1)
    expect(onStartSession.mock.calls[0][0].id).toBe('s1')
  })
})
