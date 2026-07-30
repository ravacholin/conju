import { LEVELS } from '../data/levels.js'

/**
 * Pedagogy presets applied when a CEFR level is selected.
 *
 * Extracted from useOnboardingFlow.selectLevel so that any entry point that
 * needs to drop the user into a level (the onboarding menu, the topic search)
 * shares one definition of what a level means instead of duplicating the knobs.
 */

const C2_RARE_BOOST_LEMMAS = [
  'argüir', 'delinquir', 'henchir', 'agorar', 'cocer', 'esparcir', 'distinguir', 'tañer'
]

// Flatten a level's verb packs into the set of lemmas the drill may use.
export function getAllowedLemmasForLevel(level) {
  const levelConfig = LEVELS[level]
  if (!levelConfig || !levelConfig.verbPacks) {
    return null // No restriction
  }

  const allowedLemmas = new Set()
  levelConfig.verbPacks.forEach(pack => {
    pack.lemmas.forEach(lemma => allowedLemmas.add(lemma))
  })

  return allowedLemmas
}

const LEVEL_POLICIES = {
  A1: {
    strict: false,
    accentTolerance: 'accept',
    requireDieresis: false,
    blockNonNormativeSpelling: false,
    cliticStrictness: 'off',
    impSubjVariantMode: 'accept_both',
    cliticsPercent: 0,
    neutralizePronoun: false,
    rotateSecondPerson: false,
    timeMode: 'none',
    perItemMs: null,
    medianTargetMs: null,
    showPronouns: true,
    practicePronoun: 'both'
  },
  A2: {
    strict: false,
    accentTolerance: 'warn',
    requireDieresis: false,
    blockNonNormativeSpelling: false,
    cliticStrictness: 'off',
    impSubjVariantMode: 'accept_both',
    cliticsPercent: 0,
    neutralizePronoun: false,
    rotateSecondPerson: false,
    timeMode: 'soft',
    perItemMs: 8000,
    medianTargetMs: null,
    showPronouns: true
  },
  B1: {
    strict: true,
    accentTolerance: 'warn',
    requireDieresis: false,
    blockNonNormativeSpelling: false,
    cliticStrictness: 'low',
    impSubjVariantMode: 'accept_both',
    cliticsPercent: 0,
    neutralizePronoun: false,
    rotateSecondPerson: false,
    timeMode: 'soft',
    perItemMs: 6000,
    medianTargetMs: 3000
  },
  B2: {
    strict: true,
    accentTolerance: 'strict',
    requireDieresis: true,
    blockNonNormativeSpelling: false,
    cliticStrictness: 'low',
    impSubjVariantMode: 'accept_both',
    cliticsPercent: 10,
    neutralizePronoun: false,
    rotateSecondPerson: true,
    timeMode: 'strict',
    perItemMs: 5000,
    medianTargetMs: 2500
  },
  C1: {
    strict: true,
    accentTolerance: 'warn',
    requireDieresis: true,
    blockNonNormativeSpelling: true,
    cliticStrictness: 'high',
    cliticsPercent: 30,
    neutralizePronoun: true,
    rotateSecondPerson: false,
    timeMode: 'strict',
    perItemMs: 3500,
    medianTargetMs: 1800,
    enableFuturoSubjRead: true,
    enableFuturoSubjProd: false,
    enableC2Conmutacion: false
  },
  C2: {
    strict: true,
    accentTolerance: 'strict',
    requireDieresis: true,
    blockNonNormativeSpelling: true,
    cliticStrictness: 'high',
    cliticsPercent: 60,
    neutralizePronoun: true,
    rotateSecondPerson: true,
    timeMode: 'strict',
    perItemMs: 2500,
    medianTargetMs: 1200,
    enableFuturoSubjRead: true,
    enableFuturoSubjProd: true,
    enableC2Conmutacion: true,
    burstSize: 16,
    c2RareBoostLemmas: C2_RARE_BOOST_LEMMAS,
    // C2 practises ALL dialect forms (tú, vos, vosotros) regardless of the
    // dialect chosen at step 1.
    region: 'global',
    useTuteo: true,
    useVoseo: true,
    useVosotros: true,
    practicePronoun: 'all'
  }
}

/**
 * Build the settings patch for a CEFR level.
 *
 * Note it deliberately does NOT set practiceMode: the onboarding flow lets the
 * user pick mixed vs specific in the next step, and the topic search overrides
 * it explicitly.
 *
 * @param {string} level - A1..C2
 * @returns {Object} settings patch ready for useSettings.set()
 */
export function buildLevelSettingsUpdate(level) {
  return {
    level,
    cameFromTema: false,
    specificMood: null,
    specificTense: null,
    ...(LEVEL_POLICIES[level] || {}),
    allowedLemmas: getAllowedLemmasForLevel(level)
  }
}
