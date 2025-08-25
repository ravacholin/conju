import gates from '../../data/curriculum.json'
import { useSettings } from '../../state/settings.js'
import { verbs } from '../../data/verbs.js'
import { categorizeVerb } from '../data/irregularFamilies.js'
import { expandSimplifiedGroup } from '../data/simplifiedFamilyGroups.js'
import { shouldFilterVerbByLevel } from './levelVerbFiltering.js'
import { isRegularFormForMood, isRegularNonfiniteForm, hasIrregularParticiple } from './conjugationRules.js'


// Imports optimizados
import { 
  VERB_LOOKUP_MAP, 
  FORM_LOOKUP_MAP,
  // verbCategorizationCache,  // UNUSED
  formFilterCache,
  // combinationCache,        // UNUSED
  warmupCaches 
} from './optimizedCache.js'

// Fast lookups (ahora usando cache optimizado)
const LEMMA_TO_VERB = VERB_LOOKUP_MAP
const allowedCombosCache = new Map() // level -> Set("mood|tense")
function getAllowedCombosForLevel(level) {
  if (allowedCombosCache.has(level)) return allowedCombosCache.get(level)
  if (level === 'ALL') {
    const all = new Set(gates.map(g => `${g.mood}|${g.tense}`))
    allowedCombosCache.set(level, all)
    return all
  }
  const maxIdx = levelOrder(level)
  const set = new Set(
    gates
      .filter(g => levelOrder(g.level) <= maxIdx)
      .map(g => `${g.mood}|${g.tense}`)
  )
  allowedCombosCache.set(level, set)
  return set
}

const regularMoodMemo = new Map() // key: lemma|mood|tense|person|value
const regularNonfiniteMemo = new Map() // key: lemma|tense|value

// MCER Level verb type restrictions
const levelVerbRestrictions = {
  'A1': { regular: true, irregular: true },
  'A2': { regular: true, irregular: true },
  'B1': { regular: true, irregular: true },
  'B2': { regular: true, irregular: true },
  'C1': { regular: true, irregular: true }, // Allow all verb types for C1 (was incorrectly restricted)
  'C2': { regular: true, irregular: true },
  'ALL': { regular: true, irregular: true } // Allow all verb types for ALL level
}

function isVerbTypeAllowedForLevel(verbType, level) {
  const restrictions = levelVerbRestrictions[level]
  if (!restrictions) return true // Default to allowing all if level not found
  return restrictions[verbType] || false
}

export function chooseNext({forms, history, currentItem}){
  // Extract all settings once to avoid repeated state access
  const allSettings = useSettings.getState()
  const { 
    level, useVoseo, useTuteo, useVosotros,
    practiceMode, specificMood, specificTense, practicePronoun, verbType,
    currentBlock, selectedFamily, region, enableFuturoSubjProd, allowedLemmas,
    enableC2Conmutacion, conmutacionSeq, conmutacionIdx, rotateSecondPerson, 
    nextSecondPerson, cliticsPercent
  } = allSettings
  
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 CHOOSENEXT DEBUG - Called with settings:', {
      level, useVoseo, useTuteo, useVosotros,
      practiceMode, specificMood, specificTense, practicePronoun, verbType,
      selectedFamily, currentBlock: !!currentBlock,
      formsCount: forms.length
    })
  }
  
  // CRITICAL DEBUG: Special focus on B1 level filtering
  const isB1Debug = level === 'B1' && process.env.NODE_ENV === 'development'
  if (isB1Debug) {
    console.log('🚨 B1 DEBUG - Initial analysis')
    console.log('🚨 B1 DEBUG - Total forms:', forms.length)
    console.log('🚨 B1 DEBUG - Sample forms:', forms.slice(0,10).map(f => `${f.lemma}-${f.mood}-${f.tense}-${f.person}`))
    console.log('🚨 B1 DEBUG - Settings:', {
      level, practiceMode, specificMood, specificTense, verbType, selectedFamily
    })
  }
  
  // DIAGNOSTIC: Special focus on C1 mixed practice
  if (level === 'C1' && practiceMode === 'mixed' && process.env.NODE_ENV === 'development') {
    console.log('🚨 C1 MIXED DEBUG - Initial forms count:', forms.length)
    console.log('🚨 C1 MIXED DEBUG - currentBlock:', currentBlock)
    console.log('🚨 C1 MIXED DEBUG - verbType:', verbType)
    console.log('🚨 C1 MIXED DEBUG - First 5 forms:', forms.slice(0,5).map(f => `${f.lemma}-${f.mood}-${f.tense}-${f.person}`))
  }
  
  // Crear cache key para este filtrado
  const filterKey = `filter|${level}|${useVoseo}|${useTuteo}|${useVosotros}|${practiceMode}|${specificMood}|${specificTense}|${practicePronoun}|${verbType}|${selectedFamily}|${currentBlock?.id || 'none'}`
  
  // Intentar obtener del cache
  let eligible = formFilterCache.get(filterKey)
  
  if (!eligible) {
    // Si no está en cache, calcular
    eligible = forms.filter(f=>{
      
      // DIAGNOSTIC: Track C1 and B1 filtering step by step  
      const isC1Debug = level === 'C1' && practiceMode === 'mixed'
      
      // Filter out forms with undefined/null values first
      if (!f.value && !f.form) {
        if (isC1Debug) console.log('🚨 C1 FILTER - No value/form:', f.lemma, f.mood, f.tense)
        return false
      }
      
      // Level filtering (O(1) with precomputed set)
      // Determine allowed combos: from current block if set, else level
      const allowed = currentBlock && currentBlock.combos && currentBlock.combos.length
        ? new Set(currentBlock.combos.map(c => `${c.mood}|${c.tense}`))
        : getAllowedCombosForLevel(level)
      if(!allowed.has(`${f.mood}|${f.tense}`)) {
        if (isC1Debug) console.log('🚨 C1 FILTER - Combo not allowed:', `${f.mood}|${f.tense}`, f.lemma)
        if (isB1Debug) console.log('🚨 B1 FILTER - Combo not allowed:', `${f.mood}|${f.tense}`, f.lemma)
        return false
      }
    
    // Gate futuro de subjuntivo por toggle de producción
    if (f.mood === 'subjunctive' && (f.tense === 'subjFut' || f.tense === 'subjFutPerf')) {
      if (!enableFuturoSubjProd) {
        return false
      }
    }

    // Person filtering (dialect) - based on region setting
    
    // For nonfinite forms (gerundios, participios), skip person filtering - they're invariable
    if (f.mood === 'nonfinite') {
    } else {
      // Apply dialect filtering based on region setting
      // UNLESS practicePronoun is 'all' which overrides regional restrictions
      if (practicePronoun === 'all') {
        // ALL forms mode: include ALL pronouns regardless of region
        // yo, tú, vos, él, nosotros, vosotros, ellos - no filtering
      } else if (region === 'rioplatense') {
        // Rioplatense: yo, vos, usted/él/ella, nosotros, ustedes/ellas/ellos
        if (f.person === '2s_tu') {
          return false
        }
        if (f.person === '2p_vosotros') {
          return false
        }
      } else if (region === 'peninsular') {
        // Peninsular: yo, tú, usted/él/ella, nosotros, vosotros, ustedes/ellas/ellos
        if (f.person === '2s_vos') {
          return false
        }
      } else if (region === 'la_general') {
        // Latin American general: yo, tú, usted/él/ella, nosotros, ustedes/ellas/ellos
        if (f.person === '2s_vos') {
          return false
        }
        if (f.person === '2p_vosotros') {
          return false
        }
      } else {
        // All variants: yo, tú, vos, usted/él/ella, nosotros, vosotros, ustedes/ellas/ellos
        // No filtering, show all persons
      }
    }
    
    // Pronoun practice filtering - be less restrictive for specific practice
    if (practiceMode === 'specific' && specificMood && specificTense) {
      // For specific practice, show ALL persons of the selected form
      // Don't filter by practicePronoun at all - show variety
    } else {
      // For mixed practice, apply pronoun filtering based on practicePronoun setting
      if (practicePronoun === 'tu_only') {
        // Only tú forms
        if (f.person !== '2s_tu') {
          return false
        }
      } else if (practicePronoun === 'vos_only') {
        // Only vos forms  
        if (f.person !== '2s_vos') {
          return false
        }
      } else if (practicePronoun === 'all') {
        // ALL forms including vosotros - override region restrictions for 2nd person
        // This means we allow ALL persons regardless of dialect when 'all' is selected
        // No filtering needed - let all forms through (including vosotros)
      } else if (practicePronoun === 'both') {
        // Both tú and vos, but still respect regional vosotros restrictions
        // No additional filtering beyond regional dialect filtering
      }
      // Note: 'both' and 'all' both allow the regional dialect filtering to work normally,
      // but 'all' will override vosotros restrictions later in the dialect filtering
    }
    
    // Verb type filtering - check both user selection and MCER level restrictions
    const verb = LEMMA_TO_VERB.get(f.lemma)
    if (!verb) {
      if (isC1Debug) console.log('🚨 C1 FILTER - No verb found:', f.lemma)
      return false
    }
    
    
    // Check MCER level restrictions first
    const isCompoundTense = (f.tense === 'pretPerf' || f.tense === 'plusc' || f.tense === 'futPerf' || f.tense === 'condPerf' || f.tense === 'subjPerf' || f.tense === 'subjPlusc')
    if (!isCompoundTense && f.mood !== 'nonfinite' && !isVerbTypeAllowedForLevel(verb.type, level)) {
      if (isC1Debug) console.log('🚨 C1 FILTER - Verb type not allowed for level:', verb.type, level, f.lemma)
      return false
    }

    // Additional per-level constraints  
    // (C1 specific restrictions removed - now allows all verb types)

    // B2+: bloquear personas imposibles para defectivos/unipersonales
    if (level === 'B2' || level === 'C1' || level === 'C2') {
      const UNIPERSONALES = new Set(['llover','nevar','granizar','amanecer'])
      if (UNIPERSONALES.has(f.lemma)) {
        if (!(f.person === '3s' || f.person === '3p')) {
          return false
        }
      }
    }
    
    // Restrict lemmas if configured by level/packs
    if (allowedLemmas) {
      if (!allowedLemmas.has(f.lemma)) {
        if (isC1Debug) console.log('🚨 C1 FILTER - Lemma not in allowedLemmas:', f.lemma)
        console.log(`🔧 ALLOWEDLEMMAS DEBUG - Filtering out: ${f.lemma} (not in allowed set)`)
        return false
      }
    }

    // Then check user's verb type preference  
    // isCompoundTense defined above
    // QUICK FIX: Para práctica mixta (sin verbType específico), permitir todos los verbos
    const isMixedPractice = !verbType || verbType === 'mixed' || verbType === 'all'
    
    if (verbType === 'regular' && !isMixedPractice) {
      if (verb.type !== 'regular') {
        return false
      }
    } else if (verbType === 'irregular' && !isMixedPractice) {
      // For compound tenses, check if the verb has an irregular participle first
      if (isCompoundTense) {
        if (!hasIrregularParticiple(f.lemma)) {
          return false
        }
        // Then check if this specific form is irregular
        const isRegularForm = isRegularFormForMood(f.lemma, f.mood, f.tense, f.person, f.value)
        if (isRegularForm) {
          return false
        }
      } else if (f.mood === 'nonfinite') {
        // For nonfinite forms (gerundio, participio), check if the verb is irregular
        if (verb.type !== 'irregular') {
          return false
        }
        // For participio specifically, check if it has irregular participle
        if (f.tense === 'part' && !hasIrregularParticiple(f.lemma)) {
          return false
        }
        // Then check if this specific form is irregular
        const isRegularForm = isRegularNonfiniteForm(f.lemma, f.tense, f.value)
        if (isRegularForm) {
          return false
        }
      } else {
        // For simple tenses, the verb must be irregular
        if (verb.type !== 'irregular') {
          return false
        }
        
        // RELAXED: For imperfect tense, allow more irregular verbs for variety
        if (f.mood === 'indicative' && f.tense === 'impf') {
          // For imperfect, allow more common irregular verbs (not just ser/ir/ver)
          const commonIrregularVerbs = ['ser', 'ir', 'ver', 'hacer', 'estar', 'tener', 'dar', 'poder', 'decir', 'venir']
          if (!commonIrregularVerbs.includes(f.lemma)) {
            return false
          }
        } else {
          // For other tenses, apply the regular form filtering
          const isRegularForm = isRegularFormForMood(f.lemma, f.mood, f.tense, f.person, f.value)
          
          // Define tenses that are regular for all verbs (even irregular verbs)  
          const universallyRegularTenses = [] // No tenses are universally regular
          const isUniversallyRegularTense = universallyRegularTenses.includes(f.tense)
          
          if (isRegularForm && !isUniversallyRegularTense) {
            return false
          }
        }
      }
      
      // Family filtering for irregular verbs
      if (selectedFamily) {
        const verbFamilies = categorizeVerb(f.lemma, verb)

        // Check if it's a simplified group that needs expansion
        const expandedFamilies = expandSimplifiedGroup(selectedFamily)
        if (expandedFamilies.length > 0) {
          // It's a simplified group. Check if the verb belongs to ANY of the included families.
          const isMatch = verbFamilies.some(vf => expandedFamilies.includes(vf))
          if (!isMatch) {
            return false
          }
        } else {
          // It's a regular family - check direct match
          if (!verbFamilies.includes(selectedFamily)) {
            return false
          }
        }
        
        // Level-based filtering for specific verb types
        if (shouldFilterVerbByLevel(f.lemma, verbFamilies, level, f.tense)) {
          return false
        }
      } else {
        // Even without family selection, apply level-based filtering for irregulars
        const verbFamilies = categorizeVerb(f.lemma, verb)
        if (shouldFilterVerbByLevel(f.lemma, verbFamilies, level, f.tense)) {
          return false
        }
      }
    }
    // If verbType is 'all', we only check MCER restrictions (already done above)
    
    // Specific practice filtering
    if(practiceMode === 'specific') {
      if(specificMood && f.mood !== specificMood) {
        return false
      }
      
      // Handle mixed options for imperative and nonfinite
      if(specificTense) {
        if(specificTense === 'impMixed') {
          // For mixed imperative, include both affirmative and negative
          if(f.mood !== 'imperative' || (f.tense !== 'impAff' && f.tense !== 'impNeg')) {
            return false
          }
        } else if(specificTense === 'nonfiniteMixed') {
          // For mixed nonfinite, include both gerund and participle
          if(f.mood !== 'nonfinite' || (f.tense !== 'ger' && f.tense !== 'part')) {
            return false
          }
          
          // For irregular verb type, only show irregular forms
          if(verbType === 'irregular') {
            const verb = LEMMA_TO_VERB.get(f.lemma)
            if(verb && verb.type === 'irregular') {
              // Check if this specific form is irregular
              const k = `${f.lemma}|${f.tense}|${f.value}`
              let isRegularForm = regularNonfiniteMemo.get(k)
              if (isRegularForm === undefined) {
                isRegularForm = isRegularNonfiniteForm(f.lemma, f.tense, f.value)
                regularNonfiniteMemo.set(k, isRegularForm)
              }
              if(isRegularForm) {
                return false
              }
            }
          }
        } else if(f.tense !== specificTense) {
          return false
        }
      }
    }
    
    // Filter out infinitivos from practice (they're not conjugated forms)
    if(f.mood === 'nonfinite' && (f.tense === 'inf' || f.tense === 'infPerf')) {
      return false
    }
    
    return true
  })
  
    // DIAGNOSTIC: Log C1 and B1 filtering results
    if (level === 'C1' && practiceMode === 'mixed') {
      console.log('🚨 C1 MIXED DEBUG - After filtering:', eligible.length, 'forms remain')
      if (eligible.length > 0) {
        console.log('🚨 C1 MIXED DEBUG - Sample survivors:', eligible.slice(0,3).map(f => `${f.lemma}-${f.mood}-${f.tense}`))
      } else {
        console.log('🚨 C1 MIXED DEBUG - NO FORMS SURVIVED FILTERING!')
      }
    }
    
    if (isB1Debug) {
      console.log('🚨 B1 DEBUG - After filtering:', eligible.length, 'forms remain')
      if (eligible.length > 0) {
        console.log('🚨 B1 DEBUG - Sample survivors:', eligible.slice(0,10).map(f => `${f.lemma}-${f.mood}-${f.tense}-${f.person}`))
        
        // Analyze mood/tense diversity
        const moodTenseCombos = new Set(eligible.map(f => `${f.mood}|${f.tense}`))
        console.log('🚨 B1 DEBUG - Available mood/tense combinations:', Array.from(moodTenseCombos))
        
        // Count by mood
        const moodCounts = {}
        eligible.forEach(f => {
          moodCounts[f.mood] = (moodCounts[f.mood] || 0) + 1
        })
        console.log('🚨 B1 DEBUG - Forms by mood:', moodCounts)
      } else {
        console.log('🚨 B1 DEBUG - NO FORMS SURVIVED FILTERING!')
      }
    }
  
    // Guardar en cache para futuros usos
    formFilterCache.set(filterKey, eligible)
  }
  
  // Exclude the exact same item from the list of candidates, if possible
  if (currentItem && eligible.length > 1) {
    const { lemma, mood, tense, person } = currentItem;
    const filteredEligible = eligible.filter(f =>
      f.lemma !== lemma || f.mood !== mood || f.tense !== tense || f.person !== person
    );
    if (filteredEligible.length > 0) {
      eligible = filteredEligible;
    }
  }

  // Show which persons were included
  const includedPersons = [...new Set(eligible.map(f => f.person))]
  
  // Check if we have any eligible forms
  if (eligible.length === 0) {
    console.log('🔧 CHOOSENEXT DEBUG - NO ELIGIBLE FORMS! Starting fallback logic...')
    // Failsafe: relax filters progressively to always return something
    let fallback = forms.filter(f => getAllowedCombosForLevel(level).has(`${f.mood}|${f.tense}`))
    console.log('🔧 FALLBACK DEBUG - After level filter:', fallback.length)
    if (specificMood) fallback = fallback.filter(f => f.mood === specificMood)
    console.log('🔧 FALLBACK DEBUG - After mood filter:', fallback.length)
    if (specificTense) fallback = fallback.filter(f => f.tense === specificTense)
    console.log('🔧 FALLBACK DEBUG - After tense filter:', fallback.length)
    // Respect dialect minimally for conjugated forms
    fallback = fallback.filter(f => {
      if (f.mood === 'nonfinite') return true
      
      // Apply same dialect filtering as main logic
      // UNLESS practicePronoun is 'all' which overrides regional restrictions
      if (practicePronoun === 'all') {
        // ALL forms mode: include ALL pronouns regardless of region
        return ['1s','2s_tu','2s_vos','3s','1p','2p_vosotros','3p'].includes(f.person)
      } else if (region === 'rioplatense') {
        return !['2s_tu', '2p_vosotros'].includes(f.person)
      } else if (region === 'peninsular') {
        return f.person !== '2s_vos'
      } else if (region === 'la_general') {
        return !['2s_vos', '2p_vosotros'].includes(f.person)
      } else {
        // All variants allowed
        return ['1s','2s_tu','2s_vos','3s','1p','2p_vosotros','3p'].includes(f.person)
      }
    })
    console.log('🔧 FALLBACK DEBUG - After dialect filter:', fallback.length)
    // If still empty, drop tense constraint
    if (fallback.length === 0 && specificTense) {
      fallback = forms.filter(f => f.mood === specificMood)
      console.log('🔧 FALLBACK DEBUG - After dropping tense:', fallback.length)
    }
    // If still empty, drop mood constraint
    if (fallback.length === 0 && specificMood) {
      fallback = forms
      console.log('🔧 FALLBACK DEBUG - After dropping mood:', fallback.length)
    }
    // As last resort, return any form
    console.log('🔧 FALLBACK DEBUG - Final fallback result:', fallback[0] ? `${fallback[0].lemma} - ${fallback[0].value}` : 'null')
    return fallback[0] || null
  } else {
    console.log('🔧 CHOOSENEXT DEBUG - Found', eligible.length, 'eligible forms')
  }
  
  // Apply weighted selection for "all" verb types to balance regular vs irregular per level
  if (verbType === 'all') {
    eligible = applyWeightedSelection(eligible)
  }

  // Apply level-driven morphological focus weighting (duplicate entries to increase frequency)
  eligible = applyLevelFormWeighting(eligible, allSettings)

  // C2 conmutación: asegurar variedad pero sin ocultar otras personas
  // Suavizamos: priorizamos la persona objetivo si existe, pero mantenemos el resto disponible
  if (enableC2Conmutacion && level === 'C2' && eligible.length > 0) {
    const base = eligible[Math.floor(Math.random() * eligible.length)]
    const seq = conmutacionSeq || ['2s_vos','3p','3s']
    const idx = conmutacionIdx || 0
    const targetPerson = seq[idx % seq.length]
    const boosted = []
    eligible.forEach(f => {
      let w = 1
      if (f.lemma === base.lemma && f.person === targetPerson) w = 3
      for (let i=0;i<w;i++) boosted.push(f)
    })
    eligible = boosted
    useSettings.getState().set({ conmutacionIdx: (idx + 1) % seq.length })
  }
  
  // Compute lowest accuracy and candidates in O(n)
  let lowestAcc = Infinity
  const accCache = new Map()
  for (let i = 0; i < eligible.length; i++) {
    const a = acc(eligible[i], history)
    accCache.set(eligible[i], a)
    if (a < lowestAcc) lowestAcc = a
  }
  const candidates = []
  for (let i = 0; i < eligible.length; i++) {
    if (accCache.get(eligible[i]) === lowestAcc) candidates.push(eligible[i])
  }
  
  // Balance selection by person to ensure variety
  const personsInCandidates = [...new Set(candidates.map(f => f.person))]
  
  // Group candidates by person
  const candidatesByPerson = {}
  personsInCandidates.forEach(person => {
    candidatesByPerson[person] = candidates.filter(f => f.person === person)
  })
  
  // Select a person using level-based weights, then a random form from that person
  const personWeights = getPersonWeightsForLevel(allSettings)
  const availablePersons = personsInCandidates
  // Optional rotation of second person at high levels
  const rot = rotateSecondPerson
  const next2 = nextSecondPerson
  const weights = availablePersons.map(p => {
    let w = personWeights[p] || 1
    if (rot && (p === '2s_tu' || p === '2s_vos')) {
      if (p === next2) w *= 1.5
      else w *= 0.75
    }
    return w
  })
  const totalW = weights.reduce((a,b)=>a+b,0) || 1
  let r = Math.random() * totalW
  let randomPerson = availablePersons[0]
  for (let i=0;i<availablePersons.length;i++){
    r -= weights[i]
    if (r <= 0) { randomPerson = availablePersons[i]; break }
  }
  const formsForPerson = candidatesByPerson[randomPerson]
  // CRITICAL FIX: For participles, prefer the first (standard) form instead of random selection
  let selectedForm
  if (formsForPerson.length > 1 && formsForPerson[0].mood === 'nonfinite' && formsForPerson[0].tense === 'part') {
    // For participles with multiple forms (e.g. provisto/proveído), always choose the first (standard) one
    selectedForm = formsForPerson[0]
    console.log(`🔧 PARTICIPLE FIX - Selected standard form: ${selectedForm.value} instead of random from [${formsForPerson.map(f => f.value).join(', ')}]`)
  } else {
    selectedForm = formsForPerson[Math.floor(Math.random() * formsForPerson.length)]
  }
  // Enforce clitics percentage in imperativo afirmativo at high levels
  if (selectedForm.mood === 'imperative' && selectedForm.tense === 'impAff' && cliticsPercent > 0) {
    const needClitic = Math.random()*100 < cliticsPercent
    if (needClitic) {
      // Simple heuristic: attach 'me' to 1s/2s targets, else 'se lo'
      const part = selectedForm.value
      const attach = (selectedForm.person === '1s' || selectedForm.person === '2s_tu' || selectedForm.person === '2s_vos') ? 'me' : 'se lo'
      const adjusted = adjustAccentForImperativeWithClitics(selectedForm.lemma, selectedForm.person, part, attach)
      selectedForm = { ...selectedForm, value: adjusted }
    }
  }
  // Update rotation pointer
  if (rot && (randomPerson === '2s_tu' || randomPerson === '2s_vos')) {
    useSettings.getState().set({ nextSecondPerson: randomPerson === '2s_tu' ? '2s_vos' : '2s_tu' })
  }
  
  
  return selectedForm
}

// Apply weighted selection to balance regular vs irregular verbs
function applyWeightedSelection(forms) {
  // Group forms by verb type
  const regularForms = []
  const irregularForms = []
  
  forms.forEach(form => {
  const verb = LEMMA_TO_VERB.get(form.lemma)
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

// Level-based person distribution
function getPersonWeightsForLevel(settings) {
  const level = settings.level || 'B1'
  // Default equal weights
  const base = { '1s':1,'2s_tu':1,'2s_vos':1,'3s':1,'1p':1,'2p_vosotros':0.5,'3p':0.5 }
  if (level === 'A1') {
    return { ...base, '1s':3, '2s_tu':3, '2s_vos':3, '3s':3, '1p':1, '2p_vosotros':0.2, '3p':0.2 }
  }
  if (level === 'A2') {
    return { ...base, '1s':2, '2s_tu':2, '2s_vos':2, '3s':2, '1p':1, '3p':1 }
  }
  if (level === 'B1') {
    return { ...base, '1s':1.5, '2s_tu':1.5, '2s_vos':1.5, '3s':1.2, '1p':1, '3p':1 }
  }
  if (level === 'B2') {
    return { ...base, '1s':1.2, '2s_tu':1.2, '2s_vos':1.2, '3s':1.2, '1p':1, '3p':1, '2p_vosotros': settings.useVosotros ? 1 : 0.2 }
  }
  if (level === 'C1' || level === 'C2') {
    return { ...base, '1s':1, '2s_tu':1, '2s_vos':1, '3s':1, '1p':1, '3p':1, '2p_vosotros': settings.useVosotros ? 1 : 0.2 }
  }
  return base
}

// Increase probability of targeted irregular families per level by duplicating those forms
function applyLevelFormWeighting(forms, settings) {
  const level = settings.level || 'B1'
  const boosted = []
  const pushN = (f, n) => { for (let i=0;i<n;i++) boosted.push(f) }

  for (const f of forms) {
    let weight = 1
    const lemma = f.lemma
    const val = (f.value || '').toLowerCase()
    if (level === 'A2') {
      // -car/-gar/-zar pretérito 1s: busqué, llegué, almorcé
      if (f.mood === 'indicative' && f.tense === 'pretIndef' && f.person === '1s') {
        if (/(qué|gué|cé)$/.test(val)) weight = 2
      }
      // cambios radicales en pretérito (pude, vino, dijo)
      if (f.mood === 'indicative' && f.tense === 'pretIndef' && ['poder','venir','decir','hacer','poner','traer','estar','tener','andar','querer'].includes(lemma)) {
        weight = Math.max(weight, 2)
      }
      // -ir 3s cambio (pidió, durmió)
      if (f.mood === 'indicative' && f.tense === 'pretIndef' && (f.person === '3s' || f.person === '3p') && ['dormir','pedir','seguir','servir','preferir'].includes(lemma)) {
        weight = Math.max(weight, 2)
      }
      // Imperativo afirmativo 2s según dialecto
      if (f.mood === 'imperative' && f.tense === 'impAff' && (f.person === '2s_tu' || f.person === '2s_vos')) {
        weight = Math.max(weight, 2)
      }
    } else if (level === 'B1') {
      // Perfectos (PPC, pluscuamperfecto, futuro compuesto)
      if (f.mood === 'indicative' && (f.tense === 'pretPerf' || f.tense === 'plusc' || f.tense === 'futPerf')) {
        weight = 2
      }
      // Subjuntivo presente
      if (f.mood === 'subjunctive' && f.tense === 'subjPres') {
        weight = Math.max(weight, 2)
      }
      // Imperativo negativo (formas base)
      if (f.mood === 'imperative' && f.tense === 'impNeg') {
        weight = Math.max(weight, 2)
      }
    } else if (level === 'B2') {
      // Subjuntivo imperfecto y pluscuamperfecto
      if (f.mood === 'subjunctive' && (f.tense === 'subjImpf' || f.tense === 'subjPlusc')) {
        weight = 2
      }
      // Condicional compuesto
      if (f.mood === 'conditional' && f.tense === 'condPerf') {
        weight = Math.max(weight, 2)
      }
    } else if (level === 'C1' || level === 'C2') {
      // Clíticos en imperativo afirmativo
      if (f.mood === 'imperative' && f.tense === 'impAff' && /(me|te|se|lo|la|le|nos|los|las|les)$/.test(val.replace(/\s+/g,''))) {
        weight = 2
      }
      if (level === 'C2') {
        // Boost rare-but-alive lemmas
        const rare = settings.c2RareBoostLemmas || []
        if (rare.includes(lemma)) weight = Math.max(weight, 3)
      }
    }
    pushN(f, weight)
  }
  return boosted
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

// Accent rules for imperativo + clíticos (voseo):
// - 2s_vos afirmativo sin clíticos: terminación tónica (hablá, comé, viví)
// - Con un clítico (una sílaba enclítica): se pierde la tilde (hablame, comeme, vivime)
// - Con dos clíticos (dos sílabas enclíticas): vuelve la tilde (hablámelo, comémelo, vivímelo)
// Para 1p/3s/3p se aplica la prosodia general: si la sílaba tónica se desplaza antepenúltima por enclíticos, exigir tilde.
function adjustAccentForImperativeWithClitics(lemma, person, base, clitics) {
  const raw = `${base}${clitics}`.replace(/\s+/g,'')
  if (person === '2s_vos') {
    const encliticSyllables = estimateCliticSyllables(clitics)
    // quitar tildes previas del verbo
    const strip = (s)=> s.normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    const addTildeVos = (s)=> {
      // Añadir tilde en la vocal final según -ar/-er/-ir
      if (/ar$/.test(lemma)) return s.replace(/a(?=[^a]*$)/, 'á')
      if (/er$/.test(lemma)) return s.replace(/e(?=[^e]*$)/, 'é')
      if (/ir$/.test(lemma)) return s.replace(/i(?=[^i]*$)/, 'í')
      return s
    }
    const removeTildeFinal = (s)=> s.replace(/[á]([^á]*)$/,'a$1').replace(/[é]([^é]*)$/,'e$1').replace(/[í]([^í]*)$/,'i$1')
    let core = raw
    // normalizar núcleo verbal (antes de clíticos)
    const verb = base
    if (encliticSyllables === 1) {
      // pierde tilde
      const strippedVerb = strip(verb)
      core = strippedVerb + clitics.replace(/\s+/g,'')
    } else if (encliticSyllables >= 2) {
      // vuelve a llevar tilde
      const strippedVerb = strip(verb)
      const withTilde = addTildeVos(strippedVerb)
      core = withTilde + clitics.replace(/\s+/g,'')
    }
    return core
  }
  // Para otras personas, mantener unión sin cambiar acentos (grader validará tildes obligatorias en C2)
  return raw
}

function estimateCliticSyllables(cl) {
  // Aproximación: me/te/se/lo/la/le = 1 sílaba, nos/los/las/les = 1–2 (tomamos 1), "se lo" ~2
  const s = cl.replace(/\s+/g,'').toLowerCase()
  let count = 0
  const tokens = ['nos','les','las','los','me','te','se','lo','la','le']
  let i = 0
  while (i < s.length) {
    const tok = tokens.find(t => s.slice(i).startsWith(t))
    if (!tok) break
    count += 1
    i += tok.length
  }
  return Math.max(1, count)
}

// Debug function to test A1 regular filtering specifically
export function debugA1RegularFiltering() {
  console.log('=== A1 REGULAR FILTERING DEBUG ===')
  
  const testForms = [
    { lemma: 'hablar', mood: 'indicative', tense: 'pres', person: '2s_vos', value: 'hablás' },
    { lemma: 'comer', mood: 'indicative', tense: 'pres', person: '2s_vos', value: 'comés' },
    { lemma: 'vivir', mood: 'indicative', tense: 'pres', person: '2s_vos', value: 'vivís' },
    { lemma: 'poder', mood: 'indicative', tense: 'pres', person: '2s_vos', value: 'podés' }
  ]
  
  testForms.forEach(form => {
    const verb = LEMMA_TO_VERB.get(form.lemma)
    console.log(`\n${form.lemma}:`)
    console.log(`  - Verb object:`, verb)
    console.log(`  - Verb type:`, verb?.type)
    console.log(`  - Should be included with verbType='regular'?`, verb?.type === 'regular')
  })
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