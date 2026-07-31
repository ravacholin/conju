import { describe, it, expect } from 'vitest'
import { SETTINGS_STATE_KEYS } from '../../state/settings.js'
import { buildTopicPayload, buildLevelPayload } from './searchPayloads.js'

describe('searchPayloads - settings key contract', () => {
  const known = new Set(SETTINGS_STATE_KEYS)

  const expectEveryKeyKnown = (payload, label) => {
    const unknown = Object.keys(payload).filter(key => !known.has(key))
    // The store's sanitizer drops unknown keys silently, so a typo here would
    // produce a quietly wrong drill instead of an error.
    expect(unknown, `${label} has keys missing from SETTINGS_STATE_KEYS`).toEqual([])
  }

  it('only uses settings keys the store accepts for topic payloads', () => {
    expectEveryKeyKnown(
      buildTopicPayload({ mood: 'subjunctive', tense: 'subjImpf' }),
      'buildTopicPayload'
    )
    expectEveryKeyKnown(
      buildTopicPayload({
        mood: 'indicative',
        tense: 'pretIndef',
        verbType: 'irregular',
        selectedFamily: 'PRET_UV'
      }),
      'buildTopicPayload (family)'
    )
  })

  it('only uses settings keys the store accepts for level payloads', () => {
    ;['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].forEach(level => {
      expectEveryKeyKnown(buildLevelPayload(level), `buildLevelPayload(${level})`)
    })
  })

  it('requires both mood and tense', () => {
    expect(() => buildTopicPayload({ mood: 'indicative' })).toThrow()
    expect(() => buildTopicPayload({ tense: 'pres' })).toThrow()
  })
})
