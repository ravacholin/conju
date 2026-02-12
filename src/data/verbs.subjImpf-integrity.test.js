import { describe, it, expect } from 'vitest'
import { verbs } from './verbs.js'

const PERSONS = ['1s', '2s_tu', '2s_vos', '3s', '1p', '2p_vosotros', '3p']
const RA_ENDINGS = {
  '1s': 'ra',
  '2s_tu': 'ras',
  '2s_vos': 'ras',
  '3s': 'ra',
  '1p': 'ramos',
  '2p_vosotros': 'rais',
  '3p': 'ran'
}
const SE_ENDINGS = {
  '1s': 'se',
  '2s_tu': 'ses',
  '2s_vos': 'ses',
  '3s': 'se',
  '1p': 'semos',
  '2p_vosotros': 'seis',
  '3p': 'sen'
}

const stripAccents = (value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')

describe('verbs dataset integrity: subjImpf derivation', () => {
  it('keeps subjImpf aligned with pretIndef 3p stem for all verbs', () => {
    const mismatches = []

    for (const verb of verbs) {
      const forms = verb.paradigms?.flatMap((paradigm) => paradigm.forms) ?? []
      const preterite3p = forms.find(
        (form) => form.mood === 'indicative' && form.tense === 'pretIndef' && form.person === '3p'
      )?.value

      if (!preterite3p || !preterite3p.endsWith('ron')) continue

      const stem = preterite3p.slice(0, -3)
      const subjImpfForms = forms.filter((form) => form.mood === 'subjunctive' && form.tense === 'subjImpf')
      if (subjImpfForms.length === 0) continue

      for (const person of PERSONS) {
        const form = subjImpfForms.find((candidate) => candidate.person === person)
        if (!form?.value) {
          mismatches.push(`${verb.lemma} ${person}: missing subjImpf form`)
          continue
        }

        const expectedRa = stripAccents(stem + RA_ENDINGS[person])
        const expectedSe = stripAccents(stem + SE_ENDINGS[person])
        const actual = stripAccents(form.value)

        if (actual !== expectedRa && actual !== expectedSe) {
          mismatches.push(
            `${verb.lemma} ${person}: got "${form.value}"; expected ${stem + RA_ENDINGS[person]} or ${stem + SE_ENDINGS[person]}`
          )
        }
      }
    }

    expect(mismatches).toEqual([])
  })
})
