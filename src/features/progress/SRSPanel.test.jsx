import React from 'react'
import { act, fireEvent, render, waitFor } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

const { reloadMock, getSRSStatsMock, getCurrentUserIdMock, useSRSQueueMock, setSettingsMock } = vi.hoisted(() => ({
  reloadMock: vi.fn(),
  getSRSStatsMock: vi.fn(),
  getCurrentUserIdMock: vi.fn(),
  useSRSQueueMock: vi.fn(),
  setSettingsMock: vi.fn()
}))

vi.mock('../../state/settings.js', () => ({
  useSettings: () => ({
    set: setSettingsMock
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
  useSRSQueue: (...args) => useSRSQueueMock(...args)
}))

vi.mock('../../lib/progress/analytics.js', () => ({
  getSRSStats: getSRSStatsMock
}))

vi.mock('../../lib/progress/userManager/index.js', () => ({
  getCurrentUserId: getCurrentUserIdMock
}))

import SRSPanel from './SRSPanel.jsx'

describe('SRSPanel', () => {
  beforeEach(() => {
    reloadMock.mockClear()
    getSRSStatsMock.mockReset()
    getCurrentUserIdMock.mockReset()
    useSRSQueueMock.mockReset()
    setSettingsMock.mockReset()
    getCurrentUserIdMock.mockReturnValue('user-123')
    getSRSStatsMock.mockResolvedValue({ dueNow: 3, dueToday: 7 })
    useSRSQueueMock.mockReturnValue({
      queue: [],
      loading: false,
      error: '',
      stats: { total: 0, urgent: 0, overdue: 0, scheduled: 0 },
      lastUpdated: null,
      reload: reloadMock
    })
  })

  afterEach(() => {
    vi.useRealTimers()
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

  it('coalescea eventos rapidos de progress:srs-updated en una sola recarga', async () => {
    render(<SRSPanel />)

    await waitFor(() => {
      expect(getSRSStatsMock).toHaveBeenCalledTimes(1)
    })
    vi.useFakeTimers()

    window.dispatchEvent(new CustomEvent('progress:srs-updated'))
    window.dispatchEvent(new CustomEvent('progress:srs-updated'))
    window.dispatchEvent(new CustomEvent('progress:srs-updated'))

    await act(async () => {
      vi.advanceTimersByTime(300)
      await Promise.resolve()
    })

    expect(reloadMock).toHaveBeenCalledTimes(1)
    expect(getSRSStatsMock).toHaveBeenCalledTimes(2)
  })

  it('renderiza personLabel provisto por la cola cuando se expanden detalles', async () => {
    useSRSQueueMock.mockReturnValue({
      queue: [{
        mood: 'indicative',
        tense: 'pres',
        person: '1s',
        personLabel: '1ª persona singular',
        formattedName: 'indicative-pres',
        urgency: 2,
        masteryScore: 55,
        nextDue: new Date(Date.now() + 3600000).toISOString(),
        itemKey: 'indicative|pres|1s|x'
      }],
      loading: false,
      error: '',
      stats: { total: 1, urgent: 1, overdue: 0, scheduled: 1 },
      lastUpdated: new Date().toISOString(),
      reload: reloadMock
    })

    const { getByText } = render(<SRSPanel />)
    await waitFor(() => {
      expect(getSRSStatsMock).toHaveBeenCalledTimes(1)
    })
    fireEvent.click(getByText('Detalles'))
    await waitFor(() => {
      expect(getByText('1ª persona singular')).toBeInTheDocument()
    })
  })

  it('evita doble disparo rapido al iniciar repaso', async () => {
    const onNavigateToDrill = vi.fn()
    const { getByText } = render(<SRSPanel onNavigateToDrill={onNavigateToDrill} />)

    await waitFor(() => {
      expect(getSRSStatsMock).toHaveBeenCalledTimes(1)
    })

    const action = getByText('Repaso rápido (5 min)')
    vi.useFakeTimers()
    fireEvent.click(action)
    fireEvent.click(action)

    expect(onNavigateToDrill).toHaveBeenCalledTimes(1)
    expect(setSettingsMock).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(300)
    fireEvent.click(action)

    expect(onNavigateToDrill).toHaveBeenCalledTimes(2)
    expect(setSettingsMock).toHaveBeenCalledTimes(2)
  })
})
