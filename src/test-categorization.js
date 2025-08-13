// Test script para la categorización de verbos
import { 
  showCategorizationSummary, 
  detectMisclassifiedVerbs, 
  testSpecificVerb,
  testVerbsByFamily 
} from './lib/categorizationScript.js'

console.log('Iniciando análisis de categorización de verbos...\n')

// Mostrar resumen general
const results = showCategorizationSummary()

console.log('\n' + '='.repeat(50))

// Detectar verbos mal clasificados
console.log('Detectando verbos mal clasificados...\n')
const misclassified = detectMisclassifiedVerbs()

console.log('\n' + '='.repeat(50))

// Probar verbos específicos
const testVerbs = ['pensar', 'tener', 'conducir', 'construir', 'buscar', 'jugar']
console.log('Probando verbos específicos...\n')
testVerbs.forEach(verb => {
  testSpecificVerb(verb)
  console.log('')
})

console.log('\n' + '='.repeat(50))

// Probar familias específicas
const testFamilies = ['G_VERBS', 'DIPHT_E_IE', 'ZCO_VERBS']
testFamilies.forEach(familyId => {
  console.log(`\nVerbos en familia ${familyId}:`)
  testVerbsByFamily(familyId)
  console.log('')
})