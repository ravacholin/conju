// Helper para mocks completos en tests
// Este archivo proporciona mocks completos para evitar errores de dependencias faltantes

import { vi } from 'vitest'

/**
 * Mock completo para config.js
 * Incluye todas las exportaciones esperadas por otros módulos
 */
export function createCompleteConfigMock(overrides = {}) {
  const baseMock = {
    STORAGE_CONFIG: {
      STORES: {
        ATTEMPTS: 'attempts',
        MASTERY: 'mastery',
        SCHEDULES: 'schedules',
        LEARNING_SESSIONS: 'sessions'
      }
    },
    PROGRESS_CONFIG: {
      SYNC: {
        MAX_QUEUE_SIZE: 500
      },
      DECAY_TAU: 10,
      HINT_PENALTY: 5,
      MAX_HINT_PENALTY: 15,
      MIN_CONFIDENCE_N: 8,
      MASTERY_LEVELS: {
        ACHIEVED: 80,
        ATTENTION: 60,
        CRITICAL: 0,
      },
      CONFIDENCE_LEVELS: {
        HIGH: 20,
        MEDIUM: 8,
        LOW: 0,
      },
      SRS_INTERVALS: [1, 3, 7, 14, 30, 90],
      SRS_ADVANCED: {
        EASE_START: 2.5,
        EASE_MIN: 1.3,
        EASE_MAX: 3.2,
        FIRST_STEPS: [1, 3],
        LEECH_THRESHOLD: 8,
        LEECH_EASE_PENALTY: 0.4,
        RELEARN_STEPS: [0.25, 1],
        HINT_Q_PENALTY: 1,
        SPEED: {
          FAST_GUESS_MS: 900,
          SLOW_MS: 6000,
        },
        FUZZ_RATIO: 0.1,
      },
      FEATURE_FLAGS: {
        SRS_FAMILY_CLUSTERING: false,
        A_B_TESTING: false,
        ML_RECOMMENDATIONS: false,
        EMOTIONAL_SRS_INTEGRATION: false,
        TEMPORAL_SCHEDULING: false,
        PERSONALIZED_STUDY_PLANS: false,
        ADVANCED_ANALYTICS: false,
        SOCIAL_CHALLENGES: false,
      }
    }
  }

  return { ...baseMock, ...overrides }
}

/**
 * Mock completo para authBridge.js
 */
export function createCompleteAuthBridgeMock(overrides = {}) {
  const baseMock = {
    setSyncEndpoint: vi.fn(),
    getSyncEndpoint: vi.fn(),
    isSyncEnabled: vi.fn(),
    isLocalSyncMode: vi.fn(),
    setSyncAuthToken: vi.fn(),
    getSyncAuthToken: vi.fn(),
    clearSyncAuthToken: vi.fn(),
    setSyncAuthHeaderName: vi.fn(),
    getSyncAuthHeaderName: vi.fn(),
    isAuthenticated: vi.fn(),
    getAuthenticatedUser: vi.fn(),
  }

  return { ...baseMock, ...overrides }
}

/**
 * Mock completo para userSettingsStore.js
 */
export function createCompleteUserSettingsStoreMock(overrides = {}) {
  const baseMock = {
    getCurrentUserId: vi.fn(),
    getUserSettings: vi.fn(),
    updateUserSettings: vi.fn(),
    incrementSessionCount: vi.fn(),
    getSessionCount: vi.fn(),
    resetSessionCount: vi.fn(),
  }

  return { ...baseMock, ...overrides }
}
