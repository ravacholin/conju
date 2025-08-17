// TEST EXHAUSTIVO DEL FLUJO COMPLETO
// Simula exactamente lo que hace el usuario: VOS → Por tema → Indicativo → Imperfecto → Verbos Irregulares

import { verbs } from './src/data/verbs.js'
import { isRegularFormForMood } from './src/lib/core/conjugationRules.js'

console.log("🔍 TEST EXHAUSTIVO FINAL - SIMULANDO FLUJO COMPLETO")
console.log("=" * 80)

// PASO 1: Simular configuración del usuario
const userSettings = {
  region: 'rioplatense',
  practiceMode: 'mixed', 
  verbType: 'irregular',
  specificMood: 'indicative',
  specificTense: 'impf',
  level: 'A1'
}

console.log("Configuración del usuario:")
console.log(userSettings)
console.log("")

// PASO 2: Filtrar verbos como hace chooseNext
console.log("🔧 PASO 2: Filtrando verbos...")

// Obtener todas las formas de imperfecto indicativo
const allForms = []
verbs.forEach(verb => {
  if (!verb.paradigms) return
  
  verb.paradigms.forEach(paradigm => {
    if (!paradigm.regionTags || !paradigm.regionTags.includes('rioplatense')) return
    if (!paradigm.forms) return
    
    paradigm.forms.forEach(form => {
      if (form.mood === 'indicative' && form.tense === 'impf') {
        allForms.push({
          lemma: verb.lemma,
          verbType: verb.type,
          mood: form.mood,
          tense: form.tense,
          person: form.person,
          value: form.value || form.form
        })
      }
    })
  })
})

console.log(`Total formas de imperfecto indicativo: ${allForms.length}`)

// PASO 3: Aplicar filtro de verbType = 'irregular'
console.log("🔧 PASO 3: Aplicando filtro verbType='irregular'...")

const irregularVerbForms = allForms.filter(form => {
  // Solo verbos marcados como irregulares en la base de datos
  return form.verbType === 'irregular'
})

console.log(`Formas de verbos marcados como irregulares: ${irregularVerbForms.length}`)

// PASO 4: Aplicar filtro de formas irregulares (isRegularFormForMood)
console.log("🔧 PASO 4: Aplicando filtro de formas regulares...")

// Copiamos la función isRegularFormForMood corregida con regex
function isRegularFormForMoodTest(lemma, mood, tense, person, value) {
  if (!lemma || !value) return false
  
  const normalize = (str) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const normalizedValue = normalize(value)
  
  if (lemma.endsWith('ar') && mood === 'indicative' && tense === 'impf') {
    if (person === '3s' && normalizedValue === normalize(lemma.replace(/ar$/, 'aba'))) return true
    if (person === '1s' && normalizedValue === normalize(lemma.replace(/ar$/, 'aba'))) return true
    if (person === '2s_tu' && normalizedValue === normalize(lemma.replace(/ar$/, 'abas'))) return true
    if (person === '2s_vos' && normalizedValue === normalize(lemma.replace(/ar$/, 'abas'))) return true
    if (person === '1p' && normalizedValue === normalize(lemma.replace(/ar$/, 'ábamos'))) return true
    if (person === '2p_vosotros' && normalizedValue === normalize(lemma.replace(/ar$/, 'abais'))) return true
    if (person === '3p' && normalizedValue === normalize(lemma.replace(/ar$/, 'aban'))) return true
  }
  
  if (lemma.endsWith('er') && mood === 'indicative' && tense === 'impf') {
    if (person === '3s' && normalizedValue === normalize(lemma.replace(/er$/, 'ía'))) return true
    if (person === '1s' && normalizedValue === normalize(lemma.replace(/er$/, 'ía'))) return true
    if (person === '2s_tu' && normalizedValue === normalize(lemma.replace(/er$/, 'ías'))) return true
    if (person === '2s_vos' && normalizedValue === normalize(lemma.replace(/er$/, 'ías'))) return true
    if (person === '1p' && normalizedValue === normalize(lemma.replace(/er$/, 'íamos'))) return true
    if (person === '2p_vosotros' && normalizedValue === normalize(lemma.replace(/er$/, 'íais'))) return true
    if (person === '3p' && normalizedValue === normalize(lemma.replace(/er$/, 'ían'))) return true
  }
  
  if (lemma.endsWith('ir') && mood === 'indicative' && tense === 'impf') {
    if (person === '3s' && normalizedValue === normalize(lemma.replace(/ir$/, 'ía'))) return true
    if (person === '1s' && normalizedValue === normalize(lemma.replace(/ir$/, 'ía'))) return true
    if (person === '2s_tu' && normalizedValue === normalize(lemma.replace(/ir$/, 'ías'))) return true
    if (person === '2s_vos' && normalizedValue === normalize(lemma.replace(/ir$/, 'ías'))) return true
    if (person === '1p' && normalizedValue === normalize(lemma.replace(/ir$/, 'íamos'))) return true
    if (person === '2p_vosotros' && normalizedValue === normalize(lemma.replace(/ir$/, 'íais'))) return true
    if (person === '3p' && normalizedValue === normalize(lemma.replace(/ir$/, 'ían'))) return true
  }
  
  return false
}

// Filtrar formas que son realmente irregulares
const trulyIrregularForms = irregularVerbForms.filter(form => {
  const isRegular = isRegularFormForMoodTest(form.lemma, form.mood, form.tense, form.person, form.value)
  
  // Si es regular, NO debería aparecer en irregulares
  if (isRegular) {
    console.log(`  ❌ FILTRADO: ${form.lemma} → ${form.value} (forma regular)`)
    return false
  }
  
  console.log(`  ✅ INCLUIDO: ${form.lemma} → ${form.value} (forma irregular)`)
  return true
})

console.log("")
console.log("🎯 RESULTADO FINAL:")
console.log(`Total formas que deberían aparecer: ${trulyIrregularForms.length}`)

const uniqueVerbs = [...new Set(trulyIrregularForms.map(f => f.lemma))]
console.log(`Verbos únicos que deberían aparecer: ${uniqueVerbs.length}`)
console.log("Lista de verbos:")
uniqueVerbs.forEach(verb => console.log(`  - ${verb}`))

console.log("")
console.log("🔍 VERIFICACIÓN ESPECÍFICA:")

// Test específico con incluir
const incluirForms = trulyIrregularForms.filter(f => f.lemma === 'incluir')
if (incluirForms.length > 0) {
  console.log("❌ ERROR: 'incluir' aparece en irregulares")
  console.log("Formas de incluir:", incluirForms.map(f => `${f.person}: ${f.value}`))
} else {
  console.log("✅ CORRECTO: 'incluir' NO aparece en irregulares")
}

// Verificar que solo están ser, ir, ver
const expectedIrregulars = ['ser', 'ir', 'ver']
const unexpectedVerbs = uniqueVerbs.filter(v => !expectedIrregulars.includes(v))

if (unexpectedVerbs.length > 0) {
  console.log("❌ VERBOS INCORRECTOS ENCONTRADOS:")
  unexpectedVerbs.forEach(verb => console.log(`  - ${verb}`))
} else {
  console.log("✅ SOLO VERBOS IRREGULARES CORRECTOS (ser, ir, ver)")
}