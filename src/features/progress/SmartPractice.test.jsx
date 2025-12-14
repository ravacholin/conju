import React from 'react'
import { render, screen } from '@testing-library/react'
import { vi, describe, it, beforeEach, afterEach } from 'vitest'

vi.mock('../../state/settings.js', () => ({
  useSettings: () => ({
    set: vi.fn(),
  }),
}))

vi.mock('../../lib/utils/verbLabels.js', async () => {
  const actual = await vi.importActual('../../lib/utils/verbLabels.js')
  return {
    ...actual,
    formatMoodTense: (mood, tense) => `${mood}-${tense}`,
  }
})

import SmartPractice from './SmartPractice.jsx'

describe('SmartPractice recommendations', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-15T00:00:00Z'))
    // Ensure deterministic Date.now()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('only references supported heatmap combinations', () => {
    const eightDays = 8 * 24 * 60 * 60 * 1000

    const heatMapData = {
      heatMap: {
        'imperative-imper': {
          attempts: 5,
          mastery: 0.4,
          lastAttempt: Date.now() - (2 * 24 * 60 * 60 * 1000),
        },
        'indicative-pres': {
          attempts: 12,
          mastery: 0.82,
          lastAttempt: Date.now() - eightDays,
        },
        'nonfinite-ger': {
          attempts: 7,
          mastery: 0.2,
          lastAttempt: Date.now() - eightDays,
        },
      },
    }

    render(
      <SmartPractice
        heatMapData={heatMapData}
        userStats={{ totalMastery: 0.5 }}
        onNavigateToDrill={() => {}}
      />
    )

    expect(screen.getByText(/Mejorar dominio en imperative-impAff/)).toBeInTheDocument()
    expect(screen.getByText(/Repasar indicative-pres/)).toBeInTheDocument()
    expect(screen.getByText(/Aprender indicative-pretIndef/)).toBeInTheDocument()
    expect(screen.queryByText(/nonfinite-ger/)).not.toBeInTheDocument()
  })
})
