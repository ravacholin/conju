import { describe, expect, it } from 'vitest'
import { buildDrillSettingsUpdate } from './drillNavigationConfig.js'

describe('drillNavigationConfig', () => {
  it('normalizes specific mode configuration', () => {
    const result = buildDrillSettingsUpdate({
      practiceMode: 'specific',
      specificMood: 'subjunctive',
      specificTense: 'subjPres'
    })

    expect(result.practiceMode).toBe('specific')
    expect(result.specificMood).toBe('subjunctive')
    expect(result.specificTense).toBe('subjPres')
    expect(result.reviewSessionFilter).toEqual({})
  })

  it('clears stale specific target when mode is review', () => {
    const result = buildDrillSettingsUpdate(
      {
        practiceMode: 'review',
        specificMood: 'indicative',
        specificTense: 'pres',
        reviewSessionType: 'overdue',
        reviewSessionFilter: { mood: 'indicative' }
      }
    )

    expect(result.specificMood).toBeNull()
    expect(result.specificTense).toBeNull()
    expect(result.reviewSessionType).toBe('overdue')
    expect(result.reviewSessionFilter).toEqual({ mood: 'indicative' })
  })

  it('enforces safe defaults for mixed mode', () => {
    const result = buildDrillSettingsUpdate({ practiceMode: 'mixed' })

    expect(result.practiceMode).toBe('mixed')
    expect(result.specificMood).toBeNull()
    expect(result.specificTense).toBeNull()
    expect(result.reviewSessionType).toBe('due')
    expect(result.reviewSessionFilter).toEqual({})
  })
})
