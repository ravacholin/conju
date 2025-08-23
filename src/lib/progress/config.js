// Configuración del sistema de progreso

// Configuración general
export const PROGRESS_CONFIG = {
  // Constantes para cálculos
  DECAY_TAU: 10, // Días para decaimiento exponencial
  HINT_PENALTY: 5, // Puntos por pista
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
  }
}

// Configuración de dificultad por tipo de verbo
export const VERB_DIFFICULTY_CONFIG = {
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
export const ERROR_CONFIG = {
  TAGS: {
    WRONG_PERSON: 'persona_equivocada',
    VERBAL_ENDING: 'terminación_verbal',
    IRREGULAR_STEM: 'raíz_irregular',
    ACCENT: 'acentuación',
    CLITIC_PRONOUNS: 'pronombres_clíticos',
    ORTHOGRAPHY_G_GU: 'ortografía_g/gu',
    ORTHOGRAPHY_C_QU: 'ortografía_c/qu',
    ORTHOGRAPHY_Z_C: 'ortografía_z/c',
    NUMBER_AGREEMENT: 'concordancia_número',
    WRONG_MOOD: 'modo_equivocado'
  }
}

// Configuración de almacenamiento
export const STORAGE_CONFIG = {
  DB_NAME: 'SpanishConjugatorProgress',
  DB_VERSION: 1,
  STORES: {
    USERS: 'users',
    VERBS: 'verbs',
    ITEMS: 'items',
    ATTEMPTS: 'attempts',
    MASTERY: 'mastery',
    SCHEDULES: 'schedules'
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