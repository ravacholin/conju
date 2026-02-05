import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

vi.mock('../../lib/core/verbDataService.js', () => ({
  getVerbForms: vi.fn().mockResolvedValue([])
}))

import TenseSelectionStep from './TenseSelectionStep.jsx'

describe('TenseSelectionStep', () => {
  const defaultProps = {
    availableTenses: {
      indicativo: ['pres']
    },
    onSelect: vi.fn(),
    onHome: vi.fn()
  }

  it('renders available tense options', async () => {
    render(<TenseSelectionStep {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('Presente')).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: 'Volver al menú' })).toBeInTheDocument()
  })

  it('calls onSelect when a tense is chosen', async () => {
    const onSelect = vi.fn()
    render(<TenseSelectionStep {...defaultProps} onSelect={onSelect} />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /seleccionar presente/i })).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /seleccionar presente/i }))

    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect).toHaveBeenCalledWith('indicativo', 'pres')
  })

  it('calls onHome when header logo is clicked', async () => {
    const onHome = vi.fn()
    render(<TenseSelectionStep {...defaultProps} onHome={onHome} />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Volver al menú' })).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: 'Volver al menú' }))

    expect(onHome).toHaveBeenCalledTimes(1)
  })
})
