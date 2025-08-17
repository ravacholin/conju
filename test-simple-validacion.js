// TEST SIMPLE PARA VALIDAR QUE EL FIX FUNCIONA
// Testa los casos problemáticos específicos

console.log("🎯 TEST DE VALIDACIÓN SIMPLE")
console.log("=" * 50)

// Función corregida copiada directamente del archivo
function isRegularFormForMoodFixed(lemma, mood, tense, person, value) {
  if (!lemma || !value) return false
  
  const normalize = (str) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const normalizedValue = normalize(value)
  
  // FIXED: Use regex /ar$/ instead of 'ar' to match only at end
  if (lemma.endsWith('ar') && mood === 'indicative' && tense === 'impf') {
    if (person === '1s' && normalizedValue === normalize(lemma.replace(/ar$/, 'aba'))) return true
    if (person === '2s_tu' && normalizedValue === normalize(lemma.replace(/ar$/, 'abas'))) return true
    if (person === '2s_vos' && normalizedValue === normalize(lemma.replace(/ar$/, 'abas'))) return true
    if (person === '3s' && normalizedValue === normalize(lemma.replace(/ar$/, 'aba'))) return true
    if (person === '1p' && normalizedValue === normalize(lemma.replace(/ar$/, 'ábamos'))) return true
    if (person === '2p_vosotros' && normalizedValue === normalize(lemma.replace(/ar$/, 'abais'))) return true
    if (person === '3p' && normalizedValue === normalize(lemma.replace(/ar$/, 'aban'))) return true
  }
  
  // FIXED: Use regex /er$/ instead of 'er' to match only at end
  if (lemma.endsWith('er') && mood === 'indicative' && tense === 'impf') {
    if (person === '1s' && normalizedValue === normalize(lemma.replace(/er$/, 'ía'))) return true
    if (person === '2s_tu' && normalizedValue === normalize(lemma.replace(/er$/, 'ías'))) return true
    if (person === '2s_vos' && normalizedValue === normalize(lemma.replace(/er$/, 'ías'))) return true
    if (person === '3s' && normalizedValue === normalize(lemma.replace(/er$/, 'ía'))) return true
    if (person === '1p' && normalizedValue === normalize(lemma.replace(/er$/, 'íamos'))) return true
    if (person === '2p_vosotros' && normalizedValue === normalize(lemma.replace(/er$/, 'íais'))) return true
    if (person === '3p' && normalizedValue === normalize(lemma.replace(/er$/, 'ían'))) return true
  }
  
  // FIXED: Use regex /ir$/ instead of 'ir' to match only at end
  if (lemma.endsWith('ir') && mood === 'indicative' && tense === 'impf') {
    if (person === '1s' && normalizedValue === normalize(lemma.replace(/ir$/, 'ía'))) return true
    if (person === '2s_tu' && normalizedValue === normalize(lemma.replace(/ir$/, 'ías'))) return true
    if (person === '2s_vos' && normalizedValue === normalize(lemma.replace(/ir$/, 'ías'))) return true
    if (person === '3s' && normalizedValue === normalize(lemma.replace(/ir$/, 'ía'))) return true
    if (person === '1p' && normalizedValue === normalize(lemma.replace(/ir$/, 'íamos'))) return true
    if (person === '2p_vosotros' && normalizedValue === normalize(lemma.replace(/ir$/, 'íais'))) return true
    if (person === '3p' && normalizedValue === normalize(lemma.replace(/ir$/, 'ían'))) return true
  }
  
  return false
}

// Test casos problemáticos
const testCases = [
  // Casos que DEBEN ser REGULARES (función debe retornar TRUE)
  { lemma: 'querer', value: 'quería', expected: true, description: 'querer → quería es REGULAR en imperfecto' },
  { lemma: 'merecer', value: 'merecía', expected: true, description: 'merecer → merecía es REGULAR en imperfecto' },
  { lemma: 'cargar', value: 'cargaba', expected: true, description: 'cargar → cargaba es REGULAR en imperfecto' },
  { lemma: 'incluir', value: 'incluía', expected: true, description: 'incluir → incluía es REGULAR en imperfecto' },
  { lemma: 'repetir', value: 'repetía', expected: true, description: 'repetir → repetía es REGULAR en imperfecto' },
  { lemma: 'atestiguar', value: 'atestiguaba', expected: true, description: 'atestiguar → atestiguaba es REGULAR en imperfecto' },
  { lemma: 'publicar', value: 'publicaba', expected: true, description: 'publicar → publicaba es REGULAR en imperfecto' },
  
  // Casos que DEBEN ser IRREGULARES (función debe retornar FALSE)
  { lemma: 'ser', value: 'era', expected: false, description: 'ser → era es IRREGULAR en imperfecto' },
  { lemma: 'ir', value: 'iba', expected: false, description: 'ir → iba es IRREGULAR en imperfecto' },
  { lemma: 'ver', value: 'veía', expected: false, description: 'ver → veía es IRREGULAR en imperfecto' },
]

console.log("\n🧪 EJECUTANDO TESTS:")
let passed = 0
let failed = 0

testCases.forEach((testCase, i) => {
  const result = isRegularFormForMoodFixed(testCase.lemma, 'indicative', 'impf', '3s', testCase.value)
  const success = result === testCase.expected
  
  if (success) {
    console.log(`✅ Test ${i+1}: ${testCase.description}`)
    passed++
  } else {
    console.log(`❌ Test ${i+1}: ${testCase.description}`)
    console.log(`   Expected: ${testCase.expected}, Got: ${result}`)
    failed++
  }
})

console.log(`\n📊 RESULTADOS:`)
console.log(`✅ Pasaron: ${passed}`)
console.log(`❌ Fallaron: ${failed}`)
console.log(`📊 Total: ${testCases.length}`)

if (failed === 0) {
  console.log(`\n🎉 ¡TODOS LOS TESTS PASARON! El fix está funcionando correctamente.`)
  console.log(`\n🎯 PRÓXIMOS PASOS:`)
  console.log(`1. Los verbos regulares (querer, merecer, cargar, incluir, etc.) ahora se detectan como regulares`)
  console.log(`2. Los verbos irregulares (ser, ir, ver) se detectan como irregulares`)
  console.log(`3. El filtro debería mostrar SOLO ser, ir, ver en VOS → Indicativo → Imperfecto → Irregulares`)
} else {
  console.log(`\n💥 HAY ${failed} TESTS FALLANDO. Revisar la lógica.`)
}