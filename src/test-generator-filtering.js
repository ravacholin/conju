#!/usr/bin/env node

// Test del filtrado por grupos en el generador
import { categorizeVerb } from './lib/irregularFamilies.js'
import { expandSimplifiedGroup, getSimplifiedGroupForVerb } from './lib/simplifiedFamilyGroups.js'

console.log('🧪 Testing Generator Filtering Logic\n')

// Simular la nueva lógica del generador
function simulateGeneratorFiltering(verb, selectedFamily, tense) {
  const verbFamilies = categorizeVerb(verb)
  
  // Check if it's a simplified group that needs expansion
  const expandedFamilies = expandSimplifiedGroup(selectedFamily)
  if (expandedFamilies.length > 0) {
    // It's a simplified group - use priority-based classification
    const verbGroup = getSimplifiedGroupForVerb(verbFamilies, tense)
    return verbGroup === selectedFamily
  } else {
    // It's a regular family - check direct match
    return verbFamilies.includes(selectedFamily)
  }
}

const selectedFamily = 'PRETERITE_THIRD_PERSON'
const tense = 'pretIndef'

// Verbos que NO deberían aparecer (irregulares fuertes)
const shouldNotAppear = [
  'traer',    // Irregular fuerte (traje, trajiste, trajo...)
  'caer',     // Irregular fuerte (caí, caíste, cayó...)
  'oír',      // Irregular fuerte (oí, oíste, oyó...)
  'decir',    // Irregular fuerte (dije, dijiste, dijo...)
  'hacer',    // Irregular fuerte (hice, hiciste, hizo...)
  'venir',    // Irregular fuerte (vine, viniste, vino...)
  'poner',    // Irregular fuerte (puse, pusiste, puso...)
  'tener',    // Irregular fuerte (tuve, tuviste, tuvo...)
]

// Verbos que SÍ deberían aparecer (irregulares solo en 3ª persona)
const shouldAppear = [
  'pedir',      // e→i: pidió, pidieron
  'servir',     // e→i: sirvió, sirvieron  
  'repetir',    // e→i: repitió, repitieron
  'seguir',     // e→i: siguió, siguieron
  'dormir',     // o→u: durmió, durmieron
  'morir',      // o→u: murió, murieron
  'leer',       // hiato: leyó, leyeron
  'creer',      // hiato: creyó, creyeron
  'construir',  // hiato: construyó, construyeron
  'destruir',   // hiato: destruyó, destruyeron
]

console.log('=== Nueva lógica del generador ===\n')

console.log('1. Verbos que NO deberían aparecer en "Irregulares en 3ª persona":')
let correctlyExcluded = 0
for (const verb of shouldNotAppear) {
  const verbFamilies = categorizeVerb(verb)
  const passes = simulateGeneratorFiltering(verb, selectedFamily, tense)
  const verbGroup = getSimplifiedGroupForVerb(verbFamilies, tense)
  
  const status = !passes ? '✅ CORRECTO' : '❌ ERROR'
  console.log(`   ${verb}: ${status} (grupo: ${verbGroup}, pasa filtro: ${passes})`)
  
  if (!passes) correctlyExcluded++
}

console.log(`\n   Resultado: ${correctlyExcluded}/${shouldNotAppear.length} correctamente excluidos\n`)

console.log('2. Verbos que SÍ deberían aparecer en "Irregulares en 3ª persona":')
let correctlyIncluded = 0
for (const verb of shouldAppear) {
  const verbFamilies = categorizeVerb(verb)
  const passes = simulateGeneratorFiltering(verb, selectedFamily, tense)
  const verbGroup = getSimplifiedGroupForVerb(verbFamilies, tense)
  
  const status = passes ? '✅ CORRECTO' : '❌ ERROR'
  console.log(`   ${verb}: ${status} (grupo: ${verbGroup}, pasa filtro: ${passes})`)
  
  if (passes) correctlyIncluded++
}

console.log(`\n   Resultado: ${correctlyIncluded}/${shouldAppear.length} correctamente incluidos\n`)

console.log('=== Comparación con lógica anterior ===\n')

console.log('3. Comparación para verbos problemáticos:')
const problemVerbs = ['traer', 'decir', 'caer', 'oír']
const expandedFamilies = expandSimplifiedGroup(selectedFamily)

for (const verb of problemVerbs) {
  const verbFamilies = categorizeVerb(verb)
  
  // Lógica anterior (problemática)
  const oldLogic = expandedFamilies.some(familyId => verbFamilies.includes(familyId))
  
  // Nueva lógica (con prioridades) 
  const newLogic = simulateGeneratorFiltering(verb, selectedFamily, tense)
  
  const improvement = oldLogic && !newLogic ? '✅ MEJORADO' : oldLogic === newLogic ? '⚪ SIN CAMBIO' : '❓ REVISAR'
  
  console.log(`   ${verb}:`)
  console.log(`     Lógica anterior: ${oldLogic ? 'APARECE' : 'NO APARECE'}`)
  console.log(`     Nueva lógica:    ${newLogic ? 'APARECE' : 'NO APARECE'} ${improvement}`)
  console.log()
}

const totalCorrect = correctlyExcluded + correctlyIncluded
const totalTests = shouldNotAppear.length + shouldAppear.length
console.log(`🎯 Resultado final: ${totalCorrect}/${totalTests} tests correctos (${Math.round(totalCorrect/totalTests*100)}%)`)