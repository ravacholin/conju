import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SessionSummary from './SessionSummary.jsx'

describe('SessionSummary component', () => {
  it('renders with default summary values', () => {
    render(React.createElement(SessionSummary, { onFinish: () => {} }))
    expect(screen.getByText('¡Sesión Completada!')).toBeInTheDocument()
    // Default grade is C
    expect(screen.getByText('C')).toBeInTheDocument()
  })

  it('shows error patterns and recommendations when provided', () => {
    const summary = {
      grade: 'A',
      accuracy: 92,
      averageTime: 1.5,
      maxStreak: 7,
      points: 150,
      totalAttempts: 20,
      correctAnswers: 18,
      errorPatterns: { accent_error: 2 },
      recommendations: ['Revisar diptongos']
    }
    render(React.createElement(SessionSummary, { onFinish: () => {}, summary }))

    expect(screen.getByText('Precisión')).toBeInTheDocument()
    expect(screen.getByText('Errores de acentos')).toBeInTheDocument()
    expect(screen.getByText('Revisar diptongos')).toBeInTheDocument()
  })

  it('invokes onFinish when clicking the button', () => {
    const onFinish = vi.fn()
    render(React.createElement(SessionSummary, { onFinish, summary: {} }))
    const btn = screen.getByRole('button', { name: /Continuar Aprendizaje/i })
    fireEvent.click(btn)
    expect(onFinish).toHaveBeenCalledTimes(1)
  })
})
