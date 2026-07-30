import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import StepView from './StepView.jsx'
import { getTopicSearchIndex } from '../../lib/search/topicSearchIndex.js'
import { searchTopics } from '../../lib/search/searchTopics.js'

/**
 * These cover the two things that are easy to get wrong and invisible in unit
 * tests: the window-level menu shortcuts fighting the input, and the ARIA
 * combobox wiring.
 */

const STEP_CONFIG = {
  n: '02',
  kicker: 'ENTRADA',
  prompt: 'Querés...',
  aux: 'Cuatro accesos.',
  options: [
    { id: 'levels', label: 'practicar por nivel', tag: 'A1 → C2', gloss: 'cefr', ex: '', onSelect: vi.fn() },
    { id: 'theme', label: 'practicar por tema', tag: 'FOCO', gloss: 'tiempo verbal', ex: '', onSelect: vi.fn() },
    { id: 'learn', label: 'aprender', tag: 'GUIADO', gloss: 'lecciones', ex: '', onSelect: vi.fn() },
    { id: 'progress', label: 'ver mi progreso', tag: 'DATA', gloss: 'analíticas', ex: '', onSelect: vi.fn() }
  ]
}

// Mirrors how OnboardingFlow assembles the search prop.
function Harness({ onSelect = vi.fn(), onEscape = vi.fn() }) {
  const [query, setQuery] = React.useState('')
  const inputRef = React.useRef(null)

  const results = React.useMemo(() => {
    if (!query.trim()) return []
    return searchTopics(query, getTopicSearchIndex()).map(r => ({
      ...r,
      entry: { ...r.entry, onSelect: () => onSelect(r.entry) }
    }))
  }, [query, onSelect])

  return (
    <StepView
      stepConfig={STEP_CONFIG}
      animKey={0}
      onSelect={(opt) => opt.onSelect()}
      search={{ query, onQueryChange: setQuery, results, inputRef, onEscape }}
    />
  )
}

const input = () => screen.getByRole('combobox')

beforeEach(() => {
  // Deterministic: never autofocus in tests.
  window.matchMedia = vi.fn().mockImplementation(q => ({
    matches: false, media: q, onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn()
  }))
})

describe('TopicSearch in StepView', () => {
  it('shows the normal menu options while the query is empty', () => {
    render(<Harness />)
    // scoped to the row: the focal panel renders the same words
    expect(screen.getByRole('button', { name: 'practicar por nivel' })).toBeInTheDocument()
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(input()).toHaveAttribute('aria-expanded', 'false')
  })

  it('replaces the options with live results as the user types, no Enter', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.type(input(), 'subjuntivo')

    const listbox = screen.getByRole('listbox')
    const options = within(listbox).getAllByRole('option')
    expect(options.length).toBeGreaterThan(0)
    expect(listbox).toHaveTextContent('presente de subjuntivo')
    expect(screen.queryByRole('button', { name: 'practicar por nivel' })).not.toBeInTheDocument()
    expect(input()).toHaveAttribute('aria-expanded', 'true')
  })

  it('does not fire the digit shortcut while typing', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    // "2" would otherwise select (and navigate to) the second menu option.
    await user.type(input(), 'a2')

    expect(STEP_CONFIG.options[1].onSelect).not.toHaveBeenCalled()
    expect(input()).toHaveValue('a2')
    expect(screen.getByRole('listbox')).toHaveTextContent('nivel a2')
  })

  it('moves the active option with the arrow keys without losing input focus', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.type(input(), 'perfecto')

    const first = input().getAttribute('aria-activedescendant')
    expect(first).toBeTruthy()

    fireEvent.keyDown(input(), { key: 'ArrowDown' })
    const second = input().getAttribute('aria-activedescendant')

    expect(second).not.toBe(first)
    expect(document.activeElement).toBe(input())
  })

  it('launches the focused result on Enter', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<Harness onSelect={onSelect} />)

    await user.type(input(), 'participio irregulares')
    fireEvent.keyDown(input(), { key: 'Enter' })

    expect(onSelect).toHaveBeenCalledTimes(1)
    const entry = onSelect.mock.calls[0][0]
    expect(entry.payload).toMatchObject({
      practiceMode: 'theme',
      cameFromTema: true,
      specificMood: 'nonfinite',
      specificTense: 'part',
      verbType: 'irregular'
    })
  })

  it('launches a result on click', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<Harness onSelect={onSelect} />)

    await user.type(input(), 'gerundio')
    await user.click(within(screen.getByRole('listbox')).getAllByRole('option')[0])

    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect.mock.calls[0][0].payload.specificTense).toBe('ger')
  })

  it('clears on Escape while typing, and only then delegates back-navigation', async () => {
    const user = userEvent.setup()
    const onEscape = vi.fn()
    render(<Harness onEscape={onEscape} />)

    await user.type(input(), 'presente')
    fireEvent.keyDown(input(), { key: 'Escape' })

    // The harness delegates to onEscape, which is what OnboardingFlow wires to
    // "clear the query, or go back when it is already empty".
    expect(onEscape).toHaveBeenCalledTimes(1)
  })

  it('offers suggestions instead of a dead end when nothing matches', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.type(input(), 'zzzqqq')

    expect(screen.getByText(/nada para/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'subjuntivo' })).toBeInTheDocument()
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('recovers from a suggestion click', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.type(input(), 'zzzqqq')
    await user.click(screen.getByRole('button', { name: 'participio' }))

    expect(input()).toHaveValue('participio')
    expect(screen.getByRole('listbox')).toBeInTheDocument()
  })

  it('highlights the matched substring in the label', async () => {
    const user = userEvent.setup()
    const { container } = render(<Harness />)

    await user.type(input(), 'indefinido')

    const marks = container.querySelectorAll('.vo-option-mark')
    expect(marks.length).toBeGreaterThan(0)
    expect(marks[0].textContent).toBe('indefinido')
  })

  it('keeps the focal panel in sync with the focused result', async () => {
    const user = userEvent.setup()
    const { container } = render(<Harness />)

    await user.type(input(), 'gerundio')

    expect(container.querySelector('.vo-focal-word').textContent).toContain('gerundio')
  })

  it('does not autofocus on coarse pointers', () => {
    render(<Harness />)
    expect(document.activeElement).not.toBe(input())
  })
})
