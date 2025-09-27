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
    (set, _get) => ({
      // Configuración de usuario
      level: 'A1',
      // Variante: no se fija por defecto. Se define en Onboarding.
      useVoseo: false,
      useTuteo: false,
      useVosotros: false,
      region: null,
      
      // Modo de práctica
      practiceMode: 'mixed',
      specificMood: null,
      specificTense: null,
      // Se definirá al elegir variante; sin valor inicial
      practicePronoun: null,
      // Filtro de irregularidad: 'tense' (por forma) | 'lemma' (por verbo)
      irregularityFilterMode: 'tense',
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
      
      // Sistema de chunks - toggle para fallback de emergencia
      enableChunks: true, // Puede deshabilitarse si hay problemas
      chunksFailsafeActivated: false, // Track if failsafe was activated
      chunksFailsafeCount: 0, // Count of failsafe activations
      chunksRecoveryScheduledAt: null,
      lastChunkFailureReason: null,

      // Sistema de progreso - toggle para la integración con mastery data
      enableProgressIntegration: true, // Puede deshabilitarse si hay problemas
      
      // Métodos para actualizar configuración
      set: (newSettings) => set((state) => ({ ...state, ...newSettings })),
      setLevel: (level) => set({ level }),
      toggleVoseo: () => set((state) => ({ useVoseo: !state.useVoseo })),
      toggleTuteo: () => set((state) => ({ useTuteo: !state.useTuteo })),
      toggleVosotros: () => set((state) => ({ useVosotros: !state.useVosotros })),
      setRegion: (region) => set({ region }),
      setPracticeMode: (mode) => set({ practiceMode: mode }),
      setSpecificMood: (mood) => set({ specificMood: mood }),
      setSpecificTense: (tense) => set({ specificTense: tense }),
      setPracticePronoun: (pronoun) => set({ practicePronoun: pronoun }),
      setIrregularityFilterMode: (mode) => set({ irregularityFilterMode: mode === 'lemma' ? 'lemma' : 'tense' }),
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
      toggleChunks: () => set((state) => ({ enableChunks: !state.enableChunks })),
      toggleProgressIntegration: () => set((state) => ({ enableProgressIntegration: !state.enableProgressIntegration })),
      
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
        irregularityFilterMode: state.irregularityFilterMode,
        verbType: state.verbType,
        selectedFamily: state.selectedFamily,
        // Persistir conmutación C2 para asegurar continuidad y variedad
        enableC2Conmutacion: state.enableC2Conmutacion,
        conmutacionSeq: state.conmutacionSeq,
        conmutacionIdx: state.conmutacionIdx,
        rotateSecondPerson: state.rotateSecondPerson,
        nextSecondPerson: state.nextSecondPerson,
        enableFuturoSubjProd: state.enableFuturoSubjProd,
        enableFuturoSubjRead: state.enableFuturoSubjRead,
        cliticsPercent: state.cliticsPercent,
        resistanceBestMsByLevel: state.resistanceBestMsByLevel
      })
    }
  )
)

export { useSettings, LEVELS } 
