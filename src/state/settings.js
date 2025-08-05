import { create } from 'zustand'

export const useSettings = create((set) => ({
  level: 'A1',
  useTuteo: true,
  useVoseo: false,
  useVosotros: false,
  strict: true,          // strict: only target accepted; lenient: accept alternates
  accentTolerance: 'warn', // 'off' | 'warn' | 'accept'
  region: 'la_general',  // 'rioplatense' | 'peninsular' | 'la_general'
  
  // Practice mode settings
  practiceMode: 'mixed',  // 'mixed' | 'specific'
  specificMood: null,     // 'indicative' | 'subjunctive' | 'imperative' | 'conditional' | 'nonfinite'
  specificTense: null,    // depends on mood selected
  
  set: (patch) => set((s) => ({...s, ...patch}))
})) 