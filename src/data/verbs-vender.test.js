import { describe, it, expect } from 'vitest'
import { verbs } from './verbs.js'

function findVerb(id) {
  return verbs.find(v => v.id === id || v.lemma === id)
}

function getForms(verb) {
  // Flatten all paradigms/forms
  return (verb.paradigms || []).flatMap(p => p.forms || [])
}

describe('Regresión: formas de "vender"', () => {
  const vender = findVerb('vender')
  const forms = getForms(vender)

  it('existe el verbo vender con formas', () => {
    expect(vender).toBeTruthy()
    expect(forms.length).toBeGreaterThan(0)
  })

  it('no hay duplicados erróneos 3p con valor "vend"', () => {
    const bad3pVend = forms.filter(f => f.person === '3p' && f.value === 'vend')
    expect(bad3pVend.length).toBe(0)
  })

  it('no hay 3p negativas erróneas con valor "no vend"', () => {
    const bad3pNoVend = forms.filter(
      f => f.person === '3p' && f.value === 'no vend'
    )
    expect(bad3pNoVend.length).toBe(0)
  })

  it('impAff|2p_vosotros es "vended"', () => {
    const entries = forms.filter(
      f => f.mood === 'imperative' && f.tense === 'impAff' && f.person === '2p_vosotros'
    )
    expect(entries.length).toBe(1)
    expect(entries[0].value).toBe('vended')
  })

  it('impAff|3p es "vendan"', () => {
    const entries = forms.filter(
      f => f.mood === 'imperative' && f.tense === 'impAff' && f.person === '3p'
    )
    expect(entries.length).toBe(1)
    expect(entries[0].value).toBe('vendan')
  })

  it('subjPres|3p es "vendan"', () => {
    const entries = forms.filter(
      f => f.mood === 'subjunctive' && f.tense === 'subjPres' && f.person === '3p'
    )
    expect(entries.length).toBe(1)
    expect(entries[0].value).toBe('vendan')
  })
})

