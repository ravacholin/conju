// Utilidades generales para el sistema de progreso

/**
 * Genera un ID único
 * @returns {string} ID único
 */
export function generateId() {
  return `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Formatea un número como porcentaje
 * @param {number} value - Valor a formatear
 * @param {number} decimals - Número de decimales
 * @returns {string} Valor formateado como porcentaje
 */
export function formatPercentage(value, decimals = 0) {
  if (value === null || value === undefined) return 'N/A'
  return `${value.toFixed(decimals)}%`
}

/**
 * Formatea una fecha como texto relativo
 * @param {Date} date - Fecha a formatear
 * @returns {string} Fecha formateada
 */
export function formatRelativeDate(date) {
  if (!date) return 'Nunca'
  
  const now = new Date()
  const diffMs = now - date
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Hoy'
  if (diffDays === 1) return 'Ayer'
  if (diffDays < 7) return `Hace ${diffDays} días`
  if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`
  
  return date.toLocaleDateString('es-ES')
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

/**
 * Determina el color para un valor de mastery
 * @param {number} score - Valor de mastery
 * @returns {string} Clase CSS para el color
 */
export function getMasteryColorClass(score) {
  if (score >= 80) return 'mastery-high'
  if (score >= 60) return 'mastery-medium'
  return 'mastery-low'
}

/**
 * Determina el nivel de mastery como texto
 * @param {number} score - Valor de mastery
 * @returns {string} Nivel de mastery
 */
export function getMasteryLevelText(score) {
  if (score >= 80) return 'Dominado'
  if (score >= 60) return 'En progreso'
  return 'En dificultades'
}

/**
 * Determina el icono para un nivel de mastery
 * @param {number} score - Valor de mastery
 * @returns {string} Icono
 */
export function getMasteryIcon(score) {
  if (score >= 80) return '✅'
  if (score >= 60) return ''
  return '️'
}

/**
 * Normaliza una cadena de texto
 * @param {string} str - Cadena a normalizar
 * @returns {string} Cadena normalizada
 */
export function normalizeString(str) {
  if (!str || typeof str !== 'string') return ''
  
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .replace(/\s+/g, ' ') // Normalizar espacios
    .trim()
}

/**
 * Verifica si dos cadenas son iguales ignorando acentos
 * @param {string} str1 - Primera cadena
 * @param {string} str2 - Segunda cadena
 * @returns {boolean} Si son iguales sin acentos
 */
export function equalsIgnoreAccents(str1, str2) {
  return normalizeString(str1) === normalizeString(str2)
}

/**
 * Verifica si una cadena contiene acentos
 * @param {string} str - Cadena a verificar
 * @returns {boolean} Si contiene acentos
 */
export function hasAccents(str) {
  if (!str || typeof str !== 'string') return false
  return str !== str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
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
 * Formatea una fecha como texto legible
 * @param {Date} date - Fecha a formatear
 * @returns {string} Fecha formateada
 */
export function formatDate(date) {
  return new Date(date).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

/**
 * Formatea una hora como texto legible
 * @param {Date} date - Hora a formatear
 * @returns {string} Hora formateada
 */
export function formatTimeOnly(date) {
  return new Date(date).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Verifica si un objeto está vacío
 * @param {Object} obj - Objeto a verificar
 * @returns {boolean} Si está vacío
 */
export function isEmpty(obj) {
  return !obj || Object.keys(obj).length === 0
}

/**
 * Clona un objeto profundamente
 * @param {Object} obj - Objeto a clonar
 * @returns {Object} Objeto clonado
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj)
  if (obj instanceof Array) return obj.map(item => deepClone(item))
  if (obj instanceof Object) {
    const clonedObj = {}
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        clonedObj[key] = deepClone(obj[key])
      }
    }
    return clonedObj
  }
  return obj
}

/**
 * Mezcla dos objetos recursivamente
 * @param {Object} target - Objeto destino
 * @param {Object} source - Objeto fuente
 * @returns {Object} Objeto mezclado
 */
export function deepMerge(target, source) {
  const output = { ...target }
  
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] })
        } else {
          output[key] = deepMerge(target[key], source[key])
        }
      } else {
        Object.assign(output, { [key]: source[key] })
      }
    })
  }
  
  return output
}

/**
 * Verifica si un valor es un objeto
 * @param {any} item - Valor a verificar
 * @returns {boolean} Si es un objeto
 */
function isObject(item) {
  return (item && typeof item === 'object' && !Array.isArray(item))
}

/**
 * Genera un número aleatorio entre dos valores
 * @param {number} min - Valor mínimo
 * @param {number} max - Valor máximo
 * @returns {number} Número aleatorio
 */
export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Baraja un array usando el algoritmo Fisher-Yates
 * @param {Array} array - Array a barajar
 * @returns {Array} Array barajado
 */
export function shuffleArray(array) {
  const newArray = [...array]
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
  }
  return newArray
}

/**
 * Obtiene un elemento aleatorio de un array
 * @param {Array} array - Array de elementos
 * @returns {any} Elemento aleatorio
 */
export function randomElement(array) {
  if (!array || array.length === 0) return null
  return array[Math.floor(Math.random() * array.length)]
}

/**
 * Cuenta las ocurrencias de un valor en un array
 * @param {Array} array - Array a contar
 * @param {any} value - Valor a contar
 * @returns {number} Número de ocurrencias
 */
export function countOccurrences(array, value) {
  return array.filter(item => item === value).length
}

/**
 * Elimina duplicados de un array
 * @param {Array} array - Array con posibles duplicados
 * @returns {Array} Array sin duplicados
 */
export function removeDuplicates(array) {
  return [...new Set(array)]
}

/**
 * Obtiene los primeros n elementos de un array
 * @param {Array} array - Array de elementos
 * @param {number} n - Número de elementos
 * @returns {Array} Primeros n elementos
 */
export function take(array, n) {
  return array.slice(0, Math.max(0, n))
}

/**
 * Omite los primeros n elementos de un array
 * @param {Array} array - Array de elementos
 * @param {number} n - Número de elementos a omitir
 * @returns {Array} Array sin los primeros n elementos
 */
export function skip(array, n) {
  return array.slice(Math.max(0, n))
}

/**
 * Pagina un array
 * @param {Array} array - Array a paginar
 * @param {number} page - Número de página (1-indexed)
 * @param {number} pageSize - Tamaño de página
 * @returns {Array} Elementos de la página
 */
export function paginate(array, page, pageSize) {
  const startIndex = (page - 1) * pageSize
  return array.slice(startIndex, startIndex + pageSize)
}