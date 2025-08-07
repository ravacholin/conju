import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const gates = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/curriculum.json'), 'utf8'))

console.log('🔍 ANÁLISIS DE GATES')
console.log('='.repeat(80))

function levelOrder(L) {
  return ['A1','A2','B1','B2','C1','C2'].indexOf(L)
}

// Verificar qué gates están disponibles para cada nivel
const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

levels.forEach(level => {
  console.log(`\n📊 GATES PARA NIVEL ${level}:`)
  
  // Gates exactos para este nivel
  const exactGates = gates.filter(g => g.level === level)
  console.log(`Gates exactos (${level}): ${exactGates.length}`)
  exactGates.forEach(gate => {
    console.log(`  - ${gate.mood} ${gate.tense}`)
  })
  
  // Gates disponibles para este nivel (incluyendo niveles inferiores)
  const availableGates = gates.filter(g => levelOrder(g.level) <= levelOrder(level))
  console.log(`Gates disponibles (≤${level}): ${availableGates.length}`)
  
  // Verificar específicamente nonfinite
  const nonfiniteGates = availableGates.filter(g => g.mood === 'nonfinite')
  console.log(`Gates nonfinite disponibles: ${nonfiniteGates.length}`)
  nonfiniteGates.forEach(gate => {
    console.log(`  - ${gate.level} ${gate.mood} ${gate.tense}`)
  })
})

// Simular el problema específico
console.log('\n🔍 SIMULACIÓN DEL PROBLEMA:')
console.log('='.repeat(80))

const testLevel = 'A1'
const testMood = 'nonfinite'
const testTense = 'part'

console.log(`Buscando gate para: ${testLevel} ${testMood} ${testTense}`)

// Buscar gate exacto
const exactGate = gates.find(g => g.level === testLevel && g.mood === testMood && g.tense === testTense)
console.log(`Gate exacto:`, exactGate)

// Buscar gate con levelOrder (como lo hace el generator)
const levelOrderGate = gates.find(g => g.mood === testMood && g.tense === testTense && levelOrder(g.level) <= levelOrder(testLevel))
console.log(`Gate con levelOrder:`, levelOrderGate)

// Verificar todos los gates nonfinite disponibles
const allNonfiniteGates = gates.filter(g => g.mood === 'nonfinite')
console.log('\n📊 TODOS LOS GATES NONFINITE:')
allNonfiniteGates.forEach(gate => {
  console.log(`  ${gate.level} ${gate.mood} ${gate.tense}`)
})

// Verificar qué pasa con otros niveles
console.log('\n🔍 VERIFICACIÓN POR NIVEL:')
levels.forEach(level => {
  const availableGates = gates.filter(g => g.mood === testMood && g.tense === testTense && levelOrder(g.level) <= levelOrder(level))
  console.log(`${level}: ${availableGates.length} gates disponibles`)
  availableGates.forEach(gate => {
    console.log(`  - ${gate.level} ${gate.mood} ${gate.tense}`)
  })
})

console.log('\n' + '='.repeat(80))
console.log('🎯 ANÁLISIS COMPLETADO')
console.log('='.repeat(80)) 