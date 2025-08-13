#!/usr/bin/env node

// Debug: filtrado de grupos en el generador
import { categorizeVerb } from './lib/irregularFamilies.js'
import { expandSimplifiedGroup } from './lib/simplifiedFamilyGroups.js'

console.log('🔍 Debugging Group Filtering in Generator\n')

// Simular lo que hace el generador cuando selectedFamily = 'PRETERITE_THIRD_PERSON'
const selectedFamily = 'PRETERITE_THIRD_PERSON'
const expandedFamilies = expandSimplifiedGroup(selectedFamily)

console.log(`=== Filtrado para ${selectedFamily} ===`)
console.log(`Familias expandidas: ${expandedFamilies.join(', ')}`)
console.log()

// Verbos problemáticos que podrían aparecer incorrectamente
const testVerbs = [
  'traer',    // Debería ir a PRETERITE_STRONG_STEM
  'caer',     // Debería ir a PRETERITE_STRONG_STEM
  'oír',      // Debería ir a PRETERITE_STRONG_STEM
  'decir',    // Debería ir a PRETERITE_STRONG_STEM
  'pedir',    // SÍ debería estar en PRETERITE_THIRD_PERSON
  'leer',     // SÍ debería estar en PRETERITE_THIRD_PERSON
  'dormir',   // SÍ debería estar en PRETERITE_THIRD_PERSON
]

console.log('=== Simulación del filtrado del generador ===\n')

for (const verb of testVerbs) {
  console.log(`--- ${verb.toUpperCase()} ---`)
  
  const verbFamilies = categorizeVerb(verb)
  console.log(`Familias del verbo: ${verbFamilies.join(', ')}`)
  
  // Simular la lógica del generador
  const hasMatchingFamily = expandedFamilies.some(familyId => 
    verbFamilies.includes(familyId)
  )
  
  console.log(`¿Tiene familia que coincida con PRETERITE_THIRD_PERSON?: ${hasMatchingFamily ? 'SÍ' : 'NO'}`)
  
  if (hasMatchingFamily) {
    const matchingFamilies = expandedFamilies.filter(familyId => 
      verbFamilies.includes(familyId)
    )
    console.log(`Familias coincidentes: ${matchingFamilies.join(', ')}`)
  }
  
  const shouldAppear = hasMatchingFamily
  const shouldNotAppear = !hasMatchingFamily
  
  // Verificar si el resultado es correcto
  const correctlyIncluded = ['pedir', 'leer', 'dormir'].includes(verb) && shouldAppear
  const correctlyExcluded = ['traer', 'caer', 'oír', 'decir'].includes(verb) && shouldNotAppear
  
  const status = (correctlyIncluded || correctlyExcluded) ? '✅ CORRECTO' : '❌ ERROR'
  console.log(`¿Aparecerá en drill?: ${shouldAppear ? 'SÍ' : 'NO'} - ${status}`)
  
  console.log()
}

console.log('=== Análisis del problema ===\n')
console.log('El filtrado funciona correctamente basado en las familias.')
console.log('Si TRAER aparece, debe ser porque:')
console.log('1. Tiene una familia que está en PRETERITE_THIRD_PERSON (que no debería tener)')
console.log('2. O hay otro problema en el pipeline del generador')
console.log()

// Verificar si hay familias cruzadas
console.log('=== Verificación de familias cruzadas ===\n')

const traerFamilies = categorizeVerb('traer')
console.log(`TRAER familias: ${traerFamilies.join(', ')}`)

const intersectionThird = traerFamilies.filter(f => expandedFamilies.includes(f))
console.log(`Intersección con PRETERITE_THIRD_PERSON: ${intersectionThird.join(', ') || 'NINGUNA'}`)

if (intersectionThird.length > 0) {
  console.log('❌ PROBLEMA ENCONTRADO: TRAER tiene familias que están en PRETERITE_THIRD_PERSON')
  console.log('   Esto explica por qué aparece en el drill de terceras personas')
} else {
  console.log('✅ No hay intersección - el problema debe estar en otra parte')
}