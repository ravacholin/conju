#!/usr/bin/env node

// Debug: ¿Por qué solo aparecen pedir y dormir en irregulares de 3ª persona?
import { verbs } from './data/verbs.js'
import { categorizeVerb } from './lib/irregularFamilies.js'
import { getSimplifiedGroupForVerb } from './lib/simplifiedFamilyGroups.js'

// Extraer todas las formas de todos los verbos (como hace el generador)
const allForms = []
verbs.forEach(verb => {
  verb.paradigms.forEach(paradigm => {
    paradigm.forms.forEach(form => {
      allForms.push({
        ...form,
        lemma: verb.lemma,
        verbId: verb.id
      })
    })
  })
})

console.log('🔍 Investigating Available Verbs for Third Person Irregulars\n')

// Verbos que deberían aparecer según la especificación
const expectedThirdPersonVerbs = [
  // Cambio e→i (verbos -ir)
  'pedir', 'servir', 'repetir', 'seguir', 'sentir', 'preferir', 
  'mentir', 'competir', 'medir', 'vestir',
  
  // Cambio o→u (verbos -ir)
  'dormir', 'morir',
  
  // Verbos menos comunes para B2+ (o→u)
  'podrir', 'gruñir',
  
  // Hiatos con Y (solo 3ª persona)
  'leer', 'creer', 'construir', 'destruir', 'huir',
  'incluir', 'concluir', 'contribuir', 'distribuir',
  
  // Hiatos menos comunes para B2+
  'poseer', 'proveer', 'releer', 'instruir', 'reconstruir',
  'sustituir', 'atribuir', 'excluir'
]

console.log('=== 1. Verificar si los verbos están en la base de datos ===\n')

const verbsInDB = new Set(verbs.map(v => v.lemma))
let foundInDB = 0
let missingFromDB = []

for (const verb of expectedThirdPersonVerbs) {
  const inDB = verbsInDB.has(verb)
  console.log(`${verb}: ${inDB ? '✅ EN DB' : '❌ FALTA'}`)
  if (inDB) foundInDB++
  else missingFromDB.push(verb)
}

console.log(`\nResultado: ${foundInDB}/${expectedThirdPersonVerbs.length} verbos encontrados en la base de datos`)
if (missingFromDB.length > 0) {
  console.log(`Verbos faltantes: ${missingFromDB.join(', ')}`)
}

console.log('\n=== 2. Verificar formas de pretérito indefinido disponibles ===\n')

const preteriteFormsMap = new Map()

// Agrupar formas de pretérito indefinido por lemma
for (const form of allForms) {
  if (form.tense === 'pretIndef') {
    if (!preteriteFormsMap.has(form.lemma)) {
      preteriteFormsMap.set(form.lemma, [])
    }
    preteriteFormsMap.get(form.lemma).push(form)
  }
}

console.log(`Total verbos con formas de pretérito indefinido: ${preteriteFormsMap.size}`)

// Verificar verbos esperados que tienen formas de pretérito
let hasPreteriteForms = 0
for (const verb of expectedThirdPersonVerbs) {
  const forms = preteriteFormsMap.get(verb)
  const hasIt = forms && forms.length > 0
  if (hasIt) hasPreteriteForms++
  
  if (!hasIt && verbsInDB.has(verb)) {
    console.log(`⚠️  ${verb}: está en DB pero NO tiene formas de pretérito indefinido`)
  }
}

console.log(`Verbos esperados con formas de pretérito: ${hasPreteriteForms}/${expectedThirdPersonVerbs.length}`)

console.log('\n=== 3. Verificar clasificación de verbos existentes ===\n')

let correctlyClassified = 0
let incorrectlyClassified = []
let correctClassifications = []

for (const verb of expectedThirdPersonVerbs) {
  if (!verbsInDB.has(verb)) continue
  
  const families = categorizeVerb(verb)
  const group = getSimplifiedGroupForVerb(families, 'pretIndef')
  const isCorrect = group === 'PRETERITE_THIRD_PERSON'
  
  console.log(`${verb}: ${isCorrect ? '✅' : '❌'} grupo=${group} familias=[${families.join(', ')}]`)
  
  if (isCorrect) {
    correctlyClassified++
    correctClassifications.push(verb)
  } else {
    incorrectlyClassified.push({ verb, group, families })
  }
}

console.log(`\nClasificación: ${correctlyClassified} correctos, ${incorrectlyClassified.length} incorrectos`)

if (incorrectlyClassified.length > 0) {
  console.log('\nVerbos mal clasificados:')
  for (const { verb, group, families } of incorrectlyClassified) {
    console.log(`  ${verb}: grupo=${group} (debería ser PRETERITE_THIRD_PERSON)`)
  }
}

console.log('\n=== 4. Buscar otros verbos que podrían calificar ===\n')

// Buscar todos los verbos que se clasifican como PRETERITE_THIRD_PERSON
const qualifyingVerbs = []

for (const verb of verbs) {
  const families = categorizeVerb(verb.lemma)
  const group = getSimplifiedGroupForVerb(families, 'pretIndef')
  
  if (group === 'PRETERITE_THIRD_PERSON') {
    const hasPreterite = preteriteFormsMap.has(verb.lemma)
    qualifyingVerbs.push({
      lemma: verb.lemma,
      families,
      hasPreterite
    })
  }
}

console.log(`Verbos que califican como PRETERITE_THIRD_PERSON: ${qualifyingVerbs.length}`)
console.log('\nTodos los verbos que califican:')
for (const { lemma, families, hasPreterite } of qualifyingVerbs) {
  const status = hasPreterite ? '✅' : '❌ SIN FORMAS'
  console.log(`  ${lemma}: ${status} [${families.join(', ')}]`)
}

console.log('\n=== 5. Resumen del problema ===\n')

const totalInDB = expectedThirdPersonVerbs.filter(v => verbsInDB.has(v)).length
const totalWithForms = expectedThirdPersonVerbs.filter(v => preteriteFormsMap.has(v)).length
const totalCorrectlyClassified = correctClassifications.length

console.log(`📊 Resumen:`)
console.log(`   • Verbos esperados: ${expectedThirdPersonVerbs.length}`)
console.log(`   • En base de datos: ${totalInDB}`)
console.log(`   • Con formas de pretérito: ${totalWithForms}`)
console.log(`   • Correctamente clasificados: ${totalCorrectlyClassified}`)
console.log(`   • Total disponibles en drills: ${qualifyingVerbs.filter(v => v.hasPreterite).length}`)

if (qualifyingVerbs.filter(v => v.hasPreterite).length < 10) {
  console.log('\n❌ PROBLEMA: Muy pocos verbos disponibles para los drills')
  console.log('   Posibles causas:')
  console.log('   1. Verbos faltantes en la base de datos')
  console.log('   2. Formas de pretérito faltantes')
  console.log('   3. Clasificación incorrecta')
}