import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../../features/drill/Drill.jsx', () => ({
  default: () => <div data-testid="drill-content">Drill Content</div>
}))

vi.mock('./QuickSwitchPanel.jsx', () => ({
  default: ({ onClose }) => (
    <div data-testid="quick-switch-panel">
      <button type="button" onClick={onClose}>Cerrar quick switch</button>
    </div>
  )
}))

vi.mock('./GamesPanel.jsx', () => ({
  default: ({ onClose }) => (
    <div data-testid="games-panel">
      <button type="button" onClick={onClose}>Cerrar juegos</button>
    </div>
  )
}))

vi.mock('./PronunciationPanelSafe.jsx', () => ({
  default: React.forwardRef(function MockPronunciationPanel(props, _ref) {
    return (
      <div data-testid="pronunciation-panel">
        <button type="button" onClick={props.onClose}>Cerrar pronunciación</button>
      </div>
    )
  })
}))

vi.mock('../../state/session.js', () => ({
  useSessionStore: (selector) => selector({
    startPersonalizedSession: vi.fn(),
    setDrillRuntimeContext: vi.fn()
  })
}))

vi.mock('../../state/settings.js', () => ({
  useSettings: () => ({ practiceMode: 'mixed' })
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

const createProps = () => ({
  currentItem: { lemma: 'hablar', mood: 'indicative', tense: 'pres', person: '1s', value: 'hablo' },
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
  onNavigateToStory: vi.fn(),
  onNavigateToTimeline: vi.fn(),
  getGenerationStats: vi.fn(async () => ({ totalForms: 1, eligibleForms: 1 })),
  isGenerationViable: vi.fn(async () => true)
})

describe('DrillMode keyboard flow', () => {
  it('closes quick switch with Escape and restores focus to trigger', async () => {
    const user = userEvent.setup()
    render(<DrillMode {...createProps()} />)

    const quickSwitchButton = screen.getByRole('button', { name: 'Cambiar rápido' })
    quickSwitchButton.focus()
    await user.click(quickSwitchButton)

    expect(await screen.findByTestId('quick-switch-panel')).toBeInTheDocument()

    await user.keyboard('{Escape}')

    await waitFor(() => {
      expect(screen.queryByTestId('quick-switch-panel')).not.toBeInTheDocument()
    })
    expect(document.activeElement).toBe(quickSwitchButton)
  })

  it('keeps header actions in predictable tab order', async () => {
    const user = userEvent.setup()
    render(<DrillMode {...createProps()} />)

    await user.tab()
    expect(screen.getByRole('button', { name: 'Cambiar rápido' })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('button', { name: 'Tildes' })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('button', { name: 'Menú' })).toHaveFocus()
  })
})
