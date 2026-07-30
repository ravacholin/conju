import React, { useState, useEffect, useCallback, useMemo } from 'react'
import VoOptionRow from './VoOptionRow.jsx'
import TopicSearch from './TopicSearch.jsx'
import { isTextEntryTarget } from './textEntry.js'

const ACCENT = 'var(--accent-primary)'
const INK3 = 'var(--border-strong)'

const LISTBOX_ID = 'vo-search-results'
const SUGGESTIONS = ['presente', 'subjuntivo', 'participio', 'irregulares', 'a2']

// Longer labels get a smaller focal word so the left panel never overflows.
function focalSizeFor(label) {
  const len = (label || '').length
  const factor = len <= 6 ? 1 : len <= 10 ? 0.78 : len <= 16 ? 0.58 : len <= 22 ? 0.44 : 0.34
  return `clamp(44px, ${Math.max(5, 12 * factor)}vw, ${Math.round(180 * factor)}px)`
}

/**
 * Two-panel step: a giant focal word on the left, the option list on the right.
 *
 * When `search` is supplied (the main menu, step 2) the option list is
 * replaced by live search results as soon as the user types, and the focal
 * panel previews whichever result is focused. Everything else — keyboard
 * navigation, the meta strip, the row markup — is shared between both modes.
 */
function StepView({ stepConfig, animKey, onSelect, search }) {
  const [focusIdx, setFocusIdx] = useState(0)
  const { n, kicker, prompt, aux, options } = stepConfig

  const query = search?.query ?? ''
  const hasQuery = Boolean(search && query.trim())
  const results = hasQuery ? search.results : []
  const noResults = hasQuery && results.length === 0

  // In search mode the visible list is the results; otherwise the step options.
  const visibleOptions = useMemo(
    () => (hasQuery ? results.map(r => r.entry) : options),
    [hasQuery, results, options]
  )

  useEffect(() => { setFocusIdx(0) }, [animKey])
  // Results shrink on every keystroke, so the index must reset or it points
  // past the end of the list and the focal panel goes blank.
  useEffect(() => { setFocusIdx(0) }, [query])

  const safeIdx = visibleOptions.length === 0
    ? 0
    : Math.min(focusIdx, visibleOptions.length - 1)
  const focused = visibleOptions[safeIdx]

  const moveFocus = useCallback((delta) => {
    setFocusIdx(i => {
      const max = visibleOptions.length - 1
      if (max < 0) return 0
      return Math.min(max, Math.max(0, Math.min(i, max) + delta))
    })
  }, [visibleOptions.length])

  const commit = useCallback(() => {
    const target = visibleOptions[Math.min(safeIdx, visibleOptions.length - 1)]
    if (target) onSelect(target)
  }, [visibleOptions, safeIdx, onSelect])

  // Keyboard navigation for the list. Events originating in a text field are
  // handled by the field itself (see TopicSearch), so they are skipped here —
  // otherwise typing "a2" would trigger the digit shortcut for option 2.
  useEffect(() => {
    const handle = (e) => {
      if (isTextEntryTarget(e.target)) return
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        moveFocus(1)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        moveFocus(-1)
      } else if (e.key === 'Enter' || e.key === 'ArrowRight') {
        e.preventDefault()
        commit()
      } else if (/^[1-9]$/.test(e.key)) {
        const idx = parseInt(e.key, 10) - 1
        if (idx < visibleOptions.length) {
          setFocusIdx(idx)
          onSelect(visibleOptions[idx])
        }
      } else if (e.key === '/' && search) {
        e.preventDefault()
        search.inputRef?.current?.focus()
      }
    }
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [moveFocus, commit, visibleOptions, onSelect, search])

  const focalLabel = noResults ? 'sin resultados' : (focused?.focal || focused?.label || '')
  const listLabel = hasQuery
    ? `RESULTADOS · ${String(results.length).padStart(2, '0')} ────`
    : `OPCIONES · ${String(options.length).padStart(2, '0')} ────`

  return (
    <div
      key={animKey}
      className={`vo-step vo-lift-in${hasQuery ? ' is-searching' : ''}`}
    >
      {/* LEFT: focal word display */}
      <div className="vo-left">
        <div className="vo-step-tag">──── {hasQuery ? 'BÚSQUEDA' : kicker}</div>

        <div className="vo-watermark" aria-hidden="true">{n}</div>

        <div className="vo-left-bottom">
          <div className="vo-aux">▸ {hasQuery ? 'Resultados en vivo. Elegí uno y arrancás.' : aux}</div>
          <div className="vo-prompt">{hasQuery ? 'Buscás...' : prompt}</div>

          {/* Focal option — huge italic. In search mode the key is stable so
              the scan-in animation doesn't retrigger on every keystroke. */}
          <div
            key={hasQuery ? 'search-focal' : (focused?.id ?? 'x')}
            className="vo-focal-word vo-scan-in"
            style={{ '--vo-focal-size': focalSizeFor(focalLabel), color: ACCENT }}
          >
            {focalLabel}
            <span className="vo-cursor vo-focal-cursor" />
          </div>

          {focused && !noResults && (
            <div className="vo-meta">
              <div className="vo-meta-item">
                <span className="vo-meta-key">TAG</span>
                <span className="vo-meta-val">{focused.tag}</span>
              </div>
              <div className="vo-meta-item">
                <span className="vo-meta-key">TIPO</span>
                <span className="vo-meta-val">{focused.gloss}</span>
              </div>
              {focused.ex && (
                <div className="vo-meta-item vo-meta-right">
                  <span className="vo-meta-key">EJEMPLO</span>
                  <span className="vo-meta-val vo-meta-ex" style={{ color: ACCENT }}>{focused.ex}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: search + option list */}
      <div className={`vo-right vo-noscroll${search ? ' has-search' : ''}`}>
        {search && (
          <TopicSearch
            query={query}
            onQueryChange={search.onQueryChange}
            resultCount={results.length}
            hasQuery={hasQuery}
            listboxId={LISTBOX_ID}
            activeOptionId={focused ? `vo-opt-${focused.id}` : undefined}
            inputRef={search.inputRef}
            onArrow={moveFocus}
            onCommit={commit}
            onEscape={search.onEscape}
          />
        )}

        <div className="vo-options-label" style={{ color: INK3 }} aria-hidden="true">
          {listLabel}
        </div>

        {noResults ? (
          <div className="vo-search-empty" role="status">
            <p className="vo-search-empty-title">nada para «{query.trim()}»</p>
            <div className="vo-search-suggestions">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  type="button"
                  className="vo-search-suggestion"
                  onClick={() => search.onQueryChange(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div
            className="vo-options-list"
            id={hasQuery ? LISTBOX_ID : undefined}
            role={hasQuery ? 'listbox' : undefined}
            aria-label={hasQuery ? 'Resultados de la búsqueda' : undefined}
          >
            {visibleOptions.map((opt, i) => (
              <VoOptionRow
                key={opt.id ?? i}
                option={opt}
                index={i}
                active={i === safeIdx}
                asListboxOption={hasQuery}
                optionId={`vo-opt-${opt.id}`}
                matchRanges={hasQuery ? results[i]?.ranges : null}
                onFocus={setFocusIdx}
                onSelect={onSelect}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default StepView
