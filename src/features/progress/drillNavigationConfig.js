import { buildBlockFingerprint, buildReviewFilterFingerprint } from '../../hooks/modules/drillCacheKey.js'

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

/**
 * Snapshot the settings + runtime-session values that define which forms a drill
 * should target. Progress-module drills ("Practicar esto", SRS review filters)
 * keep `practiceMode` as 'mixed'/'review' and only change the runtime block or
 * review filter in the session store, so those must be fingerprinted explicitly
 * — otherwise the drill-entry effect can't tell the targeting changed and reuses
 * a stale `currentItem` from the previous session as the first exercise.
 *
 * @param {object} settings - Durable settings (or a subset with the same keys).
 * @param {object} session - Session store state (runtimeCurrentBlock, review context).
 * @returns {object} A comparable targeting snapshot.
 */
export function snapshotDrillTargeting(settings = {}, session = {}) {
  return {
    practiceMode: settings.practiceMode ?? null,
    specificMood: settings.specificMood ?? null,
    specificTense: settings.specificTense ?? null,
    verbType: settings.verbType ?? null,
    selectedFamily: settings.selectedFamily ?? null,
    blockFingerprint: buildBlockFingerprint(session.runtimeCurrentBlock),
    reviewFingerprint: buildReviewFilterFingerprint(
      session.runtimeReviewSessionType,
      session.runtimeReviewSessionFilter
    )
  }
}

/**
 * Compare two targeting snapshots produced by {@link snapshotDrillTargeting}.
 * @returns {boolean} true when the drill should discard its current item and regenerate.
 */
export function drillTargetingChanged(prev, next) {
  if (!prev || !next) return true
  return (
    prev.practiceMode !== next.practiceMode ||
    prev.specificMood !== next.specificMood ||
    prev.specificTense !== next.specificTense ||
    prev.verbType !== next.verbType ||
    prev.selectedFamily !== next.selectedFamily ||
    prev.blockFingerprint !== next.blockFingerprint ||
    prev.reviewFingerprint !== next.reviewFingerprint
  )
}
