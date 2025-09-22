// Debug script to understand why only few verbs appear in "Irregulares en 3ª persona"
import { categorizeVerb } from './src/lib/data/irregularFamilies.js'
import { verbs } from './src/data/verbs.js'

console.log('=== ANÁLISIS DEL FILTRO "IRREGULARES EN 3ª PERSONA" ===\n')

const pedagogicalFamilies = ['E_I_IR', 'O_U_GER_IR', 'HIATUS_Y']
const strongPreteriteIrregularities = ['PRET_UV', 'PRET_U', 'PRET_I', 'PRET_J', 'PRET_SUPPL']

// Analizar todos los verbos irregulares
const irregularVerbs = verbs.filter(verb => verb.type === 'irregular')

console.log(`Total verbos irregulares en base de datos: ${irregularVerbs.length}`)

let passedFilter = []
let failedPedagogical = []
let failedStrong = []

irregularVerbs.forEach(verb => {
  const families = categorizeVerb(verb.lemma, verb)

  // Check pedagogical relevance
  const isPedagogicallyRelevant = families.some(family => pedagogicalFamilies.includes(family))

  if (!isPedagogicallyRelevant) {
    failedPedagogical.push({
      lemma: verb.lemma,
      families: families,
      reason: 'No tiene familias pedagógicas'
    })
    return
  }

  // Check strong irregularities
  const hasStrongPreteriteIrregularities = families.some(family => strongPreteriteIrregularities.includes(family))

  if (hasStrongPreteriteIrregularities) {
    failedStrong.push({
      lemma: verb.lemma,
      families: families,
      strongFamilies: families.filter(f => strongPreteriteIrregularities.includes(f)),
      reason: 'Tiene irregularidades fuertes'
    })
    return
  }

  // Passed all filters
  passedFilter.push({
    lemma: verb.lemma,
    families: families,
    pedagogicalFamilies: families.filter(f => pedagogicalFamilies.includes(f))
  })
})

console.log('\n=== VERBOS QUE PASAN EL FILTRO ===')
console.log(`Total: ${passedFilter.length}`)
passedFilter.forEach(verb => {
  console.log(`✅ ${verb.lemma}: ${verb.pedagogicalFamilies.join(', ')} | Todas: ${verb.families.join(', ')}`)
})

console.log('\n=== VERBOS EXCLUIDOS POR NO TENER FAMILIAS PEDAGÓGICAS ===')
console.log(`Total: ${failedPedagogical.length}`)
failedPedagogical.slice(0, 10).forEach(verb => {
  console.log(`❌ ${verb.lemma}: ${verb.families.join(', ')}`)
})
if (failedPedagogical.length > 10) {
  console.log(`... y ${failedPedagogical.length - 10} más`)
}

console.log('\n=== VERBOS EXCLUIDOS POR TENER IRREGULARIDADES FUERTES ===')
console.log(`Total: ${failedStrong.length}`)
failedStrong.forEach(verb => {
  console.log(`❌ ${verb.lemma}: ${verb.strongFamilies.join(', ')} | Todas: ${verb.families.join(', ')}`)
})

console.log('\n=== RESUMEN ===')
console.log(`Verbos irregulares totales: ${irregularVerbs.length}`)
console.log(`✅ Pasan filtro: ${passedFilter.length}`)
console.log(`❌ Fallan por no pedagógicos: ${failedPedagogical.length}`)
console.log(`❌ Fallan por muy irregulares: ${failedStrong.length}`)

// Verificar verbos específicos que esperamos
console.log('\n=== VERIFICACIÓN DE VERBOS ESPERADOS ===')
const expectedVerbs = ['pedir', 'servir', 'repetir', 'dormir', 'morir', 'leer', 'creer', 'seguir', 'sentir', 'construir', 'destruir', 'huir']
expectedVerbs.forEach(lemma => {
  const verb = verbs.find(v => v.lemma === lemma)
  if (!verb) {
    console.log(`❓ ${lemma}: NO ENCONTRADO en base de datos`)
    return
  }

  if (verb.type !== 'irregular') {
    console.log(`❓ ${lemma}: NO es irregular (tipo: ${verb.type})`)
    return
  }

  const families = categorizeVerb(lemma, verb)
  const isPedagogical = families.some(f => pedagogicalFamilies.includes(f))
  const isStrong = families.some(f => strongPreteriteIrregularities.includes(f))

  if (isPedagogical && !isStrong) {
    console.log(`✅ ${lemma}: DEBERÍA APARECER - ${families.filter(f => pedagogicalFamilies.includes(f)).join(', ')}`)
  } else if (!isPedagogical) {
    console.log(`❌ ${lemma}: No pedagógico - ${families.join(', ')}`)
  } else if (isStrong) {
    console.log(`❌ ${lemma}: Muy irregular - ${families.filter(f => strongPreteriteIrregularities.includes(f)).join(', ')}`)
  }
})