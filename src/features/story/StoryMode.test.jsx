import React from 'react'
import { describe, expect, it, afterEach, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import StoryMode from './StoryMode.jsx'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('StoryMode', () => {
  it('filtra historias por tiempo verbal seleccionado', async () => {
    render(<StoryMode />)

    await screen.findByText('Modo historias')

    const tenseSelect = screen.getByLabelText('Selecciona el tiempo verbal')
    fireEvent.change(tenseSelect, { target: { value: 'fut' } })

    await waitFor(() => {
      expect(screen.getByLabelText('Selecciona la historia').value).toBe('story_futuro_ideal')
    })

    expect(screen.getByRole('option', { name: 'Mi futuro ideal' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Un viaje de vacaciones' })).not.toBeInTheDocument()
  })

  it('procesa la historia y muestra feedback del generador', async () => {
    render(<StoryMode />)

    await screen.findByText('Modo historias')
    await screen.findByRole('heading', { name: 'Un viaje de vacaciones' })

    const textarea = screen.getByLabelText('Tu historia')

    const storyText = `María y Carlos viajaron juntos a una playa tropical para perderse en la ciudad. ` +
      `Antes de llegar al hotel antiguo, prepararon una cámara fotográfica brillante. ` +
      `María contó cómo descubrieron nuevos lugares, conocieron gente y fotografiaron cada momento. ` +
      `Aunque la aventura fue corta, describieron lo que exploraron y hablaron durante horas sobre los detalles.`

    fireEvent.change(textarea, { target: { value: storyText } })

    const submitButton = screen.getByRole('button', { name: 'Enviar historia' })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/Tu historia necesita aproximadamente/i)).toBeInTheDocument()
    })
  })
})
