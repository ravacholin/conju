import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const tempDir = mkdtempSync(join(tmpdir(), 'auth-service-test-'))
process.env.DB_DIR = tempDir

const { db, migrate } = await import('../../server/src/db.js')
const { createAccount, authenticateAccount } = await import('../../server/src/auth-service.js')

describe('auth-service email normalization', () => {
  beforeAll(() => {
    migrate()
  })

  afterAll(() => {
    db.close()
    rmSync(tempDir, { recursive: true, force: true })
  })

  it('stores new accounts with lowercase emails and prevents case-variant duplicates', async () => {
    const result = await createAccount({
      email: 'User@Example.com',
      password: 'test-password',
      name: 'Test User'
    })

    expect(result.account.email).toBe('user@example.com')

    await expect(
      createAccount({
        email: 'USER@example.com',
        password: 'another-password',
        name: 'Duplicate User'
      })
    ).rejects.toThrow('Email already registered')
  })

  it('authenticates regardless of email casing', async () => {
    const account = await authenticateAccount('USER@EXAMPLE.COM', 'test-password')
    expect(account.email).toBe('user@example.com')
  })
})
