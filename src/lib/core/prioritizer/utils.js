/**
 * Utility Functions for Level-Driven Prioritizer
 *
 * Pure utility functions with no dependencies on the main classes.
 * Extracted from levelDrivenPrioritizer.js for better modularity.
 */

import { CURRICULUM_ANALYSIS } from './constants.js'

/**
 * Creates a tense key from mood and tense
 * @param {string} mood - Verb mood (e.g., 'indicative', 'subjunctive')
 * @param {string} tense - Verb tense (e.g., 'pres', 'pretIndef')
 * @returns {string} Tense key in format "mood|tense"
 */
export function getTenseKey(mood, tense) {
  return `${mood}|${tense}`
}

/**
 * Parses a tense key into mood and tense
 * @param {string} key - Tense key in format "mood|tense"
 * @returns {{mood: string, tense: string}} Parsed mood and tense
 */
export function parseTenseKey(key) {
  const [mood, tense] = key.split('|')
  return { mood, tense }
}

/**
 * Get the pedagogical family for a tense
 * @param {string} mood - Verb mood
 * @param {string} tense - Verb tense
 * @returns {string} Family name (e.g., 'present', 'past', 'perfect', etc.)
 */
export function getTenseFamily(mood, tense) {
  const families = {
    'present': ['indicative|pres'],
    'past': ['indicative|pretIndef', 'indicative|impf'],
    'future': ['indicative|fut', 'conditional|cond'],
    'perfect': ['indicative|pretPerf', 'indicative|plusc', 'indicative|futPerf', 'conditional|condPerf', 'subjunctive|subjPerf', 'subjunctive|subjPlusc'],
    'subjunctive_pres': ['subjunctive|subjPres', 'subjunctive|subjPerf'],
    'subjunctive_past': ['subjunctive|subjImpf', 'subjunctive|subjPlusc'],
    'commands': ['imperative|impAff', 'imperative|impNeg'],
    'nonfinite': ['nonfinite|ger', 'nonfinite|part']
  }

  const tenseKey = getTenseKey(mood, tense)
  for (const [family, tenses] of Object.entries(families)) {
    if (tenses.includes(tenseKey)) return family
  }
  return 'other'
}

/**
 * Get complexity score for a verb form
 * @param {Object} form - Verb form object with mood and tense
 * @param {string} _level - CEFR level (not used currently, for future)
 * @returns {number} Complexity score (1-9)
 */
export function getFormComplexity(form, _level) {
  const tenseKey = getTenseKey(form.mood, form.tense)
  return CURRICULUM_ANALYSIS.complexity_scores[tenseKey] || 5
}

/**
 * Get base complexity for a CEFR level
 * @param {string} level - CEFR level (A1-C2)
 * @returns {number} Base complexity score for the level
 */
export function getLevelBaseComplexity(level) {
  const baseComplexity = {
    'A1': 1.5,
    'A2': 3.0,
    'B1': 5.0,
    'B2': 7.0,
    'C1': 8.0,
    'C2': 9.0
  }
  return baseComplexity[level] || 5.0
}

/**
 * Remove duplicate tenses from an array
 * @param {Array} tenses - Array of tense objects
 * @returns {Array} Array with duplicates removed (keeps first occurrence)
 */
export function removeDuplicateTenses(tenses) {
  const seen = new Set()
  return tenses.filter(tense => {
    const key = tense.key || getTenseKey(tense.mood, tense.tense)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/**
 * Check if a tense is a prerequisite for any tense in a given level
 * @param {string} tenseKey - Tense key to check
 * @param {string} level - CEFR level
 * @param {Object} curriculumData - Processed curriculum data
 * @returns {boolean} True if tense is a prerequisite for the level
 */
export function isPrerequisiteForLevel(tenseKey, level, curriculumData) {
  const levelTenses = curriculumData.byLevel[level] || []

  for (const tense of levelTenses) {
    const prereqs = CURRICULUM_ANALYSIS.prerequisites[tense.key] || []
    if (prereqs.includes(tenseKey)) {
      return true
    }
  }

  return false
}

/**
 * Compare two tenses by family priority
 * Used for sorting tenses within the same level
 * @param {Object} a - First tense object
 * @param {Object} b - Second tense object
 * @returns {number} Comparison result (-1, 0, 1)
 */
export function compareFamilyPriority(a, b) {
  const familyOrder = [
    'present',
    'nonfinite',
    'past',
    'future',
    'commands',
    'perfect',
    'subjunctive_pres',
    'subjunctive_past',
    'other'
  ]

  const aFamilyIndex = familyOrder.indexOf(a.family || 'other')
  const bFamilyIndex = familyOrder.indexOf(b.family || 'other')

  if (aFamilyIndex !== bFamilyIndex) {
    return aFamilyIndex - bFamilyIndex
  }

  // If same family, sort by complexity
  return (a.complexity || 5) - (b.complexity || 5)
}
