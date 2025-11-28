import { test, expect } from '@playwright/test'
import { getMasterySnapshotForUser } from '../../src/lib/progress/mastery.js'

const baseAttempt = {
  mood: 'indicative',
  tense: 'pres',
  person: '1s',
  verbId: 'hablar',
  lemma: 'hablar'
}

test.describe('Mastery engine integration', () => {
  test('aggregates mastery snapshots via mastery module', async () => {
    const now = new Date().toISOString()
    const attempts = [
      { ...baseAttempt, userId: 'user-master', itemId: 'item-1', correct: true, hintsUsed: 0, createdAt: now },
      { ...baseAttempt, userId: 'user-master', itemId: 'item-1', correct: false, hintsUsed: 0, createdAt: now },
      { ...baseAttempt, userId: 'user-master', itemId: 'item-1', correct: true, hintsUsed: 1, createdAt: now }
    ]

    const masteryRecords = await getMasterySnapshotForUser('user-master', { attempts })

    expect(masteryRecords).toHaveLength(1)
    const record = masteryRecords[0]

    expect(record.score).toBeCloseTo(61.67, 1)
    expect(record.n).toBe(3)
    expect(record.weightedAttempts).toBeCloseTo(3, 1)
    expect(record.person).toBe('1s')
    expect(record.id).toContain('indicative')
  })
})
