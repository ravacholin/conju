import { useState, useEffect } from 'react'
import { useSettings } from '../state/settings.js'
import { chooseNext } from '../lib/core/generator.js'

export function useDrillMode() {
  const [currentItem, setCurrentItem] = useState(null)
  const [history, setHistory] = useState({})
  const settings = useSettings()

  // Generate the next item based on current settings
  const generateNextItem = (itemToExclude = null, allFormsForRegion, getAvailableMoodsForLevel, getAvailableTensesForLevelAndMood) => {
    console.log('🎯 GENERATE NEXT ITEM - Starting with settings:', {
      verbType: settings.verbType,
      selectedFamily: settings.selectedFamily,
      specificMood: settings.specificMood,
      specificTense: settings.specificTense,
      itemToExclude: itemToExclude?.lemma
    })
    
    const nextForm = chooseNext({ forms: allFormsForRegion, history, currentItem: itemToExclude })
    
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

  const handleDrillResult = (result) => {
    // Only update history if it's not an accent error
    if (!result.isAccentError) {
      const key = `${currentItem.mood}:${currentItem.tense}:${currentItem.person}:${currentItem.form.value}`
      setHistory(prev => ({
        ...prev,
        [key]: {
          seen: (prev[key]?.seen || 0) + 1,
          correct: (prev[key]?.correct || 0) + (result.correct ? 1 : 0)
        }
      }))
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

  return {
    currentItem,
    history,
    setCurrentItem,
    setHistory,
    generateNextItem,
    handleDrillResult,
    handleContinue,
    clearHistoryAndRegenerate
  }
}