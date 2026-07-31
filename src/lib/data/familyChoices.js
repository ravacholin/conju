import { getFamiliesForMood, getFamiliesForTense } from './irregularFamilies.js'
import {
  getSimplifiedGroupsForMood,
  getSimplifiedGroupsForTense,
  shouldUseSimplifiedGroupingForMood,
  shouldUseSimplifiedGrouping
} from './simplifiedFamilyGroups.js'

/**
 * The irregular families the onboarding offers at the family step.
 *
 * Lives here rather than in OnboardingFlow.jsx so the drillability test can
 * assert against the exact list the user sees — a family with no verbs behind
 * it is a menu-data bug, and it should fail in CI rather than in a drill.
 */

export const MAX_FAMILY_CHOICES = 8

const FALLBACK_FAMILIES = [
  { id: 'G_VERBS',   name: 'Irregulares en YO',  description: 'tener, poner, salir, conocer, vencer' },
  { id: 'UIR_Y',     name: '-uir (inserción y)',  description: 'construir, huir' },
  { id: 'PRET_UV',   name: 'Pretérito -uv-',      description: 'andar, estar, tener' },
  { id: 'PRET_U',    name: 'Pretérito -u-',       description: 'poder, poner, saber' },
  { id: 'PRET_J',    name: 'Pretérito -j-',       description: 'decir, traer' }
]

/**
 * @param {Object} settings - needs specificMood and/or specificTense
 * @returns {{ groups: Array, families: Array }} - `groups` are simplified
 *   pedagogical groups (mutually exclusive with `families`)
 */
export function getFamilyChoices({ specificMood, specificTense } = {}) {
  let groups = []
  if (specificTense && shouldUseSimplifiedGrouping(specificTense)) {
    groups = getSimplifiedGroupsForTense(specificTense) || []
  } else if (specificMood && !specificTense && shouldUseSimplifiedGroupingForMood(specificMood)) {
    groups = getSimplifiedGroupsForMood(specificMood) || []
  }

  if (groups.length > 0) {
    return { groups, families: [] }
  }

  const families = specificTense
    ? getFamiliesForTense(specificTense)
    : specificMood
      ? getFamiliesForMood(specificMood)
      : FALLBACK_FAMILIES

  return {
    groups: [],
    families: (families || FALLBACK_FAMILIES).slice(0, MAX_FAMILY_CHOICES)
  }
}
