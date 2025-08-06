import gates from '../data/curriculum.json'
import { useSettings } from '../state/settings.js'
import { verbs } from '../data/verbs.js'

// MCER Level verb type restrictions
const levelVerbRestrictions = {
  'A1': { regular: true, irregular: true },
  'A2': { regular: true, irregular: true },
  'B1': { regular: true, irregular: true },
  'B2': { regular: true, irregular: true },
  'C1': { regular: false, irregular: true }, // Only irregular verbs for C1
  'C2': { regular: true, irregular: true },
  'ALL': { regular: true, irregular: true } // Allow all verb types for ALL level
}

function isVerbTypeAllowedForLevel(verbType, level) {
  const restrictions = levelVerbRestrictions[level]
  if (!restrictions) return true // Default to allowing all if level not found
  return restrictions[verbType] || false
}

export function chooseNext({forms, history}){
  const { 
    level, useVoseo, useTuteo, useVosotros,
    practiceMode, specificMood, specificTense, practicePronoun, verbType
  } = useSettings.getState()
  
  console.log('=== GENERATOR DEBUG ===')
  console.log('Settings:', { level, useVoseo, useTuteo, useVosotros, practiceMode, specificMood, specificTense, practicePronoun, verbType })
  console.log('Total forms available:', forms.length)
  console.log('🔍 PRACTICE PRONOUN SETTING:', practicePronoun)
  console.log('🔍 DIALECT SETTINGS:', { useVoseo, useTuteo, useVosotros })
  console.log('🔍 PRACTICE MODE:', practiceMode)
  console.log('🔍 SPECIFIC MOOD/TENSE:', { specificMood, specificTense })
  
  // Debug: Show sample forms
  console.log('🔍 Sample forms:', forms.slice(0, 5).map(f => `${f.lemma} ${f.mood} ${f.tense} ${f.person}`))
  
  // Debug: Count nonfinite forms
  const nonfiniteForms = forms.filter(f => f.mood === 'nonfinite')
  console.log('🔍 Nonfinite forms count:', nonfiniteForms.length)
  console.log('🔍 Gerundios count:', nonfiniteForms.filter(f => f.tense === 'ger').length)
  console.log('🔍 Participios count:', nonfiniteForms.filter(f => f.tense === 'part').length)
  
  let eligible = forms.filter(f=>{
    console.log(`\n--- Checking form: ${f.lemma} ${f.mood} ${f.tense} ${f.person} ---`)
    
    // Level filtering
    const gate = gates.find(g => g.mood===f.mood && g.tense===f.tense && levelOrder(g.level) <= levelOrder(level))
    if(!gate) {
      console.log(`❌ Form ${f.lemma} ${f.mood} ${f.tense} filtered out by level gate`)
      return false
    }
    console.log(`✅ Level gate passed`)
    
    // Person filtering (dialect) - exclude forms not used in the selected dialect
    console.log(`🔍 DIALECT FILTERING: ${f.person} - useVoseo=${useVoseo}, useTuteo=${useTuteo}, useVosotros=${useVosotros}`)
    
    // For nonfinite forms (gerundios, participios), skip person filtering - they're invariable
    if (f.mood === 'nonfinite') {
      console.log(`✅ Form ${f.lemma} ${f.person} included - nonfinite forms are invariable`)
    } else if (practiceMode === 'specific' && specificMood && specificTense) {
      // For specific practice, show ALL persons but respect dialect
      if (useVoseo && !useTuteo) {
        // Rioplatense: show ALL persons but replace tú with vos, exclude vosotros
        if (f.person === '2s_tu') {
          console.log(`❌ Form ${f.lemma} ${f.person} filtered out - rioplatense uses vos instead of tú`)
          return false
        }
        if (f.person === '2p_vosotros') {
          console.log(`❌ Form ${f.lemma} ${f.person} filtered out - rioplatense doesn't use vosotros`)
          return false
        }
        // Show ALL other persons: 1s, 2s_vos, 3s, 1p, 3p
        console.log(`✅ Form ${f.lemma} ${f.person} included for rioplatense specific practice`)
      } else if (useTuteo && !useVoseo) {
        // General Latin American: show ALL persons but replace vos with tú, exclude vosotros
        if (f.person === '2s_vos') {
          console.log(`❌ Form ${f.lemma} ${f.person} filtered out - general LA uses tú instead of vos`)
          return false
        }
        if (f.person === '2p_vosotros') {
          console.log(`❌ Form ${f.lemma} ${f.person} filtered out - general LA doesn't use vosotros`)
          return false
        }
        // Show ALL other persons: 1s, 2s_tu, 3s, 1p, 3p
        console.log(`✅ Form ${f.lemma} ${f.person} included for general LA specific practice`)
      } else if (useVosotros) {
        // Peninsular: show ALL persons but replace vos with tú
        if (f.person === '2s_vos') {
          console.log(`❌ Form ${f.lemma} ${f.person} filtered out - peninsular uses tú instead of vos`)
          return false
        }
        // Show ALL other persons: 1s, 2s_tu, 3s, 1p, 2p_vosotros, 3p
        console.log(`✅ Form ${f.lemma} ${f.person} included for peninsular specific practice`)
      } else {
        // Both forms: show ALL persons
        console.log(`✅ Form ${f.lemma} ${f.person} included for both forms specific practice`)
      }
    } else {
      // For mixed practice, apply normal dialect filtering
      if(f.person==='2s_vos' && !useVoseo) {
        console.log(`❌ Form ${f.lemma} ${f.person} filtered out by voseo setting`)
        return false
      }
      if(f.person==='2s_tu' && !useTuteo) {
        console.log(`❌ Form ${f.lemma} ${f.person} filtered out by tuteo setting`)
        return false
      }
      if(f.person==='2p_vosotros' && !useVosotros) {
        console.log(`❌ Form ${f.lemma} ${f.person} filtered out by vosotros setting`)
        return false
      }
      console.log(`✅ Dialect filtering passed`)
    }
    
    // Pronoun practice filtering - be less restrictive for specific practice
    console.log(`🔍 Checking pronoun filtering for ${f.person}, practicePronoun: ${practicePronoun}`)
    if (practiceMode === 'specific' && specificMood && specificTense) {
      // For specific practice, show ALL persons of the selected form
      // Don't filter by practicePronoun at all - show variety
      console.log(`✅ Form ${f.lemma} ${f.person} included for specific practice (pronoun filtering bypassed)`)
    } else {
      // For mixed practice, apply normal pronoun filtering
      if (practicePronoun === 'tu_only') {
        if (f.person !== '2s_tu') {
          console.log(`❌ Form ${f.lemma} ${f.person} filtered out by tu_only setting`)
          return false
        }
      } else if (practicePronoun === 'vos_only') {
        if (f.person !== '2s_vos') {
          console.log(`❌ Form ${f.lemma} ${f.person} filtered out by vos_only setting`)
          return false
        }
      }
      console.log(`✅ Pronoun filtering passed`)
    }
    
    // Verb type filtering - check both user selection and MCER level restrictions
    const verb = findVerbByLemma(f.lemma)
    if (!verb) {
      console.log(`❌ Form ${f.lemma} filtered out - verb not found in database`)
      return false
    }
    console.log(`🔍 Verb type check: ${f.lemma} is ${verb.type}, verbType setting: ${verbType}`)
    
    // For nonfinite forms, be more permissive with verb type filtering
    if (f.mood === 'nonfinite') {
      console.log(`✅ Form ${f.lemma} ${f.type} included - nonfinite forms are more permissive`)
    } else {
      // Check MCER level restrictions first
      if (!isVerbTypeAllowedForLevel(verb.type, level)) {
        console.log(`❌ Form ${f.lemma} filtered out - ${verb.type} verbs not allowed for level ${level}`)
        return false
      }
      
      // Then check user's verb type preference
      if (verbType === 'regular') {
        if (verb.type !== 'regular') {
          console.log(`❌ Form ${f.lemma} filtered out - verb type is ${verb.type}, not regular`)
          return false
        }
      } else if (verbType === 'irregular') {
        if (verb.type !== 'irregular') {
          console.log(`❌ Form ${f.lemma} filtered out - verb type is ${verb.type}, not irregular`)
          return false
        }
      }
    }
    // If verbType is 'all', we only check MCER restrictions (already done above)
    
    // Specific practice filtering
    console.log(`🔍 Specific practice check: mood=${f.mood} vs ${specificMood}, tense=${f.tense} vs ${specificTense}`)
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
    
    // Filter out infinitivos from practice (they're not conjugated forms)
    if(f.mood === 'nonfinite' && (f.tense === 'inf' || f.tense === 'infPerf')) {
      console.log(`❌ Form ${f.lemma} ${f.tense} filtered out - infinitivos are not for practice`)
      return false
    }
    
    console.log(`✅ Form ${f.lemma} ${f.mood} ${f.tense} ${f.person} PASSED all filters`)
    return true
  })
  
  // Debug logging
  console.log('Filtering results:', {
    totalForms: forms.length,
    eligibleForms: eligible.length,
    verbType,
    practiceMode,
    specificMood,
    specificTense,
    practicePronoun,
    levelRestrictions: levelVerbRestrictions[level]
  })
  
  // Show which persons were included
  const includedPersons = [...new Set(eligible.map(f => f.person))]
  console.log('🎯 INCLUDED PERSONS:', includedPersons)
  console.log('🎯 SAMPLE FORMS:', eligible.slice(0, 5).map(f => `${f.lemma} ${f.person}`))
  console.log('🎯 TOTAL ELIGIBLE FORMS:', eligible.length)
  console.log('🎯 ALL PERSONS IN ELIGIBLE:', eligible.map(f => f.person))
  
  // Check if we have any eligible forms
  if (eligible.length === 0) {
    console.log('❌ No eligible forms found with current filters')
    console.log('Available forms sample:', forms.slice(0, 5).map(f => `${f.lemma} ${f.mood} ${f.tense} ${f.person}`))
    
    // Call debug function to show what's available
    debugVerbAvailability()
    
    return null
  }
  
  // Apply weighted selection for "all" verb types to balance regular vs irregular
  if (verbType === 'all') {
    eligible = applyWeightedSelection(eligible)
  }
  
  // Sort by accuracy (lowest first)
  eligible.sort((a,b)=> (acc(a,history) - acc(b,history)))
  
  // Find the lowest accuracy score
  const lowestAcc = acc(eligible[0], history)
  
  // Get all forms with the same lowest accuracy (to add randomness among equals)
  const candidates = eligible.filter(f => acc(f, history) === lowestAcc)
  
  console.log('🎯 ACCURACY DEBUG:')
  console.log('🎯 Lowest accuracy:', lowestAcc)
  console.log('🎯 Candidates with lowest accuracy:', candidates.length)
  console.log('🎯 Sample candidates:', candidates.slice(0, 5).map(f => `${f.lemma} ${f.person} (acc: ${acc(f, history)})`))
  console.log('🎯 All candidates persons:', [...new Set(candidates.map(f => f.person))])
  
  // Balance selection by person to ensure variety
  const personsInCandidates = [...new Set(candidates.map(f => f.person))]
  console.log('🎯 Persons in candidates:', personsInCandidates)
  
  // Group candidates by person
  const candidatesByPerson = {}
  personsInCandidates.forEach(person => {
    candidatesByPerson[person] = candidates.filter(f => f.person === person)
  })
  
  console.log('🎯 Candidates by person:', Object.fromEntries(
    Object.entries(candidatesByPerson).map(([person, forms]) => [person, forms.length])
  ))
  
  // Select a random person first, then a random form from that person
  const randomPerson = personsInCandidates[Math.floor(Math.random() * personsInCandidates.length)]
  const formsForPerson = candidatesByPerson[randomPerson]
  const selectedForm = formsForPerson[Math.floor(Math.random() * formsForPerson.length)]
  
  console.log('🎯 Selected person:', randomPerson)
  console.log('🎯 Forms available for selected person:', formsForPerson.length)
  
  console.log('✅ Selected form:', selectedForm)
  console.log('=== END GENERATOR DEBUG ===')
  
  return selectedForm
}

// Apply weighted selection to balance regular vs irregular verbs
function applyWeightedSelection(forms) {
  // Group forms by verb type
  const regularForms = []
  const irregularForms = []
  
  forms.forEach(form => {
    const verb = findVerbByLemma(form.lemma)
    if (verb) {
      if (verb.type === 'regular') {
        regularForms.push(form)
      } else if (verb.type === 'irregular') {
        irregularForms.push(form)
      }
    }
  })
  
  console.log('Verb distribution before weighting:', {
    regular: regularForms.length,
    irregular: irregularForms.length,
    total: forms.length
  })
  
  // Calculate target distribution: 30% regular, 70% irregular
  const targetRegularRatio = 0.3
  const targetIrregularRatio = 0.7
  
  // Calculate how many forms we should select from each type
  const totalForms = forms.length
  const targetRegularCount = Math.floor(totalForms * targetRegularRatio)
  const targetIrregularCount = totalForms - targetRegularCount
  
  // Randomly sample from each group to achieve the target distribution
  const selectedForms = []
  
  // Add regular forms (reduced frequency)
  if (regularForms.length > 0) {
    const regularSample = sampleArray(regularForms, Math.min(targetRegularCount, regularForms.length))
    selectedForms.push(...regularSample)
  }
  
  // Add irregular forms (increased frequency)
  if (irregularForms.length > 0) {
    const irregularSample = sampleArray(irregularForms, Math.min(targetIrregularCount, irregularForms.length))
    selectedForms.push(...irregularSample)
  }
  
  // If we don't have enough forms from one type, fill with the other
  if (selectedForms.length < totalForms) {
    const remainingForms = forms.filter(f => !selectedForms.includes(f))
    selectedForms.push(...sampleArray(remainingForms, totalForms - selectedForms.length))
  }
  
  console.log('Verb distribution after weighting:', {
    regular: selectedForms.filter(f => {
      const verb = findVerbByLemma(f.lemma)
      return verb && verb.type === 'regular'
    }).length,
    irregular: selectedForms.filter(f => {
      const verb = findVerbByLemma(f.lemma)
      return verb && verb.type === 'irregular'
    }).length,
    total: selectedForms.length
  })
  
  return selectedForms
}

// Helper function to randomly sample from an array
function sampleArray(array, count) {
  const shuffled = [...array].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

// Helper function to find a verb by its lemma
function findVerbByLemma(lemma) {
  return verbs.find(v => v.lemma === lemma)
}

// Debug function to show available verbs for each combination
export function debugVerbAvailability() {
  console.log('=== VERB AVAILABILITY DEBUG ===')
  
  const moods = ['indicative', 'subjunctive', 'imperative', 'conditional']
  const tenses = ['pres', 'pretIndef', 'impf', 'fut', 'pretPerf', 'plusc', 'futPerf', 'subjPres', 'subjImpf', 'subjPerf', 'subjPlusc', 'impAff', 'impNeg', 'cond', 'condPerf']
  const verbTypes = ['regular', 'irregular', 'all']
  
  // Flatten all forms from all verbs
  const allForms = []
  verbs.forEach(verb => {
    verb.paradigms.forEach(paradigm => {
      paradigm.forms.forEach(form => {
        allForms.push({
          ...form,
          lemma: verb.lemma,
          type: verb.type
        })
      })
    })
  })
  
  console.log('Total forms in database:', allForms.length)
  console.log('Total verbs in database:', verbs.length)
  
  // Check each combination
  moods.forEach(mood => {
    tenses.forEach(tense => {
      verbTypes.forEach(verbType => {
        const filtered = allForms.filter(form => {
          if (form.mood !== mood) return false
          if (form.tense !== tense) return false
          if (verbType === 'regular' && form.type !== 'regular') return false
          if (verbType === 'irregular' && form.type !== 'irregular') return false
          return true
        })
        
        if (filtered.length > 0) {
          const uniqueVerbs = [...new Set(filtered.map(f => f.lemma))]
          console.log(`${mood} ${tense} ${verbType}: ${filtered.length} forms, ${uniqueVerbs.length} verbs (${uniqueVerbs.slice(0, 5).join(', ')}${uniqueVerbs.length > 5 ? '...' : ''})`)
        } else {
          console.log(`${mood} ${tense} ${verbType}: ❌ NO VERBS AVAILABLE`)
        }
      })
    })
  })
  
  console.log('=== END VERB AVAILABILITY DEBUG ===')
}

// Helper function to determine if a verb is irregular (fallback)
function isIrregularVerb(lemma) {
  const irregularVerbs = [
    'ser', 'estar', 'tener', 'hacer', 'ir', 'venir', 'decir', 'dar', 'ver', 'saber',
    'poder', 'querer', 'poner', 'salir', 'traer', 'caer', 'oir', 'valer', 'caber',
    'haber', 'satisfacer', 'hacer', 'deshacer', 'rehacer', 'contrahacer'
  ]
  return irregularVerbs.includes(lemma)
}

function acc(f, history){
  const k = key(f); const h = history[k]||{seen:0, correct:0}
  return (h.correct + 1) / (h.seen + 2)
}
function key(f){ return `${f.mood}:${f.tense}:${f.person}:${f.value}` }
function levelOrder(L){ return ['A1','A2','B1','B2','C1','C2'].indexOf(L) } 