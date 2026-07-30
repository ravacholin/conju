import { describe, it, expect } from 'vitest'
import { getTopicSearchIndex, TOPIC_KINDS } from './topicSearchIndex.js'
import { getFamiliesForTense } from '../data/irregularFamilies.js'
import { getSimplifiedGroupsForTense } from '../data/simplifiedFamilyGroups.js'

const index = getTopicSearchIndex()

// Mirrors createDefaultSettings() in src/state/settings.js. The store's
// sanitizer drops unknown keys silently, so this list is the contract.
const SETTINGS_KEYS = new Set([
  'practiceMode', 'cameFromTema', 'level', 'specificMood', 'specificTense',
  'verbType', 'selectedFamily', 'allowedLemmas', 'strict', 'accentTolerance',
  'requireDieresis', 'blockNonNormativeSpelling', 'cliticStrictness',
  'impSubjVariantMode', 'cliticsPercent', 'neutralizePronoun',
  'rotateSecondPerson', 'timeMode', 'perItemMs', 'medianTargetMs',
  'showPronouns', 'practicePronoun', 'enableFuturoSubjRead',
  'enableFuturoSubjProd', 'enableC2Conmutacion', 'burstSize',
  'c2RareBoostLemmas', 'region', 'useTuteo', 'useVoseo', 'useVosotros'
])

describe('topic search index', () => {
  it('is non-empty and has unique ids', () => {
    expect(index.length).toBeGreaterThan(100)
    expect(new Set(index.map(e => e.id)).size).toBe(index.length)
  })

  it('gives every entry the fields the menu renders', () => {
    index.forEach(entry => {
      expect(entry.label, entry.id).toBeTruthy()
      expect(entry.focal, entry.id).toBeTruthy()
      expect(entry.tag, entry.id).toBeTruthy()
      expect(entry.gloss, entry.id).toBeTruthy()
      expect(entry.keywords.length, entry.id).toBeGreaterThan(0)
      expect(entry.haystack, entry.id).toContain(entry.foldedLabel)
    })
  })

  it('folds labels and keywords (no accents, no uppercase)', () => {
    index.forEach(entry => {
      expect(entry.haystack, entry.id).toBe(entry.haystack.toLowerCase())
      expect(entry.haystack, entry.id).not.toMatch(/[áéíóúñü]/)
    })
  })

  it('keeps focal words short enough for the focal panel', () => {
    index.forEach(entry => {
      expect(entry.focal.length, `${entry.id} → "${entry.focal}"`).toBeLessThanOrEqual(28)
    })
  })

  describe('payloads', () => {
    const drillEntries = index.filter(e => e.kind !== TOPIC_KINDS.SECTION)

    it('only uses keys the settings store accepts', () => {
      drillEntries.forEach(entry => {
        Object.keys(entry.payload).forEach(key => {
          expect(SETTINGS_KEYS.has(key), `${entry.id} → unknown settings key "${key}"`).toBe(true)
        })
      })
    })

    it('always sets both mood and tense for topic entries', () => {
      index
        .filter(e => e.kind === TOPIC_KINDS.TENSE || e.kind === TOPIC_KINDS.VERB_TYPE || e.kind === TOPIC_KINDS.FAMILY)
        .forEach(entry => {
          // buildSpecificConstraints only narrows when BOTH are set; a
          // mood-only payload would silently drill everything.
          expect(entry.payload.specificMood, entry.id).toBeTruthy()
          expect(entry.payload.specificTense, entry.id).toBeTruthy()
          expect(entry.payload.practiceMode, entry.id).toBe('theme')
          expect(entry.payload.cameFromTema, entry.id).toBe(true)
          expect(entry.payload.allowedLemmas, entry.id).toBeNull()
        })
    })

    it('pairs every family with a tense it actually affects', () => {
      index
        .filter(e => e.kind === TOPIC_KINDS.FAMILY)
        .forEach(entry => {
          const { specificTense, selectedFamily, verbType } = entry.payload
          // The family filter only runs for practiceMode 'theme' AND requires
          // verbType 'irregular' for the pedagogical preterite branch.
          expect(verbType, entry.id).toBe('irregular')
          const valid = [
            ...(getSimplifiedGroupsForTense(specificTense) || []),
            ...(getFamiliesForTense(specificTense) || [])
          ].map(f => f.id)
          expect(valid, entry.id).toContain(selectedFamily)
        })
    })

    it('keeps the level gate on for level entries', () => {
      index
        .filter(e => e.kind === TOPIC_KINDS.LEVEL)
        .forEach(entry => {
          expect(entry.payload.practiceMode, entry.id).toBe('mixed')
          expect(entry.payload.cameFromTema, entry.id).toBe(false)
          expect(entry.payload.level, entry.id).toMatch(/^[ABC][12]$/)
          expect(entry.payload.specificMood, entry.id).toBeNull()
        })
    })

    it('gives section entries a navigation id and no settings payload', () => {
      const sections = index.filter(e => e.kind === TOPIC_KINDS.SECTION)
      expect(sections.length).toBe(3)
      sections.forEach(entry => {
        expect(entry.payload, entry.id).toBeNull()
        expect(entry.sectionId, entry.id).toBeTruthy()
      })
    })
  })
})
