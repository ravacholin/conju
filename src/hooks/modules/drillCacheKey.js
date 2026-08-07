function stableStringify(value) {
  if (value === null || value === undefined) {
    return ''
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`
  }

  if (typeof value === 'object') {
    const keys = Object.keys(value).sort()
    return `{${keys.map((key) => `${key}:${stableStringify(value[key])}`).join(',')}}`
  }

  return String(value)
}

export function buildReviewFilterFingerprint(reviewSessionType, reviewSessionFilter) {
  if (!reviewSessionType) {
    return 'no_review'
  }

  return `${reviewSessionType}|${stableStringify(reviewSessionFilter || {})}`
}

// Progress-module micro-drills carry an ad-hoc `currentBlock` (`{ combos, cells }`,
// usually with no id) that narrows the eligible pool to a specific mood/tense set.
// It MUST be part of the cache key: without it, the pool built for one block — or for
// plain mixed practice — gets reused for a different block, so "Practicar esto" either
// keeps serving the previous pool (presente regular) or leaks its own tense into the
// next session.
export function buildBlockFingerprint(currentBlock) {
  if (!currentBlock) return 'no_block'
  const parts = []
  if (currentBlock.id) parts.push(`id:${currentBlock.id}`)
  if (Array.isArray(currentBlock.combos) && currentBlock.combos.length) {
    parts.push('c:' + currentBlock.combos.map(c => `${c.mood}|${c.tense}`).join(','))
  }
  if (Array.isArray(currentBlock.cells) && currentBlock.cells.length) {
    parts.push('x:' + currentBlock.cells.map(c => `${c.mood}|${c.tense}|${c.person}`).join(','))
  }
  return parts.length ? parts.join(';') : 'block'
}

export function buildEligibleFormsKey(signature, targetSettings, specificConstraints, reviewSessionType, reviewSessionFilter) {
  return [
    signature,
    targetSettings.practiceMode || 'mixed',
    targetSettings.level || 'A1',
    targetSettings.verbType || 'all',
    targetSettings.selectedFamily || 'none',
    targetSettings.practicePronoun || 'mixed',
    targetSettings.useVoseo ? 'voseo' : 'no_voseo',
    targetSettings.useVosotros ? 'vosotros' : 'no_vosotros',
    targetSettings.irregularityFilterMode || 'tense',
    specificConstraints?.isSpecific ? 'specific' : 'not_specific',
    specificConstraints?.specificMood || '',
    specificConstraints?.specificTense || '',
    specificConstraints?.specificPerson || '',
    buildBlockFingerprint(targetSettings.currentBlock),
    buildReviewFilterFingerprint(reviewSessionType, reviewSessionFilter)
  ].join('|')
}

export function shouldCacheEligibleForms(targetSettings) {
  // Avoid caching when verbType === 'regular' because the filter intentionally samples
  // a random spillover of regular-by-morphology forms from irregular lemmas.
  return targetSettings?.verbType !== 'regular'
}
