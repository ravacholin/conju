import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'
import { OAuth2Client } from 'google-auth-library'
import { db } from './db.js'

const JWT_SECRET = process.env.JWT_SECRET || 'spanish-conjugator-secret-key-2025'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30d'

const GOOGLE_CLIENT_IDS = (process.env.GOOGLE_CLIENT_IDS || process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || '')
  .split(',')
  .map((id) => id.trim())
  .filter(Boolean)

const googleOAuthClient = GOOGLE_CLIENT_IDS.length ? new OAuth2Client() : null

// Validation schemas
const deviceInfoSchema = z
  .object({
    userAgent: z
      .string({ invalid_type_error: 'deviceInfo.userAgent must be a string' })
      .trim()
      .min(1, 'deviceInfo.userAgent cannot be empty')
      .optional(),
    ip: z
      .string({ invalid_type_error: 'deviceInfo.ip must be a string' })
      .trim()
      .min(1, 'deviceInfo.ip cannot be empty')
      .optional()
  })
  .passthrough()

const baseRegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().nullable().optional(),
  deviceName: z.string().optional(),
})

const registerSchema = baseRegisterSchema.extend({
  deviceInfo: z
    .union([z.undefined(), z.null(), deviceInfoSchema])
    .transform((value) => value ?? {})
})

function normalizeDeviceInfo(deviceInfo) {
  const normalized = {}

  for (const [key, value] of Object.entries(deviceInfo)) {
    if (value !== undefined && value !== null && value !== '') {
      normalized[key] = value
    }
  }

  if (!normalized.userAgent) {
    normalized.userAgent = 'unknown'
  }

  return normalized
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
})

const googleAuthSchema = z.object({
  credential: z.string().min(10, 'Google credential is required'),
  deviceName: z.string().optional(),
  googleId: z.string().optional(),
  email: z.string().email().optional(),
  name: z.string().optional(),
  profile: z.object({
    googleId: z.string().optional(),
    email: z.string().email().optional(),
    name: z.string().optional(),
    emailVerified: z.boolean().optional()
  }).optional()
})

const googleAudience = GOOGLE_CLIENT_IDS.length > 1 ? GOOGLE_CLIENT_IDS : GOOGLE_CLIENT_IDS[0]

async function verifyGoogleCredential(credential) {
  if (!googleOAuthClient || !GOOGLE_CLIENT_IDS.length) {
    throw new Error('Google OAuth client ID is not configured on the server')
  }

  try {
    const ticket = await googleOAuthClient.verifyIdToken({
      idToken: credential,
      audience: googleAudience
    })

    const payload = ticket.getPayload()
    if (!payload?.sub) {
      throw new Error('Google token payload missing subject')
    }

    return payload
  } catch (error) {
    console.error('Google token verification failed:', error)
    throw new Error('Invalid Google credential')
  }
}

// Account management
export async function createAccount(data) {
  const { email, password, name, deviceName, deviceInfo } = registerSchema.parse(data)
  const normalizedDeviceInfo = normalizeDeviceInfo(deviceInfo)
  const resolvedDeviceName = deviceName || 'Unknown Device'

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
    `).run(deviceId, accountId, resolvedDeviceName, JSON.stringify(normalizedDeviceInfo), now)

    // Create user
    db.prepare(`
      INSERT INTO users (id, account_id, device_id, device_name, created_at, last_seen_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, accountId, deviceId, resolvedDeviceName, now, now)
  })()

  const account = db.prepare('SELECT id, email, name, created_at FROM accounts WHERE id = ?').get(accountId)
  const token = generateJWT({ accountId, userId, deviceId })

  return {
    account,
    user: { id: userId, deviceId, deviceName: resolvedDeviceName, deviceInfo: normalizedDeviceInfo },
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
  const parsed = googleAuthSchema.parse(data)
  const payload = await verifyGoogleCredential(parsed.credential)

  const googleId = payload.sub
  const payloadEmail = typeof payload.email === 'string' ? payload.email.toLowerCase() : null
  const fallbackEmail = parsed.profile?.email || parsed.email || null
  const email = (payloadEmail || fallbackEmail || '').toLowerCase()

  if (!email) {
    throw new Error('Google account did not provide an email address')
  }

  if (payload.email_verified === false || parsed.profile?.emailVerified === false) {
    throw new Error('Google account email must be verified')
  }

  const name = parsed.name || parsed.profile?.name || payload.name || null

  console.log('🔐 Google credential verified', {
    email,
    googleId,
    name,
    audience: payload.aud
  })

  // First, try to find by Google ID
  let account = db.prepare('SELECT id, email, name, created_at FROM accounts WHERE google_id = ?').get(googleId)

  if (!account) {
    // Try to find existing account by email (for linking)
    const existingAccount = db.prepare('SELECT id, email, name, created_at FROM accounts WHERE LOWER(email) = ?').get(email)

    if (existingAccount) {
      // Link Google to existing account
      console.log(`🔗 Linking Google account to existing email: ${email}`)
      const now = Date.now()

      db.prepare(`
        UPDATE accounts
        SET google_id = ?, name = COALESCE(?, name), updated_at = ?
        WHERE id = ?
      `).run(googleId, name, now, existingAccount.id)

      account = { ...existingAccount, name: name || existingAccount.name }
    } else {
      // Create new account with Google
      console.log(`➕ Creating new Google account: ${email}`)
      const accountId = uuidv4()
      const now = Date.now()

      db.prepare(`
        INSERT INTO accounts (id, email, google_id, name, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(accountId, email, googleId, name, now, now)

      account = { id: accountId, email, name, created_at: now }
    }
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
  } catch {
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

export function updateAccountProfile(accountId, updates = {}) {
  const allowedFields = ['name']
  const fields = Object.keys(updates).filter((key) => allowedFields.includes(key) && updates[key] !== undefined && updates[key] !== null)

  if (fields.length === 0) {
    return db.prepare('SELECT id, email, name, created_at, updated_at FROM accounts WHERE id = ?').get(accountId)
  }

  const now = Date.now()
  const setClause = fields.map((field) => `${field} = ?`).join(', ')
  const values = fields.map((field) => updates[field])

  db.prepare(`
    UPDATE accounts
    SET ${setClause}, updated_at = ?
    WHERE id = ?
  `).run(...values, now, accountId)

  return db.prepare('SELECT id, email, name, created_at, updated_at FROM accounts WHERE id = ?').get(accountId)
}

export function renameDevice(accountId, deviceId, deviceName) {
  const trimmedName = (deviceName || '').trim()
  if (!trimmedName) {
    throw new Error('Device name is required')
  }

  const result = db.prepare(`
    UPDATE user_devices
    SET device_name = ?
    WHERE id = ? AND account_id = ?
  `).run(trimmedName, deviceId, accountId)

  if (result.changes === 0) {
    throw new Error('Device not found')
  }

  db.prepare(`
    UPDATE users
    SET device_name = ?
    WHERE device_id = ?
  `).run(trimmedName, deviceId)

  return db.prepare(`
    SELECT ud.id, ud.device_name, ud.last_sync_at, ud.created_at,
           u.id as user_id, u.last_seen_at
    FROM user_devices ud
    LEFT JOIN users u ON u.device_id = ud.id
    WHERE ud.id = ? AND ud.account_id = ?
  `).get(deviceId, accountId)
}

export function revokeDevice(accountId, deviceId) {
  const device = db.prepare(`
    SELECT id
    FROM user_devices
    WHERE id = ? AND account_id = ?
  `).get(deviceId, accountId)

  if (!device) {
    throw new Error('Device not found')
  }

  db.prepare('DELETE FROM user_devices WHERE id = ? AND account_id = ?').run(deviceId, accountId)
  // Associated users will have device_id set to NULL via foreign key constraint
  return true
}

export function mergeAccountData(accountId) {
  const users = db.prepare('SELECT id FROM users WHERE account_id = ?').all(accountId)
  const userIds = users.map(u => u.id)

  if (userIds.length === 0) return { attempts: [], mastery: [], schedules: [] }

  const placeholders = userIds.map(() => '?').join(',')

  const attempts = db.prepare(`
    SELECT payload FROM attempts WHERE user_id IN (${placeholders})
  `).all(...userIds).map(r => JSON.parse(r.payload))

  const mastery = db.prepare(`
    SELECT payload FROM mastery WHERE user_id IN (${placeholders})
  `).all(...userIds).map(r => JSON.parse(r.payload))

  const schedules = db.prepare(`
    SELECT payload FROM schedules WHERE user_id IN (${placeholders})
  `).all(...userIds).map(r => JSON.parse(r.payload))

  const mergedMastery = new Map()
  mastery.forEach(m => {
    const key = `${m.verbId}|${m.mood}|${m.tense}|${m.person}`
    if (!mergedMastery.has(key) || new Date(m.updatedAt) > new Date(mergedMastery.get(key).updatedAt)) {
      mergedMastery.set(key, m)
    }
  })

  const mergedSchedules = new Map()
  schedules.forEach(s => {
    const key = `${s.verbId}|${s.mood}|${s.tense}|${s.person}`
    if (!mergedSchedules.has(key) || new Date(s.updatedAt) > new Date(mergedSchedules.get(key).updatedAt)) {
      mergedSchedules.set(key, s)
    }
  })

  return {
    attempts,
    mastery: Array.from(mergedMastery.values()),
    schedules: Array.from(mergedSchedules.values())
  }
}
