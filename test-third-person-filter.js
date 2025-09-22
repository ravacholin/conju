// Test manual para verificar el filtro pedagógico de terceras personas
import { chooseNext } from './src/lib/core/generator.js'
import { buildFormsForRegion } from './src/lib/core/eligibility.js'
import { useSettings } from './src/state/settings.js'

const TEST_SETTINGS = {
  region: 'la_general',
  level: 'B1',
  practiceMode: 'specific',
  specificMood: 'indicativo',
  specificTense: 'pretIndef',
  practicePronoun: '3s',
  verbType: 'irregular',
  useVoseo: false,
  useTuteo: true,
  useVosotros: false
}

console.log('🔍 Probando filtro pedagógico para terceras personas irregulares...\n')

// Configurar settings
useSettings.setState(TEST_SETTINGS)

// Construir formas
const allForms = buildFormsForRegion('la_general')

// Obtener 20 verbos
const results = []
for (let i = 0; i < 20; i++) {
  try {
    const next = await chooseNext({ forms: allForms, history: {}, currentItem: null })
    if (next) {
      results.push(next)
    }
  } catch (error) {
    console.log(`❌ Error al obtener forma ${i + 1}: ${error.message}`)
    break
  }
}

if (results.length === 0) {
  console.log('❌ No se obtuvieron resultados. El filtro puede ser demasiado restrictivo.')
} else {
  console.log(`✅ Se obtuvieron ${results.length} resultados`)

  // Obtener verbos únicos
  const uniqueVerbs = [...new Set(results.map(form => form.lemma))]
  console.log(`📝 Verbos únicos encontrados: ${uniqueVerbs.sort().join(', ')}`)

  // Verificar que todos son tercera persona pretérito
  const allThirdPersonPret = results.every(form =>
    form.tense === 'pretIndef' && ['3s', '3p'].includes(form.person)
  )
  console.log(`🎯 Todos son 3ª persona pretérito: ${allThirdPersonPret ? '✅' : '❌'}`)

  // Definir verbos pedagógicamente apropiados vs inapropiados
  const appropriateVerbs = [
    'pedir', 'servir', 'repetir', 'seguir', 'dormir', 'morir', 'leer', 'creer',
    'construir', 'destruir', 'incluir', 'concluir', 'huir', 'contribuir', 'distribuir'
  ]

  const inappropriateVerbs = [
    'ser', 'hacer', 'venir', 'saber', 'querer', 'haber', 'decir', 'tener', 'poder'
  ]

  const foundAppropriate = uniqueVerbs.filter(verb => appropriateVerbs.includes(verb))
  const foundInappropriate = uniqueVerbs.filter(verb => inappropriateVerbs.includes(verb))

  console.log(`\n🟢 Verbos pedagógicamente apropiados: ${foundAppropriate.join(', ') || 'ninguno'}`)
  console.log(`🔴 Verbos inapropiados encontrados: ${foundInappropriate.join(', ') || 'ninguno'}`)

  if (foundInappropriate.length === 0) {
    console.log('\n🎉 ¡ÉXITO! No aparecen verbos inapropiados')
  } else {
    console.log('\n⚠️ PROBLEMA: Aparecen verbos inapropiados que deberían estar filtrados')
  }
}