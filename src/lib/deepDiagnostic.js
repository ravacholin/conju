import { verbs } from '../data/verbs.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const gates = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/curriculum.json'), 'utf8'))

console.log('🔍 DIAGNÓSTICO PROFUNDO DE VERBOS')
console.log('='.repeat(80))

// 1. Verificar estructura básica de verbos
console.log('📊 ESTRUCTURA BÁSICA:')
console.log(`Total de verbos: ${verbs.length}`)

// Verificar estructura de cada verbo
let totalForms = 0
let verbsWithIssues = []

verbs.forEach((verb, index) => {
  if (!verb.lemma) {
    console.log(`❌ Verbo ${index}: sin lemma`)
    verbsWithIssues.push(verb)
    return
  }
  
  if (!verb.paradigms || verb.paradigms.length === 0) {
    console.log(`❌ Verbo ${verb.lemma}: sin paradigms`)
    verbsWithIssues.push(verb)
    return
  }
  
  let verbForms = 0
  verb.paradigms.forEach((paradigm, pIndex) => {
    if (!paradigm.forms || paradigm.forms.length === 0) {
      console.log(`❌ Verbo ${verb.lemma}, paradigm ${pIndex}: sin forms`)
      return
    }
    
    verbForms += paradigm.forms.length
    paradigm.forms.forEach((form, fIndex) => {
      if (!form.mood || !form.tense || !form.person || !form.value) {
        console.log(`❌ Verbo ${verb.lemma}, form ${fIndex}: estructura incompleta`, form)
      }
    })
  })
  
  totalForms += verbForms
  console.log(`✅ ${verb.lemma}: ${verbForms} formas`)
})

console.log(`\n📊 RESUMEN ESTRUCTURAL:`)
console.log(`Total formas: ${totalForms}`)
console.log(`Verbos con problemas: ${verbsWithIssues.length}`)

// 2. Verificar flattening de verbos (como lo hace App.jsx)
console.log('\n🔍 FLATTENING DE VERBOS (como App.jsx):')

const allForms = []
const region = 'rioplatense' // Usar rioplatense como ejemplo

verbs.forEach(verb => {
  verb.paradigms.forEach(paradigm => {
    if (paradigm.regionTags && paradigm.regionTags.includes(region)) {
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

// Verificar distribución por mood/tense
const moodTenseDistribution = {}
allForms.forEach(form => {
  const key = `${form.mood}:${form.tense}`
  if (!moodTenseDistribution[key]) {
    moodTenseDistribution[key] = 0
  }
  moodTenseDistribution[key]++
})

console.log('\n📊 DISTRIBUCIÓN POR MOOD/TENSE:')
Object.entries(moodTenseDistribution)
  .sort((a, b) => b[1] - a[1])
  .forEach(([key, count]) => {
    console.log(`${key}: ${count} formas`)
  })

// 3. Verificar filtrado por curriculum gates
console.log('\n🔍 FILTRADO POR CURRICULUM GATES:')

const level = 'A1'
const mood = 'nonfinite'
const tense = 'part'

const gate = gates.find(g => g.mood === mood && g.tense === tense && g.level === level)
console.log(`Gate encontrado para ${level} ${mood} ${tense}:`, gate)

// 4. Verificar verbos específicos que agregamos
const newVerbs = ['trabajar', 'estudiar', 'caminar', 'aprender', 'comprender', 'escribir', 'recibir']

console.log('\n🔍 VERBOS NUEVOS ESPECÍFICOS:')
newVerbs.forEach(verbName => {
  const verb = verbs.find(v => v.lemma === verbName)
  if (verb) {
    let formsCount = 0
    verb.paradigms.forEach(p => {
      formsCount += p.forms.length
    })
    console.log(`✅ ${verbName}: ${formsCount} formas`)
    
    // Verificar si tiene formas nonfinite
    const nonfiniteForms = []
    verb.paradigms.forEach(p => {
      p.forms.forEach(f => {
        if (f.mood === 'nonfinite') {
          nonfiniteForms.push(f)
        }
      })
    })
    console.log(`  - Formas nonfinite: ${nonfiniteForms.length}`)
    nonfiniteForms.forEach(f => {
      console.log(`    ${f.tense}: ${f.value}`)
    })
  } else {
    console.log(`❌ ${verbName}: NO ENCONTRADO`)
  }
})

// 5. Simular el proceso completo de generación
console.log('\n🔍 SIMULACIÓN DE GENERACIÓN:')

// Simular settings
const mockSettings = {
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

console.log('Settings simulados:', mockSettings)

// Aplicar filtros como lo hace el generator
const filteredForms = allForms.filter(form => {
  // Level filtering
  const gate = gates.find(g => g.mood === form.mood && g.tense === form.tense && g.level === mockSettings.level)
  if (!gate) {
    console.log(`❌ ${form.lemma} ${form.mood} ${form.tense}: filtrado por level gate`)
    return false
  }
  
  // Specific practice filtering
  if (mockSettings.practiceMode === 'specific') {
    if (mockSettings.specificMood && form.mood !== mockSettings.specificMood) {
      console.log(`❌ ${form.lemma} ${form.mood}: filtrado por specific mood`)
      return false
    }
    if (mockSettings.specificTense && form.tense !== mockSettings.specificTense) {
      console.log(`❌ ${form.lemma} ${form.tense}: filtrado por specific tense`)
      return false
    }
  }
  
  // Nonfinite specific filtering
  if (form.mood === 'nonfinite' && (form.tense === 'inf' || form.tense === 'infPerf')) {
    console.log(`❌ ${form.lemma} ${form.tense}: infinitivo filtrado`)
    return false
  }
  
  console.log(`✅ ${form.lemma} ${form.mood} ${form.tense} ${form.person}: PASÓ filtros`)
  return true
})

console.log(`\n📊 RESULTADO FINAL:`)
console.log(`Formas después de filtros: ${filteredForms.length}`)

if (filteredForms.length === 0) {
  console.log('🚨 PROBLEMA: No hay formas disponibles después del filtrado')
  
  // Verificar qué está pasando con nonfinite
  const nonfiniteForms = allForms.filter(f => f.mood === 'nonfinite')
  console.log(`Formas nonfinite totales: ${nonfiniteForms.length}`)
  
  const partForms = nonfiniteForms.filter(f => f.tense === 'part')
  console.log(`Formas participio: ${partForms.length}`)
  
  const gerForms = nonfiniteForms.filter(f => f.tense === 'ger')
  console.log(`Formas gerundio: ${gerForms.length}`)
  
  partForms.forEach(f => {
    console.log(`  ${f.lemma}: ${f.value}`)
  })
} else {
  console.log('✅ Formas disponibles después del filtrado')
  filteredForms.slice(0, 10).forEach(f => {
    console.log(`  ${f.lemma}: ${f.value}`)
  })
}

console.log('\n' + '='.repeat(80))
console.log('🎯 DIAGNÓSTICO COMPLETADO')
console.log('='.repeat(80)) 