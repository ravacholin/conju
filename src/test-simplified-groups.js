// Test del sistema de grupos simplificados
import { 
  getAllSimplifiedGroups,
  getSimplifiedGroupsForMood,
  getSimplifiedGroupsForTense,
  expandSimplifiedGroup,
  shouldUseSimplifiedGroupingForMood
} from './lib/simplifiedFamilyGroups.js'

// import { categorizeVerb } from './lib/categorizationScript.js' // Not needed for this test

console.log('🧪 TESTING SISTEMA DE GRUPOS SIMPLIFICADOS 🧪\n')

// Test 1: Verificar grupos simplificados disponibles
console.log('1️⃣ GRUPOS SIMPLIFICADOS DISPONIBLES')
console.log('='.repeat(50))
const allGroups = getAllSimplifiedGroups()
allGroups.forEach(group => {
  console.log(`📁 ${group.name}`)
  console.log(`   ID: ${group.id}`)
  console.log(`   Descripción: ${group.description}`)
  console.log(`   Explicación: ${group.explanation}`)
  console.log(`   Familias incluidas: ${group.includedFamilies.join(', ')}`)
  console.log(`   Tiempos relevantes: ${group.relevantTenses.join(', ')}`)
  console.log('')
})

// Test 2: Verificar agrupación por modo
console.log('2️⃣ AGRUPACIÓN POR MODO VERBAL')
console.log('='.repeat(50))
const moods = ['indicative', 'subjunctive', 'imperative', 'conditional']
moods.forEach(mood => {
  const shouldUse = shouldUseSimplifiedGroupingForMood(mood)
  const groups = getSimplifiedGroupsForMood(mood)
  
  console.log(`${mood.toUpperCase()}: ${shouldUse ? 'USA AGRUPACIÓN SIMPLIFICADA' : 'usa familias completas'}`)
  if (groups.length > 0) {
    groups.forEach(group => {
      console.log(`  ✅ ${group.name}`)
    })
  } else {
    console.log(`  ❌ Sin grupos simplificados`)
  }
  console.log('')
})

// Test 3: Verificar agrupación por tiempo específico
console.log('3️⃣ AGRUPACIÓN POR TIEMPO ESPECÍFICO')
console.log('='.repeat(50))
const tenses = ['pres', 'subjPres', 'pretIndef', 'fut', 'impAff']
tenses.forEach(tense => {
  const groups = getSimplifiedGroupsForTense(tense)
  console.log(`${tense}: ${groups.length} grupos`)
  groups.forEach(group => {
    console.log(`  📋 ${group.name}`)
  })
  console.log('')
})

// Test 4: Verificar expansión de grupos
console.log('4️⃣ EXPANSIÓN DE GRUPOS SIMPLIFICADOS')
console.log('='.repeat(50))
const testGroups = ['STEM_CHANGES', 'FIRST_PERSON_IRREGULAR', 'INVALID_GROUP']
testGroups.forEach(groupId => {
  const expanded = expandSimplifiedGroup(groupId)
  console.log(`${groupId}:`)
  if (expanded.length > 0) {
    console.log(`  ✅ Expande a: ${expanded.join(', ')}`)
  } else {
    console.log(`  ❌ No es grupo simplificado o inválido`)
  }
  console.log('')
})

// Test 5: Verificar verbos que pertenecen a cada grupo
console.log('5️⃣ VERBOS POR GRUPO SIMPLIFICADO')  
console.log('='.repeat(50))

// Verbos de prueba
const testVerbs = [
  'pensar', 'cerrar', 'empezar',     // DIPHT_E_IE
  'volver', 'poder', 'contar',       // DIPHT_O_UE  
  'jugar',                           // DIPHT_U_UE
  'pedir', 'servir', 'repetir',      // E_I_IR
  'tener', 'poner', 'salir',         // G_VERBS
  'conocer', 'conducir',             // ZCO_VERBS
  'proteger', 'elegir',              // JO_VERBS
  'seguir'                           // GU_DROP
]

// Simular categorización (usando lógica simplificada para test)
const mockCategorizeVerb = (lemma) => {
  const patterns = {
    // STEM_CHANGES group
    'pensar': ['DIPHT_E_IE'],
    'cerrar': ['DIPHT_E_IE'], 
    'empezar': ['DIPHT_E_IE'],
    'volver': ['DIPHT_O_UE'],
    'poder': ['DIPHT_O_UE'],
    'contar': ['DIPHT_O_UE'],
    'jugar': ['DIPHT_U_UE'],
    'pedir': ['E_I_IR'],
    'servir': ['E_I_IR'],
    'repetir': ['E_I_IR'],
    
    // FIRST_PERSON_IRREGULAR group
    'tener': ['G_VERBS'],
    'poner': ['G_VERBS'],
    'salir': ['G_VERBS'],
    'conocer': ['ZCO_VERBS'],
    'conducir': ['ZCO_VERBS'],
    'proteger': ['JO_VERBS'],
    'elegir': ['JO_VERBS'],
    'seguir': ['GU_DROP']
  }
  return patterns[lemma] || []
}

// Analizar cada grupo
allGroups.forEach(group => {
  console.log(`📁 ${group.name}:`)
  const verbsInGroup = testVerbs.filter(verb => {
    const families = mockCategorizeVerb(verb)
    return group.includedFamilies.some(family => families.includes(family))
  })
  
  if (verbsInGroup.length > 0) {
    console.log(`  ✅ Verbos: ${verbsInGroup.join(', ')}`)
  } else {
    console.log(`  ❌ Sin verbos de prueba en este grupo`)
  }
  console.log('')
})

// Test 6: Simulación de filtrado  
console.log('6️⃣ SIMULACIÓN DE FILTRADO POR GRUPO')
console.log('='.repeat(50))

console.log('Ejemplo: Usuario selecciona "Verbos que Diptongan" para presente:')
const selectedGroup = 'STEM_CHANGES'
const expandedFamilies = expandSimplifiedGroup(selectedGroup)
console.log(`  🔄 Grupo seleccionado: ${selectedGroup}`)
console.log(`  📋 Se expande a familias: ${expandedFamilies.join(', ')}`)

const eligibleVerbs = testVerbs.filter(verb => {
  const verbFamilies = mockCategorizeVerb(verb)
  return expandedFamilies.some(familyId => verbFamilies.includes(familyId))
})

console.log(`  ✅ Verbos que aparecerían: ${eligibleVerbs.join(', ')}`)

console.log('\n🎉 TESTING COMPLETADO')
console.log('\n💡 FUNCIONALIDAD:')
console.log('• Para PRESENTE INDICATIVO y SUBJUNTIVO: Solo 2 grupos')
console.log('  - "Verbos que Diptongan" (e→ie, o→ue, e→i)')
console.log('  - "Irregulares en YO" (-go, -zco, -jo, etc.)')
console.log('• Para otros tiempos: Familias técnicas completas')
console.log('• Clasificación interna sin cambios, solo presentación al usuario')