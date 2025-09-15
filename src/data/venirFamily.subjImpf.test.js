import { describe, it, expect } from 'vitest'
import { verbs } from './verbs.js'

function getForms(lemma) {
  const v = verbs.find(v => v.lemma === lemma)
  if (!v) return []
  const out = []
  for (const p of v.paradigms || []) {
    for (const f of p.forms || []) {
      out.push(f)
    }
  }
  return out
}

function expectSubjImpfVinieraSeries(lemma, prefix = '') {
  const forms = getForms(lemma).filter(f => f.mood === 'subjunctive' && f.tense === 'subjImpf')
  const byPerson = new Map(forms.map(f => [f.person, f.value]))
  // 1s / 3s / 3p, 2s_tu/2s_vos, 1p, 2p_vosotros
  expect(byPerson.get('1s')).toBe(`${prefix}viniera`)
  expect(byPerson.get('2s_tu')).toBe(`${prefix}vinieras`)
  expect(byPerson.get('2s_vos')).toBe(`${prefix}vinieras`)
  expect(byPerson.get('3s')).toBe(`${prefix}viniera`)
  expect(byPerson.get('1p')).toBe(`${prefix}viniéramos`)
  expect(byPerson.get('2p_vosotros')).toBe(`${prefix}vinierais`)
  expect(byPerson.get('3p')).toBe(`${prefix}vinieran`)
}

function expectPresentVoseoEndsWithVenis(lemma, prefix = '') {
  const expected = `${prefix}venís`
  const forms = getForms(lemma).filter(f => f.mood === 'indicative' && f.tense === 'pres')
  const direct = forms.find(f => f.person === '2s_vos')
  if (direct) {
    expect(direct.value).toBe(expected)
    return
  }
  const tu = forms.find(f => f.person === '2s_tu')
  expect(tu && tu.accepts && tu.accepts.vos, 'missing vos acceptance in 2s_tu').toBe(expected)
}

function expectPreteriteVoseoIsViniste(lemma, prefix = '') {
  const expected = `${prefix}viniste`
  const forms = getForms(lemma).filter(f => f.mood === 'indicative' && f.tense === 'pretIndef')
  const direct = forms.find(f => f.person === '2s_vos')
  if (direct) {
    expect(direct.value).toBe(expected)
    return
  }
  const tu = forms.find(f => f.person === '2s_tu')
  expect(tu && tu.accepts && tu.accepts.vos, 'missing vos acceptance in 2s_tu').toBe(expected)
}

describe('Vinir-family data sanity (venir, convenir, prevenir, intervenir)', () => {
  it('Subjuntivo imperfecto (-ra) series are correct', () => {
    expectSubjImpfVinieraSeries('venir')
    expectSubjImpfVinieraSeries('convenir', 'con')
    expectSubjImpfVinieraSeries('prevenir', 'pre')
    expectSubjImpfVinieraSeries('intervenir', 'inter')
  })

  it('Voseo presente 2s es en -venís (no -vienís)', () => {
    expectPresentVoseoEndsWithVenis('venir')
    expectPresentVoseoEndsWithVenis('convenir', 'con')
    expectPresentVoseoEndsWithVenis('prevenir', 'pre')
    expectPresentVoseoEndsWithVenis('intervenir', 'inter')
  })

  it('Voseo pretérito indefinido 2s es -viniste', () => {
    expectPreteriteVoseoIsViniste('venir')
    expectPreteriteVoseoIsViniste('convenir', 'con')
    expectPreteriteVoseoIsViniste('prevenir', 'pre')
    expectPreteriteVoseoIsViniste('intervenir', 'inter')
  })
})

