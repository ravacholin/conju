import { describe, it, expect } from 'vitest'
import { verbs } from './verbs.js'

// La app no practica verbos pronominales (sentarse, acostarse, ducharse…).
describe('verb dataset', () => {
  it('has no pronominal verbs', () => {
    const pronominal = verbs.filter(v => /(ar|er|ir|ír)se$/.test(v.lemma)).map(v => v.lemma)
    expect(pronominal).toEqual([])
  })
})
