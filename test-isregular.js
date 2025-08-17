// TEST DIRECTO DE isRegularFormForMood
// Copiamos la función para probarla directamente

function isRegularFormForMood(lemma, mood, tense, person, value) {
  // CRITICAL: Add validation for undefined parameters
  if (!lemma || !value || typeof lemma !== 'string' || typeof value !== 'string') {
    console.warn('⚠️ isRegularFormForMood called with invalid params:', { lemma, mood, tense, person, value })
    return false // Assume irregular if data is invalid
  }
  
  // Remove accents for comparison
  const normalize = (str) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  
  const normalizedLemma = normalize(lemma)
  const normalizedValue = normalize(value)

  // Regular patterns for different verb endings
  if (lemma.endsWith('ar')) {
    if (mood === 'indicative') {
      if (tense === 'impf') {
        if (person === '1s' && normalizedValue === normalize(lemma.replace('ar', 'aba'))) return true
        if (person === '2s_tu' && normalizedValue === normalize(lemma.replace('ar', 'abas'))) return true
        if (person === '2s_vos' && normalizedValue === normalize(lemma.replace('ar', 'abas'))) return true
        if (person === '3s' && normalizedValue === normalize(lemma.replace('ar', 'aba'))) return true
        if (person === '1p' && normalizedValue === normalize(lemma.replace('ar', 'ábamos'))) return true
        if (person === '2p_vosotros' && normalizedValue === normalize(lemma.replace('ar', 'abais'))) return true
        if (person === '3p' && normalizedValue === normalize(lemma.replace('ar', 'aban'))) return true
      }
    }
  }
  return false
}

console.log("🧪 TESTING isRegularFormForMood con ATESTIGUAR")
console.log("=" * 50)

// Test cases
const tests = [
  {
    lemma: "atestiguar",
    mood: "indicative", 
    tense: "impf",
    person: "3s",
    value: "atestiguaba",
    expected: true
  },
  {
    lemma: "ser",
    mood: "indicative",
    tense: "impf", 
    person: "3s",
    value: "era",
    expected: false // ser es irregular
  },
  {
    lemma: "publicar",
    mood: "indicative",
    tense: "impf",
    person: "3s", 
    value: "publicaba",
    expected: true
  }
]

tests.forEach((test, i) => {
  const result = isRegularFormForMood(test.lemma, test.mood, test.tense, test.person, test.value)
  const status = result === test.expected ? "✅" : "❌"
  
  console.log(`Test ${i+1}: ${status}`)
  console.log(`  ${test.lemma} → ${test.value}`)
  console.log(`  Expected: ${test.expected}, Got: ${result}`)
  
  if (result !== test.expected) {
    console.log(`  🚨 FALLO EN TEST!`)
    // Mostrar el cálculo paso a paso
    if (test.lemma.endsWith('ar')) {
      const expected_form = test.lemma.replace('ar', 'aba')
      console.log(`  Calculation: ${test.lemma}.replace('ar', 'aba') = ${expected_form}`)
      console.log(`  Comparison: "${expected_form}" === "${test.value}" → ${expected_form === test.value}`)
    }
  }
  console.log("")
})