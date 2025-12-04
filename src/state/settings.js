import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getCacheStats, clearAllCaches } from '../lib/core/optimizedCache.js'

// Niveles disponibles
const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'ALL']

export const RESISTANCE_MAX_MS = 120000

// Practice modes
export const PRACTICE_MODES = {
  BY_LEVEL: 'by_level',
  BY_TOPIC: 'by_topic'
}

// Lazy cache warmup - only warm up when actually needed
// Warmup is triggered by Drill component on mount to avoid penalizing time-to-interactive
export const warmupCachesIfNeeded = (() => {
  let hasWarmedUp = false

  return () => {
    if (hasWarmedUp || typeof window === 'undefined') return Promise.resolve()

    hasWarmedUp = true
    return import('../lib/core/optimizedCache.js').then(({ warmupCaches }) => {
      warmupCaches()
    }).catch(err => {
      console.warn('Cache warmup failed:', err)
      hasWarmedUp = false // Allow retry on failure
    })
  }
})()

const useSettings = create(
  persist(
    (set, _get) => ({
      // Sync tracking
      lastUpdated: Date.now(), // Timestamp for sync conflict resolution

      // Configuración de usuario
      level: 'A1',
      // Variante: no se fija por defecto. Se define en Onboarding.
      useVoseo: false,
      useTuteo: false,
      useVosotros: false,
      region: null,

      // User level system
      userLevel: 'A2', // Personal CEFR level (separate from practice level)
      userLevelProgress: 0, // Progress within current level (0-100%)
      hasCompletedPlacementTest: false,
      placementTestReport: null,

      // Practice mode system
      practiceMode: 'mixed', // Legacy mode
      levelPracticeMode: PRACTICE_MODES.BY_LEVEL, // New dual mode system
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

      // Metas diarias
      dailyGoalType: 'attempts',
      dailyGoalValue: 20,

      // Recordatorios de práctica
      practiceReminderEnabled: false,
      practiceReminderTime: '19:00',
      practiceReminderDays: [1, 2, 3, 4, 5],
      
      // Métodos para actualizar configuración
      set: (newSettings) => set((state) => ({ ...state, ...newSettings, lastUpdated: Date.now() })),
      setLevel: (level) => set({ level, lastUpdated: Date.now() }),

      // User level system methods
      setUserLevel: (userLevel) => set({ userLevel }),
      setUserLevelProgress: (progress) => set({ userLevelProgress: Math.max(0, Math.min(100, progress)) }),
      setPlacementTestCompleted: (completed) => set({ hasCompletedPlacementTest: completed }),
      setPlacementTestReport: (report) => set({ placementTestReport: report }),

      // Practice mode methods
      setLevelPracticeMode: (mode) => set({ levelPracticeMode: mode }),
      togglePracticeMode: () => set((state) => ({
        levelPracticeMode: state.levelPracticeMode === PRACTICE_MODES.BY_LEVEL
          ? PRACTICE_MODES.BY_TOPIC
          : PRACTICE_MODES.BY_LEVEL
      })),

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

      setDailyGoalType: (goalType) =>
        set({ dailyGoalType: goalType === 'minutes' ? 'minutes' : 'attempts' }),
      setDailyGoalValue: (value) => {
        const numericValue = Number(value)
        const sanitized = Number.isFinite(numericValue) ? Math.max(0, numericValue) : 0
        set((state) => ({
          dailyGoalValue:
            state.dailyGoalType === 'minutes'
              ? Math.round(sanitized * 10) / 10
              : Math.round(sanitized)
        }))
      },

      setPracticeReminderEnabled: (enabled) =>
        set({ practiceReminderEnabled: Boolean(enabled) }),
      setPracticeReminderTime: (time) => {
        if (typeof time !== 'string' || time.length < 3) {
          return set({ practiceReminderTime: '19:00' })
        }
        const [hours, minutes] = time.split(':')
        const normalizedHours = String(Math.max(0, Math.min(23, Number(hours) || 0))).padStart(2, '0')
        const normalizedMinutes = String(Math.max(0, Math.min(59, Number(minutes) || 0))).padStart(2, '0')
        set({ practiceReminderTime: `${normalizedHours}:${normalizedMinutes}` })
      },
      togglePracticeReminderDay: (dayIndex) => {
        const normalized = Number.isInteger(dayIndex) ? ((dayIndex % 7) + 7) % 7 : null
        if (normalized === null) return
        set((state) => {
          const current = Array.isArray(state.practiceReminderDays) ? state.practiceReminderDays : []
          const exists = current.includes(normalized)
          const updated = exists
            ? current.filter(day => day !== normalized)
            : [...current, normalized].sort((a, b) => a - b)
          return { practiceReminderDays: updated }
        })
      },
      setPracticeReminderDays: (days) => {
        const normalized = Array.isArray(days)
          ? Array.from(new Set(
              days
                .map(day => ((Number(day) % 7) + 7) % 7)
                .filter(day => Number.isInteger(day))
            )).sort((a, b) => a - b)
          : []
        set({ practiceReminderDays: normalized })
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
        // Sync tracking
        lastUpdated: state.lastUpdated,

        // Solo persistir configuración de usuario, no estado temporal
        level: state.level,
        useVoseo: state.useVoseo,
        useTuteo: state.useTuteo,
        useVosotros: state.useVosotros,
        region: state.region,
        practiceMode: state.practiceMode,
        userLevel: state.userLevel,
        userLevelProgress: state.userLevelProgress,
        hasCompletedPlacementTest: state.hasCompletedPlacementTest,
        placementTestReport: state.placementTestReport,
        levelPracticeMode: state.levelPracticeMode,
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
        resistanceBestMsByLevel: state.resistanceBestMsByLevel,
        dailyGoalType: state.dailyGoalType,
        dailyGoalValue: state.dailyGoalValue,
        practiceReminderEnabled: state.practiceReminderEnabled,
        practiceReminderTime: state.practiceReminderTime,
        practiceReminderDays: state.practiceReminderDays
      })
    }
  )
)

// Persist settings to IndexedDB for cross-device sync
let isHydrated = false

useSettings.subscribe((state) => {
  // Skip initial hydration from localStorage
  if (!isHydrated) {
    isHydrated = true
    return
  }

  // Persist to IndexedDB for sync (debounced)
  persistSettingsToIndexedDB(state)
})

let persistTimeout = null
async function persistSettingsToIndexedDB(settings) {
  // Debounce: wait 1 second after last change
  clearTimeout(persistTimeout)
  persistTimeout = setTimeout(async () => {
    try {
      const { saveUserSettings } = await import('../lib/progress/database.js')
      const userId = localStorage.getItem('userId')

      if (!userId) return // Not logged in yet

      await saveUserSettings(userId, settings)
    } catch (error) {
      console.warn('Failed to persist settings to IndexedDB:', error)
    }
  }, 1000)
}

// Flush function to force immediate IndexedDB save (bypasses debounce)
// Used by sync coordinator to ensure settings are persisted before sync
export async function flushSettings() {
  clearTimeout(persistTimeout)
  const state = useSettings.getState()
  const userId = localStorage.getItem('userId')

  if (!userId) return

  try {
    const { saveUserSettings } = await import('../lib/progress/database.js')
    await saveUserSettings(userId, state)
  } catch (error) {
    console.warn('Failed to flush settings to IndexedDB:', error)
  }
}

export { useSettings, LEVELS } 
