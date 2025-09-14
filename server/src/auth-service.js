import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'
import { db } from './db.js'

const JWT_SECRET = process.env.JWT_SECRET || 'spanish-conjugator-secret-key-2025'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30d'

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().nullable().optional(),
  deviceName: z.string().optional()
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
})

const googleAuthSchema = z.object({
  googleId: z.string(),
  email: z.string().email(),
  name: z.string(),
  deviceName: z.string().optional()
})

// Account management
export async function createAccount(data) {
  const { email, password, name, deviceName } = registerSchema.parse(data)

  // Check if email already exists
  const existing = db.prepare('SELECT id FROM accounts WHERE email = ?').get(email)
  if (existing) {
    throw new Error('Email already registered')
  }

  const accountId = uuidv4()
  const deviceId = uuidv4()
  const userId = uuidv4()
  const now = Date.now()

  const hashedPassword = await bcrypt.hash(password, 12)

  // Create account, device, and user in transaction
  db.transaction(() => {
    // Create account
    db.prepare(`
      INSERT INTO accounts (id, email, password_hash, name, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(accountId, email, hashedPassword, name || null, now, now)

    // Create device
    db.prepare(`
      INSERT INTO user_devices (id, account_id, device_name, device_info, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(deviceId, accountId, deviceName || 'Unknown Device', JSON.stringify({ userAgent: 'unknown' }), now)

    // Create user
    db.prepare(`
      INSERT INTO users (id, account_id, device_id, device_name, created_at, last_seen_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, accountId, deviceId, deviceName || 'Unknown Device', now, now)
  })()

  const account = db.prepare('SELECT id, email, name, created_at FROM accounts WHERE id = ?').get(accountId)
  const token = generateJWT({ accountId, userId, deviceId })

  return {
    account,
    user: { id: userId, deviceId, deviceName },
    token
  }
}

export async function authenticateAccount(email, password) {
  const { email: validEmail, password: validPassword } = loginSchema.parse({ email, password })

  const account = db.prepare(`
    SELECT id, email, name, password_hash, created_at
    FROM accounts
    WHERE email = ?
  `).get(validEmail)

  if (!account) {
    throw new Error('Invalid email or password')
  }

  const isValidPassword = await bcrypt.compare(validPassword, account.password_hash)
  if (!isValidPassword) {
    throw new Error('Invalid email or password')
  }

  return {
    id: account.id,
    email: account.email,
    name: account.name,
    created_at: account.created_at
  }
}

export async function authenticateWithGoogle(data) {
  const { googleId, email, name, deviceName } = googleAuthSchema.parse(data)

  let account = db.prepare('SELECT id, email, name, created_at FROM accounts WHERE google_id = ?').get(googleId)

  if (!account) {
    // Create new account with Google
    const accountId = uuidv4()
    const now = Date.now()

    db.prepare(`
      INSERT INTO accounts (id, email, google_id, name, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(accountId, email, googleId, name, now, now)

    account = { id: accountId, email, name, created_at: now }
  }

  return account
}

export function createOrGetUserDevice(accountId, deviceName = 'Unknown Device', deviceInfo = {}) {
  // Try to find existing device
  let device = db.prepare(`
    SELECT id, device_name, last_sync_at
    FROM user_devices
    WHERE account_id = ? AND device_name = ?
  `).get(accountId, deviceName)

  if (!device) {
    // Create new device
    const deviceId = uuidv4()
    const now = Date.now()

    db.prepare(`
      INSERT INTO user_devices (id, account_id, device_name, device_info, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(deviceId, accountId, deviceName, JSON.stringify(deviceInfo), now)

    device = { id: deviceId, device_name: deviceName, last_sync_at: null }
  }

  // Create or update user for this device
  let user = db.prepare('SELECT id FROM users WHERE account_id = ? AND device_id = ?').get(accountId, device.id)

  if (!user) {
    const userId = uuidv4()
    const now = Date.now()

    db.prepare(`
      INSERT INTO users (id, account_id, device_id, device_name, created_at, last_seen_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, accountId, device.id, deviceName, now, now)

    user = { id: userId }
  }

  return {
    userId: user.id,
    deviceId: device.id,
    deviceName: device.device_name
  }
}

export function generateJWT(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

export function verifyJWT(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    throw new Error('Invalid or expired token')
  }
}

export function getAccountDevices(accountId) {
  return db.prepare(`
    SELECT ud.id, ud.device_name, ud.last_sync_at, ud.created_at,
           u.id as user_id, u.last_seen_at
    FROM user_devices ud
    LEFT JOIN users u ON u.device_id = ud.id
    WHERE ud.account_id = ?
    ORDER BY ud.created_at DESC
  `).all(accountId)
}

export function mergeAccountData(accountId) {
  // Get all users for this account
  const users = db.prepare('SELECT id FROM users WHERE account_id = ?').all(accountId)
  const userIds = users.map(u => u.id)

  if (userIds.length === 0) return { attempts: [], mastery: [], schedules: [] }

  const placeholders = userIds.map(() => '?').join(',')

  // Merge all data from all devices
  const attempts = db.prepare(`
    SELECT * FROM attempts
    WHERE user_id IN (${placeholders})
    ORDER BY created_at DESC
  `).all(...userIds)

  const mastery = db.prepare(`
    SELECT * FROM mastery
    WHERE user_id IN (${placeholders})
    ORDER BY updated_at DESC
  `).all(...userIds)

  const schedules = db.prepare(`
    SELECT * FROM schedules
    WHERE user_id IN (${placeholders})
    ORDER BY next_due ASC
  `).all(...userIds)

  return {
    attempts: attempts.map(a => JSON.parse(a.payload)),
    mastery: mastery.map(m => JSON.parse(m.payload)),
    schedules: schedules.map(s => JSON.parse(s.payload))
  }
}