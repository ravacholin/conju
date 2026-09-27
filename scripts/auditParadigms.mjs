#!/usr/bin/env node
// Audits every verb paradigm against derivation rules that hold for all
// Spanish verbs, regular or not (subjunctive imperfect from the preterite,
// compound tenses from haber + participle, negative imperative from the
// present subjunctive, etc.). It does not need a list of irregular verbs:
// it only checks that the forms of a verb agree with each other.
//
// Usage: node scripts/auditParadigms.mjs [--json]
// Also runs as part of `npm run audit:all` and src/data/verbs.paradigmConsistency.test.js.

import { pathToFileURL } from 'url'

const PERSONS = ['1s', '2s_tu', '2s_vos', '3s', '1p', '2p_vosotros', '3p']
const HABER = {
  pretPerf: ['he', 'has', 'has', 'ha', 'hemos', 'habéis', 'han'],
  plusc: ['había', 'habías', 'habías', 'había', 'habíamos', 'habíais', 'habían'],
  futPerf: ['habré', 'habrás', 'habrás', 'habrá', 'habremos', 'habréis', 'habrán'],
  condPerf: ['habría', 'habrías', 'habrías', 'habría', 'habríamos', 'habríais', 'habrían'],
  subjPerf: ['haya', 'hayas', 'hayas', 'haya', 'hayamos', 'hayáis', 'hayan'],
  subjPlusc: ['hubiera', 'hubieras', 'hubieras', 'hubiera', 'hubiéramos', 'hubierais', 'hubieran']
}
const IR_A = ['voy', 'vas', 'vas', 'va', 'vamos', 'vais', 'van']
const ACCENT = { a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú' }

// Stress the last vowel of a stem: habla → hablá, dije → dijé.
const stressLast = (stem) => stem.replace(/([aeiou])([^aeiouáéíóú]*)$/, (_, v, rest) => ACCENT[v] + rest)

function indexForms(verb) {
  const forms = verb.paradigms.flatMap(p => p.forms)
  const get = (mood, tense, person) => forms.find(f => f.mood === mood && f.tense === tense && (person == null || f.person === person))
  const all = (tense) => forms.filter(f => f.tense === tense)
  return { forms, get, all }
}

const accepted = (form) => (form ? [form.value, ...(form.alt || [])] : [])

export function auditVerb(verb) {
  const issues = []
  const { get, all } = indexForms(verb)
  const report = (rule, person, found, expected) => {
    issues.push({ lemma: verb.lemma, rule, person, found, expected })
  }
  const check = (rule, person, form, expected) => {
    if (!form || expected == null) return
    const options = Array.isArray(expected) ? expected : [expected]
    if (!options.includes(form.value)) report(rule, person, form.value, options.join(' | '))
  }

  const inf = get('nonfinite', 'inf')?.value || verb.lemma
  const participles = all('part').flatMap(accepted)
  const pret3p = get('indicative', 'pretIndef', '3p')?.value

  // Subjunctive imperfect and future: stem of the 3rd person plural preterite.
  if (pret3p?.endsWith('ron')) {
    const stem = pret3p.slice(0, -3)
    const ra = ['ra', 'ras', 'ras', 'ra', 'ramos', 'rais', 'ran']
    const re = ['re', 'res', 'res', 're', 'remos', 'reis', 'ren']
    PERSONS.forEach((p, i) => {
      const base = p === '1p' ? stressLast(stem) : stem
      check('subjImpf←pret3p', p, get('subjunctive', 'subjImpf', p), base + ra[i])
      check('subjFut←pret3p', p, get('subjunctive', 'subjFut', p), base + re[i])
    })
  }

  // Compound tenses: haber + participle.
  if (participles.length) {
    for (const [tense, aux] of Object.entries(HABER)) {
      PERSONS.forEach((p, i) => {
        const mood = tense.startsWith('subj') ? 'subjunctive' : tense === 'condPerf' ? 'conditional' : 'indicative'
        check(`${tense}=haber+part`, p, get(mood, tense, p), participles.map(pp => `${aux[i]} ${pp}`))
      })
    }
    check('infPerf=haber+part', null, get('nonfinite', 'infPerf'), participles.map(pp => `haber ${pp}`))
  } else {
    report('participle', null, '—', 'nonfinite:part')
  }

  // Imperative from the present subjunctive.
  const subj = (p) => get('subjunctive', 'subjPres', p)?.value
  const negSource = { '2s_tu': '2s_tu', '2s_vos': '2s_tu', '3s': '3s', '1p': '1p', '2p_vosotros': '2p_vosotros', '3p': '3p' }
  for (const [p, source] of Object.entries(negSource)) {
    if (subj(source)) check('impNeg=no+subjPres', p, get('imperative', 'impNeg', p), `no ${subj(source)}`)
  }
  for (const p of ['3s', '1p', '3p']) {
    const expected = [subj(p)]
    if (inf === 'ir' && p === '1p') expected.push('vamos')
    check('impAff=subjPres', p, get('imperative', 'impAff', p), expected)
  }
  check('impAff vosotros=inf-r+d', '2p_vosotros', get('imperative', 'impAff', '2p_vosotros'), inf.slice(0, -1) + 'd')

  // Conditional shares the future stem.
  const fut1s = get('indicative', 'fut', '1s')?.value
  if (fut1s?.endsWith('é')) {
    const stem = fut1s.slice(0, -1)
    const fut = ['é', 'ás', 'ás', 'á', 'emos', 'éis', 'án']
    const cond = ['ía', 'ías', 'ías', 'ía', 'íamos', 'íais', 'ían']
    PERSONS.forEach((p, i) => {
      check('fut stem', p, get('indicative', 'fut', p), stem + fut[i])
      check('cond=fut stem', p, get('conditional', 'cond', p), stem + cond[i])
    })
  }

  // Periphrastic future and "presente con valor de futuro".
  PERSONS.forEach((p, i) => {
    check('irAInf', p, get('indicative', 'irAInf', p), `${IR_A[i]} a ${inf}`)
    const pres = get('indicative', 'pres', p)?.value
    if (pres) check('presFuturate=pres', p, get('indicative', 'presFuturate', p), pres)
  })

  // Voseo shares the tú form outside the present and the imperative.
  for (const [mood, tense] of [['indicative', 'pretIndef'], ['subjunctive', 'subjPres'], ['subjunctive', 'subjImpf']]) {
    const tu = get(mood, tense, '2s_tu')?.value
    if (tu) check(`${tense} vos=tú`, '2s_vos', get(mood, tense, '2s_vos'), tu)
  }

  return issues
}

export function auditParadigms(verbs) {
  return verbs.flatMap(auditVerb)
}

async function main() {
  const { verbs } = await import('../src/data/verbs.js')
  const issues = auditParadigms(verbs)
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(issues, null, 2))
  } else {
    const byRule = new Map()
    for (const issue of issues) byRule.set(issue.rule, [...(byRule.get(issue.rule) || []), issue])
    for (const [rule, list] of byRule) {
      console.log(`\n${rule}: ${list.length}`)
      for (const i of list.slice(0, 25)) console.log(`  ${i.lemma} ${i.person ?? ''}: "${i.found}" (esperado ${i.expected})`)
    }
    console.log(`\n${issues.length} inconsistencia(s) en ${new Set(issues.map(i => i.lemma)).size} verbo(s).`)
  }

  process.exitCode = issues.length ? 1 : 0
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main()
}
