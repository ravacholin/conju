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
    buildReviewFilterFingerprint(reviewSessionType, reviewSessionFilter)
  ].join('|')
}

export function shouldCacheEligibleForms(targetSettings) {
  // Avoid caching when verbType === 'regular' because the filter intentionally samples
  // a random spillover of regular-by-morphology forms from irregular lemmas.
  return targetSettings?.verbType !== 'regular'
}
