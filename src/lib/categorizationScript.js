// Script para categorizar todos los verbos con familias de irregulares
import { verbs } from '../data/verbs.js'
import { categorizeVerb, getAllFamilies } from './data/irregularFamilies.js'

// Función para analizar y categorizar todos los verbos
export function categorizeAllVerbs() {
  const results = {
    categorized: [],
    summary: {},
    familyStats: {}
  }
  
  // Inicializar estadísticas de familias
  getAllFamilies().forEach(family => {
    results.familyStats[family.id] = {
      name: family.name,
      count: 0,
      verbs: []
    }
  })
  
  verbs.forEach(verb => {
    const families = categorizeVerb(verb.lemma, verb)
    
    // Determinar si es realmente irregular
    const isIrregular = families.length > 0
    
    const categorizedVerb = {
      ...verb,
      type: isIrregular ? 'irregular' : 'regular',
      irregularFamilies: families
    }
    
    results.categorized.push(categorizedVerb)
    
    // Actualizar estadísticas
    if (isIrregular) {
      families.forEach(familyId => {
        if (results.familyStats[familyId]) {
          results.familyStats[familyId].count++
          results.familyStats[familyId].verbs.push(verb.lemma)
        }
      })
    }
  })
  
  // Estadísticas generales
  results.summary = {
    total: verbs.length,
    regular: results.categorized.filter(v => v.type === 'regular').length,
    irregular: results.categorized.filter(v => v.type === 'irregular').length,
    familiesUsed: Object.values(results.familyStats).filter(f => f.count > 0).length
  }
  
  return results
}

// Función para generar el código actualizado del archivo verbs.js
export function generateUpdatedVerbsFile(categorizedVerbs) {
  let output = `// Comprehensive Spanish verb database\n`
  output += `import { additionalVerbs } from './additionalVerbs.js'\n\n`
  output += `export const verbs = [\n`
  
  categorizedVerbs.forEach((verb, index) => {
    output += `  {\n`
    output += `    "id": "${verb.id}",\n`
    output += `    "lemma": "${verb.lemma}",\n`
    output += `    "type": "${verb.type}",\n`
    
    if (verb.irregularFamilies && verb.irregularFamilies.length > 0) {
      output += `    "irregularFamilies": ${JSON.stringify(verb.irregularFamilies)},\n`
    }
    
    output += `    "paradigms": ${JSON.stringify(verb.paradigms, null, 6).replace(/^/gm, '    ')}\n`
    output += `  }`
    
    if (index < categorizedVerbs.length - 1) {
      output += `,`
    }
    output += `\n`
  })
  
  output += `]\n\n`
  output += `// Merge additional verbs if they exist\n`
  output += `if (additionalVerbs && additionalVerbs.length > 0) {\n`
  output += `  verbs.push(...additionalVerbs)\n`
  output += `}\n`
  
  return output
}

// Función para mostrar un resumen de la categorización
export function showCategorizationSummary() {
  const results = categorizeAllVerbs()
  
  console.log('=== RESUMEN DE CATEGORIZACIÓN ===')
  console.log(`Total de verbos: ${results.summary.total}`)
  console.log(`Verbos regulares: ${results.summary.regular}`)
  console.log(`Verbos irregulares: ${results.summary.irregular}`)
  console.log(`Familias utilizadas: ${results.summary.familiesUsed}`)
  console.log('')
  
  console.log('=== ESTADÍSTICAS POR FAMILIA ===')
  Object.values(results.familyStats)
    .filter(f => f.count > 0)
    .sort((a, b) => b.count - a.count)
    .forEach(family => {
      console.log(`${family.name}: ${family.count} verbos`)
      console.log(`  Ejemplos: ${family.verbs.slice(0, 5).join(', ')}${family.verbs.length > 5 ? '...' : ''}`)
      console.log('')
    })
  
  return results
}

// Función para detectar verbos mal clasificados en el sistema actual
export function detectMisclassifiedVerbs() {
  const results = categorizeAllVerbs()
  const misclassified = []
  
  results.categorized.forEach(verb => {
    const currentType = verbs.find(v => v.lemma === verb.lemma)?.type
    const newType = verb.type
    
    if (currentType !== newType) {
      misclassified.push({
        lemma: verb.lemma,
        currentType,
        newType,
        families: verb.irregularFamilies
      })
    }
  })
  
  console.log('=== VERBOS MAL CLASIFICADOS ACTUALMENTE ===')
  misclassified.forEach(verb => {
    console.log(`${verb.lemma}: ${verb.currentType} → ${verb.newType}`)
    if (verb.families.length > 0) {
      console.log(`  Familias: ${verb.families.join(', ')}`)
    }
  })
  
  return misclassified
}

// Funciones de utilidad para testing
export function testSpecificVerb(lemma) {
  const verb = verbs.find(v => v.lemma === lemma)
  if (!verb) {
    console.log(`Verbo "${lemma}" no encontrado`)
    return null
  }
  
  const families = categorizeVerb(lemma, verb)
  const isIrregular = families.length > 0
  
  console.log(`=== ANÁLISIS DE "${lemma}" ===`)
  console.log(`Tipo actual: ${verb.type}`)
  console.log(`Tipo sugerido: ${isIrregular ? 'irregular' : 'regular'}`)
  console.log(`Familias: ${families.length > 0 ? families.join(', ') : 'ninguna'}`)
  
  return {
    lemma,
    currentType: verb.type,
    suggestedType: isIrregular ? 'irregular' : 'regular',
    families
  }
}

export function testVerbsByFamily(familyId) {
  const results = categorizeAllVerbs()
  const verbsInFamily = results.categorized.filter(v => 
    v.irregularFamilies && v.irregularFamilies.includes(familyId)
  )
  
  console.log(`=== VERBOS EN LA FAMILIA "${familyId}" ===`)
  verbsInFamily.forEach(verb => {
    console.log(`${verb.lemma} (${verb.irregularFamilies.join(', ')})`)
  })
  
  return verbsInFamily
}