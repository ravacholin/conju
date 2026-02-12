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
})
