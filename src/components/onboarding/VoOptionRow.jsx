import React from 'react'
import { touchHoverItemProps } from '../../hooks/useTouchHover.js'

/* ── Design tokens (mirrors OnboardingFlow.jsx) ── */
const ACCENT = 'var(--accent-primary)'
const INK = 'var(--text)'
const INK2 = 'var(--muted)'
const INK3 = 'var(--border-strong)'
const LINE = 'var(--border)'

/**
 * Split a label into highlighted / plain segments.
 * `ranges` are indices into the label, produced by computeHighlightRanges.
 */
function renderLabel(label, ranges) {
  if (!ranges || ranges.length === 0) return label

  const parts = []
  let cursor = 0
  ranges.forEach(([start, end], i) => {
    if (start > cursor) parts.push(label.slice(cursor, start))
    parts.push(
      <mark key={`hit-${i}`} className="vo-option-mark">{label.slice(start, end)}</mark>
    )
    cursor = end
  })
  if (cursor < label.length) parts.push(label.slice(cursor))
  return parts
}

/**
 * A single row of the menu's option list.
 *
 * Used both by the normal step options (role="button") and by the search
 * results (role="option" inside a listbox). The role must match the parent
 * container's role, so it is passed in rather than hardcoded.
 */
function VoOptionRow({
  option,
  index,
  active,
  asListboxOption = false,
  optionId,
  matchRanges,
  onFocus,
  onSelect
}) {
  const listboxProps = asListboxOption
    ? { role: 'option', 'aria-selected': active, id: optionId }
    : { role: 'button', tabIndex: 0 }

  return (
    <div
      className={`vo-option${active ? ' is-active' : ''}`}
      aria-label={option.ariaLabel || option.label}
      onMouseEnter={() => onFocus(index)}
      onClick={() => onSelect(option)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect(option)
        }
      }}
      {...listboxProps}
      {...touchHoverItemProps(index)}
    >
      {/* Number box */}
      <div className="vo-option-num" style={{ color: active ? ACCENT : INK3 }}>
        <span className="vo-option-num-box" style={{ borderColor: active ? ACCENT : LINE }}>
          {index + 1}
        </span>
        {active && <span className="vo-option-tick" style={{ background: ACCENT }} />}
      </div>

      {/* Label */}
      <div
        className="vo-option-label"
        style={{
          fontWeight: active ? 700 : 400,
          fontStyle: active ? 'italic' : 'normal',
          color: active ? INK : INK2
        }}
      >
        {renderLabel(option.label, matchRanges)}
      </div>

      {/* Tag */}
      <div className="vo-option-tag" style={{ color: active ? ACCENT : INK3 }}>
        {option.tag}
      </div>

      {/* Arrow */}
      <div
        className="vo-option-arrow"
        style={{
          color: ACCENT,
          opacity: active ? 1 : 0,
          transform: active ? 'translateX(0)' : 'translateX(-6px)'
        }}
      >
        →
      </div>
    </div>
  )
}

export default VoOptionRow
