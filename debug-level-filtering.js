// Debug script to see which verbs are being filtered by level
import { categorizeVerb } from './src/lib/data/irregularFamilies.js'
import { verbs } from './src/data/verbs.js'
import { getMinimumLevelForVerb, isVerbAllowedForLevel } from './src/lib/core/levelVerbFiltering.js'

const pedagogicalFamilies = ['E_I_IR', 'O_U_GER_IR', 'HIATUS_Y']
const userLevel = 'B1' // Asumiendo que el usuario está en B1

console.log(`=== ANÁLISIS DE FILTRADO POR NIVEL (Usuario: ${userLevel}) ===\n`)

// Obtener verbos que pasan el filtro pedagógico
const irregularVerbs = verbs.filter(verb => verb.type === 'irregular')
const pedagogicalVerbs = irregularVerbs.filter(verb => {
  const families = categorizeVerb(verb.lemma, verb)
  return families.some(family => pedagogicalFamilies.includes(family))
})

console.log(`Verbos con familias pedagógicas: ${pedagogicalVerbs.length}`)

let allowedByLevel = []
let blockedByLevel = []

pedagogicalVerbs.forEach(verb => {
  const requiredLevel = getMinimumLevelForVerb(verb.lemma)
  const isAllowed = isVerbAllowedForLevel(verb.lemma, userLevel)

  if (isAllowed) {
    allowedByLevel.push({ lemma: verb.lemma, requiredLevel })
  } else {
    blockedByLevel.push({ lemma: verb.lemma, requiredLevel })
  }
})

console.log('\n=== VERBOS PERMITIDOS PARA B1 ===')
console.log(`Total: ${allowedByLevel.length}`)
allowedByLevel.forEach(verb => {
  console.log(`✅ ${verb.lemma} (requiere ${verb.requiredLevel})`)
})

console.log('\n=== VERBOS BLOQUEADOS POR NIVEL ===')
console.log(`Total: ${blockedByLevel.length}`)
blockedByLevel.forEach(verb => {
  console.log(`❌ ${verb.lemma} (requiere ${verb.requiredLevel})`)
})

console.log('\n=== VERBOS ESPECÍFICOS DE INTERÉS ===')
const interestingVerbs = ['pedir', 'servir', 'dormir', 'morir', 'leer', 'creer', 'construir', 'destruir', 'huir', 'sentir', 'seguir', 'repetir']
interestingVerbs.forEach(lemma => {
  const requiredLevel = getMinimumLevelForVerb(lemma)
  const isAllowed = isVerbAllowedForLevel(lemma, userLevel)
  const status = isAllowed ? '✅ PERMITIDO' : '❌ BLOQUEADO'
  console.log(`${status}: ${lemma} (requiere ${requiredLevel})`)
})