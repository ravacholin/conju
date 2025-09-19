import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TenseSelectionStep from './TenseSelectionStep.jsx'

describe('TenseSelectionStep', () => {
  const defaultProps = {
    availableTenses: {
      indicativo: ['pres']
    },
    onSelect: vi.fn(),
    onHome: vi.fn()
  }

  it('renders available tense options', () => {
    render(<TenseSelectionStep {...defaultProps} />)

    expect(screen.getByText('Presente')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Volver al menú' })).toBeInTheDocument()
  })

  it('calls onSelect when a tense is chosen', () => {
    const onSelect = vi.fn()
    render(<TenseSelectionStep {...defaultProps} onSelect={onSelect} />)

    fireEvent.click(screen.getByRole('button', { name: /seleccionar presente/i }))

    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect).toHaveBeenCalledWith('indicativo', 'pres')
  })

  it('calls onHome when header logo is clicked', () => {
    const onHome = vi.fn()
    render(<TenseSelectionStep {...defaultProps} onHome={onHome} />)

    fireEvent.click(screen.getByRole('button', { name: 'Volver al menú' }))

    expect(onHome).toHaveBeenCalledTimes(1)
  })
})
