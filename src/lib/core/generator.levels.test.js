import { describe, it, expect } from 'vitest'
import { useSettings } from '../../state/settings.js'
import { chooseNext } from './generator.js'
import { buildFormsForRegion } from './eligibility.js'
import { gateFormsByCurriculumAndDialect, getAllowedCombosForLevel, getAllowedPersonsForRegion } from './curriculumGate.js'

const LEVELS = ['A1','A2','B1','B2','C1','C2']
const REGIONS = ['rioplatense','la_general','peninsular']

function setBaseSettings(partial) {
  useSettings.setState({
    level: 'A1',
    region: null,
    practiceMode: 'mixed',
    cameFromTema: false,
    specificMood: null,
    specificTense: null,
    practicePronoun: 'both',
    verbType: 'all',
    selectedFamily: null,
    ...partial,
  })
}

describe('Generator + CurriculumGate work in harmony', () => {
  it('mixed practice by level: all generated forms respect curriculum + dialect', () => {
    for (const level of LEVELS) {
      for (const region of REGIONS) {
        setBaseSettings({ level, region, practiceMode: 'mixed', cameFromTema: false })
        const base = buildFormsForRegion(region)
        // run several selections
        for (let i = 0; i < 20; i++) {
          const next = chooseNext({ forms: base, history: {}, currentItem: null })
          expect(next, `no selection for ${level}/${region}`).toBeTruthy()
          const gated = gateFormsByCurriculumAndDialect([next], useSettings.getState())
          expect(gated.length, `violates gate: ${JSON.stringify(next)}`).toBe(1)
        }
      }
    }
  })

  it('specific practice by level: respects selected combo + curriculum', () => {
    for (const level of LEVELS) {
      for (const region of REGIONS) {
        const combos = Array.from(getAllowedCombosForLevel(level)).slice(0, 3) // sample up to 3 combos
        const base = buildFormsForRegion(region)
        for (const combo of combos) {
          const [mood, tense] = combo.split('|')
          setBaseSettings({ level, region, practiceMode: 'specific', cameFromTema: false, specificMood: mood, specificTense: tense })
          for (let i = 0; i < 10; i++) {
            const next = chooseNext({ forms: base, history: {}, currentItem: null })
            expect(next, `no selection for ${level}/${region}/${combo}`).toBeTruthy()
            const gated = gateFormsByCurriculumAndDialect([next], useSettings.getState())
            expect(gated.length, `violates gate: ${JSON.stringify(next)} in ${combo}`).toBe(1)
          }
        }
      }
    }
  })

  it('specific practice by theme: bypass curriculum but enforce dialect', () => {
    for (const region of REGIONS) {
      const base = buildFormsForRegion(region)
      const allowedPersons = getAllowedPersonsForRegion(region)
      setBaseSettings({ level: 'A2', region, practiceMode: 'specific', cameFromTema: true, specificMood: 'indicative', specificTense: null })
      for (let i = 0; i < 20; i++) {
        const next = chooseNext({ forms: base, history: {}, currentItem: null })
        expect(next, `no selection for theme/${region}`).toBeTruthy()
        if (next.mood !== 'nonfinite') {
          expect(allowedPersons.has(next.person), `dialect violated in theme: ${JSON.stringify(next)}`).toBe(true)
        }
      }
    }
  })
})

