// Test del sistema de filtrado por nivel para verbos ZO_VERBS
import { 
  ZO_VERBS_LIST,
  isZOVerb,
  shouldFilterVerbByLevel,
  getFilterReason,
  isAdvancedLevel,
  getZOVerbsForLevel,
  getFilteringStats
} from './lib/levelVerbFiltering.js'

console.log('🧪 TESTING FILTRADO POR NIVEL (ZO_VERBS) 🧪\n')

// Test 1: Verificar lista de verbos ZO
console.log('1️⃣ VERBOS ZO_VERBS (consonante + cer → -zo)')
console.log('='.repeat(50))
console.log(`Total de verbos ZO: ${ZO_VERBS_LIST.length}`)
console.log(`Lista: ${ZO_VERBS_LIST.join(', ')}`)

ZO_VERBS_LIST.forEach(verb => {
  const isZO = isZOVerb(verb)
  console.log(`  ${verb}: ${isZO ? '✅' : '❌'} identificado como ZO_VERBS`)
})

// Test 2: Clasificación de niveles
console.log('\n2️⃣ CLASIFICACIÓN DE NIVELES')
console.log('='.repeat(50))
const allLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'ALL']
allLevels.forEach(level => {
  const isAdvanced = isAdvancedLevel(level)
  console.log(`${level}: ${isAdvanced ? '✅ AVANZADO' : '❌ BÁSICO'} (${isAdvanced ? 've todos' : 'NO ve'} los ZO_VERBS)`)
})

// Test 3: Filtrado por nivel y tiempo
console.log('\n3️⃣ FILTRADO POR NIVEL Y TIEMPO')
console.log('='.repeat(50))

const testVerb = 'ejercer'
const testFamilies = ['ZO_VERBS']
const testTenses = ['pres', 'subjPres', 'pretIndef', 'fut']

console.log(`Verbo de prueba: ${testVerb} (familias: ${testFamilies.join(', ')})`)
console.log('')

allLevels.forEach(level => {
  console.log(`NIVEL ${level}:`)
  testTenses.forEach(tense => {
    const shouldFilter = shouldFilterVerbByLevel(testVerb, testFamilies, level, tense)
    const reason = getFilterReason(testVerb, testFamilies, level, tense)
    
    const status = shouldFilter ? '❌ FILTRADO' : '✅ DISPONIBLE'
    console.log(`  ${tense}: ${status}`)
    if (reason) {
      console.log(`    → ${reason}`)
    }
  })
  console.log('')
})

// Test 4: Estadísticas por nivel
console.log('4️⃣ ESTADÍSTICAS POR NIVEL')
console.log('='.repeat(50))

allLevels.forEach(level => {
  const stats = getFilteringStats(level)
  console.log(`NIVEL ${level}:`)
  console.log(`  • Avanzado: ${stats.isAdvanced ? 'Sí' : 'No'}`)
  console.log(`  • Total ZO_VERBS: ${stats.totalZOVerbs}`)
  console.log(`  • Disponibles: ${stats.availableZOVerbs}`)
  console.log(`  • Filtrados: ${stats.filteredZOVerbs}`)
  console.log(`  • Filtrado activo: ${stats.filteringActive ? 'Sí' : 'No'}`)
  console.log('')
})

// Test 5: Simulación práctica
console.log('5️⃣ SIMULACIÓN PRÁCTICA')
console.log('='.repeat(50))

console.log('ESCENARIO: Usuario A1 selecciona "Irregulares en YO" para presente')
const basicLevel = 'A1'
const basicStats = getFilteringStats(basicLevel)
console.log(`• Usuario nivel: ${basicLevel}`)
console.log(`• Verbos ZO disponibles: ${basicStats.availableZOVerbs}/${basicStats.totalZOVerbs}`)
console.log(`• Verbos que NO verá: ${ZO_VERBS_LIST.join(', ')}`)
console.log(`• Verbos que SÍ verá: tener→tengo, conocer→conozco, proteger→protejo, seguir→sigo`)

console.log('')
console.log('ESCENARIO: Usuario B2 selecciona "Irregulares en YO" para presente')
const advancedLevel = 'B2'
const advancedStats = getFilteringStats(advancedLevel)
console.log(`• Usuario nivel: ${advancedLevel}`)
console.log(`• Verbos ZO disponibles: ${advancedStats.availableZOVerbs}/${advancedStats.totalZOVerbs}`)
console.log(`• Verbos adicionales que SÍ verá: ${ZO_VERBS_LIST.join(', ')}`)
console.log(`• Total disponible: G_VERBS + ZCO_VERBS + ZO_VERBS + JO_VERBS + GU_DROP`)

// Test 6: Casos edge
console.log('\n6️⃣ CASOS EDGE')
console.log('='.repeat(50))

// Verbo que no es ZO_VERBS
const regularVerb = 'tener'
const regularFamilies = ['G_VERBS']
console.log(`Verbo regular (${regularVerb}) con familias [${regularFamilies.join(', ')}]:`)
allLevels.slice(0, 3).forEach(level => {
  const shouldFilter = shouldFilterVerbByLevel(regularVerb, regularFamilies, level, 'pres')
  console.log(`  ${level}: ${shouldFilter ? '❌ FILTRADO' : '✅ DISPONIBLE'} (esperado: disponible)`)
})

console.log('')

// Verbo ZO en tiempo no afectado
console.log(`Verbo ZO (${testVerb}) en tiempo no afectado (pretérito):`)
allLevels.slice(0, 3).forEach(level => {
  const shouldFilter = shouldFilterVerbByLevel(testVerb, testFamilies, level, 'pretIndef')
  console.log(`  ${level}: ${shouldFilter ? '❌ FILTRADO' : '✅ DISPONIBLE'} (esperado: disponible)`)
})

console.log('\n🎉 TESTING COMPLETADO')

console.log('\n💡 FUNCIONALIDAD IMPLEMENTADA:')
console.log('• Verbos ZO_VERBS (consonante + cer → -zo) incluidos en "Irregulares en YO"')
console.log('• Filtrado automático: A1, A2, B1 NO ven estos verbos')
console.log('• Disponible para: B2, C1, C2, ALL SÍ ven estos verbos') 
console.log('• Solo afecta: presente indicativo, subjuntivo, imperativo')
console.log('• No afecta: pretérito, futuro, otros tiempos')
console.log(`• Total de ${ZO_VERBS_LIST.length} verbos ZO controlados por nivel`)

console.log('\n🎯 RESULTADO ESPERADO:')
console.log('• Usuario A1 practicando "Irregulares en YO": NO verá ejercer, vencer, torcer')
console.log('• Usuario B2 practicando "Irregulares en YO": SÍ verá ejercer→ejerzo, vencer→venzo')