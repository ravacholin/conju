import { describe, it, expect, beforeEach, vi } from 'vitest'

const managerSpies = {
  setSyncEndpoint: vi.fn(),
  getSyncEndpoint: vi.fn(() => 'https://api.example.com'),
  isSyncEnabled: vi.fn(() => true),
  isLocalSyncMode: vi.fn(() => false),
  setSyncAuthToken: vi.fn(),
  getSyncAuthToken: vi.fn(() => 'token'),
  clearSyncAuthToken: vi.fn(),
  setSyncAuthHeaderName: vi.fn(),
  getSyncAuthHeaderName: vi.fn(() => 'Authorization')
}

const serviceSpies = {
  isLoggedIn: vi.fn(() => true),
  getToken: vi.fn(() => 'abc123'),
  getUser: vi.fn(() => ({ id: 'user-1' })),
  getAccount: vi.fn(() => ({ id: 'account-1' })),
  clearAuth: vi.fn()
}

describe('authBridge', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()

    managerSpies.setSyncEndpoint.mockClear()
    serviceSpies.clearAuth.mockClear()

    vi.doMock('./AuthTokenManager.js', () => ({
      default: managerSpies
    }))

    vi.doMock('../auth/authService.js', () => ({
      default: serviceSpies
    }))
  })

  it('delegates sync endpoint operations to AuthTokenManager', async () => {
    const { setSyncEndpoint, getSyncEndpoint } = await import('./authBridge.js')

    setSyncEndpoint('https://new-endpoint.test')
    expect(managerSpies.setSyncEndpoint).toHaveBeenCalledWith('https://new-endpoint.test')
    expect(getSyncEndpoint()).toBe('https://api.example.com')
  })

  it('exposes authentication status and tokens', async () => {
    const {
      isAuthenticated,
      getAuthToken,
      getAuthenticatedUser,
      getAuthenticatedAccount,
      clearAuthState,
      getSyncAuthHeaderName
    } = await import('./authBridge.js')

    expect(isAuthenticated()).toBe(true)
    expect(getAuthToken()).toBe('abc123')
    expect(getAuthenticatedUser()).toEqual({ id: 'user-1' })
    expect(getAuthenticatedAccount()).toEqual({ id: 'account-1' })
    expect(getSyncAuthHeaderName()).toBe('Authorization')

    clearAuthState()
    expect(serviceSpies.clearAuth).toHaveBeenCalled()
  })
})

