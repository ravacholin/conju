#!/usr/bin/env node

// Test de clasificación de verbos irregulares de 3ª persona
import { categorizeVerb } from './lib/irregularFamilies.js'
import { getSimplifiedGroupForVerb, expandSimplifiedGroup } from './lib/simplifiedFamilyGroups.js'
import { shouldFilterVerbByLevel, isAdvancedThirdPersonVerb, getFilteringStats } from './lib/levelVerbFiltering.js'

console.log('🧪 Testing Third Person Irregular Verb Classification\n')

// Verbos que deberían aparecer en "Irregulares en 3ª persona"
const thirdPersonVerbs = [
  // Cambio e→i (verbos -ir)
  'pedir', 'servir', 'repetir', 'seguir', 'sentir', 'preferir', 
  'mentir', 'competir', 'medir', 'vestir',
  
  // Cambio o→u (verbos -ir)
  'dormir', 'morir',
  
  // Verbos menos comunes para B2+ (o→u)
  'podrir', 'gruñir',
  
  // Hiatos con Y (solo 3ª persona)
  'leer', 'creer', 'construir', 'destruir', 'huir',
  'incluir', 'concluir', 'contribuir', 'distribuir',
  
  // Hiatos menos comunes para B2+
  'poseer', 'proveer', 'releer', 'instruir', 'reconstruir',
  'sustituir', 'atribuir', 'excluir'
]

// Verbos que NO deberían aparecer (irregulares fuertes en todas las personas)
const strongPreteriteVerbs = [
  'venir', 'traer', 'caer', 'oír', // Ya no deberían estar en HIATUS_Y para 3ª persona
  'tener', 'poner', 'hacer', 'decir', 'querer' // Irregulares fuertes
]

console.log('=== Testing Third Person Group Classification ===\n')

console.log('1. Verbos que SÍ deberían estar en "Irregulares en 3ª persona":')
let correctThirdPerson = 0
for (const verb of thirdPersonVerbs) {
  const families = categorizeVerb(verb)
  const group = getSimplifiedGroupForVerb(families, 'pretIndef')
  const isCorrect = group === 'PRETERITE_THIRD_PERSON'
  
  console.log(`   ${verb}: ${isCorrect ? '✅' : '❌'} ${group || 'NO_GROUP'} (families: ${families.join(', ')})`)
  if (isCorrect) correctThirdPerson++
}

console.log(`\n   Resultado: ${correctThirdPerson}/${thirdPersonVerbs.length} correctos\n`)

console.log('2. Verbos que NO deberían estar en "Irregulares en 3ª persona":')
let correctlyExcluded = 0
for (const verb of strongPreteriteVerbs) {
  const families = categorizeVerb(verb)
  const group = getSimplifiedGroupForVerb(families, 'pretIndef')
  const isCorrect = group !== 'PRETERITE_THIRD_PERSON'
  
  console.log(`   ${verb}: ${isCorrect ? '✅' : '❌'} ${group || 'NO_GROUP'} (families: ${families.join(', ')})`)
  if (isCorrect) correctlyExcluded++
}

console.log(`\n   Resultado: ${correctlyExcluded}/${strongPreteriteVerbs.length} correctamente excluidos\n`)

console.log('=== Testing Level-Based Filtering for Third Person Verbs ===\n')

const advancedThirdPersonVerbs = [
  'poseer', 'proveer', 'releer', 'instruir', 'reconstruir',
  'sustituir', 'atribuir', 'excluir', 'podrir', 'gruñir'
]

console.log('3. Verbos de 3ª persona que solo aparecen en B2+:')
for (const verb of advancedThirdPersonVerbs) {
  const families = categorizeVerb(verb)
  const isAdvanced = isAdvancedThirdPersonVerb(verb)
  const filteredA1 = shouldFilterVerbByLevel(verb, families, 'A1', 'pretIndef')
  const filteredB2 = shouldFilterVerbByLevel(verb, families, 'B2', 'pretIndef')
  
  console.log(`   ${verb}: ${isAdvanced ? '✅' : '❌'} Advanced=${isAdvanced}, FilteredA1=${filteredA1}, FilteredB2=${filteredB2}`)
}

console.log('\n4. Estadísticas de filtrado por nivel:')
for (const level of ['A1', 'A2', 'B1', 'B2', 'C1']) {
  const stats = getFilteringStats(level)
  console.log(`   ${level}: ZO=${stats.zoVerbs.filtered} filtered, 3rd=${stats.thirdPersonAdvanced.filtered} filtered, Total=${stats.totalFiltered}`)
}

console.log('\n=== Testing Simplified Groups for Preterite ===\n')

console.log('5. Grupos disponibles para pretérito indefinido:')
const preteriteGroups = expandSimplifiedGroup('PRETERITE_THIRD_PERSON')
console.log(`   PRETERITE_THIRD_PERSON incluye familias: ${preteriteGroups.join(', ')}`)

const strongStemGroups = expandSimplifiedGroup('PRETERITE_STRONG_STEM')
console.log(`   PRETERITE_STRONG_STEM incluye familias: ${strongStemGroups.join(', ')}`)

console.log('\n✨ Test completado!')