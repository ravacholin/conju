import React, { useEffect, useMemo, useState } from 'react'
import exerciseContentManager, { EXERCISE_TYPES } from '../../lib/meaningful-practice/content/ExerciseContentManager.js'
import { TimelineExercise } from '../../lib/meaningful-practice/exercises/TimelineExercise.js'
import timelineExercises from '../../data/meaningful-practice/exercises/timeline-exercises.json'

const TENSE_LABELS = {
  pres: 'Presente',
  pretIndef: 'Pretérito indefinido',
  impf: 'Imperfecto',
  fut: 'Futuro',
  cond: 'Condicional',
  pretPerf: 'Pretérito perfecto',
  plusc: 'Pluscuamperfecto'
}

function normalizeTimelineExerciseData(rawExercise, tense) {
  if (!rawExercise) {
    return null
  }

  const events = Array.isArray(rawExercise.events)
    ? rawExercise.events.map((event, index) => ({
        time: event?.time || `Paso ${index + 1}`,
        icon: event?.icon || '•',
        prompt: event?.prompt || event?.text || '',
        context: event?.context || ''
      }))
    : Array.isArray(rawExercise.prompts)
      ? rawExercise.prompts.map((prompt, index) => ({
          time: prompt?.time || `Paso ${index + 1}`,
          icon: prompt?.icon || '•',
          prompt: prompt?.prompt || prompt?.text || '',
          context: prompt?.context || ''
        }))
      : []

  const verbCandidates = Array.isArray(rawExercise.expectedVerbs)
    ? rawExercise.expectedVerbs
    : Array.isArray(rawExercise.prompts)
      ? rawExercise.prompts.flatMap((prompt) => (prompt?.expected || []).filter(Boolean))
      : []

  const expectedVerbs = Array.from(new Set(verbCandidates)).filter(Boolean)

  if (!events.length || !expectedVerbs.length) {
    return null
  }

  return {
    ...rawExercise,
    tense,
    type: EXERCISE_TYPES.TIMELINE,
    events,
    expectedVerbs,
    verbInstructions:
      rawExercise.verbInstructions ||
      `Usa estos verbos en ${TENSE_LABELS[tense] || tense}: ${expectedVerbs.join(', ')}`
  }
}

function extractErrorMessage(error) {
  if (!error) return ''
  if (typeof error === 'string') return error
  if (typeof error.message === 'string') return error.message
  return ''
}

function TimelineMode({ onBack, onHome }) {
  const { availableTenses, cachedExercises } = useMemo(() => {
    const map = new Map()
    const tenses = Object.keys(timelineExercises || {})
    const filtered = []

    tenses.forEach((tense) => {
      const rawExercise = exerciseContentManager.getExerciseForTense(tense, {
        type: EXERCISE_TYPES.TIMELINE,
        includeAlternatives: true
      })
      const normalized = normalizeTimelineExerciseData(rawExercise, tense)
      if (normalized) {
        filtered.push(tense)
        map.set(tense, normalized)
      }
    })

    return {
      availableTenses: filtered,
      cachedExercises: map
    }
  }, [])

  const defaultTense = availableTenses.includes('pretIndef')
    ? 'pretIndef'
    : availableTenses[0] || null

  const [selectedTense, setSelectedTense] = useState(defaultTense)
  const [currentExercise, setCurrentExercise] = useState(null)
  const [currentStep, setCurrentStep] = useState(null)
  const [userResponse, setUserResponse] = useState('')
  const [errors, setErrors] = useState([])
  const [result, setResult] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [initialised, setInitialised] = useState(false)

  useEffect(() => {
    if (!availableTenses.length) {
      setErrors(['No hay ejercicios de línea de tiempo disponibles en este momento.'])
    }
  }, [availableTenses])

  useEffect(() => {
    let cancelled = false

    async function loadExercise() {
      if (!selectedTense) {
        setCurrentExercise(null)
        setCurrentStep(null)
        setResult(null)
        return
      }

      setIsLoading(true)
      setInitialised(false)
      setErrors([])
      setResult(null)

      try {
        const cached = cachedExercises.get(selectedTense)
        const rawExercise = cached ||
          normalizeTimelineExerciseData(
            exerciseContentManager.getExerciseForTense(selectedTense, {
              type: EXERCISE_TYPES.TIMELINE,
              includeAlternatives: true
            }),
            selectedTense
          )

        if (!rawExercise) {
          throw new Error('No se encontró un ejercicio de línea de tiempo para este tiempo verbal.')
        }

        const exercise = new TimelineExercise(rawExercise)
        await exercise.initialize()
        const nextStep = exercise.getNextStep()

        if (!cancelled) {
          setCurrentExercise(exercise)
          setCurrentStep(nextStep)
          setUserResponse('')
          setInitialised(true)
        }
      } catch (error) {
        if (!cancelled) {
          setErrors([error.message || 'No se pudo cargar el ejercicio de línea de tiempo.'])
          setCurrentExercise(null)
          setCurrentStep(null)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadExercise()

    return () => {
      cancelled = true
    }
  }, [selectedTense, cachedExercises])

  const handleSubmit = async (event) => {
    event?.preventDefault()
    if (!currentExercise || isLoading) return

    const trimmed = userResponse.trim()
    if (!trimmed) {
      setErrors(['Escribe tu respuesta antes de enviarla.'])
      return
    }

    setErrors([])
    setIsLoading(true)

    try {
      const response = await currentExercise.processResponse(trimmed)
      setResult(response)

      const responseErrors = Array.isArray(response?.errors)
        ? response.errors.map(extractErrorMessage).filter(Boolean)
        : []

      if (responseErrors.length > 0) {
        setErrors(responseErrors)
      } else {
        setErrors([])
      }
    } catch (error) {
      setErrors([error.message || 'No se pudo evaluar tu respuesta.'])
      setResult(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTenseChange = (event) => {
    setSelectedTense(event.target.value)
  }

  const timelineTitle = currentStep?.title || 'Línea de tiempo'

  return (
    <div className="timeline-mode">
      <header className="timeline-mode__header">
        <h1>Modo línea de tiempo</h1>
        <div className="timeline-mode__nav">
          {typeof onBack === 'function' && (
            <button type="button" onClick={onBack} className="timeline-mode__nav-btn">
              Volver a práctica
            </button>
          )}
          {typeof onHome === 'function' && (
            <button type="button" onClick={onHome} className="timeline-mode__nav-btn">
              Ir al menú
            </button>
          )}
        </div>
      </header>

      <section className="timeline-mode__controls">
        <label>
          Tiempo verbal
          <select
            value={selectedTense || ''}
            onChange={handleTenseChange}
            aria-label="Selecciona el tiempo verbal"
            disabled={!availableTenses.length}
          >
            {availableTenses.map((tense) => (
              <option key={tense} value={tense}>
                {TENSE_LABELS[tense] || tense}
              </option>
            ))}
          </select>
        </label>
      </section>

      {isLoading && !initialised ? (
        <div role="status" className="timeline-mode__loading">
          Cargando ejercicio...
        </div>
      ) : null}

      {currentStep && (
        <section className="timeline-mode__details">
          <h2>{timelineTitle}</h2>
          {currentStep.description ? <p>{currentStep.description}</p> : null}

          <div className="timeline-mode__events">
            <h3>Eventos de la línea de tiempo</h3>
            <ol>
              {currentStep.events.map((event, index) => (
                <li key={`${event.prompt}-${index}`}>
                  <span className="timeline-mode__event-icon" aria-hidden="true">
                    {event.icon}
                  </span>
                  <div className="timeline-mode__event-body">
                    <strong>{event.time}</strong> — {event.prompt}
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {currentStep.expectedVerbs?.length ? (
            <div className="timeline-mode__verbs">
              <h3>Verbos requeridos</h3>
              <p>{currentStep.expectedVerbs.join(', ')}</p>
            </div>
          ) : null}

          {currentStep.instructions ? (
            <p className="timeline-mode__instructions">{currentStep.instructions}</p>
          ) : null}
        </section>
      )}

      <form className="timeline-mode__form" onSubmit={handleSubmit}>
        <label htmlFor="timeline-mode-input">Tu respuesta</label>
        <textarea
          id="timeline-mode-input"
          value={userResponse}
          onChange={(event) => setUserResponse(event.target.value)}
          placeholder={currentStep?.placeholder || 'Escribe tu historia siguiendo la línea de tiempo...'}
          rows={10}
        />

        <div className="timeline-mode__actions">
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Evaluando...' : 'Enviar respuesta'}
          </button>
        </div>
      </form>

      {errors.length > 0 && (
        <section className="timeline-mode__feedback" aria-live="assertive">
          <h3>Revisa tu respuesta</h3>
          <ul>
            {errors.map((error, index) => (
              <li key={`error-${index}`}>{error}</li>
            ))}
          </ul>
        </section>
      )}

      {result && !result.errors?.length && result.analysis && (
        <section className="timeline-mode__analysis" aria-live="polite">
          <h3>Feedback del ejercicio</h3>
          <p>{result.feedback}</p>

          <div className="timeline-mode__analysis-details">
            <p>
              Verbos encontrados: {result.analysis.foundVerbs.join(', ') || 'Ninguno'}
            </p>
            {result.analysis.missingVerbs.length > 0 ? (
              <p>Verbos pendientes: {result.analysis.missingVerbs.join(', ')}</p>
            ) : (
              <p>No faltan verbos por usar. ¡Excelente!</p>
            )}
            <p>Palabras: {result.analysis.wordCount}</p>
          </div>
        </section>
      )}
    </div>
  )
}

export default TimelineMode
