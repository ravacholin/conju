import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import 'fake-indexeddb/auto'

vi.mock('../src/lib/progress/srs.js', () => ({
  updateSchedule: vi.fn().mockResolvedValue(undefined)
}))

vi.mock('../src/lib/progress/incrementalMastery.js', () => ({
  notifyNewAttempt: vi.fn()
}))

vi.mock('../src/lib/levels/userLevelProfile.js', () => ({
  recordGlobalCompetency: vi.fn().mockResolvedValue(undefined),
  refreshGlobalDynamicEvaluations: vi.fn().mockResolvedValue(undefined)
}))

vi.mock('../src/lib/levels/levelProgression.js', () => ({
  checkUserProgression: vi.fn().mockResolvedValue({ shouldPromote: false })
}))

import { exportProgressData, generateProgressReport } from '../src/lib/progress/dataExport.js'
import {
  saveAttempt,
  saveMastery,
  saveSchedule,
  deleteDB
} from '../src/lib/progress/database.js'
import { initTracking, trackAttemptSubmitted } from '../src/lib/progress/tracking.js'

const USER_A = 'user-a'
const USER_B = 'user-b'

const baseDate = new Date('2024-01-01T00:00:00Z')

const toIso = offsetMs => new Date(baseDate.getTime() + offsetMs).toISOString()

async function resetDatabase() {
  try {
    await deleteDB()
  } catch (error) {
    // Algunas implementaciones de IndexedDB lanzan si la base de datos no existe; ignoramos esos casos
    if (error?.name !== 'NotFoundError') {
      throw error
    }
  }
}

async function seedTestData() {
  await saveAttempt({
    id: 'attempt-a-1',
    userId: USER_A,
    itemId: 'item-1',
    correct: true,
    latencyMs: 320,
    timestamp: toIso(0),
    createdAt: toIso(0),
    sessionId: 'session-a-1'
  })

  await saveAttempt({
    id: 'attempt-a-2',
    userId: USER_A,
    itemId: 'item-2',
    correct: false,
    latencyMs: 410,
    timestamp: toIso(60_000),
    createdAt: toIso(60_000),
    sessionId: 'session-a-2'
  })

  await saveAttempt({
    id: 'attempt-b-1',
    userId: USER_B,
    itemId: 'item-3',
    correct: true,
    latencyMs: 505,
    timestamp: toIso(120_000),
    createdAt: toIso(120_000),
    sessionId: 'session-b-1'
  })

  await saveMastery({
    id: 'mastery-a-1',
    userId: USER_A,
    mood: 'indicative',
    tense: 'present',
    person: 'yo',
    score: 78,
    updatedAt: toIso(0)
  })

  await saveMastery({
    id: 'mastery-a-2',
    userId: USER_A,
    mood: 'indicative',
    tense: 'preterite',
    person: 'tú',
    score: 54,
    updatedAt: toIso(30_000)
  })

  await saveMastery({
    id: 'mastery-b-1',
    userId: USER_B,
    mood: 'subjunctive',
    tense: 'present',
    person: 'él',
    score: 90,
    updatedAt: toIso(45_000)
  })

  await saveSchedule({
    id: 'schedule-a-1',
    userId: USER_A,
    mood: 'indicative',
    tense: 'present',
    person: 'yo',
    nextDue: toIso(3_600_000),
    interval: 1,
    easeFactor: 2.5
  })

  await saveSchedule({
    id: 'schedule-a-2',
    userId: USER_A,
    mood: 'indicative',
    tense: 'imperfect',
    person: 'nosotros',
    nextDue: toIso(7_200_000),
    interval: 2,
    easeFactor: 2.2
  })

  await saveSchedule({
    id: 'schedule-b-1',
    userId: USER_B,
    mood: 'subjunctive',
    tense: 'present',
    person: 'ellos',
    nextDue: toIso(10_800_000),
    interval: 3,
    easeFactor: 2.8
  })
}

describe('exportación de datos filtrada por usuario', () => {
  beforeEach(async () => {
    await resetDatabase()
    vi.clearAllMocks()
  })

  afterEach(async () => {
    await resetDatabase()
  })

  it('exportProgressData sólo incluye registros del usuario solicitado', async () => {
    await seedTestData()

    const result = await exportProgressData(USER_A)

    expect(result.metadata.userId).toBe(USER_A)
    expect(result.metadata.totalAttempts).toBe(2)
    expect(result.metadata.totalMasteryRecords).toBe(2)
    expect(result.metadata.totalSchedules).toBe(2)

    expect(result.data.attempts).toHaveLength(2)
    expect(result.data.mastery).toHaveLength(2)
    expect(result.data.schedules).toHaveLength(2)

    expect(result.data.attempts.every(record => record.userId === USER_A)).toBe(true)
    expect(result.data.mastery.every(record => record.userId === USER_A)).toBe(true)
    expect(result.data.schedules.every(record => record.userId === USER_A)).toBe(true)

    expect(result.data.attempts.some(record => record.userId === USER_B)).toBe(false)
    expect(result.data.mastery.some(record => record.userId === USER_B)).toBe(false)
    expect(result.data.schedules.some(record => record.userId === USER_B)).toBe(false)
  })

  it('generateProgressReport refleja los scores calculados por trackAttemptSubmitted', async () => {
    await initTracking(USER_A)

    await trackAttemptSubmitted('attempt-generated-1', {
      correct: true,
      latencyMs: 450,
      item: {
        lemma: 'hablar',
        verbId: 'hablar',
        mood: 'indicative',
        tense: 'present',
        person: 'yo'
      },
      userAnswer: 'hablo',
      correctAnswer: 'hablo',
      errorTags: []
    })

    const report = await generateProgressReport(USER_A)

    const masteryEntry = report.data.mastery.find(record =>
      record.mood === 'indicative' &&
      record.tense === 'present' &&
      record.person === 'yo'
    )

    expect(masteryEntry).toBeDefined()
    expect(masteryEntry.score).toBeGreaterThan(0)

    const strongestArea = report.statistics.strongestAreas.find(area => area.area === 'indicative-present')
    expect(strongestArea).toBeDefined()
    expect(strongestArea.score).toBe(masteryEntry.score)
  })
})
