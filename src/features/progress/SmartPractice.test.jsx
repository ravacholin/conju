import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
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

vi.mock('../../lib/progress/mlRecommendations.js', () => ({
  mlRecommendationEngine: {
    generateSessionRecommendations: vi.fn().mockResolvedValue({ recommendations: [] })
  }
}))

import SmartPractice from './SmartPractice.jsx'

describe('SmartPractice recommendations', () => {
  beforeEach(() => {
    vi.spyOn(Date, 'now').mockReturnValue(new Date('2024-01-15T00:00:00Z').getTime())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('only references supported heatmap combinations', async () => {
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

    await waitFor(() => {
      expect(screen.getByText(/Mejorar dominio en imperative-impAff/)).toBeInTheDocument()
    })
    expect(screen.getByText(/Repasar indicative-pres/)).toBeInTheDocument()
    expect(screen.getByText(/Aprender indicative-pretIndef/)).toBeInTheDocument()
    expect(screen.queryByText(/nonfinite-ger/)).not.toBeInTheDocument()
  })
})
