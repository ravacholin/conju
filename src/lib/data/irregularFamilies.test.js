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

  it('categorizeVerb classifies oír in hiato and gerund families without PRET_J', () => {
    const families = categorizeVerb('oír')
    expect(families).toContain('HIATUS_Y')
    expect(families).toContain('IRREG_GERUNDS')
    expect(families).not.toContain('PRET_J')
  })
})


describe('categorizeVerb linguistic accuracy', () => {
  it.each([
    'conocer', 'ofrecer', 'agradecer', 'merecer', 'reconocer', 'pertenecer', 'reducir', 'lucir'
  ])('%s (vowel + -cer/-cir) is -zco, never -zo', (lemma) => {
    const families = categorizeVerb(lemma)
    expect(families).toContain('ZCO_VERBS')
    expect(families).not.toContain('ZO_VERBS')
  })

  it.each(['vencer', 'ejercer', 'torcer', 'convencer', 'esparcir', 'cocer', 'mecer'])(
    '%s is -zo, never -zco', (lemma) => {
      const families = categorizeVerb(lemma)
      expect(families).toContain('ZO_VERBS')
      expect(families).not.toContain('ZCO_VERBS')
    }
  )

  it.each(['hacer', 'deshacer', 'satisfacer', 'decir', 'bendecir'])(
    '%s makes its yo form in -go, so it is neither -zco nor -zo', (lemma) => {
      const families = categorizeVerb(lemma)
      expect(families).not.toContain('ZCO_VERBS')
      expect(families).not.toContain('ZO_VERBS')
    }
  )

  it.each(['reducir', 'introducir', 'deducir', 'seducir', 'reproducir'])(
    '%s has a strong preterite in -j-', (lemma) => {
      expect(categorizeVerb(lemma)).toContain('PRET_J')
    }
  )

  it('only jugar diphthongs u→ue', () => {
    expect(categorizeVerb('jugar')).toContain('DIPHT_U_UE')
    for (const lemma of ['graduar', 'situar', 'adecuar', 'evacuar', 'aguar', 'fraguar', 'menguar', 'averiguar']) {
      expect(categorizeVerb(lemma), lemma).not.toContain('DIPHT_U_UE')
    }
    expect(IRREGULAR_FAMILIES.DIPHT_U_UE.examples).toEqual(['jugar'])
  })

  it('keeps ñ/ll verbs out of o→u (gruñó, bulló lose an i, not an o)', () => {
    for (const lemma of ['gruñir', 'bullir', 'engullir', 'zambullir', 'tañir', 'reñir', 'teñir', 'ceñir']) {
      expect(categorizeVerb(lemma), lemma).not.toContain('O_U_GER_IR')
    }
    expect(categorizeVerb('dormir')).toContain('O_U_GER_IR')
    expect(categorizeVerb('podrir')).toContain('O_U_GER_IR')
  })

  it('does not put regular or differently irregular verbs in strong-preterite families', () => {
    expect(categorizeVerb('deber')).toEqual([])
    expect(categorizeVerb('caer')).not.toContain('PRET_J')
    expect(categorizeVerb('estar')).not.toContain('PRET_SUPPL')
    expect(categorizeVerb('haber')).not.toContain('PRET_SUPPL')
    expect(categorizeVerb('argüir')).not.toContain('GU_DROP')
  })

  it('does not list verbs with a regular tú imperative as irregular imperatives', () => {
    expect(categorizeVerb('saber')).not.toContain('IMPERATIVE_IRREG')
    expect(categorizeVerb('haber')).not.toContain('IMPERATIVE_IRREG')
    expect(IRREGULAR_FAMILIES.IMPERATIVE_IRREG.examples).not.toContain('saber')
  })

  it('lists only monosyllabic infinitives as monosyllabic irregulars', () => {
    expect(IRREGULAR_FAMILIES.MONOSYLLABIC_IRREG.examples).toEqual(['ir', 'ser', 'dar', 'ver'])
  })
})
