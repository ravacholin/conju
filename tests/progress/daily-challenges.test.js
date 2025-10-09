import { describe, it, expect } from 'vitest'
import { getChallengeDefinitions } from '../../src/lib/progress/challenges.js'

describe('Daily Challenges', () => {
  it('should have challenge definitions', () => {
    const definitions = getChallengeDefinitions()

    expect(definitions).toBeDefined()
    expect(Array.isArray(definitions)).toBe(true)
    expect(definitions.length).toBeGreaterThan(0)
  })

  it('should have valid challenge structure', () => {
    const definitions = getChallengeDefinitions()

    definitions.forEach(challenge => {
      // Required fields
      expect(challenge).toHaveProperty('id')
      expect(challenge).toHaveProperty('title')
      expect(challenge).toHaveProperty('description')
      expect(challenge).toHaveProperty('metric')
      expect(challenge).toHaveProperty('target')
      expect(challenge).toHaveProperty('icon')
      expect(challenge).toHaveProperty('reward')

      // Field types
      expect(typeof challenge.id).toBe('string')
      expect(typeof challenge.title).toBe('string')
      expect(typeof challenge.description).toBe('string')
      expect(typeof challenge.metric).toBe('string')
      expect(typeof challenge.target).toBe('number')
      expect(typeof challenge.icon).toBe('string')
    })
  })

  it('should have valid reward structures', () => {
    const definitions = getChallengeDefinitions()

    definitions.forEach(challenge => {
      expect(challenge.reward).toHaveProperty('type')
      expect(challenge.reward).toHaveProperty('value')
      expect(['xp', 'booster', 'streak', 'token']).toContain(challenge.reward.type)
    })
  })

  it('should have valid metric names', () => {
    const definitions = getChallengeDefinitions()
    const validMetrics = ['attemptsToday', 'accuracyToday', 'bestStreakToday', 'focusMinutesToday']

    definitions.forEach(challenge => {
      expect(validMetrics).toContain(challenge.metric)
    })
  })

  it('should have unique challenge IDs', () => {
    const definitions = getChallengeDefinitions()
    const ids = definitions.map(c => c.id)
    const uniqueIds = new Set(ids)

    expect(uniqueIds.size).toBe(ids.length)
  })

  it('should have challenges for all key metrics', () => {
    const definitions = getChallengeDefinitions()
    const metrics = definitions.map(c => c.metric)

    expect(metrics).toContain('attemptsToday')
    expect(metrics).toContain('accuracyToday')
    expect(metrics).toContain('bestStreakToday')
    expect(metrics).toContain('focusMinutesToday')
  })

  it('should have reasonable target values', () => {
    const definitions = getChallengeDefinitions()

    definitions.forEach(challenge => {
      expect(challenge.target).toBeGreaterThan(0)
      expect(challenge.target).toBeLessThan(1000) // Sanity check
    })
  })
})
