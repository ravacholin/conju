import { describe, it, expect } from 'vitest'
import { verbs } from './verbs.js'

// El imperativo afirmativo de tú coincide con la 3.ª persona del presente
// (habla, siente, construye), salvo este grupo cerrado de irregulares.
const IRREGULAR_TU_IMPERATIVE = {
  ser: 'sé', ir: 've', haber: 'he', tener: 'ten', venir: 'ven', hacer: 'haz',
  decir: 'di', salir: 'sal', poner: 'pon'
}
const COMPOUND_ENDINGS = [['tener', 'tén'], ['venir', 'vén'], ['hacer', 'haz'], ['poner', 'pón']]

function expectedTuImperative(lemma, thirdPersonPresent) {
  if (IRREGULAR_TU_IMPERATIVE[lemma]) return IRREGULAR_TU_IMPERATIVE[lemma]
  for (const [base, ending] of COMPOUND_ENDINGS) {
    if (lemma.endsWith(base) && lemma !== base) return lemma.slice(0, -base.length) + ending
  }
  return thirdPersonPresent
}

describe('tú affirmative imperative', () => {
  it('matches the 3rd person present (or the known irregular) for every verb', () => {
    const wrong = []
    for (const verb of verbs) {
      const forms = verb.paradigms.flatMap(p => p.forms)
      const third = forms.find(f => f.mood === 'indicative' && f.tense === 'pres' && f.person === '3s')
      for (const imp of forms.filter(f => f.tense === 'impAff' && f.person === '2s_tu')) {
        const expected = expectedTuImperative(verb.lemma, third?.value)
        if (imp.value !== expected) wrong.push(`${verb.lemma}: ${imp.value} (esperado ${expected})`)
      }
    }
    expect(wrong).toEqual([])
  })

  it('accepts both yergue and irgue for erguir', () => {
    const erguir = verbs.find(v => v.lemma === 'erguir')
    const imp = erguir.paradigms.flatMap(p => p.forms).find(f => f.tense === 'impAff' && f.person === '2s_tu')
    expect([imp.value, ...(imp.alt || [])]).toEqual(['yergue', 'irgue'])
  })
})
