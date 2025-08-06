import { verbs } from '../data/verbs.js'
import { chooseNext } from './generator.js'
import { useSettings } from '../state/settings.js'

export function testGerundioDirect() {
  console.log('=== DIRECT GERUNDIO TEST ===')
  
  // Get all forms
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
  
  // Set specific settings for gerundio
  useSettings.setState({
    level: 'C2',
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
  
  console.log('🎯 Testing gerundio selection with C2 level...')
  const result = chooseNext({ forms: allForms, history: {} })
  
  if (result) {
    console.log('✅ SUCCESS! Found gerundio:', result)
    console.log('✅ Verb:', result.lemma)
    console.log('✅ Form:', result.value)
    console.log('✅ Mood:', result.mood)
    console.log('✅ Tense:', result.tense)
  } else {
    console.log('❌ FAILED! No gerundio found')
  }
  
  return result
} 