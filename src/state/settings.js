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
      
      // Flow-based navigation system
      flowType: null, // 'por_nivel' | 'por_tema' | null
      
      // Flow-specific settings namespaces
      // Por Nivel flow settings
      porNivel_level: null,
      porNivel_practiceMode: null,
      porNivel_specificMood: null, 
      porNivel_verbType: null,
      porNivel_selectedFamily: null,
      
      // Por Tema flow settings
      porTema_specificMood: null,
      porTema_specificTense: null,
      porTema_verbType: null,
      porTema_selectedFamily: null,
      
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
      
      // Flow-specific setting helpers
      getFlowSetting: (flowType, key) => {
        const state = get()
        const namespacedKey = `${flowType}_${key}`
        return state[namespacedKey] !== undefined ? state[namespacedKey] : state[key]
      },
      
      setFlowSetting: (flowType, key, value) => {
        const namespacedKey = `${flowType}_${key}`
        const updates = { [namespacedKey]: value }
        
        // Also update the global version for backward compatibility
        if (get().flowType === flowType) {
          updates[key] = value
        }
        
        set(updates)
      },
      
      setFlowSettings: (flowType, settings) => {
        const updates = {}
        
        for (const [key, value] of Object.entries(settings)) {
          const namespacedKey = `${flowType}_${key}`
          updates[namespacedKey] = value
          
          // Also update global version if this is the current flow
          if (get().flowType === flowType) {
            updates[key] = value
          }
        }
        
        set(updates)
      },
      
      clearFlowSettings: (flowType) => {
        const state = get()
        const updates = {}
        
        // Clear all namespaced settings for this flow
        const flowKeys = ['level', 'practiceMode', 'specificMood', 'specificTense', 'verbType', 'selectedFamily']
        
        for (const key of flowKeys) {
          const namespacedKey = `${flowType}_${key}`
          if (state[namespacedKey] !== undefined) {
            updates[namespacedKey] = null
          }
          
          // Also clear global version if this is the current flow
          if (state.flowType === flowType) {
            updates[key] = null
          }
        }
        
        set(updates)
      },
      
      // Switch to a specific flow and sync settings
      switchToFlow: (flowType) => {
        const state = get()
        const updates = { flowType }
        
        if (flowType) {
          // Load flow-specific settings into global settings
          const flowKeys = ['level', 'practiceMode', 'specificMood', 'specificTense', 'verbType', 'selectedFamily']
          
          for (const key of flowKeys) {
            const namespacedKey = `${flowType}_${key}`
            if (state[namespacedKey] !== undefined && state[namespacedKey] !== null) {
              updates[key] = state[namespacedKey]
            }
          }
        } else {
          // Clearing flow type - could clear some settings
          updates.specificMood = null
          updates.specificTense = null
          updates.verbType = 'all'
          updates.selectedFamily = null
        }
        
        set(updates)
      },
      
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
        resistanceBestMsByLevel: state.resistanceBestMsByLevel,
        
        // Flow-based navigation settings
        flowType: state.flowType,
        
        // Por Nivel flow settings
        porNivel_level: state.porNivel_level,
        porNivel_practiceMode: state.porNivel_practiceMode,
        porNivel_specificMood: state.porNivel_specificMood,
        porNivel_verbType: state.porNivel_verbType,
        porNivel_selectedFamily: state.porNivel_selectedFamily,
        
        // Por Tema flow settings
        porTema_specificMood: state.porTema_specificMood,
        porTema_specificTense: state.porTema_specificTense,
        porTema_verbType: state.porTema_verbType,
        porTema_selectedFamily: state.porTema_selectedFamily
      })
    }
  )
)

export { useSettings, LEVELS } 
