import Database from 'better-sqlite3'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

const DB_DIR = process.env.DB_DIR || '.data'
mkdirSync(DB_DIR, { recursive: true })
const DB_PATH = join(DB_DIR, 'progress-sync.db')

export const db = new Database(DB_PATH)

export function migrate() {
  db.pragma('journal_mode = WAL')
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      created_at INTEGER NOT NULL,
      last_seen_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS attempts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at INTEGER,
      updated_at INTEGER,
      payload TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
    CREATE INDEX IF NOT EXISTS idx_attempts_user ON attempts(user_id);
    CREATE INDEX IF NOT EXISTS idx_attempts_created ON attempts(created_at);

    CREATE TABLE IF NOT EXISTS mastery (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      updated_at INTEGER,
      payload TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
    CREATE INDEX IF NOT EXISTS idx_mastery_user ON mastery(user_id);

    CREATE TABLE IF NOT EXISTS schedules (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      next_due INTEGER,
      updated_at INTEGER,
      payload TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
    CREATE INDEX IF NOT EXISTS idx_schedules_user ON schedules(user_id);
    CREATE INDEX IF NOT EXISTS idx_schedules_nextdue ON schedules(next_due);
  `)
}

export function upsertUser(userId) {
  const now = Date.now()
  const stmt = db.prepare('INSERT INTO users (id, created_at, last_seen_at) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET last_seen_at=excluded.last_seen_at')
  stmt.run(userId, now, now)
}

