import { beforeAll, beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { createRoutes } from '../../server/src/routes.js'
import { db, migrate } from '../../server/src/db.js'

const router = createRoutes()

const getBulkHandler = (path) => {
  const layer = router.stack.find((entry) => entry?.route?.path === path)
  if (!layer) throw new Error(`Route not found: ${path}`)
  return layer.route.stack[0].handle
}

const invokeHandler = (handler, req) => {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code
      return this
    },
    json(payload) {
      this.body = payload
      return this
    }
  }

  handler(req, res)
  return res
}

describe('Bulk date normalization', () => {
  beforeAll(() => {
    migrate()
  })

  beforeEach(() => {
    db.prepare('DELETE FROM attempts').run()
    db.prepare('DELETE FROM schedules').run()
    db.prepare('DELETE FROM sessions').run()
    db.prepare('DELETE FROM users').run()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('coerces invalid attempt createdAt values to a numeric timestamp', () => {
    const handler = getBulkHandler('/progress/attempts/bulk')
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const start = Date.now()
    invokeHandler(handler, {
      userId: 'user-attempt',
      accountId: null,
      body: {
        records: [
          {
            id: 'attempt-1',
            createdAt: 'not-a-date'
          }
        ]
      }
    })

    const attempt = db.prepare('SELECT created_at FROM attempts WHERE id = ?').get('attempt-1')
    expect(Number.isFinite(attempt.created_at)).toBe(true)
    expect(attempt.created_at).toBeGreaterThanOrEqual(start)
    expect(attempt.created_at).toBeLessThanOrEqual(Date.now())
    expect(warnSpy).toHaveBeenCalledTimes(1)
    expect(warnSpy.mock.calls[0][0]).toContain('Invalid createdAt value')
  })

  it('coerces invalid schedule nextDue values to a numeric timestamp', () => {
    const handler = getBulkHandler('/progress/schedules/bulk')
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const start = Date.now()
    invokeHandler(handler, {
      userId: 'user-schedule',
      accountId: null,
      body: {
        records: [
          {
            id: 'schedule-1',
            nextDue: 'corrupted'
          }
        ]
      }
    })

    const schedule = db.prepare('SELECT next_due FROM schedules WHERE id = ?').get('schedule-1')
    expect(Number.isFinite(schedule.next_due)).toBe(true)
    expect(schedule.next_due).toBeGreaterThanOrEqual(start)
    expect(schedule.next_due).toBeLessThanOrEqual(Date.now())
    expect(warnSpy).toHaveBeenCalledTimes(1)
    expect(warnSpy.mock.calls[0][0]).toContain('Invalid nextDue value')
  })

  it('coerces invalid session timestamps while preserving updatedAt fallback', () => {
    const handler = getBulkHandler('/progress/sessions/bulk')
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const start = Date.now()
    invokeHandler(handler, {
      userId: 'user-session',
      accountId: null,
      body: {
        records: [
          {
            id: 'session-1',
            updatedAt: 'invalid-updated',
            timestamp: 'invalid-timestamp'
          }
        ]
      }
    })

    const session = db.prepare('SELECT updated_at, timestamp FROM sessions WHERE id = ?').get('session-1')
    expect(Number.isFinite(session.updated_at)).toBe(true)
    expect(Number.isFinite(session.timestamp)).toBe(true)
    expect(session.updated_at).toBeGreaterThanOrEqual(start)
    expect(session.timestamp).toBeGreaterThanOrEqual(start)
    expect(session.updated_at).toBeLessThanOrEqual(Date.now())
    expect(session.timestamp).toBeLessThanOrEqual(Date.now())
    expect(warnSpy).toHaveBeenCalledTimes(2)
    expect(warnSpy.mock.calls[0][0]).toContain('Invalid updatedAt value')
    expect(warnSpy.mock.calls[1][0]).toContain('Invalid timestamp value')
  })
})
