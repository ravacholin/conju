import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import HeatMapSRS from './HeatMapSRS.jsx'

vi.mock('../../state/settings.js', () => ({
  useSettings: () => ({
    set: vi.fn()
  })
}))

vi.mock('../../hooks/useSRSQueue.js', () => ({
  useSRSQueue: () => ({
    queue: [],
    stats: { dueNow: 0, dueToday: 0, total: 0 }
  })
}))

vi.mock('../../lib/progress/utils.js', () => ({
  formatPercentage: value => `${Math.round((value ?? 0) * 100)}%`
}))

describe('HeatMapSRS time range selector accessibility', () => {
  it('updates aria-pressed when toggled via keyboard interaction', async () => {
    const user = userEvent.setup()

    render(
      <HeatMapSRS
        data={{
          heatMap: {}
        }}
      />
    )

    const toolbar = screen.getByRole('toolbar', {
      name: 'Seleccionar rango temporal'
    })
    const buttons = within(toolbar).getAllByRole('button')

    expect(buttons[0]).toHaveAttribute('aria-pressed', 'true')
    expect(buttons[1]).toHaveAttribute('aria-pressed', 'false')

    await user.tab()
    await user.tab()
    await user.keyboard('[Space]')

    expect(buttons[0]).toHaveAttribute('aria-pressed', 'false')
    expect(buttons[1]).toHaveAttribute('aria-pressed', 'true')
  })
})
