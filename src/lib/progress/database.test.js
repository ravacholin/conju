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
import { setLogLevel } from '../utils/logger.js'

const MIN_IDB_DATE = new Date(-8640000000000000)

describe('database schedules queries', () => {
  beforeEach(async () => {
    try {
      await deleteDB()
    } catch (error) {
      // Database may not exist on first run
    }
    setLogLevel('ERROR')
    await initDB()
  })

  it('returns only schedules for the requested user before the cutoff date', async () => {
    const now = Date.now()
    const userId = 'user-filter'
    const otherUserId = 'user-other'
    const cutoff = new Date(now + 60 * 1000)

    await Promise.all([
      saveSchedule({
        id: `${userId}|due`,
        userId,
        mood: 'indicative',
        tense: 'present',
        person: 'yo',
        interval: 1,
        reps: 1,
        nextDue: new Date(now - 5 * 60 * 1000),
        updatedAt: new Date(now - 5 * 60 * 1000)
      }),
      saveSchedule({
        id: `${userId}|future`,
        userId,
        mood: 'indicative',
        tense: 'present',
        person: 'yo',
        interval: 2,
        reps: 2,
        nextDue: new Date(now + 120 * 1000),
        updatedAt: new Date(now + 120 * 1000)
      }),
      saveSchedule({
        id: `${otherUserId}|due`,
        userId: otherUserId,
        mood: 'indicative',
        tense: 'present',
        person: 'yo',
        interval: 1,
        reps: 1,
        nextDue: new Date(now - 10 * 60 * 1000),
        updatedAt: new Date(now - 10 * 60 * 1000)
      })
    ])

    const dueSchedules = await getDueSchedules(userId, cutoff)

    expect(dueSchedules).toHaveLength(1)
    expect(dueSchedules[0].userId).toBe(userId)
    expect(new Date(dueSchedules[0].nextDue).getTime()).toBeLessThanOrEqual(cutoff.getTime())
  })

  it('queries schedules using a bounded composite index range', async () => {
    const userId = 'user-range'
    const now = Date.now()
    const cutoff = new Date(now + 5 * 60 * 1000)

    await saveSchedule({
      id: `${userId}|range`,
      userId,
      mood: 'indicative',
      tense: 'present',
      person: 'yo',
      interval: 1,
      reps: 1,
      nextDue: new Date(now + 60 * 1000),
      updatedAt: new Date(now)
    })

    const calls = []
    const originalGetAll = IDBIndex.prototype.getAll
    IDBIndex.prototype.getAll = function patchedGetAll(query) {
      if (this.name === 'userId-nextDue') {
        calls.push(query)
      }
      return originalGetAll.call(this, query)
    }

    try {
      await getDueSchedules(userId, cutoff)
    } finally {
      IDBIndex.prototype.getAll = originalGetAll
    }

    expect(calls).toHaveLength(1)
    const [range] = calls
    expect(range.lower[0]).toBe(userId)
    expect(range.upper[0]).toBe(userId)
    expect(new Date(range.upper[1]).getTime()).toBeLessThanOrEqual(cutoff.getTime())
    expect(range.lower[1].getTime()).toBe(MIN_IDB_DATE.getTime())
  })

  it('completes due schedule queries faster than a full index scan on large datasets', async () => {
    const userId = 'user-perf'
    const otherUserId = 'user-perf-other'
    const now = Date.now()
    const cutoff = new Date(now - 30 * 60 * 1000)
    const totalRecords = 2500

    for (let i = 0; i < totalRecords; i += 1) {
      await saveSchedule({
        id: `${userId}|${i}`,
        userId,
        mood: 'indicative',
        tense: 'present',
        person: 'yo',
        interval: 1,
        reps: 1,
        nextDue: new Date(now - i * 60 * 1000),
        updatedAt: new Date(now - i * 60 * 1000)
      })
    }

    for (let i = 0; i < totalRecords; i += 1) {
      await saveSchedule({
        id: `${otherUserId}|${i}`,
        userId: otherUserId,
        mood: 'indicative',
        tense: 'present',
        person: 'yo',
        interval: 1,
        reps: 1,
        nextDue: new Date(now - i * 60 * 1000),
        updatedAt: new Date(now - i * 60 * 1000)
      })
    }

    const iterations = 3

    const legacyGetDueSchedules = async () => {
      const db = await initDB()
      const tx = db.transaction(STORAGE_CONFIG.STORES.SCHEDULES, 'readonly')
      const store = tx.objectStore(STORAGE_CONFIG.STORES.SCHEDULES)
      const index = store.index('nextDue')
      const allSchedules = await index.getAll()
      const result = allSchedules.filter(
        schedule => schedule.userId === userId && new Date(schedule.nextDue) <= cutoff
      )
      await tx.done
      return result
    }

    await legacyGetDueSchedules()
    await getDueSchedules(userId, cutoff)

    let legacyTotal = 0
    let optimizedTotal = 0

    for (let i = 0; i < iterations; i += 1) {
      const legacyStart = performance.now()
      await legacyGetDueSchedules()
      legacyTotal += performance.now() - legacyStart

      const optimizedStart = performance.now()
      await getDueSchedules(userId, cutoff)
      optimizedTotal += performance.now() - optimizedStart
    }

    const legacyAverage = legacyTotal / iterations
    const optimizedAverage = optimizedTotal / iterations

    expect(optimizedAverage).toBeLessThan(legacyAverage)
  })
})
