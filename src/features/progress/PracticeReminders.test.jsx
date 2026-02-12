import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const settingsState = {
  dailyGoalType: 'attempts',
  dailyGoalValue: 20,
  practiceReminderEnabled: true,
  practiceReminderTime: '00:00',
  practiceReminderDays: [new Date().getDay()],
  setPracticeReminderEnabled: vi.fn(),
  setPracticeReminderTime: vi.fn(),
  togglePracticeReminderDay: vi.fn()
}

vi.mock('../../state/settings.js', () => ({
  useSettings: () => settingsState
}))

import PracticeReminders from './PracticeReminders.jsx'

describe('PracticeReminders', () => {
  beforeEach(() => {
    settingsState.dailyGoalType = 'attempts'
    settingsState.dailyGoalValue = 20
    settingsState.practiceReminderEnabled = true
    settingsState.practiceReminderTime = '00:00'
    settingsState.practiceReminderDays = [new Date().getDay()]
    settingsState.setPracticeReminderEnabled.mockReset()
    settingsState.setPracticeReminderTime.mockReset()
    settingsState.togglePracticeReminderDay.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows reminder toast when daily target is still pending and time has passed', async () => {
    const onShowToast = vi.fn()

    render(
      <PracticeReminders
        reminders={[]}
        userStats={{ attemptsToday: 0 }}
        onShowToast={onShowToast}
      />
    )

    await waitFor(() => {
      expect(onShowToast).toHaveBeenCalledTimes(1)
    })
    expect(onShowToast.mock.calls[0][0].message).toContain('meta diaria')
  })

  it('does not show reminder toast when disabled', async () => {
    settingsState.practiceReminderEnabled = false
    const onShowToast = vi.fn()

    render(
      <PracticeReminders
        reminders={[]}
        userStats={{ attemptsToday: 0 }}
        onShowToast={onShowToast}
      />
    )

    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(onShowToast).not.toHaveBeenCalled()
    expect(screen.getByText(/Recordatorios inteligentes/i)).toBeInTheDocument()
  })

  it('prevents duplicate rapid navigate actions from reminder card', async () => {
    vi.useFakeTimers()
    const onNavigateToDrill = vi.fn()

    render(
      <PracticeReminders
        reminders={[{ id: 'r1', priority: 'high', message: 'Repaso pendiente' }]}
        userStats={{ attemptsToday: 0 }}
        onNavigateToDrill={onNavigateToDrill}
      />
    )

    const button = screen.getByRole('button', { name: /Practicar ahora/i })
    fireEvent.click(button)
    fireEvent.click(button)

    expect(onNavigateToDrill).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(260)
    fireEvent.click(button)
    expect(onNavigateToDrill).toHaveBeenCalledTimes(2)
    vi.useRealTimers()
  })
})
