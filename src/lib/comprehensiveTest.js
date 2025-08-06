import { verbs } from '../data/verbs.js'
import gates from '../data/curriculum.json'

// Comprehensive verb availability test
export function comprehensiveVerbTest() {
  console.log('=== COMPREHENSIVE VERB AVAILABILITY TEST ===')
  
  // Get all unique verbs
  const uniqueVerbs = new Set()
  const verbTypes = new Map() // lemma -> type
  const verbRegions = new Map() // lemma -> regions
  
  verbs.forEach(verb => {
    uniqueVerbs.add(verb.lemma)
    verbTypes.set(verb.lemma, verb.type)
    
    const regions = new Set()
    verb.paradigms.forEach(paradigm => {
      paradigm.regionTags.forEach(region => regions.add(region))
    })
    verbRegions.set(verb.lemma, Array.from(regions))
  })
  
  console.log(`Total unique verbs: ${uniqueVerbs.size}`)
  
  // Count verb types
  const regularVerbs = Array.from(uniqueVerbs).filter(lemma => verbTypes.get(lemma) === 'regular')
  const irregularVerbs = Array.from(uniqueVerbs).filter(lemma => verbTypes.get(lemma) === 'irregular')
  
  console.log(`Regular verbs: ${regularVerbs.length}`)
  console.log(`Irregular verbs: ${irregularVerbs.length}`)
  
  // Test each mood/tense combination
  const moods = ['indicative', 'subjunctive', 'imperative', 'conditional', 'nonfinite']
  const tenses = ['pres', 'pretIndef', 'impf', 'fut', 'pretPerf', 'plusc', 'futPerf', 'subjPres', 'subjImpf', 'subjPerf', 'subjPlusc', 'impAff', 'impNeg', 'cond', 'condPerf', 'part', 'ger']
  
  const results = {}
  const issues = []
  
  moods.forEach(mood => {
    tenses.forEach(tense => {
      const key = `${mood}_${tense}`
      const availableForms = []
      
      verbs.forEach(verb => {
        verb.paradigms.forEach(paradigm => {
          paradigm.forms.forEach(form => {
            if (form.mood === mood && form.tense === tense) {
              availableForms.push({
                lemma: verb.lemma,
                person: form.person,
                value: form.value,
                type: verb.type
              })
            }
          })
        })
      })
      
      const uniqueVerbsForThisForm = [...new Set(availableForms.map(f => f.lemma))]
      const regularCount = uniqueVerbsForThisForm.filter(lemma => verbTypes.get(lemma) === 'regular').length
      const irregularCount = uniqueVerbsForThisForm.filter(lemma => verbTypes.get(lemma) === 'irregular').length
      
      results[key] = {
        totalForms: availableForms.length,
        uniqueVerbs: uniqueVerbsForThisForm.length,
        regularVerbs: regularCount,
        irregularVerbs: irregularCount,
        forms: availableForms
      }
      
      // Check if we have enough verbs (minimum 10 for basic forms, 5 for advanced)
      const isBasicForm = ['pres', 'pretIndef', 'impf', 'fut', 'impAff'].includes(tense)
      const minimumRequired = isBasicForm ? 10 : 5
      
      if (uniqueVerbsForThisForm.length < minimumRequired) {
        issues.push({
          type: 'insufficient_verbs',
          mood,
          tense,
          available: uniqueVerbsForThisForm.length,
          required: minimumRequired,
          verbs: uniqueVerbsForThisForm
        })
      }
      
      // Check for forms with no verbs at all
      if (uniqueVerbsForThisForm.length === 0) {
        issues.push({
          type: 'no_verbs',
          mood,
          tense
        })
      }
    })
  })
  
  // Check curriculum coverage
  console.log('\n=== CURRICULUM COVERAGE ===')
  const curriculumIssues = []
  
  gates.forEach(gate => {
    const key = `${gate.mood}_${gate.tense}`
    const result = results[key]
    
    if (!result) {
      curriculumIssues.push({
        type: 'curriculum_without_verbs',
        level: gate.level,
        mood: gate.mood,
        tense: gate.tense
      })
    } else if (result.uniqueVerbs < 5) {
      curriculumIssues.push({
        type: 'curriculum_insufficient_verbs',
        level: gate.level,
        mood: gate.mood,
        tense: gate.tense,
        available: result.uniqueVerbs,
        required: 5
      })
    }
  })
  
  // Check for duplicate verbs
  const duplicateIssues = []
  const seenLemmas = new Set()
  const duplicates = []
  
  verbs.forEach(verb => {
    if (seenLemmas.has(verb.lemma)) {
      duplicates.push(verb.lemma)
    } else {
      seenLemmas.add(verb.lemma)
    }
  })
  
  if (duplicates.length > 0) {
    duplicateIssues.push({
      type: 'duplicate_verbs',
      duplicates: [...new Set(duplicates)]
    })
  }
  
  // Check for verbs with missing forms
  const missingFormsIssues = []
  verbs.forEach(verb => {
    const hasIndicative = verb.paradigms.some(p => p.forms.some(f => f.mood === 'indicative'))
    const hasSubjunctive = verb.paradigms.some(p => p.forms.some(f => f.mood === 'subjunctive'))
    const hasImperative = verb.paradigms.some(p => p.forms.some(f => f.mood === 'imperative'))
    const hasNonfinite = verb.paradigms.some(p => p.forms.some(f => f.mood === 'nonfinite'))
    
    if (!hasIndicative || !hasSubjunctive || !hasImperative || !hasNonfinite) {
      missingFormsIssues.push({
        verb: verb.lemma,
        missing: {
          indicative: !hasIndicative,
          subjunctive: !hasSubjunctive,
          imperative: !hasImperative,
          nonfinite: !hasNonfinite
        }
      })
    }
  })
  
  // Print results
  console.log('\n=== SUMMARY ===')
  console.log(`Total unique verbs: ${uniqueVerbs.size}`)
  console.log(`Regular verbs: ${regularVerbs.length}`)
  console.log(`Irregular verbs: ${irregularVerbs.length}`)
  
  console.log('\n=== ISSUES FOUND ===')
  if (issues.length === 0 && curriculumIssues.length === 0 && duplicateIssues.length === 0 && missingFormsIssues.length === 0) {
    console.log('✅ No issues found! All categories have sufficient verbs.')
  } else {
    if (issues.length > 0) {
      console.log(`❌ ${issues.length} forms with insufficient verbs:`)
      issues.forEach(issue => {
        console.log(`  - ${issue.mood} ${issue.tense}: ${issue.available} verbs (need ${issue.required})`)
      })
    }
    
    if (curriculumIssues.length > 0) {
      console.log(`❌ ${curriculumIssues.length} curriculum issues:`)
      curriculumIssues.forEach(issue => {
        console.log(`  - ${issue.level} ${issue.mood} ${issue.tense}: ${issue.available || 0} verbs`)
      })
    }
    
    if (duplicateIssues.length > 0) {
      console.log(`❌ ${duplicateIssues.length} duplicate verb issues:`)
      duplicateIssues.forEach(issue => {
        console.log(`  - Duplicates: ${issue.duplicates.join(', ')}`)
      })
    }
    
    if (missingFormsIssues.length > 0) {
      console.log(`❌ ${missingFormsIssues.length} verbs with missing forms:`)
      missingFormsIssues.slice(0, 10).forEach(issue => {
        console.log(`  - ${issue.verb}: missing ${Object.keys(issue.missing).filter(k => issue.missing[k]).join(', ')}`)
      })
    }
  }
  
  // Show best and worst categories
  const sortedResults = Object.entries(results).sort((a, b) => b[1].uniqueVerbs - a[1].uniqueVerbs)
  
  console.log('\n=== TOP 5 CATEGORIES (most verbs) ===')
  sortedResults.slice(0, 5).forEach(([key, result]) => {
    console.log(`  ${key}: ${result.uniqueVerbs} verbs`)
  })
  
  console.log('\n=== BOTTOM 5 CATEGORIES (least verbs) ===')
  sortedResults.slice(-5).forEach(([key, result]) => {
    console.log(`  ${key}: ${result.uniqueVerbs} verbs`)
  })
  
  return {
    totalVerbs: uniqueVerbs.size,
    regularVerbs: regularVerbs.length,
    irregularVerbs: irregularVerbs.length,
    issues,
    curriculumIssues,
    duplicateIssues,
    missingFormsIssues,
    results
  }
}

// Test specific categories
export function testSpecificCategories() {
  console.log('\n=== TESTING SPECIFIC CATEGORIES ===')
  
  const categories = [
    { mood: 'indicative', tense: 'pres', name: 'Present Indicative' },
    { mood: 'indicative', tense: 'pretIndef', name: 'Preterite Indicative' },
    { mood: 'indicative', tense: 'impf', name: 'Imperfect Indicative' },
    { mood: 'indicative', tense: 'fut', name: 'Future Indicative' },
    { mood: 'subjunctive', tense: 'subjPres', name: 'Present Subjunctive' },
    { mood: 'subjunctive', tense: 'subjImpf', name: 'Imperfect Subjunctive' },
    { mood: 'imperative', tense: 'impAff', name: 'Affirmative Imperative' },
    { mood: 'imperative', tense: 'impNeg', name: 'Negative Imperative' },
    { mood: 'conditional', tense: 'cond', name: 'Conditional' },
    { mood: 'nonfinite', tense: 'part', name: 'Participle' },
    { mood: 'nonfinite', tense: 'ger', name: 'Gerund' }
  ]
  
  categories.forEach(category => {
    const forms = []
    verbs.forEach(verb => {
      verb.paradigms.forEach(paradigm => {
        paradigm.forms.forEach(form => {
          if (form.mood === category.mood && form.tense === category.tense) {
            forms.push({
              lemma: verb.lemma,
              person: form.person,
              value: form.value,
              type: verb.type
            })
          }
        })
      })
    })
    
    const uniqueVerbs = [...new Set(forms.map(f => f.lemma))]
    console.log(`${category.name}: ${uniqueVerbs.length} verbs`)
    
    if (uniqueVerbs.length < 10) {
      console.log(`  ⚠️  Warning: Only ${uniqueVerbs.length} verbs available`)
      console.log(`  Sample verbs: ${uniqueVerbs.slice(0, 5).join(', ')}`)
    }
  })
} 