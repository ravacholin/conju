import {
  FUTURE_CONDITIONAL_ROOTS,
  IRREGULAR_GERUNDS,
  IRREGULAR_PARTICIPLES
} from './irregularPatterns.js'

export const IRREGULAR_CANONICAL_VERSION = 1

const toGerundMap = (entries = []) => entries.reduce((acc, item) => {
  if (!item?.lemma || !item?.form) return acc
  acc[item.lemma] = item.form
  return acc
}, {})

const toParticipleMap = (entries = []) => entries.reduce((acc, item) => {
  if (!item?.lemma || !item?.form) return acc
  acc[item.lemma] = {
    primary: item.form,
    alternates: Array.isArray(item.alt) ? item.alt : []
  }
  return acc
}, {})

const toFutureConditionalMap = (entries = []) => entries.reduce((acc, item) => {
  if (!item?.lemma || !item?.root) return acc
  acc[item.lemma] = {
    root: item.root,
    group: item.group || null
  }
  return acc
}, {})

export const IRREGULAR_CANONICAL = Object.freeze({
  version: IRREGULAR_CANONICAL_VERSION,
  sources: Object.freeze({
    legacyPatterns: 'src/lib/data/irregularPatterns.js'
  }),
  nonfinite: Object.freeze({
    gerund: Object.freeze(toGerundMap(IRREGULAR_GERUNDS)),
    participle: Object.freeze(toParticipleMap(IRREGULAR_PARTICIPLES))
  }),
  finite: Object.freeze({
    futureConditionalRoots: Object.freeze(toFutureConditionalMap(FUTURE_CONDITIONAL_ROOTS))
  })
})

export const getCanonicalGerund = (lemma) => IRREGULAR_CANONICAL.nonfinite.gerund[lemma] || null

export const getCanonicalParticiple = (lemma) => IRREGULAR_CANONICAL.nonfinite.participle[lemma] || null

export const getCanonicalFutureRoot = (lemma) => IRREGULAR_CANONICAL.finite.futureConditionalRoots[lemma] || null

export const validateIrregularCanonical = () => {
  const errors = []
  if (IRREGULAR_CANONICAL.version !== IRREGULAR_CANONICAL_VERSION) {
    errors.push('Version mismatch in irregular canonical dataset.')
  }

  Object.entries(IRREGULAR_CANONICAL.nonfinite.gerund).forEach(([lemma, form]) => {
    if (!lemma || !form) {
      errors.push(`Invalid gerund entry for lemma: ${lemma || '<empty>'}`)
    }
  })

  Object.entries(IRREGULAR_CANONICAL.nonfinite.participle).forEach(([lemma, value]) => {
    if (!lemma || !value?.primary) {
      errors.push(`Invalid participle entry for lemma: ${lemma || '<empty>'}`)
      return
    }
    if (value.alternates && !Array.isArray(value.alternates)) {
      errors.push(`Participle alternates must be an array for lemma: ${lemma}`)
    }
  })

  Object.entries(IRREGULAR_CANONICAL.finite.futureConditionalRoots).forEach(([lemma, value]) => {
    if (!lemma || !value?.root) {
      errors.push(`Invalid future/conditional root entry for lemma: ${lemma || '<empty>'}`)
    }
  })

  return {
    valid: errors.length === 0,
    errors
  }
}
