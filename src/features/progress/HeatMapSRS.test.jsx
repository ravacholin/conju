import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'

const { getHeatMapDataMock, setSettingsMock } = vi.hoisted(() => ({
  getHeatMapDataMock: vi.fn(),
  setSettingsMock: vi.fn()
}))

vi.mock('../../state/settings.js', () => ({
  useSettings: () => ({
    set: setSettingsMock
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
    setSettingsMock.mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
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

  it('permite activar práctica específica con teclado en una celda', async () => {
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
    const onNavigateToDrill = vi.fn()

    render(<HeatMapSRS data={sampleData} onNavigateToDrill={onNavigateToDrill} />)

    const targetCell = await screen.findByRole('button', { name: /Practicar Indicativo Presente/i })
    vi.useFakeTimers()
    fireEvent.keyDown(targetCell, { key: 'Enter' })

    expect(setSettingsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        practiceMode: 'specific',
        specificMood: 'indicativo',
        specificTense: 'presente',
        reviewSessionType: 'due',
        reviewSessionFilter: {}
      })
    )

    vi.advanceTimersByTime(160)
    expect(onNavigateToDrill).toHaveBeenCalledTimes(1)
  })

  it('colapsa navegaciones rápidas repetidas en una sola', async () => {
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
    const onNavigateToDrill = vi.fn()

    render(<HeatMapSRS data={sampleData} onNavigateToDrill={onNavigateToDrill} />)
    const targetCell = await screen.findByRole('button', { name: /Practicar Indicativo Presente/i })
    vi.useFakeTimers()

    fireEvent.click(targetCell)
    fireEvent.click(targetCell)
    fireEvent.click(targetCell)

    vi.advanceTimersByTime(160)
    expect(onNavigateToDrill).toHaveBeenCalledTimes(1)
  })
})
