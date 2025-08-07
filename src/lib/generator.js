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
      
      // For irregular verb type, only show irregular forms
      // Check if this specific form is irregular
      const isRegularForm = isRegularFormForMood(f.lemma, f.mood, f.tense, f.person, f.value)
      if (isRegularForm) {
        console.log(`❌ Form ${f.lemma} ${f.mood} ${f.tense} filtered out - regular form in irregular verb`)
        return false
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
      
      // Handle mixed options for imperative and nonfinite
      if(specificTense) {
        if(specificTense === 'impMixed') {
          // For mixed imperative, include both affirmative and negative
          if(f.mood !== 'imperative' || (f.tense !== 'impAff' && f.tense !== 'impNeg')) {
            console.log(`❌ Form ${f.lemma} ${f.tense} filtered out - not imperative affirmative or negative`)
            return false
          }
        } else if(specificTense === 'nonfiniteMixed') {
          // For mixed nonfinite, include both gerund and participle
          if(f.mood !== 'nonfinite' || (f.tense !== 'ger' && f.tense !== 'part')) {
            console.log(`❌ Form ${f.lemma} ${f.tense} filtered out - not nonfinite gerund or participle`)
            return false
          }
          
          // For irregular verb type, only show irregular forms
          if(verbType === 'irregular') {
            const verb = findVerbByLemma(f.lemma)
            if(verb && verb.type === 'irregular') {
              // Check if this specific form is irregular
              const isRegularForm = isRegularNonfiniteForm(f.lemma, f.tense, f.value)
              if(isRegularForm) {
                console.log(`❌ Form ${f.lemma} ${f.tense} filtered out - regular form in irregular verb`)
                return false
              }
            }
          }
        } else if(f.tense !== specificTense) {
          console.log(`❌ Form ${f.lemma} ${f.tense} filtered out by specific tense ${specificTense}`)
          return false
        }
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

// Function to check if a nonfinite form is regular
function isRegularFormForMood(lemma, mood, tense, person, value) {
  // Remove accents for comparison
  const normalize = (str) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  
  const normalizedLemma = normalize(lemma)
  const normalizedValue = normalize(value)
  
  // Regular patterns for different verb endings
  if (lemma.endsWith('ar')) {
    if (mood === 'indicative') {
      if (tense === 'pres') {
        if (person === '1s' && normalizedValue === normalize(lemma.replace('ar', 'o'))) return true
        if (person === '2s_tu' && normalizedValue === normalize(lemma.replace('ar', 'as'))) return true
        if (person === '2s_vos' && normalizedValue === normalize(lemma.replace('ar', 'ás'))) return true
        if (person === '3s' && normalizedValue === normalize(lemma.replace('ar', 'a'))) return true
        if (person === '1p' && normalizedValue === normalize(lemma.replace('ar', 'amos'))) return true
        if (person === '2p_vosotros' && normalizedValue === normalize(lemma.replace('ar', 'áis'))) return true
        if (person === '3p' && normalizedValue === normalize(lemma.replace('ar', 'an'))) return true
      }
      if (tense === 'pretIndef') {
        if (person === '1s' && normalizedValue === normalize(lemma.replace('ar', 'é'))) return true
        if (person === '2s_tu' && normalizedValue === normalize(lemma.replace('ar', 'aste'))) return true
        if (person === '2s_vos' && normalizedValue === normalize(lemma.replace('ar', 'aste'))) return true
        if (person === '3s' && normalizedValue === normalize(lemma.replace('ar', 'ó'))) return true
        if (person === '1p' && normalizedValue === normalize(lemma.replace('ar', 'amos'))) return true
        if (person === '2p_vosotros' && normalizedValue === normalize(lemma.replace('ar', 'asteis'))) return true
        if (person === '3p' && normalizedValue === normalize(lemma.replace('ar', 'aron'))) return true
      }
      if (tense === 'impf') {
        if (person === '1s' && normalizedValue === normalize(lemma.replace('ar', 'aba'))) return true
        if (person === '2s_tu' && normalizedValue === normalize(lemma.replace('ar', 'abas'))) return true
        if (person === '2s_vos' && normalizedValue === normalize(lemma.replace('ar', 'abas'))) return true
        if (person === '3s' && normalizedValue === normalize(lemma.replace('ar', 'aba'))) return true
        if (person === '1p' && normalizedValue === normalize(lemma.replace('ar', 'ábamos'))) return true
        if (person === '2p_vosotros' && normalizedValue === normalize(lemma.replace('ar', 'abais'))) return true
        if (person === '3p' && normalizedValue === normalize(lemma.replace('ar', 'aban'))) return true
      }
      if (tense === 'fut') {
        if (person === '1s' && normalizedValue === normalize(lemma + 'é')) return true
        if (person === '2s_tu' && normalizedValue === normalize(lemma + 'ás')) return true
        if (person === '2s_vos' && normalizedValue === normalize(lemma + 'ás')) return true
        if (person === '3s' && normalizedValue === normalize(lemma + 'á')) return true
        if (person === '1p' && normalizedValue === normalize(lemma + 'emos')) return true
        if (person === '2p_vosotros' && normalizedValue === normalize(lemma + 'éis')) return true
        if (person === '3p' && normalizedValue === normalize(lemma + 'án')) return true
      }
      if (tense === 'pretPerf') {
        // Pretérito perfecto is always regular for -ar verbs
        return true
      }
    }
    if (mood === 'imperative') {
      if (tense === 'impAff') {
        if (person === '2s_tu' && normalizedValue === normalize(lemma.replace('ar', 'a'))) return true
        if (person === '2s_vos' && normalizedValue === normalize(lemma.replace('ar', 'á'))) return true
        if (person === '3s' && normalizedValue === normalize(lemma.replace('ar', 'e'))) return true
        if (person === '1p' && normalizedValue === normalize(lemma.replace('ar', 'emos'))) return true
        if (person === '2p_vosotros' && normalizedValue === normalize(lemma.replace('ar', 'ad'))) return true
        if (person === '3p' && normalizedValue === normalize(lemma.replace('ar', 'en'))) return true
      }
      if (tense === 'impNeg') {
        if (person === '2s_tu' && normalizedValue === normalize('no ' + lemma.replace('ar', 'es'))) return true
        if (person === '2s_vos' && normalizedValue === normalize('no ' + lemma.replace('ar', 'és'))) return true
        if (person === '3s' && normalizedValue === normalize('no ' + lemma.replace('ar', 'e'))) return true
        if (person === '1p' && normalizedValue === normalize('no ' + lemma.replace('ar', 'emos'))) return true
        if (person === '2p_vosotros' && normalizedValue === normalize('no ' + lemma.replace('ar', 'éis'))) return true
        if (person === '3p' && normalizedValue === normalize('no ' + lemma.replace('ar', 'en'))) return true
      }
    }
    if (mood === 'nonfinite') {
      if (tense === 'ger' && normalizedValue === normalize(lemma.replace('ar', 'ando'))) return true
      if (tense === 'part' && normalizedValue === normalize(lemma.replace('ar', 'ado'))) return true
    }
  } else if (lemma.endsWith('er')) {
    if (mood === 'indicative') {
      if (tense === 'pres') {
        if (person === '1s' && normalizedValue === normalize(lemma.replace('er', 'o'))) return true
        if (person === '2s_tu' && normalizedValue === normalize(lemma.replace('er', 'es'))) return true
        if (person === '2s_vos' && normalizedValue === normalize(lemma.replace('er', 'és'))) return true
        if (person === '3s' && normalizedValue === normalize(lemma.replace('er', 'e'))) return true
        if (person === '1p' && normalizedValue === normalize(lemma.replace('er', 'emos'))) return true
        if (person === '2p_vosotros' && normalizedValue === normalize(lemma.replace('er', 'éis'))) return true
        if (person === '3p' && normalizedValue === normalize(lemma.replace('er', 'en'))) return true
      }
      if (tense === 'pretIndef') {
        if (person === '1s' && normalizedValue === normalize(lemma.replace('er', 'í'))) return true
        if (person === '2s_tu' && normalizedValue === normalize(lemma.replace('er', 'iste'))) return true
        if (person === '2s_vos' && normalizedValue === normalize(lemma.replace('er', 'iste'))) return true
        if (person === '3s' && normalizedValue === normalize(lemma.replace('er', 'ió'))) return true
        if (person === '1p' && normalizedValue === normalize(lemma.replace('er', 'imos'))) return true
        if (person === '2p_vosotros' && normalizedValue === normalize(lemma.replace('er', 'isteis'))) return true
        if (person === '3p' && normalizedValue === normalize(lemma.replace('er', 'ieron'))) return true
      }
      if (tense === 'impf') {
        if (person === '1s' && normalizedValue === normalize(lemma.replace('er', 'ía'))) return true
        if (person === '2s_tu' && normalizedValue === normalize(lemma.replace('er', 'ías'))) return true
        if (person === '2s_vos' && normalizedValue === normalize(lemma.replace('er', 'ías'))) return true
        if (person === '3s' && normalizedValue === normalize(lemma.replace('er', 'ía'))) return true
        if (person === '1p' && normalizedValue === normalize(lemma.replace('er', 'íamos'))) return true
        if (person === '2p_vosotros' && normalizedValue === normalize(lemma.replace('er', 'íais'))) return true
        if (person === '3p' && normalizedValue === normalize(lemma.replace('er', 'ían'))) return true
      }
      if (tense === 'fut') {
        if (person === '1s' && normalizedValue === normalize(lemma + 'é')) return true
        if (person === '2s_tu' && normalizedValue === normalize(lemma + 'ás')) return true
        if (person === '2s_vos' && normalizedValue === normalize(lemma + 'ás')) return true
        if (person === '3s' && normalizedValue === normalize(lemma + 'á')) return true
        if (person === '1p' && normalizedValue === normalize(lemma + 'emos')) return true
        if (person === '2p_vosotros' && normalizedValue === normalize(lemma + 'éis')) return true
        if (person === '3p' && normalizedValue === normalize(lemma + 'án')) return true
      }
      if (tense === 'pretPerf') {
        // Pretérito perfecto is always regular for -er verbs
        return true
      }
    }
    if (mood === 'imperative') {
      if (tense === 'impAff') {
        if (person === '2s_tu' && normalizedValue === normalize(lemma.replace('er', 'e'))) return true
        if (person === '2s_vos' && normalizedValue === normalize(lemma.replace('er', 'é'))) return true
        if (person === '3s' && normalizedValue === normalize(lemma.replace('er', 'a'))) return true
        if (person === '1p' && normalizedValue === normalize(lemma.replace('er', 'amos'))) return true
        if (person === '2p_vosotros' && normalizedValue === normalize(lemma.replace('er', 'ed'))) return true
        if (person === '3p' && normalizedValue === normalize(lemma.replace('er', 'an'))) return true
      }
      if (tense === 'impNeg') {
        if (person === '2s_tu' && normalizedValue === normalize('no ' + lemma.replace('er', 'as'))) return true
        if (person === '2s_vos' && normalizedValue === normalize('no ' + lemma.replace('er', 'ás'))) return true
        if (person === '3s' && normalizedValue === normalize('no ' + lemma.replace('er', 'a'))) return true
        if (person === '1p' && normalizedValue === normalize('no ' + lemma.replace('er', 'amos'))) return true
        if (person === '2p_vosotros' && normalizedValue === normalize('no ' + lemma.replace('er', 'áis'))) return true
        if (person === '3p' && normalizedValue === normalize('no ' + lemma.replace('er', 'an'))) return true
      }
    }
    if (mood === 'nonfinite') {
      if (tense === 'ger' && normalizedValue === normalize(lemma.replace('er', 'iendo'))) return true
      if (tense === 'part' && normalizedValue === normalize(lemma.replace('er', 'ido'))) return true
    }
  } else if (lemma.endsWith('ir')) {
    if (mood === 'indicative') {
      if (tense === 'pres') {
        if (person === '1s' && normalizedValue === normalize(lemma.replace('ir', 'o'))) return true
        if (person === '2s_tu' && normalizedValue === normalize(lemma.replace('ir', 'es'))) return true
        if (person === '2s_vos' && normalizedValue === normalize(lemma.replace('ir', 'és'))) return true
        if (person === '3s' && normalizedValue === normalize(lemma.replace('ir', 'e'))) return true
        if (person === '1p' && normalizedValue === normalize(lemma.replace('ir', 'imos'))) return true
        if (person === '2p_vosotros' && normalizedValue === normalize(lemma.replace('ir', 'ís'))) return true
        if (person === '3p' && normalizedValue === normalize(lemma.replace('ir', 'en'))) return true
      }
      if (tense === 'pretIndef') {
        if (person === '1s' && normalizedValue === normalize(lemma.replace('ir', 'í'))) return true
        if (person === '2s_tu' && normalizedValue === normalize(lemma.replace('ir', 'iste'))) return true
        if (person === '2s_vos' && normalizedValue === normalize(lemma.replace('ir', 'iste'))) return true
        if (person === '3s' && normalizedValue === normalize(lemma.replace('ir', 'ió'))) return true
        if (person === '1p' && normalizedValue === normalize(lemma.replace('ir', 'imos'))) return true
        if (person === '2p_vosotros' && normalizedValue === normalize(lemma.replace('ir', 'isteis'))) return true
        if (person === '3p' && normalizedValue === normalize(lemma.replace('ir', 'ieron'))) return true
      }
      if (tense === 'impf') {
        if (person === '1s' && normalizedValue === normalize(lemma.replace('ir', 'ía'))) return true
        if (person === '2s_tu' && normalizedValue === normalize(lemma.replace('ir', 'ías'))) return true
        if (person === '2s_vos' && normalizedValue === normalize(lemma.replace('ir', 'ías'))) return true
        if (person === '3s' && normalizedValue === normalize(lemma.replace('ir', 'ía'))) return true
        if (person === '1p' && normalizedValue === normalize(lemma.replace('ir', 'íamos'))) return true
        if (person === '2p_vosotros' && normalizedValue === normalize(lemma.replace('ir', 'íais'))) return true
        if (person === '3p' && normalizedValue === normalize(lemma.replace('ir', 'ían'))) return true
      }
      if (tense === 'fut') {
        if (person === '1s' && normalizedValue === normalize(lemma + 'é')) return true
        if (person === '2s_tu' && normalizedValue === normalize(lemma + 'ás')) return true
        if (person === '2s_vos' && normalizedValue === normalize(lemma + 'ás')) return true
        if (person === '3s' && normalizedValue === normalize(lemma + 'á')) return true
        if (person === '1p' && normalizedValue === normalize(lemma + 'emos')) return true
        if (person === '2p_vosotros' && normalizedValue === normalize(lemma + 'éis')) return true
        if (person === '3p' && normalizedValue === normalize(lemma + 'án')) return true
      }
      if (tense === 'pretPerf') {
        // Pretérito perfecto is always regular for -ir verbs
        return true
      }
    }
    if (mood === 'imperative') {
      if (tense === 'impAff') {
        if (person === '2s_tu' && normalizedValue === normalize(lemma.replace('ir', 'e'))) return true
        if (person === '2s_vos' && normalizedValue === normalize(lemma.replace('ir', 'é'))) return true
        if (person === '3s' && normalizedValue === normalize(lemma.replace('ir', 'a'))) return true
        if (person === '1p' && normalizedValue === normalize(lemma.replace('ir', 'amos'))) return true
        if (person === '2p_vosotros' && normalizedValue === normalize(lemma.replace('ir', 'id'))) return true
        if (person === '3p' && normalizedValue === normalize(lemma.replace('ir', 'an'))) return true
      }
      if (tense === 'impNeg') {
        if (person === '2s_tu' && normalizedValue === normalize('no ' + lemma.replace('ir', 'as'))) return true
        if (person === '2s_vos' && normalizedValue === normalize('no ' + lemma.replace('ir', 'ás'))) return true
        if (person === '3s' && normalizedValue === normalize('no ' + lemma.replace('ir', 'a'))) return true
        if (person === '1p' && normalizedValue === normalize('no ' + lemma.replace('ir', 'amos'))) return true
        if (person === '2p_vosotros' && normalizedValue === normalize('no ' + lemma.replace('ir', 'áis'))) return true
        if (person === '3p' && normalizedValue === normalize('no ' + lemma.replace('ir', 'an'))) return true
      }
    }
         if (mood === 'nonfinite') {
       if (tense === 'ger' && normalizedValue === normalize(lemma.replace('ir', 'iendo'))) return true
       if (tense === 'part' && normalizedValue === normalize(lemma.replace('ir', 'ido'))) return true
     }
   }
   
   // Add subjunctive and conditional patterns
   if (mood === 'subjunctive') {
     // Subjunctive patterns are similar to indicative but with different endings
     if (lemma.endsWith('ar')) {
       if (tense === 'subjPres') {
         if (person === '1s' && normalizedValue === normalize(lemma.replace('ar', 'e'))) return true
         if (person === '2s_tu' && normalizedValue === normalize(lemma.replace('ar', 'es'))) return true
         if (person === '2s_vos' && normalizedValue === normalize(lemma.replace('ar', 'és'))) return true
         if (person === '3s' && normalizedValue === normalize(lemma.replace('ar', 'e'))) return true
         if (person === '1p' && normalizedValue === normalize(lemma.replace('ar', 'emos'))) return true
         if (person === '2p_vosotros' && normalizedValue === normalize(lemma.replace('ar', 'éis'))) return true
         if (person === '3p' && normalizedValue === normalize(lemma.replace('ar', 'en'))) return true
       }
       if (tense === 'subjImpf') {
         if (person === '1s' && normalizedValue === normalize(lemma.replace('ar', 'ara'))) return true
         if (person === '2s_tu' && normalizedValue === normalize(lemma.replace('ar', 'aras'))) return true
         if (person === '2s_vos' && normalizedValue === normalize(lemma.replace('ar', 'aras'))) return true
         if (person === '3s' && normalizedValue === normalize(lemma.replace('ar', 'ara'))) return true
         if (person === '1p' && normalizedValue === normalize(lemma.replace('ar', 'áramos'))) return true
         if (person === '2p_vosotros' && normalizedValue === normalize(lemma.replace('ar', 'arais'))) return true
         if (person === '3p' && normalizedValue === normalize(lemma.replace('ar', 'aran'))) return true
       }
     } else if (lemma.endsWith('er')) {
       if (tense === 'subjPres') {
         if (person === '1s' && normalizedValue === normalize(lemma.replace('er', 'a'))) return true
         if (person === '2s_tu' && normalizedValue === normalize(lemma.replace('er', 'as'))) return true
         if (person === '2s_vos' && normalizedValue === normalize(lemma.replace('er', 'ás'))) return true
         if (person === '3s' && normalizedValue === normalize(lemma.replace('er', 'a'))) return true
         if (person === '1p' && normalizedValue === normalize(lemma.replace('er', 'amos'))) return true
         if (person === '2p_vosotros' && normalizedValue === normalize(lemma.replace('er', 'áis'))) return true
         if (person === '3p' && normalizedValue === normalize(lemma.replace('er', 'an'))) return true
       }
       if (tense === 'subjImpf') {
         if (person === '1s' && normalizedValue === normalize(lemma.replace('er', 'iera'))) return true
         if (person === '2s_tu' && normalizedValue === normalize(lemma.replace('er', 'ieras'))) return true
         if (person === '2s_vos' && normalizedValue === normalize(lemma.replace('er', 'ieras'))) return true
         if (person === '3s' && normalizedValue === normalize(lemma.replace('er', 'iera'))) return true
         if (person === '1p' && normalizedValue === normalize(lemma.replace('er', 'iéramos'))) return true
         if (person === '2p_vosotros' && normalizedValue === normalize(lemma.replace('er', 'ierais'))) return true
         if (person === '3p' && normalizedValue === normalize(lemma.replace('er', 'ieran'))) return true
       }
     } else if (lemma.endsWith('ir')) {
       if (tense === 'subjPres') {
         if (person === '1s' && normalizedValue === normalize(lemma.replace('ir', 'a'))) return true
         if (person === '2s_tu' && normalizedValue === normalize(lemma.replace('ir', 'as'))) return true
         if (person === '2s_vos' && normalizedValue === normalize(lemma.replace('ir', 'ás'))) return true
         if (person === '3s' && normalizedValue === normalize(lemma.replace('ir', 'a'))) return true
         if (person === '1p' && normalizedValue === normalize(lemma.replace('ir', 'amos'))) return true
         if (person === '2p_vosotros' && normalizedValue === normalize(lemma.replace('ir', 'áis'))) return true
         if (person === '3p' && normalizedValue === normalize(lemma.replace('ir', 'an'))) return true
       }
       if (tense === 'subjImpf') {
         if (person === '1s' && normalizedValue === normalize(lemma.replace('ir', 'iera'))) return true
         if (person === '2s_tu' && normalizedValue === normalize(lemma.replace('ir', 'ieras'))) return true
         if (person === '2s_vos' && normalizedValue === normalize(lemma.replace('ir', 'ieras'))) return true
         if (person === '3s' && normalizedValue === normalize(lemma.replace('ir', 'iera'))) return true
         if (person === '1p' && normalizedValue === normalize(lemma.replace('ir', 'iéramos'))) return true
         if (person === '2p_vosotros' && normalizedValue === normalize(lemma.replace('ir', 'ierais'))) return true
         if (person === '3p' && normalizedValue === normalize(lemma.replace('ir', 'ieran'))) return true
       }
     }
   }
   
   if (mood === 'conditional') {
     // Conditional is always regular (formed with infinitive + endings)
     if (tense === 'cond') {
       if (person === '1s' && normalizedValue === normalize(lemma + 'ía')) return true
       if (person === '2s_tu' && normalizedValue === normalize(lemma + 'ías')) return true
       if (person === '2s_vos' && normalizedValue === normalize(lemma + 'ías')) return true
       if (person === '3s' && normalizedValue === normalize(lemma + 'ía')) return true
       if (person === '1p' && normalizedValue === normalize(lemma + 'íamos')) return true
       if (person === '2p_vosotros' && normalizedValue === normalize(lemma + 'íais')) return true
       if (person === '3p' && normalizedValue === normalize(lemma + 'ían')) return true
     }
   }
   
   return false
}

function isRegularNonfiniteForm(lemma, tense, value) {
  // Remove accents for comparison
  const normalize = (str) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  
  const normalizedLemma = normalize(lemma)
  const normalizedValue = normalize(value)
  
  if (lemma.endsWith('ar')) {
    if (tense === 'ger' && normalizedValue === normalize(lemma.replace('ar', 'ando'))) return true
    if (tense === 'part' && normalizedValue === normalize(lemma.replace('ar', 'ado'))) return true
  } else if (lemma.endsWith('er')) {
    if (tense === 'ger' && normalizedValue === normalize(lemma.replace('er', 'iendo'))) return true
    if (tense === 'part' && normalizedValue === normalize(lemma.replace('er', 'ido'))) return true
  } else if (lemma.endsWith('ir')) {
    if (tense === 'ger' && normalizedValue === normalize(lemma.replace('ir', 'iendo'))) return true
    if (tense === 'part' && normalizedValue === normalize(lemma.replace('ir', 'ido'))) return true
  }
  return false
}

function acc(f, history){
  const k = key(f); const h = history[k]||{seen:0, correct:0}
  return (h.correct + 1) / (h.seen + 2)
}
function key(f){ return `${f.mood}:${f.tense}:${f.person}:${f.value}` }
function levelOrder(L){ return ['A1','A2','B1','B2','C1','C2'].indexOf(L) } 