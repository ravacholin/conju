import { describe, it, expect } from 'vitest'
import {
  SIMPLIFIED_GROUPS,
  getSimplifiedGroupForVerb,
  getSimplifiedGroupsForTense,
  getSimplifiedGroupsForMood,
  expandSimplifiedGroup,
  shouldUseSimplifiedGrouping,
  shouldUseSimplifiedGroupingForMood,
  getAllSimplifiedGroups,
  getSimplifiedGroupById,
} from './simplifiedFamilyGroups.js'

describe('simplifiedFamilyGroups helpers', () => {
  it('getSimplifiedGroupForVerb returns STEM_CHANGES for present diptongos', () => {
    const group = getSimplifiedGroupForVerb(['DIPHT_E_IE'], 'pres')
    expect(group).toBe('STEM_CHANGES')
  })

  it('prioritizes strong pretérito group over third-person irregulars', () => {
    const group = getSimplifiedGroupForVerb(['PRET_J', 'E_I_IR'], 'pretIndef')
    expect(group).toBe('PRETERITE_STRONG_STEM')
  })

  it('getSimplifiedGroupsForTense returns relevant groups for present', () => {
    const groups = getSimplifiedGroupsForTense('pres')
    const ids = groups.map(g => g.id)
    expect(ids).toContain('STEM_CHANGES')
    expect(ids).toContain('FIRST_PERSON_IRREGULAR')
  })

  it('getSimplifiedGroupsForMood returns groups across relevant tenses', () => {
    const groups = getSimplifiedGroupsForMood('indicative')
    const ids = groups.map(g => g.id)
    expect(ids).toContain('STEM_CHANGES')
    expect(ids).toContain('PRETERITE_STRONG_STEM')
  })

  it('expandSimplifiedGroup lists technical families', () => {
    const fams = expandSimplifiedGroup('FIRST_PERSON_IRREGULAR')
    expect(fams).toContain('G_VERBS')
  })

  it('shouldUseSimplifiedGrouping is false for non-supported tenses', () => {
    expect(shouldUseSimplifiedGrouping('ger')).toBe(false)
  })

  it('shouldUseSimplifiedGroupingForMood true only for indicative/subjunctive', () => {
    expect(shouldUseSimplifiedGroupingForMood('indicative')).toBe(true)
    expect(shouldUseSimplifiedGroupingForMood('subjunctive')).toBe(true)
    expect(shouldUseSimplifiedGroupingForMood('imperative')).toBe(false)
  })

  it('getAllSimplifiedGroups returns all groups and byId fetches one', () => {
    const all = getAllSimplifiedGroups()
    expect(all.length).toBe(Object.values(SIMPLIFIED_GROUPS).length)
    const one = getSimplifiedGroupById('STEM_CHANGES')
    expect(one).toBeTruthy()
  })
})

