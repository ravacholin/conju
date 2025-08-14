import { verbs } from '../data/verbs.js'

// Function to remove infinitivo forms from verbs
export function removeInfinitivos() {
  console.log('=== REMOVING INFINITIVOS ===')
  
  const updatedVerbs = verbs.map(verb => {
    const updatedVerb = { ...verb }
    
    updatedVerb.paradigms = updatedVerb.paradigms.map(paradigm => {
      const updatedParadigm = { ...paradigm }
      
      // Remove infinitivo forms (inf and infPerf)
      updatedParadigm.forms = paradigm.forms.filter(form => 
        !(form.mood === 'nonfinite' && (form.tense === 'inf' || form.tense === 'infPerf'))
      )
      
      return updatedParadigm
    })
    
    return updatedVerb
  })
  
  // Count removed forms
  let removedCount = 0
  verbs.forEach(verb => {
    verb.paradigms.forEach(paradigm => {
      paradigm.forms.forEach(form => {
        if (form.mood === 'nonfinite' && (form.tense === 'inf' || form.tense === 'infPerf')) {
          removedCount++
        }
      })
    })
  })
  
  console.log(`Removed ${removedCount} infinitivo forms`)
  
  return updatedVerbs
}

// Function to verify infinitivos are removed
export function verifyInfinitivosRemoved() {
  console.log('=== VERIFYING INFINITIVOS REMOVAL ===')
  
  let remainingInfinitivos = 0
  
  verbs.forEach(verb => {
    verb.paradigms.forEach(paradigm => {
      paradigm.forms.forEach(form => {
        if (form.mood === 'nonfinite' && (form.tense === 'inf' || form.tense === 'infPerf')) {
          remainingInfinitivos++
          console.log(`Found remaining infinitivo: ${verb.lemma} - ${form.tense}`)
        }
      })
    })
  })
  
  if (remainingInfinitivos === 0) {
    console.log('✅ All infinitivos successfully removed')
  } else {
    console.log(`❌ ${remainingInfinitivos} infinitivos still remain`)
  }
  
  return remainingInfinitivos === 0
} 