// TEST URGENTE DEL GRADER
import { grade } from './src/lib/core/grader.js'

// Test con PAGAR
const input = "pagaba"
const expected = {
  value: "pagaba",
  lemma: "pagar",
  mood: "indicative", 
  tense: "impf",
  person: "3s"
}
const settings = {
  level: "A1",
  useVoseo: false,
  useTuteo: true,
  useVosotros: false
}

console.log("🧪 TESTING GRADER CON PAGAR:")
console.log("Input:", input)
console.log("Expected:", expected)
console.log("Settings:", settings)

try {
  const result = grade(input, expected, settings)
  console.log("Result:", result)
  console.log("✅ Should be CORRECT:", result.correct)
  console.log("Note:", result.note)
} catch (error) {
  console.error("❌ ERROR:", error)
}