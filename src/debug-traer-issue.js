#!/usr/bin/env node

// Debug: por qué aparece TRAER en irregulares de 3ª persona
import { categorizeVerb } from './lib/irregularFamilies.js'
import { getSimplifiedGroupForVerb, expandSimplifiedGroup } from './lib/simplifiedFamilyGroups.js'

console.log('🔍 Debugging TRAER classification issue\n')

// Verbos que NO deberían aparecer en "Irregulares en 3ª persona"
const strongStemVerbs = [
  'traer',    // traje, trajiste, trajo, trajimos, trajisteis, trajeron
  'caer',     // caí, caíste, cayó, caímos, caísteis, cayeron  
  'oír',      // oí, oíste, oyó, oímos, oísteis, oyeron
  'venir',    // vine, viniste, vino, vinimos, vinisteis, vinieron
  'decir',    // dije, dijiste, dijo, dijimos, dijisteis, dijeron
  'hacer',    // hice, hiciste, hizo, hicimos, hicisteis, hicieron
  'poner',    // puse, pusiste, puso, pusimos, pusisteis, pusieron
  'tener',    // tuve, tuviste, tuvo, tuvimos, tuvisteis, tuvieron
  'poder',    // pude, pudiste, pudo, pudimos, pudisteis, pudieron
  'querer',   // quise, quisiste, quiso, quisimos, quisisteis, quisieron
  'saber',    // supe, supiste, supo, supimos, supisteis, supieron
  'andar',    // anduve, anduviste, anduvo, anduvimos, anduvisteis, anduvieron
  'estar',    // estuve, estuviste, estuvo, estuvimos, estuvisteis, estuvieron
  'dar',      // di, diste, dio, dimos, disteis, dieron
  'ir',       // fui, fuiste, fue, fuimos, fuisteis, fueron
  'ser',      // fui, fuiste, fue, fuimos, fuisteis, fueron
]

console.log('=== Análisis detallado de verbos irregulares fuertes ===\n')

for (const verb of strongStemVerbs) {
  console.log(`--- ${verb.toUpperCase()} ---`)
  
  const families = categorizeVerb(verb)
  console.log(`Familias detectadas: ${families.join(', ')}`)
  
  const group = getSimplifiedGroupForVerb(families, 'pretIndef')
  console.log(`Grupo asignado: ${group || 'NINGUNO'}`)
  
  const shouldBeStrong = group === 'PRETERITE_STRONG_STEM'
  const shouldNotBeThird = group !== 'PRETERITE_THIRD_PERSON'
  
  const status = (shouldBeStrong && shouldNotBeThird) ? '✅ CORRECTO' : '❌ ERROR'
  console.log(`Estado: ${status}`)
  
  if (!shouldBeStrong || !shouldNotBeThird) {
    console.log('⚠️  PROBLEMA: Este verbo debería estar en PRETERITE_STRONG_STEM, no en PRETERITE_THIRD_PERSON')
  }
  
  console.log()
}

console.log('=== Análisis de familias incluidas en cada grupo ===\n')

const thirdPersonFamilies = expandSimplifiedGroup('PRETERITE_THIRD_PERSON')
console.log(`PRETERITE_THIRD_PERSON incluye: ${thirdPersonFamilies.join(', ')}`)

const strongStemFamilies = expandSimplifiedGroup('PRETERITE_STRONG_STEM')
console.log(`PRETERITE_STRONG_STEM incluye: ${strongStemFamilies.join(', ')}`)

console.log('\n=== Verificación específica de TRAER ===\n')

const traerFamilies = categorizeVerb('traer')
console.log(`TRAER tiene familias: ${traerFamilies.join(', ')}`)

console.log('\nVerificando si tiene familias de 3ª persona:')
for (const family of traerFamilies) {
  const isThirdPerson = thirdPersonFamilies.includes(family)
  console.log(`  ${family}: ${isThirdPerson ? '❌ SÍ (problema)' : '✅ NO'}`)
}

console.log('\nVerificando si tiene familias de raíz fuerte:')
for (const family of traerFamilies) {
  const isStrongStem = strongStemFamilies.includes(family)
  console.log(`  ${family}: ${isStrongStem ? '✅ SÍ' : '❌ NO (problema)'}`)
}