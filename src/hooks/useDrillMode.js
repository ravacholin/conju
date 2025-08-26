import { useState } from 'react'
import { useSettings } from '../state/settings.js'
import { chooseNext } from '../lib/core/generator.js'
import { getDueItems, updateSchedule } from '../lib/progress/srs.js'
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
      specificMood: settings.specificMood,
      specificTense: settings.specificTense,
      level: settings.level,
      itemToExclude: itemToExclude?.lemma
    })
    
    // LEVEL-AWARE DEBUG: Show level prioritization for debugging
    if (settings.level && typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
      try {
        debugLevelPrioritization(settings.level)
      } catch (e) {
        console.warn('Level prioritization debug failed:', e)
      }
    }
    
    // Multi-tier selection: SRS > Adaptive Recommendations > Level-Aware Standard Generator
    let nextForm = null
    let selectionMethod = 'standard'
    
    try {
      const userId = getCurrentUserId()
      const isSpecific = settings.practiceMode === 'specific' && settings.specificMood && settings.specificTense
      const specificMood = isSpecific ? settings.specificMood : null
      const specificTense = isSpecific ? settings.specificTense : null

      // Tier 1: SRS due cells (highest priority)
      let dueCells = userId ? await getDueItems(userId, new Date()) : []
      // Respect topic selection: constrain SRS to current mood/tense when in specific mode
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
        const candidateForms = allFormsForRegion.filter(f =>
          f.mood === pickFromDue.mood && f.tense === pickFromDue.tense && f.person === pickFromDue.person
        )
        if (candidateForms.length > 0) {
          nextForm = candidateForms[Math.floor(Math.random() * candidateForms.length)]
          selectionMethod = 'srs_due'
          console.log('📅 SRS Due item selected:', `${nextForm.mood}/${nextForm.tense}`)
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
            
            // If practicing a specific topic, ignore recommendations that don't match
            if (isSpecific) {
              // Map mixed tenses for comparison
              const matchesSpecific = (
                (specificTense === 'impMixed' && mood === specificMood && (tense === 'impAff' || tense === 'impNeg')) ||
                (specificTense === 'nonfiniteMixed' && mood === specificMood && (tense === 'ger' || tense === 'part')) ||
                (mood === specificMood && tense === specificTense)
              )
              if (!matchesSpecific) {
                console.log('❌ Adaptive recommendation skipped (doesn\'t match specific practice)')
              } else {
                // Filter forms based on recommendation
                let candidateForms = allFormsForRegion.filter(f => 
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
                }
              }
            } else {
              // Mixed practice: free to use recommendation
              // Filter forms based on recommendation
              let candidateForms = allFormsForRegion.filter(f => 
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
              }
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

    // Tier 3: Level-Aware Standard generator (enhanced fallback)
    if (!nextForm) {
      nextForm = chooseNext({ forms: allFormsForRegion, history, currentItem: itemToExclude })
      selectionMethod = 'level_aware_standard'
      console.log('🎯 Level-aware standard selection applied')
    }
    
    // Integrity guards: never let progress system override Specific mode or Variant
    const isSpecific = settings.practiceMode === 'specific' && settings.specificMood && settings.specificTense
    const specificMood = isSpecific ? settings.specificMood : null
    const specificTense = isSpecific ? settings.specificTense : null
    const region = settings.region
    const pronounMode = settings.practicePronoun
    const allowsPerson = (person) => {
      if (pronounMode === 'all') return true
      if (region === 'rioplatense') return person !== '2s_tu' && person !== '2p_vosotros'
      if (region === 'la_general') return person !== '2s_vos' && person !== '2p_vosotros'
      if (region === 'peninsular') return person !== '2s_vos'
      return true
    }
    const matchesSpecific = (form) => {
      if (!isSpecific) return true
      if (specificTense === 'impMixed') return form.mood === specificMood && (form.tense === 'impAff' || form.tense === 'impNeg')
      if (specificTense === 'nonfiniteMixed') return form.mood === specificMood && (form.tense === 'ger' || form.tense === 'part')
      return form.mood === specificMood && form.tense === specificTense
    }
    if (nextForm && (!matchesSpecific(nextForm) || !allowsPerson(nextForm.person))) {
      const compliant = allFormsForRegion.filter(f => matchesSpecific(f) && allowsPerson(f.person))
      if (compliant.length > 0) {
        nextForm = compliant[Math.floor(Math.random() * compliant.length)]
        selectionMethod += '+guarded'
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
    
    if (nextForm && nextForm.mood && nextForm.tense) {
      // Force a new object to ensure React detects the change
      const newItem = {
        id: Date.now(), // Unique identifier to force re-render
        lemma: nextForm.lemma,
        mood: nextForm.mood,
        tense: nextForm.tense,
        person: nextForm.person,
        form: {
          value: nextForm.value || nextForm.form, // Handle both 'value' and 'form' fields from database
          lemma: nextForm.lemma,
          mood: nextForm.mood,
          tense: nextForm.tense,
          person: nextForm.person,
          alt: nextForm.alt || [], // Alternative forms if any
          accepts: nextForm.accepts || {} // Accepted variants (tu/vos/vosotros)
        },
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
                  newItem.form = {
                    value: firstForm.value || firstForm.form,
                    lemma: firstForm.lemma,
                    mood: firstForm.mood,
                    tense: firstForm.tense,
                    person: firstForm.person,
                    alt: firstForm.alt || [],
                    accepts: firstForm.accepts || {}
                  }
                  
                  // Add second form
                  newItem.secondForm = {
                    value: secondForm.value || secondForm.form,
                    lemma: secondForm.lemma,
                    mood: secondForm.mood,
                    tense: secondForm.tense,
                    person: secondForm.person,
                    alt: secondForm.alt || [],
                    accepts: secondForm.accepts || {}
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
    if (settings.level && typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
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
    getCurrentFlowState
  }
}
