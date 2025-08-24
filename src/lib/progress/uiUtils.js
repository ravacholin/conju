// Utilidades para la interfaz de usuario del sistema de progreso

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
 * Formatea un número como tiempo en segundos
 * @param {number} ms - Tiempo en milisegundos
 * @returns {string} Tiempo formateado
 */
export function formatTime(ms) {
  if (ms === null || ms === undefined) return 'N/A'
  
  const seconds = ms / 1000
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`
  } else {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = (seconds % 60).toFixed(0).padStart(2, '0')
    return `${minutes}:${remainingSeconds}`
  }
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
  if (score >= 60) return '🚧'
  return '⚠️'
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