// TEST DEL FLUJO EXACTO "POR TEMA" → INDICATIVO → IMPERFECTO → IRREGULARES
import { chooseNext } from './src/lib/core/generator.js'
import { verbs } from './src/data/verbs.js'

console.log("🔍 SIMULANDO FLUJO EXACTO: POR TEMA → INDICATIVO → IMPERFECTO → IRREGULARES")
console.log("=" * 80)

// STEP 1: Simular todas las formas disponibles
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

console.log(`Total formas en la base de datos: ${allForms.length}`)

// STEP 2: Configuración exacta del flujo "por tema"
const mockSettings = {
  // Configuración inicial "por tema"
  practiceMode: 'specific',
  level: 'ALL',  // ¡Esto es clave!
  cameFromTema: true,
  
  // Configuración del usuario
  region: 'rioplatense',
  useVoseo: true,
  useTuteo: false,
  useVosotros: false,
  
  // Selecciones específicas
  specificMood: 'indicative',
  specificTense: 'impf',
  verbType: 'irregular',
  
  // Otros settings por defecto
  strict: true,
  accentTolerance: 'warn',
  selectedFamily: null,
  currentBlock: null
}

// Mock useSettings.getState()
const originalConsoleLog = console.log
let mockGetStateCalled = false

// Simular useSettings.getState
const mockUseSettings = {
  getState: () => {
    if (!mockGetStateCalled) {
      console.log("📋 Configuración usada por chooseNext:")
      console.log(JSON.stringify(mockSettings, null, 2))
      mockGetStateCalled = true
    }
    return mockSettings
  }
}

// STEP 3: Intentar obtener una forma usando chooseNext
console.log("\n🎯 Intentando obtener una forma con chooseNext...")

try {
  // Simular la función chooseNext con nuestros settings
  const result = chooseNext({
    forms: allForms,
    history: {},
    currentItem: null
  })
  
  if (result) {
    console.log("✅ SUCCESS: chooseNext devolvió una forma:")
    console.log(`  Verbo: ${result.lemma}`)
    console.log(`  Forma: ${result.value}`) 
    console.log(`  Modo: ${result.mood}`)
    console.log(`  Tiempo: ${result.tense}`)
    console.log(`  Persona: ${result.person}`)
  } else {
    console.log("❌ FALLO: chooseNext devolvió null")
    console.log("Esto explicaría la pantalla negra!")
  }
  
} catch (error) {
  console.log("💥 ERROR en chooseNext:")
  console.log(error.message)
  console.log(error.stack)
}

// STEP 4: Debug manual del filtrado
console.log("\n🔧 DEBUG MANUAL: Aplicando filtros paso a paso...")

const filteredForms = allForms.filter(f => {
  // Filtro 1: Mood/Tense específico
  if (f.mood !== 'indicative' || f.tense !== 'impf') {
    return false
  }
  
  // Filtro 2: Tipo de verbo irregular
  const verb = verbs.find(v => v.lemma === f.lemma)
  if (!verb || verb.type !== 'irregular') {
    return false
  }
  
  // Filtro 3: Nuestro fix para imperfecto irregular
  const trulyIrregularImperfectVerbs = ['ser', 'ir', 'ver']
  if (!trulyIrregularImperfectVerbs.includes(f.lemma)) {
    return false
  }
  
  // Filtro 4: Dialectos (voseo sin tuteo)
  if (f.person === '2s_tu' || f.person === '2p_vosotros') {
    return false
  }
  
  return true
})

console.log(`Formas que pasan todos los filtros: ${filteredForms.length}`)

if (filteredForms.length > 0) {
  console.log("✅ Formas disponibles:")
  filteredForms.slice(0, 5).forEach(f => {
    console.log(`  - ${f.lemma}: ${f.value} (${f.person})`)
  })
  if (filteredForms.length > 5) {
    console.log(`  ... y ${filteredForms.length - 5} más`)
  }
} else {
  console.log("❌ NO HAY FORMAS DISPONIBLES - Esto causa pantalla negra")
}