#!/usr/bin/env node

// Find verbs that already have preterite forms to use as examples
import { verbs } from './data/verbs.js'

const verbsWithPreterite = []

for (const verb of verbs) {
  let hasPreterite = false
  
  for (const paradigm of verb.paradigms) {
    for (const form of paradigm.forms) {
      if (form.tense === 'pretIndef') {
        hasPreterite = true
        break
      }
    }
    if (hasPreterite) break
  }
  
  if (hasPreterite) {
    verbsWithPreterite.push(verb.lemma)
  }
}

console.log(`Verbos con formas de pretérito indefinido (${verbsWithPreterite.length}):`)
console.log(verbsWithPreterite.join(', '))

// Verificar si hay algún verbo irregular de terceras personas
const thirdPersonVerbs = ['pedir', 'dormir', 'leer', 'servir', 'repetir']
const found = verbsWithPreterite.filter(v => thirdPersonVerbs.includes(v))
console.log(`\nVerbos de terceras personas con pretérito: ${found.join(', ')}`)