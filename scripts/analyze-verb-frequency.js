#!/usr/bin/env node

import { verbs } from '../src/data/verbs.js'
import { readFileSync } from 'fs'
const gates = JSON.parse(readFileSync(new URL('../src/data/curriculum.json', import.meta.url), 'utf8'))
import { IRREGULAR_FAMILIES } from '../src/lib/data/irregularFamilies.js'
import { CATEGORIZE_VERB } from '../src/lib/data/irregularFamilies.js'

// Lista de verbos más frecuentes en español (datos reales de corpus)
const HIGH_FREQUENCY_VERBS = [
  'ser', 'estar', 'haber', 'tener', 'hacer', 'decir', 'ir', 'ver', 'dar', 'saber',
  'querer', 'llegar', 'pasar', 'deber', 'poner', 'parecer', 'quedar', 'creer', 'hablar', 'llevar',
  'dejar', 'seguir', 'encontrar', 'llamar', 'venir', 'pensar', 'salir', 'volver', 'tomar', 'conocer',
  'vivir', 'sentir', 'tratar', 'mirar', 'contar', 'empezar', 'esperar', 'buscar', 'existir', 'entrar',
  'trabajar', 'escribir', 'perder', 'producir', 'ocurrir', 'entender', 'pedir', 'recibir', 'recordar', 'terminar'
]

function analyzeVerbsForChunking() {
  console.log('📊 Análisis de verbos para chunking optimizado\n')
  
  // Análisis básico
  const totalVerbs = verbs.length
  const totalSize = JSON.stringify(verbs).length
  console.log(`Total verbos: ${totalVerbs}`)
  console.log(`Tamaño total: ${(totalSize / 1024 / 1024).toFixed(2)} MB\n`)
  
  // Análisis por nivel CEFR
  const verbsByLevel = analyzeVerbsByLevel()
  console.log('📚 Distribución por nivel CEFR:')
  Object.entries(verbsByLevel).forEach(([level, verbs]) => {
    const size = JSON.stringify(verbs).length
    console.log(`  ${level}: ${verbs.length} verbos (${(size / 1024).toFixed(0)} KB)`)
  })
  console.log()
  
  // Análisis por frecuencia
  const verbsByFrequency = analyzeVerbsByFrequency()
  console.log('🔥 Distribución por frecuencia:')
  Object.entries(verbsByFrequency).forEach(([freq, verbs]) => {
    const size = JSON.stringify(verbs).length
    console.log(`  ${freq}: ${verbs.length} verbos (${(size / 1024).toFixed(0)} KB)`)
  })
  console.log()
  
  // Análisis por tipo
  const verbsByType = analyzeVerbsByType()
  console.log('🔀 Distribución por tipo:')
  Object.entries(verbsByType).forEach(([type, verbs]) => {
    const size = JSON.stringify(verbs).length
    console.log(`  ${type}: ${verbs.length} verbos (${(size / 1024).toFixed(0)} KB)`)
  })
  console.log()
  
  // Propuesta de chunks
  const chunkStrategy = proposeChunkStrategy()
  console.log('💡 Estrategia de chunking propuesta:')
  chunkStrategy.forEach(chunk => {
    console.log(`  📦 ${chunk.name}: ${chunk.verbs.length} verbos (${(chunk.size / 1024).toFixed(0)} KB)`)
    console.log(`     Criterios: ${chunk.criteria}`)
  })
  console.log()
  
  // Métricas finales
  const coreChunk = chunkStrategy[0]
  const reduction = (1 - (coreChunk.size / totalSize)) * 100
  console.log(`🎯 Reducción del bundle inicial: ${reduction.toFixed(1)}%`)
  console.log(`   Bundle inicial actual: ${(totalSize / 1024 / 1024).toFixed(2)} MB`)
  console.log(`   Bundle inicial propuesto: ${(coreChunk.size / 1024).toFixed(0)} KB`)
  
  return chunkStrategy
}

function analyzeVerbsByLevel() {
  const levelMappings = new Map()
  
  // Mapear mood/tense a niveles
  gates.forEach(gate => {
    const key = `${gate.mood}|${gate.tense}`
    if (!levelMappings.has(key)) {
      levelMappings.set(key, gate.level)
    }
  })
  
  const verbsByLevel = {
    A1: [], A2: [], B1: [], B2: [], C1: [], C2: [], ADVANCED: []
  }
  
  verbs.forEach(verb => {
    let minLevel = 'C2'
    
    // Encontrar el nivel mínimo necesario para este verbo
    verb.paradigms.forEach(paradigm => {
      paradigm.forms.forEach(form => {
        const key = `${form.mood}|${form.tense}`
        const level = levelMappings.get(key)
        if (level && isLowerLevel(level, minLevel)) {
          minLevel = level
        }
      })
    })
    
    if (verbsByLevel[minLevel]) {
      verbsByLevel[minLevel].push(verb)
    } else {
      verbsByLevel.ADVANCED.push(verb)
    }
  })
  
  return verbsByLevel
}

function analyzeVerbsByFrequency() {
  const highFreq = []
  const mediumFreq = []
  const lowFreq = []
  
  verbs.forEach(verb => {
    if (HIGH_FREQUENCY_VERBS.includes(verb.lemma)) {
      highFreq.push(verb)
    } else if (verb.type === 'regular' || isCommonIrregular(verb)) {
      mediumFreq.push(verb)
    } else {
      lowFreq.push(verb)
    }
  })
  
  return {
    'alta': highFreq,
    'media': mediumFreq,
    'baja': lowFreq
  }
}

function analyzeVerbsByType() {
  const regular = []
  const irregular = []
  
  verbs.forEach(verb => {
    if (verb.type === 'regular') {
      regular.push(verb)
    } else {
      irregular.push(verb)
    }
  })
  
  return { regular, irregular }
}

function proposeChunkStrategy() {
  const chunks = []
  
  // Core chunk: A1 + alta frecuencia
  const coreVerbs = verbs.filter(verb => 
    HIGH_FREQUENCY_VERBS.slice(0, 20).includes(verb.lemma) ||
    (isA1Verb(verb) && HIGH_FREQUENCY_VERBS.includes(verb.lemma))
  )
  
  chunks.push({
    name: 'core.js',
    verbs: coreVerbs,
    size: JSON.stringify(coreVerbs).length,
    criteria: 'A1 + 20 verbos más frecuentes'
  })
  
  // A1 extended
  const a1Extended = verbs.filter(verb => 
    isA1Verb(verb) && !coreVerbs.includes(verb)
  )
  
  chunks.push({
    name: 'a1-extended.js',
    verbs: a1Extended,
    size: JSON.stringify(a1Extended).length,
    criteria: 'Resto de verbos A1'
  })
  
  // A2 common
  const a2Common = verbs.filter(verb => 
    isA2Verb(verb) && (HIGH_FREQUENCY_VERBS.includes(verb.lemma) || verb.type === 'regular')
  )
  
  chunks.push({
    name: 'a2-common.js',
    verbs: a2Common,
    size: JSON.stringify(a2Common).length,
    criteria: 'A2 frecuentes y regulares'
  })
  
  // B1 irregulars
  const b1Irregulars = verbs.filter(verb => 
    (isB1Verb(verb) || isHigherLevel(verb)) && verb.type === 'irregular'
  )
  
  chunks.push({
    name: 'b1-irregulars.js',
    verbs: b1Irregulars,
    size: JSON.stringify(b1Irregulars).length,
    criteria: 'B1+ irregulares'
  })
  
  // Advanced (remaining)
  const usedVerbs = new Set([...coreVerbs, ...a1Extended, ...a2Common, ...b1Irregulars])
  const advanced = verbs.filter(verb => !usedVerbs.has(verb))
  
  chunks.push({
    name: 'advanced.js',
    verbs: advanced,
    size: JSON.stringify(advanced).length,
    criteria: 'B2, C1, C2 y resto'
  })
  
  return chunks
}

function isA1Verb(verb) {
  return hasFormsInLevel(verb, 'A1') && !hasFormsInLevel(verb, 'A2', true)
}

function isA2Verb(verb) {
  return hasFormsInLevel(verb, 'A2') && !hasFormsInLevel(verb, 'B1', true)
}

function isB1Verb(verb) {
  return hasFormsInLevel(verb, 'B1') && !hasFormsInLevel(verb, 'B2', true)
}

function isHigherLevel(verb) {
  return hasFormsInLevel(verb, 'B2', true)
}

function hasFormsInLevel(verb, targetLevel, orHigher = false) {
  const levelMappings = new Map()
  gates.forEach(gate => {
    const key = `${gate.mood}|${gate.tense}`
    levelMappings.set(key, gate.level)
  })
  
  return verb.paradigms.some(paradigm =>
    paradigm.forms.some(form => {
      const key = `${form.mood}|${form.tense}`
      const level = levelMappings.get(key)
      if (orHigher) {
        return level && !isLowerLevel(level, targetLevel)
      }
      return level === targetLevel
    })
  )
}

function isCommonIrregular(verb) {
  const commonIrregulars = ['ser', 'estar', 'ir', 'ver', 'dar', 'haber', 'hacer', 'decir', 'tener', 'venir', 'poner', 'saber', 'querer']
  return commonIrregulars.includes(verb.lemma)
}

function isLowerLevel(level1, level2) {
  const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
  return levels.indexOf(level1) < levels.indexOf(level2)
}

// Ejecutar análisis
if (import.meta.url === `file://${process.argv[1]}`) {
  analyzeVerbsForChunking()
}

export { analyzeVerbsForChunking }