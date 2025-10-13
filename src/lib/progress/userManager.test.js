import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

function setupLoggerMock() {
  const loggerSpies = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    perf: {
      start: vi.fn(),
      end: vi.fn(),
      measure: vi.fn()
    }
  }

  vi.doMock('../utils/logger.js', () => ({
    createLogger: vi.fn(() => loggerSpies),
    logger: loggerSpies,
    LOG_LEVELS: { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3, NONE: 4 },
    registerDebugTool: vi.fn(),
    setLogLevel: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }))

  return loggerSpies
}

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

    setupLoggerMock()

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

    setupLoggerMock()

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
    const loggerSpies = setupLoggerMock()

    const { setSyncEndpoint, __testing } = await import('./userManager.js')

    setSyncEndpoint('https://example.com/api')

    const result = await __testing.wakeUpServer()

    expect(result).toBe(false)

    const warnCall = loggerSpies.warn.mock.calls.find(([message]) =>
      message === 'wakeUpServer: el servidor de sincronización respondió 404'
    )

    expect(warnCall).toBeDefined()
    expect(warnCall?.[1]).toEqual(expect.objectContaining({ status: 404 }))
    expect(warnCall?.[1]).not.toHaveProperty('token')

    expect(loggerSpies.warn).toHaveBeenCalledWith(
      'wakeUpServer: el servidor de sincronización respondió 404',
      expect.objectContaining({ status: 404 })
    )

    const wakeUpSuccessLog = loggerSpies.info.mock.calls.find(([message]) =>
      message === 'wakeUpServer: servidor responde OK'
    )
    expect(wakeUpSuccessLog).toBeUndefined()
  })
})

describe('mergeAccountDataLocally safeguards', () => {
  const originalDispatch = window.dispatchEvent

  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  afterEach(() => {
    window.dispatchEvent = originalDispatch
  })

  it('aborts merge when only a temporary user id is available', async () => {
    const saveAttempt = vi.fn()
    const saveMastery = vi.fn()
    const saveSchedule = vi.fn()
    const saveLearningSession = vi.fn()
    const updateLearningSession = vi.fn()
    const updateInDB = vi.fn()
    const getAllFromDB = vi.fn().mockResolvedValue([])

    const mockAuthService = {
      getUser: vi.fn(() => null),
      getToken: vi.fn(() => null),
      isLoggedIn: vi.fn(() => true),
      clearAuth: vi.fn()
    }

    vi.doMock('./index.js', () => ({
      getCurrentUserId: vi.fn(() => 'user-temp-12345')
    }))

    vi.doMock('./database.js', () => ({
      getAttemptsByUser: vi.fn(),
      getMasteryByUser: vi.fn(),
      updateInDB,
      getFromDB: vi.fn(),
      getAllFromDB,
      initDB: vi.fn(),
      saveAttempt,
      saveMastery,
      saveSchedule,
      saveLearningSession,
      updateLearningSession,
      getLearningSessionsByUser: vi.fn()
    }))

    vi.doMock('../auth/authService.js', () => ({
      default: mockAuthService
    }))

    const dispatchSpy = vi.fn()
    window.dispatchEvent = dispatchSpy

    const loggerSpies = setupLoggerMock()

    const module = await import('./userManager.js')

    const mergeResult = await module.__testing.mergeAccountDataLocally({
      attempts: [
        {
          id: 'remote-attempt-1',
          verbId: 'hablar',
          mood: 'indicative',
          tense: 'present',
          person: 'yo',
          createdAt: new Date().toISOString()
        }
      ]
    })

    expect(mergeResult).toMatchObject({
      aborted: true,
      reason: 'missing_user_id',
      userId: null
    })

    expect(saveAttempt).not.toHaveBeenCalled()
    expect(saveMastery).not.toHaveBeenCalled()
    expect(saveSchedule).not.toHaveBeenCalled()
    expect(saveLearningSession).not.toHaveBeenCalled()
    expect(updateLearningSession).not.toHaveBeenCalled()
    expect(updateInDB).not.toHaveBeenCalled()

    const dispatchedEvent = dispatchSpy.mock.calls.find(([event]) => event?.type === 'progress:syncError')
    expect(dispatchedEvent).toBeDefined()
    expect(dispatchedEvent[0].detail.reason).toBe('missing_user_id')

    const abortWarn = loggerSpies.warn.mock.calls.find(([message]) =>
      message === 'mergeAccountDataLocally: abortado por falta de userId confiable'
    )

    expect(abortWarn).toBeDefined()
    expect(abortWarn?.[1]).toEqual(
      expect.objectContaining({ attemptedSources: expect.any(Object) })
    )
    expect(abortWarn?.[1]).not.toEqual(expect.objectContaining({ attemptedSources: 'user-temp-12345' }))

    expect(loggerSpies.warn).toHaveBeenCalledWith(
      'mergeAccountDataLocally: abortado por falta de userId confiable',
      expect.objectContaining({ attemptedSources: expect.any(Object) })
    )
  })
})
