import React, { useEffect, useMemo, useRef, useState, useCallback, Suspense } from 'react'
import { useSettings } from '../../state/settings.js'
import {
  FUTURE_CONDITIONAL_ROOTS,
  IRREGULAR_GERUNDS,
  IRREGULAR_PARTICIPLES,
  buildFutureConditionalForm,
  getPronounLabel
} from '../../lib/data/irregularPatterns.js'

import { TENSE_LABELS, formatMoodTense } from '../../lib/utils/verbLabels.js'
import { normalize } from '../../lib/utils/accentUtils.js'
import AccentKeypad from '../shared/AccentKeypad.jsx'
import './LearningDrill.css'
import './IrregularRootDrill.css'
import '../onboarding/OnboardingFlow.css'

const ACCENT = '#ff4d1c'
const INK    = '#f4f1ea'
const INK2   = '#6e6a60'
const INK3   = '#2a2823'
import { highlightStemVowel } from './highlightHelpers.js'

import { safeLazy } from '../../lib/utils/lazyImport.js';

const PronunciationPanel = safeLazy(() => import('../drill/PronunciationPanelSafe.jsx'))

const ROOT_FAMILY_ID = 'LEARNING_FUT_COND_IRREGULAR'
const GERUND_FAMILY_ID = 'LEARNING_IRREG_GERUNDS'
const PARTICIPLE_FAMILY_ID = 'LEARNING_IRREG_PARTICIPLES'

const FUTURE_PRONOUN_SEQUENCE = ['1s', '2s_tu', '3s']

function buildFutureCondQuestions(tenseKey, useVoseo) {
  const pronouns = FUTURE_PRONOUN_SEQUENCE.map((p) => (p === '2s_tu' && useVoseo ? '2s_vos' : p))
  return FUTURE_CONDITIONAL_ROOTS.map((item, idx) => ({
    type: 'future_cond',
    lemma: item.lemma,
    displayRoot: item.root,
    pronoun: pronouns[idx % pronouns.length],
    tenseKey
  }))
}

function buildGerundQuestions() {
  return IRREGULAR_GERUNDS.map(({ lemma, form }) => ({
    type: 'gerund',
    lemma,
    targetForms: [form]
  }))
}

function buildParticipleQuestions() {
  return IRREGULAR_PARTICIPLES.map(({ lemma, form, alt }) => ({
    type: 'participle',
    lemma,
    targetForms: alt ? [form, ...alt] : [form]
  }))
}

function normalizeAnswer(value) {
  return normalize(value || '').trim().toLowerCase()
}

function IrregularRootDrill({
  tense,
  selectedFamilies = [],
  duration,
  onBack,
  onFinish,
  onPhaseComplete,
  onHome,
  onGoToProgress
}) {
  const settings = useSettings()
  const useVoseo = settings.useVoseo === true
  const containerRef = useRef(null)
  const inputRef = useRef(null)
  const [showPronunciation, setShowPronunciation] = useState(false)
  const [showAccentKeypad, setShowAccentKeypad] = useState(false)
  const pronunciationPanelRef = useRef(null)
  const handleFinishRef = useRef(handleFinish)
  handleFinishRef.current = handleFinish

  const mode = useMemo(() => {
    if (selectedFamilies.includes(ROOT_FAMILY_ID) && (tense?.tense === 'fut' || tense?.tense === 'cond')) {
      return 'future_cond'
    }
    if (selectedFamilies.includes(GERUND_FAMILY_ID) || tense?.tense === 'ger') {
      return 'gerund'
    }
    if (selectedFamilies.includes(PARTICIPLE_FAMILY_ID) || tense?.tense === 'part') {
      return 'participle'
    }
    return 'default'
  }, [selectedFamilies, tense])

  const [questions, setQuestions] = useState([])
  const [index, setIndex] = useState(0)
  const [inputValue, setInputValue] = useState('')
  const [status, setStatus] = useState('idle') // idle | correct | incorrect
  const [stats, setStats] = useState({ correct: 0, total: 0 })
  const [timeLeft, setTimeLeft] = useState(duration ? duration * 60 : null)

  useEffect(() => {
    let built = []
    if (mode === 'future_cond') {
      built = buildFutureCondQuestions(tense?.tense, useVoseo)
    } else if (mode === 'gerund') {
      built = buildGerundQuestions()
    } else if (mode === 'participle') {
      built = buildParticipleQuestions()
    }
    setQuestions(built)
    setIndex(0)
    setInputValue('')
    setStats({ correct: 0, total: 0 })
    setStatus('idle')
  }, [mode, tense, useVoseo])

  useEffect(() => {
    if (!timeLeft || timeLeft <= 0) return
    const timer = setTimeout(() => {
      setTimeLeft(prev => (prev && prev > 1) ? prev - 1 : 0)
    }, 1000)
    return () => clearTimeout(timer)
  }, [timeLeft])

  useEffect(() => {
    if (timeLeft === 0) {
      handleFinishRef.current(stats)
    }
  }, [timeLeft, stats])

  const currentQuestion = questions[index] || null
  const tenseLabel = tense ? TENSE_LABELS[tense.tense] || formatMoodTense(tense.mood, tense.tense) : ''

  const renderFallback = (title, body) => (
    <div className="verbos-onboarding">
      <div className="vo-grid" aria-hidden="true" />
      <div className="vo-vignette" aria-hidden="true" />
      <header className="vo-header">
        <div className="vo-logo" onClick={onBack} title="Volver" style={{ cursor:'pointer' }}>
          <div className="vo-logo-dot" style={{ background: ACCENT }} />
          <span className="vo-logo-name">VERB<span style={{ color: ACCENT }}>/</span>OS</span>
          <span style={{ marginLeft: 8 }}>drill</span>
        </div>
      </header>
      <div style={{ position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',maxWidth:400,textAlign:'center',padding:32 }}>
        <div style={{ fontFamily:'Inter Tight,sans-serif',fontSize:24,fontWeight:900,fontStyle:'italic',color:INK,marginBottom:16 }}>{title}</div>
        <div style={{ fontFamily:'JetBrains Mono,monospace',fontSize:11,color:INK2,letterSpacing:'0.1em',marginBottom:24 }}>{body}</div>
        <button className="ld-confirm-btn" onClick={onBack}>← volver</button>
      </div>
      <footer className="vo-footer">
        <div className="vo-footer-hints"><span><em>←</em> volver</span></div>
        <div>DRILL</div><div>—</div>
      </footer>
    </div>
  )

  if (mode === 'default') {
    return renderFallback('Selección inválida', 'No se encontraron patrones irregulares específicos para este conjunto.')
  }

  if (!currentQuestion) {
    return renderFallback('Material en preparación', 'Todavía no tenemos ejemplos irregulares cargados para este conjunto.')
  }

  function getExpectedAnswers(question) {
    if (question.type === 'future_cond') {
      const expected = buildFutureConditionalForm(question.displayRoot, question.tenseKey, question.pronoun)
      return [expected]
    }
    return question.targetForms || []
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (!currentQuestion) return
    const expectedAnswers = getExpectedAnswers(currentQuestion)
    const userNormalized = normalizeAnswer(inputValue)
    const isCorrect = expectedAnswers.some((ans) => normalizeAnswer(ans) === userNormalized)
    const nextStats = {
      correct: stats.correct + (isCorrect ? 1 : 0),
      total: stats.total + 1
    }

    setStatus(isCorrect ? 'correct' : 'incorrect')
    setStats(nextStats)

    setTimeout(() => {
      const nextIndex = index + 1
      if (nextIndex >= questions.length) {
        handleFinish(nextStats)
      } else {
        setIndex(nextIndex)
        setInputValue('')
        setStatus('idle')
      }
    }, 900)
  }

  function handleFinish(summary = stats) {
    if (onPhaseComplete) {
      onPhaseComplete(summary)
    } else if (onFinish) {
      onFinish(summary)
    }
  }

  const handleTogglePronunciation = useCallback((show = null) => {
    // Si el show es explícito (desde botón cerrar), úsalo
    if (show !== null) {
      if (show === false) {
        setShowPronunciation(false)
      } else {
        setShowPronunciation(true)
      }
      return
    }

    // Lógica del click en el ícono de boca
    if (!showPronunciation) {
      // Panel cerrado → Abrir panel (la grabación se inicia automáticamente en el panel)
      setShowPronunciation(true)
    } else {
      // Panel abierto → Toggle grabación (NO cerrar panel)
      if (pronunciationPanelRef.current?.toggleRecording) {
        pronunciationPanelRef.current.toggleRecording()
      }
    }
  }, [showPronunciation])

  // Create current item for pronunciation panel
  const currentItem = useMemo(() => {
    if (!currentQuestion) return null;

    // Diferentes formatos según el tipo de ejercicio
    if (currentQuestion.type === 'future_cond') {
      const form = buildFutureConditionalForm(currentQuestion.lemma, currentQuestion.displayRoot, currentQuestion.tenseKey, currentQuestion.pronoun);
      return {
        verb: currentQuestion.lemma,
        mood: currentQuestion.tenseKey === 'fut' ? 'indicativo' : 'condicional',
        tense: currentQuestion.tenseKey,
        person: currentQuestion.pronoun,
        expectedValue: form,
        prompt: `${getPronounLabel(currentQuestion.pronoun, useVoseo)} ${currentQuestion.lemma}`
      };
    } else if (currentQuestion.type === 'gerund') {
      return {
        verb: currentQuestion.lemma,
        mood: 'nonfinite',
        tense: 'ger',
        person: null,
        expectedValue: currentQuestion.targetForms[0],
        prompt: `Gerundio de ${currentQuestion.lemma}`
      };
    } else if (currentQuestion.type === 'participle') {
      return {
        verb: currentQuestion.lemma,
        mood: 'nonfinite',
        tense: 'part',
        person: null,
        expectedValue: currentQuestion.targetForms[0],
        prompt: `Participio de ${currentQuestion.lemma}`
      };
    }
    return null;
  }, [currentQuestion, useVoseo])

  const handleDrillResult = (isCorrect, accuracy, _extra = {}) => {
    // Handle pronunciation result similar to typing result
    if (isCorrect) {
      setStatus('correct')
    } else {
      setStatus('incorrect')
    }

    // Update stats immediately
    const nextStats = {
      correct: stats.correct + (isCorrect ? 1 : 0),
      total: stats.total + 1
    }
    setStats(nextStats)
  }

  const handleContinueFromPronunciation = () => {
    // This will be called by the pronunciation panel after auto-advance
    // Continue to next question
    const nextIndex = index + 1
    if (nextIndex >= questions.length) {
      handleFinish(stats)
    } else {
      setIndex(nextIndex)
      setInputValue('')
      setStatus('idle')
    }
  }

  function renderFutureCondDetails(question) {
    const label = getPronounLabel(question.pronoun, useVoseo)
    const ending = buildFutureConditionalForm('', question.tenseKey, question.pronoun) || ''
    const endingDisplay = ending.replace(/^-/, '')
    return (
      <div className="root-meta">
        <div className="root-line">
          <span className="hint-label">Pronombre objetivo:</span>
          <span className="hint-value">{label}</span>
        </div>
        <div className="root-line">
          <span className="hint-label">Raíz irregular:</span>
          <span className="root-highlight">{question.displayRoot}</span>
        </div>
        <div className="root-line">
          <span className="hint-label">Terminación regular:</span>
          <span className="hint-value">{endingDisplay}</span>
        </div>
        <p className="hint-note">Escribe la forma completa combinando la raíz irregular con la terminación regular.</p>
      </div>
    )
  }

  function renderNonFiniteDetails(question) {
    const forms = getExpectedAnswers(question)
    const alternates = forms.slice(1)
    return (
      <div className="root-meta">
        <div className="root-line">
          <span className="hint-label">Forma irregular</span>
          <span className="nonfinite-highlight">{forms[0]}</span>
        </div>
        {alternates.length > 0 && (
          <p className="hint-note alternate">También se acepta: {alternates.join(', ')}</p>
        )}
      </div>
    )
  }

  const irdHighlight = highlightStemVowel(currentQuestion.lemma)

  return (
    <div className="verbos-onboarding" ref={containerRef}>
      <div className="vo-grid" aria-hidden="true" />
      <div className="vo-vignette" aria-hidden="true" />
      {[{top:56,left:12},{top:56,right:12},{bottom:44,left:12},{bottom:44,right:12}].map((pos,i) => (
        <div key={i} className="vo-crosshair" style={pos}>
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
            <path d="M0 7H14M7 0V14" stroke={ACCENT} strokeWidth="1" />
          </svg>
        </div>
      ))}

      <header className="vo-header">
        <div className="vo-logo" onClick={onBack} title="Volver" style={{ cursor:'pointer' }}>
          <div className="vo-logo-dot" style={{ background: ACCENT }} />
          <span className="vo-logo-name">VERB<span style={{ color: ACCENT }}>/</span>OS</span>
          <span style={{ marginLeft: 8 }}>drill</span>
        </div>
        <div className="vo-breadcrumb">
          <span className="vo-breadcrumb-label">{tenseLabel.toLowerCase()} </span>
          <span className="vo-breadcrumb-sep">/</span>
          <span className="vo-breadcrumb-val"> irregulares</span>
        </div>
        <div style={{ display:'flex',gap:16,fontFamily:'JetBrains Mono,monospace',fontSize:10,letterSpacing:'0.12em',textTransform:'uppercase',color:INK2 }}>
          {timeLeft != null && <span>TIEMPO <span style={{ color: INK }}>{Math.max(timeLeft,0)}s</span></span>}
          <span>{Math.min(index+1,questions.length)}<span style={{ color:INK3 }}>/{questions.length}</span></span>
          <span>✓ <span style={{ color: INK }}>{stats.correct}</span></span>
        </div>
      </header>

      {showPronunciation && (
        <Suspense fallback={null}>
          <PronunciationPanel
            ref={pronunciationPanelRef}
            currentItem={currentItem}
            onClose={() => handleTogglePronunciation(false)}
            handleResult={handleDrillResult}
            onContinue={handleContinueFromPronunciation}
          />
        </Suspense>
      )}

      <div className="ld-main eds-main">
        <div className="ld-card">

          {/* Verb focal */}
          <div className="ld-verb-focal">
            {irdHighlight.hasHighlight ? (
              <>
                {irdHighlight.beforeVowel}
                <span style={{ color: ACCENT }}>{irdHighlight.vowel.toUpperCase()}</span>
                {irdHighlight.afterVowel}
                <span style={{ color: ACCENT, opacity: 0.7 }}>{irdHighlight.ending.toUpperCase()}</span>
              </>
            ) : currentQuestion.lemma}
          </div>

          {/* Hint block */}
          <div className="ird-hint-block">
            {mode === 'future_cond' && renderFutureCondDetails(currentQuestion)}
            {mode !== 'future_cond' && renderNonFiniteDetails(currentQuestion)}
          </div>

          {/* Input */}
          <form className="ld-input-wrap" onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              id="irregular-answer"
              autoComplete="off"
              className={`ld-input ${status === 'correct' ? 'correct' : status === 'incorrect' ? 'incorrect' : ''}`}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="forma correcta..."
              autoFocus
            />
            {status !== 'idle' && (
              <div className={`ld-result-bar ${status}`}>
                {status === 'correct'
                  ? <span className="ld-correct">✓ perfecto</span>
                  : <span className="ld-incorrect">→ <strong>{getExpectedAnswers(currentQuestion)[0]}</strong></span>
                }
              </div>
            )}
          </form>

          {/* Accent keypad */}
          {showAccentKeypad && (
            <AccentKeypad targetRef={inputRef} onValueChange={setInputValue} />
          )}

          {/* Action */}
          <div className="ld-actions">
            <button type="button" className="ld-confirm-btn" onClick={handleSubmit} disabled={!inputValue.trim() || status !== 'idle'}>
              confirmar
            </button>
          </div>
        </div>

        {/* Utilities */}
        <div className="ld-utils">
          <button className="ld-util-btn" onClick={() => setShowAccentKeypad(v => !v)} title="Tildes" style={{ background: showAccentKeypad ? ACCENT : 'transparent', color: showAccentKeypad ? '#0c0c0c' : INK2 }}>Ñ</button>
          <button className="ld-util-btn" onClick={() => handleTogglePronunciation()} title="Pronunciación">◉</button>
          {onGoToProgress && <button className="ld-util-btn" onClick={onGoToProgress} title="Métricas">⬡</button>}
          {onHome && <button className="ld-util-btn" onClick={onHome} title="Inicio">⌂</button>}
        </div>
      </div>

      <footer className="vo-footer">
        <div className="vo-footer-hints">
          <span><em>↵</em> confirmar</span>
          <span><em>←</em> volver</span>
        </div>
        <div>{tenseLabel.toUpperCase()} · IRREGULARES</div>
        <div>DRILL · OK</div>
      </footer>
    </div>
  )
}

export default IrregularRootDrill
