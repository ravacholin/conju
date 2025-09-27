/**
 * constants.js - Constantes para el sistema de drill adaptativo
 *
 * Define los tipos de ejercicio, niveles de dificultad, etapas de progresión
 * y otras constantes utilizadas en el sistema de aprendizaje adaptativo.
 */

// Tipos de ejercicio disponibles
export const EXERCISE_TYPES = {
  // Ejercicio básico de conjugación (similar al actual)
  CONJUGATION: 'conjugation',

  // Ejercicio con contexto mínimo (verbo + situación)
  CONTEXTUAL: 'contextual',

  // Construcción de oraciones completas
  SENTENCE_BUILDING: 'sentence_building',

  // Reconocimiento de patrones irregulares
  PATTERN_RECOGNITION: 'pattern_recognition',

  // Comparación entre formas verbales
  FORM_COMPARISON: 'form_comparison',

  // Detección y corrección de errores
  ERROR_CORRECTION: 'error_correction'
};

// Niveles de dificultad para ajuste dinámico
export const DIFFICULTY_LEVELS = {
  EASY: 'easy',           // Verbos frecuentes, personas simples
  INTERMEDIATE: 'intermediate',  // Mix balanceado
  ADVANCED: 'advanced',   // Verbos complejos, todas las personas
  EXPERT: 'expert'        // Ejercicios contextuales avanzados
};

// Etapas de progresión del aprendizaje
export const PROGRESSION_STAGES = {
  // Calentamiento con verbos de la introducción
  WARM_UP: 'warm_up',

  // Construcción gradual con verbos nuevos
  BUILDING: 'building',

  // Consolidación con mix de verbos
  CONSOLIDATION: 'consolidation',

  // Maestría con ejercicios avanzados
  MASTERY: 'mastery'
};

// Configuración de umbrales para transiciones
export const PROGRESSION_THRESHOLDS = {
  // Accuracy mínima para avanzar de etapa
  STAGE_ADVANCEMENT_ACCURACY: 0.75,

  // Streak mínimo para consideraciones especiales
  STREAK_FOR_DIFFICULTY_INCREASE: 5,

  // Número de errores para reducir dificultad
  ERRORS_FOR_DIFFICULTY_DECREASE: 3,

  // Tiempo máximo por ejercicio (ms)
  MAX_EXERCISE_TIME: 30000,

  // Número mínimo de ejercicios por etapa
  MIN_EXERCISES_PER_STAGE: 8,

  // Número máximo de ejercicios por etapa
  MAX_EXERCISES_PER_STAGE: 20
};

// Configuración de scoring y feedback
export const SCORING_CONFIG = {
  // Puntos base por respuesta correcta
  BASE_POINTS: 10,

  // Multiplicador por racha
  STREAK_MULTIPLIER: 1.2,

  // Bonus por ejercicio contextual
  CONTEXTUAL_BONUS: 5,

  // Bonus por completar patrón irregular
  PATTERN_BONUS: 15,

  // Penalización por error (no se restan puntos, solo se reduce racha)
  ERROR_PENALTY: 0
};

// Configuración de personas por dialecto
export const PERSON_PROGRESSION = {
  // Orden de introducción de personas (más fácil a más difícil)
  DIFFICULTY_ORDER: [
    '1s',           // yo - siempre irregular cuando hay irregularidades
    '3s',           // él/ella/usted - común en ejemplos
    '3p',           // ellos/ellas/ustedes - patrón similar a 3s
    '1p',           // nosotros - menos irregularidades
    '2s_tu',        // tú - moderadamente complejo
    '2s_vos',       // vos - región específica
    '2p_vosotros'   // vosotros - más complejo, región específica
  ],

  // Agrupaciones para ejercicios comparativos
  COMPARISON_PAIRS: [
    ['1s', '3s'],     // yo vs él/ella
    ['2s_tu', '2s_vos'], // tú vs vos
    ['3s', '3p'],     // singular vs plural
    ['1p', '3p']      // nosotros vs ellos
  ]
};

// Configuración de contextos para ejercicios
export const CONTEXT_TEMPLATES = {
  // Plantillas para ejercicios contextuales simples
  SIMPLE: [
    'En el restaurante, yo ___',
    'Mi amigo ___ todos los días',
    'Nosotros ___ los fines de semana',
    'Ellos ___ en vacaciones'
  ],

  // Plantillas para construcción de oraciones
  SENTENCE_BUILDING: [
    'Cuando ___, siempre ___',
    'Si ___, entonces ___',
    'Antes de ___, yo ___',
    'Después de que ___, nosotros ___'
  ],

  // Contextos específicos por tiempo verbal
  TENSE_SPECIFIC: {
    pres: [
      'Todos los días ___',
      'En este momento ___',
      'Generalmente ___'
    ],
    pretIndef: [
      'Ayer ___',
      'La semana pasada ___',
      'Hace dos días ___'
    ],
    impf: [
      'Cuando era niño ___',
      'Antes ___',
      'En aquella época ___'
    ],
    fut: [
      'Mañana ___',
      'El próximo año ___',
      'En el futuro ___'
    ],
    cond: [
      'Si pudiera, ___',
      'En tu lugar, ___',
      'Si fuera posible, ___'
    ]
  }
};

// Configuración de familias irregulares y sus características
export const IRREGULAR_FAMILY_CONFIG = {
  'LEARNING_E_IE': {
    name: 'Diptongación e→ie',
    description: 'Verbos que cambian e por ie en sílaba tónica',
    difficulty: DIFFICULTY_LEVELS.INTERMEDIATE,
    focusPersons: ['1s', '2s_tu', '3s', '3p'], // Excluye formas que no diptongan
    commonExamples: ['pensar', 'entender', 'preferir']
  },

  'LEARNING_O_UE': {
    name: 'Diptongación o→ue',
    description: 'Verbos que cambian o por ue en sílaba tónica',
    difficulty: DIFFICULTY_LEVELS.INTERMEDIATE,
    focusPersons: ['1s', '2s_tu', '3s', '3p'],
    commonExamples: ['contar', 'volver', 'dormir']
  },

  'LEARNING_YO_G': {
    name: 'YO irregular con -g',
    description: 'Verbos irregulares solo en primera persona',
    difficulty: DIFFICULTY_LEVELS.EASY,
    focusPersons: ['1s'], // Solo la forma irregular
    commonExamples: ['tener', 'venir', 'poner']
  },

  'LEARNING_YO_ZCO': {
    name: 'YO irregular con -zco',
    description: 'Verbos que añaden -zco en primera persona',
    difficulty: DIFFICULTY_LEVELS.EASY,
    focusPersons: ['1s'],
    commonExamples: ['conocer', 'parecer', 'crecer']
  }
};

// Configuración de animaciones y transiciones
export const ANIMATION_CONFIG = {
  // Duración de transiciones entre ejercicios (ms)
  EXERCISE_TRANSITION: 300,

  // Duración de feedback positivo
  POSITIVE_FEEDBACK: 1500,

  // Duración de feedback negativo
  NEGATIVE_FEEDBACK: 2500,

  // Duración de celebraciones especiales
  CELEBRATION_DURATION: 3000,

  // Clases CSS para animaciones
  CLASSES: {
    SLIDE_IN: 'slide-in',
    SLIDE_OUT: 'slide-out',
    FADE_IN: 'fade-in',
    FADE_OUT: 'fade-out',
    SHAKE: 'shake',
    PULSE: 'pulse',
    CELEBRATION: 'celebration'
  }
};

// Configuración de accesibilidad
export const ACCESSIBILITY_CONFIG = {
  // Tiempo mínimo entre ejercicios para lectura
  MIN_READING_TIME: 1000,

  // Soporte para navegación por teclado
  KEYBOARD_SHORTCUTS: {
    SUBMIT: 'Enter',
    HINT: 'h',
    SKIP: 'Escape',
    REPEAT: 'r'
  },

  // Configuración de texto a voz
  TTS_CONFIG: {
    rate: 0.9,
    pitch: 1.0,
    volume: 0.8
  }
};

export default {
  EXERCISE_TYPES,
  DIFFICULTY_LEVELS,
  PROGRESSION_STAGES,
  PROGRESSION_THRESHOLDS,
  SCORING_CONFIG,
  PERSON_PROGRESSION,
  CONTEXT_TEMPLATES,
  IRREGULAR_FAMILY_CONFIG,
  ANIMATION_CONFIG,
  ACCESSIBILITY_CONFIG
};