import { useState } from 'react'
import gates from '../data/curriculum.json'
import { verbs } from '../data/verbs.js'
import { useSettings } from '../state/settings.js'
import { chooseNext } from '../lib/core/generator.js'
import { getDueItems, updateSchedule } from '../lib/progress/srs.js'
import { gateFormsByCurriculumAndDialect, gateDueItemsByCurriculum } from '../lib/core/curriculumGate.js'
import { getCurrentUserId } from '../lib/progress/userManager.js'
import { getNextRecommendedItem } from '../lib/progress/AdaptivePracticeEngine.js'
import { shouldAdjustDifficulty, getRecommendedAdjustments } from '../lib/progress/DifficultyManager.js'
import { debugLevelPrioritization } from '../lib/core/levelDrivenPrioritizer.js'
import { getCoachingRecommendations, getMotivationalInsights } from '../lib/progress/personalizedCoaching.js'
import { flowDetector, processUserResponse } from '../lib/progress/flowStateDetection.js'
import { momentumTracker, processResponseForMomentum } from '../lib/progress/momentumTracker.js'
import { confidenceEngine, processResponseForConfidence } from '../lib/progress/confidenceEngine.js'
import { temporalIntelligence, processSessionForTempo } from '../lib/progress/temporalIntelligence.js'
import { dynamicGoalsSystem, processResponseForGoals } from '../lib/progress/dynamicGoals.js'

export function useDrillMode() {
  const [currentItem, setCurrentItem] = useState(null)
  const [history, setHistory] = useState({})
  const settings = useSettings()

  // Generate the next item based on current settings
  const generateNextItem = async (itemToExclude = null, allFormsForRegion, getAvailableMoodsForLevel, getAvailableTensesForLevelAndMood) => {
    console.log('🎯 GENERATE NEXT ITEM - Starting with settings:', {
      verbType: settings.verbType,
      selectedFamily: settings.selectedFamily,
      practiceMode: settings.practiceMode,
      specificMood: settings.specificMood,
      specificTense: settings.specificTense,
      level: settings.level,
      itemToExclude: itemToExclude?.lemma
    })
    
    // CRITICAL DEBUG: For specific practice mode
    if (settings.practiceMode === 'specific') {
      console.log('🚨 DRILL MODE SPECIFIC PRACTICE - Full settings check:', {
        practiceMode: settings.practiceMode,
        specificMood: settings.specificMood,
        specificTense: settings.specificTense,
        hasValidConfig: !!(settings.specificMood && settings.specificTense)
      })
    }
    
    // LEVEL-AWARE DEBUG: Show level prioritization for debugging
    if (settings.level && import.meta.env?.DEV) {
      try {
        debugLevelPrioritization(settings.level)
      } catch (e) {
        console.warn('Level prioritization debug failed:', e)
      }
    }
    
    // 🚨 USER-FIRST LOGIC: Specific practice has ABSOLUTE PRIORITY
    let nextForm = null
    let selectionMethod = 'standard'
    
    // Define variables in outer scope to avoid scope issues
    const userId = getCurrentUserId()
    const isSpecific = settings.practiceMode === 'specific' && settings.specificMood && settings.specificTense
    const specificMood = isSpecific ? settings.specificMood : null
    const specificTense = isSpecific ? settings.specificTense : null
    
    // 🎯 CRITICAL: For specific practice, filter forms FIRST, then apply algorithms
    let eligibleForms = allFormsForRegion
    
    try {
      
      if (isSpecific) {
        console.log('🚨 SPECIFIC PRACTICE - User selection:', { specificMood, specificTense })
        
        // STEP 1: Filter forms to ONLY those matching user selection
        eligibleForms = allFormsForRegion.filter(f => {
          // Handle mixed tenses
          if (specificTense === 'impMixed') {
            return f.mood === specificMood && (f.tense === 'impAff' || f.tense === 'impNeg')
          }
          if (specificTense === 'nonfiniteMixed') {
            return f.mood === specificMood && (f.tense === 'ger' || f.tense === 'part')
          }
          // Standard specific filtering
          return f.mood === specificMood && f.tense === specificTense
        })
        
        console.log('🚨 SPECIFIC PRACTICE - Filtered forms:', {
          total: allFormsForRegion.length,
          eligible: eligibleForms.length,
          sample: eligibleForms.slice(0, 3).map(f => `${f.lemma}-${f.mood}-${f.tense}`)
        })
        
        // CRITICAL VALIDATION: Ensure we have eligible forms
        if (eligibleForms.length === 0) {
          console.error('❌ CRITICAL: No forms found for specific practice:', { specificMood, specificTense })
          throw new Error(`No forms available for ${specificMood} ${specificTense}. Check your configuration.`)
        }
      }

      // Tier 1: SRS due cells (now working within eligible forms)
      let dueCells = userId ? await getDueItems(userId, new Date()) : []
      // Gate due cells by curriculum (unless practicing by theme)
      dueCells = gateDueItemsByCurriculum(dueCells, settings)
      // Filter due cells by the same specific practice constraints (if any)
      if (isSpecific) {
        dueCells = dueCells.filter(dc => {
          if (!dc) return false
          if (specificTense === 'impMixed') {
            return dc.mood === specificMood && (dc.tense === 'impAff' || dc.tense === 'impNeg')
          }
          if (specificTense === 'nonfiniteMixed') {
            return dc.mood === specificMood && (dc.tense === 'ger' || dc.tense === 'part')
          }
          return dc.mood === specificMood && dc.tense === specificTense
        })
      }
      const pickFromDue = dueCells.find(Boolean)
      if (pickFromDue) {
        // CRITICAL: Use eligibleForms instead of allFormsForRegion
        const candidateForms = eligibleForms.filter(f =>
          f.mood === pickFromDue.mood && f.tense === pickFromDue.tense && f.person === pickFromDue.person
        )
        if (candidateForms.length > 0) {
          nextForm = candidateForms[Math.floor(Math.random() * candidateForms.length)]
          selectionMethod = 'srs_due'
          console.log('📅 SRS Due item selected:', `${nextForm.mood}/${nextForm.tense}`)
          
          if (isSpecific) {
            console.log('🚨 SRS VALIDATION - Selected form matches specific practice:', {
              selected: `${nextForm.mood}/${nextForm.tense}`,
              expected: `${specificMood}/${specificTense}`,
              matches: nextForm.mood === specificMood && nextForm.tense === specificTense
            })
          }
        }
      }
      
      // Tier 2: Enhanced Adaptive recommendations (now level-aware)
      if (!nextForm) {
        try {
          // Pass user level to adaptive recommendations
          const recommendation = await getNextRecommendedItem(settings.level)
          if (recommendation && recommendation.targetCombination) {
            const { mood, tense, verbId, priority, category } = recommendation.targetCombination
            
            // Enhanced logging for level-aware recommendations
            console.log('🤖 Level-aware recommendation received:', {
              type: recommendation.type,
              mood,
              tense,
              priority,
              category,
              reason: recommendation.reason,
              userLevel: settings.level
            })
            
            // SIMPLIFIED: Work only within eligibleForms (already filtered for specific practice)
            let candidateForms = eligibleForms.filter(f => 
              f.mood === mood && f.tense === tense
            )
            
            // If specific verb recommended, prioritize it
            if (verbId) {
              const specificVerbForms = candidateForms.filter(f => f.lemma === verbId)
              if (specificVerbForms.length > 0) {
                candidateForms = specificVerbForms
              }
            }
            
            if (candidateForms.length > 0) {
              nextForm = candidateForms[Math.floor(Math.random() * candidateForms.length)]
              selectionMethod = 'adaptive_recommendation'
              
              if (isSpecific) {
                console.log('🚨 ADAPTIVE VALIDATION - Selected form matches specific practice:', {
                  selected: `${nextForm.mood}/${nextForm.tense}`,
                  expected: `${specificMood}/${specificTense}`,
                  matches: nextForm.mood === specificMood && nextForm.tense === specificTense
                })
              }
            } else if (isSpecific) {
              console.log('❌ Adaptive recommendation has no eligible forms for specific practice')
            }
          } else {
            console.log('🤖 No adaptive recommendation available')
          }
        } catch (e) {
          console.warn('Adaptive recommendation failed:', e)
        }
      }
    } catch (e) {
      console.warn('Advanced selection failed; falling back to standard generator', e)
    }

      // Tier 3: Standard generator (now working within eligible forms)
    if (!nextForm) {
      // Gate forms systemically before selection
      const gated = gateFormsByCurriculumAndDialect(eligibleForms, settings)
      nextForm = chooseNext({ forms: gated, history, currentItem: itemToExclude })
      selectionMethod = 'standard_generator'
      console.log('🎯 Standard generator applied to eligible forms:', eligibleForms.length)
      
      if (isSpecific && nextForm) {
        console.log('🚨 STANDARD VALIDATION - Selected form matches specific practice:', {
          selected: `${nextForm.mood}/${nextForm.tense}`,
          expected: `${specificMood}/${specificTense}`,
          matches: nextForm.mood === specificMood && nextForm.tense === specificTense
        })
      }
    }
    
    // 🚨 STRENGTHENED INTEGRITY GUARDS: Final validation
    const region = settings.region
    const pronounMode = settings.practicePronoun

    // Helper: cumulative combos allowed up to the user's level
    const levelOrder = (L) => ['A1','A2','B1','B2','C1','C2','ALL'].indexOf(L)
    const getAllowedCombosForLevel = (level) => {
      if (!level) return new Set()
      if (level === 'ALL') return new Set(gates.map(g => `${g.mood}|${g.tense}`))
      const maxIdx = levelOrder(level)
      return new Set(
        gates
          .filter(g => levelOrder(g.level) <= maxIdx)
          .map(g => `${g.mood}|${g.tense}`)
      )
    }
    
    const allowsPerson = (person) => {
      // Always enforce dialectal constraints regardless of pronounMode
      if (region === 'rioplatense') return person !== '2s_tu' && person !== '2p_vosotros'
      if (region === 'la_general') return person !== '2s_vos' && person !== '2p_vosotros'
      if (region === 'peninsular') return person !== '2s_vos'
      // If region not set, optionally apply pronoun filters
      if (pronounMode === 'tu_only') return person === '2s_tu'
      if (pronounMode === 'vos_only') return person === '2s_vos'
      return true
    }
    
    const matchesSpecific = (form) => {
      if (!isSpecific) return true
      if (specificTense === 'impMixed') return form.mood === specificMood && (form.tense === 'impAff' || form.tense === 'impNeg')
      if (specificTense === 'nonfiniteMixed') return form.mood === specificMood && (form.tense === 'ger' || form.tense === 'part')
      return form.mood === specificMood && form.tense === specificTense
    }
    
    // CRITICAL: Level validation - check if tense is allowed for current level
    const allowsLevel = (form) => {
      const userLevel = settings.level || 'A1'
      const allowed = getAllowedCombosForLevel(userLevel)
      return allowed.has(`${form.mood}|${form.tense}`)
    }
    
    // CRITICAL VALIDATION: This should NEVER trigger if our logic is correct
    if (nextForm && (!matchesSpecific(nextForm) || !allowsPerson(nextForm.person) || !allowsLevel(nextForm))) {
      console.error('🚨 INTEGRITY GUARD TRIGGERED - Algorithm produced invalid form!', {
        selected: nextForm ? `${nextForm.mood}/${nextForm.tense}/${nextForm.person}` : 'null',
        expected: isSpecific ? `${specificMood}/${specificTense}` : 'any',
        method: selectionMethod,
        level: settings.level,
        levelValid: allowsLevel(nextForm)
      })
      
      // ENHANCED FALLBACK: Try multiple fallback strategies
      nextForm = await tryIntelligentFallback(settings, eligibleForms, {
        specificMood, specificTense, isSpecific, matchesSpecific, allowsPerson, allowsLevel
      })
      
      if (nextForm) {
        selectionMethod += '+intelligent_fallback'
        console.log('✅ Intelligent fallback succeeded:', `${nextForm.mood}/${nextForm.tense}`)
      } else {
        // If all fallbacks fail, switch to mixed practice as last resort
        console.warn('⚠️ FALLBACK TO MIXED PRACTICE - Specific practice not available')
        return fallbackToMixedPractice(allFormsForRegion, settings)
      }
    }

    console.log('🎯 Final selection method:', selectionMethod)
    
    // COACHING INSIGHTS: Periodically show coaching recommendations
    if (Math.random() < 0.1 && settings.level) { // 10% chance
      try {
        const insights = await getMotivationalInsights(settings.level)
        if (insights.length > 0) {
          console.log('💡 Coaching insight:', insights[0])
        }
      } catch (e) {
        console.warn('Coaching insights failed:', e)
      }
    }
    
    console.log('🎯 GENERATE NEXT ITEM - chooseNext returned:', nextForm ? {
      lemma: nextForm.lemma,
      mood: nextForm.mood,
      tense: nextForm.tense,
      person: nextForm.person
    } : null)
    
    // CRITICAL DEBUG: Show if the returned form matches specific settings
    if (settings.practiceMode === 'specific' && nextForm) {
      console.log('🚨 FINAL FORM CHECK - Does it match specific practice?', {
        returnedMood: nextForm.mood,
        expectedMood: settings.specificMood,
        moodMatches: nextForm.mood === settings.specificMood,
        returnedTense: nextForm.tense,
        expectedTense: settings.specificTense,
        tenseMatches: nextForm.tense === settings.specificTense
      })
    }
    
    if (nextForm && nextForm.mood && nextForm.tense) {
      // Canonicalize forms to ensure exact dataset alignment
      const canonicalFromPool = (lemma, mood, tense, person) => {
        try {
          return (eligibleForms || allFormsForRegion).find(f => 
            f.lemma === lemma && f.mood === mood && f.tense === tense && f.person === person
          ) || null
        } catch { return null }
      }
      // Force a new object to ensure React detects the change
      // CRITICAL: Include complete verb information for new irregularity system
      const parentVerb = verbs.find(v => v.lemma === nextForm.lemma) || {}
      const newItem = {
        id: Date.now(), // Unique identifier to force re-render
        lemma: nextForm.lemma,
        mood: nextForm.mood,
        tense: nextForm.tense,
        person: nextForm.person,
        // NEW IRREGULARITY SYSTEM: Include complete verb information
        type: parentVerb.type || nextForm.type,
        irregularTenses: parentVerb.irregularTenses || [],
        irregularityMatrix: parentVerb.irregularityMatrix || {},
        form: (() => {
          const c = canonicalFromPool(nextForm.lemma, nextForm.mood, nextForm.tense, nextForm.person)
          const base = c || nextForm
          return {
            value: base.value || base.form,
            lemma: base.lemma,
            mood: base.mood,
            tense: base.tense,
            person: base.person,
            alt: base.alt || [],
            accepts: base.accepts || {}
          }
        })(),
        settings: { 
          ...settings,
          // CRITICAL FIX: Auto-activate dialect-specific settings based on form person
          useVoseo: settings.useVoseo || nextForm.person?.includes('vos') || nextForm.person === '2s_vos',
          useTuteo: settings.useTuteo || nextForm.person?.includes('tu') || nextForm.person === '2s_tu',
          useVosotros: settings.useVosotros || nextForm.person?.includes('vosotros') || nextForm.person === '2p_vosotros'
        } // Include settings for grading
      }
      
      // Debug logging for voseo item generation
      if (settings.useVoseo || nextForm.person?.includes('vos') || (nextForm.accepts && nextForm.accepts.vos)) {
        console.log('🔧 VOSEO DEBUG - Item generation:')
        console.log('  NextForm from generator:', nextForm)
        console.log('  Settings passed:', settings)
        console.log('  Generated item form:', newItem.form)
        console.log('  useVoseo setting:', settings.useVoseo)
        console.log('  Person:', nextForm.person)
        console.log('  Accepts:', nextForm.accepts)
      }

      // Handle double mode (complex logic for pairing two forms)
      if (settings.doubleActive) {
        try {
          const lvl = settings.level || 'B1'
          
          // 1. Get all available forms for the level
          const levelForms = allFormsForRegion.filter(f => {
            const allowedMoods = getAvailableMoodsForLevel(lvl)
            const allowedTenses = getAvailableTensesForLevelAndMood(lvl, f.mood)
            return allowedMoods.includes(f.mood) && allowedTenses.includes(f.tense)
          })
          
          // 2. Group forms by verb (lemma)
          const formsByVerb = new Map()
          for (const f of levelForms) {
            if (!formsByVerb.has(f.lemma)) {
              formsByVerb.set(f.lemma, [])
            }
            formsByVerb.get(f.lemma).push(f)
          }
          
          // 3. Find verbs that have at least 2 forms with different mood+tense combinations
          const validVerbs = []
          for (const [lemma, forms] of formsByVerb.entries()) {
            const uniqueCombos = new Set()
            for (const form of forms) {
              uniqueCombos.add(`${form.mood}|${form.tense}`)
            }
            if (uniqueCombos.size >= 2) {
              validVerbs.push({ lemma, forms, uniqueCombos: uniqueCombos.size })
            }
          }
          
          // 4. Select a random verb from valid ones
          if (validVerbs.length > 0) {
            // Sort by number of unique combinations (prefer verbs with more variety)
            validVerbs.sort((a, b) => b.uniqueCombos - a.uniqueCombos)
            
            // Take one of the first verbs (with more variety)
            const selectedVerb = validVerbs[Math.floor(Math.random() * Math.min(3, validVerbs.length))]
            const verbForms = selectedVerb.forms
            
            // 5. Create map of unique mood+tense combinations for this verb
            const uniqueCombos = new Map()
            for (const f of verbForms) {
              const key = `${f.mood}|${f.tense}`
              if (!uniqueCombos.has(key)) {
                uniqueCombos.set(key, [])
              }
              uniqueCombos.get(key).push(f)
            }
            
            // 6. Select two different combinations
            const comboKeys = Array.from(uniqueCombos.keys())
            if (comboKeys.length >= 2) {
              // Shuffle combinations
              for (let i = comboKeys.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1))
                ;[comboKeys[i], comboKeys[j]] = [comboKeys[j], comboKeys[i]]
              }
              
              // Take first two different combinations
              const firstCombo = comboKeys[0]
              const secondCombo = comboKeys[1]
              
              // 7. Get forms from each combination (same verb)
              const firstForms = uniqueCombos.get(firstCombo)
              const secondForms = uniqueCombos.get(secondCombo)
              
              if (firstForms && secondForms) {
                // Select random forms from each combination
                const firstForm = firstForms[Math.floor(Math.random() * firstForms.length)]
                const secondForm = secondForms[Math.floor(Math.random() * secondForms.length)]
                
                // FINAL VERIFICATION: ensure they're from the SAME VERB and DIFFERENT combinations
                if (firstForm.lemma === secondForm.lemma && 
                    (firstForm.mood !== secondForm.mood || firstForm.tense !== secondForm.tense)) {
                  
                  // Update main item
                  newItem.lemma = firstForm.lemma
                  newItem.mood = firstForm.mood
                  newItem.tense = firstForm.tense
                  newItem.person = firstForm.person
                  {
                    const c1 = canonicalFromPool(firstForm.lemma, firstForm.mood, firstForm.tense, firstForm.person) || firstForm
                    newItem.form = {
                      value: c1.value || c1.form,
                      lemma: c1.lemma,
                      mood: c1.mood,
                      tense: c1.tense,
                      person: c1.person,
                      alt: c1.alt || [],
                      accepts: c1.accepts || {}
                    }
                  }
                  
                  // Add second form
                  {
                    const c2 = canonicalFromPool(secondForm.lemma, secondForm.mood, secondForm.tense, secondForm.person) || secondForm
                    newItem.secondForm = {
                      value: c2.value || c2.form,
                      lemma: c2.lemma,
                      mood: c2.mood,
                      tense: c2.tense,
                      person: c2.person,
                      alt: c2.alt || [],
                      accepts: c2.accepts || {}
                    }
                  }
                } else {
                  // EMERGENCY FALLBACK: try another valid verb
                  const fallbackVerb = validVerbs.find(v => v.lemma !== selectedVerb.lemma)
                  if (fallbackVerb) {
                    // Recursively try with another verb
                    setTimeout(() => generateNextItem(itemToExclude, allFormsForRegion, getAvailableMoodsForLevel, getAvailableTensesForLevelAndMood), 100)
                    return
                  }
                }
              }
            }
          }
        } catch (e) {
          console.warn('Double mode pairing error:', e)
        }
      }

      setCurrentItem(newItem)
    } else {
      console.error('❌ No valid form found! Settings:', {
        verbType: settings.verbType,
        selectedFamily: settings.selectedFamily,
        specificMood: settings.specificMood,
        specificTense: settings.specificTense,
        level: settings.level,
        useVoseo: settings.useVoseo,
        allFormsCount: allFormsForRegion.length
      })
      
      // Show a user-friendly error instead of infinite retry
      setCurrentItem({
        id: Date.now(),
        error: true,
        message: 'No hay suficientes verbos disponibles para esta combinación. Por favor, intenta con diferentes configuraciones.'
      })
    }
  }

  const handleDrillResult = async (result) => {
    // Only update history if it's not an accent error
    if (!result.isAccentError) {
      const key = `${currentItem.mood}:${currentItem.tense}:${currentItem.person}:${currentItem.form.value}`
      setHistory(prev => ({
        ...prev,
        [key]: {
          seen: (prev[key]?.seen || 0) + 1,
          correct: (prev[key]?.correct || 0) + (result.correct ? 1 : 0),
          lastAttempt: Date.now(),
          latency: result.latency || 0
        }
      }))
    }

    // FLOW STATE DETECTION: Process user response for emotional intelligence
    try {
      const flowResponse = processUserResponse({
        isCorrect: result.correct,
        responseTime: result.latency || 0,
        hintsUsed: result.hintsUsed || 0,
        difficulty: currentItem.difficulty || 'medium',
        sessionContext: {
          totalResponses: Object.values(history).reduce((sum, item) => sum + item.seen, 0) + 1,
          recentAccuracy: Object.values(history).slice(-10).reduce((sum, item) => sum + (item.correct / item.seen), 0) / Math.min(10, Object.keys(history).length)
        }
      })
      
      if (flowResponse) {
        console.log('🔥 Flow state update:', {
          state: flowResponse.state,
          confidence: Math.round(flowResponse.confidence * 100) + '%',
          recommendation: flowResponse.recommendation
        })
      }
    } catch (e) {
      console.warn('Flow state detection failed:', e)
    }

    // MOMENTUM TRACKING: Analyze emotional patterns
    try {
      const momentumUpdate = processResponseForMomentum({
        isCorrect: result.correct,
        responseTime: result.latency || 0,
        timestamp: Date.now(),
        difficulty: currentItem.difficulty || 'medium',
        previousMomentum: momentumTracker.getCurrentMomentum()
      })
      
      if (momentumUpdate) {
        console.log('📈 Momentum update:', {
          type: momentumUpdate.type,
          score: Math.round(momentumUpdate.score * 100) + '%',
          insight: momentumUpdate.insight
        })
      }
    } catch (e) {
      console.warn('Momentum tracking failed:', e)
    }

    // CONFIDENCE ENGINE: Analyze response patterns for confidence building
    try {
      const confidenceUpdate = processResponseForConfidence({
        isCorrect: result.correct,
        responseTime: result.latency || 0,
        verb: currentItem.lemma,
        mood: currentItem.mood,
        tense: currentItem.tense,
        person: currentItem.person,
        hintsUsed: result.hintsUsed || 0,
        previousAttempts: result.previousAttempts || 0,
        sessionContext: {
          totalResponses: Object.values(history).reduce((sum, item) => sum + item.seen, 0) + 1,
          currentStreak: result.correct ? (currentItem.streak || 0) + 1 : 0
        }
      })
      
      if (confidenceUpdate && confidenceUpdate.recommendations.length > 0) {
        console.log('🎯 Confidence analysis:', {
          level: confidenceUpdate.level,
          overall: Math.round(confidenceUpdate.overall * 100) + '%',
          category: Math.round(confidenceUpdate.category * 100) + '%',
          calibration: Math.round(confidenceUpdate.calibration * 100) + '%',
          recommendations: confidenceUpdate.recommendations.map(r => r.message)
        })
      }
    } catch (e) {
      console.warn('Confidence engine failed:', e)
    }

    // DYNAMIC GOALS SYSTEM: Update micro-objectives based on performance
    try {
      const goalsUpdate = processResponseForGoals({
        isCorrect: result.correct,
        responseTime: result.latency || 0,
        verb: currentItem.lemma,
        mood: currentItem.mood,
        tense: currentItem.tense,
        person: currentItem.person,
        currentStreak: result.correct ? (currentItem.streak || 0) + 1 : 0,
        sessionStartTime: result.sessionStartTime,
        recentAccuracy: Object.values(history).length > 0 ? 
          Object.values(history).slice(-10).reduce((sum, item) => sum + (item.correct / item.seen), 0) / Math.min(10, Object.keys(history).length) : 0.5
      })
      
      if (goalsUpdate && goalsUpdate.completedGoals.length > 0) {
        console.log('🏆 Goals completed!', goalsUpdate.completedGoals.map(g => ({
          name: g.name,
          points: g.pointsAwarded,
          badge: g.badge?.name
        })))
      }
      
      if (goalsUpdate && goalsUpdate.goalUpdates.length > 0) {
        const importantUpdates = goalsUpdate.goalUpdates.filter(u => u.isComplete || Math.random() < 0.3)
        importantUpdates.forEach(update => {
          console.log('🔄 Goal update:', update.message)
        })
      }
    } catch (e) {
      console.warn('Dynamic goals system failed:', e)
    }
    
    // Update SRS schedule for the practiced cell
    try {
      const userId = getCurrentUserId()
      if (userId && currentItem && currentItem.mood && currentItem.tense && currentItem.person) {
        await updateSchedule(userId, { 
          mood: currentItem.mood, 
          tense: currentItem.tense, 
          person: currentItem.person 
        }, !!result.correct, result.hintsUsed || 0)
      }
    } catch (e) {
      console.warn('SRS schedule update failed:', e)
    }

    // Adaptive difficulty assessment (asynchronous, non-blocking)
    try {
      const userId = getCurrentUserId()
      if (userId) {
        // Collect session performance data for difficulty assessment
        const sessionData = {
          recentCorrect: Object.values(history).reduce((sum, item) => sum + item.correct, 0),
          recentErrors: Object.values(history).reduce((sum, item) => sum + (item.seen - item.correct), 0),
          currentStreak: result.correct ? (currentItem.streak || 0) + 1 : 0,
          averageTime: Object.values(history)
            .filter(item => item.latency)
            .reduce((sum, item, _, arr) => sum + item.latency / arr.length, 0)
        }

        // Check if difficulty should be adjusted (non-blocking)
        const shouldAdjust = await shouldAdjustDifficulty(sessionData)
        if (shouldAdjust) {
          const adjustments = await getRecommendedAdjustments(sessionData)
          console.log('🎛️ Difficulty adjustment recommended:', adjustments)
          
          // Note: In a full implementation, these adjustments would be applied
          // to the settings or stored for the next session
        }
      }
    } catch (e) {
      console.warn('Adaptive difficulty assessment failed:', e)
    }
    
    // NO generate next item automatically
  }

  const handleContinue = (allFormsForRegion, getAvailableMoodsForLevel, getAvailableTensesForLevelAndMood) => {
    // Generate next item when user clicks "Continue"
    // Decrement block counter if active
    if (settings.currentBlock && typeof settings.currentBlock.itemsRemaining === 'number') {
      const n = settings.currentBlock.itemsRemaining - 1
      if (n <= 0) {
        settings.set({ currentBlock: null })
      } else {
        settings.set({ currentBlock: { ...settings.currentBlock, itemsRemaining: n } })
      }
    }
    generateNextItem(currentItem, allFormsForRegion, getAvailableMoodsForLevel, getAvailableTensesForLevelAndMood)
  }

  const clearHistoryAndRegenerate = (allFormsForRegion, getAvailableMoodsForLevel, getAvailableTensesForLevelAndMood) => {
    setHistory({})
    setCurrentItem(null)
    generateNextItem(null, allFormsForRegion, getAvailableMoodsForLevel, getAvailableTensesForLevelAndMood)
  }

  // NEW: Level-driven coaching and insights functions
  const getCoachingInsights = async () => {
    try {
      if (!settings.level) return { recommendations: [], insights: [] }
      
      const [recommendations, insights] = await Promise.all([
        getCoachingRecommendations(settings.level),
        getMotivationalInsights(settings.level)
      ])
      
      return { recommendations, insights }
    } catch (error) {
      console.error('Failed to get coaching insights:', error)
      return { recommendations: [], insights: [] }
    }
  }

  const debugCurrentLevelPrioritization = () => {
    if (settings.level && import.meta.env?.DEV) {
      console.log(`\n🔍 DEBUG: Level prioritization for ${settings.level}`)
      debugLevelPrioritization(settings.level)
      
      // Show current user's context
      console.log('Current drill context:', {
        level: settings.level,
        practiceMode: settings.practiceMode,
        verbType: settings.verbType,
        historySize: Object.keys(history).length,
        currentTense: currentItem ? `${currentItem.mood}/${currentItem.tense}` : 'none'
      })
    }
  }

  // Get current flow state and momentum for UI display
  const getCurrentFlowState = () => {
    try {
      const state = flowDetector.getCurrentState()
      const momentum = momentumTracker.getCurrentMomentum()
      const confidenceState = confidenceEngine.getCurrentConfidenceState()
      const temporalState = temporalIntelligence.getCurrentTemporalStats()
      const goalsState = dynamicGoalsSystem.getCurrentGoalsState()
      const metrics = {
        confidence: flowDetector.getConfidenceLevel(),
        currentStreak: flowDetector.getCurrentStreak(),
        flowPercentage: Math.round(flowDetector.getFlowPercentage()),
        consistencyScore: Math.round(flowDetector.getConsistencyScore() * 100),
        sessionDuration: flowDetector.getSessionDuration(),
        totalResponses: flowDetector.getTotalResponses(),
        deepFlowSessions: flowDetector.getDeepFlowSessions(),
        // Confidence metrics
        overallConfidence: Math.round(confidenceState.overall * 100),
        confidenceLevel: confidenceState.level,
        confidenceCalibration: Math.round(confidenceState.calibration * 100),
        strongAreas: confidenceState.strongAreas,
        improvementAreas: confidenceState.improvementAreas,
        // Temporal metrics
        currentFatigue: Math.round(temporalState.currentFatigue * 100),
        optimalPracticeTime: temporalState.optimalPracticeTime,
        sessionRecommendation: temporalState.sessionRecommendation,
        // Goals metrics
        activeGoals: goalsState.activeGoals.length,
        completedToday: goalsState.recentCompleted.length,
        totalPoints: goalsState.userProfile.totalPoints,
        nextMilestone: goalsState.progressSummary.nextMilestone
      }
      
      return { 
        flowState: state, 
        momentum, 
        metrics, 
        confidenceState, 
        temporalState, 
        goalsState 
      }
    } catch (e) {
      console.warn('Failed to get comprehensive state:', e)
      return { 
        flowState: 'neutral', 
        momentum: 'steady_progress', 
        metrics: {}, 
        confidenceState: null, 
        temporalState: null, 
        goalsState: null 
      }
    }
  }

  return {
    currentItem,
    history,
    setCurrentItem,
    setHistory,
    generateNextItem,
    handleDrillResult,
    handleContinue,
    clearHistoryAndRegenerate,
    
    // NEW: Level-driven features
    getCoachingInsights,
    debugCurrentLevelPrioritization,
    
    // NEW: Complete progress intelligence suite
    getCurrentFlowState,
    
    // PROGRESS SYSTEM INTEGRATION: Enhanced error handling
    tryIntelligentFallback,
    fallbackToMixedPractice
  }

  /**
   * ENHANCED FALLBACK: Try multiple strategies when specific practice fails
   */
  async function tryIntelligentFallback(settings, eligibleForms, context) {
    const { specificMood, specificTense, matchesSpecific, allowsPerson, allowsLevel } = context
    
    console.log('🔄 TRYING INTELLIGENT FALLBACK - Multiple strategies')
    
    // Strategy 1: Try direct filtering with basic forms
    const gated = gateFormsByCurriculumAndDialect(eligibleForms, settings)
    const compliant = gated.filter(f => matchesSpecific(f) && allowsPerson(f.person) && allowsLevel(f))
    
    if (compliant.length > 0) {
      console.log('✅ Fallback Strategy 1: Direct filtering worked')
      return compliant[Math.floor(Math.random() * compliant.length)]
    }
    
    // Strategy 2: Relax person constraints if region is causing issues
    if (specificMood && specificTense) {
      const relaxedPerson = gated.filter(f => 
        f.mood === specificMood && 
        f.tense === specificTense && 
        allowsLevel(f)
      )
      
      if (relaxedPerson.length > 0) {
        console.log('✅ Fallback Strategy 2: Relaxed person constraints worked')
        return relaxedPerson[Math.floor(Math.random() * relaxedPerson.length)]
      }
    }
    
    // Strategy 3: Try similar tenses within the same mood
    if (specificMood) {
      const similarTenses = getSimilarTenses(specificTense)
      for (const altTense of similarTenses) {
        const altForms = gated.filter(f => 
          f.mood === specificMood && 
          f.tense === altTense && 
          allowsPerson(f.person) && 
          allowsLevel(f)
        )
        
        if (altForms.length > 0) {
          console.log(`✅ Fallback Strategy 3: Similar tense ${altTense} worked`)
          return altForms[Math.floor(Math.random() * altForms.length)]
        }
      }
    }
    
    console.log('❌ All fallback strategies failed')
    return null
  }

  /**
   * Last resort: Switch to mixed practice when specific practice completely fails
   */
  function fallbackToMixedPractice(allForms, settings) {
    console.log('🚨 FINAL FALLBACK - Switching to mixed practice')
    
    // Force mixed practice settings
    const fallbackSettings = {
      ...settings,
      practiceMode: 'mixed',
      specificMood: null,
      specificTense: null
    }
    
    // Try to get any valid form for the user's level
    const gated = gateFormsByCurriculumAndDialect(allForms, fallbackSettings)
    const levelValid = gated.filter(f => {
      const userLevel = settings.level || 'B1'
      const allowed = getAllowedCombosForLevel(userLevel)
      return allowed.has(`${f.mood}|${f.tense}`)
    })
    
    if (levelValid.length > 0) {
      const form = levelValid[Math.floor(Math.random() * levelValid.length)]
      console.log(`✅ Mixed fallback succeeded: ${form.mood}/${form.tense}`)
      
      // Return the item in the expected format
      return {
        id: Date.now(),
        lemma: form.lemma,
        mood: form.mood,
        tense: form.tense,
        person: form.person,
        form: {
          value: form.value || form.form,
          lemma: form.lemma,
          mood: form.mood,
          tense: form.tense,
          person: form.person,
          alt: form.alt || [],
          accepts: form.accepts || {}
        },
        settings: fallbackSettings,
        selectionMethod: 'mixed_practice_fallback'
      }
    }
    
    console.error('❌ COMPLETE FAILURE - Even mixed practice fallback failed')
    throw new Error('No forms available for practice - please check your level and region settings')
  }

  /**
   * Helper: Get similar tenses for fallback attempts
   */
  function getSimilarTenses(tense) {
    const tenseGroups = {
      'pretIndef': ['impf'],
      'impf': ['pretIndef'],
      'subjPres': ['subjImpf'],
      'subjImpf': ['subjPres'],
      'pretPerf': ['plusc'],
      'plusc': ['pretPerf'],
      'fut': ['cond'],
      'cond': ['fut']
    }
    
    return tenseGroups[tense] || []
  }
}
