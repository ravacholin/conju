import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import FocusModePanel from './FocusModePanel.jsx'

describe('FocusModePanel', () => {
  it('renders focus tracks', () => {
    render(
      <FocusModePanel
        userStats={{ totalMastery: 60 }}
        heatMapData={{
          heatMap: {
            'subjunctive-subjPres': { mastery: 0.2, attempts: 5 }
          }
        }}
      />
    )

    expect(screen.getByText('Focus mode')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /Entrenar este foco/i }).length).toBeGreaterThan(0)
  })

  it('emits selected focus track', () => {
    const onStartFocusTrack = vi.fn()
    render(
      <FocusModePanel
        userStats={{ totalMastery: 60 }}
        heatMapData={{
          heatMap: {
            'subjunctive-subjPres': { mastery: 0.2, attempts: 5 }
          }
        }}
        onStartFocusTrack={onStartFocusTrack}
      />
    )

    fireEvent.click(screen.getAllByRole('button', { name: /Entrenar este foco/i })[0])
    expect(onStartFocusTrack).toHaveBeenCalledTimes(1)
    expect(onStartFocusTrack.mock.calls[0][0].drillConfig.practiceMode).toBe('specific')
  })
})
