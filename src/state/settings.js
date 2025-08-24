import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getCacheStats, clearAllCaches } from '../lib/core/optimizedCache.js'

// Niveles disponibles
const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'ALL']

// Inicializar caches al cargar
if (typeof window !== 'undefined') {
  import('../lib/core/optimizedCache.js').then(({ warmupCaches }) => {
    warmupCaches()
  })
  
  // Note: Progress system initialization moved to AppRouter for better error handling
}

const useSettings = create(
  persist(
    (set, get) => ({
      // Configuración de usuario
      level: 'A1',
      useVoseo: true,
      useTuteo: false,
      useVosotros: false,
      region: 'rioplatense', // por defecto rioplatense
      
      // Modo de práctica
      practiceMode: 'mixed',
      specificMood: null,
      specificTense: null,
      practicePronoun: 'all', // 'tu_only', 'vos_only', 'both', 'all'
      verbType: 'all', // 'all', 'regular', 'irregular'
      selectedFamily: null,
      
      // Verbos permitidos (por nivel/packs)
      allowedLemmas: null,
      
      // Features
      resistanceActive: false,
      resistanceMsLeft: 0,
      resistanceStartTs: null,
      resistanceBestMsByLevel: {},
      reverseActive: false,
      doubleActive: false,
      
      // Configuración de futuro subjuntivo
      enableFuturoSubjProd: false,
      enableFuturoSubjRead: false,
      
      // C2 conmutación
      enableC2Conmutacion: false,
      conmutacionSeq: ['2s_vos','3p','3s'],
      conmutacionIdx: 0,
      
      // Rotación de segunda persona
      rotateSecondPerson: false,
      nextSecondPerson: '2s_vos',
      
      // Porcentaje de clíticos en imperativo afirmativo
      cliticsPercent: 0,
      
      // Verbos raros para C2
      c2RareBoostLemmas: [],
      
      // Métodos para actualizar configuración
      set: (newSettings) => set({ ...get(), ...newSettings }),
      setLevel: (level) => set({ level }),
      toggleVoseo: () => set((state) => ({ useVoseo: !state.useVoseo })),
      toggleTuteo: () => set((state) => ({ useTuteo: !state.useTuteo })),
      toggleVosotros: () => set((state) => ({ useVosotros: !state.useVosotros })),
      setRegion: (region) => set({ region }),
      setPracticeMode: (mode) => set({ practiceMode: mode }),
      setSpecificMood: (mood) => set({ specificMood: mood }),
      setSpecificTense: (tense) => set({ specificTense: tense }),
      setPracticePronoun: (pronoun) => set({ practicePronoun: pronoun }),
      setVerbType: (type) => set({ verbType: type }),
      setSelectedFamily: (family) => set({ selectedFamily: family }),
      setAllowedLemmas: (lemmas) => set({ allowedLemmas: lemmas }),
      toggleResistance: () => set((state) => ({ 
        resistanceActive: !state.resistanceActive,
        resistanceMsLeft: !state.resistanceActive ? 30000 : 0,
        resistanceStartTs: !state.resistanceActive ? Date.now() : null
      })),
      toggleReverse: () => set((state) => ({ reverseActive: !state.reverseActive })),
      toggleDouble: () => set((state) => ({ doubleActive: !state.doubleActive })),
      toggleFuturoSubjProd: () => set((state) => ({ enableFuturoSubjProd: !state.enableFuturoSubjProd })),
      toggleFuturoSubjRead: () => set((state) => ({ enableFuturoSubjRead: !state.enableFuturoSubjRead })),
      setCliticsPercent: (percent) => set({ cliticsPercent: percent }),
      setC2RareBoost: (lemmas) => set({ c2RareBoostLemmas: lemmas }),
      
      // Métodos para debugging
      getCacheStats: () => {
        if (typeof window !== 'undefined') {
          return getCacheStats()
        }
        return {}
      },
      clearCaches: () => {
        if (typeof window !== 'undefined') {
          clearAllCaches()
        }
      }
    }),
    {
      name: 'spanish-conjugator-settings',
      partialize: (state) => ({
        // Solo persistir configuración de usuario, no estado temporal
        level: state.level,
        useVoseo: state.useVoseo,
        useTuteo: state.useTuteo,
        useVosotros: state.useVosotros,
        region: state.region,
        practiceMode: state.practiceMode,
        specificMood: state.specificMood,
        specificTense: state.specificTense,
        practicePronoun: state.practicePronoun,
        verbType: state.verbType,
        selectedFamily: state.selectedFamily,
        enableFuturoSubjProd: state.enableFuturoSubjProd,
        enableFuturoSubjRead: state.enableFuturoSubjRead,
        cliticsPercent: state.cliticsPercent,
        resistanceBestMsByLevel: state.resistanceBestMsByLevel
      })
    }
  )
)

export { useSettings, LEVELS } 