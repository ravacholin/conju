import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { performance } from 'node:perf_hooks'

import {
  deleteDB,
  getDueSchedules,
  initDB,
  saveSchedule
} from './database.js'
import { STORAGE_CONFIG } from './config.js'

const BASE_MOOD = 'indicative'
const BASE_TENSE = 'present'
const BASE_PERSON = 'yo'

describe('schedules index and queries', () => {
  beforeEach(async () => {
    try {
      await deleteDB()
    } catch (error) {
      // Ignorar errores cuando la DB aún no existe
    }
    await initDB()
  })

  it('crea el índice compuesto userId-nextDue durante la migración', async () => {
    const db = await initDB()
    const tx = db.transaction(STORAGE_CONFIG.STORES.SCHEDULES, 'readonly')
    const store = tx.objectStore(STORAGE_CONFIG.STORES.SCHEDULES)

    expect(store.indexNames.contains('userId-nextDue')).toBe(true)

    await tx.done
  })

  it('obtiene únicamente los schedules vencidos del usuario utilizando el nuevo índice', async () => {
    const userId = 'user-alpha'
    const otherUserId = 'user-beta'
    const cutoff = new Date('2024-01-10T00:00:00.000Z')

    await saveSchedule({
      id: `${userId}|${BASE_MOOD}|${BASE_TENSE}|${BASE_PERSON}|1`,
      userId,
      mood: BASE_MOOD,
      tense: BASE_TENSE,
      person: BASE_PERSON,
      interval: 1,
      reps: 1,
      nextDue: new Date('2024-01-05T10:00:00.000Z')
    })

    await saveSchedule({
      id: `${userId}|${BASE_MOOD}|${BASE_TENSE}|${BASE_PERSON}|2`,
      userId,
      mood: BASE_MOOD,
      tense: BASE_TENSE,
      person: BASE_PERSON,
      interval: 2,
      reps: 3,
      nextDue: new Date('2024-01-09T12:00:00.000Z')
    })

    await saveSchedule({
      id: `${userId}|${BASE_MOOD}|${BASE_TENSE}|${BASE_PERSON}|3`,
      userId,
      mood: BASE_MOOD,
      tense: BASE_TENSE,
      person: BASE_PERSON,
      interval: 4,
      reps: 2,
      nextDue: new Date('2024-02-01T00:00:00.000Z')
    })

    await saveSchedule({
      id: `${otherUserId}|${BASE_MOOD}|${BASE_TENSE}|${BASE_PERSON}|1`,
      userId: otherUserId,
      mood: BASE_MOOD,
      tense: BASE_TENSE,
      person: BASE_PERSON,
      interval: 1,
      reps: 1,
      nextDue: new Date('2024-01-03T08:00:00.000Z')
    })

    const dueSchedules = await getDueSchedules(userId, cutoff)
    expect(dueSchedules).toHaveLength(2)
    expect(dueSchedules.map(schedule => schedule.id)).toEqual([
      `${userId}|${BASE_MOOD}|${BASE_TENSE}|${BASE_PERSON}|1`,
      `${userId}|${BASE_MOOD}|${BASE_TENSE}|${BASE_PERSON}|2`
    ])
  })

  it('ejecuta getDueSchedules dentro de un umbral consistente incluso con grandes volúmenes', async () => {
    const userId = 'benchmark-user'
    const cutoff = new Date('2024-05-01T00:00:00.000Z')

    const dueCount = 600
    const futureCount = 600

    for (let i = 0; i < dueCount; i += 1) {
      await saveSchedule({
        id: `${userId}|due|${i}`,
        userId,
        mood: BASE_MOOD,
        tense: BASE_TENSE,
        person: BASE_PERSON,
        interval: 1,
        reps: 1,
        nextDue: new Date(`2024-04-${String((i % 28) + 1).padStart(2, '0')}T00:00:00.000Z`)
      })
    }

    for (let i = 0; i < futureCount; i += 1) {
      await saveSchedule({
        id: `${userId}|future|${i}`,
        userId,
        mood: BASE_MOOD,
        tense: BASE_TENSE,
        person: BASE_PERSON,
        interval: 3,
        reps: 2,
        nextDue: new Date(`2024-06-${String((i % 28) + 1).padStart(2, '0')}T00:00:00.000Z`)
      })
    }

    const otherUserId = 'benchmark-other'
    for (let i = 0; i < futureCount; i += 1) {
      await saveSchedule({
        id: `${otherUserId}|future|${i}`,
        userId: otherUserId,
        mood: BASE_MOOD,
        tense: BASE_TENSE,
        person: BASE_PERSON,
        interval: 2,
        reps: 1,
        nextDue: new Date(`2024-04-${String((i % 28) + 1).padStart(2, '0')}T00:00:00.000Z`)
      })
    }

    // Primera lectura para calentar caches del adaptador idb
    await getDueSchedules(userId, cutoff)

    const start = performance.now()
    const result = await getDueSchedules(userId, cutoff)
    const durationMs = performance.now() - start

    expect(result).toHaveLength(dueCount)
    expect(durationMs).toBeLessThan(200)
  })
})
