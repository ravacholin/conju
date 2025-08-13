// Test específico para grupos de pretérito indefinido
import { 
  getSimplifiedGroupsForTense,
  expandSimplifiedGroup,
  shouldUseSimplifiedGrouping
} from './lib/simplifiedFamilyGroups.js'

console.log('🧪 TESTING GRUPOS DE PRETÉRITO INDEFINIDO 🧪\n')

// Test 1: Verificar que pretérito indefinido usa agrupación simplificada
console.log('1️⃣ SOPORTE DE AGRUPACIÓN SIMPLIFICADA')
console.log('='.repeat(50))
const tenses = ['pres', 'pretIndef', 'fut', 'subjPres', 'subjImpf']
tenses.forEach(tense => {
  const isSupported = shouldUseSimplifiedGrouping(tense)
  console.log(`${tense}: ${isSupported ? '✅ SÍ' : '❌ NO'} usa agrupación simplificada`)
})

// Test 2: Grupos específicos para pretérito indefinido
console.log('\n2️⃣ GRUPOS PARA PRETÉRITO INDEFINIDO')
console.log('='.repeat(50))
const preteriteGroups = getSimplifiedGroupsForTense('pretIndef')
console.log(`Total de grupos para pretIndef: ${preteriteGroups.length}`)

preteriteGroups.forEach(group => {
  console.log(`\n📁 ${group.name}`)
  console.log(`   ID: ${group.id}`)
  console.log(`   Descripción: ${group.description}`)
  console.log(`   Explicación: ${group.explanation}`)
  console.log(`   Familias incluidas: ${group.includedFamilies.join(', ')}`)
  console.log(`   Verbos ejemplo: ${group.exampleVerbs.join(', ')}`)
})

// Test 3: Expansión de grupos de pretérito
console.log('\n3️⃣ EXPANSIÓN DE GRUPOS DE PRETÉRITO')
console.log('='.repeat(50))

const preteriteGroupIds = ['PRETERITE_THIRD_PERSON', 'PRETERITE_STRONG_STEM']
preteriteGroupIds.forEach(groupId => {
  const expanded = expandSimplifiedGroup(groupId)
  console.log(`${groupId}:`)
  console.log(`  ✅ Expande a: ${expanded.join(', ')}`)
  console.log('')
})

// Test 4: Simulación de categorización de verbos
console.log('4️⃣ SIMULACIÓN DE CATEGORIZACIÓN POR GRUPO')
console.log('='.repeat(50))

// Verbos de prueba con sus familias técnicas simuladas
const testVerbs = {
  // Grupo PRETERITE_THIRD_PERSON
  'pedir': ['E_I_IR'],         // pidió, pidieron
  'servir': ['E_I_IR'],        // sirvió, sirvieron  
  'dormir': ['O_U_GER_IR'],    // durmió, durmieron
  'morir': ['O_U_GER_IR'],     // murió, murieron
  'leer': ['HIATUS_Y'],        // leyó, leyeron
  'caer': ['G_VERBS', 'HIATUS_Y'],  // cayó, cayeron
  'oír': ['G_VERBS', 'HIATUS_Y'],   // oyó, oyeron
  'creer': ['HIATUS_Y'],       // creyó, creyeron
  
  // Grupo PRETERITE_STRONG_STEM  
  'tener': ['G_VERBS', 'PRET_UV'],    // tuve, tuviste...
  'estar': ['PRET_UV'],               // estuve, estuviste...
  'andar': ['PRET_UV'],               // anduve, anduviste...
  'poder': ['DIPHT_O_UE', 'PRET_U'],  // pude, pudiste...
  'poner': ['G_VERBS', 'PRET_U'],     // puse, pusiste...
  'saber': ['PRET_U'],                // supe, supiste...
  'hacer': ['G_VERBS', 'PRET_I'],     // hice, hiciste...
  'venir': ['G_VERBS', 'PRET_I'],     // vine, viniste...
  'querer': ['DIPHT_E_IE', 'PRET_I'], // quise, quisiste...
  'decir': ['G_VERBS', 'PRET_J'],     // dije, dijiste...
  'traer': ['G_VERBS', 'PRET_J'],     // traje, trajiste...
  'conducir': ['ZCO_VERBS', 'PRET_J'], // conduje, condujiste...
  'ir': ['PRET_SUPPL'],               // fue, fuiste...
  'ser': ['PRET_SUPPL'],              // fue, fuiste...
  'dar': ['PRET_SUPPL'],              // dio, diste...
  'ver': ['PRET_SUPPL']               // vio, viste...
}

preteriteGroups.forEach(group => {
  console.log(`\n📁 ${group.name}:`)
  
  const verbsInGroup = Object.entries(testVerbs).filter(([verb, families]) => {
    return group.includedFamilies.some(familyId => families.includes(familyId))
  }).map(([verb]) => verb)
  
  if (verbsInGroup.length > 0) {
    console.log(`  ✅ Verbos: ${verbsInGroup.join(', ')}`)
  } else {
    console.log(`  ❌ Sin verbos de prueba`)
  }
})

// Test 5: Comparación con presente
console.log('\n5️⃣ COMPARACIÓN CON PRESENTE')
console.log('='.repeat(50))

const presentGroups = getSimplifiedGroupsForTense('pres')
console.log(`Grupos para PRESENTE: ${presentGroups.length}`)
presentGroups.forEach(group => {
  console.log(`  • ${group.name}`)
})

console.log(`\nGrupos para PRETÉRITO: ${preteriteGroups.length}`)
preteriteGroups.forEach(group => {
  console.log(`  • ${group.name}`)
})

console.log('\n6️⃣ EJEMPLO DE USO')
console.log('='.repeat(50))
console.log('Cuando el usuario selecciona PRETÉRITO INDEFINIDO + IRREGULARES:')
console.log('  🎯 Opción 1: "Irregulares en 3ª persona"')
console.log('     → Incluye: pedir (pidió), dormir (durmió), leer (leyó), caer (cayó)')
console.log('  🎯 Opción 2: "Muy Irregulares (raíz fuerte)"') 
console.log('     → Incluye: tener (tuve), hacer (hice), ir (fue), decir (dije)')

console.log('\n🎉 TESTING COMPLETADO')
console.log('\n💡 FUNCIONALIDAD PRETÉRITO INDEFINIDO:')
console.log('• Grupo 1: Irregulares en 3ª persona (cambios e→i, o→u, vocal+y)')
console.log('• Grupo 2: Muy irregulares (raíces fuertes: -uv-, -u-, -i-, -j-, supletivos)')
console.log('• Diferente a presente: grupos específicos para cada tiempo verbal')