// DEBUG SIMPLE DEL PROBLEMA "POR TEMA"
import { verbs } from './src/data/verbs.js'

console.log("🔍 DEBUG: ¿Por qué falla el flujo POR TEMA?")
console.log("=" * 60)

// CONFIGURACIÓN DEL FLUJO "POR TEMA"
const settings = {
  practiceMode: 'specific',
  level: 'ALL',  // ¡Esto es diferente del test anterior!
  region: 'rioplatense',
  useVoseo: true,
  useTuteo: false,
  useVosotros: false,
  specificMood: 'indicative', 
  specificTense: 'impf',
  verbType: 'irregular'
}

console.log("Configuración POR TEMA:")
console.log(settings)
console.log("")

// PASO 1: Obtener todas las formas de imperfecto indicativo
console.log("📊 PASO 1: Recolectando formas de imperfecto indicativo...")
const imperfectForms = []

verbs.forEach(verb => {
  if (!verb.paradigms) return
  verb.paradigms.forEach(paradigm => {
    if (!paradigm.regionTags || !paradigm.regionTags.includes('rioplatense')) return
    if (!paradigm.forms) return
    paradigm.forms.forEach(form => {
      if (form.mood === 'indicative' && form.tense === 'impf') {
        imperfectForms.push({
          lemma: verb.lemma,
          verbType: verb.type,
          ...form
        })
      }
    })
  })
})

console.log(`Total formas de imperfecto: ${imperfectForms.length}`)

// PASO 2: Filtrar por tipo de verbo irregular
console.log("\n📊 PASO 2: Filtrando por verbos marcados como irregulares...")
const irregularVerbForms = imperfectForms.filter(f => f.verbType === 'irregular')
console.log(`Formas de verbos irregulares: ${irregularVerbForms.length}`)

// PASO 3: Aplicar nuestro fix (solo ser, ir, ver)
console.log("\n📊 PASO 3: Aplicando fix para imperfecto irregular...")
const trulyIrregularForms = irregularVerbForms.filter(f => {
  const trulyIrregularImperfectVerbs = ['ser', 'ir', 'ver']
  return trulyIrregularImperfectVerbs.includes(f.lemma)
})
console.log(`Formas realmente irregulares: ${trulyIrregularForms.length}`)

// PASO 4: Filtrar por dialecto (solo voseo)
console.log("\n📊 PASO 4: Filtrando por dialecto (solo voseo)...")
const dialectFiltered = trulyIrregularForms.filter(f => {
  // Excluir tú y vosotros en modo voseo
  if (f.person === '2s_tu') return false
  if (f.person === '2p_vosotros') return false
  return true
})
console.log(`Después de filtro dialectal: ${dialectFiltered.length}`)

// PASO 5: ¿Hay algún otro filtro que se nos escape?
console.log("\n📊 PASO 5: Revisando nivel 'ALL'...")

// En el generator.js, buscar si level: 'ALL' causa algún problema
console.log("Level configurado como: 'ALL'")
console.log("¿Esto afecta el filtrado? Revisemos...")

// PASO 6: Mostrar las formas finales
console.log("\n🎯 RESULTADO FINAL:")
if (dialectFiltered.length > 0) {
  console.log(`✅ ${dialectFiltered.length} formas disponibles:`)
  dialectFiltered.forEach(f => {
    console.log(`  - ${f.lemma}: ${f.value || f.form} (${f.person})`)
  })
  console.log("\n✅ DEBERÍAN APARECER formas. Si hay pantalla negra, el problema está en otro lado.")
} else {
  console.log("❌ NO HAY FORMAS DISPONIBLES")
  console.log("❌ Esto explica la pantalla negra")
}

// PASO 7: Verificar si hay diferencias entre nuestro test y el real
console.log("\n🔍 VERIFICACIONES ADICIONALES:")

// Verificar que los verbos ser, ir, ver tienen formas de imperfecto
const serForms = dialectFiltered.filter(f => f.lemma === 'ser')
const irForms = dialectFiltered.filter(f => f.lemma === 'ir') 
const verForms = dialectFiltered.filter(f => f.lemma === 'ver')

console.log(`Formas de 'ser': ${serForms.length}`)
console.log(`Formas de 'ir': ${irForms.length}`)
console.log(`Formas de 'ver': ${verForms.length}`)

if (serForms.length === 0 || irForms.length === 0 || verForms.length === 0) {
  console.log("❌ PROBLEMA: Faltan formas de algunos verbos irregulares básicos")
}