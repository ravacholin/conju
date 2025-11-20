// Social Features API Routes
// Handles leaderboards, challenges, and community stats

// Social Features API Routes
// Handles leaderboards, challenges, and community stats

import express from 'express'
import crypto from 'crypto'

const router = express.Router()

/**
 * GET /api/social/leaderboard
 * Fetch leaderboard with optional user context
 */
router.get('/leaderboard', async (req, res) => {
  try {
    const { timeframe = 'daily', limit = 50, offset = 0, userId } = req.query
    const db = req.app.get('db')

    if (!db) {
      return res.status(500).json({ error: 'Database not available' })
    }

    const validTimeframes = ['daily', 'weekly', 'alltime']
    if (!validTimeframes.includes(timeframe)) {
      return res.status(400).json({ error: 'Invalid timeframe' })
    }

    // Determine date filter
    const today = new Date().toISOString().split('T')[0]
    const dateFilter = timeframe === 'alltime' ? 'alltime' : today

    // Get leaderboard entries
    const entries = await db.all(`
      SELECT id, user_id, alias, xp, streak, attempts, rank, percentile
      FROM leaderboard_entries
      WHERE timeframe = ? AND date = ?
      ORDER BY rank ASC
      LIMIT ? OFFSET ?
    `, [timeframe, dateFilter, parseInt(limit), parseInt(offset)])

    // Get current user's rank if userId provided
    let currentUserRank = null
    let currentUserData = null

    if (userId) {
      const userEntry = await db.get(`
        SELECT rank, xp, streak, attempts
        FROM leaderboard_entries
        WHERE user_id = ? AND timeframe = ? AND date = ?
      `, [userId, timeframe, dateFilter])

      if (userEntry) {
        currentUserRank = userEntry.rank
        currentUserData = {
          xp: userEntry.xp,
          streak: userEntry.streak,
          attempts: userEntry.attempts
        }
      }
    }

    // Get total players
    const totalResult = await db.get(`
      SELECT COUNT(*) as total
      FROM leaderboard_entries
      WHERE timeframe = ? AND date = ?
    `, [timeframe, dateFilter])

    res.json({
      leaderboard: entries.map(e => ({
        rank: e.rank,
        userId: e.user_id,
        alias: e.alias,
        xp: e.xp,
        streak: e.streak,
        attempts: e.attempts
      })),
      currentUserRank,
      currentUserData,
      totalPlayers: totalResult?.total || 0,
      timeframe,
      lastUpdated: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    res.status(500).json({ error: 'Failed to fetch leaderboard' })
  }
})

/**
 * POST /api/social/leaderboard/submit
 * Submit or update leaderboard entry
 */
router.post('/leaderboard/submit', async (req, res) => {
  try {
    const { userId, alias, xp, streak, attempts } = req.body
    const db = req.app.get('db')

    if (!db) {
      return res.status(500).json({ error: 'Database not available' })
    }

    if (!userId || !alias) {
      return res.status(400).json({ error: 'userId and alias required' })
    }

    const today = new Date().toISOString().split('T')[0]
    const timeframes = ['daily', 'weekly', 'alltime']

    for (const timeframe of timeframes) {
      const entryId = `${userId}_${timeframe}_${today}`
      const dateValue = timeframe === 'alltime' ? 'alltime' : today

      // Upsert entry
      await db.run(`
        INSERT INTO leaderboard_entries (id, user_id, alias, xp, streak, attempts, timeframe, date, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        ON CONFLICT(user_id, timeframe, date)
        DO UPDATE SET
          xp = ?,
          streak = ?,
          attempts = ?,
          updated_at = datetime('now')
      `, [entryId, userId, alias, xp || 0, streak || 0, attempts || 0, timeframe, dateValue, xp || 0, streak || 0, attempts || 0])
    }

    // Recalculate ranks for all timeframes
    for (const timeframe of timeframes) {
      const dateValue = timeframe === 'alltime' ? 'alltime' : today

      // Get all entries ordered by XP
      const entries = await db.all(`
        SELECT user_id, xp
        FROM leaderboard_entries
        WHERE timeframe = ? AND date = ?
        ORDER BY xp DESC
      `, [timeframe, dateValue])

      // Update ranks
      for (let i = 0; i < entries.length; i++) {
        const rank = i + 1
        const percentile = ((entries.length - i) / entries.length) * 100

        await db.run(`
          UPDATE leaderboard_entries
          SET rank = ?, percentile = ?
          WHERE user_id = ? AND timeframe = ? AND date = ?
        `, [rank, percentile, entries[i].user_id, timeframe, dateValue])
      }
    }

    // Get user's new rank
    const userEntry = await db.get(`
      SELECT rank, percentile
      FROM leaderboard_entries
      WHERE user_id = ? AND timeframe = 'daily' AND date = ?
    `, [userId, today])

    res.json({
      success: true,
      rank: userEntry?.rank || null,
      percentile: userEntry?.percentile || null,
      improvement: null // Could calculate vs previous day
    })
  } catch (error) {
    console.error('Error submitting leaderboard entry:', error)
    res.status(500).json({ error: 'Failed to submit entry' })
  }
})

/**
 * GET /api/social/stats
 * Get community statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const db = req.app.get('db')

    if (!db) {
      return res.status(500).json({ error: 'Database not available' })
    }

    const today = new Date().toISOString().split('T')[0]

    // Get or create today's stats
    let stats = await db.get(`
      SELECT total_attempts, total_xp, active_users, avg_accuracy, updated_at
      FROM community_stats
      WHERE stat_type = 'daily_totals' AND date = ?
    `, [today])

    if (!stats) {
      // Calculate from leaderboard entries
      const dailyStats = await db.get(`
        SELECT
          SUM(attempts) as total_attempts,
          SUM(xp) as total_xp,
          COUNT(DISTINCT user_id) as active_users
        FROM leaderboard_entries
        WHERE timeframe = 'daily' AND date = ?
      `, [today])

      stats = {
        total_attempts: dailyStats?.total_attempts || 0,
        total_xp: dailyStats?.total_xp || 0,
        active_users: dailyStats?.active_users || 0,
        avg_accuracy: 0, // Would need to calculate from attempts table
        updated_at: new Date().toISOString()
      }
    }

    // Get top performers
    const topPerformers = await db.all(`
      SELECT alias, xp
      FROM leaderboard_entries
      WHERE timeframe = 'daily' AND date = ?
      ORDER BY xp DESC
      LIMIT 3
    `, [today])

    res.json({
      totalAttempts: stats.total_attempts,
      totalXP: stats.total_xp,
      activeUsers: stats.active_users,
      activeUsersToday: stats.active_users,
      avgAccuracy: stats.avg_accuracy,
      topPerformers: topPerformers.map(p => ({
        alias: p.alias,
        xp: p.xp
      })),
      updatedAt: stats.updated_at
    })
  } catch (error) {
    console.error('Error fetching community stats:', error)
    res.status(500).json({ error: 'Failed to fetch stats' })
  }
})

/**
 * POST /api/social/challenges/create
 * Create a new challenge
 */
router.post('/challenges/create', async (req, res) => {
  try {
    const { creatorId, challengedId, metric, targetScore, durationHours } = req.body
    const db = req.app.get('db')

    if (!db) {
      return res.status(500).json({ error: 'Database not available' })
    }

    if (!creatorId || !challengedId || !metric || !targetScore) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const challengeId = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + (durationHours || 24) * 60 * 60 * 1000).toISOString()

    await db.run(`
      INSERT INTO challenges (id, creator_id, challenged_id, metric, target_score, duration_hours, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [challengeId, creatorId, challengedId, metric, targetScore, durationHours || 24, expiresAt])

    res.json({
      challengeId,
      expiresAt,
      status: 'pending'
    })
  } catch (error) {
    console.error('Error creating challenge:', error)
    res.status(500).json({ error: 'Failed to create challenge' })
  }
})

/**
 * GET /api/social/challenges/active/:userId
 * Get active challenges for a user
 */
router.get('/challenges/active/:userId', async (req, res) => {
  try {
    const { userId } = req.params
    const db = req.app.get('db')

    if (!db) {
      return res.status(500).json({ error: 'Database not available' })
    }

    const challenges = await db.all(`
      SELECT *
      FROM challenges
      WHERE (creator_id = ? OR challenged_id = ?)
        AND status IN ('pending', 'active')
        AND datetime(expires_at) > datetime('now')
    `, [userId, userId])

    res.json({ challenges })
  } catch (error) {
    console.error('Error fetching active challenges:', error)
    res.status(500).json({ error: 'Failed to fetch challenges' })
  }
})

export default router
