import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { z } from 'zod'
import { getCacheStats, clearAllCaches } from '../lib/core/optimizedCache.js'
import { getCurrentUserId } from '../lib/progress/userSettingsStore.js'

// Niveles disponibles
const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'ALL']

export const RESISTANCE_MAX_MS = 120000

// Practice modes
export const PRACTICE_MODES = {
  BY_LEVEL: 'by_level',
  BY_TOPIC: 'by_topic'
}

const SETTINGS_VERSION = 3

const createDefaultSettings = () => ({
  // Sync tracking
  lastUpdated: Date.now(),

  // Configuración de usuario
  level: 'A1',
  useVoseo: false,
  useTuteo: false,
  useVosotros: false,
  region: null,
  strict: null,
  accentTolerance: null,
  requireDieresis: false,
  blockNonNormativeSpelling: false,
  cliticStrictness: 'off',
  impSubjVariantMode: 'accept_both',
  neutralizePronoun: false,
  timeMode: null,
  perItemMs: null,
  medianTargetMs: null,
  showPronouns: null,
  burstSize: null,
  cameFromTema: false,

  // User level system
  userLevel: 'A2',
  userLevelProgress: 0,
  hasCompletedPlacementTest: false,
  placementTestReport: null,

  // Practice mode system
  practiceMode: 'mixed',
  levelPracticeMode: PRACTICE_MODES.BY_LEVEL,
  specificMood: null,
  specificTense: null,
  practicePronoun: null,
  irregularityFilterMode: 'tense',
  verbType: 'all',
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
  conmutacionSeq: ['2s_vos', '3p', '3s'],
  conmutacionIdx: 0,

  // Rotación de segunda persona
  rotateSecondPerson: false,
  nextSecondPerson: '2s_vos',

  // Porcentaje de clíticos en imperativo afirmativo
  cliticsPercent: 0,

  // Verbos raros para C2
  c2RareBoostLemmas: [],

  // Sistema de chunks - toggle para fallback de emergencia
  enableChunks: true,
  chunksFailsafeActivated: false,
  chunksFailsafeCount: 0,
  chunksRecoveryScheduledAt: null,
  lastChunkFailureReason: null,

  // Sistema de progreso - toggle para la integración con mastery data
  enableProgressIntegration: true,

  // Metas diarias
  dailyGoalType: 'attempts',
  dailyGoalValue: 20,

  // Recordatorios de práctica
  practiceReminderEnabled: false,
  practiceReminderTime: '19:00',
  practiceReminderDays: [1, 2, 3, 4, 5],

  // Revisión SRS
  reviewSessionType: 'due',
  reviewSessionFilter: {},

  // Bloques de práctica
  currentBlock: null
})

const SETTINGS_STATE_KEYS = Object.freeze(Object.keys(createDefaultSettings()))
const SETTINGS_STATE_KEYS_SET = new Set(SETTINGS_STATE_KEYS)

const sanitizeSettingsUpdate = (update, source = 'unknown') => {
  if (!update || typeof update !== 'object') {
    return {}
  }

  const sanitized = {}
  const unknownKeys = []

  Object.keys(update).forEach((key) => {
    if (SETTINGS_STATE_KEYS_SET.has(key)) {
      sanitized[key] = update[key]
    } else if (key !== 'lastUpdated') {
      unknownKeys.push(key)
    }
  })

  if (unknownKeys.length > 0 && import.meta.env?.DEV) {
    console.warn(`useSettings.set ignored unknown keys (${source})`, unknownKeys)
  }

  return sanitized
}

const PERSISTED_SETTINGS_KEYS = [
  'lastUpdated',
  'level',
  'useVoseo',
  'useTuteo',
  'useVosotros',
  'region',
  'strict',
  'accentTolerance',
  'requireDieresis',
  'blockNonNormativeSpelling',
  'cliticStrictness',
  'impSubjVariantMode',
  'neutralizePronoun',
  'timeMode',
  'perItemMs',
  'medianTargetMs',
  'showPronouns',
  'burstSize',
  'cameFromTema',
  'practiceMode',
  'levelPracticeMode',
  'specificMood',
  'specificTense',
  'practicePronoun',
  'irregularityFilterMode',
  'verbType',
  'selectedFamily',
  'userLevel',
  'userLevelProgress',
  'hasCompletedPlacementTest',
  'placementTestReport',
  'enableFuturoSubjProd',
  'enableFuturoSubjRead',
  'enableC2Conmutacion',
  'conmutacionSeq',
  'conmutacionIdx',
  'rotateSecondPerson',
  'nextSecondPerson',
  'cliticsPercent',
  'c2RareBoostLemmas',
  'resistanceBestMsByLevel',
  'dailyGoalType',
  'dailyGoalValue',
  'practiceReminderEnabled',
  'practiceReminderTime',
  'practiceReminderDays'
]

const pickPersistedSettings = (state) => {
  const persisted = {}
  PERSISTED_SETTINGS_KEYS.forEach((key) => {
    if (key in state) {
      persisted[key] = state[key]
    }
  })
  return persisted
}

const persistedSettingsSchema = z.object({
  lastUpdated: z.number().optional(),
  level: z.enum(LEVELS).nullable().optional(),
  useVoseo: z.boolean().optional(),
  useTuteo: z.boolean().optional(),
  useVosotros: z.boolean().optional(),
  region: z.string().nullable().optional(),
  strict: z.boolean().nullable().optional(),
  accentTolerance: z.string().nullable().optional(),
  requireDieresis: z.boolean().optional(),
  blockNonNormativeSpelling: z.boolean().optional(),
  cliticStrictness: z.string().nullable().optional(),
  impSubjVariantMode: z.string().nullable().optional(),
  neutralizePronoun: z.boolean().optional(),
  timeMode: z.string().nullable().optional(),
  perItemMs: z.number().nullable().optional(),
  medianTargetMs: z.number().nullable().optional(),
  showPronouns: z.boolean().nullable().optional(),
  burstSize: z.number().nullable().optional(),
  cameFromTema: z.boolean().optional(),
  practiceMode: z.string().nullable().optional(),
  levelPracticeMode: z.string().nullable().optional(),
  specificMood: z.string().nullable().optional(),
  specificTense: z.string().nullable().optional(),
  practicePronoun: z.string().nullable().optional(),
  irregularityFilterMode: z.string().nullable().optional(),
  verbType: z.string().nullable().optional(),
  selectedFamily: z.string().nullable().optional(),
  userLevel: z.string().nullable().optional(),
  userLevelProgress: z.number().optional(),
  hasCompletedPlacementTest: z.boolean().optional(),
  placementTestReport: z.any().optional(),
  enableFuturoSubjProd: z.boolean().optional(),
  enableFuturoSubjRead: z.boolean().optional(),
  enableC2Conmutacion: z.boolean().optional(),
  conmutacionSeq: z.array(z.string()).optional(),
  conmutacionIdx: z.number().optional(),
  rotateSecondPerson: z.boolean().optional(),
  nextSecondPerson: z.string().optional(),
  cliticsPercent: z.number().optional(),
  c2RareBoostLemmas: z.array(z.string()).optional(),
  resistanceBestMsByLevel: z.record(z.number()).optional(),
  dailyGoalType: z.string().optional(),
  dailyGoalValue: z.number().optional(),
  practiceReminderEnabled: z.boolean().optional(),
  practiceReminderTime: z.string().optional(),
  practiceReminderDays: z.array(z.number()).optional()
})

const sanitizePersistedSettings = (persistedState) => {
  const defaults = pickPersistedSettings(createDefaultSettings())
  const source = (persistedState && typeof persistedState === 'object') ? persistedState : {}
  const sanitized = { ...defaults }
  const fieldSchemas = persistedSettingsSchema.shape

  PERSISTED_SETTINGS_KEYS.forEach((key) => {
    if (!(key in source)) return

    const schema = fieldSchemas[key]
    if (!schema) return

    const parsed = schema.safeParse(source[key])
    if (parsed.success) {
      sanitized[key] = parsed.data
      return
    }

    if (import.meta.env?.DEV) {
      console.warn(`Settings hydration ignored invalid key: ${key}`, parsed.error)
    }
  })

  sanitized.lastUpdated = sanitized.lastUpdated ?? defaults.lastUpdated
  return sanitized
}

const migrateLegacyPersistedState = (persistedState, fromVersion = 0) => {
  const next = { ...(persistedState || {}) }

  // Legacy runtime drill context was moved to session store.
  if (fromVersion < 3) {
    delete next.currentBlock
    delete next.reviewSessionType
    delete next.reviewSessionFilter
  }

  // Older snapshots may include "both" dialect marker.
  if (next.region === 'both') {
    next.region = 'global'
  }

  // Normalize malformed reminder days from historical snapshots.
  if (Array.isArray(next.practiceReminderDays)) {
    next.practiceReminderDays = Array.from(new Set(
      next.practiceReminderDays
        .map((day) => Number(day))
        .filter((day) => Number.isInteger(day))
        .map((day) => ((day % 7) + 7) % 7)
    )).sort((a, b) => a - b)
  }

  return next
}

export const migratePersistedSettings = (persistedState, fromVersion = 0) => {
  const migrated = migrateLegacyPersistedState(persistedState, fromVersion)
  return sanitizePersistedSettings(migrated)
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
    (originalSet, _get) => {
      const defaultSettings = createDefaultSettings()
      // Wrap set to automatically add lastUpdated to ALL state changes
      const set = (update) => {
        if (typeof update === 'function') {
          originalSet((state) => {
            const partialState = sanitizeSettingsUpdate(update(state), 'fn')
            return { ...partialState, lastUpdated: Date.now() }
          })
        } else {
          const partialState = sanitizeSettingsUpdate(update, 'object')
          originalSet({ ...partialState, lastUpdated: Date.now() })
        }
      }

      return {
        ...defaultSettings,

        // Métodos para actualizar configuración
        set: (newSettings) => set(newSettings),
        setLevel: (level) => set({ level, lastUpdated: Date.now() }),

        // User level system methods
        setUserLevel: (userLevel) => set({ userLevel, lastUpdated: Date.now() }),
        setUserLevelProgress: (progress) => set({ userLevelProgress: Math.max(0, Math.min(100, progress)), lastUpdated: Date.now() }),
        setPlacementTestCompleted: (completed) => set({ hasCompletedPlacementTest: completed, lastUpdated: Date.now() }),
        setPlacementTestReport: (report) => set({ placementTestReport: report, lastUpdated: Date.now() }),

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
      }
    },
    {
      name: 'spanish-conjugator-settings',
      version: SETTINGS_VERSION,
      migrate: (persistedState, fromVersion) => migratePersistedSettings(persistedState, fromVersion),
      partialize: (state) => pickPersistedSettings(state)
    }
  )
)

// Persist settings to IndexedDB for cross-device sync
// Flag to skip initial hydration event from Zustand persist middleware
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
      const userId = getCurrentUserId()

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
  const userId = getCurrentUserId()

  if (!userId) return

  try {
    const { saveUserSettings } = await import('../lib/progress/database.js')
    await saveUserSettings(userId, state)
  } catch (error) {
    console.warn('Failed to flush settings to IndexedDB:', error)
  }
}

export function resetSettingsForTests() {
  clearTimeout(persistTimeout)
  useSettings.setState(createDefaultSettings())
}

export { useSettings, LEVELS, SETTINGS_STATE_KEYS } 
