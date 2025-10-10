import React, { useEffect, useState, useRef } from 'react'
import { getSafeMoodTenseLabels } from '../../lib/utils/moodTenseValidator.js'

/**
 * ReverseInputs.jsx
 * Presentational component for Reverse Mode inputs in Drill.
 * Encapsulates the reverse UI and submission flow.
 */
export default function ReverseInputs({
  currentItem,
  inSpecific,
  showAccentKeys = true,
  onSubmit, // (resultObj) => void
  onContinue, // () => void
  result,
  specialChars = ['á', 'é', 'í', 'ó', 'ú', 'ñ', 'ü']
}) {
  const [infinitiveGuess, setInfinitiveGuess] = useState('')
  const [personGuess, setPersonGuess] = useState('')
  const [moodGuess, setMoodGuess] = useState('')
  const [tenseGuess, setTenseGuess] = useState('')

  const inputRef = useRef(null)

  const showPersonField = currentItem?.mood !== 'nonfinite'
  const showMoodField = !inSpecific
  const showTenseField = !inSpecific

  useEffect(() => {
    setInfinitiveGuess('')
    setPersonGuess('')
    setMoodGuess('')
    setTenseGuess('')
    // Autofocus infinitive input when reverse mode loads
    if (inputRef.current) inputRef.current.focus()
  }, [currentItem?.id, inSpecific])

  const personOptions = [
    { v: '1s', l: 'yo' },
    { v: '2s_tu', l: 'tú' },
    { v: '2s_vos', l: 'vos' },
    { v: '3s', l: 'él/ella/usted' },
    { v: '1p', l: 'nosotros' },
    { v: '2p_vosotros', l: 'vosotros' },
    { v: '3p', l: 'ellos/ustedes' }
  ]

  const moodOptions = [
    { v: 'indicative', l: 'Indicativo' },
    { v: 'subjunctive', l: 'Subjuntivo' },
    { v: 'imperative', l: 'Imperativo' },
    { v: 'conditional', l: 'Condicional' },
    { v: 'nonfinite', l: 'No Finito' }
  ]

  const tenseOptionsByMood = {
    indicative: ['pres', 'pretPerf', 'pretIndef', 'impf', 'plusc', 'fut', 'futPerf'],
    subjunctive: ['subjPres', 'subjImpf', 'subjPerf', 'subjPlusc'],
    imperative: ['impAff', 'impNeg', 'impMixed'],
    conditional: ['cond', 'condPerf'],
    nonfinite: ['ger', 'part', 'nonfiniteMixed']
  }

  const resolveMoodForLabels = (moodOverride) => {
    if (moodOverride) return moodOverride
    if (showMoodField) {
      return moodGuess || currentItem?.mood || ''
    }
    return currentItem?.mood || ''
  }

  const getTenseLabel = (tense, moodOverride) => {
    const moodForLabel = resolveMoodForLabels(moodOverride)
    return getSafeMoodTenseLabels(moodForLabel, tense).tenseLabel
  }

  const handleReverseKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (!result) {
        doSubmit()
      } else {
        onContinue && onContinue()
      }
    }
  }

  const doSubmit = () => {
    if (!infinitiveGuess.trim()) return
    if (showPersonField && !personGuess) return
    if (showMoodField && !moodGuess) return
    if (showTenseField && !tenseGuess) return

    const expected = {
      value: currentItem?.value || currentItem?.form?.value || '',
      lemma: currentItem?.lemma || '',
      mood: currentItem?.mood || '',
      tense: currentItem?.tense || '',
      person: currentItem?.person || ''
    }

    const okInf = expected.lemma
      ? expected.lemma.toLowerCase() === infinitiveGuess.trim().toLowerCase()
      : false

    const key = `${expected.mood}|${expected.tense}`
    const EQUIV = {
      'subjunctive|subjImpf': [['1s', '3s']],
      'subjunctive|subjPres': [['1s', '3s']],
      'subjunctive|subjPerf': [['1s', '3s']],
      'subjunctive|subjPlusc': [['1s', '3s']],
      'indicative|impf': [['1s', '3s']],
      'indicative|plusc': [['1s', '3s']],
      'conditional|cond': [['1s', '3s']],
      'conditional|condPerf': [['1s', '3s']]
    }
    const groups = EQUIV[key] || []
    const sameGroup = groups.some((g) => g.includes(expected.person) && g.includes(personGuess))
    const okPerson = showPersonField
      ? expected.person
        ? expected.person === personGuess || sameGroup
        : false
      : true
    const okMood = showMoodField ? expected.mood === moodGuess : true
    const okTense = showTenseField ? expected.tense === tenseGuess : true
    const correct = okInf && okPerson && okMood && okTense

    const resultObj = {
      correct,
      isAccentError: false,
      targets: [
        `${expected.lemma} · ${expected.mood}/${expected.tense} · ${expected.person}`
      ]
    }

    onSubmit && onSubmit(resultObj)
  }

  const insertChar = (char) => setInfinitiveGuess((prev) => prev + char)

  return (
    <div className="reverse-container">
      <div className="reverse-badge">Modo Inverso</div>
      <div className="reverse-subtle">
        Descubrí infinitivo, persona, modo y tiempo desde la forma
      </div>
      <div className="reverse-divider" />

      <div className={`reverse-grid ${showMoodField || showTenseField ? '' : 'reverse-grid-single'}`}>
        <div className="reverse-field">
          <label className="reverse-label">Infinitivo</label>
          <input
            ref={inputRef}
            className="reverse-input"
            value={infinitiveGuess}
            onChange={(e) => setInfinitiveGuess(e.target.value)}
            placeholder="Escribí el infinitivo..."
            onKeyDown={handleReverseKeyDown}
            autoFocus
          />
        </div>

        {showPersonField && (
          <div className="reverse-field">
            <label className="reverse-label">Persona</label>
            <select
              className="reverse-select"
              value={personGuess}
              onChange={(e) => setPersonGuess(e.target.value)}
              onKeyDown={handleReverseKeyDown}
            >
              <option value="">Seleccioná persona...</option>
              {personOptions.map((p) => (
                <option key={p.v} value={p.v}>
                  {p.l}
                </option>
              ))}
            </select>
          </div>
        )}

        {showMoodField && (
          <div className="reverse-field">
            <label className="reverse-label">Modo</label>
            <select
              className="reverse-select"
              value={moodGuess}
              onChange={(e) => {
                setMoodGuess(e.target.value)
                setTenseGuess('')
              }}
              onKeyDown={handleReverseKeyDown}
            >
              <option value="">Seleccioná modo...</option>
              {moodOptions.map((m) => (
                <option key={m.v} value={m.v}>
                  {m.l}
                </option>
              ))}
            </select>
          </div>
        )}

        {showTenseField && (
          <div className="reverse-field">
            <label className="reverse-label">Tiempo</label>
            <select
              className="reverse-select"
              value={tenseGuess}
              onChange={(e) => setTenseGuess(e.target.value)}
              onKeyDown={handleReverseKeyDown}
              disabled={!moodGuess}
            >
              <option value="">Seleccioná tiempo...</option>
              {(tenseOptionsByMood[moodGuess] || []).map((t) => (
                <option key={t} value={t}>
                  {getTenseLabel(t, moodGuess)}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {showAccentKeys && (
        <div className="accent-keypad" style={{ marginTop: '1rem' }}>
          {specialChars.map((ch) => (
            <button
              key={ch}
              type="button"
              className="accent-key"
              onClick={() => insertChar(ch)}
              tabIndex={-1}
            >
              {ch}
            </button>
          ))}
        </div>
      )}

      <div className="action-buttons" style={{ marginTop: '1rem' }}>
        {!result ? (
          <button
            className="btn"
            onClick={doSubmit}
            disabled={!(
              infinitiveGuess.trim() &&
              (!showPersonField || personGuess) &&
              (!showMoodField || moodGuess) &&
              (!showTenseField || tenseGuess)
            )}
          >
            Verificar
          </button>
        ) : (
          <button className="btn" onClick={() => onContinue && onContinue()}>
            Continuar
          </button>
        )}
      </div>
    </div>
  )
}
