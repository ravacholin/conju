import { describe, it, expect, beforeEach, vi } from 'vitest'

const mockLogger = () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() })

describe('userSettingsStore', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    window.localStorage.clear()
  })

  it('persists user settings updates in localStorage', async () => {
    vi.doMock('./index.js', () => ({
      getCurrentUserId: vi.fn(() => 'user-123')
    }))
    vi.doMock('./safeLogger.js', () => ({
      createSafeLogger: () => mockLogger()
    }))

    const { updateUserSettings, getUserSettings } = await import('./userSettingsStore.js')

    updateUserSettings('user-123', { weeklyGoals: { CELLS_TO_IMPROVE: 5 } })

    const stored = JSON.parse(window.localStorage.getItem('progress-user-settings'))
    expect(stored['user-123'].weeklyGoals.CELLS_TO_IMPROVE).toBe(5)

    const settings = getUserSettings('user-123')
    expect(settings.weeklyGoals.CELLS_TO_IMPROVE).toBe(5)
  })

  it('increments session count and updates timestamp', async () => {
    vi.doMock('./index.js', () => ({
      getCurrentUserId: vi.fn(() => null)
    }))
    vi.doMock('./safeLogger.js', () => ({
      createSafeLogger: () => mockLogger()
    }))

    const { incrementSessionCount, getUserSettings } = await import('./userSettingsStore.js')

    const firstId = getUserSettings('local-user').totalSessions
    expect(firstId).toBe(0)

    incrementSessionCount('local-user')

    const updated = getUserSettings('local-user')
    expect(updated.totalSessions).toBe(1)
    expect(new Date(updated.lastActiveAt).getTime()).toBeGreaterThan(0)
  })

  it('creates and reuses persistent user ids when none exist', async () => {
    vi.doMock('./index.js', () => ({
      getCurrentUserId: vi.fn(() => null)
    }))
    vi.doMock('./safeLogger.js', () => ({
      createSafeLogger: () => mockLogger()
    }))

    const module = await import('./userSettingsStore.js')

    const firstId = module.getCurrentUserId()
    const secondId = module.getCurrentUserId()

    expect(firstId).toEqual(secondId)
    expect(firstId).toMatch(/^user-/)
  })
})

