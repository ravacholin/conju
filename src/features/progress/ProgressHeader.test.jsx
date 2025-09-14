import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import ProgressHeader from './ProgressHeader.jsx'

describe('ProgressHeader', () => {
  it('renders and triggers refresh when clicked', () => {
    const onRefresh = vi.fn()
    render(
      <ProgressHeader
        onNavigateHome={undefined}
        onNavigateToDrill={undefined}
        loading={false}
        refreshing={false}
        onRefresh={onRefresh}
      />
    )
    const btn = screen.getByRole('button', { name: /Refrescar/i })
    fireEvent.click(btn)
    expect(onRefresh).toHaveBeenCalledTimes(1)
  })

  it('shows updating labels when refreshing', () => {
    render(
      <ProgressHeader
        onNavigateHome={undefined}
        onNavigateToDrill={undefined}
        loading={false}
        refreshing={true}
        onRefresh={() => {}}
      />
    )
    // Button label switches to "Actualizando..."
    expect(screen.getByRole('button', { name: /Actualizando/i })).toBeInTheDocument()
    // Indicator appears with extra message
    expect(screen.getByText(/Actualizando métricas/i)).toBeInTheDocument()
  })
})
