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
    -- Accounts table for authentication
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      password_hash TEXT,
      google_id TEXT UNIQUE,
      name TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_accounts_email ON accounts(email);
    CREATE INDEX IF NOT EXISTS idx_accounts_google ON accounts(google_id);

    -- User devices linked to accounts
    CREATE TABLE IF NOT EXISTS user_devices (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      device_name TEXT,
      device_info TEXT,
      last_sync_at INTEGER,
      created_at INTEGER NOT NULL,
      FOREIGN KEY(account_id) REFERENCES accounts(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_user_devices_account ON user_devices(account_id);

    -- Extended users table
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      account_id TEXT,
      device_id TEXT,
      device_name TEXT,
      created_at INTEGER NOT NULL,
      last_seen_at INTEGER NOT NULL,
      FOREIGN KEY(account_id) REFERENCES accounts(id) ON DELETE SET NULL,
      FOREIGN KEY(device_id) REFERENCES user_devices(id) ON DELETE SET NULL
    );
    CREATE INDEX IF NOT EXISTS idx_users_account ON users(account_id);
    CREATE INDEX IF NOT EXISTS idx_users_device ON users(device_id);

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

export function upsertUser(userId, accountId = null) {
  const now = Date.now()
  const stmt = db.prepare(`
    INSERT INTO users (id, account_id, created_at, last_seen_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      account_id=excluded.account_id,
      last_seen_at=excluded.last_seen_at
  `)
  stmt.run(userId, accountId, now, now)
}

