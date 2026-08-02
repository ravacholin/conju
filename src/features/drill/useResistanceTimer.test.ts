import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'

import { useResistanceTimer } from './useResistanceTimer'
import { RESISTANCE_MAX_MS } from '../../state/settings.js'
import { useSessionStore } from '../../state/session.js'

describe('useResistanceTimer', () => {
  let intervalSpy: ReturnType<typeof vi.spyOn> | null

  beforeEach(() => {
    vi.useFakeTimers()
    intervalSpy = vi.spyOn(window, 'setInterval').mockImplementation(
      (() => 0) as unknown as typeof setInterval
    )

    act(() => {
      useSessionStore.getState().setGameMode({
        resistanceActive: true,
        resistanceMsLeft: RESISTANCE_MAX_MS - 1000,
        resistanceStartTs: Date.now()
      })
    })
  })

  afterEach(() => {
    act(() => {
      vi.runAllTimers()
    })
    vi.useRealTimers()
    intervalSpy?.mockRestore()
    intervalSpy = null

    act(() => {
      useSessionStore.getState().clearGameSession()
    })
  })

  it('caps resistance time when clicking the clock multiple times', () => {
    const { result } = renderHook(() => useResistanceTimer())

    act(() => {
      result.current.handleClockClick()
      result.current.handleClockClick()
    })

    // The live countdown is local state now (not written to the session store
    // on every tick/click — see useResistanceTimer.ts), so assert against it
    // directly instead of useSessionStore.getState().resistanceMsLeft.
    expect(result.current.msLeft).toBe(RESISTANCE_MAX_MS)
  })

  it('does not write the live countdown to the session store', () => {
    const { result } = renderHook(() => useResistanceTimer())

    act(() => {
      result.current.handleClockClick()
    })

    expect(useSessionStore.getState().resistanceMsLeft).toBe(RESISTANCE_MAX_MS - 1000)
  })
})
