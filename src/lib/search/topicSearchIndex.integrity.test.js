import { describe, it, expect } from 'vitest'
import {
  getTopicSearchIndex,
  TOPIC_KINDS,
  TENSES_WITHOUT_IRREGULARS,
  FAMILIES_WITHOUT_IRREGULAR_FORMS
} from './topicSearchIndex.js'
import { getFamiliesForTense } from '../data/irregularFamilies.js'
import { getSimplifiedGroupsForTense } from '../data/simplifiedFamilyGroups.js'
import { buildSpecificConstraints } from '../../hooks/modules/specificConstraints.js'
import {
  applyComprehensiveFiltering,
  generateAllFormsForRegion
} from '../../hooks/modules/DrillFormFilters.js'
import { buildTopicPayload } from './searchPayloads.js'
import { MOOD_TENSES } from '../utils/verbLabels.js'

/**
 * The contract that matters: every entry the search can offer must produce at
 * least one drillable form. This runs the same pipeline useDrillGenerator does
 * (build region forms → derive specific constraints → comprehensive filtering)
 * rather than a proxy for it, so a payload that would leave the user staring
 * at a "generando…" spinner fails here instead of in production. The pool comes
 * from generateAllFormsForRegion — the same builder the drill uses — so region
 * tagging matches production too.
 */

const REGIONS = ['la_general', 'rioplatense', 'peninsular']
const index = getTopicSearchIndex()
const drillEntries = index.filter(e => e.kind !== TOPIC_KINDS.SECTION)

describe('topic search index — drillability', () => {
  REGIONS.forEach(region => {
    describe(region, () => {
      let pool

      it('builds a form pool for the region', async () => {
        pool = await generateAllFormsForRegion(region, {})
        expect(Array.isArray(pool)).toBe(true)
        expect(pool.length).toBeGreaterThan(0)
      })

      it('leaves every entry with at least one eligible form', async () => {
        const forms = pool || (await generateAllFormsForRegion(region, {}))
        const empty = []

        drillEntries.forEach(entry => {
          const settings = { ...entry.payload, region }
          const constraints = buildSpecificConstraints(settings)
          const eligible = applyComprehensiveFiltering(forms, settings, constraints)
          if (!eligible || eligible.length === 0) {
            empty.push(`${entry.id} ("${entry.label}")`)
          }
        })

        expect(empty, `entries with an empty form pool in ${region}:\n${empty.join('\n')}`)
          .toEqual([])
      })
    })
  })

  // Guards TENSES_WITHOUT_IRREGULARS in the other direction: if the verb data
  // ever grows an irregular form in one of these tenses, the exclusion becomes
  // wrong and the entry should come back.
  REGIONS.forEach(region => {
    it(`excludes exactly the tenses with no irregular forms (${region})`, async () => {
      const forms = await generateAllFormsForRegion(region, {})
      const allTenses = Object.entries(MOOD_TENSES)
        .flatMap(([mood, tenses]) => tenses.map(tense => ({ mood, tense })))

      const actuallyEmpty = allTenses
        .filter(({ mood, tense }) => {
          const settings = { ...buildTopicPayload({ mood, tense, verbType: 'irregular' }), region }
          const eligible = applyComprehensiveFiltering(
            forms,
            settings,
            buildSpecificConstraints(settings)
          )
          return !eligible || eligible.length === 0
        })
        .map(({ tense }) => tense)

      expect([...new Set(actuallyEmpty)].sort()).toEqual([...TENSES_WITHOUT_IRREGULARS].sort())
    })
  })

  // Same contract for the family exclusions: a family whose forms become
  // detectably irregular must come back into the index, and one that goes
  // empty must be added to the list instead of silently failing a drill.
  REGIONS.forEach(region => {
    it(`excludes exactly the families with no irregular forms (${region})`, async () => {
      const forms = await generateAllFormsForRegion(region, {})
      const actuallyEmpty = []

      Object.entries(MOOD_TENSES).forEach(([mood, tenses]) => {
        tenses.forEach(tense => {
          // The same two sources buildFamilyEntries draws from.
          const choices = [
            ...(getSimplifiedGroupsForTense(tense) || []),
            ...(getFamiliesForTense(tense) || [])
          ]
          choices.forEach(family => {
            const settings = {
              ...buildTopicPayload({ mood, tense, verbType: 'irregular', selectedFamily: family.id }),
              region
            }
            const eligible = applyComprehensiveFiltering(
              forms,
              settings,
              buildSpecificConstraints(settings)
            )
            if (!eligible || eligible.length === 0) {
              actuallyEmpty.push(`${tense}:${family.id}`)
            }
          })
        })
      })

      expect([...new Set(actuallyEmpty)].sort())
        .toEqual([...FAMILIES_WITHOUT_IRREGULAR_FORMS].sort())
    })
  })
})
