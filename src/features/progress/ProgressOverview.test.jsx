import React from 'react'
import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'

vi.mock('../../state/settings.js', () => ({
  useSettings: vi.fn(() => ({
    userLevel: 'A2',
  }))
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
          streakDays: 0
        }}
      />
    )

    expect(screen.getByText(expectedLabel)).toBeInTheDocument()
  })
})

