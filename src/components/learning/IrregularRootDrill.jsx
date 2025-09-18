import React, { useEffect, useMemo, useState } from 'react'
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
import './IrregularRootDrill.css'

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

  if (mode === 'default') {
    return (
      <div className="irregular-root-drill">
        <div className="root-card">
          <h2>Selección inválida</h2>
          <p>No se encontraron patrones irregulares específicos para este conjunto.</p>
          <div className="root-actions">
            <button onClick={onBack} className="secondary">Volver</button>
          </div>
        </div>
      </div>
    )
  }

  const currentQuestion = questions[index] || null
  const tenseLabel = tense ? TENSE_LABELS[tense.tense] || formatMoodTense(tense.mood, tense.tense) : ''

  if (!currentQuestion) {
    return (
      <div className="irregular-root-drill">
        <div className="root-card">
          <h2>Material en preparación</h2>
          <p>Todavía no tenemos ejemplos irregulares cargados para este conjunto.</p>
          <div className="root-actions">
            <button onClick={onBack} className="secondary">Volver</button>
          </div>
        </div>
      </div>
    )
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
        <p className="hint-note">Memoriza la forma irregular más frecuente para este verbo.</p>
        {alternates.length > 0 && (
          <p className="hint-note alternate">También se acepta: {alternates.join(', ')}</p>
        )}
      </div>
    )
  }

  return (
    <div className="irregular-root-drill">
      <header className="root-header">
        <div>
          <h2>{tenseLabel} · enfoque en irregularidades</h2>
          <p>Practica saltando entre raíces irregulares clave sin repetir todas las personas.</p>
        </div>
        <div className="header-actions">
          {onHome && <button className="ghost" onClick={onHome}>Inicio</button>}
          {onGoToProgress && <button className="ghost" onClick={onGoToProgress}>Progreso</button>}
        </div>
      </header>

      {currentQuestion && (
        <main className={`root-card status-${status}`}>
          <div className="card-heading">
            <span className="card-label">Verbo</span>
            <h3>{currentQuestion.lemma}</h3>
          </div>

          {mode === 'future_cond' && renderFutureCondDetails(currentQuestion)}
          {mode !== 'future_cond' && renderNonFiniteDetails(currentQuestion)}

          <form className="root-form" onSubmit={handleSubmit}>
            <label htmlFor="irregular-answer" className="sr-only">Tu respuesta</label>
            <input
              id="irregular-answer"
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              placeholder="Escribe la forma correcta"
              autoFocus
            />
            <div className="root-actions">
              <button type="submit">Validar</button>
              {onBack && <button type="button" className="secondary" onClick={onBack}>Volver</button>}
            </div>
          </form>

          <div className={`feedback ${status}`}>
            {status === 'correct' && '¡Bien! La raíz irregular está dominada.'}
            {status === 'incorrect' && (
              <span>Respuesta esperada: {getExpectedAnswers(currentQuestion)[0]}</span>
            )}
          </div>

          <footer className="root-footer">
            <span>Progreso: {Math.min(index + 1, questions.length)} / {questions.length}</span>
            <span>Aciertos: {stats.correct} de {stats.total}</span>
            {timeLeft != null && (
              <span>Tiempo restante: {Math.max(timeLeft, 0)}s</span>
            )}
          </footer>
        </main>
      )}
    </div>
  )
}

export default IrregularRootDrill
