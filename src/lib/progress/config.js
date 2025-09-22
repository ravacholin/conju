// Configuración del sistema de progreso y analíticas

// Configuración general del sistema de progreso
export const PROGRESS_CONFIG = {
  // Constantes para cálculos de mastery
  DECAY_TAU: 10, // Días para decaimiento exponencial
  HINT_PENALTY: 5, // Puntos por pista usada
  MAX_HINT_PENALTY: 15, // Penalización máxima por intento
  MIN_CONFIDENCE_N: 8, // Número mínimo de intentos para confianza
  
  // Niveles de mastery
  MASTERY_LEVELS: {
    ACHIEVED: 80, // Dominio logrado
    ATTENTION: 60, // Necesita atención
    CRITICAL: 0   // Crítico
  },
  
  // Umbrales de confianza
  CONFIDENCE_LEVELS: {
    HIGH: 20,  // N >= 20
    MEDIUM: 8, // N >= 8
    LOW: 0     // N < 8
  },
  
  // Intervalos SRS
  SRS_INTERVALS: [1, 3, 7, 14, 30, 90], // Días

  // Configuración avanzada del SRS (SM-2 inspirado + mejoras)
  SRS_ADVANCED: {
    EASE_START: 2.5,
    EASE_MIN: 1.3,
    EASE_MAX: 3.2,
    // Primeros pasos (modo aprendizaje)
    FIRST_STEPS: [1, 3], // días
    // Penalización por fallos consecutivos (lapses)
    LEECH_THRESHOLD: 8,
    LEECH_EASE_PENALTY: 0.4,
    // Micro-reaprendizaje tras fallo: intervalos en días (se permiten fracciones)
    RELEARN_STEPS: [0.25, 1], // 6h, 1d
    // Influencia de pistas y velocidad en la calidad (Q)
    HINT_Q_PENALTY: 1,       // restar 1 punto de Q si hubo pistas
    SPEED: {
      FAST_GUESS_MS: 900,
      SLOW_MS: 6000
    },
    // Jitter para evitar sincronías exactas
    FUZZ_RATIO: 0.10 // ±10%
  },
  
  // Configuración de UI
  UI: {
    HEATMAP_COLORS: {
      HIGH: '#28a745',    // Verde para 80-100%
      MEDIUM: '#ffc107',  // Amarillo para 60-79%
      LOW: '#dc3545',     // Rojo para 0-59%
      NO_DATA: '#6c757d'  // Gris para sin datos
    },
    
    COMPETENCY_RADAR: {
      AXES: 5, // Número de ejes en el radar
      MAX_VALUE: 100 // Valor máximo para cada eje
    }
  },
  
  // Configuración de sincronización
  SYNC: {
    AUTO_SYNC_INTERVAL: 5 * 60 * 1000, // 5 minutos
    MAX_SYNC_RETRIES: 3,
    BATCH_SIZE: 100 // Número de registros por lote
  },
  
  // Configuración de diagnóstico
  DIAGNOSIS: {
    TEST_DURATION: 3 * 60 * 1000, // 3 minutos
    RECALIBRATION_INTERVAL: 30 * 24 * 60 * 60 * 1000 // 30 días
  },
  
  // Configuración de objetivos
  GOALS: {
    WEEKLY: {
      DEFAULT_CELLS_TO_IMPROVE: 3,
      DEFAULT_MIN_SCORE: 75,
      DEFAULT_SESSIONS: 5,
      DEFAULT_ATTEMPTS: 50,
      DEFAULT_FOCUS_TIME: 60 // minutos
    }
  },
  
  // Configuración de Inteligencia Emocional
  EMOTIONAL_INTELLIGENCE: {
    // Flow State Detection Thresholds
    FLOW: {
      FAST_RESPONSE: 3000,        // ms - Respuestas rápidas indican confianza
      SLOW_RESPONSE: 8000,        // ms - Respuestas lentas indican vacilación
      HIGH_ACCURACY: 0.85,        // 85%+ accuracy indica dominio
      LOW_ACCURACY: 0.60,         // <60% accuracy indica dificultad
      FLOW_STREAK: 5,             // 5 respuestas correctas rápidas = flow
      STRUGGLE_STREAK: 3,         // 3 errores o respuestas lentas = struggle
      VELOCITY_CONSISTENCY: 0.3,  // Variación en velocidad <30% = consistent
      ACCURACY_CONSISTENCY: 0.2   // Variación en accuracy <20% = consistent
    },
    
    // Momentum Tracking Configuration
    MOMENTUM: {
      FACTORS: {
        ACCURACY: 0.30,           // 30% - Correctness matters
        RESPONSE_TIME: 0.25,      // 25% - Speed indicates confidence  
        CONSISTENCY: 0.20,        // 20% - Consistency builds momentum
        DIFFICULTY_PROGRESS: 0.15, // 15% - Handling harder content
        RECOVERY_RATE: 0.10       // 10% - Bouncing back from errors
      },
      THRESHOLDS: {
        PEAK_PERFORMANCE: 0.85,      // 85%+ momentum score
        CONFIDENCE_BUILDING: 0.70,   // 70-84% momentum score
        STEADY_PROGRESS: 0.55,       // 55-69% momentum score
        MINOR_SETBACK: 0.40,        // 40-54% momentum score
        RECOVERY_MODE: 0.25,         // 25-39% momentum score
        CONFIDENCE_CRISIS: 0.25      // <25% momentum score
      }
    },
    
    // Confidence Engine Configuration
    CONFIDENCE: {
      THRESHOLDS: {
        HESITANT: 0.3,
        UNCERTAIN: 0.5,
        CONFIDENT: 0.7,
        OVERCONFIDENT: 0.9
      },
      SPEED_FACTORS: {
        OPTIMAL_MIN: 2000,        // ms - Tiempo óptimo mínimo
        OPTIMAL_MAX: 4000,        // ms - Tiempo óptimo máximo
        FAST_THRESHOLD: 1000,     // ms - Muy rápido (posible adivinanza)
        SLOW_THRESHOLD: 6000      // ms - Muy lento (vacilación)
      }
    },
    
    // Temporal Intelligence Configuration  
    TEMPORAL: {
      CIRCADIAN: {
        PEAK_DETECTION_MIN_SESSIONS: 2,  // Mínimo sesiones para detectar pico
        OPTIMAL_SESSION_DEFAULT: 20,     // minutos - Duración por defecto
        FATIGUE_RECOVERY_RATE: 0.1,      // por minuto
        COGNITIVE_LOAD_THRESHOLD: 0.8     // Umbral de sobrecarga
      },
      POST_LUNCH_DIP_START: 13,         // hora
      POST_LUNCH_DIP_END: 15,           // hora  
      NIGHT_FATIGUE_START: 22,          // hora
      MORNING_PEAK_START: 9,            // hora
      MORNING_PEAK_END: 11              // hora
    },
    
    // Dynamic Goals Configuration
    GOALS: {
      ACTIVE_GOALS_MIN: 3,
      ACTIVE_GOALS_MAX: 5,
      CACHE_EXPIRY: 5 * 60 * 1000,     // 5 minutos
      GOAL_TYPES: {
        ACCURACY: { DEFAULT_POINTS: 100, MIN_ATTEMPTS: 10 },
        SPEED: { DEFAULT_POINTS: 150, MIN_ATTEMPTS: 15 },
        STREAK: { DEFAULT_POINTS: 200, MIN_TARGET: 10 },
        EXPLORATION: { DEFAULT_POINTS: 100, TIME_LIMIT: 7 * 24 * 60 * 60 * 1000 },
        MASTERY: { DEFAULT_POINTS: 500, MIN_ACCURACY: 0.95, MIN_ATTEMPTS: 20 },
        SESSION: { DEFAULT_POINTS: 150, DEFAULT_DURATION: 20 * 60 * 1000 }
      }
    }
  },
  
  // Configuración de Logging
  LOGGING: {
    ENABLED: (typeof globalThis !== 'undefined' && globalThis.process?.env?.NODE_ENV === 'development'),
    LEVELS: {
      ERROR: 0,
      WARN: 1, 
      INFO: 2,
      DEBUG: 3
    },
    DEFAULT_LEVEL: 2 // INFO
  },
  
  // Configuración de Auto-save
  AUTO_SAVE: {
    CONFIDENCE_ENGINE: 30000,    // 30 segundos
    TEMPORAL_INTELLIGENCE: 60000, // 60 segundos  
    DYNAMIC_GOALS: 120000        // 120 segundos
  }
}

// Configuración de dificultad por tipo de verbo
export const VERB_DIFFICULTY = {
  REGULAR: 1.0,
  DIPHTHONG: 1.1,
  ORTHOGRAPHIC_CHANGE: 1.15,
  HIGHLY_IRREGULAR: 1.2
}

// Configuración de dificultad por frecuencia
export const FREQUENCY_DIFFICULTY_BONUS = {
  LOW: 0.05,
  MEDIUM: 0.0,
  HIGH: 0.0
}

// Configuración de errores
export const ERROR_TAGS = {
  WRONG_PERSON: 'persona_equivocada',
  WRONG_TENSE: 'tiempo_equivocado',
  VERBAL_ENDING: 'terminación_verbal',
  IRREGULAR_STEM: 'raíz_irregular',
  ACCENT: 'acentuación',
  CLITIC_PRONOUNS: 'pronombres_clíticos',
  ORTHOGRAPHY_G_GU: 'ortografía_g/gu',
  ORTHOGRAPHY_C_QU: 'ortografía_c/qu',
  ORTHOGRAPHY_Z_C: 'ortografía_z/c',
  NUMBER_AGREEMENT: 'concordancia_número',
  WRONG_MOOD: 'modo_equivocado',
  OTHER_VALID_FORM: 'otra_forma_válida'
}

// Configuración de almacenamiento
export const STORAGE_CONFIG = {
  DB_NAME: 'SpanishConjugatorProgress',
  DB_VERSION: 4, // Increment version when adding new stores like events
  STORES: {
    USERS: 'users',
    VERBS: 'verbs',
    ITEMS: 'items',
    ATTEMPTS: 'attempts',
    MASTERY: 'mastery',
    SCHEDULES: 'schedules',
    LEARNING_SESSIONS: 'learning_sessions',
    CHALLENGES: 'daily_challenges',
    EVENTS: 'events'
  }
}

// Configuración de inicialización
export const INIT_CONFIG = {
  WARMUP_DELAY: 1000, // 1 segundo de espera para calentamiento
  MAX_INIT_RETRIES: 3,
  INIT_TIMEOUT: 30000 // 30 segundos de timeout
}

// Exportar configuración completa
export default PROGRESS_CONFIG
