import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import SessionInsights from './SessionInsights.jsx'
import { getCurrentUserId } from '../../lib/progress/userManager/index.js'
import { getRealUserStats } from '../../lib/progress/realTimeAnalytics.js'

vi.mock('../../lib/progress/userManager/index.js', () => ({
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

beforeEach(() => {
  vi.clearAllMocks()
  getCurrentUserId.mockReturnValue(null)
  getRealUserStats.mockResolvedValue({
    totalAttempts: 0,
    currentSessionStreak: 0,
    accuracy: 0,
    totalMastery: 0
  })
})

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

describe('SessionInsights - progress updates', () => {
  it('refreshes insights when receiving progress:dataUpdated events', async () => {
    getCurrentUserId.mockReturnValue('user-42')
    getRealUserStats
      .mockResolvedValueOnce({
        totalAttempts: 12,
        currentSessionStreak: 3,
        accuracy: 90,
        totalMastery: 55
      })
      .mockResolvedValueOnce({
        totalAttempts: 24,
        currentSessionStreak: 6,
        accuracy: 96,
        totalMastery: 68
      })

    render(<SessionInsights />)

    expect(await screen.findByText('3')).toBeInTheDocument()
    expect(screen.getByText('55%')).toBeInTheDocument()

    act(() => {
      window.dispatchEvent(
        new CustomEvent('progress:dataUpdated', {
          detail: { userId: 'user-42', source: 'test' }
        })
      )
    })

    await waitFor(() => {
      expect(screen.getByText('6')).toBeInTheDocument()
    })
    expect(screen.getByText('68%')).toBeInTheDocument()
  })
})
