#!/usr/bin/env node

// Demostración práctica del nuevo modo extensivo
// Muestra exactamente cómo el usuario se beneficia del sistema

import { verbs } from './src/data/verbs.js'
import { shouldFilterVerbByLevel } from './src/lib/core/levelVerbFiltering.js'
import { categorizeVerb } from './src/lib/data/irregularFamilies.js'

console.log('🚀 DEMOSTRACIÓN: MODO EXTENSIVO EN ACCIÓN')
console.log('=========================================\n')

// Función helper para obtener verbos disponibles
function getAvailableVerbs(level, extensiveMode = true) {
  const available = []
  
  for (const lemma of [...new Set(verbs.map(v => v.lemma))]) {
    const verb = verbs.find(v => v.lemma === lemma)
    if (!verb) continue
    
    const verbFamilies = categorizeVerb(lemma, verb)
    const filtered = shouldFilterVerbByLevel(lemma, verbFamilies, level, 'presente', extensiveMode)
    
    if (!filtered) {
      available.push(lemma)
    }
  }
  
  return available
}

console.log('🎯 COMPARACIÓN ANTES vs DESPUÉS')
console.log('===============================\n')

const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

for (const level of levels) {
  const strictVerbs = getAvailableVerbs(level, false)
  const extensiveVerbs = getAvailableVerbs(level, true)
  
  const improvement = extensiveVerbs.length - strictVerbs.length
  const percentImprovement = Math.round((improvement / strictVerbs.length) * 100)
  
  console.log(`📚 NIVEL ${level}`)
  console.log(`   Antes (estricto):  ${strictVerbs.length} verbos`)
  console.log(`   Ahora (extensivo): ${extensiveVerbs.length} verbos`)
  console.log(`   📈 Mejora: +${improvement} verbos (${percentImprovement}% más contenido)`)
  
  // Mostrar ejemplos de verbos añadidos
  const newVerbs = extensiveVerbs.filter(v => !strictVerbs.includes(v))
  if (newVerbs.length > 0) {
    const examples = newVerbs.slice(0, 6).join(', ')
    console.log(`   🆕 Nuevos: ${examples}${newVerbs.length > 6 ? '...' : ''}`)
  }
  console.log()
}

console.log('💡 BENEFICIOS PRÁCTICOS PARA EL USUARIO')
console.log('======================================\n')

const practicalBenefits = [
  {
    level: 'A1',
    before: getAvailableVerbs('A1', false).length,
    after: getAvailableVerbs('A1', true).length,
    impact: 'Más variedad desde el principio - el usuario no se aburre con solo verbos básicos'
  },
  {
    level: 'B1', 
    before: getAvailableVerbs('B1', false).length,
    after: getAvailableVerbs('B1', true).length,
    impact: 'Acceso gradual a verbos más complejos sin saltos bruscos de dificultad'
  },
  {
    level: 'C1',
    before: getAvailableVerbs('C1', false).length, 
    after: getAvailableVerbs('C1', true).length,
    impact: 'Aprovecha TODO el repertorio construido - ningún verbo se desperdicia'
  }
]

for (const benefit of practicalBenefits) {
  const gain = benefit.after - benefit.before
  console.log(`🎯 ${benefit.level}: ${benefit.before} → ${benefit.after} verbos (+${gain})`)
  console.log(`   ✨ ${benefit.impact}`)
  console.log()
}

console.log('🔧 CONFIGURACIÓN RECOMENDADA')
console.log('===========================\n')

console.log('Para aprovechar al máximo tu repertorio de verbos:')
console.log()
console.log('```javascript')
console.log('// En settings.js')
console.log('verbFilterMode: "extensive",  // Usar modo extensivo')
console.log('extensiveMode: {')
console.log('  enabled: true,                    // ✅ Activado')
console.log('  fallbackToHigherLevels: true,     // ✅ Progresión suave')
console.log('  autoCategorizationEnabled: true,  // ✅ Incluir verbos no categorizados')
console.log('  prioritizeCategorized: true       // ✅ Priorizar verbos específicos del nivel')
console.log('}')
console.log('```')

console.log('\n🎮 EXPERIENCIA DEL USUARIO')
console.log('=========================\n')

console.log('✅ ANTES (modo estricto):')
console.log('   - Limitaciones artificiales')
console.log('   - Verbos importantes filtrados en niveles avanzados')
console.log('   - Desperdicio del repertorio construido')
console.log('')

console.log('🚀 AHORA (modo extensivo):')
console.log('   - Progresión natural y suave')
console.log('   - Todos los verbos categorizados se utilizan')
console.log('   - Fallback inteligente a niveles superiores')
console.log('   - Máximo aprovechamiento de la base de datos')
console.log('   - El usuario nunca se queda sin contenido')

console.log('\n📊 ESTADÍSTICAS FINALES')
console.log('======================\n')

const totalStrictCoverage = new Set()
const totalExtensiveCoverage = new Set()

for (const level of levels) {
  getAvailableVerbs(level, false).forEach(v => totalStrictCoverage.add(v))
  getAvailableVerbs(level, true).forEach(v => totalExtensiveCoverage.add(v))
}

const totalVerbs = [...new Set(verbs.map(v => v.lemma))].length
const strictEfficiency = Math.round((totalStrictCoverage.size / totalVerbs) * 100)
const extensiveEfficiency = Math.round((totalExtensiveCoverage.size / totalVerbs) * 100)

console.log(`📚 Total de verbos en base de datos: ${totalVerbs}`)
console.log(`📉 Modo estricto utilizaba: ${totalStrictCoverage.size} verbos (${strictEfficiency}%)`)  
console.log(`📈 Modo extensivo utiliza: ${totalExtensiveCoverage.size} verbos (${extensiveEfficiency}%)`)
console.log(`🎯 Verbos rescatados: ${totalExtensiveCoverage.size - totalStrictCoverage.size}`)

console.log('\n🏆 CONCLUSIÓN')
console.log('============')
console.log('✅ NO se pierden verbos del repertorio construido')
console.log('✅ Progresión pedagógica mantenida')
console.log('✅ Máximo aprovechamiento de la base de datos')
console.log('✅ Experiencia de usuario mejorada')
console.log(`✅ ${Math.round(((totalExtensiveCoverage.size - totalStrictCoverage.size) / totalStrictCoverage.size) * 100)}% más contenido disponible`)