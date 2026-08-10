import { describe, expect, it } from 'vitest'
import {
  buildDrillSettingsUpdate,
  snapshotDrillTargeting,
  drillTargetingChanged
} from './drillNavigationConfig.js'

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

  it('allows mixed mode to carry currentBlock for corrective micro-drills', () => {
    const currentBlock = { combos: [{ mood: 'indicative', tense: 'pres' }], itemsRemaining: 8 }
    const result = buildDrillSettingsUpdate({
      practiceMode: 'mixed',
      currentBlock
    })

    expect(result.practiceMode).toBe('mixed')
    expect(result.currentBlock).toEqual(currentBlock)
    expect(result.specificMood).toBeNull()
    expect(result.specificTense).toBeNull()
  })
})

describe('drill targeting change detection', () => {
  const mixedSettings = {
    practiceMode: 'mixed',
    specificMood: null,
    specificTense: null,
    verbType: 'all',
    selectedFamily: null
  }

  it('detects a new "Practicar esto" block even when practiceMode stays mixed', () => {
    // Regression: the first exercise after clicking "Practicar esto" showed the
    // stale item from the previous mixed session because change detection ignored
    // the runtime block. Two mixed sessions with different blocks must differ.
    const prevSession = { runtimeCurrentBlock: null }
    const nextSession = {
      runtimeCurrentBlock: { combos: [{ mood: 'indicative', tense: 'pretIndef' }] }
    }

    const prev = snapshotDrillTargeting(mixedSettings, prevSession)
    const next = snapshotDrillTargeting(mixedSettings, nextSession)

    expect(drillTargetingChanged(prev, next)).toBe(true)
  })

  it('distinguishes two different targeted blocks under the same mixed mode', () => {
    const prev = snapshotDrillTargeting(mixedSettings, {
      runtimeCurrentBlock: { combos: [{ mood: 'indicative', tense: 'pres' }] }
    })
    const next = snapshotDrillTargeting(mixedSettings, {
      runtimeCurrentBlock: { combos: [{ mood: 'subjunctive', tense: 'subjPres' }] }
    })

    expect(drillTargetingChanged(prev, next)).toBe(true)
  })

  it('reports no change when settings and runtime block are identical', () => {
    const session = {
      runtimeCurrentBlock: { combos: [{ mood: 'indicative', tense: 'pres' }] }
    }
    const prev = snapshotDrillTargeting(mixedSettings, session)
    const next = snapshotDrillTargeting(mixedSettings, session)

    expect(drillTargetingChanged(prev, next)).toBe(false)
  })

  it('detects a changed SRS review filter while practiceMode stays review', () => {
    const reviewSettings = { ...mixedSettings, practiceMode: 'review' }
    const prev = snapshotDrillTargeting(reviewSettings, {
      runtimeReviewSessionType: 'due',
      runtimeReviewSessionFilter: { mood: 'indicative' }
    })
    const next = snapshotDrillTargeting(reviewSettings, {
      runtimeReviewSessionType: 'due',
      runtimeReviewSessionFilter: { mood: 'subjunctive' }
    })

    expect(drillTargetingChanged(prev, next)).toBe(true)
  })

  it('still detects classic specific-practice changes', () => {
    const prev = snapshotDrillTargeting(mixedSettings, {})
    const next = snapshotDrillTargeting(
      { ...mixedSettings, practiceMode: 'specific', specificMood: 'subjunctive', specificTense: 'subjPres' },
      {}
    )

    expect(drillTargetingChanged(prev, next)).toBe(true)
  })

  it('treats a missing snapshot as a change (forces regeneration)', () => {
    expect(drillTargetingChanged(null, snapshotDrillTargeting(mixedSettings, {}))).toBe(true)
  })
})
