import { verbs } from '../data/verbs.js'

// Function to clean duplicate verbs
export function cleanDuplicateVerbs() {
  const uniqueVerbs = []
  const seenLemmas = new Set()
  const duplicates = []
  
  verbs.forEach(verb => {
    if (!seenLemmas.has(verb.lemma)) {
      seenLemmas.add(verb.lemma)
      uniqueVerbs.push(verb)
    } else {
      duplicates.push(verb.lemma)
    }
  })
  
  console.log(`Original verbs: ${verbs.length}`)
  console.log(`Unique verbs: ${uniqueVerbs.length}`)
  console.log(`Duplicates removed: ${duplicates.length}`)
  console.log(`Duplicate lemmas: ${[...new Set(duplicates)].join(', ')}`)
  
  return uniqueVerbs
}

// Function to add missing forms to verbs
export function addMissingForms() {
  const updatedVerbs = []
  
  verbs.forEach(verb => {
    const updatedVerb = { ...verb }
    let _UNUSED_hasChanges = false
    
    // Check for missing nonfinite forms
    const hasParticiple = verb.paradigms.some(paradigm => 
      paradigm.forms.some(form => form.mood === 'nonfinite' && form.tense === 'part')
    )
    
    const hasGerund = verb.paradigms.some(paradigm => 
      paradigm.forms.some(form => form.mood === 'nonfinite' && form.tense === 'ger')
    )
    
    if (!hasParticiple || !hasGerund) {
      updatedVerb.paradigms = updatedVerb.paradigms.map(paradigm => {
        const updatedParadigm = { ...paradigm }
        
        if (!hasParticiple) {
          // Generate participle based on verb ending
          let participle = ''
          if (verb.lemma.endsWith('ar')) {
            participle = verb.lemma.replace('ar', 'ado')
          } else if (verb.lemma.endsWith('er')) {
            participle = verb.lemma.replace('er', 'ido')
          } else if (verb.lemma.endsWith('ir')) {
            participle = verb.lemma.replace('ir', 'ido')
          }
          
          if (participle) {
            updatedParadigm.forms.push({
              mood: 'nonfinite',
              tense: 'part',
              person: 'inv',
              value: participle
            })
            hasChanges = true
          }
        }
        
        if (!hasGerund) {
          // Generate gerund based on verb ending
          let gerund = ''
          if (verb.lemma.endsWith('ar')) {
            gerund = verb.lemma.replace('ar', 'ando')
          } else if (verb.lemma.endsWith('er')) {
            gerund = verb.lemma.replace('er', 'iendo')
          } else if (verb.lemma.endsWith('ir')) {
            gerund = verb.lemma.replace('ir', 'iendo')
          }
          
          if (gerund) {
            updatedParadigm.forms.push({
              mood: 'nonfinite',
              tense: 'ger',
              person: 'inv',
              value: gerund
            })
            hasChanges = true
          }
        }
        
        return updatedParadigm
      })
    }
    
    updatedVerbs.push(updatedVerb)
  })
  
  return updatedVerbs
}

// NOTE: validateVerbStructure has been moved to src/lib/core/validators.js
// to avoid duplication. Use that module for verb structure validation. 