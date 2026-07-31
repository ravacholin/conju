const DEFAULT_DRILL_SETTINGS = {
  practiceMode: 'mixed',
  specificMood: null,
  specificTense: null,
  // Progress-module drills never target a family; clear any left over from a
  // previous onboarding session, which would now actually narrow the pool.
  selectedFamily: null,
  reviewSessionType: 'due',
  reviewSessionFilter: {},
  currentBlock: null
}

export function buildDrillSettingsUpdate(drillConfig = {}, overrides = {}) {
  const next = {
    ...DEFAULT_DRILL_SETTINGS,
    ...(drillConfig || {}),
    ...(overrides || {})
  }

  if (next.practiceMode !== 'specific') {
    next.specificMood = null
    next.specificTense = null
  }

  if (next.practiceMode !== 'review') {
    next.reviewSessionType = 'due'
    next.reviewSessionFilter = {}
  }

  if (!next.reviewSessionFilter || typeof next.reviewSessionFilter !== 'object') {
    next.reviewSessionFilter = {}
  }

  return next
}
