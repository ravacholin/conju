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
      db.transaction(() => {
        for (const rec of records) {
          if (!rec || !rec.id) continue
          const id = String(rec.id)
          // Force server-side user id
          const payload = JSON.stringify({ ...rec, userId })
          switch (table) {
            case 'attempts': {
              const createdAt = rec.createdAt ? new Date(rec.createdAt).getTime() : now
              const stmt = db.prepare('INSERT INTO attempts (id, user_id, created_at, updated_at, payload) VALUES (?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET user_id=excluded.user_id, updated_at=excluded.updated_at, payload=excluded.payload')
              const info = stmt.run(id, userId, createdAt, now, payload)
              if (info.changes === 1) uploaded++
              else updated++
              break
            }
            case 'mastery': {
              const stmt = db.prepare('INSERT INTO mastery (id, user_id, updated_at, payload) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET user_id=excluded.user_id, updated_at=excluded.updated_at, payload=excluded.payload')
              const info = stmt.run(id, userId, now, payload)
              if (info.changes === 1) uploaded++
              else updated++
              break
            }
            case 'schedules': {
              const nextDue = rec.nextDue ? new Date(rec.nextDue).getTime() : null
              const stmt = db.prepare('INSERT INTO schedules (id, user_id, next_due, updated_at, payload) VALUES (?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET user_id=excluded.user_id, next_due=excluded.next_due, updated_at=excluded.updated_at, payload=excluded.payload')
              const info = stmt.run(id, userId, nextDue, now, payload)
              if (info.changes === 1) uploaded++
              else updated++
              break
            }
          }
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

  // Export endpoints (per user)
  r.get('/progress/export', (req, res) => {
    try {
      const userId = req.userId
      const attempts = db.prepare('SELECT payload FROM attempts WHERE user_id=? ORDER BY created_at ASC').all(userId).map(r => JSON.parse(r.payload))
      const mastery = db.prepare('SELECT payload FROM mastery WHERE user_id=? ORDER BY updated_at DESC').all(userId).map(r => JSON.parse(r.payload))
      const schedules = db.prepare('SELECT payload FROM schedules WHERE user_id=? ORDER BY next_due ASC').all(userId).map(r => JSON.parse(r.payload))
      res.json({ userId, attempts, mastery, schedules })
    } catch (e) {
      console.error('Export error', e)
      res.status(500).json({ error: 'export_failed' })
    }
  })

  return r
}

