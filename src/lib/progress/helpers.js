// Funciones auxiliares para el sistema de progreso

/**
 * Genera un ID único
 * @returns {string} ID único
 */
export function generateId() {
  return `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Formatea una fecha
 * @param {Date} date - Fecha a formatear
 * @returns {string} Fecha formateada
 */
export function formatDate(date) {
  return new Date(date).toLocaleDateString('es-ES')
}

/**
 * Calcula la diferencia en días entre dos fechas
 * @param {Date} date1 - Primera fecha
 * @param {Date} date2 - Segunda fecha
 * @returns {number} Diferencia en días
 */
export function dateDiffInDays(date1, date2) {
  const diffTime = Math.abs(date2 - date1)
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * Convierte milisegundos a segundos
 * @param {number} ms - Milisegundos
 * @returns {number} Segundos
 */
export function msToSeconds(ms) {
  return Math.round(ms / 10) / 100
}

/**
 * Agrupa un array de objetos por una propiedad
 * @param {Array} array - Array a agrupar
 * @param {string} property - Propiedad por la que agrupar
 * @returns {Object} Objeto con grupos
 */
export function groupBy(array, property) {
  return array.reduce((groups, item) => {
    const group = item[property]
    if (!groups[group]) {
      groups[group] = []
    }
    groups[group].push(item)
    return groups
  }, {})
}

/**
 * Calcula el promedio de un array de números
 * @param {number[]} numbers - Array de números
 * @returns {number} Promedio
 */
export function average(numbers) {
  if (numbers.length === 0) return 0
  return numbers.reduce((sum, num) => sum + num, 0) / numbers.length
}

/**
 * Encuentra el máximo valor en un array de objetos por una propiedad
 * @param {Array} array - Array de objetos
 * @param {string} property - Propiedad a comparar
 * @returns {any} Valor máximo
 */
export function maxBy(array, property) {
  if (array.length === 0) return null
  return array.reduce((max, item) => item[property] > max[property] ? item : max)
}

/**
 * Encuentra el mínimo valor en un array de objetos por una propiedad
 * @param {Array} array - Array de objetos
 * @param {string} property - Propiedad a comparar
 * @returns {any} Valor mínimo
 */
export function minBy(array, property) {
  if (array.length === 0) return null
  return array.reduce((min, item) => item[property] < min[property] ? item : min)
}