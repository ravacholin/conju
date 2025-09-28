import React from 'react'
import { render, waitFor } from '@testing-library/react'
import { vi } from 'vitest'

const { reloadMock, getSRSStatsMock, getCurrentUserIdMock } = vi.hoisted(() => ({
  reloadMock: vi.fn(),
  getSRSStatsMock: vi.fn(),
  getCurrentUserIdMock: vi.fn()
}))

vi.mock('../../state/settings.js', () => ({
  useSettings: () => ({
    set: vi.fn()
  })
}))

vi.mock('../../components/gamification/GamificationDisplay.jsx', () => ({
  default: () => <div data-testid="gamification-display" />
}))

vi.mock('../../components/srs/SRSAnalytics.jsx', () => ({
  default: () => <div data-testid="srs-analytics" />
}))

vi.mock('../../components/progress/ProgressJourney.jsx', () => ({
  default: () => <div data-testid="progress-journey" />
}))

vi.mock('../../components/mobile/TouchHints.jsx', () => ({
  SRSHints: ({ children }) => <div data-testid="srs-hints">{children}</div>,
  GamificationHints: ({ children }) => <div data-testid="gamification-hints">{children}</div>,
  JourneyHints: ({ children }) => <div data-testid="journey-hints">{children}</div>
}))

vi.mock('../../components/notifications/NotificationSettings.jsx', () => ({
  default: () => <div data-testid="notification-settings" />
}))

vi.mock('../../hooks/useSRSQueue.js', () => ({
  useSRSQueue: () => ({
    queue: [],
    loading: false,
    error: '',
    stats: { total: 0, urgent: 0, overdue: 0, scheduled: 0 },
    lastUpdated: null,
    reload: reloadMock
  })
}))

vi.mock('../../lib/progress/analytics.js', () => ({
  getSRSStats: getSRSStatsMock
}))

vi.mock('../../lib/progress/userManager.js', () => ({
  getCurrentUserId: getCurrentUserIdMock
}))

import SRSPanel from './SRSPanel.jsx'

describe('SRSPanel', () => {
  beforeEach(() => {
    reloadMock.mockClear()
    getSRSStatsMock.mockReset()
    getCurrentUserIdMock.mockReset()
    getCurrentUserIdMock.mockReturnValue('user-123')
    getSRSStatsMock.mockResolvedValue({ dueNow: 3, dueToday: 7 })
  })

  it('recarga la cola y las estadísticas cuando se emite progress:srs-updated', async () => {
    render(<SRSPanel />)

    await waitFor(() => {
      expect(getSRSStatsMock).toHaveBeenCalledTimes(1)
    })

    window.dispatchEvent(new CustomEvent('progress:srs-updated'))

    await waitFor(() => {
      expect(reloadMock).toHaveBeenCalledTimes(1)
      expect(getSRSStatsMock).toHaveBeenCalledTimes(2)
    })
  })
})

