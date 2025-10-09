import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import { createAccount, authenticateAccount } from '../../server/src/auth-service.js'
import { db } from '../../server/src/db.js'

describe('Email Normalization', () => {
  beforeEach(() => {
    // Clean up accounts table before each test
    db.prepare('DELETE FROM accounts').run()
    db.prepare('DELETE FROM user_devices').run()
    db.prepare('DELETE FROM users').run()
  })

  afterAll(() => {
    // Final cleanup
    db.prepare('DELETE FROM accounts').run()
    db.prepare('DELETE FROM user_devices').run()
    db.prepare('DELETE FROM users').run()
  })

  it('should normalize email to lowercase during registration', async () => {
    const result = await createAccount({
      email: 'Test.User@Example.COM',
      password: 'password123',
      name: 'Test User',
      deviceName: 'Test Device'
    })

    expect(result.account.email).toBe('test.user@example.com')

    // Verify in database
    const account = db.prepare('SELECT email FROM accounts WHERE id = ?').get(result.account.id)
    expect(account.email).toBe('test.user@example.com')
  })

  it('should prevent duplicate accounts with different email casing', async () => {
    // Create first account
    await createAccount({
      email: 'user@example.com',
      password: 'password123'
    })

    // Try to create duplicate with different casing
    await expect(async () => {
      await createAccount({
        email: 'User@Example.COM',
        password: 'different123'
      })
    }).rejects.toThrow('Email already registered')
  })

  it('should allow login with any email casing', async () => {
    // Register with lowercase
    await createAccount({
      email: 'user@example.com',
      password: 'password123',
      deviceName: 'Device 1'
    })

    // Login with uppercase
    const result1 = await authenticateAccount('USER@EXAMPLE.COM', 'password123')
    expect(result1.email).toBe('user@example.com')

    // Login with mixed case
    const result2 = await authenticateAccount('User@Example.Com', 'password123')
    expect(result2.email).toBe('user@example.com')

    // Login with exact case
    const result3 = await authenticateAccount('user@example.com', 'password123')
    expect(result3.email).toBe('user@example.com')
  })

  it('should handle deviceInfo correctly during registration', async () => {
    const deviceInfo = {
      userAgent: 'Mozilla/5.0',
      ip: '192.168.1.1',
      platform: 'macOS',
      browser: 'Chrome'
    }

    const result = await createAccount({
      email: 'test@example.com',
      password: 'password123',
      deviceName: 'My Device',
      deviceInfo
    })

    // Verify device info is stored
    const device = db.prepare('SELECT device_info FROM user_devices WHERE id = ?')
      .get(result.user.deviceId)

    const storedInfo = JSON.parse(device.device_info)
    expect(storedInfo).toEqual(deviceInfo)
  })

  it('should use default deviceInfo when not provided', async () => {
    const result = await createAccount({
      email: 'test2@example.com',
      password: 'password123',
      deviceName: 'My Device'
    })

    // Verify default device info is stored
    const device = db.prepare('SELECT device_info FROM user_devices WHERE id = ?')
      .get(result.user.deviceId)

    const storedInfo = JSON.parse(device.device_info)
    expect(storedInfo).toEqual({ userAgent: 'unknown' })
  })

  it('should reject invalid email formats', async () => {
    await expect(async () => {
      await createAccount({
        email: 'not-an-email',
        password: 'password123'
      })
    }).rejects.toThrow()

    await expect(async () => {
      await createAccount({
        email: '@example.com',
        password: 'password123'
      })
    }).rejects.toThrow()
  })

  it('should fail authentication with wrong password regardless of email casing', async () => {
    await createAccount({
      email: 'user@example.com',
      password: 'correctpassword'
    })

    await expect(async () => {
      await authenticateAccount('user@example.com', 'wrongpassword')
    }).rejects.toThrow('Invalid email or password')

    await expect(async () => {
      await authenticateAccount('USER@EXAMPLE.COM', 'wrongpassword')
    }).rejects.toThrow('Invalid email or password')
  })
})
