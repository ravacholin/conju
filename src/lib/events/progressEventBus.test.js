import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  emitProgressEvent,
  onProgressEvent,
  validateProgressEventDetail,
  PROGRESS_EVENTS
} from './progressEventBus.js'

describe('progressEventBus', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('emits validated progress:dataUpdated payloads', () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent')

    const emitted = emitProgressEvent(PROGRESS_EVENTS.DATA_UPDATED, {
      type: 'drill_result',
      userId: 'user-1',
      mood: 'indicative',
      tense: 'present',
      person: 'yo'
    })

    expect(emitted).toBe(true)
    expect(dispatchSpy).toHaveBeenCalledTimes(1)

    const [event] = dispatchSpy.mock.calls[0]
    expect(event.type).toBe(PROGRESS_EVENTS.DATA_UPDATED)
    expect(event.detail.userId).toBe('user-1')
  })

  it('rejects invalid payloads when validate=true', () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent')

    const emitted = emitProgressEvent(PROGRESS_EVENTS.DATA_UPDATED, {
      userId: 999
    })

    expect(emitted).toBe(false)
    expect(dispatchSpy).not.toHaveBeenCalled()
  })

  it('subscribes and validates listener payloads', () => {
    const handler = vi.fn()
    const unsubscribe = onProgressEvent(
      PROGRESS_EVENTS.CHALLENGE_COMPLETED,
      handler,
      { validate: true }
    )

    window.dispatchEvent(new CustomEvent(PROGRESS_EVENTS.CHALLENGE_COMPLETED, {
      detail: { userId: 'u-1', challengeId: 'attempts-20' }
    }))
    window.dispatchEvent(new CustomEvent(PROGRESS_EVENTS.CHALLENGE_COMPLETED, {
      detail: { userId: 42 }
    }))

    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler.mock.calls[0][0]).toMatchObject({
      userId: 'u-1',
      challengeId: 'attempts-20'
    })

    unsubscribe()
  })

  it('validateProgressEventDetail accepts unregistered events', () => {
    const result = validateProgressEventDetail('progress:unknown', { any: 'value' })
    expect(result.ok).toBe(true)
    expect(result.data).toEqual({ any: 'value' })
  })
})
