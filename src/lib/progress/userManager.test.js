import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const originalFetch = global.fetch

describe('wakeUpServer URL handling', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    if (originalFetch) {
      global.fetch = originalFetch
    } else {
      delete global.fetch
    }
  })

  it('removes the trailing /api while preserving nested segments', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, statusText: 'OK' })
    global.fetch = fetchMock

    const { setSyncEndpoint, __testing } = await import('./userManager.js')

    setSyncEndpoint('https://example.com/foo/bar/api')

    await __testing.wakeUpServer()

    expect(fetchMock).toHaveBeenCalledWith('https://example.com/foo/bar', expect.objectContaining({
      method: 'GET'
    }))
  })

  it('removes a terminal /api segment for root endpoints', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, statusText: 'OK' })
    global.fetch = fetchMock

    const { setSyncEndpoint, __testing } = await import('./userManager.js')

    setSyncEndpoint('https://example.com/api')

    await __testing.wakeUpServer()

    expect(fetchMock).toHaveBeenCalledWith('https://example.com', expect.objectContaining({
      method: 'GET'
    }))
  })

  it('warns users when the wake-up endpoint returns 404', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 404, statusText: 'Not Found' })
    global.fetch = fetchMock

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    const { setSyncEndpoint, __testing } = await import('./userManager.js')

    setSyncEndpoint('https://example.com/api')

    const result = await __testing.wakeUpServer()

    expect(result).toBe(false)

    const warningCalls = warnSpy.mock.calls
    const warningPayload = warningCalls.find((call) =>
      call.some((arg) => typeof arg === 'string' && arg.includes('404'))
    )
    expect(warningPayload).toBeTruthy()

    const successLogs = logSpy.mock.calls
      .flat()
      .filter((arg) => typeof arg === 'string' && arg.includes('✅ Servidor despierto'))
    expect(successLogs.length).toBe(0)
  })
})
