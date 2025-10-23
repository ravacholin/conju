import React from 'react'
import { render, screen } from '@testing-library/react'

import AccuracyTrendCard from './AccuracyTrendCard.jsx'

describe('AccuracyTrendCard', () => {
  it('formats statistics and surfaces trend insights', () => {
    const stats = {
      averageAccuracy: 83.37,
      recentAttempts: [
        { id: '1', accuracy: 92, createdAt: '2024-04-10T10:00:00Z', correct: true, target: 'hablar', recognized: 'hablo' },
        { id: '2', accuracy: 88, createdAt: '2024-04-09T10:00:00Z', correct: true, target: 'comer', recognized: 'como' },
        { id: '3', accuracy: 70, createdAt: '2024-04-08T10:00:00Z', correct: false, target: 'vivir', recognized: 'vive' },
        { id: '4', accuracy: 60, createdAt: '2024-04-07T10:00:00Z', correct: false, target: 'ser', recognized: 'soy' }
      ]
    }

    render(<AccuracyTrendCard stats={stats} />)

    expect(screen.getByText('83.4%')).toBeInTheDocument()
    expect(screen.getByText(/Mejora/i)).toBeInTheDocument()
    expect(screen.getByText('hablar')).toBeInTheDocument()
    expect(screen.getByText('comer')).toBeInTheDocument()
  })

  it('renders an empty state when there are no attempts', () => {
    render(<AccuracyTrendCard stats={{ averageAccuracy: 0, recentAttempts: [] }} />)

    expect(screen.getByText('0%')).toBeInTheDocument()
    expect(screen.getByText('Todavía no registramos intentos recientes.')).toBeInTheDocument()
  })
})
