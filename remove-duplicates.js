#!/usr/bin/env node

// Script para eliminar verbos duplicados manteniendo solo la última aparición

import fs from 'fs'

const priorityVerbsPath = '/Users/pablo/Desktop/code/spanish-conjugator/conju/src/data/priorityVerbs.js'

// Leer el archivo y parsear el contenido
let content = fs.readFileSync(priorityVerbsPath, 'utf8')

console.log('🔧 Eliminando verbos duplicados...')

// Importar temporalmente para acceder al array
const tempFile = priorityVerbsPath.replace('.js', '.temp.mjs')
fs.writeFileSync(tempFile, content.replace('export const priorityVerbs =', 'const priorityVerbs =') + '\nexport { priorityVerbs }')

// Cargar verbos
const { priorityVerbs } = await import(tempFile)

console.log(`📚 Verbos originales: ${priorityVerbs.length}`)

// Identificar duplicados por lemma
const seen = new Map()
const toKeep = []

// Procesamos de atrás hacia adelante para mantener las últimas apariciones
for (let i = priorityVerbs.length - 1; i >= 0; i--) {
  const verb = priorityVerbs[i]
  const lemma = verb.lemma
  
  if (!seen.has(lemma)) {
    seen.set(lemma, i)
    toKeep.unshift(verb) // Agregamos al inicio para mantener el orden original
  } else {
    console.log(`❌ Eliminando duplicado: ${lemma} (posición ${i})`)
  }
}

console.log(`📚 Verbos únicos: ${toKeep.length}`)

// Construir nuevo archivo
const newContent = `// Verbos prioritarios para cobertura CEFR - sin duplicados
export const priorityVerbs = ${JSON.stringify(toKeep, null, 2)}

// Función para combinar con verbos principales sin duplicados
export function getAllVerbsWithPriority(mainVerbs) {
  const existingLemmas = new Set(mainVerbs.map(v => v.lemma))
  const uniquePriorityVerbs = priorityVerbs.filter(v => !existingLemmas.has(v.lemma))
  return [...mainVerbs, ...uniquePriorityVerbs]
}
`

// Escribir archivo limpio
fs.writeFileSync(priorityVerbsPath, newContent)
fs.unlinkSync(tempFile) // Limpiar archivo temporal

console.log('✅ Duplicados eliminados correctamente')

// Verificar
const duplicateVerbs = ['distinguir', 'conseguir', 'perseguir', 'extinguir']
duplicateVerbs.forEach(verb => {
  const matches = (newContent.match(new RegExp(`"lemma":\\s*"${verb}"`, 'gi')) || []).length
  console.log(`  ${verb}: ${matches} aparición(es)`)
})