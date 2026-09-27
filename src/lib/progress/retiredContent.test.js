import { describe, it, expect } from 'vitest'
import { withoutRetiredAttempts, withoutRetiredLemmas } from './retiredContent.js'

describe('retiredContent', () => {
  it('drops attempts of retired pronominal verbs from what reports read', () => {
    const attempts = [
      { id: 'a1', verbId: 'hablar', errorTags: [] },
      { id: 'a2', verbId: 'sentarse', errorTags: ['raíz_irregular'] },
      { id: 'a3', lemma: 'acostarse', errorTags: [] }
    ]

    expect(withoutRetiredAttempts(attempts).map(a => a.id)).toEqual(['a1'])
  })

  it('strips the retired clitic error tag and keeps the other tags', () => {
    const attempt = { id: 'a1', verbId: 'decir', errorTags: ['pronombres_clíticos', 'acentuación'] }

    const [cleaned] = withoutRetiredAttempts([attempt])

    expect(cleaned.errorTags).toEqual(['acentuación'])
    expect(attempt.errorTags).toEqual(['pronombres_clíticos', 'acentuación'])
  })

  it('returns untouched attempts as the same objects', () => {
    const attempt = { id: 'a1', verbId: 'hablar', errorTags: ['acentuación'] }
    expect(withoutRetiredAttempts([attempt])[0]).toBe(attempt)
  })

  it('drops schedules that carry a retired lemma', () => {
    const schedules = [{ id: 's1' }, { id: 's2', lemma: 'sentarse' }, { id: 's3', lemma: 'tener' }]
    expect(withoutRetiredLemmas(schedules).map(s => s.id)).toEqual(['s1', 's3'])
  })
})
