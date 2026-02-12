import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSyncStatus } from './useSyncStatus.js'
import { getSyncStatus } from '../lib/progress/cloudSync.js'

vi.mock('../lib/progress/cloudSync.js', () => ({
  getSyncStatus: vi.fn(() => ({
    isSyncing: false,
    lastSyncTime: null,
    syncError: null,
    isOnline: true,
    isIncognitoMode: false,
    syncEnabled: true,
    isLocalSync: false
  }))
}))

describe('useSyncStatus', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  it('attaches global listeners once for multiple hook consumers', () => {
    const addSpy = vi.spyOn(window, 'addEventListener')

    const hookA = renderHook(() => useSyncStatus())
    const hookB = renderHook(() => useSyncStatus())

    const addedEvents = addSpy.mock.calls.map((call) => call[0])
    expect(addedEvents.filter((name) => name === 'progress:cloud-sync')).toHaveLength(1)
    expect(addedEvents.filter((name) => name === 'online')).toHaveLength(1)
    expect(addedEvents.filter((name) => name === 'offline')).toHaveLength(1)
    expect(addedEvents.filter((name) => name === 'focus')).toHaveLength(1)

    hookA.unmount()
    hookB.unmount()
    addSpy.mockRestore()
  })

  it('removes global listeners only when the last consumer unmounts', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener')

    const hookA = renderHook(() => useSyncStatus())
    const hookB = renderHook(() => useSyncStatus())

    hookA.unmount()
    expect(removeSpy).not.toHaveBeenCalled()

    hookB.unmount()
    const removedEvents = removeSpy.mock.calls.map((call) => call[0])
    expect(removedEvents.filter((name) => name === 'progress:cloud-sync')).toHaveLength(1)
    expect(removedEvents.filter((name) => name === 'online')).toHaveLength(1)
    expect(removedEvents.filter((name) => name === 'offline')).toHaveLength(1)
    expect(removedEvents.filter((name) => name === 'focus')).toHaveLength(1)
    removeSpy.mockRestore()
  })

  it('skips fallback polling when tab is hidden and refreshes on visible', () => {
    const statusMock = vi.mocked(getSyncStatus)
    statusMock.mockClear()

    const hiddenDescriptor = Object.getOwnPropertyDescriptor(document, 'hidden')
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => true
    })

    const hook = renderHook(() => useSyncStatus())
    const afterMountCalls = statusMock.mock.calls.length

    act(() => {
      vi.advanceTimersByTime(2 * 60 * 1000)
    })
    expect(statusMock.mock.calls.length).toBe(afterMountCalls)

    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => false
    })

    act(() => {
      document.dispatchEvent(new Event('visibilitychange'))
    })

    expect(statusMock.mock.calls.length).toBeGreaterThan(afterMountCalls)

    hook.unmount()

    if (hiddenDescriptor) {
      Object.defineProperty(document, 'hidden', hiddenDescriptor)
    }
  })
})
