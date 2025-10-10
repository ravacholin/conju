import React, { useEffect, useMemo, useState } from 'react'
import storyData from '../../data/meaningful-practice/exercises/story-building-exercises.json'
import { StoryBuildingExercise } from '../../lib/meaningful-practice/exercises/StoryBuildingExercise.js'
import { EXERCISE_TYPES } from '../../lib/meaningful-practice/core/constants.js'

const TENSE_LABELS = {
  pres: 'Presente',
  pretIndef: 'Pretérito indefinido',
  impf: 'Imperfecto',
  fut: 'Futuro',
  cond: 'Condicional',
  pretPerf: 'Pretérito perfecto',
  plusc: 'Pluscuamperfecto'
}

function buildDeterministicElements(story, required) {
  if (!story?.elements) return []

  const categories = Object.keys(story.elements)
  const categoryIndices = {}
  const selected = []

  while (selected.length < required) {
    let progress = false

    for (const category of categories) {
      const items = story.elements[category]
      if (!items || items.length === 0) {
        continue
      }

      const index = categoryIndices[category] || 0
      const item = items[index % items.length]
      categoryIndices[category] = index + 1

      const alreadySelected = selected.some(
        (entry) => entry.category === category && JSON.stringify(entry.item) === JSON.stringify(item)
      )

      if (!alreadySelected) {
        selected.push({ category, item, used: false })
        progress = true
      }

      if (selected.length >= required) {
        break
      }
    }

    if (!progress) {
      break
    }
  }

  return selected
}

function formatElement(element) {
  if (!element) return ''

  if (typeof element.item === 'string') {
    return element.item
  }

  if (element.item?.name && element.item?.description) {
    return `${element.item.name} — ${element.item.description}`
  }

  return element.item?.name || element.item?.description || ''
}

function getAllStories() {
  const stories = storyData?.storyBuilding || {}
  return Object.values(stories)
}

function StoryMode({ onBack, onHome }) {
  const allStories = useMemo(() => getAllStories(), [])
  const allTenses = useMemo(() => {
    const tenseSet = new Set()
    allStories.forEach((story) => {
      story?.targetTenses?.forEach((tense) => tenseSet.add(tense))
    })
    return Array.from(tenseSet)
      .sort((a, b) => (TENSE_LABELS[a] || a).localeCompare(TENSE_LABELS[b] || b))
  }, [allStories])

  const defaultTense = useMemo(() => {
    if (allTenses.includes('pres')) {
      return 'pres'
    }
    return allTenses[0] || 'pres'
  }, [allTenses])

  const [selectedTense, setSelectedTense] = useState(defaultTense)
  const [selectedStoryId, setSelectedStoryId] = useState(null)
  const [currentExercise, setCurrentExercise] = useState(null)
  const [currentStep, setCurrentStep] = useState(null)
  const [userStory, setUserStory] = useState('')
  const [result, setResult] = useState(null)
  const [errors, setErrors] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [initialised, setInitialised] = useState(false)

  const storiesForTense = useMemo(() => {
    return allStories.filter((story) => story?.targetTenses?.includes(selectedTense))
  }, [allStories, selectedTense])

  useEffect(() => {
    if (!allTenses.includes(selectedTense)) {
      setSelectedTense(defaultTense)
    }
  }, [allTenses, selectedTense, defaultTense])

  useEffect(() => {
    if (!storiesForTense.length) {
      setSelectedStoryId(null)
      setCurrentExercise(null)
      setCurrentStep(null)
      setResult(null)
      return
    }

    if (!storiesForTense.some((story) => story.id === selectedStoryId)) {
      setSelectedStoryId(storiesForTense[0]?.id || null)
    }
  }, [storiesForTense, selectedStoryId])

  useEffect(() => {
    let cancelled = false

    async function prepareExercise() {
      if (!selectedStoryId) {
        setCurrentExercise(null)
        setCurrentStep(null)
        return
      }

      const story = storiesForTense.find((item) => item.id === selectedStoryId)
      if (!story) {
        setCurrentExercise(null)
        setCurrentStep(null)
        return
      }

      setIsLoading(true)
      setErrors([])
      setResult(null)
      setInitialised(false)

      try {
        const exercise = new StoryBuildingExercise({
          ...story,
          type: EXERCISE_TYPES.STORY_BUILDING,
          tense: selectedTense,
          targetTenses: story.targetTenses
        })

        await exercise.initialize()
        exercise.selectedElements = buildDeterministicElements(story, exercise.requiredElements)
        const nextStep = exercise.getNextStep()

        if (!cancelled) {
          setCurrentExercise(exercise)
          setCurrentStep(nextStep)
          setUserStory('')
          setInitialised(true)
        }
      } catch (error) {
        if (!cancelled) {
          setErrors([error.message || 'No se pudo cargar la historia.'])
          setCurrentExercise(null)
          setCurrentStep(null)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    prepareExercise()

    return () => {
      cancelled = true
    }
  }, [selectedStoryId, selectedTense, storiesForTense])

  const handleSubmit = async (event) => {
    event?.preventDefault()
    if (!currentExercise || isLoading) return

    const trimmed = userStory.trim()
    if (!trimmed) {
      setErrors(['Escribe tu historia antes de enviarla.'])
      return
    }

    setErrors([])
    setIsLoading(true)

    try {
      const response = await currentExercise.processResponse(trimmed)
      setResult(response)
      if (response?.errors?.length) {
        setErrors(response.errors)
      } else {
        setErrors([])
      }
    } catch (error) {
      setErrors([error.message || 'No se pudo evaluar la historia.'])
      setResult(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTenseChange = (event) => {
    setSelectedTense(event.target.value)
  }

  const handleStoryChange = (event) => {
    setSelectedStoryId(event.target.value)
  }

  const storyTitle = currentStep?.title || 'Historia'

  return (
    <div className="story-mode">
      <header className="story-mode__header">
        <h1>Modo historias</h1>
        <div className="story-mode__nav">
          {typeof onBack === 'function' && (
            <button type="button" onClick={onBack} className="story-mode__nav-btn">
              Volver a práctica
            </button>
          )}
          {typeof onHome === 'function' && (
            <button type="button" onClick={onHome} className="story-mode__nav-btn">
              Ir al menú
            </button>
          )}
        </div>
      </header>

      <section className="story-mode__controls">
        <label>
          Tiempo verbal
          <select value={selectedTense} onChange={handleTenseChange} aria-label="Selecciona el tiempo verbal">
            {allTenses.map((tense) => (
              <option key={tense} value={tense}>
                {TENSE_LABELS[tense] || tense}
              </option>
            ))}
          </select>
        </label>

        <label>
          Historia
          <select
            value={selectedStoryId || ''}
            onChange={handleStoryChange}
            disabled={!storiesForTense.length}
            aria-label="Selecciona la historia"
          >
            {storiesForTense.map((story) => (
              <option key={story.id} value={story.id}>
                {story.title}
              </option>
            ))}
          </select>
        </label>
      </section>

      {isLoading && !initialised ? (
        <div role="status" className="story-mode__loading">
          Cargando historia...
        </div>
      ) : null}

      {currentStep && (
        <section className="story-mode__details">
          <h2>{storyTitle}</h2>
          <p>{currentStep.description}</p>

          <div className="story-mode__elements">
            <h3>Elementos sugeridos</h3>
            <ul>
              {currentStep.elements.map((element, index) => (
                <li key={`${element.category}-${index}`}>{formatElement(element)}</li>
              ))}
            </ul>
          </div>

          {currentStep.targetVerbs?.length ? (
            <div className="story-mode__verbs">
              <h3>Verbos objetivo</h3>
              <p>{currentStep.targetVerbs.join(', ')}</p>
            </div>
          ) : null}

          <p className="story-mode__instructions">{currentStep.instructions}</p>
        </section>
      )}

      <form className="story-mode__form" onSubmit={handleSubmit}>
        <label htmlFor="story-mode-input">Tu historia</label>
        <textarea
          id="story-mode-input"
          value={userStory}
          onChange={(event) => setUserStory(event.target.value)}
          placeholder={currentStep?.placeholder || 'Escribe tu historia aquí...'}
          rows={12}
        />

        <div className="story-mode__actions">
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Evaluando...' : 'Enviar historia'}
          </button>
        </div>
      </form>

      {errors.length > 0 && (
        <section className="story-mode__feedback" aria-live="assertive">
          <h3>Revisa tu historia</h3>
          <ul>
            {errors.map((error, index) => (
              <li key={`error-${index}`}>{error}</li>
            ))}
          </ul>
        </section>
      )}

      {result && !result.errors?.length && (
        <section className="story-mode__analysis" aria-live="polite">
          <h3>Feedback del ejercicio</h3>
          <p>{result.feedback}</p>

          {result.analysis && (
            <div className="story-mode__analysis-details">
              <p>
                Elementos utilizados: {result.analysis.elementsUsed.length} / {currentExercise?.requiredElements}
              </p>
              <p>
                Verbos detectados: {result.analysis.verbsDetected.join(', ') || 'Ninguno'}
              </p>
              <p>Palabras: {result.analysis.wordCount}</p>
            </div>
          )}
        </section>
      )}
    </div>
  )
}

export default StoryMode
