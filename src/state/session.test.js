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

describe('session game modes', () => {
  beforeEach(() => {
    useSessionStore.getState().resetSessionState()
  })

  it('starts with every game mode off', () => {
    const state = useSessionStore.getState()
    expect(state.resistanceActive).toBe(false)
    expect(state.reverseActive).toBe(false)
    expect(state.doubleActive).toBe(false)
    expect(state.resistanceMsLeft).toBe(0)
    expect(state.resistanceStartTs).toBeNull()
  })

  it('keeps reverse and double mutually exclusive', () => {
    useSessionStore.getState().setGameMode({ reverseActive: true })
    expect(useSessionStore.getState().reverseActive).toBe(true)
    expect(useSessionStore.getState().doubleActive).toBe(false)

    useSessionStore.getState().setGameMode({ doubleActive: true })
    expect(useSessionStore.getState().doubleActive).toBe(true)
    expect(useSessionStore.getState().reverseActive).toBe(false)
  })

  it('clears the resistance countdown when the mode is turned off', () => {
    useSessionStore.getState().setGameMode({
      resistanceActive: true,
      resistanceMsLeft: 20000,
      resistanceStartTs: 1700000000000
    })

    useSessionStore.getState().setGameMode({ resistanceActive: false })

    const state = useSessionStore.getState()
    expect(state.resistanceActive).toBe(false)
    expect(state.resistanceMsLeft).toBe(0)
    expect(state.resistanceStartTs).toBeNull()
  })

  it('ignores keys that are not part of the game slice', () => {
    useSessionStore.getState().setGameMode({ level: 'C2', doubleActive: true })

    const state = useSessionStore.getState()
    expect(state.doubleActive).toBe(true)
    expect(state.level).toBeUndefined()
  })

  it('clearGameSession resets the game slice but keeps the drill runtime context', () => {
    useSessionStore.getState().setDrillRuntimeContext({ reviewSessionType: 'specific' })
    useSessionStore.getState().setGameMode({
      resistanceActive: true,
      resistanceMsLeft: 20000,
      conmutacionIdx: 2,
      nextSecondPerson: '2s_tu'
    })

    useSessionStore.getState().clearGameSession()

    const state = useSessionStore.getState()
    expect(state.resistanceActive).toBe(false)
    expect(state.resistanceMsLeft).toBe(0)
    expect(state.conmutacionIdx).toBe(0)
    expect(state.nextSecondPerson).toBe('2s_vos')
    expect(state.runtimeReviewSessionType).toBe('specific')
  })

  it('exposes the game slice to the generator through getRuntimeDrillSettings', () => {
    useSessionStore.getState().setGameMode({ doubleActive: true, conmutacionIdx: 3 })

    const merged = getRuntimeDrillSettings({ level: 'B1' })

    expect(merged.level).toBe('B1')
    expect(merged.doubleActive).toBe(true)
    expect(merged.reverseActive).toBe(false)
    expect(merged.conmutacionIdx).toBe(3)
    expect(merged.nextSecondPerson).toBe('2s_vos')
  })
})
