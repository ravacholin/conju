import Database from 'better-sqlite3'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

const DB_DIR = process.env.DB_DIR || '.data'
mkdirSync(DB_DIR, { recursive: true })
const DB_PATH = join(DB_DIR, 'progress-sync.db')

export const db = new Database(DB_PATH)

export function getDatabase() {
  return db
}

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

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      updated_at INTEGER,
      timestamp INTEGER,
      payload TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_updated ON sessions(updated_at);

    -- User settings table for cross-device sync
    CREATE TABLE IF NOT EXISTS user_settings (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      account_id TEXT NOT NULL,
      settings TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(account_id) REFERENCES accounts(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_user_settings_user ON user_settings(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_settings_account ON user_settings(account_id);
    CREATE INDEX IF NOT EXISTS idx_user_settings_updated ON user_settings(updated_at);

    -- Daily challenges table for cross-device sync
    CREATE TABLE IF NOT EXISTS daily_challenges (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      account_id TEXT NOT NULL,
      challenge_data TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(account_id) REFERENCES accounts(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_daily_challenges_user ON daily_challenges(user_id);
    CREATE INDEX IF NOT EXISTS idx_daily_challenges_account ON daily_challenges(account_id);
    CREATE INDEX IF NOT EXISTS idx_daily_challenges_created ON daily_challenges(created_at);

    -- Events table for cross-device sync
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      account_id TEXT NOT NULL,
      event_data TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(account_id) REFERENCES accounts(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_events_user ON events(user_id);
    CREATE INDEX IF NOT EXISTS idx_events_account ON events(account_id);
    CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at);
  `)

  // Migration: Add updated_at column to existing events table if it doesn't exist
  const eventsColumns = db.pragma('table_info(events)')
  const hasUpdatedAt = eventsColumns.some(col => col.name === 'updated_at')
  if (!hasUpdatedAt) {
    db.exec(`
      ALTER TABLE events ADD COLUMN updated_at INTEGER;
      -- Backfill updated_at with created_at for existing records
      UPDATE events SET updated_at = created_at WHERE updated_at IS NULL;
    `)
  }

  // ONE-TIME FIX: Claim orphan data for specific account
  // The data was saved with userId 'user-1757116089225-znn62g8vx' but needs to be linked to account '8d57c9ec-957a-4ff4-bbfe-7e41bd852689'
  try {
    const orphanUserId = 'user-1757116089225-znn62g8vx'
    const targetAccountId = '8d57c9ec-957a-4ff4-bbfe-7e41bd852689'

    // Check if there's orphan data to claim
    const orphanCount = db.prepare('SELECT COUNT(*) as count FROM attempts WHERE user_id = ?').get(orphanUserId)

    if (orphanCount && orphanCount.count > 0) {
      console.log(`🔄 MIGRATION: Found ${orphanCount.count} orphan attempts for ${orphanUserId}`)

      // CRITICAL: First ensure the accountId exists as a user record (to satisfy FK constraint)
      const now = Date.now()
      db.prepare(`
        INSERT OR IGNORE INTO users (id, account_id, created_at, last_seen_at)
        VALUES (?, ?, ?, ?)
      `).run(targetAccountId, targetAccountId, now, now)
      console.log(`  ✅ Created/verified user record for ${targetAccountId}`)

      const tables = ['attempts', 'mastery', 'schedules', 'sessions']
      db.transaction(() => {
        for (const table of tables) {
          const result = db.prepare(`
            UPDATE ${table}
            SET user_id = ?
            WHERE user_id = ?
          `).run(targetAccountId, orphanUserId)
          if (result.changes > 0) {
            console.log(`  ✅ ${table}: ${result.changes} records claimed`)
          }
        }

        // Link the orphan user record to the account
        db.prepare(`
          UPDATE users
          SET account_id = ?
          WHERE id = ?
        `).run(targetAccountId, orphanUserId)
      })()

      console.log(`🎉 MIGRATION: Orphan data claimed successfully for account ${targetAccountId}`)
    }
  } catch (err) {
    console.error('Migration error (non-fatal):', err)
  }
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
