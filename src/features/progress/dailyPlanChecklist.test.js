import { describe, expect, it, vi, beforeEach } from 'vitest'
import { readChecklistState, writeChecklistState } from './dailyPlanChecklist.js'

describe('dailyPlanChecklist', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    window.localStorage.clear()
  })

  it('persists and reads checklist for current day', () => {
    writeChecklistState({ s1: true })
    expect(readChecklistState()).toEqual({ s1: true })
  })

  it('returns empty object for invalid data', () => {
    window.localStorage.setItem('conju-daily-plan-checklist-v1', 'not-json')
    expect(readChecklistState()).toEqual({})
  })
})
