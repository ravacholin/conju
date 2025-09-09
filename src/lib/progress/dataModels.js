// Modelos de datos para el sistema de progreso y analíticas

/**
 * Modelo para un usuario
 * @typedef {Object} User
 * @property {string} id - Identificador único del usuario
 * @property {Date} createdAt - Fecha de creación
 * @property {Date} lastActive - Última actividad
 */

/**
 * Modelo para un verbo
 * @typedef {Object} Verb
 * @property {string} id - Identificador único del verbo
 * @property {string} lemma - Lema del verbo (infinitivo)
 * @property {'regular'|'irregular'|'diphtong'|'orthographic_change'} type - Tipo de verbo
 * @property {'high'|'medium'|'low'} frequency - Frecuencia léxica
 */

/**
 * Modelo para un ítem de práctica (celda específica)
 * @typedef {Object} Item
 * @property {string} id - Identificador único
 * @property {string} verbId - ID del verbo
 * @property {'indicative'|'subjunctive'|'imperative'|'conditional'|'nonfinite'} mood - Modo
 * @property {string} tense - Tiempo
 * @property {'1s'|'2s_tu'|'2s_vos'|'3s'|'1p'|'2p_vosotros'|'3p'} person - Persona
 */

/**
 * Modelo para un intento de práctica
 * @typedef {Object} Attempt
 * @property {string} id - Identificador único
 * @property {string} itemId - ID del ítem
 * @property {boolean} correct - Si la respuesta fue correcta
 * @property {number} latencyMs - Tiempo de respuesta en milisegundos
 * @property {number} hintsUsed - Número de pistas utilizadas
 * @property {string[]} errorTags - Etiquetas de error
 * @property {Date} createdAt - Fecha de creación
 */

/**
 * Modelo para el mastery score de una celda
 * @typedef {Object} Mastery
 * @property {string} id - Identificador único
 * @property {string} userId - ID del usuario
 * @property {'indicative'|'subjunctive'|'imperative'|'conditional'|'nonfinite'} mood - Modo
 * @property {string} tense - Tiempo
 * @property {'1s'|'2s_tu'|'2s_vos'|'3s'|'1p'|'2p_vosotros'|'3p'} person - Persona
 * @property {number} score - Mastery score (0-100)
 * @property {number} n - Número efectivo de intentos
 * @property {Date} updatedAt - Última actualización
 */

/**
 * Modelo para el schedule SRS
 * @typedef {Object} Schedule
 * @property {string} id - Identificador único
 * @property {string} userId - ID del usuario
 * @property {'indicative'|'subjunctive'|'imperative'|'conditional'|'nonfinite'} mood - Modo
 * @property {string} tense - Tiempo
 * @property {'1s'|'2s_tu'|'2s_vos'|'3s'|'1p'|'2p_vosotros'|'3p'} person - Persona
 * @property {Date} nextDue - Próxima fecha de revisión
 * @property {number} interval - Intervalo en días
 * @property {number} ease - Factor de facilidad
 * @property {number} reps - Número de repeticiones
 */

// Definiciones de tipos para errores
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

// Definiciones de tipos para frecuencia léxica
export const FREQUENCY_LEVELS = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
}

// Definiciones de dificultad base por tipo de verbo
export const VERB_DIFFICULTY = {
  REGULAR: 1.0,
  DIPHTHONG: 1.1,
  ORTHOGRAPHIC_CHANGE: 1.15,
  HIGHLY_IRREGULAR: 1.2
}

// Definiciones de dificultad adicional por frecuencia
export const FREQUENCY_DIFFICULTY_BONUS = {
  LOW: 0.05,
  MEDIUM: 0.0,
  HIGH: 0.0
}

// Las definiciones de tipos están disponibles via JSDoc typedef
// No necesitan exportaciones explícitas
