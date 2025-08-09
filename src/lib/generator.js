import gates from '../data/curriculum.json'
import { useSettings } from '../state/settings.js'
import { verbs } from '../data/verbs.js'

// Debug logging flag for this module
const GEN_DEBUG = false
const clog = (...args) => { if (GEN_DEBUG) console.log(...args) }

// Fast lookups and memo caches
const LEMMA_TO_VERB = new Map(verbs.map(v => [v.lemma, v]))
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
    practiceMode, specificMood, specificTense, practicePronoun, verbType,
    currentBlock
  } = useSettings.getState()
  
  clog('=== GENERATOR DEBUG ===')
  clog('Settings:', { level, useVoseo, useTuteo, useVosotros, practiceMode, specificMood, specificTense, practicePronoun, verbType })
  clog('Total forms available:', forms.length)
  clog('🔍 PRACTICE PRONOUN SETTING:', practicePronoun)
  clog('🔍 DIALECT SETTINGS:', { useVoseo, useTuteo, useVosotros })
  clog('🔍 PRACTICE MODE:', practiceMode)
  clog('🔍 SPECIFIC MOOD/TENSE:', { specificMood, specificTense })
  
  // Debug: Show sample forms
  clog('🔍 Sample forms:', forms.slice(0, 5).map(f => `${f.lemma} ${f.mood} ${f.tense} ${f.person}`))
  
  // Debug: Count nonfinite forms
  const nonfiniteForms = forms.filter(f => f.mood === 'nonfinite')
  clog('🔍 Nonfinite forms count:', nonfiniteForms.length)
  clog('🔍 Gerundios count:', nonfiniteForms.filter(f => f.tense === 'ger').length)
  clog('🔍 Participios count:', nonfiniteForms.filter(f => f.tense === 'part').length)
  
  let eligible = forms.filter(f=>{
    clog(`\n--- Checking form: ${f.lemma} ${f.mood} ${f.tense} ${f.person} ---`)
    
    // Level filtering (O(1) with precomputed set)
    // Determine allowed combos: from current block if set, else level
    const allowed = currentBlock && currentBlock.combos && currentBlock.combos.length
      ? new Set(currentBlock.combos.map(c => `${c.mood}|${c.tense}`))
      : getAllowedCombosForLevel(level)
    if(!allowed.has(`${f.mood}|${f.tense}`)) {
      clog(`❌ Form ${f.lemma} ${f.mood} ${f.tense} filtered out by level gate`)
      return false
    }
    clog(`✅ Level gate passed`)
    
    // Gate futuro de subjuntivo por toggle de producción
    const sAll = useSettings.getState()
    if (f.mood === 'subjunctive' && (f.tense === 'subjFut' || f.tense === 'subjFutPerf')) {
      if (!sAll.enableFuturoSubjProd) {
        clog(`❌ Form ${f.lemma} ${f.mood} ${f.tense} filtered out - subjFut production disabled`)
        return false
      }
    }

    // Person filtering (dialect) - exclude forms not used in the selected dialect
    clog(`🔍 DIALECT FILTERING: ${f.person} - useVoseo=${useVoseo}, useTuteo=${useTuteo}, useVosotros=${useVosotros}`)
    
    // For nonfinite forms (gerundios, participios), skip person filtering - they're invariable
    if (f.mood === 'nonfinite') {
      clog(`✅ Form ${f.lemma} ${f.person} included - nonfinite forms are invariable`)
    } else if (practiceMode === 'specific' && specificMood && specificTense) {
      // For specific practice, show ALL persons but respect dialect
      if (useVoseo && !useTuteo) {
        // Rioplatense: show ALL persons but replace tú with vos, exclude vosotros
        if (f.person === '2s_tu') {
          clog(`❌ Form ${f.lemma} ${f.person} filtered out - rioplatense uses vos instead of tú`)
          return false
        }
        if (f.person === '2p_vosotros') {
          clog(`❌ Form ${f.lemma} ${f.person} filtered out - rioplatense doesn't use vosotros`)
          return false
        }
        // Show ALL other persons (imperative also includes 1p and 3p, exclude 2p_vosotros)
        clog(`✅ Form ${f.lemma} ${f.person} included for rioplatense specific practice`)
      } else if (useTuteo && !useVoseo) {
        // General Latin American: show ALL persons but replace vos with tú, exclude vosotros
        if (f.person === '2s_vos') {
          clog(`❌ Form ${f.lemma} ${f.person} filtered out - general LA uses tú instead of vos`)
          return false
        }
        if (f.person === '2p_vosotros') {
          clog(`❌ Form ${f.lemma} ${f.person} filtered out - general LA doesn't use vosotros`)
          return false
        }
        // Show ALL other persons (imperative also includes 1p and 3p)
        clog(`✅ Form ${f.lemma} ${f.person} included for general LA specific practice`)
      } else if (useVosotros) {
        // Peninsular: show ALL persons but replace vos with tú
        if (f.person === '2s_vos') {
          clog(`❌ Form ${f.lemma} ${f.person} filtered out - peninsular uses tú instead of vos`)
          return false
        }
        // Show ALL other persons
        clog(`✅ Form ${f.lemma} ${f.person} included for peninsular specific practice`)
      } else {
        // Both forms: show ALL persons
        clog(`✅ Form ${f.lemma} ${f.person} included for both forms specific practice`)
      }
    } else {
      // For mixed practice, apply normal dialect filtering
      if(f.person==='2s_vos' && !useVoseo) {
        clog(`❌ Form ${f.lemma} ${f.person} filtered out by voseo setting`)
        return false
      }
      if(f.person==='2s_tu' && !useTuteo) {
        clog(`❌ Form ${f.lemma} ${f.person} filtered out by tuteo setting`)
        return false
      }
      if(f.person==='2p_vosotros' && !useVosotros) {
        clog(`❌ Form ${f.lemma} ${f.person} filtered out by vosotros setting`)
        return false
      }
      clog(`✅ Dialect filtering passed`)
    }
    
    // Pronoun practice filtering - be less restrictive for specific practice
    clog(`🔍 Checking pronoun filtering for ${f.person}, practicePronoun: ${practicePronoun}`)
    if (practiceMode === 'specific' && specificMood && specificTense) {
      // For specific practice, show ALL persons of the selected form
      // Don't filter by practicePronoun at all - show variety
      clog(`✅ Form ${f.lemma} ${f.person} included for specific practice (pronoun filtering bypassed)`)
    } else {
      // For mixed practice, apply normal pronoun filtering
      if (practicePronoun === 'tu_only') {
        if (f.person !== '2s_tu') {
          clog(`❌ Form ${f.lemma} ${f.person} filtered out by tu_only setting`)
          return false
        }
      } else if (practicePronoun === 'vos_only') {
        if (f.person !== '2s_vos') {
          clog(`❌ Form ${f.lemma} ${f.person} filtered out by vos_only setting`)
          return false
        }
      }
      clog(`✅ Pronoun filtering passed`)
    }
    
    // Verb type filtering - check both user selection and MCER level restrictions
    const verb = LEMMA_TO_VERB.get(f.lemma)
    if (!verb) {
      console.log(`❌ Form ${f.lemma} filtered out - verb not found in database`)
      return false
    }
    clog(`🔍 Verb type check: ${f.lemma} is ${verb.type}, verbType setting: ${verbType}`)
    
    // Check MCER level restrictions first
    const isCompoundTense = (f.tense === 'pretPerf' || f.tense === 'plusc' || f.tense === 'futPerf' || f.tense === 'condPerf' || f.tense === 'subjPerf' || f.tense === 'subjPlusc')
    if (!isCompoundTense && f.mood !== 'nonfinite' && !isVerbTypeAllowedForLevel(verb.type, level)) {
      console.log(`❌ Form ${f.lemma} filtered out - ${verb.type} verbs not allowed for level ${level}`)
      return false
    }

    // Additional per-level constraints
    // C1: en presente e indefinido, solo irregulares
    if (level === 'C1') {
      if (f.mood === 'indicative' && (f.tense === 'pres' || f.tense === 'pretIndef')) {
        if (verb.type !== 'irregular') {
          clog(`❌ Form ${f.lemma} filtered out - C1 present/indef only irregulars`)
          return false
        }
      }
    }

    // B2+: bloquear personas imposibles para defectivos/unipersonales
    if (level === 'B2' || level === 'C1' || level === 'C2') {
      const UNIPERSONALES = new Set(['llover','nevar','granizar','amanecer'])
      if (UNIPERSONALES.has(f.lemma)) {
        if (!(f.person === '3s' || f.person === '3p')) {
          clog(`❌ Form ${f.lemma} filtered out - unipersonal person blocked at ${level}`)
          return false
        }
      }
    }
    
    // Restrict lemmas if configured by level/packs
    if (useSettings.getState().allowedLemmas) {
      const set = useSettings.getState().allowedLemmas
      if (!set.has(f.lemma)) {
        clog(`❌ Form ${f.lemma} filtered out - lemma not allowed by level pack`)
        return false
      }
    }

    // Then check user's verb type preference
    // isCompoundTense defined above
    if (verbType === 'regular') {
      if (verb.type !== 'regular') {
        clog(`❌ Form ${f.lemma} filtered out - verb type is ${verb.type}, not regular`)
        return false
      }
    } else if (verbType === 'irregular') {
      // For compound tenses and nonfinite, irregularity is defined by the participle form itself
      if (!isCompoundTense && f.mood !== 'nonfinite' && verb.type !== 'irregular') {
        clog(`❌ Form ${f.lemma} filtered out - verb type is ${verb.type}, not irregular (non-compound)`)
        return false
      }
      // Only include truly irregular forms for the specific category
      const isRegularForm = f.mood === 'nonfinite'
        ? isRegularNonfiniteForm(f.lemma, f.tense, f.value)
        : isRegularFormForMood(f.lemma, f.mood, f.tense, f.person, f.value)
      if (isRegularForm) {
        clog(`❌ Form ${f.lemma} ${f.mood} ${f.tense} filtered out - regular form for irregular practice`)
        return false
      }
    }
    // If verbType is 'all', we only check MCER restrictions (already done above)
    
    // Specific practice filtering
    console.log(`🔍 Specific practice check: mood=${f.mood} vs ${specificMood}, tense=${f.tense} vs ${specificTense}`)
    if(practiceMode === 'specific') {
      if(specificMood && f.mood !== specificMood) {
      clog(`❌ Form ${f.lemma} ${f.mood} filtered out by specific mood ${specificMood}`)
        return false
      }
      
      // Handle mixed options for imperative and nonfinite
      if(specificTense) {
        if(specificTense === 'impMixed') {
          // For mixed imperative, include both affirmative and negative
          if(f.mood !== 'imperative' || (f.tense !== 'impAff' && f.tense !== 'impNeg')) {
            clog(`❌ Form ${f.lemma} ${f.tense} filtered out - not imperative affirmative or negative`)
            return false
          }
        } else if(specificTense === 'nonfiniteMixed') {
          // For mixed nonfinite, include both gerund and participle
          if(f.mood !== 'nonfinite' || (f.tense !== 'ger' && f.tense !== 'part')) {
            clog(`❌ Form ${f.lemma} ${f.tense} filtered out - not nonfinite gerund or participle`)
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
                clog(`❌ Form ${f.lemma} ${f.tense} filtered out - regular form in irregular verb`)
                return false
              }
            }
          }
        } else if(f.tense !== specificTense) {
          clog(`❌ Form ${f.lemma} ${f.tense} filtered out by specific tense ${specificTense}`)
          return false
        }
      }
    }
    
    // Filter out infinitivos from practice (they're not conjugated forms)
    if(f.mood === 'nonfinite' && (f.tense === 'inf' || f.tense === 'infPerf')) {
      clog(`❌ Form ${f.lemma} ${f.tense} filtered out - infinitivos are not for practice`)
      return false
    }
    
    console.log(`✅ Form ${f.lemma} ${f.mood} ${f.tense} ${f.person} PASSED all filters`)
    return true
  })
  
  // Debug logging
  clog('Filtering results:', {
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
  clog('🎯 INCLUDED PERSONS:', includedPersons)
  clog('🎯 SAMPLE FORMS:', eligible.slice(0, 5).map(f => `${f.lemma} ${f.person}`))
  clog('🎯 TOTAL ELIGIBLE FORMS:', eligible.length)
  clog('🎯 ALL PERSONS IN ELIGIBLE:', eligible.map(f => f.person))
  
  // Check if we have any eligible forms
  if (eligible.length === 0) {
    // Failsafe: relax filters progressively to always return something
    let fallback = forms.filter(f => getAllowedCombosForLevel(level).has(`${f.mood}|${f.tense}`))
    if (specificMood) fallback = fallback.filter(f => f.mood === specificMood)
    if (specificTense) fallback = fallback.filter(f => f.tense === specificTense)
    // Respect dialect minimally for conjugated forms
    fallback = fallback.filter(f => f.mood === 'nonfinite' || ['1s','2s_tu','2s_vos','3s','1p','2p_vosotros','3p'].includes(f.person))
    // If still empty, drop tense constraint
    if (fallback.length === 0 && specificTense) {
      fallback = forms.filter(f => f.mood === specificMood)
    }
    // If still empty, drop mood constraint
    if (fallback.length === 0 && specificMood) {
      fallback = forms
    }
    // As last resort, return any form
    return fallback[0] || null
  }
  
  // Apply weighted selection for "all" verb types to balance regular vs irregular per level
  if (verbType === 'all') {
    eligible = applyWeightedSelection(eligible)
  }

  // Apply level-driven morphological focus weighting (duplicate entries to increase frequency)
  eligible = applyLevelFormWeighting(eligible, useSettings.getState())

  // C2 conmutación: asegurar variedad pero sin ocultar otras personas
  // Suavizamos: priorizamos la persona objetivo si existe, pero mantenemos el resto disponible
  const st = useSettings.getState()
  if (st.enableC2Conmutacion && level === 'C2' && eligible.length > 0) {
    const base = eligible[Math.floor(Math.random() * eligible.length)]
    const seq = st.conmutacionSeq || ['2s_vos','3p','3s']
    const idx = st.conmutacionIdx || 0
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
  
  clog('🎯 ACCURACY DEBUG:')
  clog('🎯 Lowest accuracy:', lowestAcc)
  clog('🎯 Candidates with lowest accuracy:', candidates.length)
  clog('🎯 Sample candidates:', candidates.slice(0, 5).map(f => `${f.lemma} ${f.person} (acc: ${acc(f, history)})`))
  clog('🎯 All candidates persons:', [...new Set(candidates.map(f => f.person))])
  
  // Balance selection by person to ensure variety
  const personsInCandidates = [...new Set(candidates.map(f => f.person))]
  clog('🎯 Persons in candidates:', personsInCandidates)
  
  // Group candidates by person
  const candidatesByPerson = {}
  personsInCandidates.forEach(person => {
    candidatesByPerson[person] = candidates.filter(f => f.person === person)
  })
  
  clog('🎯 Candidates by person:', Object.fromEntries(
    Object.entries(candidatesByPerson).map(([person, forms]) => [person, forms.length])
  ))
  
  // Select a person using level-based weights, then a random form from that person
  const personWeights = getPersonWeightsForLevel(useSettings.getState())
  const availablePersons = personsInCandidates
  // Optional rotation of second person at high levels
  const rot = useSettings.getState().rotateSecondPerson
  const next2 = useSettings.getState().nextSecondPerson
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
  let selectedForm = formsForPerson[Math.floor(Math.random() * formsForPerson.length)]
  // Enforce clitics percentage in imperativo afirmativo at high levels
  const s = useSettings.getState()
  if (selectedForm.mood === 'imperative' && selectedForm.tense === 'impAff' && s.cliticsPercent > 0) {
    const needClitic = Math.random()*100 < s.cliticsPercent
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
  
  clog('🎯 Selected person:', randomPerson)
  clog('🎯 Forms available for selected person:', formsForPerson.length)
  
  clog('✅ Selected form:', selectedForm)
  clog('=== END GENERATOR DEBUG ===')
  
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

  // Helper: detect regular participle inside periphrastic perfect forms
  const isRegularPerfectWithParticiple = () => {
    // Assume last token is the participle
    const tokens = normalizedValue.trim().split(/\s+/)
    const part = tokens[tokens.length - 1] || ''
    if (normalizedLemma.endsWith('ar')) {
      return part === normalizedLemma.replace(/ar$/, 'ado')
    }
    if (normalizedLemma.endsWith('er')) {
      return part === normalizedLemma.replace(/er$/, 'ido')
    }
    if (normalizedLemma.endsWith('ir')) {
      return part === normalizedLemma.replace(/ir$/, 'ido')
    }
    return false
  }
  
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
      if (tense === 'pretPerf' || tense === 'plusc' || tense === 'futPerf') {
        return isRegularPerfectWithParticiple()
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
      if (tense === 'pretPerf' || tense === 'plusc' || tense === 'futPerf') {
        return isRegularPerfectWithParticiple()
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
      if (tense === 'pretPerf' || tense === 'plusc' || tense === 'futPerf') {
        return isRegularPerfectWithParticiple()
      }
    }
    if (mood === 'imperative') {
      if (tense === 'impAff') {
        if (person === '2s_tu' && normalizedValue === normalize(lemma.replace('ir', 'e'))) return true
        // Voseo afirmativo regular en verbos -ir termina en -í (viví), no -é
        if (person === '2s_vos' && normalizedValue === normalize(lemma.replace('ir', 'í'))) return true
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
        if (tense === 'subjPerf' || tense === 'subjPlusc') {
          return isRegularPerfectWithParticiple()
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
        if (tense === 'subjPerf' || tense === 'subjPlusc') {
          return isRegularPerfectWithParticiple()
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
        if (tense === 'subjPerf' || tense === 'subjPlusc') {
          return isRegularPerfectWithParticiple()
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
      if (tense === 'condPerf') {
        return isRegularPerfectWithParticiple()
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