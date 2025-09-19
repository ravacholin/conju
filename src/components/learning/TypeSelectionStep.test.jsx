import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TypeSelectionStep from './TypeSelectionStep.jsx'

describe('TypeSelectionStep', () => {
  const selectedTense = { mood: 'indicativo', tense: 'pres' }
  const availableFamilies = [
    { id: 'LEARNING_YO_G_PRESENT' },
    { id: 'LEARNING_DIPHTHONGS' },
    { id: 'LEARNING_VERY_IRREGULAR' }
  ]

  it('renders regular and irregular options for the selected tense', () => {
    render(
      <TypeSelectionStep
        selectedTense={selectedTense}
        availableFamilies={availableFamilies}
        onSelectType={vi.fn()}
        onBack={vi.fn()}
        onHome={vi.fn()}
      />
    )

    expect(screen.getByText(/Regulares/)).toBeInTheDocument()
    expect(screen.getByText('Irregulares en YO')).toBeInTheDocument()
  })

  it('calls onSelectType with "regular" when regular option is clicked', () => {
    const handleSelect = vi.fn()
    render(
      <TypeSelectionStep
        selectedTense={selectedTense}
        availableFamilies={availableFamilies}
        onSelectType={handleSelect}
        onBack={vi.fn()}
        onHome={vi.fn()}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /practicar verbos regulares/i }))

    expect(handleSelect).toHaveBeenCalledTimes(1)
    expect(handleSelect).toHaveBeenCalledWith('regular')
  })

  it('calls onSelectType with families when irregular option is clicked', () => {
    const handleSelect = vi.fn()
    render(
      <TypeSelectionStep
        selectedTense={selectedTense}
        availableFamilies={availableFamilies}
        onSelectType={handleSelect}
        onBack={vi.fn()}
        onHome={vi.fn()}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /practicar irregulares en yo/i }))

    expect(handleSelect).toHaveBeenCalledTimes(1)
    expect(handleSelect).toHaveBeenCalledWith('irregular', ['LEARNING_YO_G_PRESENT'])
  })
})
