import { create } from 'zustand'

export const useSettings = create((set) => ({
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
  
  set: (patch) => set((s) => ({...s, ...patch}))
})) 