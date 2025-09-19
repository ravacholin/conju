import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

const mockAuthService = vi.hoisted(() => ({
  getAccountInfo: vi.fn(),
  updateAccountProfile: vi.fn(),
  getAccount: vi.fn(() => ({ id: 'acc-1', email: 'user@example.com', name: 'Usuario' })),
  emitAccountUpdated: vi.fn()
}))

vi.mock('../../lib/auth/authService.js', () => ({
  __esModule: true,
  default: mockAuthService
}))

import authService from '../../lib/auth/authService.js'
import AccountManagementModal from './AccountManagementModal.jsx'

describe('AccountManagementModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authService.getAccountInfo.mockResolvedValue({
      account: { id: 'acc-1', email: 'user@example.com', name: 'Usuario' }
    })
  })

  it('loads account data when opened', async () => {
    render(<AccountManagementModal isOpen={true} onClose={() => {}} />)

    await waitFor(() => expect(screen.getByDisplayValue('user@example.com')).toBeInTheDocument())
    expect(screen.getByDisplayValue('Usuario')).toBeInTheDocument()
  })

  it('submits updated display name', async () => {
    authService.updateAccountProfile.mockResolvedValue({ id: 'acc-1', email: 'user@example.com', name: 'Nuevo Nombre' })

    render(<AccountManagementModal isOpen={true} onClose={() => {}} />)

    await waitFor(() => expect(screen.getByDisplayValue('Usuario')).toBeInTheDocument())

    fireEvent.change(screen.getByDisplayValue('Usuario'), { target: { value: 'Nuevo Nombre' } })
    fireEvent.click(screen.getByRole('button', { name: /Guardar cambios/i }))

    await waitFor(() => expect(authService.updateAccountProfile).toHaveBeenCalledWith({ name: 'Nuevo Nombre' }))
  })
})
