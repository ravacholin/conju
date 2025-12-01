import { describe, expect, it } from 'vitest'
import { SessionManager } from './sessionManager.js'

const buildSession = () => ({
  duration: 20,
  activities: [
    { id: 'a1', type: 'drill', title: 'Actividad 1', estimatedItems: 2 },
    { id: 'a2', type: 'drill', title: 'Actividad 2', estimatedItems: 3 }
  ],
  estimatedItems: 5,
  focusAreas: []
})

describe('sessionManager activity item counts', () => {
  it('tracks item counts por actividad y los usa para avanzar', () => {
    const manager = new SessionManager()
    manager.startSession(buildSession())

    expect(manager.shouldConsiderAdvancing()).toBe(false)

    manager.recordItemResult({ isCorrect: true, latencyMs: 1000 })
    manager.recordItemResult({ isCorrect: true, latencyMs: 900 })

    expect(manager.shouldConsiderAdvancing()).toBe(true)
    expect(manager.activityItemCounts).toEqual({ a1: 2 })

    manager.nextActivity()
    expect(manager.getCurrentActivity().id).toBe('a2')
    expect(manager.shouldConsiderAdvancing()).toBe(false)

    manager.recordItemResult({ isCorrect: true, latencyMs: 800 })
    expect(manager.shouldConsiderAdvancing()).toBe(false)

    manager.recordItemResult({ isCorrect: false, latencyMs: 750 })
    manager.recordItemResult({ isCorrect: true, latencyMs: 700 })
    expect(manager.shouldConsiderAdvancing()).toBe(true)

    const finalMetrics = manager.endSession()
    expect(finalMetrics.activityItemCounts).toEqual({ a1: 2, a2: 3 })
    expect(finalMetrics.activitiesCompleted[0].itemsCompleted).toBe(2)
  })

  it('reinicia los conteos por actividad al iniciar una nueva sesión', () => {
    const manager = new SessionManager()
    manager.startSession(buildSession())
    manager.recordItemResult({ isCorrect: true, latencyMs: 1000 })
    manager.endSession()

    manager.startSession(buildSession())
    expect(manager.activityItemCounts).toEqual({})
    expect(manager.shouldConsiderAdvancing()).toBe(false)
  })

  it('maneja sesiones sin duración sin propagar valores NaN', () => {
    const manager = new SessionManager()
    const sessionSinDuracion = { ...buildSession(), duration: undefined }

    manager.startSession(sessionSinDuracion)

    const progress = manager.getSessionProgress()
    expect(progress.plannedMinutes).toBe(0)
    expect(progress.plannedDuration).toBe(0)
    expect(Number.isNaN(progress.progressPercentage)).toBe(false)

    const finalMetrics = manager.endSession()
    expect(finalMetrics.plannedMinutes).toBe(0)
    expect(finalMetrics.plannedDuration).toBe(0)
    expect(Number.isNaN(finalMetrics.totalDuration)).toBe(false)
  })
})
