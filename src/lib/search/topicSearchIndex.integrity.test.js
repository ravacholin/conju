import { describe, it, expect } from 'vitest'
import { getTopicSearchIndex, TOPIC_KINDS, TENSES_WITHOUT_IRREGULARS } from './topicSearchIndex.js'
import { buildFormsForRegion } from '../core/eligibility.js'
import { buildSpecificConstraints } from '../../hooks/modules/specificConstraints.js'
import { applyComprehensiveFiltering } from '../../hooks/modules/DrillFormFilters.js'
import { buildTopicPayload } from './searchPayloads.js'
import { MOOD_TENSES } from '../utils/verbLabels.js'

/**
 * The contract that matters: every entry the search can offer must produce at
 * least one drillable form. This runs the same pipeline useDrillGenerator does
 * (build region forms → derive specific constraints → comprehensive filtering)
 * rather than a proxy for it, so a payload that would leave the user staring
 * at a "generando…" spinner fails here instead of in production.
 */

const REGIONS = ['la_general', 'rioplatense', 'peninsular']
const index = getTopicSearchIndex()
const drillEntries = index.filter(e => e.kind !== TOPIC_KINDS.SECTION)

describe('topic search index — drillability', () => {
  REGIONS.forEach(region => {
    describe(region, () => {
      let pool

      it('builds a form pool for the region', async () => {
        pool = await buildFormsForRegion(region, {})
        expect(Array.isArray(pool)).toBe(true)
        expect(pool.length).toBeGreaterThan(0)
      })

      it('leaves every entry with at least one eligible form', async () => {
        const forms = pool || (await buildFormsForRegion(region, {}))
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
      const forms = await buildFormsForRegion(region, {})
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
})
