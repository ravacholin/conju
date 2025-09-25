import { beforeEach, describe, expect, it } from 'vitest'
import { getExpertModeSettings, setExpertModeSettings, getActiveSRSConfig, getActiveSRSIntervals, resetExpertMode } from './expertMode.js'
import { PROGRESS_CONFIG } from './config.js'
import { setCurrentUserId } from './index.js'

const TEST_USER = 'expert-test-user'

describe('expertMode utilities', () => {
  beforeEach(() => {
    if (typeof window !== 'undefined') {
      window.localStorage?.clear()
    }
    setCurrentUserId(TEST_USER)
    resetExpertMode(TEST_USER)
  })

  it('returns default settings when no overrides exist', () => {
    const settings = getExpertModeSettings(TEST_USER)
    expect(settings.enabled).toBe(PROGRESS_CONFIG.EXPERT_MODE.DEFAULT_ENABLED)
    expect(settings.overrides.srs.EASE_START).toBe(PROGRESS_CONFIG.EXPERT_MODE.SRS.EASE_START)
  })

  it('applies custom overrides to active SRS config', () => {
    setExpertModeSettings(TEST_USER, {
      enabled: true,
      overrides: {
        srs: { EASE_START: 2.95, FUZZ_RATIO: 0.05 },
        customIntervals: [1, 2, 3, 5, 9]
      }
    })

    const config = getActiveSRSConfig(TEST_USER)
    expect(config.EASE_START).toBe(2.95)
    expect(config.FUZZ_RATIO).toBe(0.05)

    const intervals = getActiveSRSIntervals(TEST_USER)
    expect(intervals).toEqual([1, 2, 3, 5, 9])
  })
})
