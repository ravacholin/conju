import { verbs } from '../data/verbs.js'

// Function to clean duplicate verbs
export function cleanDuplicateVerbs() {
  const uniqueVerbs = []
  const seenLemmas = new Set()
  
  verbs.forEach(verb => {
    if (!seenLemmas.has(verb.lemma)) {
      seenLemmas.add(verb.lemma)
      uniqueVerbs.push(verb)
    }
  })
  
  console.log(`Original verbs: ${verbs.length}`)
  console.log(`Unique verbs: ${uniqueVerbs.length}`)
  console.log(`Duplicates removed: ${verbs.length - uniqueVerbs.length}`)
  
  return uniqueVerbs
}

// Function to count verbs with participles and gerunds
export function countNonfiniteVerbs() {
  const verbsWithParticiples = new Set()
  const verbsWithGerunds = new Set()
  
  verbs.forEach(verb => {
    verb.paradigms.forEach(paradigm => {
      paradigm.forms.forEach(form => {
        if (form.mood === 'nonfinite') {
          if (form.tense === 'part') {
            verbsWithParticiples.add(verb.lemma)
          }
          if (form.tense === 'ger') {
            verbsWithGerunds.add(verb.lemma)
          }
        }
      })
    })
  })
  
  console.log(`Verbs with participles: ${verbsWithParticiples.size}`)
  console.log(`Verbs with gerunds: ${verbsWithGerunds.size}`)
  
  return {
    participles: Array.from(verbsWithParticiples),
    gerunds: Array.from(verbsWithGerunds)
  }
}

// Function to add missing nonfinite forms to verbs that don't have them
export function addMissingNonfiniteForms() {
  const updatedVerbs = []
  
  verbs.forEach(verb => {
    const hasParticiple = verb.paradigms.some(paradigm => 
      paradigm.forms.some(form => form.mood === 'nonfinite' && form.tense === 'part')
    )
    
    const hasGerund = verb.paradigms.some(paradigm => 
      paradigm.forms.some(form => form.mood === 'nonfinite' && form.tense === 'ger')
    )
    
    if (!hasParticiple || !hasGerund) {
      // Add missing forms based on verb type
      const updatedVerb = { ...verb }
      
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
          updatedVerb.paradigms.forEach(paradigm => {
            paradigm.forms.push({
              mood: 'nonfinite',
              tense: 'part',
              person: 'inv',
              value: participle
            })
          })
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
          updatedVerb.paradigms.forEach(paradigm => {
            paradigm.forms.push({
              mood: 'nonfinite',
              tense: 'ger',
              person: 'inv',
              value: gerund
            })
          })
        }
      }
      
      updatedVerbs.push(updatedVerb)
    } else {
      updatedVerbs.push(verb)
    }
  })
  
  return updatedVerbs
} 