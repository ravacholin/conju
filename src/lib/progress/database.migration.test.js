import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'

import {
  initDB,
  deleteDB,
  saveAttempt,
  saveMastery,
  saveSchedule,
  getAttemptsByUser,
  getMasteryByUser,
  getByIndex,
  migrateUserIdInLocalDB,
  validateUserIdMigration,
  getUser
} from './database.js'
import { STORAGE_CONFIG } from './config.js'

describe('migrateUserIdInLocalDB', () => {
  const oldUserId = 'user-old-123'
  const newUserId = 'user-new-456'

  beforeEach(async () => {
    // Reset DB between tests
    try { await deleteDB() } catch {}
    await initDB()
  })

  it('preserves attempts, mastery and schedules for the new user and clears old user data', async () => {
    // Seed attempts (ids do not encode user)
    await saveAttempt({
      id: 'attempt-1',
      userId: oldUserId,
      sessionId: 's1',
      itemId: 'item-1',
      mood: 'indicative',
      tense: 'present',
      person: 'yo',
      verbId: 'hablar',
      correct: true,
      createdAt: new Date(Date.now() - 1000)
    })
    await saveAttempt({
      id: 'attempt-2',
      userId: oldUserId,
      sessionId: 's1',
      itemId: 'item-1',
      mood: 'indicative',
      tense: 'present',
      person: 'yo',
      verbId: 'hablar',
      correct: false,
      createdAt: new Date()
    })

    // Seed mastery (id encodes user)
    await saveMastery({
      id: `${oldUserId}|indicative|present|yo`,
      userId: oldUserId,
      mood: 'indicative',
      tense: 'present',
      person: 'yo',
      score: 42,
      attempts: 3,
      updatedAt: new Date(Date.now() - 2000)
    })

    // Seed schedule (id encodes user)
    await saveSchedule({
      id: `${oldUserId}|indicative|present|yo`,
      userId: oldUserId,
      mood: 'indicative',
      tense: 'present',
      person: 'yo',
      interval: 1,
      reps: 1,
      nextDue: new Date(Date.now() + 24 * 3600 * 1000),
      updatedAt: new Date(Date.now() - 1000)
    })

    // Execute migration
    const stats = await migrateUserIdInLocalDB(oldUserId, newUserId)
    expect(stats.errors.length).toBe(0)

    // Old user should have no data
    expect((await getAttemptsByUser(oldUserId)).length).toBe(0)
    expect((await getMasteryByUser(oldUserId)).length).toBe(0)
    expect((await getByIndex(STORAGE_CONFIG.STORES.SCHEDULES, 'userId', oldUserId)).length).toBe(0)

    // New user should see the migrated data
    const newAttempts = await getAttemptsByUser(newUserId)
    const newMastery = await getMasteryByUser(newUserId)
    const newSchedules = await getByIndex(STORAGE_CONFIG.STORES.SCHEDULES, 'userId', newUserId)

    expect(newAttempts.length).toBe(2)
    expect(newMastery.length).toBe(1)
    expect(newSchedules.length).toBe(1)

    // Attempts should be unsynced to allow upload
    expect(newAttempts.every(a => !a.syncedAt)).toBe(true)

    // Mastery and schedules should reflect new userId and the original id
    expect(newMastery[0].userId).toBe(newUserId)
    expect(newMastery[0].id).toBe(`${oldUserId}|indicative|present|yo`)
    expect(newSchedules[0].userId).toBe(newUserId)
    expect(newSchedules[0].id).toBe(`${oldUserId}|indicative|present|yo`)

    // Validation helper should pass
    const validation = await validateUserIdMigration(oldUserId, newUserId)
    expect(validation.valid).toBe(true)
  })

  // New test case: fresh device with no local data
  it('handles fresh device login with no local data correctly', async () => {
    // No data seeded - simulating a completely fresh device

    // Execute migration (should handle gracefully with no data)
    const stats = await migrateUserIdInLocalDB(oldUserId, newUserId)
    
    // Should have no errors and 0 migrated records
    expect(stats.errors.length).toBe(0)
    expect(stats.migrated).toBe(0)

    // Validation should pass for zero records case
    const validation = await validateUserIdMigration(oldUserId, newUserId)
    
    // Fix: Migrations with zero records should be valid
    expect(validation.valid).toBe(true)
    expect(validation.totalRemaining).toBe(0)
    expect(validation.totalNew).toBe(0)
    
    // No data should exist for either user
    expect((await getAttemptsByUser(oldUserId)).length).toBe(0)
    expect((await getMasteryByUser(oldUserId)).length).toBe(0)
    expect((await getByIndex(STORAGE_CONFIG.STORES.SCHEDULES, 'userId', oldUserId)).length).toBe(0)
    
    expect((await getAttemptsByUser(newUserId)).length).toBe(0)
    expect((await getMasteryByUser(newUserId)).length).toBe(0)
    expect((await getByIndex(STORAGE_CONFIG.STORES.SCHEDULES, 'userId', newUserId)).length).toBe(0)
  })
})

