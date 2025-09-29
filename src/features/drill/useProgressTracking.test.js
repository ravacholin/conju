import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useProgressTracking } from './useProgressTracking.js'
import { generateDrillItem } from '../../hooks/modules/DrillItemGenerator.js'
import { trackAttemptStarted } from './tracking.js'

vi.mock('./tracking.js', () => ({
  trackAttemptStarted: vi.fn(() => 'attempt-1'),
  trackAttemptSubmitted: vi.fn(),
  trackHintShown: vi.fn(),
  trackStreakIncremented: vi.fn(),
  trackTenseDrillStarted: vi.fn(),
  trackTenseDrillEnded: vi.fn(),
  trackPronunciationAttempt: vi.fn()
}))

vi.mock('../../lib/progress/userManager.js', () => ({
  incrementSessionCount: vi.fn(),
  getCurrentUserId: vi.fn(() => 'user-test')
}))

vi.mock('../../lib/progress/index.js', () => ({
  isProgressSystemInitialized: vi.fn(() => true),
  onProgressSystemReady: vi.fn((callback) => {
    callback(true)
    return vi.fn()
  })
}))

vi.mock('../../lib/utils/logger.js', () => ({
  createLogger: vi.fn(() => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }))
}))

describe('useProgressTracking', () => {
  const settings = {
    useVoseo: false,
    useTuteo: false,
    useVosotros: false
  }

  const formsPool = [
    {
      lemma: 'hablar',
      mood: 'indicative',
      tense: 'pres',
      person: '1s',
      value: 'hablo'
    },
    {
      lemma: 'hablar',
      mood: 'indicative',
      tense: 'pres',
      person: '2s_tu',
      value: 'hablas'
    }
  ]

  beforeEach(() => {
    trackAttemptStarted.mockClear()
  })

  it('receives distinct IDs for consecutive drill items', async () => {
    const firstItem = generateDrillItem(formsPool[0], settings, formsPool)
    const secondItem = generateDrillItem(formsPool[1], settings, formsPool)

    expect(firstItem?.id).toBeTruthy()
    expect(secondItem?.id).toBeTruthy()
    expect(firstItem.id).not.toBe(secondItem.id)

    const { rerender } = renderHook(
      ({ item }) => useProgressTracking(item, () => {}),
      { initialProps: { item: firstItem } }
    )

    await waitFor(() => {
      expect(trackAttemptStarted).toHaveBeenCalledTimes(1)
    })

    rerender({ item: secondItem })

    await waitFor(() => {
      expect(trackAttemptStarted).toHaveBeenCalledTimes(2)
    })

    const firstCallItem = trackAttemptStarted.mock.calls[0][0]
    const secondCallItem = trackAttemptStarted.mock.calls[1][0]

    expect(firstCallItem.id).toBe(firstItem.id)
    expect(secondCallItem.id).toBe(secondItem.id)
    expect(firstCallItem.id).not.toBe(secondCallItem.id)
  })

  it('exposes pronunciation tracking handler', async () => {
    const item = generateDrillItem(formsPool[0], settings, formsPool)

    const { result } = renderHook(
      ({ current }) => useProgressTracking(current, () => {}),
      { initialProps: { current: item } }
    )

    await waitFor(() => {
      expect(result.current.progressSystemReady).toBe(true)
    })

    await result.current.handlePronunciationAttempt({ accuracy: 82, recognized: 'hablo' })

    const tracking = await import('./tracking.js')
    expect(tracking.trackPronunciationAttempt).toHaveBeenCalledWith(
      expect.objectContaining({
        accuracy: 82,
        recognized: 'hablo',
        mood: item.mood,
        tense: item.tense
      })
    )
  })
})
