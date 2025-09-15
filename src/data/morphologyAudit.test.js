import { describe, it, expect } from 'vitest'
import { verbs } from './verbs.js'

function collectForms(v){
  const out=[]
  for (const p of v.paradigms || []){
    for (const f of p.forms || []) out.push(f)
  }
  return out
}

function getPresentVos(verb){
  const forms = collectForms(verb).filter(f => f.mood === 'indicative' && f.tense === 'pres')
  const direct = forms.find(f => f.person === '2s_vos')
  if (direct) return direct.value
  const tu = forms.find(f => f.person === '2s_tu')
  return tu && tu.accepts && tu.accepts.vos
}

function expectedVos(lemma){
  if (lemma.endsWith('ar')) return lemma.replace(/ar$/, 'ás')
  if (lemma.endsWith('er')) return lemma.replace(/er$/, 'és')
  if (lemma.endsWith('ir')) return lemma.replace(/ir$/, 'ís')
  return null
}

const VOSEO_EXCEPTIONS = new Set(['ser','ir','ver','dar'])

describe('Morphology audit: voseo present and subjunctive imperfect', () => {
  it('Voseo presente (2s) usa -ás/-és/-ís y sin diptongos con vos', () => {
    const offenders = []
    for (const v of verbs){
      if (VOSEO_EXCEPTIONS.has(v.lemma)) continue
      const got = getPresentVos(v)
      const want = expectedVos(v.lemma)
      if (!want || !got) continue
      if (got !== want){
        offenders.push({ lemma: v.lemma, have: got, want })
      }
      // Detect diptongo indebido con vos (ue/ie en raíz de forma, pero no en infinitivo)
      const base = v.lemma.slice(0, -2)
      const stemVos = got.slice(0, -2)
      if ((/ue|ie/.test(stemVos)) && !/ue|ie/.test(base)){
        offenders.push({ lemma: v.lemma, have: got, want, note: 'diptongo indebido con vos' })
      }
    }
    expect(offenders, `Voseo presente mal formado: ${JSON.stringify(offenders.slice(0,5))} (total ${offenders.length})`).toEqual([])
  })

  it('Imperfecto de subjuntivo 1p termina en -áramos (ar) o -éramos (er/ir)', () => {
    const offenders = []
    for (const v of verbs){
      const forms = collectForms(v)
      const f = forms.find(x => x.mood === 'subjunctive' && x.tense === 'subjImpf' && x.person === '1p')
      if (!f) continue // If missing, skip; data coverage is validated elsewhere
      const ok = v.lemma.endsWith('ar') ? /áramos$/.test(f.value || '') : /éramos$/.test(f.value || '')
      if (!ok){
        offenders.push({ lemma: v.lemma, have: f.value })
      }
    }
    expect(offenders, `Subj. imperfecto 1p mal formado: ${JSON.stringify(offenders.slice(0,5))} (total ${offenders.length})`).toEqual([])
  })
})

