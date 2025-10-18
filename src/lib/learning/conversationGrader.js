// Conversation Grader - Evaluates user responses in conversations
// Uses fuzzy matching and linguistic analysis for natural dialog validation

import { createLogger } from '../utils/logger.js'

const logger = createLogger('learning:conversationGrader')

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(a, b) {
  const matrix = []

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        )
      }
    }
  }

  return matrix[b.length][a.length]
}

/**
 * Calculate similarity percentage between two strings
 */
function calculateSimilarity(str1, str2) {
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase())
  const maxLength = Math.max(str1.length, str2.length)
  return maxLength === 0 ? 100 : Math.round((1 - distance / maxLength) * 100)
}

/**
 * Normalize Spanish text for comparison
 */
function normalizeSpanish(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[¿?¡!.,;:]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ') // Normalize whitespace
}

/**
 * Check for common Spanish verb conjugations
 */
function detectVerbs(text) {
  const verbPatterns = {
    querer: /quiero|quieres|quiere|queremos|queréis|quieren|quisiera|quisieras|quisiere/i,
    tener: /tengo|tienes|tiene|tenemos|tenéis|tienen|tuve|tuviste|tuvo/i,
    hacer: /hago|haces|hace|hacemos|hacéis|hacen|hice|hiciste|hizo/i,
    ser: /soy|eres|es|somos|sois|son|era|eras|fue|fuiste/i,
    estar: /estoy|estás|está|estamos|estáis|están|estuve|estuviste/i,
    ir: /voy|vas|va|vamos|vais|van|fui|fuiste|fue/i,
    poder: /puedo|puedes|puede|podemos|podéis|pueden|pude|pudiste/i,
    decir: /digo|dices|dice|decimos|decís|dicen|dije|dijiste/i,
    dar: /doy|das|da|damos|dais|dan|di|diste|dio/i,
    saber: /sé|sabes|sabe|sabemos|sabéis|saben|supe|supiste/i
  }

  const detected = []
  Object.entries(verbPatterns).forEach(([verb, pattern]) => {
    if (pattern.test(text)) {
      detected.push(verb)
    }
  })

  return detected
}

/**
 * Detect mood and tense from verb forms
 */
function detectMoodTense(text) {
  const moodTensePatterns = {
    'indicative-pres': /soy|tengo|hago|quiero|estoy|voy|puedo|doy|sé/i,
    'indicative-pretIndef': /fui|tuve|hice|quise|estuve|pude|di|supe/i,
    'indicative-impf': /era|tenía|hacía|quería|estaba|iba|podía/i,
    'conditional-cond': /sería|tendría|haría|querría|estaría|iría|podría/i,
    'subjunctive-subjPres': /sea|tenga|haga|quiera|esté|vaya|pueda/i,
    'subjunctive-subjImpf': /fuera|tuviera|hiciera|quisiera|estuviera/i
  }

  const detected = []
  Object.entries(moodTensePatterns).forEach(([key, pattern]) => {
    if (pattern.test(text)) {
      const [mood, tense] = key.split('-')
      detected.push({ mood, tense })
    }
  })

  return detected
}

/**
 * Evaluate user response in conversation
 * @param {string} userResponse - What the user said
 * @param {Object} expectedResponse - Expected response criteria
 * @param {Object} context - Conversation context
 * @returns {Object} Evaluation results
 */
export function gradeConversationResponse(userResponse, expectedResponse, context = {}) {
  const normalized = normalizeSpanish(userResponse)
  const detectedVerbs = detectVerbs(normalized)
  const detectedMoodTense = detectMoodTense(normalized)

  let score = 0
  const feedback = []
  const errors = []
  const successes = []

  // Check for expected verbs
  if (expectedResponse.verbs && expectedResponse.verbs.length > 0) {
    const foundVerbs = expectedResponse.verbs.filter(v => detectedVerbs.includes(v))
    if (foundVerbs.length > 0) {
      score += 30
      successes.push(`Usaste correctamente: ${foundVerbs.join(', ')}`)
    } else {
      errors.push(`Deberías usar uno de estos verbos: ${expectedResponse.verbs.join(', ')}`)
    }
  }

  // Check for expected mood/tense
  if (expectedResponse.mood && expectedResponse.tense) {
    const hasCorrectMoodTense = detectedMoodTense.some(
      mt => mt.mood === expectedResponse.mood && mt.tense === expectedResponse.tense
    )

    if (hasCorrectMoodTense) {
      score += 40
      successes.push(`Conjugación correcta en ${expectedResponse.mood} - ${expectedResponse.tense}`)
    } else {
      errors.push(`Necesitas usar ${expectedResponse.mood} - ${expectedResponse.tense}`)
    }
  }

  // Check against good examples if provided
  if (expectedResponse.goodExamples && expectedResponse.goodExamples.length > 0) {
    const similarities = expectedResponse.goodExamples.map(example =>
      calculateSimilarity(normalized, normalizeSpanish(example))
    )

    const maxSimilarity = Math.max(...similarities)
    if (maxSimilarity >= 70) {
      score += 30
      successes.push('Tu respuesta es muy similar a un ejemplo correcto')
    } else if (maxSimilarity >= 50) {
      score += 15
      feedback.push('Tu respuesta es parcialmente correcta')
    }
  }

  // Check for expected keywords
  if (expectedResponse.keywords && expectedResponse.keywords.length > 0) {
    const foundKeywords = expectedResponse.keywords.filter(keyword =>
      normalized.includes(keyword.toLowerCase())
    )

    if (foundKeywords.length > 0) {
      score += Math.min(20, foundKeywords.length * 10)
      successes.push(`Palabras clave detectadas: ${foundKeywords.join(', ')}`)
    }
  }

  // Pronunciation confidence bonus (if provided from speech recognition)
  if (context.confidence) {
    const confidenceScore = context.confidence * 10
    score += confidenceScore
    if (context.confidence >= 0.9) {
      successes.push('Pronunciación clara y confiable')
    } else if (context.confidence < 0.5) {
      feedback.push('Intenta hablar más claro')
    }
  }

  // Normalize score to 0-100
  score = Math.min(100, Math.max(0, score))

  // Determine if response is acceptable
  const isAcceptable = score >= 60
  const isPerfect = score >= 90
  const needsWork = score < 40

  // Generate contextual feedback
  let overallFeedback = ''
  if (isPerfect) {
    overallFeedback = '¡Perfecto! Respuesta excelente.'
  } else if (score >= 75) {
    overallFeedback = '¡Muy bien! Tu respuesta es correcta.'
  } else if (isAcceptable) {
    overallFeedback = 'Respuesta aceptable, pero podría mejorar.'
  } else {
    overallFeedback = 'Intenta de nuevo. Revisa las pistas.'
  }

  return {
    score,
    isAcceptable,
    isPerfect,
    needsWork,
    overallFeedback,
    detectedVerbs,
    detectedMoodTense,
    successes,
    errors,
    feedback,
    suggestions: generateSuggestions(errors, expectedResponse)
  }
}

/**
 * Generate suggestions based on errors
 */
function generateSuggestions(errors, expectedResponse) {
  const suggestions = []

  if (errors.length > 0) {
    suggestions.push(...errors)
  }

  if (expectedResponse.hints && expectedResponse.hints.length > 0) {
    suggestions.push(...expectedResponse.hints.slice(0, 2))
  }

  return suggestions
}

/**
 * Provide partial credit scoring for conversation
 * More forgiving than exact conjugation drills
 */
export function gradeWithPartialCredit(userResponse, expectedResponse, context = {}) {
  const baseGrade = gradeConversationResponse(userResponse, expectedResponse, context)

  // In conversation mode, we're more forgiving
  // Communication > perfection
  if (baseGrade.score >= 40 && baseGrade.score < 60) {
    // Boost scores in the 40-60 range to encourage continued conversation
    baseGrade.score = Math.min(65, baseGrade.score + 10)
    baseGrade.isAcceptable = true
    baseGrade.feedback.push('En conversación, lo importante es comunicar - ¡bien hecho!')
  }

  return baseGrade
}

export default {
  gradeConversationResponse,
  gradeWithPartialCredit,
  calculateSimilarity,
  normalizeSpanish,
  detectVerbs,
  detectMoodTense
}
