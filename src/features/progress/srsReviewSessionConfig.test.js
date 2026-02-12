import { describe, expect, it } from 'vitest'
import { buildSrsReviewFilter, buildSrsReviewDrillConfig } from './srsReviewSessionConfig.js'

describe('srsReviewSessionConfig', () => {
  it('builds expected filters by session type', () => {
    expect(buildSrsReviewFilter('urgent')).toEqual({ urgency: 'urgent' })
    expect(buildSrsReviewFilter('light')).toEqual({ limit: 'light', urgency: 'urgent' })
    expect(buildSrsReviewFilter('today')).toEqual({ urgency: 'all' })
    expect(buildSrsReviewFilter('unknown')).toEqual({ urgency: 'all' })
  })

  it('builds normalized drill config for review sessions', () => {
    const config = buildSrsReviewDrillConfig('light')

    expect(config).toEqual(expect.objectContaining({
      practiceMode: 'review',
      reviewSessionType: 'light',
      reviewSessionFilter: { limit: 'light', urgency: 'urgent' },
      specificMood: null,
      specificTense: null
    }))
  })
})
