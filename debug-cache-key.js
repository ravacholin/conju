// DEBUG DEL CACHE KEY Y FLUJO COMPLETO
import { verbs } from './src/data/verbs.js'

console.log("🔍 DEBUG: Cache key y flujo de filtrado completo")
console.log("=" * 60)

// Simular exactamente las configuraciones del flujo "POR TEMA"
const settings = {
  level: 'ALL',
  useVoseo: true,
  useTuteo: false,
  useVosotros: false,
  practiceMode: 'specific',
  specificMood: 'indicative',
  specificTense: 'impf',
  practicePronoun: undefined,
  verbType: 'irregular',
  selectedFamily: null,
  currentBlock: null
}

// Generar el cache key como lo hace chooseNext
const filterKey = `filter|${settings.level}|${settings.useVoseo}|${settings.useTuteo}|${settings.useVosotros}|${settings.practiceMode}|${settings.specificMood}|${settings.specificTense}|${settings.practicePronoun}|${settings.verbType}|${settings.selectedFamily}|${settings.currentBlock?.id || 'none'}`

console.log("🔑 Cache key generado:")
console.log(filterKey)
console.log()

// Recolectar todas las formas
const allForms = []
verbs.forEach(verb => {
  if (!verb.paradigms) return
  verb.paradigms.forEach(paradigm => {
    if (!paradigm.regionTags || !paradigm.regionTags.includes('rioplatense')) return
    if (!paradigm.forms) return
    paradigm.forms.forEach(form => {
      allForms.push({
        ...form,
        lemma: verb.lemma,
        type: verb.type
      })
    })
  })
})

console.log(`📊 Total formas disponibles: ${allForms.length}`)

// Simular el algoritmo de filtrado de chooseNext paso a paso
console.log("\n🔧 SIMULANDO FILTRADO PASO A PASO:")

let eligible = allForms.filter(f => {
  // 1. Level filtering
  console.log(`Procesando: ${f.lemma} - ${f.mood}|${f.tense} - ${f.person}`)
  
  // Para level: 'ALL', todos los mood|tense deberían estar permitidos
  // No simularemos getAllowedCombosForLevel aquí, asumimos que pasa
  
  // 2. Person filtering (dialect)
  if (f.mood !== 'nonfinite') {
    if (settings.practiceMode === 'specific' && settings.specificMood && settings.specificTense) {
      // For specific practice, show ALL persons but respect dialect
      if (settings.useVoseo && !settings.useTuteo) {
        if (f.person === '2s_tu') {
          console.log(`  ❌ Filtrado por dialecto: ${f.person} (es tú en modo voseo)`)
          return false
        }
        if (f.person === '2p_vosotros') {
          console.log(`  ❌ Filtrado por dialecto: ${f.person} (es vosotros en modo voseo)`)
          return false
        }
      }
    }
  }
  
  // 3. Verb type filtering
  const verb = verbs.find(v => v.lemma === f.lemma)
  if (!verb) {
    console.log(`  ❌ Verbo no encontrado: ${f.lemma}`)
    return false
  }
  
  // 4. Check user's verb type preference
  if (settings.verbType === 'irregular') {
    if (verb.type !== 'irregular') {
      console.log(`  ❌ Verbo no irregular: ${f.lemma} (type: ${verb.type})`)
      return false
    }
    
    // 5. NUESTRO FIX: Para imperfecto, solo ser/ir/ver
    if (f.mood === 'indicative' && f.tense === 'impf') {
      const trulyIrregularImperfectVerbs = ['ser', 'ir', 'ver']
      if (!trulyIrregularImperfectVerbs.includes(f.lemma)) {
        console.log(`  ❌ No es imperfecto realmente irregular: ${f.lemma}`)
        return false
      }
    }
  }
  
  // 6. Specific practice filtering
  if (settings.practiceMode === 'specific') {
    if (settings.specificMood && f.mood !== settings.specificMood) {
      console.log(`  ❌ Mood no coincide: ${f.mood} vs ${settings.specificMood}`)
      return false
    }
    
    if (settings.specificTense && f.tense !== settings.specificTense) {
      console.log(`  ❌ Tense no coincide: ${f.tense} vs ${settings.specificTense}`)
      return false
    }
  }
  
  // 7. Filter out infinitivos
  if (f.mood === 'nonfinite' && (f.tense === 'inf' || f.tense === 'infPerf')) {
    console.log(`  ❌ Infinitivo filtrado: ${f.tense}`)
    return false
  }
  
  console.log(`  ✅ PASÓ TODOS LOS FILTROS: ${f.lemma} - ${f.value || f.form} (${f.person})`)
  return true
})

console.log(`\n🎯 FORMAS ELEGIBLES FINALES: ${eligible.length}`)

if (eligible.length > 0) {
  console.log("\n✅ Formas que deberían aparecer:")
  eligible.forEach((f, i) => {
    console.log(`  ${i+1}. ${f.lemma}: ${f.value || f.form} (${f.person})`)
  })
} else {
  console.log("\n❌ NO HAY FORMAS ELEGIBLES")
  console.log("❌ Esto explica la pantalla negra")
}

console.log("\n🔍 ¿Conclusión?")
if (eligible.length > 0) {
  console.log("✅ El filtrado SÍ debería devolver formas.")
  console.log("✅ Si hay pantalla negra, el problema está en:")
  console.log("   - El componente React no recibe las formas")
  console.log("   - Hay un error en el rendering")
  console.log("   - Hay algún otro filtro que no estamos simulando")
} else {
  console.log("❌ El filtrado NO devuelve formas.")
  console.log("❌ Problema confirmado en la lógica de filtrado.")
}