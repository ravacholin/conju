import { buildLevelSettingsUpdate } from '../core/levelSettingsPresets.js'

/**
 * Settings payloads produced by the menu topic search.
 *
 * Every key here must exist in SETTINGS_STATE_KEYS (src/state/settings.js) —
 * the store's sanitizer drops unknown keys silently, so a typo would produce a
 * quietly wrong drill. src/lib/search/searchPayloads.test.js guards that.
 */

// Same pedagogy defaults selectPracticeMode('theme') applies, so a drill
// launched from search behaves exactly like one launched from "practicar por
// tema".
const THEME_POLICY = {
  strict: true,
  accentTolerance: 'warn',
  requireDieresis: false,
  blockNonNormativeSpelling: false,
  cliticStrictness: 'low',
  cliticsPercent: 0,
  neutralizePronoun: false,
  rotateSecondPerson: false,
  timeMode: 'soft',
  perItemMs: 6000,
  medianTargetMs: 3000
}

/**
 * Payload for a mood+tense topic, optionally narrowed by verb type or family.
 *
 * practiceMode MUST be 'theme'. It is the only value for which the family
 * filter actually runs (src/lib/core/FormFilterService.js:371 and
 * src/hooks/modules/DrillFormFilters.js:593) — under 'specific' a
 * selectedFamily is accepted and then ignored. 'theme' also short-circuits the
 * curriculum gate, which is what lets someone search "subjuntivo imperfecto"
 * while their stored level is A1.
 *
 * Both mood and tense are required: buildSpecificConstraints only narrows when
 * both are set, so a mood-only payload would silently drill everything.
 */
export function buildTopicPayload({ mood, tense, verbType = 'all', selectedFamily = null }) {
  if (!mood || !tense) {
    throw new Error(`buildTopicPayload requires both mood and tense (got ${mood}/${tense})`)
  }

  return {
    ...THEME_POLICY,
    practiceMode: 'theme',
    cameFromTema: true,
    level: null,
    specificMood: mood,
    specificTense: tense,
    verbType,
    selectedFamily,
    // Clear any verb pack left behind by a previous level selection, otherwise
    // a drill launched from A1 stays clamped to the A1 lemmas.
    allowedLemmas: null
  }
}

/** Payload for "practise everything at level X". Keeps the level gate on. */
export function buildLevelPayload(level) {
  return {
    ...buildLevelSettingsUpdate(level),
    practiceMode: 'mixed',
    verbType: 'all',
    selectedFamily: null
  }
}
