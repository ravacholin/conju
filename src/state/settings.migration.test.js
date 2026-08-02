import { describe, expect, it } from 'vitest'
import { migratePersistedSettings } from './settings.js'

describe('settings migrations', () => {
  it('drops legacy drill runtime keys from persisted snapshots', () => {
    const migrated = migratePersistedSettings({
      level: 'B1',
      currentBlock: { combos: [{ mood: 'indicative', tense: 'pres' }] },
      reviewSessionType: 'specific',
      reviewSessionFilter: { mood: 'indicative' }
    }, 2)

    expect(migrated.level).toBe('B1')
    expect(migrated.currentBlock).toBeUndefined()
    expect(migrated.reviewSessionType).toBeUndefined()
    expect(migrated.reviewSessionFilter).toBeUndefined()
  })

  it('drops legacy ephemeral game state from persisted snapshots', () => {
    const migrated = migratePersistedSettings({
      level: 'B2',
      resistanceBestMsByLevel: { B2: 45000 },
      resistanceActive: true,
      resistanceMsLeft: 12000,
      resistanceStartTs: 1700000000000,
      reverseActive: true,
      doubleActive: true,
      conmutacionIdx: 2,
      nextSecondPerson: '2s_tu'
    }, 3)

    expect(migrated.level).toBe('B2')
    // El récord es una preferencia durable y tiene que sobrevivir.
    expect(migrated.resistanceBestMsByLevel).toEqual({ B2: 45000 })
    expect(migrated.resistanceActive).toBeUndefined()
    expect(migrated.resistanceMsLeft).toBeUndefined()
    expect(migrated.resistanceStartTs).toBeUndefined()
    expect(migrated.reverseActive).toBeUndefined()
    expect(migrated.doubleActive).toBeUndefined()
    expect(migrated.conmutacionIdx).toBeUndefined()
    expect(migrated.nextSecondPerson).toBeUndefined()
  })

  it('normalizes reminder days from mixed legacy formats', () => {
    const migrated = migratePersistedSettings({
      practiceReminderDays: ['1', 8, -1, 'x', 2]
    }, 1)

    expect(migrated.practiceReminderDays).toEqual([1, 2, 6])
  })

  it('maps legacy region alias "both" to "global"', () => {
    const migrated = migratePersistedSettings({ region: 'both' }, 1)
    expect(migrated.region).toBe('global')
  })

  it('preserves valid fields when one field is invalid', () => {
    const migrated = migratePersistedSettings({
      level: 'C1',
      useVoseo: true,
      practiceReminderDays: 'bad-shape'
    }, 2)

    expect(migrated.level).toBe('C1')
    expect(migrated.useVoseo).toBe(true)
    expect(Array.isArray(migrated.practiceReminderDays)).toBe(true)
  })

  it('loads representative v1 snapshot without losing valid config', () => {
    const v1Snapshot = {
      region: 'both',
      level: 'A2',
      practiceMode: 'specific',
      specificMood: 'indicative',
      specificTense: 'pres',
      practiceReminderEnabled: true,
      practiceReminderTime: '20:30',
      practiceReminderDays: [1, '2', 8]
    }

    const migrated = migratePersistedSettings(v1Snapshot, 1)
    expect(migrated.region).toBe('global')
    expect(migrated.level).toBe('A2')
    expect(migrated.practiceMode).toBe('specific')
    expect(migrated.specificMood).toBe('indicative')
    expect(migrated.specificTense).toBe('pres')
    expect(migrated.practiceReminderEnabled).toBe(true)
    expect(migrated.practiceReminderTime).toBe('20:30')
    expect(migrated.practiceReminderDays).toEqual([1, 2])
  })
})
