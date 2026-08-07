// Regression test for the progress-module "Practicar esto" bug.
//
// Bug: In the progress dashboard's "Ver más" → "Reglas y tips" (and the error
// heatmap / difficult-verb cards), clicking "Practicar esto" always drilled
// presente regular instead of the targeted mood/tense.
//
// Root cause: these micro-drills build ad-hoc blocks like
// `{ combos, itemsRemaining }` with NO `id`. The generator's form-filter cache
// key used only `currentBlock?.id || 'none'`, so every block (and normal mixed
// practice) collapsed onto the same `none` bucket. The first pool cached there —
// typically the broad mixed pool dominated by present-indicative regular verbs —
// was then served for every subsequent combination.

import { describe, it, expect, beforeEach } from 'vitest'
import { chooseNext } from './generator.js'
import { buildFormsForRegion } from './eligibility.js'
import { clearAllCaches } from './optimizedCache.js'

const baseSettings = {
  level: 'B1',
  region: 'la_general',
  practiceMode: 'mixed',
  specificMood: null,
  specificTense: null,
  verbType: 'all',
  useVoseo: true,
  useTuteo: true,
  useVosotros: false,
  cameFromTema: false,
  currentBlock: null
}

describe('Progress micro-drill blocks (combos without id)', () => {
  beforeEach(() => {
    clearAllCaches()
  })

  it('should honor currentBlock.combos even after the general mixed pool is cached', async () => {
    const forms = await buildFormsForRegion('la_general')

    // 1) Warm the cache with a plain mixed-practice call (no block). Before the
    //    fix this populated the shared `none` bucket with the broad pool.
    for (let i = 0; i < 5; i++) {
      await chooseNext({ forms, history: {}, currentItem: null, sessionSettings: { ...baseSettings } })
    }

    // 2) Now drill an ad-hoc block targeting a NON-present combo, exactly like the
    //    "Practicar esto" cards do: a block with combos and itemsRemaining, no id.
    const blockSettings = {
      ...baseSettings,
      currentBlock: {
        combos: [{ mood: 'indicative', tense: 'impf' }],
        itemsRemaining: 8
      }
    }

    for (let i = 0; i < 40; i++) {
      const result = await chooseNext({ forms, history: {}, currentItem: null, sessionSettings: blockSettings })
      expect(result, `Iteration ${i + 1}: no form returned`).toBeTruthy()
      expect(
        `${result.mood}|${result.tense}`,
        `Iteration ${i + 1}: expected indicative|impf but got ${result.mood}|${result.tense} (${result.lemma})`
      ).toBe('indicative|impf')
    }
  })

  it('should not cross-contaminate two different combo blocks sharing no id', async () => {
    const forms = await buildFormsForRegion('la_general')

    const subjBlock = {
      ...baseSettings,
      currentBlock: { combos: [{ mood: 'subjunctive', tense: 'subjPres' }], itemsRemaining: 8 }
    }
    const condBlock = {
      ...baseSettings,
      currentBlock: { combos: [{ mood: 'conditional', tense: 'cond' }], itemsRemaining: 8 }
    }

    // Prime the subjunctive block, then switch to the conditional block. Before
    // the fix both shared the `none` cache bucket and the second reused the first.
    for (let i = 0; i < 5; i++) {
      const r = await chooseNext({ forms, history: {}, currentItem: null, sessionSettings: subjBlock })
      expect(`${r.mood}|${r.tense}`).toBe('subjunctive|subjPres')
    }

    for (let i = 0; i < 20; i++) {
      const r = await chooseNext({ forms, history: {}, currentItem: null, sessionSettings: condBlock })
      expect(
        `${r.mood}|${r.tense}`,
        `Iteration ${i + 1}: expected conditional|cond but got ${r.mood}|${r.tense} (${r.lemma})`
      ).toBe('conditional|cond')
    }
  })
})
