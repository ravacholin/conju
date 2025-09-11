#!/usr/bin/env node

import { verbs } from '../src/data/verbs.js'
import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const chunksDir = join(__dirname, '../src/data/chunks')

// Configuración de chunks basada en el análisis
const CHUNK_CONFIG = {
  core: {
    verbs: [
      'ser', 'estar', 'haber', 'tener', 'hacer', 'decir', 'ir', 'ver', 'dar', 'saber',
      'querer', 'llegar', 'pasar', 'deber', 'poner', 'parecer', 'quedar'
    ],
    description: 'Verbos más frecuentes A1'
  },
  
  common: {
    verbs: [
      'creer', 'hablar', 'llevar', 'dejar', 'seguir', 'encontrar', 'llamar', 'venir',
      'pensar', 'salir', 'volver', 'tomar', 'conocer', 'vivir', 'sentir', 'tratar',
      'mirar', 'contar', 'empezar', 'esperar', 'buscar', 'existir', 'entrar', 'trabajar',
      'escribir', 'perder', 'producir', 'ocurrir', 'entender', 'pedir', 'recibir', 'recordar', 'terminar'
    ],
    description: 'Verbos comunes frecuentes'
  },
  
  irregulars: {
    filter: (verb) => {
      // Verbos irregulares que no están en core ni common
      const coreAndCommon = new Set([...CHUNK_CONFIG.core.verbs, ...CHUNK_CONFIG.common.verbs])
      return verb.type === 'irregular' && !coreAndCommon.has(verb.lemma)
    },
    description: 'Verbos irregulares complejos'
  },
  
  advanced: {
    filter: (verb) => {
      // Todo lo que no está en otros chunks
      const coreAndCommon = new Set([...CHUNK_CONFIG.core.verbs, ...CHUNK_CONFIG.common.verbs])
      return !coreAndCommon.has(verb.lemma) && verb.type !== 'irregular'
    },
    description: 'Verbos regulares avanzados y raros'
  }
}

function generateChunks() {
  console.log('🔧 Generando chunks de verbos...\n')
  
  // Asegurar que el directorio existe
  mkdirSync(chunksDir, { recursive: true })
  
  const stats = {}
  
  Object.entries(CHUNK_CONFIG).forEach(([chunkName, config]) => {
    let chunkVerbs = []
    
    if (config.verbs) {
      // Chunk basado en lista de lemmas
      chunkVerbs = verbs.filter(verb => config.verbs.includes(verb.lemma))
    } else if (config.filter) {
      // Chunk basado en función de filtro
      chunkVerbs = verbs.filter(config.filter)
    }
    
    // Generar archivo del chunk
    const chunkContent = generateChunkFile(chunkVerbs, config.description)
    const filePath = join(chunksDir, `${chunkName}.js`)
    
    writeFileSync(filePath, chunkContent, 'utf8')
    
    // Estadísticas
    const size = Buffer.byteLength(chunkContent, 'utf8')
    stats[chunkName] = {
      verbCount: chunkVerbs.length,
      size: size,
      sizeKB: Math.round(size / 1024),
      verbs: chunkVerbs.map(v => v.lemma).slice(0, 10) // Primeros 10 para mostrar
    }
    
    console.log(`📦 ${chunkName}.js: ${chunkVerbs.length} verbos (${Math.round(size / 1024)} KB)`)
    console.log(`   Ejemplos: ${chunkVerbs.map(v => v.lemma).slice(0, 5).join(', ')}...`)
  })
  
  console.log('\n📊 Resumen de chunks generados:')
  let totalSize = 0
  let totalVerbs = 0
  
  Object.entries(stats).forEach(([name, stat]) => {
    totalSize += stat.size
    totalVerbs += stat.verbCount
    console.log(`  ${name}: ${stat.verbCount} verbos, ${stat.sizeKB} KB`)
  })
  
  console.log(`\n🎯 Total: ${totalVerbs} verbos, ${Math.round(totalSize / 1024)} KB`)
  
  // Verificar que no se perdieron verbos
  const originalCount = verbs.length
  if (totalVerbs !== originalCount) {
    console.warn(`⚠️  Warning: ${originalCount} verbos originales vs ${totalVerbs} en chunks`)
  }
  
  // Generar archivo de índice para desarrollo
  generateChunkIndex(stats)
  
  return stats
}

function generateChunkFile(verbs, description) {
  const header = `// ${description}
// Generado automáticamente por generate-chunks.js
// ${verbs.length} verbos, ${Math.round(JSON.stringify(verbs).length / 1024)} KB

`
  
  const content = `export const verbs = ${JSON.stringify(verbs, null, 2)}

// Metadata del chunk
export const metadata = {
  count: ${verbs.length},
  description: "${description}",
  verbs: ${JSON.stringify(verbs.map(v => v.lemma))}
}
`
  
  return header + content
}

function generateChunkIndex(stats) {
  const indexContent = `// Índice de chunks de verbos
// Generado automáticamente por generate-chunks.js

export const CHUNK_INDEX = ${JSON.stringify(stats, null, 2)}

export const CHUNKS = {
  core: () => import('./core.js'),
  common: () => import('./common.js'),
  irregulars: () => import('./irregulars.js'),
  advanced: () => import('./advanced.js')
}

// Funciones de utilidad para encontrar chunks
export function getChunkForVerb(lemma) {
  for (const [chunkName, stat] of Object.entries(CHUNK_INDEX)) {
    if (stat.verbs && stat.verbs.includes(lemma)) {
      return chunkName
    }
  }
  return 'advanced' // fallback
}

export function getChunkSize(chunkName) {
  return CHUNK_INDEX[chunkName]?.sizeKB || 0
}

export function getAllChunkNames() {
  return Object.keys(CHUNK_INDEX)
}
`
  
  const indexPath = join(chunksDir, 'index.js')
  writeFileSync(indexPath, indexContent, 'utf8')
  console.log(`📋 Generado índice: chunks/index.js`)
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  generateChunks()
}

export { generateChunks }