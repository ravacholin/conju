import React from 'react'
import { render } from '@testing-library/react'
import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./DrillHeader.jsx', () => ({
  default: () => <header />
}))

vi.mock('../../features/drill/Drill.jsx', () => ({
  default: () => <div data-testid="drill-content">Drill Content</div>
}))

vi.mock('../../state/session.js', () => ({
  useSessionStore: (selector) => selector({
    startPersonalizedSession: vi.fn(),
    setDrillRuntimeContext: vi.fn()
  })
}))

vi.mock('../../lib/utils/logger.js', () => ({
  createLogger: () => ({
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  })
}))

import DrillMode from './DrillMode.jsx'

const createProps = (overrides = {}) => ({
  currentItem: null,
  settings: {
    practiceMode: 'mixed',
    practicePronoun: 'all',
    selectedFamily: null,
    specificMood: null,
    specificTense: null,
    verbType: 'all',
    set: vi.fn()
  },
  onDrillResult: vi.fn(),
  onContinue: vi.fn(),
  onHome: vi.fn(),
  onRegenerateItem: vi.fn(),
  onDialectChange: vi.fn(),
  onPracticeModeChange: vi.fn(),
  onStartSpecificPractice: vi.fn(),
  getAvailableMoodsForLevel: vi.fn(() => ['indicative']),
  getAvailableTensesForLevelAndMood: vi.fn(() => ['pres']),
  onNavigateToProgress: vi.fn(),
  getGenerationStats: vi.fn(async () => ({ totalForms: 1, eligibleForms: 1 })),
  isGenerationViable: vi.fn(async () => true),
  isGenerating: false,
  ...overrides
})

describe('DrillMode regeneration safety net', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not retry generation while one is already in flight', () => {
    const props = createProps({ isGenerating: true })

    render(<DrillMode {...props} />)

    act(() => {
      vi.advanceTimersByTime(5000)
    })

    expect(props.onRegenerateItem).not.toHaveBeenCalled()
  })

  it('retries once generation stops without producing an item', () => {
    const props = createProps({ isGenerating: true })
    const { rerender } = render(<DrillMode {...props} />)

    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(props.onRegenerateItem).not.toHaveBeenCalled()

    rerender(<DrillMode {...props} isGenerating={false} />)

    act(() => {
      vi.advanceTimersByTime(2000)
    })

    expect(props.onRegenerateItem).toHaveBeenCalledTimes(1)
  })

  it('does not retry once an item is available', () => {
    const props = createProps({
      currentItem: { lemma: 'hablar', mood: 'indicative', tense: 'pres', person: '1s', value: 'hablo' }
    })

    render(<DrillMode {...props} />)

    act(() => {
      vi.advanceTimersByTime(20000)
    })

    expect(props.onRegenerateItem).not.toHaveBeenCalled()
  })

  it('keeps the retry clock stable when parent callbacks change identity', () => {
    // AppRouter rebuilds every drill handler on each render, so the props DrillMode
    // receives are new functions every time. The pending retry must survive that
    // instead of being rescheduled from zero on each parent render.
    let regenerateCalls = 0
    const makeRegenerate = () => vi.fn(() => { regenerateCalls += 1 })

    const props = createProps({ onRegenerateItem: makeRegenerate() })
    const { rerender } = render(<DrillMode {...props} />)

    for (let i = 0; i < 6; i++) {
      act(() => {
        vi.advanceTimersByTime(200)
      })
      rerender(
        <DrillMode
          {...props}
          onRegenerateItem={makeRegenerate()}
          onContinue={vi.fn()}
          getGenerationStats={vi.fn(async () => ({ totalForms: 1, eligibleForms: 1 }))}
        />
      )
    }

    act(() => {
      vi.advanceTimersByTime(1)
    })

    expect(regenerateCalls).toBe(1)
  })
})
