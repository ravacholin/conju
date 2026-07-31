import { MOOD_TENSES, getMoodLabel, getTenseLabel } from '../utils/verbLabels.js'
import { getFirstLevelForCombo } from '../core/curriculumGate.js'
import { getFamiliesForTense } from '../data/irregularFamilies.js'
import { getSimplifiedGroupsForTense } from '../data/simplifiedFamilyGroups.js'
import { foldForSearch } from './searchText.js'
import {
  MOOD_ALIASES,
  TENSE_ALIASES,
  VERB_TYPE_ALIASES,
  LEVEL_ALIASES,
  SECTION_ENTRIES
} from './searchAliases.js'
import { buildTopicPayload, buildLevelPayload } from './searchPayloads.js'

/**
 * Flat, searchable index of everything the main menu can take you to.
 *
 * Built lazily and memoised at module scope: the menu asks for it inside a
 * useMemo, so it costs nothing until someone opens the menu and nothing again
 * after that.
 */

export const TOPIC_KINDS = Object.freeze({
  TENSE: 'tense',
  VERB_TYPE: 'verbType',
  FAMILY: 'family',
  LEVEL: 'level',
  SECTION: 'section'
})

// Menu-style labels. formatMoodTense() produces awkward duplicates for
// conditional and nonfinite ("Condicional (Condicional)"), so the display
// strings are spelled out here.
const TENSE_LABEL = {
  pres: 'presente',
  pretPerf: 'pretérito perfecto',
  pretIndef: 'pretérito indefinido',
  impf: 'pretérito imperfecto',
  plusc: 'pluscuamperfecto',
  fut: 'futuro simple',
  futPerf: 'futuro compuesto',
  subjPres: 'presente de subjuntivo',
  subjImpf: 'imperfecto de subjuntivo',
  subjPerf: 'perfecto de subjuntivo',
  subjPlusc: 'pluscuamperfecto de subjuntivo',
  impAff: 'imperativo afirmativo',
  impNeg: 'imperativo negativo',
  impMixed: 'imperativo mixto',
  cond: 'condicional simple',
  condPerf: 'condicional compuesto',
  ger: 'gerundio',
  part: 'participio',
  nonfiniteMixed: 'formas no finitas mixtas'
}

// Short word for the giant focal panel — the mood already shows in the tag.
const TENSE_FOCAL = {
  pres: 'presente',
  pretPerf: 'pretérito perfecto',
  pretIndef: 'indefinido',
  impf: 'imperfecto',
  plusc: 'pluscuamperfecto',
  fut: 'futuro',
  futPerf: 'futuro compuesto',
  subjPres: 'presente',
  subjImpf: 'imperfecto',
  subjPerf: 'perfecto',
  subjPlusc: 'pluscuamperfecto',
  impAff: 'afirmativo',
  impNeg: 'negativo',
  impMixed: 'mixto',
  cond: 'condicional',
  condPerf: 'condicional compuesto',
  ger: 'gerundio',
  part: 'participio',
  nonfiniteMixed: 'no finitas'
}

// Dialect-neutral sample forms of *hablar*.
const TENSE_EXAMPLE = {
  pres: 'yo hablo',
  pretPerf: 'he hablado',
  pretIndef: 'yo hablé',
  impf: 'yo hablaba',
  plusc: 'había hablado',
  fut: 'yo hablaré',
  futPerf: 'habré hablado',
  subjPres: 'que yo hable',
  subjImpf: 'si yo hablara',
  subjPerf: 'haya hablado',
  subjPlusc: 'hubiera hablado',
  impAff: 'hablá · habla',
  impNeg: 'no hables',
  impMixed: 'hablá · no hables',
  cond: 'yo hablaría',
  condPerf: 'habría hablado',
  ger: 'hablando',
  part: 'hablado',
  nonfiniteMixed: 'hablando · hablado'
}

const MOOD_TAG = {
  indicative: 'IND',
  subjunctive: 'SUBJ',
  imperative: 'IMP',
  conditional: 'COND',
  nonfinite: 'NF'
}

const LEVEL_GLOSS = {
  A1: 'presente y poco más',
  A2: 'pasados y futuro',
  B1: 'perfectos y subjuntivo',
  B2: 'subjuntivo imperfecto',
  C1: 'más exigencia, no más tiempos',
  C2: 'máxima exigencia, no más tiempos'
}

const uniq = (values) => Array.from(new Set(values.filter(Boolean)))

/**
 * Suffix that marks the broad, unfiltered variant of a tense — the drill that
 * mixes regular and irregular verbs. Without it the row reads as a bare tense
 * name sitting above "· regulares" and "· irregulares", and nobody guesses it
 * is the "both" option.
 *
 * Deliberately does NOT contain the word "irregulares": the label feeds the
 * ranker, so a literal "regulares e irregulares" would make this entry beat
 * `verbType:*:irregular` on a query like "participio irregulares".
 */
const MIXED_SUFFIX = 'todos los verbos'

// Words a learner types when they mean "don't filter by verb type".
const MIXED_KEYWORDS = [
  ...VERB_TYPE_ALIASES.all,
  'mezclado',
  'mezclados',
  'mezcla',
  'ambos',
  'ambas',
  'completo',
  'todos los verbos'
]

const MAX_FOCAL_LENGTH = 28

/**
 * The focal panel renders its word at up to 180px, so long family names blow
 * up the layout. Drop the trailing parenthetical qualifier first (it is always
 * a technical aside), then clip on a word boundary.
 */
function shortenFocal(name) {
  const withoutQualifier = name.replace(/\s*\([^)]*\)\s*$/, '').trim() || name.trim()
  if (withoutQualifier.length <= MAX_FOCAL_LENGTH) return withoutQualifier
  const clipped = withoutQualifier.slice(0, MAX_FOCAL_LENGTH)
  const lastSpace = clipped.lastIndexOf(' ')
  return (lastSpace > 8 ? clipped.slice(0, lastSpace) : clipped).trim()
}

/**
 * Fold once at build time so matching never re-normalises the index.
 *
 * `matchLabel` lets an entry be scored on a shorter label than the one it
 * displays. It must be a **prefix** of `label`: computeHighlightRanges() maps
 * offsets from foldedLabel straight onto label, and foldForSearch is
 * length-preserving, so a prefix keeps every range aligned. It exists so the
 * mixed-verb-type suffix can be added for the reader without demoting the entry
 * from an exact-label match to a prefix match (and without the label-length
 * penalty) — the broad entry has to stay above its own narrowed variants.
 */
function finalize(entry) {
  const keywords = uniq(entry.keywords.map(foldForSearch))
  const matchLabel = entry.matchLabel || entry.label
  if (!entry.label.startsWith(matchLabel)) {
    throw new Error(`matchLabel must be a prefix of label (${entry.id})`)
  }
  return {
    ...entry,
    matchLabel,
    focal: entry.focal || entry.label,
    keywords,
    foldedLabel: foldForSearch(matchLabel),
    haystack: `${foldForSearch(entry.label)} ${keywords.join(' ')}`
  }
}

function tenseKeywords(mood, tense) {
  return [
    TENSE_LABEL[tense],
    getTenseLabel(tense),
    getMoodLabel(mood),
    ...(TENSE_ALIASES[tense] || []),
    ...(MOOD_ALIASES[mood] || [])
  ]
}

/**
 * Tenses whose "irregulares" variant has no forms at all and must not be
 * offered. Empty today: the compound tenses used to look empty only because
 * the forms pool dropped every verb carrying a spurious `region` tag, so their
 * irregular participles (había hecho, habré dicho…) never reached the filter.
 * topicSearchIndex.integrity.test.js asserts this list is exactly right, in
 * both directions.
 */
export const TENSES_WITHOUT_IRREGULARS = Object.freeze([])

/** A tense only gets a "mixed" reading when both verb types actually exist. */
export function tenseHasBothVerbTypes(tense) {
  return !TENSES_WITHOUT_IRREGULARS.includes(tense)
}

/**
 * One entry per mood+tense, with no verb-type filter (`verbType: 'all'`).
 *
 * This is the row that mixes regular and irregular verbs. It is labelled as
 * such whenever the tense has both, so it sits alongside its "· regulares" and
 * "· irregulares" siblings as an obvious third choice rather than looking like
 * a heading for them.
 */
function buildTenseEntries() {
  const entries = []
  Object.entries(MOOD_TENSES).forEach(([mood, tenses]) => {
    tenses.forEach(tense => {
      const level = getFirstLevelForCombo(mood, tense)
      const mixed = tenseHasBothVerbTypes(tense)
      const moodLabel = getMoodLabel(mood).toLowerCase()
      entries.push(finalize({
        id: `tense:${mood}:${tense}`,
        kind: TOPIC_KINDS.TENSE,
        label: mixed ? `${TENSE_LABEL[tense]} · ${MIXED_SUFFIX}` : TENSE_LABEL[tense],
        matchLabel: TENSE_LABEL[tense],
        focal: TENSE_FOCAL[tense],
        tag: level || MOOD_TAG[mood],
        gloss: mixed ? `${moodLabel} · regulares e irregulares` : moodLabel,
        ex: TENSE_EXAMPLE[tense],
        level,
        keywords: [
          ...tenseKeywords(mood, tense),
          ...(level ? LEVEL_ALIASES[level] : []),
          ...(mixed ? MIXED_KEYWORDS : [])
        ],
        payload: buildTopicPayload({ mood, tense })
      }))
    })
  })
  return entries
}

/**
 * Families whose irregularity is purely orthographic — a tilde (envío,
 * continúo, prohíbo) or a diéresis (averigüé). The verb-type filter compares
 * against the regular paradigm accent-insensitively, so it classifies those
 * forms as regular and an "irregulares" drill for them has an empty pool.
 * Offering them would drop the user into an emergency fallback.
 * Keyed `${tense}:${familyId}`, and asserted in both directions by
 * topicSearchIndex.integrity.test.js.
 */
export const FAMILIES_WITHOUT_IRREGULAR_FORMS = Object.freeze([
  'pres:IAR_VERBS',
  'pres:UAR_VERBS',
  'pres:ACCENT_CHANGES',
  'pretIndef:ORTH_GUAR',
  'subjPres:IAR_VERBS',
  'subjPres:UAR_VERBS',
  'subjPres:ORTH_GUAR'
])

function buildVerbTypeEntries() {
  const entries = []
  Object.entries(MOOD_TENSES).forEach(([mood, tenses]) => {
    tenses.forEach(tense => {
      const level = getFirstLevelForCombo(mood, tense)
      const verbTypes = tenseHasBothVerbTypes(tense)
        ? ['regular', 'irregular']
        : ['regular']
      ;verbTypes.forEach(verbType => {
        const suffix = verbType === 'regular' ? 'regulares' : 'irregulares'
        entries.push(finalize({
          id: `verbType:${mood}:${tense}:${verbType}`,
          kind: TOPIC_KINDS.VERB_TYPE,
          label: `${TENSE_LABEL[tense]} · ${suffix}`,
          focal: TENSE_FOCAL[tense],
          tag: suffix.toUpperCase(),
          gloss: `${getMoodLabel(mood).toLowerCase()} · ${suffix}`,
          ex: TENSE_EXAMPLE[tense],
          level,
          keywords: [...tenseKeywords(mood, tense), ...VERB_TYPE_ALIASES[verbType]],
          payload: buildTopicPayload({ mood, tense, verbType })
        }))
      })
    })
  })
  return entries
}

function buildFamilyEntries() {
  const entries = []
  Object.entries(MOOD_TENSES).forEach(([mood, tenses]) => {
    tenses.forEach(tense => {
      const level = getFirstLevelForCombo(mood, tense)
      // Simplified groups are the learner-facing grouping and are ranked above
      // the technical families; getFamiliesForTense() is used rather than
      // IRREGULAR_FAMILIES because it hides families meant to stay out of menus.
      const groups = (getSimplifiedGroupsForTense(tense) || []).map(g => ({
        id: g.id,
        name: g.name,
        blurb: g.explanation || g.description || '',
        ex: g.description || (g.exampleVerbs || []).join(' · '),
        simplified: true
      }))
      const families = (getFamiliesForTense(tense) || []).map(f => ({
        id: f.id,
        name: f.name,
        blurb: f.description || '',
        ex: (f.examples || []).slice(0, 4).join(' · ') || f.description || '',
        simplified: false
      }))

      ;[...groups, ...families].forEach(family => {
        if (FAMILIES_WITHOUT_IRREGULAR_FORMS.includes(`${tense}:${family.id}`)) return
        entries.push(finalize({
          id: `family:${mood}:${tense}:${family.id}`,
          kind: TOPIC_KINDS.FAMILY,
          label: `${family.name.toLowerCase()} · ${TENSE_LABEL[tense]}`,
          focal: shortenFocal(family.name.toLowerCase()),
          tag: family.simplified ? 'GRUPO' : 'FAMILIA',
          gloss: `${TENSE_LABEL[tense]} · irregulares`,
          ex: family.ex,
          level,
          simplified: family.simplified,
          keywords: [
            family.name,
            family.blurb,
            family.ex,
            ...tenseKeywords(mood, tense),
            ...VERB_TYPE_ALIASES.irregular
          ],
          payload: buildTopicPayload({
            mood,
            tense,
            verbType: 'irregular',
            selectedFamily: family.id
          })
        }))
      })
    })
  })
  return entries
}

function buildLevelEntries() {
  return Object.keys(LEVEL_ALIASES).map(level => finalize({
    id: `level:${level}`,
    kind: TOPIC_KINDS.LEVEL,
    label: `nivel ${level.toLowerCase()} · todo mezclado`,
    focal: level.toLowerCase(),
    tag: 'NIVEL',
    gloss: LEVEL_GLOSS[level],
    ex: 'práctica mixta del nivel',
    level,
    keywords: [`nivel ${level}`, 'nivel', 'mezclado', 'mixto', ...LEVEL_ALIASES[level]],
    payload: buildLevelPayload(level)
  }))
}

function buildSectionEntries() {
  return SECTION_ENTRIES.map(section => finalize({
    id: `section:${section.id}`,
    kind: TOPIC_KINDS.SECTION,
    label: section.label,
    focal: section.focal,
    tag: section.tag,
    gloss: section.gloss,
    ex: section.ex,
    level: null,
    sectionId: section.id,
    keywords: [section.label, ...section.keywords],
    payload: null
  }))
}

let cachedIndex = null

export function getTopicSearchIndex() {
  if (!cachedIndex) {
    cachedIndex = [
      ...buildTenseEntries(),
      ...buildVerbTypeEntries(),
      ...buildFamilyEntries(),
      ...buildLevelEntries(),
      ...buildSectionEntries()
    ]
  }
  return cachedIndex
}

// Test-only escape hatch; production never needs to rebuild.
export function resetTopicSearchIndex() {
  cachedIndex = null
}
