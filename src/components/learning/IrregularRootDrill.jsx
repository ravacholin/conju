import React, { useEffect, useMemo, useRef, useState, useCallback, Suspense, lazy } from 'react'
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
import './LearningDrill.css'
import './IrregularRootDrill.css'

const PronunciationPanel = lazy(() => import('../drill/PronunciationPanelSafe.jsx'))

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
  const [entered, setEntered] = useState(false)
  const [showPronunciation, setShowPronunciation] = useState(false)
  const pronunciationPanelRef = useRef(null)

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
    const timer = setTimeout(() => setEntered(true), 10)
    return () => clearTimeout(timer)
  }, [])

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
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (!prev || prev <= 1) {
          clearInterval(timer)
          handleFinish()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [timeLeft])

  const currentQuestion = questions[index] || null
  const tenseLabel = tense ? TENSE_LABELS[tense.tense] || formatMoodTense(tense.mood, tense.tense) : ''

  const renderFallback = (title, body) => (
    <div className="App">
      <header className="header">
        <div className="icon-row">
          <button onClick={onBack} className="icon-btn" title="Volver" aria-label="Volver">
            <img src="/back.png" alt="Volver" className="menu-icon" />
          </button>
          {onGoToProgress && (
            <button onClick={onGoToProgress} className="icon-btn" title="Métricas" aria-label="Métricas">
              <img src="/icons/chart.png" alt="Métricas" className="menu-icon" />
            </button>
          )}
          {onHome && (
            <button onClick={onHome} className="icon-btn" title="Inicio" aria-label="Inicio">
              <img src="/home.png" alt="Inicio" className="menu-icon" />
            </button>
          )}
        </div>
      </header>
      <div className="main-content">
        <div className={`drill-container learning-drill page-transition ${entered ? 'page-in' : ''}`}>
          <div className="irregular-root empty">
            <h2>{title}</h2>
            <p>{body}</p>
            <div className="action-buttons">
              <button className="btn" onClick={onBack}>Volver</button>
            </div>
          </div>
        </div>
      </div>
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

  const handleDrillResult = (isCorrect, accuracy, extra = {}) => {
    // Handle pronunciation result similar to typing result
    if (isCorrect) {
      setStatus('correct')
    } else {
      setStatus('incorrect')
    }

    // Continue to next after delay like normal flow
    setTimeout(() => {
      setStatus('idle')
      setInputValue('')
      setIndex(prev => {
        const newIndex = prev + 1
        if (newIndex >= questions.length) {
          handleFinish({ correct: stats.correct + (isCorrect ? 1 : 0), total: stats.total + 1 })
        } else {
          setStats(prev => ({
            correct: prev.correct + (isCorrect ? 1 : 0),
            total: prev.total + 1
          }))
        }
        return newIndex
      })
    }, 1500)
  }

  const handleContinueFromPronunciation = () => {
    // This will be called by the pronunciation panel after auto-advance
    // The pronunciation panel already handles the delay, so we don't need another one here
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

  return (
    <div className="App" ref={containerRef}>
      <header className="header">
        <div className="icon-row">
          <button onClick={onBack} className="icon-btn" title="Volver" aria-label="Volver">
            <img src="/back.png" alt="Volver" className="menu-icon" />
          </button>
          <button
            onClick={() => handleTogglePronunciation()}
            className="icon-btn"
            title="Práctica de pronunciación"
          >
            <img src="/boca.png" alt="Pronunciación" className="menu-icon" />
          </button>
          {onGoToProgress && (
            <button onClick={onGoToProgress} className="icon-btn" title="Métricas" aria-label="Métricas">
              <img src="/icons/chart.png" alt="Métricas" className="menu-icon" />
            </button>
          )}
          {onHome && (
            <button onClick={onHome} className="icon-btn" title="Inicio" aria-label="Inicio">
              <img src="/home.png" alt="Inicio" className="menu-icon" />
            </button>
          )}
        </div>
      </header>

      {showPronunciation && (
        <Suspense fallback={<div className="loading">Cargando pronunciación...</div>}>
          <PronunciationPanel
            ref={pronunciationPanelRef}
            currentItem={currentItem}
            onClose={() => handleTogglePronunciation(false)}
            handleResult={handleDrillResult}
            onContinue={handleContinueFromPronunciation}
          />
        </Suspense>
      )}

      <div className="main-content">
        <div className={`drill-container learning-drill page-transition ${entered ? 'page-in' : ''}`}>
          <div className="irregular-root-card">
            <div className="drill-header">
              <div>
                <h2>{tenseLabel} · irregularidades clave</h2>
                <p className="drill-subtitle">Practica saltando entre verbos irregulares para fijar las raíces especiales.</p>
              </div>
              {timeLeft != null && (
                <div className="chrono-badge">{Math.max(timeLeft, 0)}s</div>
              )}
            </div>

            <div className="irregular-verb">
              <span className="verb-label">Verbo</span>
              <span className="verb-lemma">{currentQuestion.lemma}</span>
            </div>

            {mode === 'future_cond' && renderFutureCondDetails(currentQuestion)}
            {mode !== 'future_cond' && renderNonFiniteDetails(currentQuestion)}

            <form className="root-form" onSubmit={handleSubmit}>
              <label htmlFor="irregular-answer" className="sr-only">Tu respuesta</label>
              <input
                id="irregular-answer"
                className={`conjugation-input ${status === 'correct' ? 'correct' : status === 'incorrect' ? 'incorrect' : ''}`}
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                placeholder="Escribe la forma correcta"
                autoFocus
              />
              <div className="action-buttons">
                <button type="submit" className="btn" disabled={!inputValue.trim()}>Validar</button>
                {onBack && <button type="button" className="btn secondary" onClick={onBack}>Volver</button>}
              </div>
            </form>

            <div className={`feedback ${status}`}>
              {status === 'correct' && '¡Perfecto! La raíz irregular está dominada.'}
              {status === 'incorrect' && (
                <span>Respuesta esperada: {getExpectedAnswers(currentQuestion)[0]}</span>
              )}
            </div>

            <footer className="root-footer">
              <span>Progreso: {Math.min(index + 1, questions.length)} / {questions.length}</span>
              <span>Aciertos: {stats.correct} de {stats.total}</span>
            </footer>
          </div>
        </div>
      </div>
    </div>
  )
}

export default IrregularRootDrill
