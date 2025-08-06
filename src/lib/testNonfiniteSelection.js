import { verbs } from '../data/verbs.js'
import { chooseNext } from './generator.js'
import { useSettings } from '../state/settings.js'

export function testNonfiniteSelection() {
  console.log('=== TESTING NONFINITE SELECTION ===')
  
  // Test 1: Check what forms are available for nonfinite
  const allForms = []
  verbs.forEach(verb => {
    verb.paradigms.forEach(paradigm => {
      paradigm.forms.forEach(form => {
        if (form.mood === 'nonfinite') {
          allForms.push({
            lemma: verb.lemma,
            ...form
          })
        }
      })
    })
  })
  
  console.log('📊 Total nonfinite forms available:', allForms.length)
  console.log('📊 Nonfinite forms by tense:')
  const byTense = {}
  allForms.forEach(form => {
    byTense[form.tense] = (byTense[form.tense] || 0) + 1
  })
  console.log(byTense)
  
  // Test 2: Check what happens when we select nonfinite + part
  console.log('\n=== TESTING NONFINITE + PARTICIPIO ===')
  useSettings.setState({
    level: 'C2',
    practiceMode: 'specific',
    specificMood: 'nonfinite',
    specificTense: 'part',
    region: 'la_general',
    useTuteo: true,
    useVoseo: false,
    useVosotros: false,
    practicePronoun: 'both',
    verbType: 'all'
  })
  
  const result1 = chooseNext({ forms: allForms, history: {} })
  console.log('🎯 Result for nonfinite + part:', result1)
  
  // Test 3: Check what happens when we select nonfinite + ger
  console.log('\n=== TESTING NONFINITE + GERUNDIO ===')
  useSettings.setState({
    specificTense: 'ger'
  })
  
  const result2 = chooseNext({ forms: allForms, history: {} })
  console.log('🎯 Result for nonfinite + ger:', result2)
  
  // Test 4: Check what happens with mixed practice
  console.log('\n=== TESTING MIXED PRACTICE ===')
  useSettings.setState({
    practiceMode: 'mixed',
    specificMood: null,
    specificTense: null
  })
  
  const result3 = chooseNext({ forms: allForms, history: {} })
  console.log('🎯 Result for mixed practice:', result3)
  
  return {
    totalNonfiniteForms: allForms.length,
    byTense,
    specificPartResult: result1,
    specificGerResult: result2,
    mixedResult: result3
  }
} 