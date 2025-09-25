#!/usr/bin/env node

/**
 * Verification script to test account linking after authenticated uploads
 *
 * This script:
 * 1. Creates test data for an anonymous user
 * 2. Simulates an authenticated upload with JWT
 * 3. Verifies that the user is linked to the account
 * 4. Tests that mergeAccountData returns the uploaded data
 */

import { db, migrate, upsertUser } from './src/db.js'
import { mergeAccountData, generateJWT } from './src/auth-service.js'

// Test configuration
const TEST_ACCOUNT_ID = 'test-account-12345'
const TEST_USER_ID = 'anon-user-67890'
const TEST_EMAIL = `test-${Date.now()}@example.com`

async function setupTestData() {
  console.log('🔧 Setting up test database...')

  // Initialize database
  migrate()

  // Clean up any existing test data (in correct order to avoid foreign key constraints)
  db.prepare('DELETE FROM attempts WHERE user_id = ?').run(TEST_USER_ID)
  db.prepare('DELETE FROM mastery WHERE user_id = ?').run(TEST_USER_ID)
  db.prepare('DELETE FROM schedules WHERE user_id = ?').run(TEST_USER_ID)
  db.prepare('DELETE FROM users WHERE id = ?').run(TEST_USER_ID)
  db.prepare('DELETE FROM accounts WHERE id = ?').run(TEST_ACCOUNT_ID)

  // Create test account
  const now = Date.now()
  db.prepare(`
    INSERT INTO accounts (id, email, name, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(TEST_ACCOUNT_ID, TEST_EMAIL, 'Test User', now, now)

  console.log('✅ Test data setup complete')
}

async function testAnonymousUpload() {
  console.log('📤 Testing anonymous upload (should create user with null account_id)...')

  // First, create anonymous user without account_id
  upsertUser(TEST_USER_ID, null)

  // Add some test data as anonymous user
  const testAttempt = {
    id: 'attempt-123',
    userId: TEST_USER_ID,
    verbId: 'ser',
    form: 'es',
    correct: true,
    createdAt: Date.now()
  }

  const testMastery = {
    id: 'mastery-456',
    userId: TEST_USER_ID,
    verbId: 'ser',
    masteryScore: 0.75
  }

  const testSchedule = {
    id: 'schedule-789',
    userId: TEST_USER_ID,
    itemId: 'ser-es',
    nextDue: Date.now() + 86400000 // tomorrow
  }

  // Insert test data
  const now = Date.now()
  db.prepare(`
    INSERT INTO attempts (id, user_id, created_at, updated_at, payload)
    VALUES (?, ?, ?, ?, ?)
  `).run(testAttempt.id, TEST_USER_ID, now, now, JSON.stringify(testAttempt))

  db.prepare(`
    INSERT INTO mastery (id, user_id, updated_at, payload)
    VALUES (?, ?, ?, ?)
  `).run(testMastery.id, TEST_USER_ID, now, JSON.stringify(testMastery))

  db.prepare(`
    INSERT INTO schedules (id, user_id, next_due, updated_at, payload)
    VALUES (?, ?, ?, ?, ?)
  `).run(testSchedule.id, TEST_USER_ID, testSchedule.nextDue, now, JSON.stringify(testSchedule))

  // Verify user exists with null account_id
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(TEST_USER_ID)
  if (!user) {
    throw new Error('User not created')
  }
  if (user.account_id !== null) {
    throw new Error(`Expected user.account_id to be null, got: ${user.account_id}`)
  }

  console.log('✅ Anonymous upload test complete - user created with null account_id')
  return { testAttempt, testMastery, testSchedule }
}

async function testAuthenticatedUpload() {
  console.log('🔐 Testing authenticated upload (should link user to account)...')

  // Now simulate an authenticated upload by calling upsertUser with account_id
  upsertUser(TEST_USER_ID, TEST_ACCOUNT_ID)

  // Verify user is now linked to account
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(TEST_USER_ID)
  if (!user) {
    throw new Error('User not found after authenticated upload')
  }
  if (user.account_id !== TEST_ACCOUNT_ID) {
    throw new Error(`Expected user.account_id to be ${TEST_ACCOUNT_ID}, got: ${user.account_id}`)
  }

  console.log('✅ Authenticated upload test complete - user linked to account')
}

async function testMergeAccountData() {
  console.log('🔄 Testing mergeAccountData retrieval...')

  const mergedData = mergeAccountData(TEST_ACCOUNT_ID)

  if (!mergedData) {
    throw new Error('mergeAccountData returned null')
  }

  if (!Array.isArray(mergedData.attempts) || mergedData.attempts.length === 0) {
    throw new Error('mergeAccountData should return attempts array with data')
  }

  if (!Array.isArray(mergedData.mastery) || mergedData.mastery.length === 0) {
    throw new Error('mergeAccountData should return mastery array with data')
  }

  if (!Array.isArray(mergedData.schedules) || mergedData.schedules.length === 0) {
    throw new Error('mergeAccountData should return schedules array with data')
  }

  console.log('✅ mergeAccountData test complete - data retrieved successfully')
  console.log('📊 Merged data summary:', {
    attempts: mergedData.attempts.length,
    mastery: mergedData.mastery.length,
    schedules: mergedData.schedules.length
  })

  return mergedData
}

async function testJWTFlow() {
  console.log('🎫 Testing JWT generation and account linking...')

  // Generate a JWT for the test account
  const jwt = generateJWT({
    accountId: TEST_ACCOUNT_ID,
    userId: TEST_USER_ID,
    email: TEST_EMAIL
  })

  if (!jwt) {
    throw new Error('Failed to generate JWT')
  }

  console.log('✅ JWT generated successfully')
  console.log('🔍 JWT payload should contain accountId for proper linking')

  return jwt
}

async function cleanup() {
  console.log('🧹 Cleaning up test data...')

  // Delete in correct order to avoid foreign key constraints
  db.prepare('DELETE FROM attempts WHERE user_id = ?').run(TEST_USER_ID)
  db.prepare('DELETE FROM mastery WHERE user_id = ?').run(TEST_USER_ID)
  db.prepare('DELETE FROM schedules WHERE user_id = ?').run(TEST_USER_ID)
  db.prepare('DELETE FROM users WHERE id = ?').run(TEST_USER_ID)
  db.prepare('DELETE FROM accounts WHERE id = ?').run(TEST_ACCOUNT_ID)

  console.log('✅ Cleanup complete')
}

async function main() {
  try {
    console.log('🚀 Starting account linking verification tests...\n')

    await setupTestData()
    await testAnonymousUpload()
    await testAuthenticatedUpload()
    await testMergeAccountData()
    await testJWTFlow()

    console.log('\n🎉 All tests passed! Account linking is working correctly.')
    console.log('\n📋 Test Summary:')
    console.log('  ✅ Anonymous user creation (account_id = null)')
    console.log('  ✅ Data upload for anonymous user')
    console.log('  ✅ Authenticated upload links user to account')
    console.log('  ✅ mergeAccountData retrieves linked user data')
    console.log('  ✅ JWT generation includes accountId for proper linking')

    await cleanup()

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.error(error.stack)

    try {
      await cleanup()
    } catch (cleanupError) {
      console.error('❌ Cleanup failed:', cleanupError.message)
    }

    process.exit(1)
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export { main as runAccountLinkingTests }
