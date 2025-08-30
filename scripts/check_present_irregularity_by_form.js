// Check present indicative irregularity per form (not lemma type)
// Usage: REGION=rioplatense node scripts/check_present_irregularity_by_form.js

import { verbs } from '../src/data/verbs.js'
import { isRegularFormForMood } from '../src/lib/core/conjugationRules.js'

function allowedPersons(region){
  if (region==='rioplatense') return new Set(['1s','2s_vos','3s','1p','3p'])
  if (region==='peninsular') return new Set(['1s','2s_tu','3s','1p','2p_vosotros','3p'])
  return new Set(['1s','2s_tu','3s','1p','3p'])
}

function main(){
  const region = process.env.REGION || 'la_general'
  const persons = allowedPersons(region)
  let lemmas = 0
  let presentAnyIrregular = 0
  let presentAllRegular = 0
  const examples = { allRegular: [], anyIrregular: [] }

  for (const v of verbs){
    // Collect present forms for region
    const forms = []
    for (const p of v.paradigms||[]){
      if (!p.regionTags || !p.regionTags.includes(region)) continue
      for (const f of p.forms||[]){
        if (f.mood==='indicative' && f.tense==='pres' && persons.has(f.person)){
          forms.push({ ...f, lemma: v.lemma })
        }
      }
    }
    if (!forms.length) continue
    lemmas++
    // Determine if any present form is irregular by comparing to regular pattern
    let anyIrreg = false
    for (const f of forms){
      const isReg = isRegularFormForMood(v.lemma, f.mood, f.tense, f.person, f.value)
      if (!isReg){ anyIrreg = true; break }
    }
    if (anyIrreg){
      presentAnyIrregular++
      if (examples.anyIrregular.length < 10) examples.anyIrregular.push(v.lemma)
    } else {
      presentAllRegular++
      if (examples.allRegular.length < 10) examples.allRegular.push(v.lemma)
    }
  }

  console.log('Region:', region)
  console.log('Lemmas with present forms (region):', lemmas)
  console.log('Present any irregular:', presentAnyIrregular)
  console.log('Present all regular:', presentAllRegular)
  console.log('Sample all-regular-present lemmas:', examples.allRegular)
  console.log('Sample any-irregular-present lemmas:', examples.anyIrregular)
}

main()

