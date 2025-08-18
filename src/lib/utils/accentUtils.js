/**
 * Utilidades centralizadas para manejo de acentos/tildes en español
 * ÚNICO PUNTO DE VERDAD para normalización de acentos en toda la aplicación
 */

/**
 * Remueve todos los acentos/tildes de una cadena
 * Utiliza el estándar Unicode NFD + filtro de diacríticos
 * @param {string} str - Cadena a normalizar
 * @returns {string} - Cadena sin acentos
 */
export function stripAccents(str) {
  if (!str || typeof str !== 'string') return ''
  return str.normalize('NFD').replace(/\p{Diacritic}+/gu, '')
}

/**
 * Normaliza una cadena para comparación: minúsculas, sin acentos, espacios limpios
 * @param {string} str - Cadena a normalizar
 * @returns {string} - Cadena normalizada para comparación
 */
export function normalize(str) {
  if (!str || typeof str !== 'string') return ''
  return str
    .toLowerCase()
    .normalize('NFD').replace(/\p{Diacritic}+/gu, '') // Remover acentos
    .replace(/\s+/g, ' ').trim() // Limpiar espacios
}

/**
 * Normaliza solo para minúsculas y espacios, manteniendo acentos
 * @param {string} str - Cadena a normalizar
 * @returns {string} - Cadena normalizada manteniendo acentos
 */
export function normalizeKeepAccents(str) {
  if (!str || typeof str !== 'string') return ''
  return str
    .toLowerCase()
    .replace(/\s+/g, ' ').trim()
}

/**
 * Verifica si dos cadenas son iguales ignorando acentos
 * @param {string} str1 - Primera cadena
 * @param {string} str2 - Segunda cadena
 * @returns {boolean} - true si son iguales sin acentos
 */
export function equalsIgnoreAccents(str1, str2) {
  return normalize(str1) === normalize(str2)
}

/**
 * Verifica si una cadena contiene acentos/tildes
 * @param {string} str - Cadena a verificar
 * @returns {boolean} - true si contiene acentos
 */
export function hasAccents(str) {
  if (!str || typeof str !== 'string') return false
  return str !== stripAccents(str)
}