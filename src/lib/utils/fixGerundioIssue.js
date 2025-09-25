import { verbs } from '../data/verbs.js'
import { useSettings } from '../state/settings.js'

export function fixGerundioIssue() {
  console.log('=== FIXING GERUNDIO ISSUE ===')
  
  // Step 1: Check all forms available
  const allForms = []
  verbs.forEach(verb => {
    verb.paradigms.forEach(paradigm => {
      paradigm.forms.forEach(form => {
        allForms.push({
          lemma: verb.lemma,
          ...form
        })
      })
    })
  })
  
  console.log('📊 Total forms in database:', allForms.length)
  
  // Step 2: Check nonfinite forms specifically
  const nonfiniteForms = allForms.filter(f => f.mood === 'nonfinite')
  const gerundios = nonfiniteForms.filter(f => f.tense === 'ger')
  const participios = nonfiniteForms.filter(f => f.tense === 'part')
  
  console.log('📊 Nonfinite forms:', nonfiniteForms.length)
  console.log('📊 Gerundios:', gerundios.length)
  console.log('📊 Participios:', participios.length)
  
  // Step 3: Set correct settings for gerundio practice
  useSettings.setState({
    level: 'C2', // Use C2 instead of ALL
    practiceMode: 'specific',
    specificMood: 'nonfinite',
    specificTense: 'ger',
    region: 'la_general',
    useTuteo: true,
    useVoseo: false,
    useVosotros: false,
    practicePronoun: 'both',
    verbType: 'all'
  })
  
  console.log('✅ Settings updated for gerundio practice')
  
  // Step 4: Show sample gerundios
  console.log('📊 Sample gerundios:', gerundios.slice(0, 10).map(f => `${f.lemma}: ${f.value}`))
  
  return {
    totalForms: allForms.length,
    nonfiniteForms: nonfiniteForms.length,
    gerundios: gerundios.length,
    participios: participios.length,
    sampleGerundios: gerundios.slice(0, 5).map(f => `${f.lemma}: ${f.value}`)
  }
} 