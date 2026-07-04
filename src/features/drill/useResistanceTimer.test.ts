import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'

import { useResistanceTimer } from './useResistanceTimer'
import { useSettings, RESISTANCE_MAX_MS } from '../../state/settings.js'

describe('useResistanceTimer', () => {
  let defaultResistanceState: {
    resistanceActive: boolean
    resistanceMsLeft: number
    resistanceStartTs: number | null
  }
  let intervalSpy: ReturnType<typeof vi.spyOn> | null

  beforeAll(() => {
    const state = useSettings.getState()
    defaultResistanceState = {
      resistanceActive: state.resistanceActive,
      resistanceMsLeft: state.resistanceMsLeft,
      resistanceStartTs: state.resistanceStartTs
    }
  })

  beforeEach(() => {
    vi.useFakeTimers()
    intervalSpy = vi.spyOn(window, 'setInterval').mockImplementation(
      (() => 0) as unknown as typeof setInterval
    )

    act(() => {
      useSettings.setState({
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
      useSettings.setState(defaultResistanceState)
    })
  })

  it('caps resistance time when clicking the clock multiple times', () => {
    const { result } = renderHook(() => useResistanceTimer())

    act(() => {
      result.current.handleClockClick()
      result.current.handleClockClick()
    })

    // The live countdown is local state now (not written to the global store
    // on every tick/click — see useResistanceTimer.ts), so assert against it
    // directly instead of useSettings.getState().resistanceMsLeft.
    expect(result.current.msLeft).toBe(RESISTANCE_MAX_MS)
  })

  it('does not write the live countdown to the global settings store', () => {
    const { result } = renderHook(() => useResistanceTimer())

    act(() => {
      result.current.handleClockClick()
    })

    expect(useSettings.getState().resistanceMsLeft).toBe(RESISTANCE_MAX_MS - 1000)
  })
})
