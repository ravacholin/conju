import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Read files
const curriculumPath = path.join(__dirname, '../data/curriculum.json')
const verbsPath = path.join(__dirname, '../data/verbs.js')

const gates = JSON.parse(fs.readFileSync(curriculumPath, 'utf8'))
const verbsFileContent = fs.readFileSync(verbsPath, 'utf8')

console.log('🔍 VERIFICACIÓN FINAL DE VERBOS POR CATEGORÍA')
console.log('='.repeat(80))

// Extract all verbs and their forms
const verbSections = verbsFileContent.split(/(?=  {)/)
const verbData = []

verbSections.forEach(section => {
  const lemmaMatch = section.match(/lemma: '([^']+)'/)
  if (lemmaMatch) {
    const lemma = lemmaMatch[1]
    const forms = []
    
    // Extract all forms
    const formMatches = section.matchAll(/{ mood: '([^']+)', tense: '([^']+)', person: '([^']+)', value: '([^']+)' }/g)
    for (const match of formMatches) {
      forms.push({
        mood: match[1],
        tense: match[2],
        person: match[3],
        value: match[4]
      })
    }
    
    verbData.push({
      lemma,
      forms
    })
  }
})

console.log(`📊 VERBOS ENCONTRADOS: ${verbData.length}`)
verbData.forEach(verb => {
  console.log(`  - ${verb.lemma}: ${verb.forms.length} formas`)
})

// Analyze categories
const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
const moods = ['indicative', 'subjunctive', 'imperative', 'conditional', 'nonfinite']
const verbTypes = ['regular', 'irregular']
const dialects = ['rioplatense', 'general', 'peninsular', 'both']

console.log(`\n🔍 ANÁLISIS POR CATEGORÍA:`)
console.log('='.repeat(80))

const categoryCounts = {}

for (const level of levels) {
  for (const mood of moods) {
    for (const verbType of verbTypes) {
      const availableTenses = gates
        .filter(g => g.mood === mood && g.level === level)
        .map(g => g.tense)
      
      for (const tense of availableTenses) {
        for (const dialect of dialects) {
          const categoryKey = `${level}_${mood}_${tense}_${verbType}_${dialect}`
          
          // Count verbs that have forms for this combination
          let availableVerbs = []
          
          verbData.forEach(verb => {
            const hasForms = verb.forms.some(form => 
              form.mood === mood && form.tense === tense
            )
            
            if (hasForms) {
              availableVerbs.push(verb.lemma)
            }
          })
          
          categoryCounts[categoryKey] = {
            level,
            mood,
            tense,
            verbType,
            dialect,
            availableVerbs,
            count: availableVerbs.length
          }
          
          if (availableVerbs.length <= 2) {
            console.log(`🚨 ${categoryKey}: ${availableVerbs.length} verbos`)
            if (availableVerbs.length > 0) {
              console.log(`   Verbos: ${availableVerbs.join(', ')}`)
            }
          } else if (availableVerbs.length >= 40) {
            console.log(`✅ ${categoryKey}: ${availableVerbs.length} verbos`)
          }
        }
      }
    }
  }
}

// Summary
const allCategories = Object.values(categoryCounts)
const criticalCategories = allCategories.filter(cat => cat.count <= 2)
const sufficientCategories = allCategories.filter(cat => cat.count >= 40)
const insufficientCategories = allCategories.filter(cat => cat.count > 2 && cat.count < 40)

console.log(`\n📊 RESUMEN FINAL:`)
console.log(`Total categorías: ${allCategories.length}`)
console.log(`Categorías críticas (0-2 verbos): ${criticalCategories.length}`)
console.log(`Categorías suficientes (40+ verbos): ${sufficientCategories.length}`)
console.log(`Categorías insuficientes (3-39 verbos): ${insufficientCategories.length}`)

// Show some examples
console.log(`\n✅ EJEMPLOS DE CATEGORÍAS CON SUFICIENTES VERBOS:`)
sufficientCategories.slice(0, 5).forEach(cat => {
  console.log(`${cat.level} ${cat.mood} ${cat.tense} ${cat.verbType}: ${cat.count} verbos`)
})

console.log(`\n🚨 EJEMPLOS DE CATEGORÍAS CRÍTICAS:`)
criticalCategories.slice(0, 10).forEach(cat => {
  console.log(`${cat.level} ${cat.mood} ${cat.tense} ${cat.verbType}: ${cat.count} verbos`)
  if (cat.availableVerbs.length > 0) {
    console.log(`  Verbos: ${cat.availableVerbs.join(', ')}`)
  }
})

// Check specific problematic categories
console.log(`\n🔍 CATEGORÍAS ESPECÍFICAS PROBLEMÁTICAS:`)
const nonfiniteCategories = allCategories.filter(cat => cat.mood === 'nonfinite')
console.log(`Categorías nonfinite: ${nonfiniteCategories.length}`)
console.log(`Categorías nonfinite con 0-2 verbos: ${nonfiniteCategories.filter(cat => cat.count <= 2).length}`)

const subjunctiveCategories = allCategories.filter(cat => cat.mood === 'subjunctive')
console.log(`Categorías subjuntivo: ${subjunctiveCategories.length}`)
console.log(`Categorías subjuntivo con 0-2 verbos: ${subjunctiveCategories.filter(cat => cat.count <= 2).length}`)

console.log('\n' + '='.repeat(80))
console.log('🎯 CONCLUSIÓN: Verificación final completada')
console.log('='.repeat(80)) 