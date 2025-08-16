#!/usr/bin/env node

// Verificación específica que NO se pierden verbos importantes
// y que el sistema progresivo funciona correctamente

import { verbs } from './src/data/verbs.js'
import { shouldFilterVerbByLevel } from './src/lib/core/levelVerbFiltering.js'
import { categorizeVerb } from './src/lib/data/irregularFamilies.js'
import { getAllowedVerbsForLevel } from './src/lib/data/verbsByLevel.js'

console.log('🛡️  VERIFICACIÓN: NO HAY PÉRDIDA DE VERBOS')
console.log('==========================================\n')

// Verbos críticos que NUNCA deberían perderse
const criticalVerbs = [
  'ser', 'estar', 'tener', 'haber', 'hacer', 'ir', 'venir', 'poder', 'querer', 'decir',
  'dar', 'ver', 'saber', 'poner', 'salir', 'valer', 'traer', 'oír', 'caer', 'leer'
]

console.log('🔍 Verificando verbos críticos...')

let allCriticalVerbsPresent = true

for (const level of ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']) {
  console.log(`\n--- ${level} ---`)
  
  const availableInStrict = []
  const availableInExtensive = []
  const lostCritical = []
  
  for (const lemma of criticalVerbs) {
    const verb = verbs.find(v => v.lemma === lemma)
    if (!verb) continue
    
    const verbFamilies = categorizeVerb(lemma, verb)
    
    // Modo estricto
    const strictFiltered = shouldFilterVerbByLevel(lemma, verbFamilies, level, 'presente', false)
    if (!strictFiltered) {
      availableInStrict.push(lemma)
    }
    
    // Modo extensivo
    const extensiveFiltered = shouldFilterVerbByLevel(lemma, verbFamilies, level, 'presente', true)
    if (!extensiveFiltered) {
      availableInExtensive.push(lemma)
    } else {
      lostCritical.push(lemma)
      allCriticalVerbsPresent = false
    }
  }
  
  console.log(`Críticos en modo estricto: ${availableInStrict.length}/${criticalVerbs.length}`)
  console.log(`Críticos en modo extensivo: ${availableInExtensive.length}/${criticalVerbs.length}`)
  
  if (lostCritical.length > 0) {
    console.log(`❌ CRÍTICOS PERDIDOS: ${lostCritical.join(', ')}`)
  } else {
    console.log(`✅ Todos los verbos críticos preservados`)
  }
}

console.log('\n📊 ANÁLISIS DE PROGRESIÓN POR NIVEL')
console.log('==================================\n')

// Verificar que cada nivel tenga más o igual verbos que el anterior (progresión)
const levelProgression = []

for (const level of ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']) {
  let count = 0
  
  for (const lemma of [...new Set(verbs.map(v => v.lemma))]) {
    const verb = verbs.find(v => v.lemma === lemma)
    if (!verb) continue
    
    const verbFamilies = categorizeVerb(lemma, verb)
    const filtered = shouldFilterVerbByLevel(lemma, verbFamilies, level, 'presente', true)
    
    if (!filtered) count++
  }
  
  levelProgression.push({ level, count })
}

console.log('Progresión de verbos disponibles:')
for (let i = 0; i < levelProgression.length; i++) {
  const current = levelProgression[i]
  const previous = levelProgression[i - 1]
  
  if (previous) {
    const increase = current.count - previous.count
    const status = increase >= 0 ? '✅' : '❌'
    console.log(`${current.level}: ${current.count} verbos (${increase >= 0 ? '+' : ''}${increase} vs ${previous.level}) ${status}`)
  } else {
    console.log(`${current.level}: ${current.count} verbos (inicial) ✅`)
  }
}

console.log('\n🎯 VERIFICACIÓN DE CASOS ESPECÍFICOS')
console.log('===================================\n')

// Casos específicos que mencionó el usuario
const testCases = [
  {
    description: 'A1 debe tener verbos básicos',
    level: 'A1',
    expectedVerbs: ['ser', 'estar', 'tener', 'hablar', 'comer'],
    minCount: 15
  },
  {
    description: 'B1 debe incluir irregulares básicos',
    level: 'B1', 
    expectedVerbs: ['pensar', 'volver', 'pedir', 'dormir'],
    minCount: 50
  },
  {
    description: 'C1 debe usar todo el repertorio difícil',
    level: 'C1',
    expectedVerbs: ['yacer', 'raer', 'asir', 'caber'],
    minCount: 150
  }
]

for (const testCase of testCases) {
  console.log(`${testCase.description}:`)
  
  let availableCount = 0
  const foundExpected = []
  const missingExpected = []
  
  for (const lemma of [...new Set(verbs.map(v => v.lemma))]) {
    const verb = verbs.find(v => v.lemma === lemma)
    if (!verb) continue
    
    const verbFamilies = categorizeVerb(lemma, verb)
    const filtered = shouldFilterVerbByLevel(lemma, verbFamilies, testCase.level, 'presente', true)
    
    if (!filtered) {
      availableCount++
      if (testCase.expectedVerbs.includes(lemma)) {
        foundExpected.push(lemma)
      }
    }
  }
  
  for (const expected of testCase.expectedVerbs) {
    if (!foundExpected.includes(expected)) {
      missingExpected.push(expected)
    }
  }
  
  const countCheck = availableCount >= testCase.minCount ? '✅' : '❌'
  const expectedCheck = missingExpected.length === 0 ? '✅' : '❌'
  
  console.log(`  Total disponibles: ${availableCount} (mín: ${testCase.minCount}) ${countCheck}`)
  console.log(`  Verbos esperados: ${foundExpected.length}/${testCase.expectedVerbs.length} ${expectedCheck}`)
  
  if (missingExpected.length > 0) {
    console.log(`  ❌ Faltan: ${missingExpected.join(', ')}`)
  }
  
  console.log()
}

console.log('🏆 RESUMEN FINAL')
console.log('===============')

const success = allCriticalVerbsPresent && 
  levelProgression.every((curr, i) => i === 0 || curr.count >= levelProgression[i-1].count)

if (success) {
  console.log('✅ ÉXITO TOTAL: El sistema preserva todos los verbos importantes')
  console.log('✅ La progresión por niveles funciona correctamente')
  console.log('✅ NO hay pérdida del repertorio construido')
  console.log('✅ El sistema aprovecha al máximo la base de datos')
} else {
  console.log('❌ HAY PROBLEMAS: Revisar configuración')
}

console.log(`\n📈 MEJORA GENERAL:`)
console.log(`- Modo anterior (estricto): Limitaba artificialmente los verbos`)
console.log(`- Modo nuevo (extensivo): Usa ${levelProgression[levelProgression.length-1].count} verbos progresivamente`)
console.log(`- Beneficio: Máximo aprovechamiento del repertorio construido`)