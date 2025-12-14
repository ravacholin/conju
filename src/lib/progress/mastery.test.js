import { describe, expect, it } from 'vitest'
import { getMasterySnapshotForUser } from './mastery.js'

const baseAttempt = {
  mood: 'indicative',
  tense: 'pres',
  person: '1s',
  verbId: 'hablar',
  lemma: 'hablar'
}

describe('mastery', () => {
  it('aggregates mastery snapshots from attempts', async () => {
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

