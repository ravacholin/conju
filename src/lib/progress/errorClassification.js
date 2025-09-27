// Clasificación de errores para el sistema de progreso

import { ERROR_TAGS } from './dataModels.js'
import { isIrregularInTense } from '../utils/irregularityUtils.js'
import { VERB_LOOKUP_MAP } from '../core/optimizedCache.js'

/**
 * Clasifica errores en la conjugación de verbos
 * @param {string} userAnswer - Respuesta del usuario
 * @param {string} correctAnswer - Respuesta correcta
 * @param {Object} item - Ítem practicado
 * @returns {string[]} Etiquetas de error
 */
export function classifyError(userAnswer, correctAnswer, item) {
  const errors = []
  
  // 0. Coincidencia exacta (incluye acentos) => sin error
  const rawUser = (userAnswer || '').toLowerCase().trim()
  const rawCorrect = (correctAnswer || '').toLowerCase().trim()
  if (rawUser === rawCorrect) {
    return []
  }
  
  // 1. Acentuación (verificar ANTES de normalizar). Si sólo difieren en tildes, reportar y terminar.
  if (hasAccentError(userAnswer, correctAnswer)) {
    errors.push(ERROR_TAGS.ACCENT)
  }
  
  // Normalizar respuestas para comparación (sin acentos)
  const normalizedUser = normalizeAnswer(userAnswer)
  const normalizedCorrect = normalizeAnswer(correctAnswer)
  
  // Si tras normalizar son idénticas, eran iguales salvo por acentos
  if (normalizedUser === normalizedCorrect) {
    return errors.length ? errors : []
  }
  
  // 1.b Forma válida pero de otra celda (antes de otras heurísticas)
  const match = findMatchingFormForLemma(item?.lemma, normalizedUser)
  if (match) {
    // Indicar que es una forma válida del mismo verbo
    errors.push(ERROR_TAGS.OTHER_VALID_FORM)
    if (match.mood !== item.mood) {
      errors.push(ERROR_TAGS.WRONG_MOOD)
    } else if (match.tense !== item.tense) {
      errors.push(ERROR_TAGS.WRONG_TENSE)
    } else if (match.person !== item.person) {
      errors.push(ERROR_TAGS.WRONG_PERSON)
    }
    // Continuar con otras señales (p.ej., ortografía) si procede
  }

  // 2. Ortografía por cambio g/gu, c/qu, z/c (prioridad alta)
  if (hasOrthographicError(normalizedUser, normalizedCorrect)) {
    const orthErrors = getOrthographicErrors(normalizedUser, normalizedCorrect)
    errors.push(...orthErrors)
  }
  
  // 3. Persona equivocada 
  if (hasWrongPerson(normalizedUser, normalizedCorrect, item)) {
    errors.push(ERROR_TAGS.WRONG_PERSON)
  }
  
  // 3.b Pronombres clíticos (imperativos o enclíticos anexados)
  if (hasCliticPronounIssue(userAnswer, correctAnswer)) {
    errors.push(ERROR_TAGS.CLITIC_PRONOUNS)
  }

  // 4. Terminación verbal
  if (hasDifferentEnding(normalizedUser, normalizedCorrect)) {
    errors.push(ERROR_TAGS.VERBAL_ENDING)
  }
  
  // 5. Raíz irregular
  if (hasIrregularStemIssue(item, normalizedUser, normalizedCorrect)) {
    errors.push(ERROR_TAGS.IRREGULAR_STEM)
  }
  
  // 6. Concordancia número
  // Esto sería relevante para formas con sujetos, no implementado aquí
  
  // 7. Modo equivocado
  // Esto se detectaría en modo reverso, no en modo normal
  
  // Si no se identifican errores específicos, hacer análisis más detallado
  if (errors.length === 0) {
    // Análisis adicional para errores no detectados previamente
    
    // Verificar si es un error de modo/tiempo (respuesta incorrecta pero válida para otro contexto)
    if (isValidVerbForm(normalizedUser) && normalizedUser !== normalizedCorrect) {
      errors.push(ERROR_TAGS.WRONG_MOOD)
    }
    // Verificar si es puramente una terminación diferente
    else if (hasSameStemDifferentEnding(normalizedUser, normalizedCorrect)) {
      errors.push(ERROR_TAGS.VERBAL_ENDING)
    }
    // Verificar si es un problema de raíz/stem
    else if (hasDifferentStemSameEnding(normalizedUser, normalizedCorrect)) {
      errors.push(ERROR_TAGS.IRREGULAR_STEM)
    }
    // Si sigue sin clasificar, asignar como error de persona (más común)
    else {
      errors.push(ERROR_TAGS.WRONG_PERSON)
    }
  }
  
  return errors
}

/**
 * Busca si la respuesta coincide con otra forma válida del mismo verbo
 * (considera value, alt y accepts.*) comparando en forma normalizada
 */
function findMatchingFormForLemma(lemma, normalizedUser) {
  if (!lemma || !normalizedUser) return null
  const verb = VERB_LOOKUP_MAP.get(lemma)
  if (!verb || !Array.isArray(verb.paradigms)) return null
  for (const p of verb.paradigms) {
    for (const f of p.forms || []) {
      const candidates = new Set()
      if (f.value) candidates.add(normalizeAnswer(f.value))
      ;(f.alt || []).forEach(a => candidates.add(normalizeAnswer(a)))
      if (f.accepts && typeof f.accepts === 'object') {
        Object.values(f.accepts).forEach(a => candidates.add(normalizeAnswer(String(a))))
      }
      if (candidates.has(normalizedUser)) {
        return { mood: f.mood, tense: f.tense, person: f.person }
      }
    }
  }
  return null
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
 * Detecta problemas con pronombres clíticos (presencia/ausencia o posición)
 * Heurística simple: si una respuesta contiene clíticos y la otra no.
 */
function hasCliticPronounIssue(userRaw, correctRaw) {
  if (typeof userRaw !== 'string' || typeof correctRaw !== 'string') return false
  const CLITICS = ['me','te','se','lo','la','los','las','le','les','nos','os']
  const containsClitic = (s) => CLITICS.some(p => new RegExp(`(^|\b|-)${p}($|\b|-)`, 'i').test(s))
  const uHas = containsClitic(userRaw)
  const cHas = containsClitic(correctRaw)
  return uHas !== cHas
}

/**
 * Verifica si hay un error de persona
 * @param {string} user - Respuesta del usuario normalizada
 * @param {string} correct - Respuesta correcta normalizada
 * @param {Object} item - Ítem practicado
 * @returns {boolean} Si hay error de persona
 */
function hasWrongPerson(user, correct, item) {
  // Verificar terminaciones típicas de persona
  const personEndings = {
    '1s': ['o', 'é', 'í', 'ía', 'ré', 'ría', 'e', 'a'],
    '2s_tu': ['as', 'es', 'aste', 'iste', 'ías', 'rás', 'rías', 'es', 'as'],
    '2s_vos': ['ás', 'és', 'aste', 'iste', 'ías', 'rás', 'rías', 'és', 'ás'],
    '3s': ['a', 'e', 'ó', 'ió', 'ía', 'rá', 'ría', 'e', 'a'],
    '1p': ['amos', 'emos', 'imos', 'ábamos', 'íamos', 'remos', 'ríamos', 'emos', 'amos'],
    '2p_vosotros': ['áis', 'éis', 'ís', 'asteis', 'isteis', 'íais', 'réis', 'ríais', 'éis', 'áis'],
    '3p': ['an', 'en', 'aron', 'ieron', 'ían', 'rán', 'rían', 'en', 'an']
  }
  
  // Obtener terminaciones esperadas para la persona del item
  const expectedEndings = personEndings[item.person] || []
  const userEndingsMatch = expectedEndings.some(ending => user.endsWith(ending))
  const correctEndingsMatch = expectedEndings.some(ending => correct.endsWith(ending))
  
  // Si la respuesta correcta coincide con las terminaciones esperadas 
  // pero la del usuario no, probablemente es error de persona
  if (correctEndingsMatch && !userEndingsMatch && user !== correct) {
    return true
  }
  
  // Para verbos irregulares, también verificar raíz
  const verb = VERB_LOOKUP_MAP.get(item.lemma)
  const isIrregularForTense = verb && isIrregularInTense(verb, item.tense)
  
  if (item.verbType === 'irregular' || isIrregularForTense) {
    const userStem = user.slice(0, Math.max(0, user.length - 2))
    const correctStem = correct.slice(0, Math.max(0, correct.length - 2))
    
    // Si las raíces son diferentes, puede ser error de persona en verbo irregular
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
  
  // Check if the verb is irregular in this specific tense for stem error detection
  const verb = verbs.find(v => v.lemma === item.lemma)
  const isIrregularForTense = verb && isIrregularInTense(verb, item.tense)
  
  // For verbs irregular in this tense, stem differences indicate stem errors
  if (item.verbType === 'irregular' || isIrregularForTense) {
    // Compare the stem parts of the words
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
  
  // Si son exactamente iguales, no hay error de acento
  if (normalizedUser === normalizedCorrect) {
    return false
  }
  
  // Remover acentos para comparar
  const userWithoutAccents = normalizedUser.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const correctWithoutAccents = normalizedCorrect.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  
  // Si son iguales sin acentos pero diferentes con acentos, hay error de acentuación
  return userWithoutAccents === correctWithoutAccents && normalizedUser !== normalizedCorrect
}

/**
 * Verifica si hay errores ortográficos
 * @param {string} user - Respuesta del usuario normalizada (sin acentos)
 * @param {string} correct - Respuesta correcta normalizada (sin acentos)
 * @returns {boolean} Si hay errores ortográficos
 */
function hasOrthographicError(user, correct) {
  // Verificar si hay diferencias que podrían ser ortográficas
  if (user === correct) return false
  
  // Check for g/gu differences
  if (hasGGuError(user, correct)) return true
  
  // Check for c/qu differences  
  if (hasCQuError(user, correct)) return true
  
  // Check for z/c differences
  if (hasZCError(user, correct)) return true
  
  return false
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
  // Casos típicos: sigo vs sego, sigues vs segues
  // Buscar patrones donde g/gu hacen diferencia
  
  // Reemplazar gu por g en ambas y comparar
  const userWithG = user.replace(/gu([ei])/g, 'g$1')
  const correctWithG = correct.replace(/gu([ei])/g, 'g$1')
  
  // Si al normalizar g/gu se vuelven iguales, había error ortográfico
  if (userWithG === correctWithG && user !== correct) {
    return true
  }
  
  // También buscar el patrón inverso
  const userWithGu = user.replace(/g([ei])/g, 'gu$1')  
  const correctWithGu = correct.replace(/g([ei])/g, 'gu$1')
  
  if (userWithGu === correctWithGu && user !== correct) {
    return true
  }
  
  // Heurística adicional: casos como "segues" vs "sigues" (misma secuencia "gue" pero vocal precedente distinta)
  // Detectar g + u + e y comparar la vocal inmediatamente anterior cuando ambos contienen "gue"
  for (let i = 1; i < user.length - 2; i++) {
    if (user[i] === 'g' && user[i + 1] === 'u' && user[i + 2] === 'e') {
      const prevU = user[i - 1]
      for (let j = 1; j < correct.length - 2; j++) {
        if (correct[j] === 'g' && correct[j + 1] === 'u' && correct[j + 2] === 'e') {
          const prevC = correct[j - 1]
          if (/[ei]/.test(prevU) && /[ei]/.test(prevC) && prevU !== prevC) {
            return true
          }
        }
      }
    }
  }

  return false
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
 * Verifica si una respuesta es una forma verbal válida (aunque no sea la correcta)
 * @param {string} answer - Respuesta a verificar
 * @returns {boolean} Si es una forma verbal válida
 */
function isValidVerbForm(answer) {
  // Lista de terminaciones verbales comunes en español
  const commonEndings = [
    // Present indicative
    'o', 'as', 'a', 'amos', 'áis', 'an', 'és', 'e', 'emos', 'éis', 'en',
    // Past tense
    'é', 'aste', 'ó', 'amos', 'asteis', 'aron', 'ía', 'ías', 'íamos', 'íais', 'ían',
    // Future
    'é', 'ás', 'á', 'emos', 'éis', 'án',
    // Subjunctive
    'e', 'es', 'emos', 'éis', 'en', 'a', 'as', 'amos', 'áis', 'an',
    // Common irregular forms
    'go', 'ga', 'igo', 'oy', 'uve', 'ise'
  ]
  
  return commonEndings.some(ending => answer.endsWith(ending))
}

/**
 * Verifica si dos respuestas tienen la misma raíz pero diferentes terminaciones
 * @param {string} user - Respuesta del usuario
 * @param {string} correct - Respuesta correcta  
 * @returns {boolean} Si tienen misma raíz, diferente terminación
 */
function hasSameStemDifferentEnding(user, correct) {
  if (user.length < 3 || correct.length < 3) return false
  
  // Obtener raíces (eliminar últimas 2-3 letras)
  const userStem = user.slice(0, -2)
  const correctStem = correct.slice(0, -2)
  
  return userStem === correctStem && user !== correct
}

/**
 * Verifica si dos respuestas tienen diferentes raíces pero terminaciones similares
 * @param {string} user - Respuesta del usuario  
 * @param {string} correct - Respuesta correcta
 * @returns {boolean} Si tienen diferente raíz, similar terminación
 */
function hasDifferentStemSameEnding(user, correct) {
  if (user.length < 3 || correct.length < 3) return false
  
  // Obtener terminaciones (últimas 2 letras)
  const userEnding = user.slice(-2)
  const correctEnding = correct.slice(-2)
  
  // Obtener raíces
  const userStem = user.slice(0, -2)
  const correctStem = correct.slice(0, -2)
  
  return userEnding === correctEnding && userStem !== correctStem
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
