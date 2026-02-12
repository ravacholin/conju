import { beforeEach, describe, expect, it, vi } from 'vitest'
import { resetSettingsForTests, useSettings } from './settings.js'

describe('useSettings runtime guards', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    resetSettingsForTests()
    vi.restoreAllMocks()
  })

  it('ignores unknown keys in object updates', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    useSettings.getState().set({
      level: 'B1',
      unknownTransientKey: 'should-not-persist'
    })

    const state = useSettings.getState()
    expect(state.level).toBe('B1')
    expect(state.unknownTransientKey).toBeUndefined()

    if (import.meta.env?.DEV) {
      expect(warnSpy).toHaveBeenCalled()
    }
  })

  it('keeps store methods available after guarded updates', () => {
    useSettings.getState().set({
      specificMood: 'indicative',
      debugOnlyFlag: 'x'
    })

    const current = useSettings.getState()
    expect(typeof current.toggleVoseo).toBe('function')
    expect(current.specificMood).toBe('indicative')
    expect(current.debugOnlyFlag).toBeUndefined()
  })
})
