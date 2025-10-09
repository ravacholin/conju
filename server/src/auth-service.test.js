import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { rmSync } from 'node:fs'
import { join } from 'node:path'

const TEST_DB_DIR = join(process.cwd(), '.tmp-test-db-auth-service')

let db
let migrate
let createAccount

beforeAll(async () => {
  rmSync(TEST_DB_DIR, { recursive: true, force: true })
  process.env.DB_DIR = TEST_DB_DIR
  ;({ db, migrate } = await import('./db.js'))
  migrate()
  ;({ createAccount } = await import('./auth-service.js'))
})

beforeEach(() => {
  db.exec('DELETE FROM users; DELETE FROM user_devices; DELETE FROM accounts;')
})

afterAll(() => {
  db.close()
  rmSync(TEST_DB_DIR, { recursive: true, force: true })
})

describe('createAccount deviceInfo handling', () => {
  it('persists validated deviceInfo on registration', async () => {
    const deviceInfo = {
      userAgent: 'Mozilla/5.0',
      ip: ' 192.168.1.1 ',
      extra: 'value'
    }

    const result = await createAccount({
      email: 'device-info@example.com',
      password: 'password123',
      name: 'Device Info User',
      deviceName: 'Test Device',
      deviceInfo
    })

    expect(result.user.deviceInfo).toEqual({
      userAgent: 'Mozilla/5.0',
      ip: '192.168.1.1',
      extra: 'value'
    })

    const storedDevice = db
      .prepare('SELECT device_info FROM user_devices WHERE id = ?')
      .get(result.user.deviceId)

    expect(storedDevice).toBeTruthy()
    expect(JSON.parse(storedDevice.device_info)).toEqual({
      userAgent: 'Mozilla/5.0',
      ip: '192.168.1.1',
      extra: 'value'
    })
  })

  it('applies a default userAgent when deviceInfo is omitted', async () => {
    const result = await createAccount({
      email: 'no-device-info@example.com',
      password: 'password123',
      name: 'No Device Info User',
      deviceName: 'Another Device'
    })

    expect(result.user.deviceInfo).toEqual({ userAgent: 'unknown' })

    const storedDevice = db
      .prepare('SELECT device_info FROM user_devices WHERE id = ?')
      .get(result.user.deviceId)

    expect(JSON.parse(storedDevice.device_info)).toEqual({ userAgent: 'unknown' })
  })

  it('rejects invalid deviceInfo payloads', async () => {
    await expect(
      createAccount({
        email: 'invalid-device-info@example.com',
        password: 'password123',
        deviceInfo: { userAgent: '   ' }
      })
    ).rejects.toThrow('deviceInfo.userAgent cannot be empty')
  })
})
