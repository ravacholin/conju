#!/usr/bin/env node

// Script para verificar que el nuevo sistema usa todo el repertorio de verbos
// y no pierde verbos importantes por filtrado excesivo

import { verbs } from './src/data/verbs.js'
import { shouldFilterVerbByLevel, getFilteringStats, EXTENSIVE_MODE_CONFIG } from './src/lib/core/levelVerbFiltering.js'
import { categorizeVerb } from './src/lib/data/irregularFamilies.js'
import { getAllowedVerbsForLevel } from './src/lib/data/verbsByLevel.js'

console.log('🔍 ANÁLISIS DE COBERTURA DE VERBOS')
console.log('==================================\n')

// Obtener todos los verbos únicos de la base de datos
const allVerbLemmas = [...new Set(verbs.map(v => v.lemma))]
console.log(`📊 Total de verbos en la base de datos: ${allVerbLemmas.length}`)

// Probar cobertura por nivel
const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'ALL']

console.log('\n🎯 MODO ESTRICTO vs MODO EXTENSIVO')
console.log('================================\n')

for (const level of levels) {
  console.log(`--- NIVEL ${level} ---`)
  
  // Modo estricto (original)
  let strictFiltered = 0
  let strictAllowed = 0
  
  // Modo extensivo (nuevo)
  let extensiveFiltered = 0
  let extensiveAllowed = 0
  
  // Verbos únicos permitidos
  const strictVerbsSet = new Set()
  const extensiveVerbsSet = new Set()
  
  for (const lemma of allVerbLemmas) {
    // Encontrar el verbo en la base de datos
    const verb = verbs.find(v => v.lemma === lemma)
    if (!verb) continue
    
    const verbFamilies = categorizeVerb(lemma, verb)
    
    // Probar modo estricto
    const strictShouldFilter = shouldFilterVerbByLevel(lemma, verbFamilies, level, 'presente', false)
    if (strictShouldFilter) {
      strictFiltered++
    } else {
      strictAllowed++
      strictVerbsSet.add(lemma)
    }
    
    // Probar modo extensivo
    const extensiveShouldFilter = shouldFilterVerbByLevel(lemma, verbFamilies, level, 'presente', true)
    if (extensiveShouldFilter) {
      extensiveFiltered++
    } else {
      extensiveAllowed++
      extensiveVerbsSet.add(lemma)
    }
  }
  
  console.log(`  Modo ESTRICTO:  ${strictAllowed} permitidos, ${strictFiltered} filtrados (${Math.round((strictFiltered/allVerbLemmas.length)*100)}% filtrados)`)
  console.log(`  Modo EXTENSIVO: ${extensiveAllowed} permitidos, ${extensiveFiltered} filtrados (${Math.round((extensiveFiltered/allVerbLemmas.length)*100)}% filtrados)`)
  
  const improvement = extensiveAllowed - strictAllowed
  if (improvement > 0) {
    console.log(`  ✅ MEJORA: +${improvement} verbos adicionales (${Math.round((improvement/strictAllowed)*100)}% más)`)
  } else if (improvement < 0) {
    console.log(`  ⚠️  REDUCCIÓN: ${improvement} verbos menos`)
  } else {
    console.log(`  ➡️  Sin cambio`)
  }
  
  // Mostrar ejemplos de verbos añadidos en modo extensivo
  const newVerbs = [...extensiveVerbsSet].filter(v => !strictVerbsSet.has(v))
  if (newVerbs.length > 0) {
    console.log(`  📝 Ejemplos nuevos: ${newVerbs.slice(0, 8).join(', ')}${newVerbs.length > 8 ? '...' : ''}`)
  }
  
  console.log()
}

console.log('\n🔄 VERIFICACIÓN DE FALLBACK')
console.log('==========================\n')

// Verificar que los verbos categorizados específicamente se mantengan
for (const level of levels.slice(0, -1)) { // Excluir 'ALL'
  const categorizedVerbs = getAllowedVerbsForLevel(level)
  let maintainedCount = 0
  let lostCount = 0
  const lostVerbs = []
  
  for (const lemma of categorizedVerbs) {
    const verb = verbs.find(v => v.lemma === lemma)
    if (!verb) continue
    
    const verbFamilies = categorizeVerb(lemma, verb)
    const shouldFilter = shouldFilterVerbByLevel(lemma, verbFamilies, level, 'presente', true)
    
    if (shouldFilter) {
      lostCount++
      lostVerbs.push(lemma)
    } else {
      maintainedCount++
    }
  }
  
  console.log(`${level}: ${maintainedCount}/${categorizedVerbs.length} verbos categorizados mantenidos`)
  if (lostCount > 0) {
    console.log(`  ❌ PERDIDOS: ${lostVerbs.slice(0, 5).join(', ')}${lostVerbs.length > 5 ? '...' : ''}`)
  } else {
    console.log(`  ✅ Todos los verbos categorizados mantenidos`)
  }
}

console.log('\n📈 ESTADÍSTICAS FINALES')
console.log('=====================\n')

// Estadísticas de cobertura total
const totalCoverageStrict = new Set()
const totalCoverageExtensive = new Set()

for (const level of levels.slice(0, -1)) { // Excluir 'ALL'
  for (const lemma of allVerbLemmas) {
    const verb = verbs.find(v => v.lemma === lemma)
    if (!verb) continue
    
    const verbFamilies = categorizeVerb(lemma, verb)
    
    if (!shouldFilterVerbByLevel(lemma, verbFamilies, level, 'presente', false)) {
      totalCoverageStrict.add(lemma)
    }
    
    if (!shouldFilterVerbByLevel(lemma, verbFamilies, level, 'presente', true)) {
      totalCoverageExtensive.add(lemma)
    }
  }
}

console.log(`Cobertura total ESTRICTA:  ${totalCoverageStrict.size}/${allVerbLemmas.length} verbos (${Math.round((totalCoverageStrict.size/allVerbLemmas.length)*100)}%)`)
console.log(`Cobertura total EXTENSIVA: ${totalCoverageExtensive.size}/${allVerbLemmas.length} verbos (${Math.round((totalCoverageExtensive.size/allVerbLemmas.length)*100)}%)`)

const totalImprovement = totalCoverageExtensive.size - totalCoverageStrict.size
console.log(`MEJORA TOTAL: +${totalImprovement} verbos adicionales disponibles`)

// Verificar verbos que nunca aparecen
const neverUsedVerbs = allVerbLemmas.filter(lemma => !totalCoverageExtensive.has(lemma))
if (neverUsedVerbs.length > 0) {
  console.log(`\n⚠️  VERBOS NUNCA UTILIZADOS: ${neverUsedVerbs.length}`)
  console.log(`Ejemplos: ${neverUsedVerbs.slice(0, 10).join(', ')}${neverUsedVerbs.length > 10 ? '...' : ''}`)
} else {
  console.log(`\n✅ ÉXITO: Todos los verbos son utilizables en algún nivel`)
}

console.log('\n🎯 RESUMEN')
console.log('=========')
console.log(`- Base de datos: ${allVerbLemmas.length} verbos`)
console.log(`- Modo estricto: ${totalCoverageStrict.size} verbos utilizables`)
console.log(`- Modo extensivo: ${totalCoverageExtensive.size} verbos utilizables`)
console.log(`- Verbos rescatados: ${totalImprovement}`)
console.log(`- Verbos perdidos: ${neverUsedVerbs.length}`)
console.log(`- Eficiencia total: ${Math.round((totalCoverageExtensive.size/allVerbLemmas.length)*100)}%`)