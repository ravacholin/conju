import { Router } from 'express'
import {
  createAccount,
  authenticateAccount,
  authenticateWithGoogle,
  createOrGetUserDevice,
  generateJWT,
  verifyJWT,
  getAccountDevices,
  mergeAccountData,
  updateAccountProfile,
  renameDevice,
  revokeDevice
} from './auth-service.js'

export function createAuthRoutes() {
  const router = Router()

  // Register new account
  router.post('/register', async (req, res) => {
    try {
      const deviceInfo = {
        userAgent: req.get('User-Agent') || 'unknown',
        ip: req.ip || req.connection.remoteAddress
      }

      const result = await createAccount({
        ...req.body,
        deviceInfo
      })

      res.status(201).json({
        success: true,
        message: 'Account created successfully',
        account: result.account,
        user: result.user,
        token: result.token
      })
    } catch (error) {
      console.error('Registration error:', error)
      res.status(400).json({
        success: false,
        error: error.message
      })
    }
  })

  // Login with email/password
  router.post('/login', async (req, res) => {
    try {
      const { email, password, deviceName } = req.body

      // Authenticate account
      const account = await authenticateAccount(email, password)

      // Get or create device/user for this login
      const deviceInfo = {
        userAgent: req.get('User-Agent') || 'unknown',
        ip: req.ip || req.connection.remoteAddress
      }

      const userDevice = createOrGetUserDevice(
        account.id,
        deviceName || 'Unknown Device',
        deviceInfo
      )

      // Generate JWT
      const token = generateJWT({
        accountId: account.id,
        userId: userDevice.userId,
        deviceId: userDevice.deviceId
      })

      res.json({
        success: true,
        message: 'Login successful',
        account,
        user: {
          // CRITICAL: Use accountId as primary id for cross-device sync consistency
          // All devices on same account will have the same user.id
          id: account.id,
          // Keep device-specific userId for device management only
          deviceUserId: userDevice.userId,
          deviceId: userDevice.deviceId,
          deviceName: userDevice.deviceName
        },
        token
      })
    } catch (error) {
      console.error('Login error:', error)
      res.status(401).json({
        success: false,
        error: error.message
      })
    }
  })

  // Google OAuth login
  router.post('/google', async (req, res) => {
    try {
      const { deviceName } = req.body

      // Authenticate with Google
      const account = await authenticateWithGoogle(req.body)

      // Get or create device/user
      const deviceInfo = {
        userAgent: req.get('User-Agent') || 'unknown',
        ip: req.ip || req.connection.remoteAddress
      }

      const userDevice = createOrGetUserDevice(
        account.id,
        deviceName || 'Unknown Device',
        deviceInfo
      )

      // Generate JWT
      const token = generateJWT({
        accountId: account.id,
        userId: userDevice.userId,
        deviceId: userDevice.deviceId
      })

      res.json({
        success: true,
        message: 'Google login successful',
        account,
        user: {
          // CRITICAL: Use accountId as primary id for cross-device sync consistency
          // All devices on same account will have the same user.id
          id: account.id,
          // Keep device-specific userId for device management only
          deviceUserId: userDevice.userId,
          deviceId: userDevice.deviceId,
          deviceName: userDevice.deviceName
        },
        token
      })
    } catch (error) {
      console.error('Google auth error:', error)
      res.status(400).json({
        success: false,
        error: error.message
      })
    }
  })

  // Get account info (protected route)
  router.get('/me', requireAuth, async (req, res) => {
    try {
      const { accountId } = req.auth

      const devices = getAccountDevices(accountId)
      const mergedData = mergeAccountData(accountId)
      const account = updateAccountProfile(accountId, {})

      res.json({
        success: true,
        account,
        devices,
        data: mergedData
      })
    } catch (error) {
      console.error('Get account info error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to get account info'
      })
    }
  })

  router.patch('/account', requireAuth, async (req, res) => {
    try {
      const { accountId } = req.auth
      const account = updateAccountProfile(accountId, req.body || {})

      res.json({
        success: true,
        account
      })
    } catch (error) {
      console.error('Update account error:', error)
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to update account'
      })
    }
  })

  router.get('/devices', requireAuth, async (req, res) => {
    try {
      const { accountId } = req.auth
      const devices = getAccountDevices(accountId)

      res.json({
        success: true,
        devices
      })
    } catch (error) {
      console.error('List devices error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to list devices'
      })
    }
  })

  router.patch('/devices/:deviceId', requireAuth, async (req, res) => {
    try {
      const { accountId, deviceId: currentDeviceId } = req.auth
      const { deviceId } = req.params
      const { deviceName } = req.body || {}

      const updatedDevice = renameDevice(accountId, deviceId, deviceName)

      if (deviceId === currentDeviceId && updatedDevice) {
        req.auth.deviceName = updatedDevice.device_name
      }

      res.json({
        success: true,
        device: updatedDevice,
        devices: getAccountDevices(accountId)
      })
    } catch (error) {
      console.error('Rename device error:', error)
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to rename device'
      })
    }
  })

  router.delete('/devices/:deviceId', requireAuth, async (req, res) => {
    try {
      const { accountId, deviceId: currentDeviceId } = req.auth
      const { deviceId } = req.params

      if (deviceId === currentDeviceId) {
        return res.status(400).json({
          success: false,
          error: 'Cannot revoke the device currently in use'
        })
      }

      revokeDevice(accountId, deviceId)

      res.json({
        success: true,
        devices: getAccountDevices(accountId)
      })
    } catch (error) {
      console.error('Revoke device error:', error)
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to revoke device'
      })
    }
  })

  // Merge data from all devices
  router.get('/data/merged', requireAuth, async (req, res) => {
    try {
      const { accountId } = req.auth
      const mergedData = mergeAccountData(accountId)

      res.json({
        success: true,
        data: mergedData,
        totalDevices: Object.keys(mergedData).length
      })
    } catch (error) {
      console.error('Merge data error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to merge data'
      })
    }
  })

  // Link anonymous account to authenticated account
  router.post('/migrate', requireAuth, async (req, res) => {
    try {
      const { anonymousUserId } = req.body
      const { accountId } = req.auth

      if (!anonymousUserId) {
        return res.status(400).json({
          success: false,
          error: 'Anonymous user ID required'
        })
      }

      // Update anonymous user to link to account
      const db = (await import('./db.js')).db
      const result = db.prepare(`
        UPDATE users
        SET account_id = ?
        WHERE id = ? AND account_id IS NULL
      `).run(accountId, anonymousUserId)

      if (result.changes === 0) {
        return res.status(404).json({
          success: false,
          error: 'Anonymous user not found or already linked'
        })
      }

      res.json({
        success: true,
        message: 'Anonymous account migrated successfully'
      })
    } catch (error) {
      console.error('Migration error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to migrate account'
      })
    }
  })

  // Multi-device data synchronization download
  router.post('/sync/download', requireAuth, async (req, res) => {
    try {
      const { accountId } = req.auth
      const accountData = mergeAccountData(accountId)

      console.log(`📥 Sync download for account ${accountId}: ${JSON.stringify({
        attempts: accountData.attempts?.length || 0,
        mastery: accountData.mastery?.length || 0,
        schedules: accountData.schedules?.length || 0,
        sessions: accountData.sessions?.length || 0
      })}`)

      res.json({
        success: true,
        data: accountData,
        timestamp: Date.now()
      })
    } catch (error) {
      console.error('Account sync download error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to download account data'
      })
    }
  })

  return router
}

// Auth middleware
export function requireAuth(req, res, next) {
  try {
    const authHeader = req.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authorization token required'
      })
    }

    const token = authHeader.slice(7)
    const decoded = verifyJWT(token)

    req.auth = decoded
    next()
  } catch (error) {
    console.error('Auth middleware error:', error)
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token'
    })
  }
}
