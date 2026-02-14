const DEFAULT_REVIEW_TYPE = 'due'

const defaultNow = () => new Date()

export const getReviewSessionContext = settings => ({
  reviewSessionType: settings?.reviewSessionType || DEFAULT_REVIEW_TYPE,
  reviewSessionFilter: settings?.reviewSessionFilter || {}
})

export const buildSpecificConstraints = (settings = {}, reviewSessionType, reviewSessionFilter = {}) => {
  const practiceSpecificActive = Boolean(
    (settings.practiceMode === 'specific' || settings.practiceMode === 'theme') &&
    settings.specificMood &&
    settings.specificTense
  )

  const reviewSpecificActive = Boolean(
    settings.practiceMode === 'review' &&
    reviewSessionType === 'specific' &&
    reviewSessionFilter?.mood &&
    reviewSessionFilter?.tense
  )

  const isSpecific = practiceSpecificActive || reviewSpecificActive
  const resolvedMood = reviewSpecificActive
    ? reviewSessionFilter.mood
    : (practiceSpecificActive ? settings.specificMood : null)
  const resolvedTense = reviewSpecificActive
    ? reviewSessionFilter.tense
    : (practiceSpecificActive ? settings.specificTense : null)
  const resolvedPerson = reviewSpecificActive
    ? (reviewSessionFilter.person || null)
    : (practiceSpecificActive ? (settings.specificPerson || null) : null)

  return {
    isSpecific,
    specificMood: isSpecific ? resolvedMood : null,
    specificTense: isSpecific ? resolvedTense : null,
    specificPerson: isSpecific ? resolvedPerson : null
  }
}

export const computeUrgencyLevel = (nextDue, now = defaultNow()) => {
  if (!nextDue) return 1

  const dueDate = new Date(nextDue)
  const diffHours = (dueDate - now) / (1000 * 60 * 60)

  if (Number.isNaN(diffHours)) return 1
  if (diffHours < 0) return 4
  if (diffHours < 6) return 3
  if (diffHours < 24) return 2
  return 1
}

export const applyReviewSessionFilter = (
  dueCells,
  reviewSessionType,
  reviewSessionFilter,
  now = defaultNow()
) => {
  if (!Array.isArray(dueCells) || dueCells.length === 0) return []

  const filter = reviewSessionFilter || {}
  let filtered = dueCells.filter(Boolean)

  const targetMood = filter.mood
  const targetTense = filter.tense
  const targetPerson = filter.person

  if (targetMood) {
    filtered = filtered.filter(cell => cell?.mood === targetMood)
  }

  if (targetTense) {
    filtered = filtered.filter(cell => cell?.tense === targetTense)
  }

  if (targetPerson) {
    filtered = filtered.filter(cell => cell?.person === targetPerson)
  }

  const urgencyFilter = filter.urgency
  if (urgencyFilter && urgencyFilter !== 'all') {
    filtered = filtered.filter(cell => {
      const urgency = computeUrgencyLevel(cell?.nextDue, now)

      if (urgencyFilter === 'urgent') return urgency >= 3
      if (urgencyFilter === 'overdue') return urgency === 4

      const numericUrgency = Number(urgencyFilter)
      if (!Number.isNaN(numericUrgency)) {
        return urgency === numericUrgency
      }

      return true
    })
  }

  const limit = filter.limit
  if (limit === 'light') {
    filtered = filtered.slice(0, Math.max(1, filter.limitCount || 10))
  } else if (typeof limit === 'number' && limit > 0) {
    filtered = filtered.slice(0, Math.floor(limit))
  }

  if (reviewSessionType === 'specific' && filtered.length === 0) {
    filtered = dueCells.filter(cell => {
      if (!cell) return false
      if (targetMood && cell.mood !== targetMood) return false
      if (targetTense && cell.tense !== targetTense) return false
      if (targetPerson && cell.person !== targetPerson) return false
      return true
    })
  }

  return filtered
}

export const selectDueCandidate = (dueCells) => {
  if (!Array.isArray(dueCells) || dueCells.length === 0) return null

  const valid = dueCells.filter(Boolean)
  if (valid.length === 0) return null

  // Randomize among due items to prevent always selecting the same
  // mood/tense/person combination. The caller (hierarchicalSelection)
  // controls WHEN to use SRS and how to apply the result.
  const index = Math.floor(Math.random() * valid.length)
  return valid[index]
}
