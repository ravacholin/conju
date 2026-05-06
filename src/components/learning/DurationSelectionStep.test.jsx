import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import DurationSelectionStep from './DurationSelectionStep.jsx'

describe('DurationSelectionStep', () => {
  const durationOptions = [
    { minutes: 10, label: '10 minutos', description: 'Sesión rápida', title: 'Sesión rápida' },
    { minutes: 25, label: '25 minutos', description: 'Sesión estándar', title: 'Sesión estándar' }
  ]

  const defaultProps = {
    selectedDuration: null,
    onSelectDuration: vi.fn(),
    onStart: vi.fn(),
    onBack: vi.fn(),
    onHome: vi.fn(),
    durationOptions
  }

  it('renders duration options', () => {
    render(<DurationSelectionStep {...defaultProps} />)

    expect(screen.getByRole('button', { name: '10 minutos' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '25 minutos' })).toBeInTheDocument()
  })

  it('calls onSelectDuration when a duration option is clicked', () => {
    const handleSelect = vi.fn()
    render(<DurationSelectionStep {...defaultProps} onSelectDuration={handleSelect} />)

    fireEvent.click(screen.getByRole('button', { name: '10 minutos' }))

    expect(handleSelect).toHaveBeenCalledTimes(1)
    expect(handleSelect).toHaveBeenCalledWith(10)
  })

  it('triggers onStart when clicking the already-selected option', () => {
    const handleStart = vi.fn()
    render(
      <DurationSelectionStep
        {...defaultProps}
        selectedDuration={25}
        onStart={handleStart}
      />
    )

    // Second click on the already-selected option confirms and triggers start
    fireEvent.click(screen.getByRole('button', { name: '25 minutos' }))

    expect(handleStart).toHaveBeenCalledTimes(1)
  })
})
