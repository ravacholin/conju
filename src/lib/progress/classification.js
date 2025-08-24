// Reglas de clasificación de errores para el sistema de progreso

import { ERROR_TAGS } from './dataModels.js'

/**
 * Clasifica errores en la conjugación de verbos
 * @param {string} userAnswer - Respuesta del usuario
 * @param {string} correctAnswer - Respuesta correcta
 * @param {Object} item - Ítem practicado
 * @returns {string[]} Etiquetas de error
 */
export function classifyError(userAnswer, correctAnswer, item) {
  const errors = []
  
  // Normalizar respuestas para comparación
  const normalizedUser = normalizeAnswer(userAnswer)
  const normalizedCorrect = normalizeAnswer(correctAnswer)
  
  // Si las respuestas son idénticas, no hay error
  if (normalizedUser === normalizedCorrect) {
    return []
  }
  
  // Verificar errores específicos
  
  // 1. Persona equivocada (simplificado)
  if (hasWrongPerson(normalizedUser, normalizedCorrect, item)) {
    errors.push(ERROR_TAGS.WRONG_PERSON)
  }
  
  // 2. Terminación verbal
  if (hasDifferentEnding(normalizedUser, normalizedCorrect)) {
    errors.push(ERROR_TAGS.VERBAL_ENDING)
  }
  
  // 3. Raíz irregular
  if (hasIrregularStemIssue(item, normalizedUser, normalizedCorrect)) {
    errors.push(ERROR_TAGS.IRREGULAR_STEM)
  }
  
  // 4. Acentuación
  if (hasAccentError(userAnswer, correctAnswer)) {
    errors.push(ERROR_TAGS.ACCENT)
  }
  
  // 5. Ortografía por cambio g/gu, c/qu, z/c
  if (hasOrthographicError(normalizedUser, normalizedCorrect)) {
    const orthErrors = getOrthographicErrors(normalizedUser, normalizedCorrect)
    errors.push(...orthErrors)
  }
  
  // 6. Concordancia número
  // Esto sería relevante para formas con sujetos, no implementado aquí
  
  // 7. Modo equivocado
  // Esto se detectaría en modo reverso, no en modo normal
  
  // Si no se identifican errores específicos, marcar como error general
  if (errors.length === 0) {
    errors.push(ERROR_TAGS.WRONG_PERSON) // Por defecto
  }
  
  return errors
}

/**
 * Normaliza una respuesta para comparación
 * @param {string} answer - Respuesta a normalizar
 * @returns {string} Respuesta normalizada
 */
function normalizeAnswer(answer) {
  if (!answer || typeof answer !== 'string') return ''
  
  return answer
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .replace(/\s+/g, ' ') // Normalizar espacios
    .trim()
}

/**
 * Verifica si hay un error de persona
 * @param {string} user - Respuesta del usuario normalizada
 * @param {string} correct - Respuesta correcta normalizada
 * @param {Object} item - Ítem practicado
 * @returns {boolean} Si hay error de persona
 */
function hasWrongPerson(user, correct, item) {
  // Esta es una implementación simplificada
  // En una implementación completa, se verificaría contra las terminaciones
  // esperadas para cada persona
  
  // Para verbos irregulares, si la raíz es diferente, es un error de persona
  if (item.verbType === 'irregular') {
    // Comparar las primeras partes de las palabras
    const userStem = user.slice(0, Math.max(0, user.length - 3))
    const correctStem = correct.slice(0, Math.max(0, correct.length - 3))
    
    return userStem !== correctStem
  }
  
  return false
}

/**
 * Verifica si dos respuestas tienen terminaciones diferentes
 * @param {string} user - Respuesta del usuario normalizada
 * @param {string} correct - Respuesta correcta normalizada
 * @returns {boolean} Si tienen terminaciones diferentes
 */
function hasDifferentEnding(user, correct) {
  // Obtener las últimas 3 letras de cada respuesta
  const userEnd = user.slice(-3)
  const correctEnd = correct.slice(-3)
  
  return userEnd !== correctEnd
}

/**
 * Verifica si hay un problema con la raíz irregular
 * @param {Object} item - Ítem practicado
 * @param {string} user - Respuesta del usuario normalizada
 * @param {string} correct - Respuesta correcta normalizada
 * @returns {boolean} Si hay problema con la raíz
 */
function hasIrregularStemIssue(item, user, correct) {
  // Esta es una implementación simplificada
  // En una implementación completa, se verificaría contra las familias irregulares
  
  // Para verbos irregulares, si la raíz es diferente, es un error de raíz
  if (item.verbType === 'irregular') {
    // Comparar las primeras partes de las palabras
    const userStem = user.slice(0, Math.max(0, user.length - 3))
    const correctStem = correct.slice(0, Math.max(0, correct.length - 3))
    
    return userStem !== correctStem
  }
  
  return false
}

/**
 * Verifica si hay un error de acentuación
 * @param {string} user - Respuesta del usuario
 * @param {string} correct - Respuesta correcta
 * @returns {boolean} Si hay error de acentuación
 */
function hasAccentError(user, correct) {
  // Normalizar sin remover acentos
  const normalizedUser = user.toLowerCase().trim()
  const normalizedCorrect = correct.toLowerCase().trim()
  
  // Remover acentos para comparar
  const userWithoutAccents = user.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const correctWithoutAccents = correct.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  
  // Si son iguales sin acentos pero diferentes con acentos, hay error de acentuación
  return (
    userWithoutAccents.toLowerCase().trim() === correctWithoutAccents.toLowerCase().trim() &&
    normalizedUser !== normalizedCorrect
  )
}

/**
 * Verifica si hay errores ortográficos
 * @param {string} user - Respuesta del usuario normalizada
 * @param {string} correct - Respuesta correcta normalizada
 * @returns {boolean} Si hay errores ortográficos
 */
function hasOrthographicError(user, correct) {
  // Verificar patrones comunes de errores ortográficos
  const patterns = [
    /g(?=[ue])/g,  // g que debería ser gu
    /c(?=[ei])/g,  // c que debería ser qu
    /z(?=[aeiou])/g // z que debería ser c
  ]
  
  return patterns.some(pattern => {
    return pattern.test(user) !== pattern.test(correct)
  })
}

/**
 * Obtiene las etiquetas específicas de errores ortográficos
 * @param {string} user - Respuesta del usuario normalizada
 * @param {string} correct - Respuesta correcta normalizada
 * @returns {string[]} Etiquetas de errores ortográficos
 */
function getOrthographicErrors(user, correct) {
  const errors = []
  
  // Verificar error de g/gu
  if (hasGGuError(user, correct)) {
    errors.push(ERROR_TAGS.ORTHOGRAPHY_G_GU)
  }
  
  // Verificar error de c/qu
  if (hasCQuError(user, correct)) {
    errors.push(ERROR_TAGS.ORTHOGRAPHY_C_QU)
  }
  
  // Verificar error de z/c
  if (hasZCError(user, correct)) {
    errors.push(ERROR_TAGS.ORTHOGRAPHY_Z_C)
  }
  
  return errors
}

/**
 * Verifica error específico de g/gu
 * @param {string} user - Respuesta del usuario normalizada
 * @param {string} correct - Respuesta correcta normalizada
 * @returns {boolean} Si hay error de g/gu
 */
function hasGGuError(user, correct) {
  // Verificar si hay diferencias en patrones g/gu
  const userHasGu = /gu[ei]/.test(user)
  const correctHasGu = /gu[ei]/.test(correct)
  const userHasG = /g[ei]/.test(user) && !userHasGu
  const correctHasG = /g[ei]/.test(correct) && !correctHasGu
  
  return (userHasGu && correctHasG) || (userHasG && correctHasGu)
}

/**
 * Verifica error específico de c/qu
 * @param {string} user - Respuesta del usuario normalizada
 * @param {string} correct - Respuesta correcta normalizada
 * @returns {boolean} Si hay error de c/qu
 */
function hasCQuError(user, correct) {
  // Verificar si hay diferencias en patrones c/qu
  const userHasQu = /qu[ei]/.test(user)
  const correctHasQu = /qu[ei]/.test(correct)
  const userHasC = /c[ei]/.test(user) && !userHasQu
  const correctHasC = /c[ei]/.test(correct) && !correctHasQu
  
  return (userHasQu && correctHasC) || (userHasC && correctHasQu)
}

/**
 * Verifica error específico de z/c
 * @param {string} user - Respuesta del usuario normalizada
 * @param {string} correct - Respuesta correcta normalizada
 * @returns {boolean} Si hay error de z/c
 */
function hasZCError(user, correct) {
  // Verificar si hay diferencias en patrones z/c
  const userHasZ = /z[aeiou]/.test(user)
  const correctHasZ = /z[aeiou]/.test(correct)
  const userHasC = /c[aeiou]/.test(user) && !userHasZ
  const correctHasC = /c[aeiou]/.test(correct) && !correctHasZ
  
  return (userHasZ && correctHasC) || (userHasC && correctHasZ)
}

/**
 * Clasificación detallada de errores (para uso futuro)
 * @param {string} userAnswer - Respuesta del usuario
 * @param {string} correctAnswer - Respuesta correcta
 * @param {Object} item - Ítem practicado
 * @returns {Object} Análisis detallado del error
 */
export function detailedErrorAnalysis(userAnswer, correctAnswer, item) {
  // En una implementación completa, esto haría un análisis lingüístico
  // más detallado para identificar exactamente qué tipo de error cometió
  // el usuario y por qué
  
  return {
    userAnswer,
    correctAnswer,
    errors: classifyError(userAnswer, correctAnswer, item),
    // En una implementación completa, aquí se añadirían más detalles
    // como sugerencias específicas, explicaciones gramaticales, etc.
  }
}