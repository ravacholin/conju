// Migration: Add social features (leaderboards, challenges, friends)
// Run: node server/src/run-migration.js 002-social-features

const migration = {
  name: '002-social-features',
  description: 'Add tables for leaderboards, challenges, and social features',

  async up(db) {
    console.log('Running migration: 002-social-features (up)')

    // Leaderboard entries table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS leaderboard_entries (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        alias TEXT NOT NULL,
        xp INTEGER DEFAULT 0,
        streak INTEGER DEFAULT 0,
        attempts INTEGER DEFAULT 0,
        timeframe TEXT NOT NULL, -- 'daily', 'weekly', 'alltime'
        date TEXT NOT NULL, -- YYYY-MM-DD for daily/weekly, or 'alltime'
        rank INTEGER,
        percentile REAL,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        UNIQUE(user_id, timeframe, date)
      )
    `)

    // Create indexes for leaderboard queries
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_leaderboard_timeframe_date_rank
      ON leaderboard_entries(timeframe, date, rank DESC)
    `)

    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_leaderboard_user_id
      ON leaderboard_entries(user_id)
    `)

    // Challenges table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS challenges (
        id TEXT PRIMARY KEY,
        creator_id TEXT NOT NULL,
        challenged_id TEXT NOT NULL,
        metric TEXT NOT NULL, -- 'xp', 'attempts', 'accuracy', 'streak'
        target_score INTEGER NOT NULL,
        duration_hours INTEGER DEFAULT 24,
        status TEXT DEFAULT 'pending', -- 'pending', 'active', 'completed', 'declined'
        creator_score INTEGER DEFAULT 0,
        challenged_score INTEGER DEFAULT 0,
        winner_id TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        started_at TEXT,
        completed_at TEXT,
        expires_at TEXT NOT NULL
      )
    `)

    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_challenges_creator
      ON challenges(creator_id, status)
    `)

    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_challenges_challenged
      ON challenges(challenged_id, status)
    `)

    // Challenge progress tracking
    await db.exec(`
      CREATE TABLE IF NOT EXISTS challenge_progress (
        id TEXT PRIMARY KEY,
        challenge_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        score INTEGER DEFAULT 0,
        timestamp TEXT DEFAULT (datetime('now')),
        FOREIGN KEY(challenge_id) REFERENCES challenges(id) ON DELETE CASCADE
      )
    `)

    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_challenge_progress_challenge
      ON challenge_progress(challenge_id, user_id, timestamp DESC)
    `)

    // Social achievements
    await db.exec(`
      CREATE TABLE IF NOT EXISTS social_achievements (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        achievement_type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        icon TEXT,
        earned_at TEXT DEFAULT (datetime('now')),
        metadata TEXT, -- JSON string
        UNIQUE(user_id, achievement_type)
      )
    `)

    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_social_achievements_user
      ON social_achievements(user_id, earned_at DESC)
    `)

    // Friends table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS social_friends (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        friend_id TEXT NOT NULL,
        status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'declined', 'blocked'
        created_at TEXT DEFAULT (datetime('now')),
        accepted_at TEXT,
        UNIQUE(user_id, friend_id)
      )
    `)

    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_social_friends_user
      ON social_friends(user_id, status)
    `)

    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_social_friends_friend
      ON social_friends(friend_id, status)
    `)

    // Community stats table (cached aggregate data)
    await db.exec(`
      CREATE TABLE IF NOT EXISTS community_stats (
        id TEXT PRIMARY KEY,
        stat_type TEXT NOT NULL, -- 'daily_totals', 'weekly_totals', 'alltime_totals'
        date TEXT NOT NULL, -- YYYY-MM-DD or 'alltime'
        total_attempts INTEGER DEFAULT 0,
        total_xp INTEGER DEFAULT 0,
        active_users INTEGER DEFAULT 0,
        avg_accuracy REAL DEFAULT 0,
        updated_at TEXT DEFAULT (datetime('now')),
        metadata TEXT, -- JSON string for additional stats
        UNIQUE(stat_type, date)
      )
    `)

    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_community_stats_type_date
      ON community_stats(stat_type, date)
    `)

    console.log('Migration 002-social-features completed successfully')
  },

  async down(db) {
    console.log('Running migration: 002-social-features (down)')

    await db.exec('DROP TABLE IF EXISTS leaderboard_entries')
    await db.exec('DROP TABLE IF EXISTS challenge_progress')
    await db.exec('DROP TABLE IF EXISTS challenges')
    await db.exec('DROP TABLE IF EXISTS social_achievements')
    await db.exec('DROP TABLE IF EXISTS social_friends')
    await db.exec('DROP TABLE IF EXISTS community_stats')

    console.log('Migration 002-social-features rolled back successfully')
  }
}

module.exports = migration
