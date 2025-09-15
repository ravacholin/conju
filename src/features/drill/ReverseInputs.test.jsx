import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ReverseInputs from './ReverseInputs.jsx'

describe('ReverseInputs', () => {
  const baseItem = {
    id: '1',
    lemma: 'hablar',
    mood: 'indicative',
    tense: 'pres',
    person: '1s',
    value: 'hablo',
    form: { value: 'hablo' }
  }

  it('renders and submits a valid reverse answer', () => {
    const onSubmit = vi.fn()
    render(
      <ReverseInputs
        currentItem={baseItem}
        inSpecific={false}
        showAccentKeys={false}
        onSubmit={onSubmit}
        onContinue={() => {}}
        result={null}
      />
    )

    // Fill in fields
    fireEvent.change(screen.getByPlaceholderText(/infinitivo/i), {
      target: { value: 'hablar' }
    })
    const selects = screen.getAllByRole('combobox')
    // Persona
    fireEvent.change(selects[0], { target: { value: '1s' } })
    // Modo
    fireEvent.change(selects[1], { target: { value: 'indicative' } })
    // Tiempo (re-query after enabling)
    const tenseSelect = screen.getAllByRole('combobox')[2]
    fireEvent.change(tenseSelect, { target: { value: 'pres' } })

    // Submit
    // Enable button after all fields set
    const btn = screen.getByRole('button', { name: /verificar/i })
    expect(btn).not.toBeDisabled()
    fireEvent.click(btn)
    expect(onSubmit).toHaveBeenCalled()
  })
})
