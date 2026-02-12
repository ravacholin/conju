import React from 'react'
import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import axe from 'axe-core'

vi.mock('./DrillHeader.jsx', () => ({
  default: () => <header><button type="button">Home</button></header>
}))

vi.mock('../../features/drill/Drill.jsx', () => ({
  default: () => <div><button type="button">Responder</button></div>
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

describe('DrillMode a11y', () => {
  it('has no critical accessibility violations with an active drill item', async () => {
    const settings = {
      practiceMode: 'mixed',
      practicePronoun: 'all',
      selectedFamily: null,
      specificMood: null,
      specificTense: null,
      verbType: 'all',
      set: vi.fn()
    }

    const { container } = render(
      <DrillMode
        currentItem={{ lemma: 'hablar', mood: 'indicative', tense: 'pres', person: '1s', value: 'hablo' }}
        settings={settings}
        onDrillResult={vi.fn()}
        onContinue={vi.fn()}
        onHome={vi.fn()}
        onRegenerateItem={vi.fn()}
        onDialectChange={vi.fn()}
        onPracticeModeChange={vi.fn()}
        onStartSpecificPractice={vi.fn()}
        getAvailableMoodsForLevel={vi.fn(() => ['indicative'])}
        getAvailableTensesForLevelAndMood={vi.fn(() => ['pres'])}
        onNavigateToProgress={vi.fn()}
        onNavigateToStory={vi.fn()}
        onNavigateToTimeline={vi.fn()}
        getGenerationStats={vi.fn(async () => ({ totalForms: 1, eligibleForms: 1 }))}
        isGenerationViable={vi.fn(async () => true)}
      />
    )

    const result = await axe.run(container, {
      rules: {
        'color-contrast': { enabled: false }
      }
    })

    expect(result.violations).toEqual([])
  })
})
