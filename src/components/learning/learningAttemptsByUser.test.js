import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import 'fake-indexeddb/auto'

import { 
  initProgressSystem,
  resetProgressSystem,
  getCurrentUserId
} from '../../lib/progress/index.js'

import {
  trackAttemptStarted,
  trackAttemptSubmitted
} from '../../lib/progress/tracking.js'

import { getAttemptsByUser, deleteDB } from '../../lib/progress/database.js'

describe('Learning attempts are recorded per user', () => {
  beforeAll(async () => {
    // Ensure clean DB before tests
    await deleteDB().catch(() => {})
  })

  afterAll(async () => {
    await deleteDB().catch(() => {})
  })

  it('records attempts under the correct userId and separates between users', async () => {
    // Initialize as User A
    const userA = 'test-user-A'
    const idA = await initProgressSystem(userA)
    expect(idA).toBe(userA)
    expect(getCurrentUserId()).toBe(userA)

    // Record an attempt for User A
    const itemA = { id: 'dummy-item-A', lemma: 'hablar', mood: 'indicative', tense: 'pres', person: '1s', value: 'hablo' }
    const attemptIdA = trackAttemptStarted(itemA)
    await trackAttemptSubmitted(attemptIdA, {
      correct: true,
      latencyMs: 500,
      hintsUsed: 0,
      errorTags: [],
      userAnswer: 'hablo',
      correctAnswer: 'hablo',
      item: itemA
    })

    // Switch to User B
    await resetProgressSystem()
    const userB = 'test-user-B'
    const idB = await initProgressSystem(userB)
    expect(idB).toBe(userB)
    expect(getCurrentUserId()).toBe(userB)

    // Record an attempt for User B
    const itemB = { id: 'dummy-item-B', lemma: 'comer', mood: 'indicative', tense: 'pres', person: '2s_tu', value: 'comes' }
    const attemptIdB = trackAttemptStarted(itemB)
    await trackAttemptSubmitted(attemptIdB, {
      correct: false,
      latencyMs: 900,
      hintsUsed: 1,
      errorTags: ['terminación_verbal'],
      userAnswer: 'come',
      correctAnswer: 'comes',
      item: itemB
    })

    // Verify per-user isolation
    const attemptsA = await getAttemptsByUser(userA)
    const attemptsB = await getAttemptsByUser(userB)

    expect(attemptsA.length).toBeGreaterThanOrEqual(1)
    expect(attemptsB.length).toBeGreaterThanOrEqual(1)

    expect(attemptsA.every(a => a.userId === userA)).toBe(true)
    expect(attemptsB.every(a => a.userId === userB)).toBe(true)

    // Ensure no cross-contamination
    const idsA = new Set(attemptsA.map(a => a.id))
    const overlap = attemptsB.some(b => idsA.has(b.id))
    expect(overlap).toBe(false)
  })
})

