import { beforeEach, describe, expect, it } from 'vitest'
import { getRuntimeDrillSettings, useSessionStore } from './session.js'

describe('session runtime drill context', () => {
  beforeEach(() => {
    useSessionStore.getState().resetSessionState()
  })

  it('merges runtime overrides on top of base settings', () => {
    useSessionStore.getState().setDrillRuntimeContext({
      currentBlock: { combos: [{ mood: 'indicative', tense: 'pres' }], itemsRemaining: 5 },
      reviewSessionType: 'specific',
      reviewSessionFilter: { mood: 'indicative', tense: 'pres' }
    })

    const merged = getRuntimeDrillSettings({
      practiceMode: 'review',
      reviewSessionType: 'due',
      reviewSessionFilter: {}
    })

    expect(merged.currentBlock).toEqual({ combos: [{ mood: 'indicative', tense: 'pres' }], itemsRemaining: 5 })
    expect(merged.reviewSessionType).toBe('specific')
    expect(merged.reviewSessionFilter).toEqual({ mood: 'indicative', tense: 'pres' })
  })

  it('falls back to base settings when runtime context is empty', () => {
    const merged = getRuntimeDrillSettings({
      currentBlock: null,
      reviewSessionType: 'due',
      reviewSessionFilter: { urgency: 'all' }
    })

    expect(merged.currentBlock).toBeNull()
    expect(merged.reviewSessionType).toBe('due')
    expect(merged.reviewSessionFilter).toEqual({ urgency: 'all' })
  })
})
