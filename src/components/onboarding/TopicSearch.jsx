import React, { useEffect, useRef, useState } from 'react'
import './TopicSearch.css'

const PLACEHOLDER = 'buscá un tema — participios, subjuntivo, a2, irregulares…'

/**
 * Live topic search field for the main menu.
 *
 * Controlled: the query and the results live in OnboardingFlow so the result
 * list can reuse the existing option-list rendering and the focal panel.
 * This component owns only the field itself and its keyboard handling.
 */
function TopicSearch({
  query,
  onQueryChange,
  resultCount,
  hasQuery,
  listboxId,
  activeOptionId,
  inputRef,
  onArrow,
  onCommit,
  onEscape
}) {
  const [focused, setFocused] = useState(false)
  const [announcement, setAnnouncement] = useState('')
  const localRef = useRef(null)
  const ref = inputRef || localRef

  // Announce the result count on a delay so screen readers aren't spammed
  // once per keystroke while the list is still settling.
  useEffect(() => {
    if (!hasQuery) {
      setAnnouncement('')
      return undefined
    }
    const timer = setTimeout(() => {
      setAnnouncement(`${resultCount} ${resultCount === 1 ? 'resultado' : 'resultados'}`)
    }, 350)
    return () => clearTimeout(timer)
  }, [hasQuery, resultCount])

  // Autofocus on desktop only. On touch devices this would pop the virtual
  // keyboard the moment the menu opens and hide half the screen.
  // Never let a missing or stubbed matchMedia take the whole menu down —
  // failing closed just means no autofocus.
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    let finePointer = false
    try {
      finePointer = window.matchMedia('(hover: hover) and (pointer: fine)')?.matches === true
    } catch {
      finePointer = false
    }
    if (finePointer) ref.current?.focus()
  }, [ref])

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      onArrow(e.key === 'ArrowDown' ? 1 : -1)
      return
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      onCommit()
      return
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      onEscape()
    }
    // Everything else — arrows left/right, digits, backspace, home/end — is
    // left to the browser. The window-level menu shortcuts skip text fields.
  }

  return (
    <div className={`vo-search${focused ? ' is-focused' : ''}`}>
      <label className="vo-visually-hidden" htmlFor="vo-search-input">
        Buscar un tema, un nivel o una familia de verbos
      </label>
      <div className="vo-search-field">
        <span className="vo-search-slash" aria-hidden="true">/</span>
        <input
          id="vo-search-input"
          ref={ref}
          className="vo-search-input"
          type="text"
          value={query}
          placeholder={PLACEHOLDER}
          role="combobox"
          aria-expanded={hasQuery}
          aria-controls={listboxId}
          aria-activedescendant={hasQuery ? activeOptionId : undefined}
          aria-autocomplete="list"
          inputMode="search"
          enterKeyHint="go"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          onChange={(e) => onQueryChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={handleKeyDown}
        />
        {!query && !focused && <span className="vo-cursor vo-search-cursor" aria-hidden="true" />}
        {query && (
          <button
            type="button"
            className="vo-search-clear"
            aria-label="Borrar búsqueda"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              onQueryChange('')
              ref.current?.focus()
            }}
          >
            borrar
          </button>
        )}
      </div>

      <p className="vo-visually-hidden" role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>
    </div>
  )
}

export default TopicSearch
