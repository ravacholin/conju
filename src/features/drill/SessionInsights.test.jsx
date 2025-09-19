import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SessionInsights from './SessionInsights.jsx'

vi.mock('../../lib/progress/userManager.js', () => ({
  getCurrentUserId: vi.fn(() => null)
}))

vi.mock('../../lib/progress/realTimeAnalytics.js', () => ({
  getRealUserStats: vi.fn(async () => ({
    totalAttempts: 0,
    currentSessionStreak: 0,
    accuracy: 0,
    totalMastery: 0
  }))
}))

vi.mock('../../lib/progress/index.js', () => ({
  initProgressSystem: vi.fn(async () => 'user-registered-1')
}))

describe('SessionInsights - missing userId handling', () => {
  it('shows a notice and a registration button when userId is absent, and displays a toast after registering', async () => {
    render(<SessionInsights />)

    const notice = await screen.findByText(/No se encontró un perfil de usuario/i)
    expect(notice).toBeInTheDocument()

    const btn = screen.getByRole('button', { name: /Crear perfil local/i })
    expect(btn).toBeInTheDocument()

    // Simulate click and expect toast to appear
    fireEvent.click(btn)
    const toast = await screen.findByText(/Perfil creado, cargando métricas/i)
    expect(toast).toBeInTheDocument()
  })
})
