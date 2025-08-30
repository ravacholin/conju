// Inspect Present Indicative distribution by verb type for a region
// Usage: REGION=rioplatense node scripts/inspect_present_stats.js

import { verbs } from '../src/data/verbs.js'

function getAllowedPersons(region) {
  if (region === 'rioplatense') return new Set(['1s','2s_vos','3s','1p','3p'])
  if (region === 'peninsular') return new Set(['1s','2s_tu','3s','1p','2p_vosotros','3p'])
  return new Set(['1s','2s_tu','3s','1p','3p']) // la_general
}

function main() {
  const region = process.env.REGION || 'la_general'
  const allowedPersons = getAllowedPersons(region)

  let totalVerbs = 0, totalRegularVerbs = 0, totalIrregularVerbs = 0
  verbs.forEach(v => {
    totalVerbs++
    if (v.type === 'regular') totalRegularVerbs++
    else if (v.type === 'irregular') totalIrregularVerbs++
  })

  let totalForms = 0
  let irrForms = 0, regForms = 0
  const persons = {}
  const lemmaType = new Map(verbs.map(v => [v.lemma, v.type]))

  for (const v of verbs) {
    for (const p of v.paradigms || []) {
      if (!p.regionTags || !p.regionTags.includes(region)) continue
      for (const f of p.forms || []) {
        if (f.mood === 'indicative' && f.tense === 'pres') {
          if (f.person && !allowedPersons.has(f.person)) continue
          totalForms++
          persons[f.person] = (persons[f.person] || 0) + 1
          const t = lemmaType.get(v.lemma)
          if (t === 'irregular') irrForms++
          else if (t === 'regular') regForms++
        }
      }
    }
  }

  const irrFrac = totalForms ? irrForms / totalForms : 0
  console.log(`Region: ${region}`)
  console.log('Verbs => total:', totalVerbs, 'regular:', totalRegularVerbs, 'irregular:', totalIrregularVerbs)
  console.log('Present forms => total:', totalForms, 'irregular-typed:', irrForms, 'regular-typed:', regForms, 'ratio:', (irrFrac*100).toFixed(1)+'%')
  console.log('Persons:', persons)
}

main()

