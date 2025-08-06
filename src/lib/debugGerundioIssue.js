import { verbs } from '../data/verbs.js'
import { chooseNext } from './generator.js'
import { useSettings } from '../state/settings.js'

export function debugGerundioIssue() {
  console.log('=== DEBUGGING GERUNDIO ISSUE ===')
  
  // Get ALL forms from ALL verbs (like the real generator does)
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
  
  // Check nonfinite forms specifically
  const nonfiniteForms = allForms.filter(f => f.mood === 'nonfinite')
  console.log('📊 Total nonfinite forms:', nonfiniteForms.length)
  
  const gerundios = nonfiniteForms.filter(f => f.tense === 'ger')
  const participios = nonfiniteForms.filter(f => f.tense === 'part')
  const infinitivos = nonfiniteForms.filter(f => f.tense === 'inf' || f.tense === 'infPerf')
  
  console.log('📊 Gerundios:', gerundios.length)
  console.log('📊 Participios:', participios.length)
  console.log('📊 Infinitivos:', infinitivos.length)
  
  // Show sample gerundios
  console.log('📊 Sample gerundios:', gerundios.slice(0, 5).map(f => `${f.lemma}: ${f.value}`))
  
  // Test with specific settings for gerundio
  console.log('\n=== TESTING GERUNDIO SELECTION ===')
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
  
  const result = chooseNext({ forms: allForms, history: {} })
  console.log('🎯 Result for gerundio selection:', result)
  
  // Check what forms are eligible after filtering
  console.log('\n=== CHECKING ELIGIBLE FORMS ===')
  const { 
    level, useVoseo, useTuteo, useVosotros,
    practiceMode, specificMood, specificTense, practicePronoun, verbType
  } = useSettings.getState()
  
  let eligible = allForms.filter(f => {
    console.log(`\n--- Checking form: ${f.lemma} ${f.mood} ${f.tense} ${f.person} ---`)
    
    // Level filtering
    const gate = gates.find(g => g.mood===f.mood && g.tense===f.tense && levelOrder(g.level) <= levelOrder(level))
    if(!gate) {
      console.log(`❌ Form ${f.lemma} ${f.mood} ${f.tense} filtered out by level gate`)
      return false
    }
    console.log(`✅ Level gate passed`)
    
    // Specific practice filtering
    if(practiceMode === 'specific') {
      if(specificMood && f.mood !== specificMood) {
        console.log(`❌ Form ${f.lemma} ${f.mood} filtered out by specific mood ${specificMood}`)
        return false
      }
      if(specificTense && f.tense !== specificTense) {
        console.log(`❌ Form ${f.lemma} ${f.tense} filtered out by specific tense ${specificTense}`)
        return false
      }
    }
    
    // Filter out infinitivos
    if(f.mood === 'nonfinite' && (f.tense === 'inf' || f.tense === 'infPerf')) {
      console.log(`❌ Form ${f.lemma} ${f.tense} filtered out - infinitivos are not for practice`)
      return false
    }
    
    console.log(`✅ Form ${f.lemma} ${f.mood} ${f.tense} ${f.person} PASSED all filters`)
    return true
  })
  
  console.log('📊 Eligible forms after filtering:', eligible.length)
  console.log('📊 Eligible gerundios:', eligible.filter(f => f.mood === 'nonfinite' && f.tense === 'ger').length)
  
  // Show all eligible gerundios
  const eligibleGerundios = eligible.filter(f => f.mood === 'nonfinite' && f.tense === 'ger')
  console.log('📊 All eligible gerundios:', eligibleGerundios.map(f => `${f.lemma}: ${f.value}`))
  
  return {
    totalForms: allForms.length,
    nonfiniteForms: nonfiniteForms.length,
    gerundios: gerundios.length,
    participios: participios.length,
    eligibleForms: eligible.length,
    eligibleGerundios: eligibleGerundios.length,
    result
  }
}

// Helper functions (copied from generator.js)
import gates from '../data/curriculum.json'

function levelOrder(L){ 
  return ['A1','A2','B1','B2','C1','C2'].indexOf(L) 
} 