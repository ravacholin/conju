import { useState } from 'react'
import { useSettings } from '../state/settings.js'
import { getTensesForMood, getTenseLabel, getMoodLabel } from '../lib/utils/verbLabels.js'
import { getFamiliesForTense } from '../lib/data/irregularFamilies.js'
import { LEVELS } from '../lib/data/levels.js'
import gates from '../data/curriculum.json'

// Helper function to get allowed lemmas from level configuration
function getAllowedLemmasForLevel(level) {
  const levelConfig = LEVELS[level]
  if (!levelConfig || !levelConfig.verbPacks) {
    return null // No restriction
  }
  
  const allowedLemmas = new Set()
  levelConfig.verbPacks.forEach(pack => {
    pack.lemmas.forEach(lemma => allowedLemmas.add(lemma))
  })
  
  return allowedLemmas
}

export function useOnboardingFlow() {
  const [onboardingStep, setOnboardingStep] = useState(1)
  const settings = useSettings()

  // Push a browser history entry to align hardware back with app back
  const pushHistory = (nextStep) => {
    try {
      window.history.pushState({ appNav: true, mode: 'onboarding', step: nextStep ?? onboardingStep, ts: Date.now() }, '')
    } catch {
      /* ignore */
    }
  }

  const closeTopPanelsAndFeatures = () => {
    // Function to close all top panels and features - will be defined in parent
    // This is a placeholder for now
  }

  // Function to get available moods for a specific level
  const getAvailableMoodsForLevel = (level) => {
    // Special case for ALL level - show all moods
    if (level === 'ALL') {
      return ['indicative', 'subjunctive', 'imperative', 'conditional', 'nonfinite']
    }
    
    const levelGates = gates.filter(g => g.level === level)
    const moods = [...new Set(levelGates.map(g => g.mood))]
    return moods
  }

  // Function to get available tenses for a specific level and mood
  const getAvailableTensesForLevelAndMood = (level, mood) => {
    // Special case for ALL level - show all tenses for the mood
    if (level === 'ALL') {
      const allTenses = {
        'indicative': ['pres', 'pretPerf', 'pretIndef', 'impf', 'plusc', 'fut', 'futPerf'],
        'subjunctive': ['subjPres', 'subjImpf', 'subjPerf', 'subjPlusc'],
        'imperative': ['impAff', 'impNeg', 'impMixed'],
        'conditional': ['cond', 'condPerf'],
        'nonfinite': ['ger', 'part', 'nonfiniteMixed']
      }
      return allTenses[mood] || ['pres']
    }
    
    const levelGates = gates.filter(g => g.level === level && g.mood === mood)
    const tenses = levelGates.map(g => g.tense)
    return tenses
  }

  // Function to get conjugation examples
  // Solo mostrar tiempos simples, no compuestos
  const getConjugationExample = (mood, tense) => {
    // Get the appropriate imperative examples based on dialect
    const getImperativeExamples = () => {
      // For rioplatense (useVoseo), show vos forms
      if (settings.useVoseo && !settings.useTuteo) {
        return {
          'imperative_impAff': 'hablá, hablá',
          'imperative_impNeg': 'no hables, no habléis'
        };
      }
      // For other dialects, show tú forms
      return {
        'imperative_impAff': 'habla, hablad',
        'imperative_impNeg': 'no hables, no habléis'
      };
    };

    const imperativeExamples = getImperativeExamples();

    const examples = {
      // Indicativo - tiempos simples
      'indicative_pres': 'hablo, hablas, habla',
      'indicative_pretIndef': 'hablé, hablaste, habló',
      'indicative_impf': 'hablaba, hablabas, hablaba',
      'indicative_fut': 'hablaré, hablarás, hablará',
      
      // Indicativo - tiempos compuestos (solo para tiempos exclusivamente compuestos)
      'indicative_pretPerf': 'he hablado, has hablado, ha hablado',
      'indicative_plusc': 'había hablado, habías hablado, había hablado',
      'indicative_futPerf': 'habré hablado, habrás hablado, habrá hablado',
      
      // Subjuntivo - tiempos simples
      'subjunctive_subjPres': 'hable, hables, hable',
      'subjunctive_subjImpf': 'hablara, hablaras, hablara',
      
      // Subjuntivo - tiempos compuestos (solo para tiempos exclusivamente compuestos)
      'subjunctive_subjPerf': 'haya hablado, hayas hablado, haya hablado',
      'subjunctive_subjPlusc': 'hubiera hablado, hubieras hablado, hubiera hablado',
      
      // Imperativo (dialect-specific)
      ...imperativeExamples,
      'imperative_impMixed': 'habla / no hables',
      
      // Condicional - tiempos simples y compuestos
      'conditional_cond': 'hablaría, hablarías, hablaría',
      'conditional_condPerf': 'habría hablado, habrías hablado, habría hablado',
      
      // Formas no conjugadas
      'nonfinite_ger': 'hablando',
      'nonfinite_part': 'hablado',
      'nonfinite_nonfiniteMixed': 'hablando / hablado'
    }
    
    const key = `${mood}_${tense}`
    return examples[key] || ''
  }

  // Compact samples per mood using hablar - now dynamic based on level
  const getModeSamples = (mood) => {
    // Get available tenses for the current level and mood
    const availableTenses = getAvailableTensesForLevelAndMood(settings.level, mood)
    
    // If no specific level, show all tenses for the mood
    if (!settings.level) {
      const allTenses = {
        'indicative': ['pres','pretIndef','impf','fut'],
        'subjunctive': ['subjPres','subjImpf'],
        'imperative': ['impAff','impNeg'],
        'conditional': ['cond'],
        'nonfinite': ['ger','part']
      }
      const tenses = allTenses[mood] || []
      return getSamplesFromTenses(mood, tenses)
    }
    
    // If we have a level, always show only the tenses available for that level
    // This applies whether it's 'mixed' or 'specific' practice mode
    return getSamplesFromTenses(mood, availableTenses)
  }
  
  // Helper function to get samples from a list of tenses
  const getSamplesFromTenses = (mood, tenses) => {
    // Define the order of learning for each mood (simple tenses first, then compound tenses)
    const learningOrder = {
      'indicative': ['pres', 'pretIndef', 'impf', 'fut', 'pretPerf', 'plusc', 'futPerf'],
      'subjunctive': ['subjPres', 'subjImpf', 'subjPerf', 'subjPlusc'],
      'imperative': ['impAff', 'impNeg', 'impMixed'],
      'conditional': ['cond', 'condPerf'],
      'nonfinite': ['ger', 'part', 'nonfiniteMixed']
    }
    
    const order = learningOrder[mood] || []
    // Filter available tenses by learning order, then sort by that order
    const sortedTenses = tenses.filter(t => order.includes(t)).sort((a, b) => {
      const aIndex = order.indexOf(a)
      const bIndex = order.indexOf(b)
      if (aIndex === -1) return 1
      if (bIndex === -1) return -1
      return aIndex - bIndex
    })
    
    const singleOf = (m, t) => {
      const s = getConjugationExample(m, t)
      if (!s) return ''
      // tomar solo la primera forma de cada tiempo (antes de la primera coma o slash)
      const parts = s.split(',').map(x=>x.trim())
      let pick = parts[0] || ''
      // Para imperativo ya tenemos la forma correcta según la variante en getConjugationExample
      // Solo tomamos la primera forma (2s) para el ejemplo
      if (m === 'imperative') {
        pick = parts[0] || ''
      }
      // si hubiera barras, tomar el primer segmento
      return pick.split('/')[0].trim()
    }
    
    const samples = sortedTenses.map(t => singleOf(mood, t)).filter(Boolean)
    const result = samples.join(' · ')
    
    // Add " · etc." if there are additional tenses available (but we're only showing simple ones)
    const hasAdditionalTenses = tenses.some(t => !order.includes(t))
    return hasAdditionalTenses && result ? `${result} · etc.` : result
  }

  const selectDialect = (dialect) => {
    closeTopPanelsAndFeatures()
    
    switch (dialect) {
      case 'rioplatense':
        settings.set({
          useVoseo: true,
          useTuteo: false,
          useVosotros: false,
          strict: true,
          region: 'rioplatense',
          // For rioplatense: include all pronouns within the dialect (including vos!)
          practicePronoun: 'all'
        })
        break
      case 'la_general':
        settings.set({
          useTuteo: true,
          useVoseo: false,
          useVosotros: false,
          strict: true,
          region: 'la_general',
          // Ensure regional restrictions are honored (no global override)
          practicePronoun: 'both'
        })
        break
      case 'peninsular':
        settings.set({
          useTuteo: true,
          useVoseo: false,
          useVosotros: true,
          strict: true,
          region: 'peninsular',
          // Ensure regional restrictions are honored (no global override)
          practicePronoun: 'both'
        })
        break
      case 'both':
        settings.set({
          useTuteo: true,
          useVoseo: true,
          useVosotros: true,
          strict: false,
          region: 'la_general',
          practicePronoun: 'all'
        })
        break
    }
    setOnboardingStep(2)
    pushHistory(2)
  }

  const selectLevel = (level) => {
    closeTopPanelsAndFeatures()
    // Apply level-specific policies
    const updates = { level }
    if (level === 'A1') {
      updates.strict = false
      updates.accentTolerance = 'accept'
      updates.requireDieresis = false
      updates.blockNonNormativeSpelling = false
      updates.cliticStrictness = 'off'
      updates.impSubjVariantMode = 'accept_both'
      updates.cliticsPercent = 0
      updates.neutralizePronoun = false
      updates.rotateSecondPerson = false
      updates.timeMode = 'none'
      updates.perItemMs = null
      updates.medianTargetMs = null
      updates.showPronouns = true
      updates.practicePronoun = 'both'
      updates.allowedLemmas = getAllowedLemmasForLevel('A1')
    } else if (level === 'A2') {
      updates.strict = false
      updates.accentTolerance = 'warn'
      updates.requireDieresis = false
      updates.blockNonNormativeSpelling = false
      updates.cliticStrictness = 'off'
      updates.impSubjVariantMode = 'accept_both'
      updates.cliticsPercent = 0
      updates.neutralizePronoun = false
      updates.rotateSecondPerson = false
      updates.timeMode = 'soft'
      updates.perItemMs = 8000
      updates.medianTargetMs = null
      updates.showPronouns = true
      updates.allowedLemmas = getAllowedLemmasForLevel('A2')
    } else if (level === 'B1') {
      updates.strict = true
      updates.accentTolerance = 'warn'
      updates.requireDieresis = false
      updates.blockNonNormativeSpelling = false
      updates.cliticStrictness = 'low'
      updates.impSubjVariantMode = 'accept_both'
      updates.cliticsPercent = 0
      updates.neutralizePronoun = false
      updates.rotateSecondPerson = false
      updates.timeMode = 'soft'
      updates.perItemMs = 6000
      updates.medianTargetMs = 3000
      updates.allowedLemmas = getAllowedLemmasForLevel('B1')
    } else if (level === 'B2') {
      updates.strict = true
      updates.accentTolerance = 'strict'
      updates.requireDieresis = true
      updates.blockNonNormativeSpelling = false
      updates.cliticStrictness = 'low'
      updates.impSubjVariantMode = 'accept_both'
      updates.cliticsPercent = 10
      updates.neutralizePronoun = false
      updates.rotateSecondPerson = true
      updates.timeMode = 'strict'
      updates.perItemMs = 5000
      updates.medianTargetMs = 2500
      updates.allowedLemmas = getAllowedLemmasForLevel('B2')
    } else if (level === 'C1') {
      updates.strict = true
      updates.accentTolerance = 'warn'
      updates.requireDieresis = true
      updates.blockNonNormativeSpelling = true
      updates.cliticStrictness = 'high'
      updates.cliticsPercent = 30
      updates.neutralizePronoun = true
      updates.rotateSecondPerson = false
      updates.timeMode = 'strict'
      updates.perItemMs = 3500
      updates.medianTargetMs = 1800
      updates.enableFuturoSubjRead = true
      updates.enableFuturoSubjProd = false
      updates.enableC2Conmutacion = false
      updates.allowedLemmas = getAllowedLemmasForLevel('C1')
    } else if (level === 'C2') {
      updates.strict = true
      updates.accentTolerance = 'strict'
      updates.requireDieresis = true
      updates.blockNonNormativeSpelling = true
      updates.cliticStrictness = 'high'
      updates.cliticsPercent = 60
      updates.neutralizePronoun = true
      updates.rotateSecondPerson = true
      updates.timeMode = 'strict'
      updates.perItemMs = 2500
      updates.medianTargetMs = 1200
      updates.enableFuturoSubjRead = true
      updates.enableFuturoSubjProd = true
      updates.enableC2Conmutacion = true
      updates.burstSize = 16
      updates.c2RareBoostLemmas = ['argüir','delinquir','henchir','agorar','cocer','esparcir','distinguir','tañer']
      updates.allowedLemmas = getAllowedLemmasForLevel('C2')
    }
    settings.set(updates)
    setOnboardingStep(4) // Go to practice mode selection
    pushHistory(4)
  }

  const selectPracticeMode = (mode) => {
    closeTopPanelsAndFeatures()
    
    if (mode === 'theme') {
      // Theme-based practice setup with specific configuration
      settings.set({ 
        practiceMode: 'specific', 
        level: 'ALL', 
        cameFromTema: true,
        specificMood: null, // Clear previous mood selection
        specificTense: null, // Clear previous tense selection
        strict: true,
        accentTolerance: 'warn',
        requireDieresis: false,
        blockNonNormativeSpelling: false,
        cliticStrictness: 'low',
        cliticsPercent: 0,
        neutralizePronoun: false,
        rotateSecondPerson: false,
        timeMode: 'soft',
        perItemMs: 6000,
        medianTargetMs: 3000,
        // NO RESTRICT verbs for theme-based practice - let user choose verb types later
        // When verbType='all' is selected, full database should be available
        allowedLemmas: null
      })
      setOnboardingStep(5) // Go to mood selection
      pushHistory(5)
    } else {
      // For other practice modes, reset theme-based practice settings
      settings.set({ 
        practiceMode: mode,
        cameFromTema: false,
        specificMood: null,
        specificTense: null
      })
      
      if (mode === 'mixed') {
        setOnboardingStep(5) // Go to verb type selection for mixed practice
        pushHistory(5)
      } else if (mode === 'specific') {
        // For specific practice without level, set to C2 to show all forms
        if (!settings.level) {
          settings.set({ level: 'C2' })
        }
        setOnboardingStep(5) // Go to mood selection for specific practice
        pushHistory(5)
      }
    }
  }

  const selectMood = (mood) => {
    closeTopPanelsAndFeatures()
    // For theme-based practice (cameFromTema=true), keep the flag set
    settings.set({ specificMood: mood })
    
    if (settings.level) {
      setOnboardingStep(6) // Go to tense selection for level-specific practice
      pushHistory(6)
    } else {
      // For theme-based practice, stay in step 5 but with specific mood set
      // The component will show tense selection when specificMood is set
      pushHistory(5)
    }
  }

  const selectTense = (tense) => {
    closeTopPanelsAndFeatures()
    settings.set({ specificTense: tense })
    
    if (settings.level) {
      setOnboardingStep(7) // Go to verb type selection for level-specific practice
      pushHistory(7)
    } else {
      // For theme-based practice (cameFromTema=true), go to step 6
      setOnboardingStep(6) // Go to verb type selection for general practice
      pushHistory(6)
    }
  }

  const selectVerbType = (verbType, onStartPractice) => {
    closeTopPanelsAndFeatures()
    
    if (verbType === 'irregular') {
      // Do NOT branch into family selection for gerunds: mix all irregular patterns
      const isGerundFlow = settings.specificMood === 'nonfinite' && (
        settings.specificTense === 'ger' || settings.specificTense === 'nonfiniteMixed' || !settings.specificTense
      )
      if (isGerundFlow) {
        const updates = { verbType, selectedFamily: null }
        settings.set(updates)
        onStartPractice && onStartPractice()
        return
      }

      // Check if only one family is available for the current tense
      const tense = settings.specificTense
      const availableFamilies = tense ? getFamiliesForTense(tense) : []
      
      if (availableFamilies.length === 1) {
        // Only one family available - auto-select it and start practice
        const updates = { verbType, selectedFamily: availableFamilies[0].id }
        settings.set(updates)
        onStartPractice && onStartPractice()
      } else {
        // Multiple families available - show family selection
        settings.set({ verbType })
        setOnboardingStep(8) // Go to family selection
        pushHistory(8)
      }
    } else {
      // For regulares and todos, start practice directly
      const updates = { verbType, selectedFamily: null }
      settings.set(updates)
      onStartPractice && onStartPractice()
    }
  }
  
  const selectFamily = (familyId, onStartPractice) => {
    closeTopPanelsAndFeatures()
    const updates = { selectedFamily: familyId }
    settings.set(updates)
    onStartPractice && onStartPractice()
  }

  const goBack = () => {
    // Store the current step for debugging
    const currentStep = onboardingStep;
    
    if (currentStep > 1) {
      // Theme-based practice specific handling
      if (settings.cameFromTema) {
        // Step 5: if a mood was selected (no tense yet), go back to step 4 (practice mode)
        if (currentStep === 5 && settings.specificMood && !settings.specificTense) {
          settings.set({ specificMood: null })
          setOnboardingStep(4)
          pushHistory(4)
          return
        }
        // Step 5: if no mood selected, go back to main menu (step 2) and clear theme flags
        if (currentStep === 5 && !settings.specificMood) {
          settings.set({ cameFromTema: false, specificMood: null, specificTense: null })
          setOnboardingStep(2)
          pushHistory(2)
          return
        }
        // Step 6: if a mood was selected but no tense yet, go back to mood selection (step 5) and clear mood
        if (currentStep === 6 && settings.specificMood && !settings.specificTense) {
          settings.set({ specificMood: null })
          setOnboardingStep(5)
          pushHistory(5)
          return
        }
        // Step 6: if a tense was selected under a chosen mood, go back to step 5 and clear tense
        if (currentStep === 6 && settings.specificMood && settings.specificTense) {
          settings.set({ specificTense: null })
          setOnboardingStep(5)
          pushHistory(5)
          return
        }
      }
      // Special handling for step 2 (main menu: "¿Qué querés practicar?")
      // When going back from this step, we should go to step 1 (dialect selection)
      if (currentStep === 2) {
        setOnboardingStep(1)
        pushHistory(1)
        return
      }
      
      // Special handling for step 3 (specific level selection)
      // When going back from this step, we should go to step 2 (level selection mode)
      if (currentStep === 3) {
        setOnboardingStep(2)
        pushHistory(2)
        return
      }
      
      // Special handling for step 4 (practice mode selection)
      // When going back from this step, we should go to step 2 (level selection mode)
      if (currentStep === 4) {
        setOnboardingStep(2)
        pushHistory(2)
        return
      }
      
      // Special handling for step 5 (mood/tense selection)
      // If a mood is selected, go back to previous screen (step 4) instead of staying in step 5
      if (currentStep === 5 && settings.specificMood && !settings.specificTense) {
        settings.set({ specificMood: null })
        setOnboardingStep(4)
        pushHistory(4)
        return
      }
      
      // Special handling for step 6 (tense/verb type selection)
      // When in step 6 with a specific tense selected, go back to mood selection (step 5 with specific mood)
      if (currentStep === 6 && settings.specificMood && settings.specificTense) {
        settings.set({ specificTense: null })
        setOnboardingStep(5)
        pushHistory(5)
        return
      }
      
      // Default behavior: go back one step
      const target = currentStep - 1
      setOnboardingStep(target)
      pushHistory(target)
    }
  }

  const goToLevelDetails = () => {
    setOnboardingStep(3)
    pushHistory(3)
  }

  const handleHome = (setCurrentMode) => {
    // Scroll to top when returning to menu
    window.scrollTo({ top: 0, behavior: 'smooth' })
    if (setCurrentMode) {
      setCurrentMode('onboarding')
    }
    // Reset theme-based practice settings
    settings.set({
      cameFromTema: false,
      specificMood: null,
      specificTense: null
    })
    setOnboardingStep(2) // Go to main menu: "¿Qué querés practicar?" (Por Nivel / Por Tema)
  }

  return {
    onboardingStep,
    setOnboardingStep,
    selectDialect,
    selectLevel,
    selectPracticeMode,
    selectMood,
    selectTense,
    selectVerbType,
    selectFamily,
    goBack,
    goToLevelDetails,
    handleHome,
    settings,
    // Utility functions for components
    getAvailableMoodsForLevel,
    getAvailableTensesForLevelAndMood,
    getModeSamples,
    getConjugationExample
  }
}
