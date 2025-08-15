#!/usr/bin/env node

// Script para eliminar verbos duplicados en priorityVerbs.js

import fs from 'fs'

const priorityVerbsPath = '/Users/pablo/Desktop/code/spanish-conjugator/conju/src/data/priorityVerbs.js'

// Leer el archivo
let content = fs.readFileSync(priorityVerbsPath, 'utf8')

console.log('🔧 Eliminando duplicados de verbos GU_DROP...')

// Verbos a limpiar duplicados
const duplicateVerbs = ['distinguir', 'conseguir', 'perseguir', 'extinguir']

// Para cada verbo duplicado, eliminar la primera aparición
duplicateVerbs.forEach(verb => {
  console.log(`Procesando: ${verb}`)
  
  // Patrón para encontrar el verbo completo (desde { hasta })
  const verbPattern = new RegExp(
    `\\s*//[^\\n]*${verb}[^\\n]*\\n\\s*\\{[\\s\\S]*?"lemma":\\s*"${verb}"[\\s\\S]*?\\}\\s*(?=,\\s*(?://|\\{|\\]))`, 
    'i'
  )
  
  // Buscar todas las apariciones
  const matches = content.match(new RegExp(verbPattern.source, 'gi'))
  
  if (matches && matches.length > 1) {
    console.log(`  - Encontradas ${matches.length} apariciones`)
    
    // Eliminar solo la primera aparición
    content = content.replace(verbPattern, '')
    console.log(`  - Eliminada primera aparición de ${verb}`)
  } else {
    console.log(`  - Solo 1 aparición encontrada para ${verb}`)
  }
})

// Escribir el archivo limpio
fs.writeFileSync(priorityVerbsPath, content)

console.log('✅ Duplicados eliminados correctamente')
console.log('📊 Verificando resultado...')

// Verificar resultado
const verifiedContent = fs.readFileSync(priorityVerbsPath, 'utf8')
duplicateVerbs.forEach(verb => {
  const matches = (verifiedContent.match(new RegExp(`"lemma":\\s*"${verb}"`, 'gi')) || []).length
  console.log(`  ${verb}: ${matches} aparición(es)`)
})