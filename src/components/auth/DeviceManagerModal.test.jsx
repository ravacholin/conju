import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'

const mockAuthService = vi.hoisted(() => ({
  listDevices: vi.fn(),
  renameDevice: vi.fn(),
  revokeDevice: vi.fn()
}))

vi.mock('../../lib/auth/authService.js', () => ({
  __esModule: true,
  default: mockAuthService
}))

import DeviceManagerModal from './DeviceManagerModal.jsx'

describe('DeviceManagerModal', () => {
  const originalConfirm = window.confirm

  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthService.listDevices.mockResolvedValue([
      { id: 'dev-1', device_name: 'Laptop', last_seen_at: Date.now(), created_at: Date.now() },
      { id: 'dev-2', device_name: 'Tablet', last_seen_at: Date.now(), created_at: Date.now() }
    ])
    window.confirm = vi.fn(() => true)
  })

  afterEach(() => {
    window.confirm = originalConfirm
  })

  it('renders device list when open', async () => {
    render(<DeviceManagerModal isOpen={true} onClose={() => {}} currentDeviceId="dev-1" />)

    await waitFor(() => expect(mockAuthService.listDevices).toHaveBeenCalled())
    expect(await screen.findByText('Laptop')).toBeInTheDocument()
    expect(screen.getByText('Tablet')).toBeInTheDocument()
  })

  it('renames a device', async () => {
    mockAuthService.renameDevice.mockResolvedValue([])

    render(<DeviceManagerModal isOpen={true} onClose={() => {}} currentDeviceId="dev-1" />)

    await screen.findByText('Laptop')
    const renameButtons = screen.getAllByRole('button', { name: /Cambiar nombre/i })
    fireEvent.click(renameButtons[0])
    const input = screen.getByPlaceholderText('Nombre del dispositivo')
    fireEvent.change(input, { target: { value: 'Laptop Principal' } })
    fireEvent.click(screen.getByRole('button', { name: /Guardar/i }))

    await waitFor(() => expect(mockAuthService.renameDevice).toHaveBeenCalledWith('dev-1', 'Laptop Principal'))
  })

  it('revokes a device after confirmation', async () => {
    mockAuthService.revokeDevice.mockResolvedValue([])

    render(<DeviceManagerModal isOpen={true} onClose={() => {}} currentDeviceId="dev-1" />)

    await screen.findByText('Laptop')
    const revokeButtons = screen.getAllByRole('button', { name: /Revocar acceso/i })
    fireEvent.click(revokeButtons[1])

    await waitFor(() => expect(mockAuthService.revokeDevice).toHaveBeenCalledWith('dev-2'))
  })
})
