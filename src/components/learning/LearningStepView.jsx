import React, { useState, useEffect, useCallback } from 'react'
import '../onboarding/OnboardingFlow.css'

const ACCENT = '#ff4d1c'
const INK    = '#f4f1ea'
const INK2   = '#6e6a60'
const INK3   = '#2a2823'
const LINE   = '#1f1d18'

function Crosshairs() {
  const positions = [
    { top: 56, left: 12 },
    { top: 56, right: 12 },
    { bottom: 44, left: 12 },
    { bottom: 44, right: 12 },
  ]
  return positions.map((pos, i) => (
    <div key={i} className="vo-crosshair" style={pos}>
      <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
        <path d="M0 7H14M7 0V14" stroke={ACCENT} strokeWidth="1" />
      </svg>
    </div>
  ))
}

function StepPanel({ stepConfig, onSelect, selectedId }) {
  const [focusIdx, setFocusIdx] = useState(0)
  const { n, kicker, prompt, aux, options } = stepConfig

  useEffect(() => { setFocusIdx(0) }, [stepConfig])

  useEffect(() => {
    const handle = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setFocusIdx(i => Math.min(options.length - 1, i + 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setFocusIdx(i => Math.max(0, i - 1))
      } else if (e.key === 'Enter' || e.key === 'ArrowRight') {
        e.preventDefault()
        onSelect(options[focusIdx])
      } else if (/^[1-9]$/.test(e.key)) {
        const idx = parseInt(e.key, 10) - 1
        if (idx < options.length) { setFocusIdx(idx); onSelect(options[idx]) }
      }
    }
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [focusIdx, options, onSelect])

  const focused = options[focusIdx] || options[0]

  const len = (focused?.label || '').length
  const lenFactor = len <= 6 ? 1 : len <= 10 ? 0.78 : len <= 16 ? 0.58 : len <= 22 ? 0.44 : 0.34
  const focalSize = `clamp(44px, ${Math.max(5, 12 * lenFactor)}vw, ${Math.round(180 * lenFactor)}px)`

  return (
    <div className="vo-step vo-lift-in">
      {/* LEFT: focal word */}
      <div className="vo-left">
        <div className="vo-step-tag">──── {kicker}</div>
        <div className="vo-watermark" aria-hidden="true">{n}</div>

        <div className="vo-left-bottom">
          <div className="vo-aux">▸ {aux}</div>
          <div className="vo-prompt">{prompt}</div>

          <div
            key={focused?.id ?? 'x'}
            className="vo-focal-word vo-scan-in"
            style={{ fontSize: focalSize, color: ACCENT }}
          >
            {focused?.label}
            <span
              className="vo-cursor"
              style={{
                display: 'inline-block',
                width: '0.07em',
                height: '0.68em',
                background: ACCENT,
                marginLeft: '0.05em',
                verticalAlign: 'baseline',
                transform: 'translateY(-0.05em)',
              }}
            />
          </div>

          {focused && (
            <div className="vo-meta">
              <div className="vo-meta-item">
                <span className="vo-meta-key">TAG</span>
                <span className="vo-meta-val">{focused.tag}</span>
              </div>
              {focused.gloss && (
                <div className="vo-meta-item">
                  <span className="vo-meta-key">TIPO</span>
                  <span className="vo-meta-val">{focused.gloss}</span>
                </div>
              )}
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

      {/* RIGHT: option list */}
      <div className="vo-right vo-noscroll">
        <div className="vo-options-label">
          OPCIONES · {String(options.length).padStart(2, '0')} ────
        </div>

        <div className="vo-options-list">
          {options.map((opt, i) => {
            const active = i === focusIdx
            const selected = selectedId != null && opt.id === selectedId
            return (
              <div
                key={opt.id ?? i}
                className="vo-option"
                role="button"
                tabIndex={0}
                aria-label={opt.label}
                style={{ paddingLeft: active ? 76 : 52, paddingTop: 14, paddingBottom: 14 }}
                onMouseEnter={() => setFocusIdx(i)}
                onClick={() => onSelect(opt)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(opt) }}
              >
                <div className="vo-option-num" style={{ color: active || selected ? ACCENT : INK2 }}>
                  <span
                    className="vo-option-num-box"
                    style={{
                      borderColor: active || selected ? ACCENT : LINE,
                      background: selected && !active ? 'rgba(255,77,28,0.12)' : 'transparent',
                    }}
                  >
                    {selected && !active ? '✓' : i + 1}
                  </span>
                  {active && <span className="vo-option-tick" style={{ background: ACCENT }} />}
                </div>

                <div
                  className="vo-option-label"
                  style={{
                    fontSize: '26px',
                    fontWeight: active ? 700 : selected ? 500 : 400,
                    fontStyle: active ? 'italic' : 'normal',
                    color: active || selected ? INK : INK2,
                  }}
                >
                  {opt.label}
                </div>

                <div className="vo-option-tag" style={{ color: active || selected ? ACCENT : INK2 }}>
                  {selected && !active ? '← confirmar' : opt.tag}
                </div>

                <div
                  className="vo-option-arrow"
                  style={{
                    color: ACCENT,
                    opacity: active ? 1 : 0,
                    transform: active ? 'translateX(0)' : 'translateX(-6px)',
                  }}
                >
                  →
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/**
 * LearningStepView — shell VERB/OS para los pasos del learning module.
 *
 * Props:
 *   stepConfig  { n, kicker, prompt, aux, options: [{ id, label, tag, gloss, ex, onSelect }] }
 *   onBack      función para volver
 *   breadcrumb  [{ label, value }] — máx 3 items
 *   stepNum     número del paso actual (ej: 1)
 *   totalSteps  total de pasos (ej: 3)
 */
function LearningStepView({ stepConfig, onBack, breadcrumb = [], stepNum = 1, totalSteps = 3, selectedId }) {
  const handleSelect = useCallback((opt) => {
    opt.onSelect()
  }, [])

  useEffect(() => {
    const fn = (e) => {
      if (e.key === 'Escape' || e.key === 'ArrowLeft') {
        e.preventDefault()
        onBack?.()
      } else if (e.key === 'Backspace' && document.activeElement.tagName !== 'INPUT') {
        e.preventDefault()
        onBack?.()
      }
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [onBack])

  if (!stepConfig) return null

  return (
    <div className="verbos-onboarding">
      <div className="vo-grid" aria-hidden="true" />
      <div className="vo-vignette" aria-hidden="true" />
      <Crosshairs />

      <header className="vo-header">
        <div className="vo-logo" onClick={onBack} title="Volver">
          <div className="vo-logo-dot" style={{ background: ACCENT }} />
          <span className="vo-logo-name">
            VERB<span style={{ color: ACCENT }}>/</span>OS
          </span>
          <span style={{ marginLeft: 8 }}>aprender</span>
        </div>

        <div className="vo-breadcrumb" aria-label="Progreso de aprendizaje">
          {breadcrumb.length === 0
            ? <span style={{ color: INK3 }}>— · —</span>
            : breadcrumb.map((item, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span className="vo-breadcrumb-sep">/</span>}
                <span>
                  <span className="vo-breadcrumb-label">{item.label} </span>
                  <span className="vo-breadcrumb-val">{item.value}</span>
                </span>
              </React.Fragment>
            ))
          }
        </div>

        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: INK2 }}>
          PASO <span style={{ color: INK }}>{String(stepNum).padStart(2, '0')}</span> / {String(totalSteps).padStart(2, '0')}
        </div>
      </header>

      <StepPanel stepConfig={stepConfig} onSelect={handleSelect} selectedId={selectedId} />

      <footer className="vo-footer">
        <div className="vo-footer-hints">
          <span><em>↑↓</em> navegá</span>
          <span><em>↵ / →</em> seleccioná</span>
          <span><em>← / esc</em> volver</span>
        </div>
        <div style={{ color: INK2 }}>{stepConfig.kicker}</div>
        <div>LEARNING · OK</div>
      </footer>
    </div>
  )
}

export default LearningStepView
