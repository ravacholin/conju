import { Router } from 'express'
import { db, upsertUser } from './db.js'

export function createRoutes() {
  const r = Router()

  r.get('/health', (_req, res) => {
    res.json({ ok: true, ts: Date.now() })
  })

  // Bulk upsert helper
  const handleBulk = (table) => (req, res) => {
    try {
      const userId = req.userId
      upsertUser(userId, req.accountId)
      const records = Array.isArray(req.body?.records) ? req.body.records : []
      if (!records.length) return res.json({ uploaded: 0 })

      const now = Date.now()
      let uploaded = 0, updated = 0
      const normalizeDate = (value, fieldName, recordId, { useNowWhenMissing = false } = {}) => {
        if (value === null || value === undefined) {
          return useNowWhenMissing ? now : null
        }
        const timestamp = new Date(value).getTime()
        if (Number.isFinite(timestamp)) return timestamp
        console.warn(
          `[sync:${table}] Invalid ${fieldName} value for record ${recordId}; using current timestamp.`
        )
        return now
      }
      db.transaction(() => {
        let stmt
        switch (table) {
          case 'attempts':
            stmt = db.prepare('INSERT INTO attempts (id, user_id, created_at, updated_at, payload) VALUES (?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET user_id=excluded.user_id, updated_at=excluded.updated_at, payload=excluded.payload')
            break
          case 'mastery':
            stmt = db.prepare('INSERT INTO mastery (id, user_id, updated_at, payload) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET user_id=excluded.user_id, updated_at=excluded.updated_at, payload=excluded.payload')
            break
          case 'schedules':
            stmt = db.prepare('INSERT INTO schedules (id, user_id, next_due, updated_at, payload) VALUES (?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET user_id=excluded.user_id, next_due=excluded.next_due, updated_at=excluded.updated_at, payload=excluded.payload')
            break
          case 'sessions':
            stmt = db.prepare('INSERT INTO sessions (id, user_id, updated_at, timestamp, payload) VALUES (?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET user_id=excluded.user_id, updated_at=excluded.updated_at, timestamp=excluded.timestamp, payload=excluded.payload')
            break
        }

        if (!stmt) return

        for (const rec of records) {
          if (!rec) continue
          const key = table === 'sessions' ? (rec.id || rec.sessionId) : rec.id
          if (!key) continue
          const id = String(key)
          // Force server-side user id
          const payload = JSON.stringify({ ...rec, userId })

          let info
          switch (table) {
            case 'attempts': {
              const createdAt = normalizeDate(rec.createdAt, 'createdAt', id, {
                useNowWhenMissing: true
              })
              info = stmt.run(id, userId, createdAt, now, payload)
              break
            }
            case 'mastery': {
              info = stmt.run(id, userId, now, payload)
              break
            }
            case 'schedules': {
              const nextDue = normalizeDate(rec.nextDue, 'nextDue', id)
              info = stmt.run(id, userId, nextDue, now, payload)
              break
            }
            case 'sessions': {
              const updatedAt = normalizeDate(rec.updatedAt, 'updatedAt', id, {
                useNowWhenMissing: true
              })
              const timestamp = rec.timestamp === null || rec.timestamp === undefined
                ? updatedAt
                : normalizeDate(rec.timestamp, 'timestamp', id)
              info = stmt.run(id, userId, updatedAt, timestamp, payload)
              break
            }
          }

          if (info && info.changes === 1) uploaded++
          else updated++
        }
      })()

      res.json({ success: true, uploaded, updated })
    } catch (e) {
      console.error('Bulk error', e)
      res.status(500).json({ error: 'bulk_failed', detail: String(e.message || e) })
    }
  }

  // Bulk endpoints
  r.post('/progress/attempts/bulk', handleBulk('attempts'))
  r.post('/progress/mastery/bulk', handleBulk('mastery'))
  r.post('/progress/schedules/bulk', handleBulk('schedules'))
  r.post('/progress/sessions/bulk', handleBulk('sessions'))
  r.post('/progress/settings/bulk', handleBulk('user_settings'))
  r.post('/progress/challenges/bulk', handleBulk('daily_challenges'))
  r.post('/progress/events/bulk', handleBulk('events'))

  // Export endpoints (per user)
  r.get('/progress/export', (req, res) => {
    try {
      const userId = req.userId
      const attempts = db.prepare('SELECT payload FROM attempts WHERE user_id=? ORDER BY created_at ASC').all(userId).map(r => JSON.parse(r.payload))
      const mastery = db.prepare('SELECT payload FROM mastery WHERE user_id=? ORDER BY updated_at DESC').all(userId).map(r => JSON.parse(r.payload))
      const schedules = db.prepare('SELECT payload FROM schedules WHERE user_id=? ORDER BY next_due ASC').all(userId).map(r => JSON.parse(r.payload))
      const sessions = db.prepare('SELECT payload FROM sessions WHERE user_id=? ORDER BY updated_at DESC').all(userId).map(r => JSON.parse(r.payload))
      res.json({ userId, attempts, mastery, schedules, sessions })
    } catch (e) {
      console.error('Export error', e)
      res.status(500).json({ error: 'export_failed' })
    }
  })

  return r
}
