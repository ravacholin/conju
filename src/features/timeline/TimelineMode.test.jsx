import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import TimelineMode from './TimelineMode.jsx'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('TimelineMode', () => {
  it('muestra eventos y verbos para el tiempo seleccionado', async () => {
    render(<TimelineMode />)

    await screen.findByText('Modo línea de tiempo')

    // Pretérito indefinido debería estar disponible por defecto
    expect(screen.getByRole('heading', { name: 'El día de ayer de María' })).toBeInTheDocument()
    expect(screen.getByText(/tomar café/i)).toBeInTheDocument()
    expect(screen.getAllByText(/Verbos requeridos/i).length).toBeGreaterThan(0)
  })

  it('procesa la respuesta y muestra feedback del ejercicio', async () => {
    render(<TimelineMode />)

    await screen.findByText('Modo línea de tiempo')
    await screen.findByRole('heading', { name: 'El día de ayer de María' })

    const textarea = screen.getByLabelText('Tu respuesta')

    const response =
      'Ayer María tomó café temprano, comió con sus amigos, luego fue al gimnasio y finalmente se acostó feliz.'

    fireEvent.change(textarea, { target: { value: response } })

    const submitButton = screen.getByRole('button', { name: 'Enviar respuesta' })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/Verbos encontrados/i)).toBeInTheDocument()
      expect(screen.getByText(/No faltan verbos por usar/i)).toBeInTheDocument()
    })
  })
})
