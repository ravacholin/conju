// DEBUG DEL FILTRO PASO A PASO

// Simulamos los datos de atestiguar
const mockForm = {
  lemma: "atestiguar",
  mood: "indicative", 
  tense: "impf",
  person: "3s",
  value: "atestiguaba"
}

const mockVerb = {
  type: "irregular"  // Como está en la base de datos
}

// Simulamos configuración
const verbType = 'irregular'
const isCompoundTense = false
const selectedFamily = null

console.log("🔍 DEBUGGING FILTER PASO A PASO - ATESTIGUAR")
console.log("=" * 60)
console.log("Form:", mockForm)
console.log("Verb type in DB:", mockVerb.type)
console.log("User wants:", verbType)
console.log("")

// PASO 1: Check línea 206
console.log("PASO 1 - Línea 206:")
console.log(`!isCompoundTense: ${!isCompoundTense}`)
console.log(`f.mood !== 'nonfinite': ${mockForm.mood !== 'nonfinite'}`)  
console.log(`verb.type !== 'irregular': ${mockVerb.type !== 'irregular'}`)

const paso1 = !isCompoundTense && mockForm.mood !== 'nonfinite' && mockVerb.type !== 'irregular'
console.log(`Resultado: ${paso1}`)
if (paso1) {
  console.log("❌ FILTRADO en paso 1 - return false")
  process.exit()
} else {
  console.log("✅ PASA paso 1")
}
console.log("")

// PASO 2: isRegularFormForMood (copiamos función simplificada)
function isRegularFormForMood(lemma, mood, tense, person, value) {
  if (lemma.endsWith('ar') && mood === 'indicative' && tense === 'impf' && person === '3s') {
    const expected = lemma.replace('ar', 'aba')
    return value === expected
  }
  return false
}

console.log("PASO 2 - isRegularFormForMood:")
const isRegularForm = isRegularFormForMood(mockForm.lemma, mockForm.mood, mockForm.tense, mockForm.person, mockForm.value)
console.log(`isRegularFormForMood result: ${isRegularForm}`)
console.log("")

// PASO 3: Línea 219
console.log("PASO 3 - Línea 219:")
const universallyRegularTenses = [] // Empty array
const isUniversallyRegularTense = universallyRegularTenses.includes(mockForm.tense)
console.log(`isRegularForm: ${isRegularForm}`)
console.log(`isUniversallyRegularTense: ${isUniversallyRegularTense}`)

const paso3 = isRegularForm && !isUniversallyRegularTense
console.log(`Condición (isRegularForm && !isUniversallyRegularTense): ${paso3}`)

if (paso3) {
  console.log("✅ DEBERÍA FILTRARSE - return false")
  console.log("🎯 ESTE ES EL COMPORTAMIENTO ESPERADO")
} else {
  console.log("❌ NO SE FILTRA - continúa")
  console.log("🚨 PROBLEMA: Debería filtrarse aquí")
}
console.log("")

// PASO 4: ¿Qué pasa después?
console.log("PASO 4 - ¿Continúa el filtro?")
if (!paso3) {
  console.log("El verbo regular 'atestiguar' continúa en el filtro...")
  console.log("Esto significa que llegará hasta 'return true' línea 302")
  console.log("Y aparecerá en la lista de irregulares ❌")
}

console.log("")
console.log("CONCLUSIÓN:")
if (paso3) {
  console.log("✅ EL FILTRO DEBERÍA FUNCIONAR CORRECTAMENTE")
  console.log("🔍 Problema debe estar en otra parte")
} else {
  console.log("❌ HAY UN BUG EN LA LÓGICA DEL FILTRO")
}