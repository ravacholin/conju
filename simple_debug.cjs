// Simple debug script to check subjunctive forms in verbs.js
const fs = require('fs')
const path = require('path')

console.log('🔍 DEBUGGING SUBJUNCTIVE FILTERING PROBLEM')
console.log('==========================================')

// Read and parse the verbs.js file content
const verbsPath = path.join(__dirname, 'src/data/verbs.js')
const verbsContent = fs.readFileSync(verbsPath, 'utf8')

// Extract the verbs array (simple regex approach)
const verbsMatch = verbsContent.match(/export const verbs = (\[[\s\S]*?\]);?\s*$/m)
if (!verbsMatch) {
  console.error('❌ Could not extract verbs array from verbs.js')
  process.exit(1)
}

let verbs
try {
  // Use eval to parse the array (not safe in production but OK for debugging)
  eval('verbs = ' + verbsMatch[1])
} catch (error) {
  console.error('❌ Could not parse verbs array:', error.message)
  process.exit(1)
}

console.log(`📊 Loaded ${verbs.length} verbs from verbs.js`)

// Collect all forms
const allForms = []
verbs.forEach(verb => {
  if (verb.paradigms && Array.isArray(verb.paradigms)) {
    verb.paradigms.forEach(paradigm => {
      if (paradigm.forms && Array.isArray(paradigm.forms)) {
        paradigm.forms.forEach(form => {
          allForms.push({
            ...form,
            lemma: verb.lemma,
            type: verb.type
          })
        })
      }
    })
  }
})

console.log(`📊 Total forms collected: ${allForms.length}`)

// Find all subjunctive forms
const subjunctiveForms = allForms.filter(f => f.mood === 'subjunctive')
console.log(`📊 Total subjunctive forms: ${subjunctiveForms.length}`)

// Find subjunctive present forms specifically  
const subjPresentForms = allForms.filter(f => 
  f.mood === 'subjunctive' && f.tense === 'subjPres'
)
console.log(`📊 Subjunctive present forms: ${subjPresentForms.length}`)

if (subjPresentForms.length > 0) {
  console.log(`✅ GOOD: Found subjunctive present forms`)
  console.log('📋 Sample subjunctive present forms:')
  subjPresentForms.slice(0, 15).forEach(f => {
    console.log(`  - ${f.lemma}: "${f.value}" (${f.person})`)
  })
  
  // Group by lemma to see variety
  const lemmas = [...new Set(subjPresentForms.map(f => f.lemma))]
  console.log(`📊 Number of verbs with subjunctive present: ${lemmas.length}`)
  console.log(`📋 Verbs: ${lemmas.slice(0, 10).join(', ')}${lemmas.length > 10 ? '...' : ''}`)
} else {
  console.log(`❌ CRITICAL: No subjunctive present forms found!`)
}

// Also check indicative present for comparison
const indicativePresentForms = allForms.filter(f => 
  f.mood === 'indicative' && f.tense === 'pres'
)
console.log(`📊 Indicative present forms: ${indicativePresentForms.length}`)

if (indicativePresentForms.length > 0) {
  console.log('📋 Sample indicative present forms:')
  indicativePresentForms.slice(0, 10).forEach(f => {
    console.log(`  - ${f.lemma}: "${f.value}" (${f.person})`)
  })
}

// Check if there's a pattern difference
console.log('\n🔍 PATTERN ANALYSIS')
console.log('===================')

const allMoods = [...new Set(allForms.map(f => f.mood))]
const allTenses = [...new Set(allForms.map(f => f.tense))]

console.log('📋 All moods found:', allMoods)
console.log('📋 All tenses found:', allTenses)

// Count forms by mood
const moodCounts = {}
allForms.forEach(f => {
  moodCounts[f.mood] = (moodCounts[f.mood] || 0) + 1
})
console.log('📊 Forms by mood:', moodCounts)

// Count subjunctive forms by tense
const subjTenseCounts = {}
subjunctiveForms.forEach(f => {
  subjTenseCounts[f.tense] = (subjTenseCounts[f.tense] || 0) + 1
})
console.log('📊 Subjunctive forms by tense:', subjTenseCounts)