// Robust fallback system for verbs - ensures app ALWAYS works
// Even if lazy loading fails, app continues with basic functionality

import { getVerbsSync, areVerbsLoaded } from './verbsLazy.js'

// Essential verbs for basic functionality - hardcoded as absolute fallback
const ESSENTIAL_VERBS_FALLBACK = [
  {
    "id": "ser",
    "lemma": "ser",
    "type": "irregular",
    "paradigms": [{
      "regionTags": ["rioplatense", "la_general", "peninsular"],
      "forms": [
        { "mood": "indicative", "tense": "pres", "person": "1s", "value": "soy" },
        { "mood": "indicative", "tense": "pres", "person": "2s", "value": "eres" },
        { "mood": "indicative", "tense": "pres", "person": "3s", "value": "es" },
        { "mood": "indicative", "tense": "pres", "person": "1p", "value": "somos" },
        { "mood": "indicative", "tense": "pres", "person": "2p", "value": "sois" },
        { "mood": "indicative", "tense": "pres", "person": "3p", "value": "son" }
      ]
    }]
  },
  {
    "id": "estar",
    "lemma": "estar",
    "type": "irregular",
    "paradigms": [{
      "regionTags": ["rioplatense", "la_general", "peninsular"],
      "forms": [
        { "mood": "indicative", "tense": "pres", "person": "1s", "value": "estoy" },
        { "mood": "indicative", "tense": "pres", "person": "2s", "value": "estás" },
        { "mood": "indicative", "tense": "pres", "person": "3s", "value": "está" },
        { "mood": "indicative", "tense": "pres", "person": "1p", "value": "estamos" },
        { "mood": "indicative", "tense": "pres", "person": "2p", "value": "estáis" },
        { "mood": "indicative", "tense": "pres", "person": "3p", "value": "están" }
      ]
    }]
  },
  {
    "id": "hablar",
    "lemma": "hablar",
    "type": "regular",
    "paradigms": [{
      "regionTags": ["rioplatense", "la_general", "peninsular"],
      "forms": [
        { "mood": "indicative", "tense": "pres", "person": "1s", "value": "hablo" },
        { "mood": "indicative", "tense": "pres", "person": "2s", "value": "hablas" },
        { "mood": "indicative", "tense": "pres", "person": "3s", "value": "habla" },
        { "mood": "indicative", "tense": "pres", "person": "1p", "value": "hablamos" },
        { "mood": "indicative", "tense": "pres", "person": "2p", "value": "habláis" },
        { "mood": "indicative", "tense": "pres", "person": "3p", "value": "hablan" }
      ]
    }]
  }
]

/**
 * Get verbs with robust fallback system - ALWAYS returns verbs
 * @returns {Array} Verbs array (never empty, never fails)
 */
export function getVerbsWithFallback() {
  try {
    // Try sync cache first
    const syncVerbs = getVerbsSync()
    if (syncVerbs && syncVerbs.length > 0) {
      return syncVerbs
    }

    console.warn('⚠️ No verbs in cache, using essential fallback verbs')
    return ESSENTIAL_VERBS_FALLBACK
  } catch (error) {
    console.error('❌ Even fallback verbs failed, using minimal set:', error)
    return ESSENTIAL_VERBS_FALLBACK
  }
}

/**
 * Get verbs with progressive enhancement
 * @returns {Promise<Array>} Verbs array
 */
export async function getVerbsProgressive() {
  try {
    // If verbs already loaded, return them
    if (areVerbsLoaded()) {
      return getVerbsSync()
    }

    // Try lazy loading
    const { getVerbs } = await import('./verbsLazy.js')
    return await getVerbs()
  } catch (error) {
    console.warn('⚠️ Progressive loading failed, using fallback:', error)
    return getVerbsWithFallback()
  }
}

/**
 * Start progressive verb loading in background
 */
export function startProgressiveVerbLoading() {
  // Don't block anything, just start loading
  getVerbsProgressive().catch(() => {})
}

/**
 * Check if we're running with fallback verbs only
 * @returns {boolean}
 */
export function isUsingFallbackVerbs() {
  const currentVerbs = getVerbsWithFallback()
  return currentVerbs.length <= ESSENTIAL_VERBS_FALLBACK.length
}

/**
 * Get verb loading status for UI
 * @returns {Object}
 */
export function getVerbLoadingStatus() {
  const loaded = areVerbsLoaded()
  const usingFallback = isUsingFallbackVerbs()

  return {
    loaded,
    usingFallback,
    status: loaded ? 'loaded' : (usingFallback ? 'fallback' : 'loading'),
    verbCount: getVerbsWithFallback().length
  }
}