import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'

// These tests ensure the auth service can be imported in environments without DOM globals

describe('authService SSR safety', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.stubGlobal('window', undefined)
    vi.stubGlobal('document', undefined)
    vi.stubGlobal('localStorage', undefined)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  it('imports without throwing when DOM globals are missing', async () => {
    await expect(import('./authService.js')).resolves.toHaveProperty('authService')
  })

  it('returns false when initializing Google auth without DOM', async () => {
    const module = await import('./authService.js')
    await expect(module.authService.initializeGoogleAuth()).resolves.toBe(false)
  })
})
