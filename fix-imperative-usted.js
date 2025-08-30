#!/usr/bin/env node

// SPECIFIC FIX: Correct the usted imperative forms that are still wrong
import fs from 'fs'
import { verbs } from './src/data/verbs.js'

console.log('🔧 FIXING SPECIFIC USTED IMPERATIVE FORMS')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

const ustedCorrections = {
  'subir': 'suba',      // Currently "subamos" - wrong!
  'aprender': 'aprenda', // Currently "aprendamos" - wrong!
  'vender': 'venda',    // Currently "vendamos" - wrong!
  'correr': 'corra',    // Currently "corramos" - wrong!
  'recibir': 'reciba',  // Currently "recibamos" - wrong!
  // Add more as needed...
}

let formsFixed = 0

const correctedVerbs = verbs.map(verb => {
  if (!ustedCorrections[verb.lemma]) return verb
  
  const correctedParadigms = verb.paradigms?.map(paradigm => {
    const correctedForms = paradigm.forms?.map(form => {
      // Fix the specific usted imperative forms that are wrong
      if (form.mood === 'imperative' && 
          form.tense === 'impAff' && 
          form.person === '3s') {
        
        const expectedValue = ustedCorrections[verb.lemma]
        if (form.value !== expectedValue) {
          console.log(`🔧 ${verb.lemma}: usted "${form.value}" → "${expectedValue}"`)
          formsFixed++
          return { ...form, value: expectedValue }
        }
      }
      return form
    })
    
    return { ...paradigm, forms: correctedForms }
  })
  
  return { ...verb, paradigms: correctedParadigms }
})

// Write the corrected data
const output = `// FIXED: Specific usted imperative forms corrected
// Date: ${new Date().toISOString()}

export const verbs = ${JSON.stringify(correctedVerbs, null, 2)}`

fs.writeFileSync('./src/data/verbs.js', output)

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log(`✅ USTED FORMS FIXED: ${formsFixed} corrections made`)
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')