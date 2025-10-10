import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
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

  it('uses readable tense labels without triggering warnings', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    try {
      render(
        <ReverseInputs
          currentItem={baseItem}
          inSpecific={false}
          showAccentKeys={false}
          onSubmit={() => {}}
          onContinue={() => {}}
          result={null}
        />
      )

      fireEvent.change(screen.getByPlaceholderText(/infinitivo/i), {
        target: { value: 'hablar' }
      })

      const personSelect = screen.getAllByRole('combobox')[0]
      fireEvent.change(personSelect, { target: { value: '1s' } })

      const moodSelect = screen.getAllByRole('combobox')[1]
      fireEvent.change(moodSelect, { target: { value: 'indicative' } })

      const tenseSelect = screen.getAllByRole('combobox')[2]
      const tenseOptions = within(tenseSelect).getAllByRole('option')
      const readableOptions = tenseOptions.filter((option) => option.value)

      expect(readableOptions.length).toBeGreaterThan(0)
      readableOptions.forEach((option) => {
        expect(option.textContent).toBeTruthy()
        expect(option.textContent?.startsWith('[')).toBe(false)
      })

      expect(warnSpy).not.toHaveBeenCalled()
    } finally {
      warnSpy.mockRestore()
    }
  })
})
