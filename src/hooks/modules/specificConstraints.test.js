import { describe, it, expect } from 'vitest'
import {
  getReviewSessionContext,
  buildSpecificConstraints,
  applyReviewSessionFilter,
  selectDueCandidate,
  computeUrgencyLevel
} from './specificConstraints.js'

describe('specificConstraints', () => {
  it('derives review session context from settings', () => {
    const settings = {
      reviewSessionType: 'urgent',
      reviewSessionFilter: { mood: 'indicative' }
    }

    expect(getReviewSessionContext(settings)).toEqual({
      reviewSessionType: 'urgent',
      reviewSessionFilter: { mood: 'indicative' }
    })

    expect(getReviewSessionContext({})).toEqual({
      reviewSessionType: 'due',
      reviewSessionFilter: {}
    })
  })

  it('builds specific constraints for practice and review modes', () => {
    const practiceSettings = {
      practiceMode: 'specific',
      specificMood: 'indicative',
      specificTense: 'pres'
    }

    expect(buildSpecificConstraints(practiceSettings, 'due', {})).toEqual({
      isSpecific: true,
      specificMood: 'indicative',
      specificTense: 'pres'
    })

    const reviewSettings = { practiceMode: 'review' }
    const reviewFilter = { mood: 'subjunctive', tense: 'imp', person: '1s' }

    expect(buildSpecificConstraints(reviewSettings, 'specific', reviewFilter)).toEqual({
      isSpecific: true,
      specificMood: 'subjunctive',
      specificTense: 'imp'
    })

    expect(buildSpecificConstraints({}, 'due', {})).toEqual({
      isSpecific: false,
      specificMood: null,
      specificTense: null
    })
  })

  it('filters due cells according to review settings', () => {
    const now = new Date('2024-01-02T00:00:00Z')
    const dueCells = [
      { mood: 'indicative', tense: 'pres', person: '1s', nextDue: new Date('2024-01-01T20:00:00Z') },
      { mood: 'indicative', tense: 'pret', person: '2s', nextDue: new Date('2024-01-03T00:00:00Z') },
      { mood: 'subjunctive', tense: 'imp', person: '3s', nextDue: new Date('2023-12-31T00:00:00Z') }
    ]

    const filtered = applyReviewSessionFilter(
      dueCells,
      'urgent',
      { mood: 'indicative', urgency: 'urgent' },
      now
    )

    expect(filtered).toHaveLength(1)
    expect(filtered[0]).toMatchObject({ mood: 'indicative', tense: 'pres' })

    const specificFallback = applyReviewSessionFilter(
      dueCells,
      'specific',
      { mood: 'subjunctive', tense: 'imp', person: '3s', limit: 0 },
      now
    )

    expect(specificFallback).toHaveLength(1)
    expect(specificFallback[0].person).toBe('3s')
  })

  it('selects the first due candidate for supported modes', () => {
    const dueCells = [
      null,
      { mood: 'indicative', tense: 'pres' }
    ]

    expect(selectDueCandidate(dueCells, 'due')).toEqual({ mood: 'indicative', tense: 'pres' })
    expect(selectDueCandidate([], 'due')).toBeNull()
  })

  it('computes urgency levels based on due date', () => {
    const now = new Date('2024-01-01T00:00:00Z')
    expect(computeUrgencyLevel(null, now)).toBe(1)
    expect(computeUrgencyLevel(new Date('2023-12-31T00:00:00Z'), now)).toBe(4)
    expect(computeUrgencyLevel(new Date('2024-01-01T03:00:00Z'), now)).toBe(3)
    expect(computeUrgencyLevel(new Date('2024-01-01T12:00:00Z'), now)).toBe(2)
    expect(computeUrgencyLevel(new Date('2024-01-03T00:00:00Z'), now)).toBe(1)
  })
})

