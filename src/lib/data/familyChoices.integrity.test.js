import { describe, it, expect } from 'vitest'
import { getFamilyChoices } from './familyChoices.js'
import { getAllowedCombosForLevel } from '../core/curriculumGate.js'
import { buildLevelSettingsUpdate } from '../core/levelSettingsPresets.js'
import { filterEligibleForms } from '../core/FormFilterService.js'
import { buildSpecificConstraints } from '../../hooks/modules/specificConstraints.js'
import {
  applyComprehensiveFiltering,
  generateAllFormsForRegion
} from '../../hooks/modules/DrillFormFilters.js'

/**
 * Every irregular family the onboarding offers at step 8 must have verbs behind
 * it, through both filtering passes:
 *
 *   A) applyComprehensiveFiltering — builds eligibleForms, and the SRS/adaptive
 *      selection paths pick straight out of it.
 *   B) filterEligibleForms — the generator's own pass, where the level verb
 *      pack and the CEFR verb thinning also apply.
 *
 * An empty pool here means the user picks a family and gets an emergency
 * fallback item that ignores everything they chose. It is a menu-data or a
 * verb-pack problem, and it should fail in CI rather than in a drill.
 */

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
const REGION = 'la_general'

describe('onboarding family choices — drillability', () => {
  it('leaves every family offered by "por nivel" with at least one form', async () => {
    const forms = await generateAllFormsForRegion(REGION, {})
    expect(forms.length).toBeGreaterThan(0)

    const empty = []

    LEVELS.forEach(level => {
      const levelSettings = buildLevelSettingsUpdate(level)

      getAllowedCombosForLevel(level).forEach(combo => {
        const [specificMood, specificTense] = combo.split('|')
        const { groups, families } = getFamilyChoices({ specificMood, specificTense })

        ;[...groups, ...families].forEach(choice => {
          const settings = {
            ...levelSettings,
            region: REGION,
            practiceMode: 'specific',
            specificMood,
            specificTense,
            verbType: 'irregular',
            selectedFamily: choice.id
          }
          const constraints = buildSpecificConstraints(settings)

          const passA = applyComprehensiveFiltering(forms, settings, constraints)
          const passB = filterEligibleForms(forms, settings, {})

          if (!passA?.length || !passB?.length) {
            empty.push(
              `${level} ${specificMood}/${specificTense} → ${choice.id} ` +
              `(pass A: ${passA?.length ?? 0}, pass B: ${passB?.length ?? 0})`
            )
          }
        })
      })
    })

    expect(empty, `family choices with an empty form pool:\n${empty.join('\n')}`).toEqual([])
  })
})
