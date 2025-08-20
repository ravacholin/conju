import { create } from 'zustand'
import { saveProgress, loadProgress } from '../lib/store.js'

// Define which keys should be persisted (exclude transient UI state)
const PERSISTED_KEYS = [
  'level', 'useTuteo', 'useVoseo', 'useVosotros', 'strict', 'accentTolerance',
  'requireDieresis', 'blockNonNormativeSpelling', 'cliticStrictness', 'cliticsPercent',
  'neutralizePronoun', 'rotateSecondPerson', 'nextSecondPerson', 'timeMode', 
  'perItemMs', 'medianTargetMs', 'enableFuturoSubjRead', 'enableFuturoSubjProd',
  'enableC2Conmutacion', 'burstSize', 'conmutacionSeq', 'conmutacionIdx', 'c2RareBoostLemmas',
  'resistanceActive', 'resistanceMsLeft', 'resistanceStartTs', 'resistanceBestMsByLevel',
  'reverseActive', 'doubleActive', 'region', 'practicePronoun', 'showPronouns',
  'verbType', 'allowedLemmas', 'currentBlock', 'practiceMode', 'specificMood', 'specificTense'
]

const STORAGE_KEY = 'spanish-conjugator-settings'

// Debounced persist function to avoid excessive writes
let persistTimeout = null
const debouncedPersist = (state) => {
  if (persistTimeout) clearTimeout(persistTimeout)
  persistTimeout = setTimeout(async () => {
    try {
      const persistedState = {}
      PERSISTED_KEYS.forEach(key => {
        if (key in state) {
          persistedState[key] = state[key]
        }
      })
      await saveProgress(STORAGE_KEY, persistedState)
    } catch (error) {
      console.warn('Failed to persist settings:', error)
    }
  }, 1000)
}

// Hydration function to restore persisted state
const hydrateState = async () => {
  try {
    const persistedState = await loadProgress(STORAGE_KEY)
    return persistedState || {}
  } catch (error) {
    console.warn('Failed to load persisted settings:', error)
    return {}
  }
}

export const useSettings = create((set, get) => ({
  level: 'B1',
  useTuteo: true,
  useVoseo: false,
  useVosotros: false,
  strict: true,          // strict: only target accepted; lenient: accept alternates
  accentTolerance: 'warn', // 'off' | 'warn' | 'accept'
  requireDieresis: false, // require ü in güe/güi contexts
  blockNonNormativeSpelling: false, // block forms like "fué"
  cliticStrictness: 'off', // 'off' | 'low' | 'high'
  cliticsPercent: 0,      // % de ítems que requieren clíticos en impAff
  // Imperfecto de subjuntivo: siempre se aceptan ambas variantes (-ra/-se)
  neutralizePronoun: false, // accept tu<->vos when requested
  rotateSecondPerson: false, // alternate 2s forms at high levels
  nextSecondPerson: '2s_vos',
  timeMode: 'none', // 'none' | 'soft' | 'strict'
  perItemMs: null,
  medianTargetMs: null,
  // C1/C2 advanced toggles
  enableFuturoSubjRead: false,
  enableFuturoSubjProd: false,
  enableC2Conmutacion: false,
  burstSize: 12,
  conmutacionSeq: ['2s_vos','3p','3s'],
  conmutacionIdx: 0,
  c2RareBoostLemmas: [],
  // Resistance mode (Survivor)
  resistanceActive: false,
  resistanceMsLeft: 0,
  resistanceStartTs: null,
  resistanceBestMsByLevel: {},
  // Reverse mode (Reverso)
  reverseActive: false,
  // Double mode (Dos verbos dos)
  doubleActive: false,
  region: 'la_general',  // 'rioplatense' | 'peninsular' | 'la_general'
  practicePronoun: 'both', // 'both' | 'tu_only' | 'vos_only'
  showPronouns: false,   // Show pronouns for early learning
  verbType: 'all',       // 'regular' | 'irregular' | 'all'
  allowedLemmas: null,   // restrict practice to these lemmas when set
  currentBlock: null,    // { combos: [{mood,tense}], itemsRemaining: number }
  
  // Practice mode settings
  practiceMode: 'mixed',  // 'mixed' | 'specific'
  specificMood: null,     // 'indicative' | 'subjunctive' | 'imperative' | 'conditional' | 'nonfinite'
  specificTense: null,    // depends on mood selected
  
  set: (patch) => {
    set((s) => {
      const newState = {...s, ...patch}
      // Persist state changes
      debouncedPersist(newState)
      return newState
    })
  },

  // Hydrate function to restore persisted state
  hydrate: async () => {
    const persistedState = await hydrateState()
    if (Object.keys(persistedState).length > 0) {
      set((s) => ({...s, ...persistedState}))
    }
  }
})) 