import { describe, it, expect } from 'vitest'
import { getFormsForRegion } from './verbDataService.js'
import { gateFormsByCurriculumAndDialect, getAllowedCombosForLevel, getAllowedPersonsForRegion } from './curriculumGate.js'

// Helper: build region-scoped forms as en AppRouter
async function buildRegionForms(region) {
  return getFormsForRegion(region, {})
}

const LEVELS = ['A1','A2','B1','B2','C1','C2']
const REGIONS = ['rioplatense','la_general','peninsular']

describe('Regresión por Niveles y Dialectos (CurriculumGate)', () => {
  it('Por nivel (mixto): todas las combinaciones respetan curriculum y dialecto', async () => {
    for (const level of LEVELS) {
      for (const region of REGIONS) {
        const forms = await buildRegionForms(region)
        const settings = { level, region, practiceMode: 'mixed', cameFromTema: false }
        const out = gateFormsByCurriculumAndDialect(forms, settings)
        const allowedCombos = getAllowedCombosForLevel(level)
        const allowedPersons = getAllowedPersonsForRegion(region)
        for (const f of out) {
          // Curriculum combos
          const comboKey = `${f.mood}|${f.tense}`
          if (!allowedCombos.has(comboKey)) {
            const isImperativeMix = f.mood === 'imperative' && ['impAff','impNeg'].includes(f.tense)
            const isNonfiniteMix = f.mood === 'nonfinite' && ['ger','part'].includes(f.tense)
            if (isImperativeMix) {
              expect(allowedCombos.has('imperative|impMixed')).toBe(true)
            } else if (isNonfiniteMix) {
              expect(allowedCombos.has('nonfinite|nonfiniteMixed')).toBe(true)
            } else {
              expect(allowedCombos.has(comboKey)).toBe(true)
            }
          }
          // Dialecto personas (skip nonfinite)
          if (f.mood !== 'nonfinite') {
            expect(allowedPersons.has(f.person)).toBe(true)
          }
        }
      }
    }
  })

  it('Por nivel (específica): respeta selection + curriculum', async () => {
    const region = 'rioplatense'
    const forms = await buildRegionForms(region)
    const settings = {
      level: 'A2',
      region,
      practiceMode: 'specific',
      cameFromTema: false,
      specificMood: 'indicative',
      specificTense: 'pres'
    }
    const out = gateFormsByCurriculumAndDialect(forms, settings)
    const allowedCombos = getAllowedCombosForLevel('A2')
    for (const f of out) {
      expect(f.mood).toBe('indicative')
      expect(f.tense).toBe('pres')
      expect(allowedCombos.has('indicative|pres')).toBe(true)
    }
  })

  it('Por tema: bypass de curriculum pero mantiene dialecto', async () => {
    for (const region of REGIONS) {
      const forms = await buildRegionForms(region)
      const settings = {
        level: 'A2',
        region,
        practiceMode: 'specific',
        cameFromTema: true,
        specificMood: 'indicative'
      }
      const out = gateFormsByCurriculumAndDialect(forms, settings)
      // Dialecto válido
      const allowedPersons = getAllowedPersonsForRegion(region)
      for (const f of out) {
        if (f.mood !== 'nonfinite') {
          expect(allowedPersons.has(f.person)).toBe(true)
        }
      }
    }
  })
})
