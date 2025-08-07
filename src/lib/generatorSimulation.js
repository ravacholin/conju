import { verbs } from '../data/verbs.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const gates = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/curriculum.json'), 'utf8'))

console.log('🔍 SIMULACIÓN EXACTA DEL GENERATOR')
console.log('='.repeat(80))

function levelOrder(L) {
  return ['A1','A2','B1','B2','C1','C2'].indexOf(L)
}

function findVerbByLemma(lemma) {
  return verbs.find(v => v.lemma === lemma)
}

// Simular settings exactos
const settings = {
  level: 'A1',
  region: 'rioplatense',
  useVoseo: true,
  useTuteo: false,
  useVosotros: false,
  practiceMode: 'specific',
  specificMood: 'nonfinite',
  specificTense: 'part',
  practicePronoun: 'all',
  verbType: 'all'
}

console.log('Settings simulados:', settings)

// 1. Flatten verbs como lo hace App.jsx
console.log('\n🔍 PASO 1: FLATTENING DE VERBOS')
const allForms = []
verbs.forEach(verb => {
  verb.paradigms.forEach(paradigm => {
    if (paradigm.regionTags && paradigm.regionTags.includes(settings.region)) {
      paradigm.forms.forEach(form => {
        allForms.push({
          lemma: verb.lemma,
          ...form
        })
      })
    }
  })
})

console.log(`Formas después del flattening: ${allForms.length}`)

// 2. Aplicar filtros exactos como lo hace generator.js
console.log('\n🔍 PASO 2: APLICANDO FILTROS DEL GENERATOR')

const eligible = allForms.filter(f => {
  console.log(`\n--- Checking form: ${f.lemma} ${f.mood} ${f.tense} ${f.person} ---`)
  
  // Level filtering (línea 48 del generator)
  const gate = gates.find(g => g.mood === f.mood && g.tense === f.tense && levelOrder(g.level) <= levelOrder(settings.level))
  if (!gate) {
    console.log(`❌ Form ${f.lemma} ${f.mood} ${f.tense} filtered out by level gate`)
    return false
  }
  console.log(`✅ Level gate passed - found gate: ${gate.level} ${gate.mood} ${gate.tense}`)
  
  // Specific practice filtering
  if (settings.practiceMode === 'specific') {
    if (settings.specificMood && f.mood !== settings.specificMood) {
      console.log(`❌ Form ${f.lemma} ${f.mood} filtered out by specific mood ${settings.specificMood}`)
      return false
    }
    if (settings.specificTense && f.tense !== settings.specificTense) {
      console.log(`❌ Form ${f.lemma} ${f.tense} filtered out by specific tense ${settings.specificTense}`)
      return false
    }
  }
  
  // Nonfinite specific filtering
  if (f.mood === 'nonfinite' && (f.tense === 'inf' || f.tense === 'infPerf')) {
    console.log(`❌ Form ${f.lemma} ${f.tense} filtered out - infinitivo`)
    return false
  }
  
  console.log(`✅ Form ${f.lemma} ${f.mood} ${f.tense} ${f.person} PASSED all filters`)
  return true
})

console.log(`\n📊 RESULTADO FINAL:`)
console.log(`Formas después de filtros: ${eligible.length}`)

if (eligible.length === 0) {
  console.log('🚨 PROBLEMA: No hay formas disponibles después del filtrado')
} else {
  console.log('✅ Formas disponibles después del filtrado')
  eligible.slice(0, 10).forEach(f => {
    console.log(`  ${f.lemma}: ${f.value}`)
  })
}

// 3. Verificar específicamente nonfinite forms
console.log('\n🔍 PASO 3: VERIFICACIÓN ESPECÍFICA NONFINITE')
const nonfiniteForms = allForms.filter(f => f.mood === 'nonfinite')
console.log(`Formas nonfinite totales: ${nonfiniteForms.length}`)

const partForms = nonfiniteForms.filter(f => f.tense === 'part')
console.log(`Formas participio: ${partForms.length}`)

const gerForms = nonfiniteForms.filter(f => f.tense === 'ger')
console.log(`Formas gerundio: ${gerForms.length}`)

// Verificar qué verbos tienen formas nonfinite
const verbsWithNonfinite = new Set()
nonfiniteForms.forEach(f => {
  verbsWithNonfinite.add(f.lemma)
})

console.log(`\n📊 VERBOS CON FORMAS NONFINITE: ${verbsWithNonfinite.size}`)
Array.from(verbsWithNonfinite).forEach(verb => {
  const verbForms = nonfiniteForms.filter(f => f.lemma === verb)
  console.log(`  ${verb}: ${verbForms.length} formas nonfinite`)
  verbForms.forEach(f => {
    console.log(`    ${f.tense}: ${f.value}`)
  })
})

console.log('\n' + '='.repeat(80))
console.log('🎯 SIMULACIÓN COMPLETADA')
console.log('='.repeat(80)) 