import { verbs } from '../data/verbs.js'

// Test function to verify nonfinite verb availability
export function testNonfiniteVerbs() {
  console.log('=== TESTING NONFINITE VERBS ===')
  
  const verbsWithParticiples = new Set()
  const verbsWithGerunds = new Set()
  const uniqueVerbs = new Set()
  
  verbs.forEach(verb => {
    uniqueVerbs.add(verb.lemma)
    
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
  
  console.log(`Total unique verbs: ${uniqueVerbs.size}`)
  console.log(`Verbs with participles: ${verbsWithParticiples.size}`)
  console.log(`Verbs with gerunds: ${verbsWithGerunds.size}`)
  
  // List all verbs with participles
  console.log('\nVerbs with participles:')
  Array.from(verbsWithParticiples).sort().forEach(verb => {
    console.log(`- ${verb}`)
  })
  
  // List all verbs with gerunds
  console.log('\nVerbs with gerunds:')
  Array.from(verbsWithGerunds).sort().forEach(verb => {
    console.log(`- ${verb}`)
  })
  
  // Check if we have enough
  if (verbsWithParticiples.size >= 40) {
    console.log('\n✅ SUCCESS: We have enough verbs with participles!')
  } else {
    console.log(`\n❌ WARNING: Only ${verbsWithParticiples.size} verbs with participles (need 40)`)
  }
  
  if (verbsWithGerunds.size >= 40) {
    console.log('✅ SUCCESS: We have enough verbs with gerunds!')
  } else {
    console.log(`❌ WARNING: Only ${verbsWithGerunds.size} verbs with gerunds (need 40)`)
  }
  
  return {
    totalVerbs: uniqueVerbs.size,
    participles: verbsWithParticiples.size,
    gerunds: verbsWithGerunds.size,
    participleVerbs: Array.from(verbsWithParticiples),
    gerundVerbs: Array.from(verbsWithGerunds)
  }
}

// Run the test
if (typeof window !== 'undefined') {
  // Browser environment
  window.testNonfiniteVerbs = testNonfiniteVerbs
} else {
  // Node.js environment
  testNonfiniteVerbs()
} 