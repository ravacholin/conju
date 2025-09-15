import { describe, it, expect } from 'vitest'
import { isRegularFormForMood } from './conjugationRules.js'

describe('Voseo presente: diptongantes NO diptongan con vos', () => {
  const cases = [
    { lemma: 'contar', expected: 'contás' },
    { lemma: 'pensar', expected: 'pensás' },
    { lemma: 'poder', expected: 'podés' },
    { lemma: 'volver', expected: 'volvés' },
    { lemma: 'querer', expected: 'querés' },
    { lemma: 'preferir', expected: 'preferís' },
    { lemma: 'dormir', expected: 'dormís' },
  ]

  it('acepta las formas regulares de vos', () => {
    for (const { lemma, expected } of cases) {
      expect(
        isRegularFormForMood(lemma, 'indicative', 'pres', '2s_vos', expected),
        `${lemma} vos presente debe ser ${expected}`
      ).toBe(true)
    }
  })

  it('rechaza diptongos erróneos con vos (piensás, cuentás, duermís)', () => {
    const wrong = [
      { lemma: 'pensar', wrong: 'piensás' },
      { lemma: 'contar', wrong: 'cuentás' },
      { lemma: 'dormir', wrong: 'duermís' },
    ]
    for (const { lemma, wrong: w } of wrong) {
      expect(
        isRegularFormForMood(lemma, 'indicative', 'pres', '2s_vos', w),
        `${lemma} no debe aceptar ${w}`
      ).toBe(false)
    }
  })
})

describe('Imperfecto de subjuntivo -er: -iéramos', () => {
  it('deber 1p = debiéramos; no debramos', () => {
    expect(isRegularFormForMood('deber', 'subjunctive', 'subjImpf', '1p', 'debiéramos')).toBe(true)
    expect(isRegularFormForMood('deber', 'subjunctive', 'subjImpf', '1p', 'debramos')).toBe(false)
  })
})

