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

console.log('🔍 VERIFICACIÓN SIMPLE DE VERBOS')
console.log('='.repeat(80))

// Count total verbs
const verbMatches = verbsFileContent.match(/lemma: '([^']+)'/g)
const actualVerbs = verbMatches ? verbMatches.map(match => match.match(/lemma: '([^']+)'/)[1]) : []

console.log(`📊 VERBOS TOTALES: ${actualVerbs.length}`)
console.log(`Lista: ${actualVerbs.join(', ')}`)

// Check specific categories that should have verbs now
console.log(`\n🔍 VERIFICANDO CATEGORÍAS ESPECÍFICAS:`)

// Check A1 present indicative regular
const a1PresIndicative = verbsFileContent.match(/A1.*indicative.*pres.*regular/g)
console.log(`A1 Indicativo Presente Regular: ${a1PresIndicative ? '✅ SÍ' : '❌ NO'}`)

// Check nonfinite forms
const nonfiniteForms = verbsFileContent.match(/nonfinite.*part|nonfinite.*ger/g)
console.log(`Formas no finitas: ${nonfiniteForms ? '✅ SÍ' : '❌ NO'}`)

// Check specific verbs
const hasTrabajar = verbsFileContent.includes("lemma: 'trabajar'")
const hasEstudiar = verbsFileContent.includes("lemma: 'estudiar'")
const hasEscribir = verbsFileContent.includes("lemma: 'escribir'")

console.log(`\n📋 VERBOS ESPECÍFICOS:`)
console.log(`Trabajar: ${hasTrabajar ? '✅' : '❌'}`)
console.log(`Estudiar: ${hasEstudiar ? '✅' : '❌'}`)
console.log(`Escribir: ${hasEscribir ? '✅' : '❌'}`)

// Check if they have nonfinite forms
const trabajarNonfinite = verbsFileContent.includes("trabajado") || verbsFileContent.includes("trabajando")
const estudiarNonfinite = verbsFileContent.includes("estudiado") || verbsFileContent.includes("estudiando")
const escribirNonfinite = verbsFileContent.includes("escrito") || verbsFileContent.includes("escribiendo")

console.log(`\n📋 FORMAS NO FINITAS:`)
console.log(`Trabajar (participio/gerundio): ${trabajarNonfinite ? '✅' : '❌'}`)
console.log(`Estudiar (participio/gerundio): ${estudiarNonfinite ? '✅' : '❌'}`)
console.log(`Escribir (participio/gerundio): ${escribirNonfinite ? '✅' : '❌'}`)

// Count forms for a specific verb
const trabajarForms = (verbsFileContent.match(/trabaj[aeiouáéíóú]/g) || []).length
const estudiarForms = (verbsFileContent.match(/estudi[aeiouáéíóú]/g) || []).length
const escribirForms = (verbsFileContent.match(/escrib[aeiouáéíóú]/g) || []).length

console.log(`\n📊 NÚMERO DE FORMAS:`)
console.log(`Trabajar: ${trabajarForms} formas`)
console.log(`Estudiar: ${estudiarForms} formas`)
console.log(`Escribir: ${escribirForms} formas`)

console.log('\n' + '='.repeat(80))
console.log('🎯 CONCLUSIÓN: Verificación simple completada')
console.log('='.repeat(80)) 