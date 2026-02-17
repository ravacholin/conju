import { useReducer, useEffect, useCallback, useRef } from 'react'
import { useSettings } from '../state/settings.js'
import { getTensesForMood /* getTenseLabel, getMoodLabel */ } from '../lib/utils/verbLabels.js'
import { getAllowedMoods as gateAllowedMoods, getAllowedTensesForMood as gateAllowedTensesForMood } from '../lib/core/eligibility.js'
import { getFamiliesForTense } from '../lib/data/irregularFamilies.js'
import { LEVELS } from '../lib/data/levels.js'
import router from '../lib/routing/Router.js'
import { ROUTES } from '../lib/routing/routeContract.js'
// import gates from '../data/curriculum.json'

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

const ONBOARDING_ACTIONS = {
  SET_STEP: 'SET_STEP',
  BACK: 'BACK'
}

const initialOnboardingState = {
  step: 1,
  lastUpdate: 'init'
}

const createSettingsSnapshot = (settings) => ({
  level: settings.level,
  practiceMode: settings.practiceMode,
  specificMood: settings.specificMood,
  specificTense: settings.specificTense
})

const computePreviousStep = (currentStep, settingsSnapshot) => {
  const sanitizedStep = typeof currentStep === 'number' && !Number.isNaN(currentStep)
    ? currentStep
    : 1

  switch (sanitizedStep) {
    case 8:
      return 7
    case 7:
      if (settingsSnapshot?.specificTense) return 6
      if (settingsSnapshot?.specificMood) return 5
      if (settingsSnapshot?.level) return 4
      return 2
    case 6:
      return 5
    case 5:
      if (settingsSnapshot?.level && settingsSnapshot?.practiceMode) {
        return 4
      }
      return 2
    case 4:
      return 3
    case 3:
      return 2
    case 2:
      return 1
    default:
      return 1
  }
}

const onboardingReducer = (state, action) => {
  switch (action.type) {
    case ONBOARDING_ACTIONS.SET_STEP: {
      const nextStep = typeof action.step === 'number' && action.step >= 1 ? action.step : 1
      const source = action.source ?? 'internal'
      if (nextStep === state.step && source === state.lastUpdate) {
        return state
      }

      return {
        step: nextStep,
        lastUpdate: source
      }
    }
    case ONBOARDING_ACTIONS.BACK: {
      const previousStep = computePreviousStep(state.step, action.settings)
      if (previousStep === state.step) {
        return state
      }

      return {
        step: previousStep,
        lastUpdate: 'internal'
      }
    }
    default:
      return state
  }
}

export function useOnboardingFlow() {
  const [state, dispatch] = useReducer(onboardingReducer, initialOnboardingState)
  const onboardingStep = state.step
  const settings = useSettings()
  const onboardingStepRef = useRef(onboardingStep)

  useEffect(() => {
    onboardingStepRef.current = onboardingStep
  }, [onboardingStep])

  const navigateToStep = useCallback((step, options = {}) => {
    const safeStep = typeof step === 'number' && step >= 1 ? step : 1
    try {
      router.navigate(ROUTES.onboarding(safeStep), options)
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('Router navigation failed, ignoring.', error)
      }
    }
  }, [])

  // Interceptor para debuggear quién está cambiando el step
  const setOnboardingStep = useCallback((newStep, options = {}) => {
    const { syncRouter = true, replace = false } = options
    const safeStep = typeof newStep === 'number' && newStep >= 1 ? newStep : 1
    if (import.meta.env.DEV) {
      console.log(`🚨 setOnboardingStep called: ${onboardingStepRef.current} → ${safeStep}`, { syncRouter, replace });
      console.trace('Stack trace for setOnboardingStep:');
    }

    dispatch({
      type: ONBOARDING_ACTIONS.SET_STEP,
      step: safeStep,
      source: syncRouter ? 'internal' : 'external'
    })

    if (syncRouter) {
      navigateToStep(safeStep, { replace })
    }
  }, [navigateToStep])
  
  if (import.meta.env.DEV) {
    console.log('--- HOOK useOnboardingFlow ---', {
      onboardingStep
    });
  }

  const closeTopPanelsAndFeatures = () => {
    // Function to close all top panels and features - will be defined in parent
    // This is a placeholder for now
  }

  // Function to get available moods for a specific level
  const getAvailableMoodsForLevel = useCallback((level) => {
    try {
      const currentSettings = useSettings.getState()
      return gateAllowedMoods({ ...currentSettings, level })
    } catch {
      // Fallback to showing all
      return ['indicative', 'subjunctive', 'imperative', 'conditional', 'nonfinite']
    }
  }, [])

  // Function to get available tenses for a specific level and mood
  const getAvailableTensesForLevelAndMood = useCallback((level, mood) => {
    try {
      const currentSettings = useSettings.getState()
      return gateAllowedTensesForMood({ ...currentSettings, level }, mood)
    } catch {
      return getTensesForMood(mood)
    }
  }, [])

  // Function to get conjugation examples
  // Solo mostrar tiempos simples, no compuestos
  const getConjugationExample = useCallback((mood, tense) => {
    const currentSettings = useSettings.getState()
    // Get the appropriate imperative examples based on dialect
    const getImperativeExamples = () => {
      // For rioplatense (useVoseo), show vos forms
      if (currentSettings.useVoseo && !currentSettings.useTuteo) {
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
  }, [])

  // Compact samples per mood using hablar - now dynamic based on level
  const getSamplesFromTenses = useCallback((mood, tenses) => {
    // Define the order of learning for each mood (simple tenses first, then compound tenses)
    const learningOrder = {
      'indicative': ['pres', 'pretIndef', 'impf', 'fut', 'pretPerf', 'plusc', 'futPerf'],
      'subjunctive': ['subjPres', 'subjImpf', 'subjPerf', 'subjPlusc'],
      'imperative': ['impAff', 'impNeg', 'impMixed'],
      'conditional': ['cond', 'condPerf'],
      'nonfinite': ['ger', 'part', 'nonfiniteMixed']
    }
    
    const order = learningOrder[mood] || []
    // For nonfinite and imperative examples, exclude mixed variants to avoid extra/duplicate samples
    const filtered = mood === 'nonfinite'
      ? tenses.filter(t => t !== 'nonfiniteMixed')
      : mood === 'imperative'
        ? tenses.filter(t => t !== 'impMixed')
        : tenses
    // Filter available tenses by learning order, then sort by that order
    const sortedTenses = filtered.filter(t => order.includes(t)).sort((a, b) => {
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
    const hasAdditionalTenses = filtered.some(t => !order.includes(t))
    return hasAdditionalTenses && result ? `${result} · etc.` : result
  }, [getConjugationExample])

  const getModeSamples = useCallback((mood) => {
    const currentSettings = useSettings.getState()
    // Get available tenses for the current level and mood
    const availableTenses = getAvailableTensesForLevelAndMood(currentSettings.level, mood)
    
    // If no specific level, show all tenses for the mood
    if (!currentSettings.level) {
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
  }, [getAvailableTensesForLevelAndMood, getSamplesFromTenses])

  const selectDialect = useCallback((dialect) => {
    if (import.meta.env.DEV) {
      console.log('ACTION: selectDialect', dialect);
    }
    closeTopPanelsAndFeatures()
    
    // Clear any previous mood/tense selections when starting fresh
    const baseUpdates = {
      specificMood: null,
      specificTense: null,
      verbType: null,
      selectedFamily: null
    }
    
    switch (dialect) {
      case 'rioplatense':
        settings.set({
          ...baseUpdates,
          useVoseo: true,
          useTuteo: false,
          useVosotros: false,
          strict: true,
          region: 'rioplatense',
          // For rioplatense: respect regional dialect constraints
          practicePronoun: 'mixed'
        })
        break
      case 'la_general':
        settings.set({
          ...baseUpdates,
          useTuteo: true,
          useVoseo: false,
          useVosotros: false,
          strict: true,
          region: 'la_general',
          // Ensure strict regional restrictions are honored
          practicePronoun: 'mixed'
        })
        break
      case 'peninsular':
        settings.set({
          ...baseUpdates,
          useTuteo: true,
          useVoseo: false,
          useVosotros: true,
          strict: true,
          region: 'peninsular',
          // Ensure strict regional restrictions are honored
          practicePronoun: 'mixed'
        })
        break
      case 'both':
        settings.set({
          ...baseUpdates,
          useTuteo: true,
          useVoseo: true,
          useVosotros: true,
          strict: false,
          region: 'global',
          practicePronoun: 'all'
        })
        break
    }
    setOnboardingStep(2)
  }, [setOnboardingStep])

  const selectLevel = useCallback((level) => {
    if (import.meta.env.DEV) {
      console.log('ACTION: selectLevel', level);
    }
    closeTopPanelsAndFeatures()
    // Apply level-specific policies
    // DON'T set practiceMode here - let user choose in next step
    const updates = {
      level,
      cameFromTema: false,
      specificMood: null,
      specificTense: null
    }
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
      // C2: Override region to 'global' to practice ALL dialect forms (tú, vos, vosotros)
      updates.region = 'global'
      updates.useTuteo = true
      updates.useVoseo = true
      updates.useVosotros = true
      updates.practicePronoun = 'all'
    }
    settings.set(updates)
    setOnboardingStep(4) // Go to practice mode selection (mixed vs specific)
  }, [setOnboardingStep, settings])

  const selectPracticeMode = useCallback((mode, onStartPractice) => {
    if (import.meta.env.DEV) {
      console.log('ACTION: selectPracticeMode', mode);
    }
    closeTopPanelsAndFeatures()

    if (mode === 'theme') {
      // Theme-based practice setup
      settings.set({
        practiceMode: 'theme',
        // Do not bind to a specific level for theme mode
        level: null,
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
        allowedLemmas: null
      })
      setOnboardingStep(5) // Go to mood selection
    } else if (mode === 'mixed') {
      const currentSettings = useSettings.getState()
      // Mixed practice - if we already have a level, start practice directly
      settings.set({
        practiceMode: 'mixed',
        cameFromTema: false,
        specificMood: null,
        specificTense: null,
        verbType: 'all', // Default to all verbs for mixed practice
        selectedFamily: null
      })

      if (currentSettings.level) {
        // Level already selected - start practice immediately
        if (onStartPractice) {
          onStartPractice()
        }
      } else {
        // No level selected - go to verb type selection
        setOnboardingStep(5)
      }
    } else if (mode === 'specific') {
      // Specific practice - go to mood/tense selection
      settings.set({
        practiceMode: 'specific',
        cameFromTema: false,
        specificMood: null,
        specificTense: null
      })

      // For specific practice without level, set to C2 to show all forms
      const currentSettings = useSettings.getState()
      if (!currentSettings.level) {
        settings.set({ level: 'C2' })
      }
      setOnboardingStep(5) // Go to mood selection for specific practice
    }
  }, [setOnboardingStep, settings])

  const selectMood = useCallback((mood) => {
    if (import.meta.env.DEV) {
      console.log('ACTION: selectMood', mood);
    }
    closeTopPanelsAndFeatures()
    // For theme-based practice (cameFromTema=true), keep the flag set
    settings.set({ specificMood: mood })
    
    const currentSettings = useSettings.getState()
    if (currentSettings.practiceMode === 'theme') {
      // For theme-based practice, go to step 6 for tense selection
      setOnboardingStep(6)
    } else if (currentSettings.level) {
      setOnboardingStep(6) // Go to tense selection for level-specific practice
    } else {
      // For other specific practice, stay in step 5 but with specific mood set
      setOnboardingStep(5)
    }
  }, [setOnboardingStep, settings])

  const selectTense = useCallback((tense) => {
    if (import.meta.env.DEV) {
      console.log('ACTION: selectTense', tense);
    }
    closeTopPanelsAndFeatures()

    const tenseNameMapping = {
      'presente': 'pres',
      'preterito_perfecto_simple': 'pretIndef',
      'preterito_imperfecto': 'impf',
      'futuro_simple': 'fut',
      'imperativo_afirmativo': 'impAff',
      'preterito_pluscuamperfecto': 'plusc',
      'preterito_perfecto_compuesto': 'pretPerf',
      'futuro_compuesto': 'futPerf',
      'presente_subjuntivo': 'subjPres',
      'preterito_perfecto_subjuntivo': 'subjPerf',
      'imperativo_negativo': 'impNeg',
      'condicional_simple': 'cond',
      'imperfecto_subjuntivo': 'subjImpf',
      'pluscuamperfecto_subjuntivo': 'subjPlusc',
      'condicional_compuesto': 'condPerf'
    };
    const mappedTense = tenseNameMapping[tense] || tense;

    settings.set({ specificTense: mappedTense })
    
    const currentSettings = useSettings.getState()
    if (currentSettings.practiceMode === 'theme') {
      // For theme-based practice, go to step 7 (VerbTypeSelection)
      setOnboardingStep(7)
    } else if (currentSettings.level) {
      setOnboardingStep(7) // Go to verb type selection for level-specific practice
    } else {
      // For other specific practice, go to step 6
      setOnboardingStep(6) // Go to verb type selection for general practice
    }
  }, [setOnboardingStep, settings])

  const selectVerbType = useCallback((verbType, onStartPractice) => {
    if (import.meta.env.DEV) {
      console.log('ACTION: selectVerbType', verbType);
    }
    closeTopPanelsAndFeatures()
    
    const currentSettings = useSettings.getState()
    if (verbType === 'irregular') {
      // Do NOT branch into family selection for gerunds: mix all irregular patterns
      const isGerundFlow = currentSettings.specificMood === 'nonfinite' && (
        currentSettings.specificTense === 'ger' || currentSettings.specificTense === 'nonfiniteMixed' || !currentSettings.specificTense
      )
      if (isGerundFlow) {
        const updates = { verbType, selectedFamily: null }
        settings.set(updates)
        onStartPractice && onStartPractice()
        return
      }

      // Check if only one family is available for the current tense
      const tense = currentSettings.specificTense
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
      }
    } else {
      // For regulares and todos, start practice directly
      const updates = { verbType, selectedFamily: null }
      settings.set(updates)
      onStartPractice && onStartPractice()
    }
  }, [setOnboardingStep, settings])
  
  const selectFamily = useCallback((familyId, onStartPractice) => {
    if (import.meta.env.DEV) {
      console.log('ACTION: selectFamily', familyId);
    }
    closeTopPanelsAndFeatures()
    const updates = { selectedFamily: familyId }
    settings.set(updates)
    onStartPractice && onStartPractice()
  }, [settings])

  const goBack = useCallback(() => {
    if (import.meta.env.DEV) {
      console.log('ACTION: goBack');
    }

    const settingsSnapshot = createSettingsSnapshot(settings)
    const action = { type: ONBOARDING_ACTIONS.BACK, settings: settingsSnapshot }
    const nextState = onboardingReducer(state, action)

    if (import.meta.env.DEV) {
      console.log(`🔙 Manual back navigation: ${onboardingStep} → ${nextState.step}`)
    }

    if (nextState.step === onboardingStep) {
      return
    }

    dispatch(action)
    navigateToStep(nextState.step)
  }, [navigateToStep, onboardingStep, settings, state])

  const goToLevelDetails = useCallback(() => {
    if (import.meta.env.DEV) {
      console.log('ACTION: goToLevelDetails');
    }
    setOnboardingStep(3)
  }, [setOnboardingStep])

  const handleHome = useCallback((setCurrentMode) => {
    if (import.meta.env.DEV) {
      console.log('ACTION: handleHome');
    }
    if (setCurrentMode) {
      setCurrentMode('onboarding')
    }
    // Reset theme-based practice settings
    settings.set({
      cameFromTema: false,
      specificMood: null,
      specificTense: null
    })
    
    setOnboardingStep(1, { replace: true }) // Go to step 1: Dialect selection for clean start
  }, [setOnboardingStep, settings])

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
