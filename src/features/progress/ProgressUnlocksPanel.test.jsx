import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import ProgressUnlocksPanel from './ProgressUnlocksPanel.jsx'

describe('ProgressUnlocksPanel', () => {
  it('shows locked actions when requirements are not met', () => {
    render(<ProgressUnlocksPanel userStats={{ totalAttempts: 3, streakDays: 0, totalMastery: 10 }} />)
    const buttons = screen.getAllByRole('button', { name: /Bloqueado/i })
    expect(buttons).toHaveLength(2)
  })

  it('opens unlocked experiences', () => {
    const onNavigateToStory = vi.fn()
    const onNavigateToTimeline = vi.fn()

    render(
      <ProgressUnlocksPanel
        userStats={{ totalAttempts: 20, streakDays: 3, totalMastery: 80 }}
        onNavigateToStory={onNavigateToStory}
        onNavigateToTimeline={onNavigateToTimeline}
      />
    )

    const openButtons = screen.getAllByRole('button', { name: /Abrir ahora/i })
    fireEvent.click(openButtons[0])
    fireEvent.click(openButtons[1])

    expect(onNavigateToStory).toHaveBeenCalledTimes(1)
    expect(onNavigateToTimeline).toHaveBeenCalledTimes(1)
  })
})
