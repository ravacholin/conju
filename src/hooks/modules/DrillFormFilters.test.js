import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('../../lib/core/verbDataService.js', () => ({
  getFormsForRegion: vi.fn()
}))

import {
  generateAllFormsForRegion,
  clearFormsCache,
  filterForSpecificPractice,
  applyComprehensiveFiltering,
  getFilteringDiagnostics,
  FILTER_DISCARD_REASONS
} from './DrillFormFilters.js'
import { getFormsForRegion } from '../../lib/core/verbDataService.js'
import { createFormsCombinationIndex } from './formsPoolService.js'
import { VERB_LOOKUP_MAP } from '../../lib/core/optimizedCache.js'

describe('DrillFormFilters - global pool', () => {
  const sharedForm = {
    lemma: 'comer',
    mood: 'indicative',
    tense: 'pres',
    person: '1s',
    value: 'como'
  }
  const rioplatenseOnly = {
    lemma: 'hablar',
    mood: 'indicative',
    tense: 'pres',
    person: '2s_vos',
    value: 'hablás'
  }
  const peninsularOnly = {
    lemma: 'hablar',
    mood: 'indicative',
    tense: 'pres',
    person: '2p_vosotros',
    value: 'habláis'
  }
  const laGeneralOnly = {
    lemma: 'hablar',
    mood: 'indicative',
    tense: 'pres',
    person: '2p_ustedes',
    value: 'hablan'
  }

  beforeEach(() => {
    clearFormsCache()
    vi.clearAllMocks()
    getFormsForRegion.mockImplementation(async region => {
      if (region === 'rioplatense') {
        return [sharedForm, rioplatenseOnly]
      }
      if (region === 'peninsular') {
        return [sharedForm, peninsularOnly]
      }
      if (region === 'la_general') {
        return [sharedForm, laGeneralOnly]
      }
      return []
    })
  })

  it('incluye formas exclusivas de la_general en el pool global', async () => {
    const forms = await generateAllFormsForRegion('global', {})

    expect(getFormsForRegion).toHaveBeenCalledWith('la_general', {})
    expect(forms).toEqual(
      expect.arrayContaining([
        expect.objectContaining(laGeneralOnly)
      ])
    )
  })
})

describe('DrillFormFilters - specific practice indexing', () => {
  beforeEach(() => {
    clearFormsCache()
  })

  it('filters a specific mood/tense without scanning every call', () => {
    const forms = [
      { lemma: 'hablar', mood: 'indicative', tense: 'pres', person: '1s', value: 'hablo' },
      { lemma: 'hablar', mood: 'indicative', tense: 'pretIndef', person: '1s', value: 'hable' },
      { lemma: 'comer', mood: 'subjunctive', tense: 'subjPres', person: '1s', value: 'coma' }
    ]

    const specificConstraints = {
      isSpecific: true,
      specificMood: 'indicative',
      specificTense: 'pres'
    }

    const result = filterForSpecificPractice(forms, specificConstraints)

    expect(result).toHaveLength(1)
    expect(result[0].tense).toBe('pres')
    expect(result[0].mood).toBe('indicative')
  })

  it('supports mixed imperative specific filtering', () => {
    const forms = [
      { lemma: 'hablar', mood: 'imperative', tense: 'impAff', person: '2s_tu', value: 'habla' },
      { lemma: 'hablar', mood: 'imperative', tense: 'impNeg', person: '2s_tu', value: 'no hables' },
      { lemma: 'hablar', mood: 'indicative', tense: 'pres', person: '1s', value: 'hablo' }
    ]

    const specificConstraints = {
      isSpecific: true,
      specificMood: 'imperative',
      specificTense: 'impMixed'
    }

    const result = filterForSpecificPractice(forms, specificConstraints)
    const tenses = new Set(result.map((item) => item.tense))

    expect(result).toHaveLength(2)
    expect(tenses.has('impAff')).toBe(true)
    expect(tenses.has('impNeg')).toBe(true)
  })

  it('filters by specific person when provided', () => {
    const forms = [
      { lemma: 'hablar', mood: 'indicative', tense: 'pres', person: '1s', value: 'hablo' },
      { lemma: 'hablar', mood: 'indicative', tense: 'pres', person: '2s_tu', value: 'hablas' }
    ]

    const specificConstraints = {
      isSpecific: true,
      specificMood: 'indicative',
      specificTense: 'pres',
      specificPerson: '2s_tu'
    }

    const result = filterForSpecificPractice(forms, specificConstraints)

    expect(result).toHaveLength(1)
    expect(result[0].person).toBe('2s_tu')
  })

  it('prioritizes region-aware buckets when index contains multiple regions', () => {
    const forms = [
      { lemma: 'hablar', mood: 'indicative', tense: 'pres', person: '2s_tu', value: 'hablas', region: 'la_general' },
      { lemma: 'hablar', mood: 'indicative', tense: 'pres', person: '2s_tu', value: 'hablas', region: 'peninsular' },
      { lemma: 'hablar', mood: 'indicative', tense: 'pres', person: '2s_vos', value: 'hablás', region: 'rioplatense' }
    ]
    const index = createFormsCombinationIndex(forms)
    const specificConstraints = {
      isSpecific: true,
      specificMood: 'indicative',
      specificTense: 'pres',
      specificPerson: '2s_tu'
    }

    const result = filterForSpecificPractice(forms, specificConstraints, index, 'la_general')

    expect(result).toHaveLength(1)
    expect(result[0].region).toBe('la_general')
  })
})

describe('DrillFormFilters - irregular family filtering', () => {
  // lemmaFamiliesCache is module level and only clearFormsCache() resets it.
  beforeEach(() => {
    clearFormsCache()
  })

  // pensar/entender are DIPHT_E_IE; poder/contar are DIPHT_O_UE
  const forms = [
    { lemma: 'pensar', mood: 'indicative', tense: 'pres', person: '1s', value: 'pienso' },
    { lemma: 'entender', mood: 'indicative', tense: 'pres', person: '1s', value: 'entiendo' },
    { lemma: 'poder', mood: 'indicative', tense: 'pres', person: '1s', value: 'puedo' },
    { lemma: 'contar', mood: 'indicative', tense: 'pres', person: '1s', value: 'cuento' }
  ]

  const baseSettings = {
    region: 'la_general',
    verbType: 'irregular',
    selectedFamily: 'DIPHT_E_IE',
    practicePronoun: 'all',
    level: 'ALL'
  }

  // This pass builds eligibleForms, and hierarchicalSelection often picks
  // straight out of it (SRS / adaptive) without ever reaching the generator.
  // Gating the family stage on practiceMode 'theme' therefore made a family
  // chosen from "por nivel" or "todo mezclado" silently inert.
  it.each([
    ['theme', 'theme'],
    ['specific', 'specific'],
    ['mixed', 'mixed']
  ])('keeps only the selected family in %s practice', (_label, practiceMode) => {
    const result = applyComprehensiveFiltering(forms, { ...baseSettings, practiceMode })

    expect(result.map(f => f.lemma).sort()).toEqual(['entender', 'pensar'])
  })

  it('runs the family stage instead of skipping it', () => {
    const { stages } = getFilteringDiagnostics(forms, { ...baseSettings, practiceMode: 'specific' })
    const familyStage = stages.find(stage => stage.id === 'family')

    expect(familyStage).toMatchObject({
      reason: FILTER_DISCARD_REASONS.FAMILY,
      skipped: false,
      dropped: 2
    })
  })

  it('skips the family stage when no family is selected', () => {
    const settings = { ...baseSettings, practiceMode: 'specific', selectedFamily: null }
    const { filtered, stages } = getFilteringDiagnostics(forms, settings)

    expect(stages.find(stage => stage.id === 'family')).toMatchObject({ skipped: true })
    expect(filtered).toHaveLength(4)
  })

  it('skips the family stage when the verb type is not irregular', () => {
    // QuickSwitchPanel can leave a stale family behind when the verb type
    // changes; the family must not narrow a regular-verb pool.
    const settings = { ...baseSettings, practiceMode: 'specific', verbType: 'all' }
    const { stages } = getFilteringDiagnostics(forms, settings)

    expect(stages.find(stage => stage.id === 'family')).toMatchObject({ skipped: true })
  })

  it('filters by family even when VERB_LOOKUP_MAP is empty', () => {
    // This pass runs before initializeMaps() fills VERB_LOOKUP_MAP. A lookup
    // miss used to be memoized as "no families" for the rest of the session,
    // which disabled family filtering everywhere — including theme practice.
    VERB_LOOKUP_MAP.clear()

    const result = applyComprehensiveFiltering(forms, { ...baseSettings, practiceMode: 'theme' })

    expect(result.map(f => f.lemma).sort()).toEqual(['entender', 'pensar'])
  })

  it('reports the family as the empty reason when it matches nothing', () => {
    const settings = { ...baseSettings, practiceMode: 'specific', selectedFamily: 'PRET_UV' }
    const { filtered, emptyReason } = getFilteringDiagnostics(forms, settings)

    expect(filtered).toHaveLength(0)
    expect(emptyReason).toBe(FILTER_DISCARD_REASONS.FAMILY)
  })
})

describe('DrillFormFilters - filtering diagnostics', () => {
  it('reports standardized empty reason when specific practice removes all forms', () => {
    const forms = [
      { lemma: 'hablar', mood: 'indicative', tense: 'pres', person: '1s', value: 'hablo' }
    ]
    const settings = {
      region: 'la_general',
      verbType: 'all',
      selectedFamily: null,
      practiceMode: 'specific',
      practicePronoun: 'all',
      level: 'ALL'
    }
    const specificConstraints = {
      isSpecific: true,
      specificMood: 'subjunctive',
      specificTense: 'subjPres'
    }

    const result = getFilteringDiagnostics(forms, settings, specificConstraints)

    expect(result.filtered).toHaveLength(0)
    expect(result.emptyReason).toBe(FILTER_DISCARD_REASONS.SPECIFIC_PRACTICE)
    expect(result.stages[0]).toMatchObject({
      id: 'specific_practice',
      reason: FILTER_DISCARD_REASONS.SPECIFIC_PRACTICE,
      before: 1,
      after: 0,
      dropped: 1,
      skipped: false
    })
  })
})

describe('DrillFormFilters - progress micro-drill blocks (currentBlock.combos)', () => {
  // Regression for the "Practicar esto always drills presente regular" bug that
  // PR #205 only half-fixed. #205 taught the generator's own cache (chooseNext) to
  // honor the ad-hoc block, but this pre-filter — which builds the eligible pool the
  // SRS "due" shortcut samples directly — still ignored the block, so the shortcut
  // kept serving due presente items during a targeted micro-drill.
  const forms = [
    { lemma: 'hablar', mood: 'indicative', tense: 'pres', person: '1s', value: 'hablo' },
    { lemma: 'comer', mood: 'indicative', tense: 'pres', person: '3s', value: 'come' },
    { lemma: 'hablar', mood: 'indicative', tense: 'impf', person: '1s', value: 'hablaba' },
    { lemma: 'comer', mood: 'subjunctive', tense: 'subjPres', person: '1s', value: 'coma' }
  ]
  const baseSettings = {
    region: 'la_general',
    verbType: 'all',
    selectedFamily: null,
    practiceMode: 'mixed',
    practicePronoun: 'all',
    level: 'B1'
  }

  it('narrows the eligible pool to the block combos in mixed mode', () => {
    const settings = {
      ...baseSettings,
      currentBlock: { combos: [{ mood: 'indicative', tense: 'impf' }], itemsRemaining: 8 }
    }

    const { filtered } = getFilteringDiagnostics(forms, settings)

    expect(filtered.length).toBeGreaterThan(0)
    expect(filtered.every(f => f.mood === 'indicative' && f.tense === 'impf')).toBe(true)
    expect(filtered.some(f => f.tense === 'pres')).toBe(false)
  })

  it('does not narrow when there is no block (normal mixed practice)', () => {
    const { filtered } = getFilteringDiagnostics(forms, { ...baseSettings, currentBlock: null })

    // Present indicative is level-appropriate for B1, so it must survive.
    expect(filtered.some(f => f.mood === 'indicative' && f.tense === 'pres')).toBe(true)
  })
})
