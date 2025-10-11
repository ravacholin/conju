import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'

const { useSettingsMock } = vi.hoisted(() => ({
  useSettingsMock: vi.fn()
}))

vi.mock('../../state/settings.js', () => ({
  useSettings: useSettingsMock
}))

import ProgressOverview from './ProgressOverview.jsx'

describe('ProgressOverview', () => {
  const baseProps = {
    onNavigateHome: () => {},
    onNavigateToDrill: () => {},
    _syncing: false,
    _onSync: () => {},
    _syncEnabled: true,
    _onRefresh: () => {}
  }

  beforeEach(() => {
    useSettingsMock.mockReturnValue({
      userLevel: 'A2',
      dailyGoalType: 'attempts',
      dailyGoalValue: 10,
      setDailyGoalType: vi.fn(),
      setDailyGoalValue: vi.fn()
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it.each([
    { mastery: 35, expectedLabel: 'A2 - Elemental' },
    { mastery: 70, expectedLabel: 'A2 - Elemental (En progreso)' },
    { mastery: 90, expectedLabel: 'A2 - Elemental (Sólido)' }
  ])('normalizes mastery value $mastery before labeling', ({ mastery, expectedLabel }) => {
    render(
      <ProgressOverview
        {...baseProps}
        userStats={{
          totalMastery: mastery,
          totalAttempts: 0,
          itemsDue: 0,
          streakDays: 0,
          attemptsToday: 0,
          focusMinutesToday: 0
        }}
      />
    )

    expect(screen.getByText(expectedLabel)).toBeInTheDocument()
  })

  it('shows attempts goal progress and allows updating the value', () => {
    const setDailyGoalValue = vi.fn()
    const settings = {
      userLevel: 'A2',
      dailyGoalType: 'attempts',
      dailyGoalValue: 10,
      setDailyGoalType: vi.fn(),
      setDailyGoalValue
    }

    useSettingsMock.mockReturnValue(settings)

    render(
      <ProgressOverview
        {...baseProps}
        userStats={{
          totalMastery: 50,
          totalAttempts: 20,
          itemsDue: 0,
          streakDays: 2,
          attemptsToday: 4,
          focusMinutesToday: 6.5
        }}
      />
    )

    expect(screen.getAllByText('4 / 10 intentos')[0]).toBeInTheDocument()

    const input = screen.getByLabelText('Cantidad objetivo')
    fireEvent.change(input, { target: { value: '15' } })

    expect(setDailyGoalValue).toHaveBeenCalledWith(15)
    expect(screen.getAllByText('4 / 15 intentos')[0]).toBeInTheDocument()
  })

  it('permite cambiar la meta a minutos y refleja el progreso', () => {
    const setDailyGoalType = vi.fn()
    const setDailyGoalValue = vi.fn()

    useSettingsMock.mockReturnValue({
      userLevel: 'A2',
      dailyGoalType: 'attempts',
      dailyGoalValue: 10,
      setDailyGoalType,
      setDailyGoalValue
    })

    render(
      <ProgressOverview
        {...baseProps}
        userStats={{
          totalMastery: 50,
          totalAttempts: 20,
          itemsDue: 0,
          streakDays: 2,
          attemptsToday: 4,
          focusMinutesToday: 6.5
        }}
      />
    )

    const select = screen.getByLabelText('Tipo de meta')
    fireEvent.change(select, { target: { value: 'minutes' } })

    expect(setDailyGoalType).toHaveBeenCalledWith('minutes')
    expect(screen.getAllByText('6.5 / 10 minutos')[0]).toBeInTheDocument()

    const input = screen.getByLabelText('Cantidad objetivo')
    fireEvent.change(input, { target: { value: '12.5' } })

    expect(setDailyGoalValue).toHaveBeenCalledWith(12.5)
    expect(screen.getAllByText('6.5 / 12.5 minutos')[0]).toBeInTheDocument()
  })
})

