import { buildDrillSettingsUpdate } from './drillNavigationConfig.js'

export function buildSrsReviewFilter(sessionType = 'all') {
  switch (sessionType) {
    case 'urgent':
      return { urgency: 'urgent' }
    case 'light':
      return { limit: 'light', urgency: 'urgent' }
    case 'today':
      return { urgency: 'all' }
    default:
      return { urgency: 'all' }
  }
}

export function buildSrsReviewDrillConfig(sessionType = 'all') {
  const reviewSessionFilter = buildSrsReviewFilter(sessionType)
  return buildDrillSettingsUpdate({}, {
    practiceMode: 'review',
    reviewSessionType: sessionType,
    reviewSessionFilter
  })
}
