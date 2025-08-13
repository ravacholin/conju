// Test completo del sistema de familias irregulares
import { 
  showCategorizationSummary, 
  testSpecificVerb,
  testVerbsByFamily 
} from './lib/categorizationScript.js'
import { getFamiliesForMood, getFamiliesForTense, getAllFamilies } from './lib/irregularFamilies.js'

console.log('🧪 TESTING SISTEMA DE FAMILIAS IRREGULARES 🧪\n')

// Test 1: Verificar que el sistema de categorización funciona
console.log('1️⃣ RESUMEN DE CATEGORIZACIÓN')
console.log('='.repeat(50))
const results = showCategorizationSummary()

// Test 2: Probar verbos específicos de diferentes familias
console.log('\n2️⃣ PRUEBA DE VERBOS ESPECÍFICOS')
console.log('='.repeat(50))

const testCases = [
  // G-verbs
  { verb: 'tener', expectedFamilies: ['G_VERBS', 'DIPHT_E_IE', 'PRET_UV'] },
  { verb: 'poner', expectedFamilies: ['G_VERBS', 'PRET_U'] },
  { verb: 'salir', expectedFamilies: ['G_VERBS'] },
  
  // Diptongación
  { verb: 'pensar', expectedFamilies: ['DIPHT_E_IE'] },
  { verb: 'volver', expectedFamilies: ['DIPHT_O_UE'] },
  { verb: 'jugar', expectedFamilies: ['DIPHT_U_UE', 'ORTH_GAR'] },
  
  // e→i
  { verb: 'pedir', expectedFamilies: ['E_I_IR'] },
  { verb: 'servir', expectedFamilies: ['E_I_IR'] },
  
  // -cer/-cir
  { verb: 'conocer', expectedFamilies: ['ZCO_VERBS'] },
  { verb: 'conducir', expectedFamilies: ['ZCO_VERBS', 'PRET_J'] },
  
  // -uir
  { verb: 'construir', expectedFamilies: ['UIR_Y'] },
  { verb: 'huir', expectedFamilies: ['UIR_Y'] },
  
  // Hiatos
  { verb: 'caer', expectedFamilies: ['G_VERBS', 'HIATUS_Y'] },
  { verb: 'leer', expectedFamilies: ['HIATUS_Y'] },
  
  // Ortográficos
  { verb: 'buscar', expectedFamilies: ['ORTH_CAR'] },
  { verb: 'llegar', expectedFamilies: ['ORTH_GAR'] },
  { verb: 'empezar', expectedFamilies: ['ORTH_ZAR', 'DIPHT_E_IE'] },
  
  // Pretéritos fuertes
  { verb: 'andar', expectedFamilies: ['PRET_UV'] },
  { verb: 'poder', expectedFamilies: ['DIPHT_O_UE', 'PRET_U'] },
  { verb: 'querer', expectedFamilies: ['DIPHT_E_IE', 'PRET_I'] },
  { verb: 'decir', expectedFamilies: ['G_VERBS', 'E_I_IR', 'PRET_J'] },
  
  // Supletivos
  { verb: 'ir', expectedFamilies: ['PRET_SUPPL'] },
  { verb: 'ser', expectedFamilies: ['PRET_SUPPL'] }
]

let passed = 0
let failed = 0

testCases.forEach(({ verb, expectedFamilies }) => {
  const result = testSpecificVerb(verb)
  
  if (result) {
    const actualFamilies = result.families
    const hasAllExpected = expectedFamilies.every(family => actualFamilies.includes(family))
    
    if (hasAllExpected) {
      console.log(`✅ ${verb}: CORRECTO - Familias: ${actualFamilies.join(', ')}`)
      passed++
    } else {
      console.log(`❌ ${verb}: FALLO`)
      console.log(`   Esperado: ${expectedFamilies.join(', ')}`)
      console.log(`   Obtenido: ${actualFamilies.join(', ')}`)
      failed++
    }
  } else {
    console.log(`❌ ${verb}: NO ENCONTRADO`)
    failed++
  }
})

console.log(`\n📊 RESULTADOS: ${passed} exitosos, ${failed} fallidos`)

// Test 3: Verificar familias por modo
console.log('\n3️⃣ FAMILIAS POR MODO VERBAL')
console.log('='.repeat(50))

const moods = ['indicative', 'subjunctive', 'imperative', 'conditional', 'nonfinite']
moods.forEach(mood => {
  const families = getFamiliesForMood(mood)
  console.log(`${mood}: ${families.length} familias`)
  console.log(`  Ejemplos: ${families.slice(0, 3).map(f => f.name).join(', ')}${families.length > 3 ? '...' : ''}`)
})

// Test 4: Verificar familias por tiempo específico
console.log('\n4️⃣ FAMILIAS POR TIEMPO ESPECÍFICO')
console.log('='.repeat(50))

const tenses = ['pres', 'pretIndef', 'subjPres', 'impAff', 'ger']
tenses.forEach(tense => {
  const families = getFamiliesForTense(tense)
  console.log(`${tense}: ${families.length} familias`)
  console.log(`  Ejemplos: ${families.slice(0, 3).map(f => f.name).join(', ')}${families.length > 3 ? '...' : ''}`)
})

// Test 5: Estadísticas finales
console.log('\n5️⃣ ESTADÍSTICAS GENERALES')
console.log('='.repeat(50))

const allFamilies = getAllFamilies()
console.log(`Total de familias definidas: ${allFamilies.length}`)

const familyTypes = {
  'Cambios de raíz': ['DIPHT_E_IE', 'DIPHT_O_UE', 'DIPHT_U_UE', 'E_I_IR', 'O_U_GER_IR'],
  'Consonantes 1ª persona': ['G_VERBS', 'ZCO_VERBS', 'ZO_VERBS', 'JO_VERBS', 'GU_DROP'],
  'Inserción Y e hiatos': ['UIR_Y', 'HIATUS_Y'],
  'Ortográficos': ['ORTH_CAR', 'ORTH_GAR', 'ORTH_ZAR', 'ORTH_GUAR'],
  'Pretéritos fuertes': ['PRET_UV', 'PRET_U', 'PRET_I', 'PRET_J', 'PRET_SUPPL'],
  'Especiales': ['IAR_VERBS', 'UAR_VERBS']
}

Object.entries(familyTypes).forEach(([type, families]) => {
  console.log(`${type}: ${families.length} familias`)
})

console.log('\n🎉 TESTING COMPLETADO')
console.log('\n💡 PRÓXIMOS PASOS:')
console.log('• Abrir http://localhost:5178/ para probar la interfaz')
console.log('• Navegar a verbos irregulares para ver las opciones de familias')
console.log('• Probar selección de familias específicas en configuración')
console.log('• Verificar que el filtrado funcione correctamente en práctica')