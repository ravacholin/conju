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

// getMasteryColorClass moved to utils.js to avoid duplication

// getMasteryLevelText moved to utils.js to avoid duplication

// getMasteryIcon moved to utils.js to avoid duplication

// formatRelativeDate moved to utils.js to avoid duplication

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

// formatTimeOnly moved to utils.js to avoid duplication