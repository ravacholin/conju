// TEST EXHAUSTIVO DEL FILTRO DE IRREGULARES
import { combosForLevel } from './src/lib/core/generator.js'

console.log("🔍 TESTING FILTRO DE IRREGULARES CON ATESTIGUAR")
console.log("=" * 60)

// Simular settings para VOS + Irregulares + Imperfecto
const testSettings = {
  level: 'A1',
  region: 'rioplatense', 
  practiceMode: 'mixed',
  verbType: 'irregular',
  specificMood: 'indicative',
  specificTense: 'impf'
}

console.log("Settings:", testSettings)
console.log("")

try {
  const result = combosForLevel(testSettings)
  console.log(`Total combos found: ${result.length}`)
  
  // Buscar atestiguar específicamente
  const atestiguarCombos = result.filter(combo => combo.lemma === 'atestiguar')
  console.log(`Atestiguar combos: ${atestiguarCombos.length}`)
  
  if (atestiguarCombos.length > 0) {
    console.log("❌ PROBLEMA: atestiguar aparece en irregulares")
    console.log("Atestiguar forms:", atestiguarCombos.map(c => `${c.person}: ${c.value}`))
  } else {
    console.log("✅ CORRECTO: atestiguar NO aparece en irregulares")
  }
  
  // Verificar que solo aparecen los irregulares reales
  const irregularVerbsFound = [...new Set(result.map(c => c.lemma))]
  console.log("")
  console.log("Verbos encontrados en 'irregulares de imperfecto':")
  irregularVerbsFound.forEach(verb => console.log(`  - ${verb}`))
  
  const expectedIrregulars = ['ser', 'ir', 'ver']
  const unexpectedVerbs = irregularVerbsFound.filter(v => !expectedIrregulars.includes(v))
  
  if (unexpectedVerbs.length > 0) {
    console.log("")
    console.log("❌ VERBOS INCORRECTOS ENCONTRADOS:")
    unexpectedVerbs.forEach(verb => console.log(`  - ${verb} (debería ser regular)`))
  } else {
    console.log("")
    console.log("✅ SOLO VERBOS IRREGULARES CORRECTOS")
  }
  
} catch (error) {
  console.error("❌ ERROR:", error.message)
  console.error(error.stack)
}