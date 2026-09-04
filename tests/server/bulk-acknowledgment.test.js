import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createRoutes } from '../../server/src/routes.js'
import { db, migrate } from '../../server/src/db.js'

/**
 * The bulk endpoints must report exactly how many records they persisted (uploaded + updated)
 * and how many they had to skip. The client relies on these counts to avoid marking records as
 * synced when the server did not actually store them — otherwise those records would be lost for
 * every other device.
 */

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
    status(code) { this.statusCode = code; return this },
    json(payload) { this.body = payload; return this }
  }
  handler(req, res)
  return res
}

describe('Bulk acknowledgment counts', () => {
  beforeAll(() => {
    migrate()
  })

  beforeEach(() => {
    // Clear child tables (which reference users via FK) before removing users.
    db.prepare('DELETE FROM attempts').run()
    db.prepare('DELETE FROM mastery').run()
    db.prepare('DELETE FROM schedules').run()
    db.prepare('DELETE FROM sessions').run()
    db.prepare('DELETE FROM users').run()
  })

  it('acknowledges every persisted record via uploaded + updated', () => {
    const handler = getBulkHandler('/progress/mastery/bulk')

    const res = invokeHandler(handler, {
      userId: 'user-ack',
      accountId: null,
      body: {
        records: [
          { id: 'm1', verbId: 'ser', mood: 'indicative', tense: 'present', person: '1s' },
          { id: 'm2', verbId: 'estar', mood: 'indicative', tense: 'present', person: '1s' }
        ]
      }
    })

    expect(res.body.success).toBe(true)
    expect((res.body.uploaded || 0) + (res.body.updated || 0)).toBe(2)
    expect(res.body.skipped).toBe(0)
  })

  it('reports records without an id as skipped instead of silently accepting them', () => {
    const handler = getBulkHandler('/progress/mastery/bulk')

    const res = invokeHandler(handler, {
      userId: 'user-ack-2',
      accountId: null,
      body: {
        records: [
          { id: 'm-ok', verbId: 'ser', mood: 'indicative', tense: 'present', person: '1s' },
          { verbId: 'haber', mood: 'indicative', tense: 'present', person: '1s' } // no id
        ]
      }
    })

    expect(res.body.success).toBe(true)
    expect((res.body.uploaded || 0) + (res.body.updated || 0)).toBe(1)
    expect(res.body.skipped).toBe(1)
    // Only the record with an id was actually stored.
    const stored = db.prepare('SELECT COUNT(*) as count FROM mastery WHERE user_id = ?').get('user-ack-2')
    expect(stored.count).toBe(1)
  })

  it('returns explicit zero counts for an empty batch', () => {
    const handler = getBulkHandler('/progress/mastery/bulk')

    const res = invokeHandler(handler, {
      userId: 'user-ack-3',
      accountId: null,
      body: { records: [] }
    })

    expect(res.body).toMatchObject({ success: true, uploaded: 0, updated: 0, skipped: 0 })
  })
})
