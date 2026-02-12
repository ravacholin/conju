import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { vi, describe, it, beforeEach, afterEach } from 'vitest'
import { __resetSmartPracticeRecommendationCache } from './smartPracticeMlCache.js'

const setSettingsMock = vi.fn()

vi.mock('../../state/settings.js', () => ({
  useSettings: () => ({
    set: setSettingsMock,
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
import { mlRecommendationEngine } from '../../lib/progress/mlRecommendations.js'

describe('SmartPractice recommendations', () => {
  beforeEach(() => {
    setSettingsMock.mockReset()
    __resetSmartPracticeRecommendationCache()
    mlRecommendationEngine.generateSessionRecommendations.mockClear()
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

  it('supports keyboard activation for recommendation cards', async () => {
    const onNavigateToDrill = vi.fn()

    render(
      <SmartPractice
        heatMapData={null}
        userStats={{ totalMastery: 0.2 }}
        onNavigateToDrill={onNavigateToDrill}
      />
    )

    const card = await screen.findByRole('button', { name: /Comenzar a practicar/i })
    fireEvent.keyDown(card, { key: 'Enter' })

    expect(setSettingsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        practiceMode: 'mixed',
        specificMood: null,
        specificTense: null,
        reviewSessionType: 'due',
        reviewSessionFilter: {}
      })
    )
    expect(onNavigateToDrill).toHaveBeenCalledTimes(1)
  })

  it('reuses cached ML recommendation for equivalent user stats', async () => {
    const { rerender } = render(
      <SmartPractice
        heatMapData={null}
        userStats={{ totalAttempts: 10, totalMastery: 55, streakDays: 2 }}
        onNavigateToDrill={() => {}}
      />
    )

    await waitFor(() => {
      expect(mlRecommendationEngine.generateSessionRecommendations).toHaveBeenCalledTimes(1)
    })

    rerender(
      <SmartPractice
        heatMapData={null}
        userStats={{ totalAttempts: 10, totalMastery: 55, streakDays: 2 }}
        onNavigateToDrill={() => {}}
      />
    )

    await waitFor(() => {
      expect(mlRecommendationEngine.generateSessionRecommendations).toHaveBeenCalledTimes(1)
    })
  })
})
