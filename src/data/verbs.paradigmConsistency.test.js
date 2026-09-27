import { describe, it, expect } from 'vitest'
import { verbs } from './verbs.js'
import { auditParadigms } from '../../scripts/auditParadigms.mjs'
import { isRegularFormForMood, isRegularNonfiniteForm } from '../lib/core/conjugationRules.js'
import { isIrregularInTense } from '../lib/utils/irregularityUtils.js'

const cell = f => `${f.mood}:${f.tense}:${f.person}`
// Tenses only a handful of verbs carry and no curriculum entry practices.
const OPTIONAL_TENSES = new Set(['subjFut', 'irAInf', 'presFuturate', 'infPerf'])
const reference = new Set(
  verbs.find(v => v.lemma === 'vivir').paradigms.flatMap(p => p.forms).map(cell)
)

describe('verb paradigms', () => {
  it('agree with the derivation rules every Spanish verb follows', () => {
    const issues = auditParadigms(verbs).map(i => `${i.lemma} ${i.person ?? ''} [${i.rule}]: ${i.found} ≠ ${i.expected}`)
    expect(issues).toEqual([])
  })

  it('have every mood/tense/person cell and no legacy tense codes', () => {
    const problems = []
    for (const verb of verbs) {
      const cells = new Set(verb.paradigms.flatMap(p => p.forms).map(cell))
      const missing = [...reference].filter(c => !cells.has(c))
      const unknown = [...cells].filter(c => !reference.has(c) && !OPTIONAL_TENSES.has(c.split(':')[1]))
      if (missing.length || unknown.length) problems.push(`${verb.lemma}: faltan ${missing} / sobran ${unknown}`)
    }
    expect(problems).toEqual([])
  })
})

describe('irregularity metadata', () => {
  const isIrregularForm = (verb, f) => f.mood === 'nonfinite'
    ? f.tense !== 'inf' && !isRegularNonfiniteForm(verb.lemma, f.tense, f.value)
    : !isRegularFormForMood(verb.lemma, f.mood, f.tense, f.person, f.value)

  it('matches the forms of each verb, tense by tense', () => {
    const wrong = []
    for (const verb of verbs) {
      const tenses = new Set(verb.paradigms.flatMap(p => p.forms).map(f => f.tense))
      for (const tense of tenses) {
        if (OPTIONAL_TENSES.has(tense)) continue
        const forms = verb.paradigms.flatMap(p => p.forms).filter(f => f.tense === tense)
        const expected = forms.some(f => isIrregularForm(verb, f))
        if (isIrregularInTense(verb, tense) !== expected) wrong.push(`${verb.lemma} ${tense}: ${!expected} → ${expected}`)
      }
    }
    expect(wrong).toEqual([])
  })

  it('marks verbs with no irregular form as regular, except accent/diaeresis-only verbs', () => {
    const ACCENT_ONLY = /(iar|uar|guar|ohibir|unir|islar|ullar|husar|aizar)$/
    const mistyped = verbs
      .filter(v => v.type === 'irregular' && v.irregularTenses.length === 0 && !ACCENT_ONLY.test(v.lemma))
      .map(v => v.lemma)
    expect(mistyped).toEqual([])
  })

  it('treats the participle and the compound tenses with the dataset tense codes', () => {
    const volver = verbs.find(v => v.lemma === 'volver')
    expect(isIrregularInTense(volver, 'part')).toBe(true)
    expect(isIrregularInTense(volver, 'subjPerf')).toBe(true)
    expect(isIrregularInTense(volver, 'pp')).toBe(true)
    const hablar = verbs.find(v => v.lemma === 'hablar')
    expect(isIrregularInTense(hablar, 'part')).toBe(false)
  })
})
