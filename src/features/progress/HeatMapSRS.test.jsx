import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'

const { getHeatMapDataMock } = vi.hoisted(() => ({
  getHeatMapDataMock: vi.fn()
}))

vi.mock('../../state/settings.js', () => ({
  useSettings: () => ({
    set: vi.fn()
  })
}))

vi.mock('../../lib/progress/utils.js', () => ({
  formatPercentage: (value) => `${Math.round((value ?? 0) * 100)}%`
}))

vi.mock('../../lib/progress/analytics.js', () => ({
  getHeatMapData: getHeatMapDataMock
}))

vi.mock('../../hooks/useSRSQueue.js', () => ({
  useSRSQueue: () => ({
    queue: [],
    stats: { dueNow: 0, dueToday: 0, total: 0 }
  })
}))

vi.mock('../../lib/progress/userManager/index.js', () => ({
  getCurrentUserId: () => 'user-123'
}))

vi.mock('./heatMapConfig.js', () => ({
  HEATMAP_MOOD_CONFIG: {
    indicativo: {
      label: 'Indicativo',
      icon: '/icons/indicativo.png',
      tenses: [
        { key: 'presente', label: 'Presente' }
      ]
    }
  }
}))

import HeatMapSRS from './HeatMapSRS.jsx'

describe('HeatMapSRS', () => {
  beforeEach(() => {
    getHeatMapDataMock.mockClear()
  })

  it('no realiza un fetch adicional cuando recibe datos iniciales válidos', async () => {
    const sampleData = {
      range: 'all',
      heatMap: {
        'indicativo-presente': {
          mastery: 0.72,
          attempts: 5,
          lastAttempt: 1700000000000
        }
      },
      updatedAt: 1700000000000
    }

    render(<HeatMapSRS data={sampleData} onNavigateToDrill={vi.fn()} />)

    expect(await screen.findByText('Presente')).toBeInTheDocument()

    await waitFor(() => {
      expect(getHeatMapDataMock).not.toHaveBeenCalled()
    })
  })
})

