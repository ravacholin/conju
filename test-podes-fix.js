// TEST ESPECÍFICO PARA VERIFICAR EL FIX DE "PODES" vs "PODÉS"
import { grade } from './src/lib/core/grader.js'

console.log("🧪 TESTING FIX: 'podes' sin tilde debería mostrar mensaje específico")
console.log("=" * 70)

// Test case específico: input "podes" (sin tilde) vs expected "podés" (con tilde)
const testCases = [
  {
    description: "A1: 'podes' sin tilde → debería aceptar con mensaje de tilde",
    input: "podes",
    expected: {
      value: "podés",
      lemma: "poder",
      mood: "indicative", 
      tense: "pres",
      person: "2s_vos"
    },
    settings: {
      level: "A1",
      useVoseo: true,
      useTuteo: false,
      useVosotros: false,
      accentTolerance: "accept"  // A1 acepta sin tildes pero debería informar
    },
    expectedResult: {
      correct: true,  // A1 acepta sin tilde
      shouldHaveNote: true,  // Pero debería informar sobre tilde
      notePattern: /revisá.*tilde|tilde.*revisá|acento/i
    }
  },
  {
    description: "A2: 'podes' sin tilde → debería mostrar error de tilde específico", 
    input: "podes",
    expected: {
      value: "podés",
      lemma: "poder",
      mood: "indicative",
      tense: "pres", 
      person: "2s_vos"
    },
    settings: {
      level: "A2",
      useVoseo: true,
      useTuteo: false, 
      useVosotros: false,
      accentTolerance: "warn"  // A2 advierte sobre tildes
    },
    expectedResult: {
      correct: false,  // A2 no acepta sin tilde
      shouldHaveNote: true,  // Debería mostrar error específico
      notePattern: /ERROR DE TILDE|tilde.*falta|falta.*tilde/i
    }
  }
]

let passed = 0
let failed = 0

testCases.forEach((testCase, i) => {
  console.log(`\n🧪 Test ${i+1}: ${testCase.description}`)
  console.log(`Input: "${testCase.input}"`)
  console.log(`Expected: "${testCase.expected.value}" (con tilde)`)
  console.log(`Settings: ${testCase.settings.level}, accentTolerance: ${testCase.settings.accentTolerance}`)
  
  try {
    const result = grade(testCase.input, testCase.expected, testCase.settings)
    
    console.log(`Result:`)
    console.log(`  correct: ${result.correct}`)
    console.log(`  note: "${result.note}"`)
    console.log(`  targets: [${result.targets.join(', ')}]`)
    
    // Verificar resultado esperado
    const correctnessOk = result.correct === testCase.expectedResult.correct
    const hasNote = result.note && result.note.length > 0
    const noteOk = !testCase.expectedResult.shouldHaveNote || 
                   (hasNote && testCase.expectedResult.notePattern.test(result.note))
    
    if (correctnessOk && noteOk) {
      console.log(`✅ PASS: Comportamiento correcto`)
      passed++
    } else {
      console.log(`❌ FAIL:`)
      if (!correctnessOk) {
        console.log(`  - Correct: esperado ${testCase.expectedResult.correct}, obtuvo ${result.correct}`)
      }
      if (!noteOk) {
        console.log(`  - Note: esperado mensaje con patrón ${testCase.expectedResult.notePattern}, obtuvo "${result.note}"`)
      }
      failed++
    }
    
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`)
    failed++
  }
})

console.log(`\n📊 RESULTADOS FINALES:`)
console.log(`✅ Pasaron: ${passed}`)
console.log(`❌ Fallaron: ${failed}`)
console.log(`📊 Total: ${testCases.length}`)

if (failed === 0) {
  console.log(`\n🎉 ¡TODOS LOS TESTS PASARON! El fix de "podes" está funcionando correctamente.`)
} else {
  console.log(`\n💥 HAY ${failed} TESTS FALLANDO. El fix necesita más trabajo.`)
}