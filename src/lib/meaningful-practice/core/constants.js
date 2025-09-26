/**
 * Constantes del sistema de práctica significativa
 *
 * Este archivo contiene todas las constantes utilizadas en el sistema,
 * organizadas por categorías para fácil mantenimiento y configuración.
 *
 * @fileoverview Constantes del sistema de práctica significativa
 */

// ==================== TIPOS DE EJERCICIO ====================

export const EXERCISE_TYPES = {
  // Tipos existentes (migrados del sistema actual)
  TIMELINE: 'timeline',
  DAILY_ROUTINE: 'daily_routine',
  PROMPTS: 'prompts',
  CHAT: 'chat',

  // Nuevos tipos de ejercicio
  STORY_BUILDING: 'story_building',
  ROLE_PLAYING: 'role_playing',
  PROBLEM_SOLVING: 'problem_solving',
  MEDIA_BASED: 'media_based',
  CREATIVE_EXPRESSION: 'creative_expression',
  GAMIFIED_CHALLENGES: 'gamified_challenges',

  // Tipos especializados
  VOCABULARY_IN_CONTEXT: 'vocabulary_in_context',
  PRONUNCIATION_PRACTICE: 'pronunciation_practice',
  LISTENING_COMPREHENSION: 'listening_comprehension'
};

// ==================== NIVELES DE DIFICULTAD ====================

export const DIFFICULTY_LEVELS = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
  EXPERT: 'expert'
};

export const DIFFICULTY_ORDER = [
  DIFFICULTY_LEVELS.BEGINNER,
  DIFFICULTY_LEVELS.INTERMEDIATE,
  DIFFICULTY_LEVELS.ADVANCED,
  DIFFICULTY_LEVELS.EXPERT
];

export const DIFFICULTY_METADATA = {
  [DIFFICULTY_LEVELS.BEGINNER]: {
    label: 'Principiante',
    description: 'Ejercicios básicos con estructuras simples',
    minScore: 0.6,
    targetTime: 300, // 5 minutos
    hints: 3
  },
  [DIFFICULTY_LEVELS.INTERMEDIATE]: {
    label: 'Intermedio',
    description: 'Ejercicios con estructuras más complejas',
    minScore: 0.7,
    targetTime: 450, // 7.5 minutos
    hints: 2
  },
  [DIFFICULTY_LEVELS.ADVANCED]: {
    label: 'Avanzado',
    description: 'Ejercicios complejos con múltiples elementos',
    minScore: 0.8,
    targetTime: 600, // 10 minutos
    hints: 1
  },
  [DIFFICULTY_LEVELS.EXPERT]: {
    label: 'Experto',
    description: 'Ejercicios de máxima complejidad',
    minScore: 0.85,
    targetTime: 900, // 15 minutos
    hints: 0
  }
};

// ==================== CATEGORÍAS DE EJERCICIOS ====================

export const EXERCISE_CATEGORIES = {
  // Vida cotidiana
  DAILY_LIFE: 'daily_life',
  WORK_LIFE: 'work_life',
  FAMILY: 'family',
  HEALTH_WELLNESS: 'health_wellness',

  // Actividades y eventos
  TRAVEL: 'travel',
  SOCIAL_EVENTS: 'social_events',
  HOBBIES_INTERESTS: 'hobbies_interests',
  ENTERTAINMENT: 'entertainment',

  // Tiempos y situaciones
  PAST_EVENTS: 'past_events',
  RECENT_PAST: 'recent_past',
  FUTURE_PLANS: 'future_plans',
  CHILDHOOD_MEMORIES: 'childhood_memories',

  // Comunicación y expresión
  ADVICE_GIVING: 'advice_giving',
  OPINIONS_DEBATES: 'opinions_debates',
  STORYTELLING: 'storytelling',
  PROBLEM_SOLVING: 'problem_solving',

  // Contextos especiales
  HYPOTHETICAL: 'hypothetical',
  FANTASY: 'fantasy',
  MYSTERY: 'mystery',
  PREDICTIONS: 'predictions',

  // Emociones y relaciones
  HOPES_DOUBTS: 'hopes_doubts',
  REGRETS_PAST_HYPOTHETICAL: 'regrets_past_hypothetical',
  DEEP_REGRETS: 'deep_regrets',
  WISHES_HYPOTHETICAL: 'wishes_hypothetical',

  // Actividades específicas
  EVENT_PLANNING: 'event_planning',
  PAST_SEQUENCES: 'past_sequences',
  FUTURE_COMPLETION: 'future_completion',
  PERSONAL_GOALS: 'personal_goals'
};

// ==================== CLASIFICACIÓN DE ERRORES ====================

export const ERROR_TYPES = {
  // Errores verbales
  WRONG_TENSE: 'wrong_tense',
  WRONG_MOOD: 'wrong_mood',
  CONJUGATION_ERROR: 'conjugation_error',
  MISSING_VERBS: 'missing_verbs',
  IRREGULAR_VERB_ERROR: 'irregular_verb_error',

  // Errores de estructura
  WORD_ORDER: 'word_order',
  GENDER_AGREEMENT: 'gender_agreement',
  NUMBER_AGREEMENT: 'number_agreement',
  PRONOUN_ERROR: 'pronoun_error',

  // Errores de contenido
  OFF_TOPIC: 'off_topic',
  INSUFFICIENT_CONTENT: 'insufficient_content',
  TOO_SIMPLE: 'too_simple',
  VOCABULARY_ERROR: 'vocabulary_error',

  // Errores de formato
  SPELLING_ERROR: 'spelling_error',
  PUNCTUATION_ERROR: 'punctuation_error',
  CAPITALIZATION_ERROR: 'capitalization_error'
};

export const ERROR_SEVERITY = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4
};

// ==================== PATRONES DE TIEMPO VERBAL ====================

export const TENSE_PATTERNS = {
  pres: {
    name: 'Presente',
    patterns: [
      /\b\w+[oaeáéí]\b/g,
      /\b(soy|eres|es|somos|sois|son|estoy|estás|está|estamos|estáis|están|voy|vas|va|vamos|vais|van)\b/g
    ],
    hints: ['Recuerda usar el presente: yo hablo, tú comes, él vive']
  },
  pretIndef: {
    name: 'Pretérito Indefinido',
    patterns: [
      /\b\w+[óé]\b/g,
      /\b\w+(aste|aron|ieron|amos|asteis)\b/g,
      /\b(fui|fuiste|fue|fuimos|fuisteis|fueron|tuve|tuviste|tuvo|tuvimos|tuvisteis|tuvieron)\b/g
    ],
    hints: ['Usa el pretérito: yo hablé, tú comiste, él vivió']
  },
  impf: {
    name: 'Imperfecto',
    patterns: [
      /\b\w+(aba|ías|ía|íamos|íais|aban)\b/g,
      /\b(era|eras|éramos|erais|eran|estaba|estabas|estábamos|estabais|estaban)\b/g
    ],
    hints: ['Usa el imperfecto: yo hablaba, tú comías, él vivía']
  },
  fut: {
    name: 'Futuro',
    patterns: [
      /\b\w+(ré|rás|rá|remos|réis|rán)\b/g,
      /\b(seré|serás|será|seremos|seréis|serán|estaré|estarás|estará|estaremos|estaréis|estarán)\b/g
    ],
    hints: ['Usa el futuro: yo hablaré, tú comerás, él vivirá']
  },
  pretPerf: {
    name: 'Pretérito Perfecto',
    patterns: [
      /\b(he|has|ha|hemos|habéis|han)\s+\w+ado\b/g,
      /\b(he|has|ha|hemos|habéis|han)\s+\w+ido\b/g
    ],
    hints: ['Usa el perfecto: yo he hablado, tú has comido, él ha vivido']
  },
  cond: {
    name: 'Condicional',
    patterns: [
      /\b\w+(ría|rías|ríamos|ríais|rían)\b/g
    ],
    hints: ['Usa el condicional: yo hablaría, tú comerías, él viviría']
  },
  subjPres: {
    name: 'Subjuntivo Presente',
    patterns: [
      /\b\w+[ea]\b/g,
      /\bque\s+\w+[ea]\b/g
    ],
    hints: ['Usa el subjuntivo presente: que yo hable, que tú comas, que él viva']
  }
};

// ==================== CONFIGURACIÓN DE EVALUACIÓN ====================

export const ASSESSMENT_CONFIG = {
  // Umbrales de puntuación
  EXCELLENT_THRESHOLD: 0.9,
  GOOD_THRESHOLD: 0.75,
  FAIR_THRESHOLD: 0.6,
  POOR_THRESHOLD: 0.4,

  // Pesos para diferentes aspectos
  VERB_USAGE_WEIGHT: 0.4,
  TENSE_ACCURACY_WEIGHT: 0.3,
  CONTENT_QUALITY_WEIGHT: 0.2,
  GRAMMAR_WEIGHT: 0.1,

  // Configuración de feedback
  MAX_FEEDBACK_LENGTH: 200,
  MIN_FEEDBACK_LENGTH: 50,
  INCLUDE_ENCOURAGING_MESSAGES: true,

  // Configuración de hints
  MAX_HINTS_PER_EXERCISE: 3,
  HINT_PENALTY: 0.1, // Reducción de puntuación por hint
  PROGRESSIVE_HINTS: true
};

// ==================== CONFIGURACIÓN DE PERSONALIZACIÓN ====================

export const PERSONALIZATION_CONFIG = {
  // Factores de adaptación
  PERFORMANCE_WEIGHT: 0.4,
  PREFERENCE_WEIGHT: 0.3,
  ENGAGEMENT_WEIGHT: 0.2,
  VARIETY_WEIGHT: 0.1,

  // Umbrales de adaptación
  DIFFICULTY_INCREASE_THRESHOLD: 0.8,
  DIFFICULTY_DECREASE_THRESHOLD: 0.6,
  ADAPTATION_SMOOTHING: 0.7,

  // Configuración de contenido
  MIN_EXERCISES_BEFORE_ADAPTATION: 3,
  MAX_CONSECUTIVE_SAME_TYPE: 2,
  PREFERRED_CATEGORY_BOOST: 1.5
};

// ==================== CONFIGURACIÓN DE GAMIFICACIÓN ====================

export const GAMIFICATION_CONFIG = {
  // Sistema de puntos
  BASE_POINTS: {
    EXERCISE_COMPLETED: 10,
    PERFECT_SCORE: 20,
    STREAK_BONUS: 5,
    DIFFICULT_EXERCISE: 15
  },

  // Multiplicadores
  DIFFICULTY_MULTIPLIERS: {
    [DIFFICULTY_LEVELS.BEGINNER]: 1.0,
    [DIFFICULTY_LEVELS.INTERMEDIATE]: 1.2,
    [DIFFICULTY_LEVELS.ADVANCED]: 1.5,
    [DIFFICULTY_LEVELS.EXPERT]: 2.0
  },

  // Logros
  ACHIEVEMENT_TYPES: {
    STREAK: 'streak',
    PERFECT_EXERCISES: 'perfect_exercises',
    TENSE_MASTERY: 'tense_mastery',
    CATEGORY_EXPLORER: 'category_explorer',
    SPEED_DEMON: 'speed_demon',
    PERSISTENCE: 'persistence'
  }
};

// ==================== CONFIGURACIÓN DE CACHE ====================

export const CACHE_CONFIG = {
  // TTL (Time To Live) en milisegundos
  EXERCISE_CACHE_TTL: 5 * 60 * 1000, // 5 minutos
  CONTENT_CACHE_TTL: 10 * 60 * 1000, // 10 minutos
  ANALYSIS_CACHE_TTL: 2 * 60 * 1000, // 2 minutos

  // Tamaños máximos
  MAX_EXERCISE_CACHE_SIZE: 100,
  MAX_CONTENT_CACHE_SIZE: 50,
  MAX_ANALYSIS_CACHE_SIZE: 200,

  // Configuración de limpieza
  CACHE_CLEANUP_INTERVAL: 15 * 60 * 1000, // 15 minutos
  CACHE_EVICTION_THRESHOLD: 0.8 // 80% de capacidad
};

// ==================== LÍMITES Y VALIDACIÓN ====================

export const VALIDATION_LIMITS = {
  // Longitud de texto
  MIN_RESPONSE_LENGTH: 10,
  MAX_RESPONSE_LENGTH: 1000,
  MIN_WORDS_IN_RESPONSE: 3,

  // Tiempo de sesión
  MIN_SESSION_TIME: 30, // 30 segundos
  MAX_SESSION_TIME: 30 * 60, // 30 minutos

  // Ejercicios
  MAX_PROMPTS_PER_EXERCISE: 10,
  MIN_EXPECTED_VERBS: 1,
  MAX_EXPECTED_VERBS: 5
};

// ==================== MENSAJES PREDEFINIDOS ====================

export const MESSAGES = {
  SUCCESS: {
    EXCELLENT: '¡Excelente! Has usado todos los verbos perfectamente.',
    GOOD: '¡Muy bien! Tu respuesta muestra buen dominio del tiempo verbal.',
    FAIR: '¡Bien hecho! Hay algunos aspectos que puedes mejorar.',
    ENCOURAGING: '¡Buen trabajo! Sigue practicando para mejorar.'
  },

  ERROR: {
    MISSING_VERBS: 'Faltan algunos verbos en tu respuesta.',
    WRONG_TENSE: 'Verifica el tiempo verbal que estás usando.',
    TOO_SHORT: 'Tu respuesta es demasiado corta. Intenta ser más descriptivo.',
    OFF_TOPIC: 'Tu respuesta no se relaciona con el tema del ejercicio.'
  },

  HINTS: {
    VERB_USAGE: 'Recuerda usar los verbos sugeridos en tu respuesta.',
    TENSE_CHECK: 'Verifica que estés usando el tiempo verbal correcto.',
    CONTENT_EXPANSION: 'Intenta expandir tu respuesta con más detalles.',
    STRUCTURE: 'Revisa la estructura de tus oraciones.'
  }
};

// ==================== CONFIGURACIÓN DE LOGGING ====================

export const LOGGING_CONFIG = {
  LEVELS: {
    ERROR: 'error',
    WARN: 'warn',
    INFO: 'info',
    DEBUG: 'debug'
  },

  MODULES: {
    CONTENT_MANAGER: 'ContentManager',
    EXERCISE_FACTORY: 'ExerciseFactory',
    LANGUAGE_ANALYZER: 'LanguageAnalyzer',
    ERROR_CLASSIFIER: 'ErrorClassifier',
    FEEDBACK_GENERATOR: 'FeedbackGenerator',
    PERSONALIZATION: 'PersonalizationEngine'
  }
};

// ==================== EXPORTACIONES POR DEFECTO ====================

export const DEFAULTS = {
  DIFFICULTY: DIFFICULTY_LEVELS.INTERMEDIATE,
  EXERCISE_TYPE: EXERCISE_TYPES.TIMELINE,
  CATEGORY: EXERCISE_CATEGORIES.DAILY_LIFE,
  INCLUDE_ALTERNATIVES: true,
  MAX_HINTS: 3,
  ASSESSMENT_STRICT_MODE: false
};