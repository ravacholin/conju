/**
 * Flow Configuration Objects
 * 
 * Defines the step sequences, navigation rules, and behavior
 * for the two main user flows: "Por Nivel" and "Por Tema"
 */

// Step definitions - each step has a unique identifier and component mapping
export const STEPS = {
  // Shared steps
  DIALECT_SELECTION: 'dialect_selection',
  MAIN_MENU: 'main_menu', 
  DRILL: 'drill',
  
  // Por Nivel specific steps
  NIVEL_LEVEL_SELECTION: 'nivel_level_selection',
  NIVEL_PRACTICE_MODE: 'nivel_practice_mode',
  NIVEL_MOOD_SELECTION: 'nivel_mood_selection',
  NIVEL_VERB_TYPE: 'nivel_verb_type',
  NIVEL_FAMILY: 'nivel_family',
  
  // Por Tema specific steps
  TEMA_MOOD_SELECTION: 'tema_mood_selection',
  TEMA_TENSE_SELECTION: 'tema_tense_selection', 
  TEMA_VERB_TYPE: 'tema_verb_type',
  TEMA_FAMILY: 'tema_family'
}

// Por Nivel Flow Configuration
export const porNivelFlowConfig = {
  type: 'por_nivel',
  name: 'Por Nivel',
  
  // Linear sequence of steps for this flow
  steps: [
    STEPS.DIALECT_SELECTION,
    STEPS.MAIN_MENU,
    STEPS.NIVEL_LEVEL_SELECTION,
    STEPS.NIVEL_PRACTICE_MODE,  
    STEPS.NIVEL_MOOD_SELECTION,
    STEPS.NIVEL_VERB_TYPE,
    STEPS.NIVEL_FAMILY, // Optional - only if irregular verbs selected
    STEPS.DRILL
  ],
  
  // Navigation rules - defines previous/next step relationships
  navigation: {
    [STEPS.DIALECT_SELECTION]: {
      prev: null, // First step
      next: STEPS.MAIN_MENU
    },
    [STEPS.MAIN_MENU]: {
      prev: STEPS.DIALECT_SELECTION,
      next: STEPS.NIVEL_LEVEL_SELECTION // When "Por nivel" selected
    },
    [STEPS.NIVEL_LEVEL_SELECTION]: {
      prev: STEPS.MAIN_MENU,
      next: STEPS.NIVEL_PRACTICE_MODE
    },
    [STEPS.NIVEL_PRACTICE_MODE]: {
      prev: STEPS.NIVEL_LEVEL_SELECTION,
      next: (settings) => {
        // Mixed practice goes directly to verb type
        if (settings.practiceMode === 'mixed') {
          return STEPS.NIVEL_VERB_TYPE
        }
        // Specific practice goes to mood selection  
        return STEPS.NIVEL_MOOD_SELECTION
      }
    },
    [STEPS.NIVEL_MOOD_SELECTION]: {
      prev: STEPS.NIVEL_PRACTICE_MODE,
      next: STEPS.NIVEL_VERB_TYPE
    },
    [STEPS.NIVEL_VERB_TYPE]: {
      prev: (settings) => {
        // Come from mood selection if specific practice
        if (settings.practiceMode === 'specific') {
          return STEPS.NIVEL_MOOD_SELECTION
        }
        // Come from practice mode if mixed practice
        return STEPS.NIVEL_PRACTICE_MODE
      },
      next: (settings) => {
        // Go to family selection if irregular verbs selected
        if (settings.verbType === 'irregular') {
          return STEPS.NIVEL_FAMILY
        }
        // Otherwise go to drill
        return STEPS.DRILL
      }
    },
    [STEPS.NIVEL_FAMILY]: {
      prev: STEPS.NIVEL_VERB_TYPE,
      next: STEPS.DRILL
    },
    [STEPS.DRILL]: {
      prev: (settings) => {
        // Complex logic to determine where drill came from
        if (settings.selectedFamily) return STEPS.NIVEL_FAMILY
        if (settings.verbType) return STEPS.NIVEL_VERB_TYPE
        if (settings.specificMood) return STEPS.NIVEL_MOOD_SELECTION
        return STEPS.NIVEL_PRACTICE_MODE
      },
      next: null // Last step
    }
  },
  
  // Settings that are relevant to this flow
  settings: {
    namespace: 'porNivel',
    required: ['level', 'practiceMode'], 
    optional: ['specificMood', 'verbType', 'selectedFamily']
  },
  
  // URL path configuration for deep linking
  urlPaths: {
    [STEPS.DIALECT_SELECTION]: '/por-nivel',
    [STEPS.MAIN_MENU]: '/por-nivel/menu', 
    [STEPS.NIVEL_LEVEL_SELECTION]: '/por-nivel/level',
    [STEPS.NIVEL_PRACTICE_MODE]: '/por-nivel/practice-mode',
    [STEPS.NIVEL_MOOD_SELECTION]: '/por-nivel/mood',
    [STEPS.NIVEL_VERB_TYPE]: '/por-nivel/verb-type',
    [STEPS.NIVEL_FAMILY]: '/por-nivel/family',
    [STEPS.DRILL]: '/por-nivel/drill'
  }
}

// Por Tema Flow Configuration  
export const porTemaFlowConfig = {
  type: 'por_tema',
  name: 'Por Tema',
  
  // Linear sequence of steps for this flow
  steps: [
    STEPS.DIALECT_SELECTION,
    STEPS.MAIN_MENU,
    STEPS.TEMA_MOOD_SELECTION,
    STEPS.TEMA_TENSE_SELECTION,
    STEPS.TEMA_VERB_TYPE, 
    STEPS.TEMA_FAMILY, // Optional - only if irregular verbs selected
    STEPS.DRILL
  ],
  
  // Navigation rules - simpler than Por Nivel since it's more linear
  navigation: {
    [STEPS.DIALECT_SELECTION]: {
      prev: null, // First step
      next: STEPS.MAIN_MENU
    },
    [STEPS.MAIN_MENU]: {
      prev: STEPS.DIALECT_SELECTION,
      next: STEPS.TEMA_MOOD_SELECTION // When "Por tema" selected
    },
    [STEPS.TEMA_MOOD_SELECTION]: {
      prev: STEPS.MAIN_MENU,
      next: STEPS.TEMA_TENSE_SELECTION
    },
    [STEPS.TEMA_TENSE_SELECTION]: {
      prev: STEPS.TEMA_MOOD_SELECTION, 
      next: STEPS.TEMA_VERB_TYPE
    },
    [STEPS.TEMA_VERB_TYPE]: {
      prev: STEPS.TEMA_TENSE_SELECTION,
      next: (settings) => {
        // Go to family selection if irregular verbs selected
        if (settings.verbType === 'irregular') {
          return STEPS.TEMA_FAMILY
        }
        // Otherwise go to drill
        return STEPS.DRILL
      }
    },
    [STEPS.TEMA_FAMILY]: {
      prev: STEPS.TEMA_VERB_TYPE,
      next: STEPS.DRILL
    },
    [STEPS.DRILL]: {
      prev: (settings) => {
        // Simpler logic since Por Tema is more linear
        if (settings.selectedFamily) return STEPS.TEMA_FAMILY
        if (settings.verbType) return STEPS.TEMA_VERB_TYPE
        if (settings.specificTense) return STEPS.TEMA_TENSE_SELECTION
        return STEPS.TEMA_MOOD_SELECTION
      },
      next: null // Last step
    }
  },
  
  // Settings that are relevant to this flow
  settings: {
    namespace: 'porTema',
    required: ['specificMood', 'specificTense'],
    optional: ['verbType', 'selectedFamily']
  },
  
  // URL path configuration for deep linking
  urlPaths: {
    [STEPS.DIALECT_SELECTION]: '/por-tema',
    [STEPS.MAIN_MENU]: '/por-tema/menu',
    [STEPS.TEMA_MOOD_SELECTION]: '/por-tema/mood',
    [STEPS.TEMA_TENSE_SELECTION]: '/por-tema/tense', 
    [STEPS.TEMA_VERB_TYPE]: '/por-tema/verb-type',
    [STEPS.TEMA_FAMILY]: '/por-tema/family',
    [STEPS.DRILL]: '/por-tema/drill'
  }
}

// Utility function to get flow config by type
export const getFlowConfig = (flowType) => {
  switch (flowType) {
    case 'por_nivel':
      return porNivelFlowConfig
    case 'por_tema':
      return porTemaFlowConfig
    default:
      throw new Error(`Unknown flow type: ${flowType}`)
  }
}

// Utility function to determine flow type from URL
export const getFlowTypeFromUrl = (pathname) => {
  if (pathname.startsWith('/por-nivel')) {
    return 'por_nivel'
  } else if (pathname.startsWith('/por-tema')) {
    return 'por_tema'
  }
  return null
}

// Utility function to get current step from URL
export const getStepFromUrl = (pathname, flowConfig) => {
  // Find step by matching URL path
  for (const [step, path] of Object.entries(flowConfig.urlPaths)) {
    if (pathname === path) {
      return step
    }
  }
  return null
}