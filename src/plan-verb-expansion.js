#!/usr/bin/env node

// Plan sistemático para expandir la base de datos de verbos
import { verbs } from './data/verbs.js'
import { categorizeVerb } from './lib/irregularFamilies.js'
import { getSimplifiedGroupForVerb } from './lib/simplifiedFamilyGroups.js'

console.log('📋 Plan Sistemático de Expansión de Base de Datos\n')

// Verbos que necesitamos para terceras personas (clasificados por patrón)
const verbsByPattern = {
  'E_I_IR': {
    name: 'Verbos e→i (-ir)',
    common: ['pedir', 'servir', 'repetir', 'seguir', 'sentir', 'preferir', 'mentir'],
    additional: ['competir', 'medir', 'vestir', 'elegir', 'conseguir', 'perseguir']
  },
  'O_U_GER_IR': {
    name: 'Verbos o→u (-ir)', 
    common: ['dormir', 'morir'],
    additional: ['podrir', 'gruñir']
  },
  'HIATUS_Y': {
    name: 'Hiatos con Y (comunes)',
    common: ['leer', 'creer', 'construir', 'destruir', 'huir', 'incluir', 'concluir'],
    additional: ['contribuir', 'distribuir', 'oír', 'caer']
  },
  'HIATUS_Y_ADVANCED': {
    name: 'Hiatos con Y (avanzados B2+)',
    common: ['poseer', 'proveer', 'releer'],
    additional: ['instruir', 'reconstruir', 'sustituir', 'atribuir', 'excluir']
  }
}

const verbsInDB = new Set(verbs.map(v => v.lemma))

// Extraer todas las formas de pretérito existentes
const allForms = []
verbs.forEach(verb => {
  verb.paradigms.forEach(paradigm => {
    paradigm.forms.forEach(form => {
      allForms.push({
        ...form,
        lemma: verb.lemma
      })
    })
  })
})

const verbsWithPreterite = new Set(
  allForms
    .filter(f => f.tense === 'pretIndef')
    .map(f => f.lemma)
)

console.log('=== ANÁLISIS POR PATRÓN ===\n')

let totalNeeded = 0
let totalInDB = 0  
let totalWithPreterite = 0
let verbsToAdd = []

for (const [pattern, data] of Object.entries(verbsByPattern)) {
  console.log(`🔸 ${data.name}`)
  
  const allVerbs = [...data.common, ...data.additional]
  totalNeeded += allVerbs.length
  
  console.log(`   Verbos comunes: ${data.common.join(', ')}`)
  console.log(`   Verbos adicionales: ${data.additional.join(', ')}`)
  
  let inDB = 0
  let withPreterite = 0
  let missing = []
  let needPreterite = []
  
  for (const verb of allVerbs) {
    if (verbsInDB.has(verb)) {
      inDB++
      totalInDB++
      if (verbsWithPreterite.has(verb)) {
        withPreterite++
        totalWithPreterite++
      } else {
        needPreterite.push(verb)
      }
    } else {
      missing.push(verb)
    }
  }
  
  console.log(`   📊 Estado: ${inDB}/${allVerbs.length} en DB, ${withPreterite}/${allVerbs.length} con pretérito`)
  
  if (missing.length > 0) {
    console.log(`   ❌ Faltan completamente: ${missing.join(', ')}`)
    verbsToAdd.push(...missing.map(v => ({ verb: v, pattern, action: 'create' })))
  }
  
  if (needPreterite.length > 0) {
    console.log(`   ⚠️  Necesitan pretérito: ${needPreterite.join(', ')}`)
    verbsToAdd.push(...needPreterite.map(v => ({ verb: v, pattern, action: 'add_preterite' })))
  }
  
  console.log()
}

console.log('=== RESUMEN GENERAL ===\n')
console.log(`📊 Total necesario: ${totalNeeded} verbos`)
console.log(`📊 En base de datos: ${totalInDB} (${Math.round(totalInDB/totalNeeded*100)}%)`)
console.log(`📊 Con pretérito: ${totalWithPreterite} (${Math.round(totalWithPreterite/totalNeeded*100)}%)`)
console.log(`📊 Trabajo pendiente: ${verbsToAdd.length} verbos`)

console.log('\n=== PLAN DE TRABAJO ===\n')

console.log('🔧 Verbos que necesitan pretérito agregado (más fácil):')
const needPreterite = verbsToAdd.filter(v => v.action === 'add_preterite')
for (const item of needPreterite) {
  console.log(`   • ${item.verb} (${item.pattern})`)
}

console.log('\n🆕 Verbos que necesitan crearse completamente:')
const needCreation = verbsToAdd.filter(v => v.action === 'create')
for (const item of needCreation) {
  console.log(`   • ${item.verb} (${item.pattern})`)
}

console.log('\n=== PRIORIZACIÓN ===\n')
console.log('👑 ALTA PRIORIDAD (verbos muy comunes):')
const highPriority = ['repetir', 'sentir', 'preferir', 'morir', 'creer', 'construir', 'destruir']
for (const verb of highPriority) {
  const item = verbsToAdd.find(v => v.verb === verb)
  if (item) {
    console.log(`   • ${verb} (${item.action === 'create' ? 'CREAR' : 'AGREGAR PRETÉRITO'})`)
  }
}

console.log('\n🔹 MEDIA PRIORIDAD (verbos importantes):') 
const mediumPriority = ['mentir', 'competir', 'vestir', 'huir', 'incluir', 'concluir']
for (const verb of mediumPriority) {
  const item = verbsToAdd.find(v => v.verb === verb)
  if (item) {
    console.log(`   • ${verb} (${item.action === 'create' ? 'CREAR' : 'AGREGAR PRETÉRITO'})`)
  }
}

console.log('\n📈 ESTIMACIÓN DE TRABAJO:')
console.log(`   • Agregar pretérito: ${needPreterite.length} verbos × 5 min = ${needPreterite.length * 5} minutos`)
console.log(`   • Crear verbos nuevos: ${needCreation.length} verbos × 15 min = ${needCreation.length * 15} minutos`) 
console.log(`   • Total estimado: ${needPreterite.length * 5 + needCreation.length * 15} minutos (${Math.round((needPreterite.length * 5 + needCreation.length * 15) / 60)} horas)`)

console.log('\n✅ RECOMENDACIÓN: Comenzar con verbos de alta prioridad que solo necesitan pretérito agregado.')