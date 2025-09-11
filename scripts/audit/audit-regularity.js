#!/usr/bin/env node
import { loadAllVerbs, eachForm } from './utils.js'

// Minimal regular morphology generator (aligned with validators)
function getRegularForm(lemma, mood, tense, person) {
  const stem = lemma.slice(0, -2)
  const ending = lemma.slice(-2)
  // Nonfinite
  if (mood === 'nonfinite') {
    if (tense === 'inf') return lemma
    if (tense === 'ger') return stem + (ending === 'ar' ? 'ando' : 'iendo')
    if (tense === 'part') return stem + (ending === 'ar' ? 'ado' : 'ido')
  }
  // Indicative present
  if (mood === 'indicative' && tense === 'pres') {
    const p = {
      ar: { '1s':'o','2s_tu':'as','2s_vos':'ás','3s':'a','1p':'amos','2p_vosotros':'áis','3p':'an' },
      er: { '1s':'o','2s_tu':'es','2s_vos':'és','3s':'e','1p':'emos','2p_vosotros':'éis','3p':'en' },
      ir: { '1s':'o','2s_tu':'es','2s_vos':'ís','3s':'e','1p':'imos','2p_vosotros':'ís','3p':'en' }
    }[ending]
    return p?.[person] ? stem + p[person] : null
  }
  // Indicative imperfect
  if (mood === 'indicative' && tense === 'impf') {
    const p = {
      ar: { '1s':'aba','2s_tu':'abas','2s_vos':'abas','3s':'aba','1p':'ábamos','2p_vosotros':'abais','3p':'aban' },
      er: { '1s':'ía','2s_tu':'ías','2s_vos':'ías','3s':'ía','1p':'íamos','2p_vosotros':'íais','3p':'ían' },
      ir: { '1s':'ía','2s_tu':'ías','2s_vos':'ías','3s':'ía','1p':'íamos','2p_vosotros':'íais','3p':'ían' }
    }[ending]
    return p?.[person] ? stem + p[person] : null
  }
  // Indefinido
  if (mood === 'indicative' && tense === 'pretIndef') {
    const p = {
      ar: { '1s':'é','2s_tu':'aste','2s_vos':'aste','3s':'ó','1p':'amos','2p_vosotros':'asteis','3p':'aron' },
      er: { '1s':'í','2s_tu':'iste','2s_vos':'iste','3s':'ió','1p':'imos','2p_vosotros':'isteis','3p':'ieron' },
      ir: { '1s':'í','2s_tu':'iste','2s_vos':'iste','3s':'ió','1p':'imos','2p_vosotros':'isteis','3p':'ieron' }
    }[ending]
    return p?.[person] ? stem + p[person] : null
  }
  // Futuro
  if (mood === 'indicative' && tense === 'fut') {
    const p = { '1s':'é','2s_tu':'ás','2s_vos':'ás','3s':'á','1p':'emos','2p_vosotros':'éis','3p':'án' }
    return p[person] ? lemma + p[person] : null
  }
  // Condicional
  if (mood === 'conditional' && tense === 'cond') {
    const p = { '1s':'ía','2s_tu':'ías','2s_vos':'ías','3s':'ía','1p':'íamos','2p_vosotros':'íais','3p':'ían' }
    return p[person] ? lemma + p[person] : null
  }
  // Subjuntivo presente
  if (mood === 'subjunctive' && tense === 'subjPres') {
    const p = {
      ar: { '1s':'e','2s_tu':'es','2s_vos':'es','3s':'e','1p':'emos','2p_vosotros':'éis','3p':'en' },
      er: { '1s':'a','2s_tu':'as','2s_vos':'as','3s':'a','1p':'amos','2p_vosotros':'áis','3p':'an' },
      ir: { '1s':'a','2s_tu':'as','2s_vos':'as','3s':'a','1p':'amos','2p_vosotros':'áis','3p':'an' }
    }[ending]
    return p?.[person] ? stem + p[person] : null
  }
  // Subjuntivo imperfecto
  if (mood === 'subjunctive' && tense === 'subjImpf') {
    const p = {
      ar: { '1s':'ara','2s_tu':'aras','2s_vos':'aras','3s':'ara','1p':'áramos','2p_vosotros':'arais','3p':'aran' },
      er: { '1s':'iera','2s_tu':'ieras','2s_vos':'ieras','3s':'iera','1p':'iéramos','2p_vosotros':'ierais','3p':'ieran' },
      ir: { '1s':'iera','2s_tu':'ieras','2s_vos':'ieras','3s':'iera','1p':'iéramos','2p_vosotros':'ierais','3p':'ieran' }
    }[ending]
    return p?.[person] ? stem + p[person] : null
  }
  // Imperativo afirmativo
  if (mood === 'imperative' && tense === 'impAff') {
    const p = {
      ar: { '2s_tu':'a','2s_vos':'á','3s':'e','1p':'emos','2p_vosotros':'ad','3p':'en' },
      er: { '2s_tu':'e','2s_vos':'é','3s':'a','1p':'amos','2p_vosotros':'ed','3p':'an' },
      ir: { '2s_tu':'e','2s_vos':'í','3s':'a','1p':'amos','2p_vosotros':'id','3p':'an' }
    }[ending]
    return p?.[person] ? stem + p[person] : null
  }
  // Imperativo negativo: "no " + subjPres
  if (mood === 'imperative' && tense === 'impNeg') {
    const sp = getRegularForm(lemma, 'subjunctive', 'subjPres', person)
    return sp ? `no ${sp}` : null
  }
  return null
}

const all = loadAllVerbs()
const findings = []
for (const verb of all) {
  if ((verb.type || 'regular') !== 'regular') continue
  eachForm(verb, (form) => {
    const exp = getRegularForm(verb.lemma, form.mood, form.tense, form.person)
    if (!exp) return
    if ((form.value || '').trim() !== exp) {
      findings.push({ lemma: verb.lemma, mood: form.mood, tense: form.tense, person: form.person, value: form.value, expected: exp })
    }
  })
}

if (findings.length === 0) {
  console.log('✅ Regularity audit: no mismatches for regular verbs')
  process.exit(0)
}

console.log(`🚨 Regularity audit: ${findings.length} mismatches in regular verbs`)
const byLemma = new Map()
for (const f of findings) {
  if (!byLemma.has(f.lemma)) byLemma.set(f.lemma, [])
  byLemma.get(f.lemma).push(f)
}
for (const [lemma, list] of byLemma.entries()) {
  console.log(`\n— ${lemma}`)
  list.forEach(i => console.log(`  ${i.mood}|${i.tense}|${i.person}: "${i.value}" → expected "${i.expected}"`))
}
console.log('\nJSON:\n' + JSON.stringify(findings, null, 2))

