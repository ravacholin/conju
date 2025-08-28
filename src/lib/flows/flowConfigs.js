/**
 * Flow Configuration Objects
 * 
 * Defines the navigation rules, steps, and settings for different user flows
 */

// Common step definitions
export const STEPS = {
  DIALECT_SELECTION: 'dialect_selection',
  MAIN_MENU: 'main_menu',
  NIVEL_LEVEL_SELECTION: 'nivel_level_selection',
  PRACTICE_MODE_SELECTION: 'practice_mode_selection', 
  MOOD_TENSE_SELECTION: 'mood_tense_selection',
  VERB_TYPE_SELECTION: 'verb_type_selection',
  FAMILY_SELECTION: 'family_selection',
  DRILL: 'drill'
}

// Por Nivel Flow Configuration
export const porNivelFlowConfig = {
  type: 'por_nivel',
  name: 'Por Nivel',
  
  // Linear flow steps
  steps: [
    STEPS.DIALECT_SELECTION,
    STEPS.MAIN_MENU, 
    STEPS.NIVEL_LEVEL_SELECTION,
    STEPS.PRACTICE_MODE_SELECTION,
    STEPS.MOOD_TENSE_SELECTION,
    STEPS.VERB_TYPE_SELECTION,
    STEPS.FAMILY_SELECTION,
    STEPS.DRILL
  ],
  
  // Navigation rules between steps
  navigation: {
    [STEPS.DIALECT_SELECTION]: {
      next: STEPS.MAIN_MENU
    },
    [STEPS.MAIN_MENU]: {
      prev: STEPS.DIALECT_SELECTION,
      next: STEPS.NIVEL_LEVEL_SELECTION
    },
    [STEPS.NIVEL_LEVEL_SELECTION]: {
      prev: STEPS.MAIN_MENU,
      next: STEPS.PRACTICE_MODE_SELECTION
    },
    [STEPS.PRACTICE_MODE_SELECTION]: {
      prev: STEPS.NIVEL_LEVEL_SELECTION,
      next: (settings) => {
        // Mixed practice goes straight to verb type selection
        if (settings.practiceMode === 'mixed') {
          return STEPS.VERB_TYPE_SELECTION
        }
        // Theme practice goes to mood/tense selection
        return STEPS.MOOD_TENSE_SELECTION
      }
    },
    [STEPS.MOOD_TENSE_SELECTION]: {
      prev: STEPS.PRACTICE_MODE_SELECTION,
      next: STEPS.VERB_TYPE_SELECTION
    },
    [STEPS.VERB_TYPE_SELECTION]: {
      prev: (settings) => {
        if (settings.practiceMode === 'mixed') {
          return STEPS.PRACTICE_MODE_SELECTION
        }
        return STEPS.MOOD_TENSE_SELECTION
      },
      next: (settings) => {
        // Irregular verbs go to family selection
        if (settings.verbType === 'irregular') {
          return STEPS.FAMILY_SELECTION
        }
        // Others go to drill
        return STEPS.DRILL
      }
    },
    [STEPS.FAMILY_SELECTION]: {
      prev: STEPS.VERB_TYPE_SELECTION,
      next: STEPS.DRILL
    },
    [STEPS.DRILL]: {
      prev: (settings) => {
        if (settings.selectedFamily) {
          return STEPS.FAMILY_SELECTION
        } else if (settings.verbType) {
          return STEPS.VERB_TYPE_SELECTION
        }
        return STEPS.MAIN_MENU
      }
    }
  },
  
  // URL paths for each step
  urlPaths: {
    [STEPS.DIALECT_SELECTION]: '/por-nivel',
    [STEPS.MAIN_MENU]: '/por-nivel/menu',
    [STEPS.NIVEL_LEVEL_SELECTION]: '/por-nivel/level',
    [STEPS.PRACTICE_MODE_SELECTION]: '/por-nivel/mode',
    [STEPS.MOOD_TENSE_SELECTION]: '/por-nivel/mood-tense',
    [STEPS.VERB_TYPE_SELECTION]: '/por-nivel/verb-type',
    [STEPS.FAMILY_SELECTION]: '/por-nivel/family',
    [STEPS.DRILL]: '/por-nivel/drill'
  },
  
  // Settings configuration
  settings: {
    namespace: 'porNivel',
    required: ['level', 'practiceMode']
  }
}

// Por Tema Flow Configuration  
export const porTemaFlowConfig = {
  type: 'por_tema',
  name: 'Por Tema',
  
  // Linear flow steps (skips level selection)
  steps: [
    STEPS.DIALECT_SELECTION,
    STEPS.MAIN_MENU,
    STEPS.MOOD_TENSE_SELECTION, 
    STEPS.VERB_TYPE_SELECTION,
    STEPS.FAMILY_SELECTION,
    STEPS.DRILL
  ],
  
  // Navigation rules between steps
  navigation: {
    [STEPS.DIALECT_SELECTION]: {
      next: STEPS.MAIN_MENU
    },
    [STEPS.MAIN_MENU]: {
      prev: STEPS.DIALECT_SELECTION,
      next: STEPS.MOOD_TENSE_SELECTION
    },
    [STEPS.MOOD_TENSE_SELECTION]: {
      prev: STEPS.MAIN_MENU,
      next: STEPS.VERB_TYPE_SELECTION
    },
    [STEPS.VERB_TYPE_SELECTION]: {
      prev: STEPS.MOOD_TENSE_SELECTION,
      next: (settings) => {
        // Irregular verbs go to family selection
        if (settings.verbType === 'irregular') {
          return STEPS.FAMILY_SELECTION
        }
        // Others go to drill
        return STEPS.DRILL
      }
    },
    [STEPS.FAMILY_SELECTION]: {
      prev: STEPS.VERB_TYPE_SELECTION,
      next: STEPS.DRILL
    },
    [STEPS.DRILL]: {
      prev: (settings) => {
        if (settings.selectedFamily) {
          return STEPS.FAMILY_SELECTION
        } else if (settings.verbType) {
          return STEPS.VERB_TYPE_SELECTION
        }
        return STEPS.MAIN_MENU
      }
    }
  },
  
  // URL paths for each step
  urlPaths: {
    [STEPS.DIALECT_SELECTION]: '/por-tema',
    [STEPS.MAIN_MENU]: '/por-tema/menu', 
    [STEPS.MOOD_TENSE_SELECTION]: '/por-tema/mood-tense',
    [STEPS.VERB_TYPE_SELECTION]: '/por-tema/verb-type',
    [STEPS.FAMILY_SELECTION]: '/por-tema/family',
    [STEPS.DRILL]: '/por-tema/drill'
  },
  
  // Settings configuration
  settings: {
    namespace: 'porTema',
    required: ['specificMood', 'specificTense']
  }
}