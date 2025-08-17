// DEBUG: Isolate the accent normalization issue

function debugIsRegularFormForMood(lemma, mood, tense, person, value) {
  console.log(`\n🔍 DEBUGGING: ${lemma} → ${value} (${mood}|${tense}|${person})`)
  
  if (!lemma || !value) {
    console.log(`❌ Invalid params: lemma="${lemma}", value="${value}"`)
    return false
  }
  
  // Remove accents for comparison
  const normalize = (str) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  
  const normalizedLemma = normalize(lemma)
  const normalizedValue = normalize(value)
  
  console.log(`   Original lemma: "${lemma}"`)
  console.log(`   Normalized lemma: "${normalizedLemma}"`)
  console.log(`   Original value: "${value}"`)
  console.log(`   Normalized value: "${normalizedValue}"`)
  
  // Test -er verbs in imperfect
  if (lemma.endsWith('er') && mood === 'indicative' && tense === 'impf') {
    console.log(`   Testing -er verb in imperfect...`)
    
    if (person === '1s' || person === '3s') {
      const expectedPattern = lemma.replace(/er$/, 'ía')  // FIXED: Use regex to match end only
      const normalizedExpected = normalize(expectedPattern)
      
      console.log(`   Expected pattern: "${expectedPattern}"`)
      console.log(`   Normalized expected: "${normalizedExpected}"`)
      console.log(`   Match check: "${normalizedValue}" === "${normalizedExpected}" → ${normalizedValue === normalizedExpected}`)
      
      if (normalizedValue === normalizedExpected) {
        console.log(`   ✅ REGULAR FORM DETECTED`)
        return true
      } else {
        console.log(`   ❌ NOT A REGULAR FORM`)
      }
    }
  }
  
  // Test -ar verbs in imperfect  
  if (lemma.endsWith('ar') && mood === 'indicative' && tense === 'impf') {
    console.log(`   Testing -ar verb in imperfect...`)
    
    if (person === '1s' || person === '3s') {
      const expectedPattern = lemma.replace(/ar$/, 'aba')  // FIXED: Use regex to match end only
      const normalizedExpected = normalize(expectedPattern)
      
      console.log(`   Expected pattern: "${expectedPattern}"`)
      console.log(`   Normalized expected: "${normalizedExpected}"`)
      console.log(`   Match check: "${normalizedValue}" === "${normalizedExpected}" → ${normalizedValue === normalizedExpected}`)
      
      if (normalizedValue === normalizedExpected) {
        console.log(`   ✅ REGULAR FORM DETECTED`)
        return true
      } else {
        console.log(`   ❌ NOT A REGULAR FORM`)
      }
    }
  }
  
  // Test -ir verbs in imperfect  
  if (lemma.endsWith('ir') && mood === 'indicative' && tense === 'impf') {
    console.log(`   Testing -ir verb in imperfect...`)
    
    if (person === '1s' || person === '3s') {
      const expectedPattern = lemma.replace(/ir$/, 'ía')  // FIXED: Use regex to match end only
      const normalizedExpected = normalize(expectedPattern)
      
      console.log(`   Expected pattern: "${expectedPattern}"`)
      console.log(`   Normalized expected: "${normalizedExpected}"`)
      console.log(`   Match check: "${normalizedValue}" === "${normalizedExpected}" → ${normalizedValue === normalizedExpected}`)
      
      if (normalizedValue === normalizedExpected) {
        console.log(`   ✅ REGULAR FORM DETECTED`)
        return true
      } else {
        console.log(`   ❌ NOT A REGULAR FORM`)
      }
    }
  }
  
  console.log(`   ❌ NO PATTERNS MATCHED`)
  return false
}

// Test cases from the exhaustive test
console.log("🧪 TESTING PROBLEM CASES:")

// Case 1: querer → quería (should be REGULAR but showing as irregular)
debugIsRegularFormForMood('querer', 'indicative', 'impf', '3s', 'quería')

// Case 2: merecer → merecía (should be REGULAR but showing as irregular)  
debugIsRegularFormForMood('merecer', 'indicative', 'impf', '3s', 'merecía')

// Case 3: cargar → cargaba (should be REGULAR but showing as irregular)
debugIsRegularFormForMood('cargar', 'indicative', 'impf', '3s', 'cargaba')

// Case 4: incluir → incluía (should be REGULAR and IS showing as regular - this works!)
debugIsRegularFormForMood('incluir', 'indicative', 'impf', '3s', 'incluía')

// Case 5: ser → era (should be IRREGULAR and IS showing as irregular - this works!)
debugIsRegularFormForMood('ser', 'indicative', 'impf', '3s', 'era')

console.log("\n🎯 CONCLUSION:")
console.log("If querer/merecer/cargar are NOT detected as regular, there's a bug in the logic")