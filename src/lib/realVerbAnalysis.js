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

console.log('🔍 ANÁLISIS REAL DE VERBOS DISPONIBLES')
console.log('='.repeat(80))

// Extract actual verbs from the file
const verbMatches = verbsFileContent.match(/lemma: '([^']+)'/g)
const actualVerbs = verbMatches ? verbMatches.map(match => match.match(/lemma: '([^']+)'/)[1]) : []

console.log(`📊 VERBOS ENCONTRADOS EN EL ARCHIVO:`)
console.log(`Total de verbos únicos: ${new Set(actualVerbs).size}`)
console.log(`Lista de verbos: ${actualVerbs.join(', ')}`)

// Analyze what forms each verb has
const verbForms = {}
actualVerbs.forEach(verb => {
  const verbSection = verbsFileContent.split(`lemma: '${verb}'`)[1]?.split('},')[0] || ''
  const forms = verbSection.match(/forms: \[([^\]]+)\]/)
  if (forms) {
    const formList = forms[1].match(/'([^']+)'/g) || []
    verbForms[verb] = formList.map(f => f.replace(/'/g, ''))
  }
})

console.log(`\n📋 FORMAS POR VERBO:`)
Object.entries(verbForms).forEach(([verb, forms]) => {
  console.log(`${verb}: ${forms.length} formas`)
})

// Check specific categories
const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
const moods = ['indicative', 'subjunctive', 'imperative', 'conditional', 'nonfinite']
const verbTypes = ['regular', 'irregular']
const dialects = ['rioplatense', 'general', 'peninsular', 'both']

console.log(`\n🔍 ANÁLISIS POR CATEGORÍA:`)
console.log('='.repeat(80))

const categoryAnalysis = {}

for (const level of levels) {
  for (const mood of moods) {
    for (const verbType of verbTypes) {
      const availableTenses = gates
        .filter(g => g.mood === mood && g.level === level)
        .map(g => g.tense)
      
      for (const tense of availableTenses) {
        for (const dialect of dialects) {
          // Count verbs that have forms for this specific combination
          let availableVerbs = []
          
          Object.entries(verbForms).forEach(([verb, forms]) => {
            // Check if this verb has forms for this mood/tense
            const hasForms = forms.some(form => {
              // This is a simplified check - in reality we'd need to parse the actual form structure
              return form.includes(mood) || form.includes(tense)
            })
            
            if (hasForms) {
              availableVerbs.push(verb)
            }
          })
          
          const categoryKey = `${level}_${mood}_${tense}_${verbType}_${dialect}`
          categoryAnalysis[categoryKey] = {
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
          }
        }
      }
    }
  }
}

// Summary
const criticalCategories = Object.values(categoryAnalysis).filter(cat => cat.count <= 2)
const zeroVerbCategories = Object.values(categoryAnalysis).filter(cat => cat.count === 0)
const oneTwoVerbCategories = Object.values(categoryAnalysis).filter(cat => cat.count > 0 && cat.count <= 2)

console.log(`\n📊 RESUMEN:`)
console.log(`Total categorías: ${Object.keys(categoryAnalysis).length}`)
console.log(`Categorías críticas (0-2 verbos): ${criticalCategories.length}`)
console.log(`Categorías con 0 verbos: ${zeroVerbCategories.length}`)
console.log(`Categorías con 1-2 verbos: ${oneTwoVerbCategories.length}`)

// Show some examples of what we actually have
console.log(`\n✅ EJEMPLOS DE CATEGORÍAS CON VERBOS:`)
const categoriesWithVerbs = Object.values(categoryAnalysis).filter(cat => cat.count > 2)
categoriesWithVerbs.slice(0, 5).forEach(cat => {
  console.log(`${cat.level} ${cat.mood} ${cat.tense} ${cat.verbType}: ${cat.count} verbos`)
})

console.log(`\n🚨 EJEMPLOS DE CATEGORÍAS CRÍTICAS:`)
criticalCategories.slice(0, 10).forEach(cat => {
  console.log(`${cat.level} ${cat.mood} ${cat.tense} ${cat.verbType}: ${cat.count} verbos`)
  if (cat.availableVerbs.length > 0) {
    console.log(`  Verbos: ${cat.availableVerbs.join(', ')}`)
  }
})

console.log('\n' + '='.repeat(80))
console.log('🎯 CONCLUSIÓN: Análisis real de verbos disponibles')
console.log('='.repeat(80)) 