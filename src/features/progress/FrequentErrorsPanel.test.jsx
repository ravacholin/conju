import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import FrequentErrorsPanel from './FrequentErrorsPanel.jsx'

describe('FrequentErrorsPanel', () => {
  it('renders corrective items when error intel is present', () => {
    render(
      <FrequentErrorsPanel
        errorIntel={{
          heatmap: {
            cells: [
              { mood: 'subjunctive', tense: 'subjPres', attempts: 8, errorRate: 0.7 }
            ]
          }
        }}
      />
    )

    expect(screen.getByText('Errores frecuentes')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Corregir ahora/i })).toBeInTheDocument()
  })

  it('emits selected combo to start corrective drill', () => {
    const onStartCorrectiveDrill = vi.fn()
    render(
      <FrequentErrorsPanel
        errorIntel={{
          heatmap: {
            cells: [
              { mood: 'subjunctive', tense: 'subjPres', attempts: 8, errorRate: 0.7 }
            ]
          }
        }}
        onStartCorrectiveDrill={onStartCorrectiveDrill}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /Corregir ahora/i }))
    expect(onStartCorrectiveDrill).toHaveBeenCalledTimes(1)
    expect(onStartCorrectiveDrill.mock.calls[0][0].mood).toBe('subjunctive')
  })
})
