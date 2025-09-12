import { describe, it, expect } from 'vitest'
import {
  IRREGULAR_FAMILIES,
  getFamiliesForTense,
  getFamiliesForMood,
  getAllFamilies,
  getFamilyById,
  categorizeVerb,
} from './irregularFamilies.js'

describe('irregularFamilies data helpers', () => {
  it('getFamiliesForTense returns present-related families and omits DOUBLE_PARTICIPLES', () => {
    const families = getFamiliesForTense('pres')
    const ids = families.map(f => f.id)
    expect(ids).toContain('DIPHT_E_IE')
    expect(ids).not.toContain('DOUBLE_PARTICIPLES')
  })

  it('getFamiliesForMood returns families covering relevant tenses for indicative', () => {
    const families = getFamiliesForMood('indicative')
    const ids = families.map(f => f.id)
    // PRET_UV has pretIndef which belongs to indicative set
    expect(ids).toContain('PRET_UV')
  })

  it('getAllFamilies reflects the registry', () => {
    const all = getAllFamilies()
    expect(all.length).toBeGreaterThan(0)
    // sanity: at least as many as keys in registry
    expect(all.length).toBe(Object.keys(IRREGULAR_FAMILIES).length)
  })

  it('getFamilyById returns a known family', () => {
    const fam = getFamilyById('DIPHT_E_IE')
    expect(fam).toBeTruthy()
    expect(fam?.name).toMatch(/Diptongación/i)
  })

  it('categorizeVerb identifies common patterns', () => {
    expect(categorizeVerb('buscar')).toContain('ORTH_CAR')
    expect(categorizeVerb('conocer')).toContain('ZCO_VERBS')
    expect(categorizeVerb('vencer')).toContain('ZO_VERBS')
    expect(categorizeVerb('seguir')).toContain('GU_DROP')
    // -uir verbs (non -guir)
    expect(categorizeVerb('construir')).toContain('UIR_Y')
  })
})

