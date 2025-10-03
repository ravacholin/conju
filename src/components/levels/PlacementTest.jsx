import React, { useState, useEffect } from 'react'
import { useSettings } from '../../state/settings.js'
import { getGlobalAssessment } from '../../lib/levels/levelAssessment.js'
import ClickableCard from '../shared/ClickableCard.jsx'
import './PlacementTest.css'

function PlacementTest({ onComplete, onCancel }) {
  const settings = useSettings()
  const [assessment] = useState(() => getGlobalAssessment())
  const [currentTest, setCurrentTest] = useState(null)
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [selectedOption, setSelectedOption] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [testStarted, setTestStarted] = useState(false)
  const [showExplanation, setShowExplanation] = useState(false)

  useEffect(() => {
    if (assessment.isTestActive()) {
      setTestStarted(true)
    }
  }, [assessment])

  const handleStartTest = async () => {
    try {
      console.log('🚀 Starting placement test...')
      const test = await assessment.startTest()
      console.log('✅ Test started:', test)
      setCurrentTest(test)
      setCurrentQuestion(test.currentQuestion)
      setTestStarted(true)
    } catch (error) {
      console.error('❌ Failed to start placement test:', error)
      alert('Error al iniciar el test. Por favor, recarga la página e intenta de nuevo.')
    }
  }

  const handleSubmitAnswer = async () => {
    if (!selectedOption || !currentQuestion || isSubmitting) return

    try {
      setIsSubmitting(true)
      const result = await assessment.submitAnswer(currentQuestion.id, selectedOption)

      // Show explanation briefly
      setShowExplanation(true)

      // Wait 2 seconds to show explanation, then proceed
      setTimeout(async () => {
        setShowExplanation(false)

        if (result.completed) {
          // Test completed
          settings.setUserLevel(result.determinedLevel)
          settings.setPlacementTestCompleted(true)
          onComplete && onComplete(result)
        } else {
          // Move to next question
          setCurrentQuestion(result.nextQuestion)
          setSelectedOption('')
        }
        setIsSubmitting(false)
      }, 2000)
    } catch (error) {
      console.error('Failed to submit answer:', error)
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    assessment.abortTest()
    onCancel && onCancel()
  }

  const handleOptionSelect = (option) => {
    if (!isSubmitting && !showExplanation) {
      setSelectedOption(option)
    }
  }

  const handleKeyDown = (event, option) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleOptionSelect(option)
    }
  }

  const handleKeyNavigation = (event) => {
    if (isSubmitting || showExplanation) return

    const options = currentQuestion?.options || []
    const currentIndex = options.indexOf(selectedOption)

    switch (event.key) {
      case 'ArrowDown': {
        event.preventDefault()
        const nextIndex = currentIndex < options.length - 1 ? currentIndex + 1 : 0
        setSelectedOption(options[nextIndex])
        break
      }
      case 'ArrowUp': {
        event.preventDefault()
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : options.length - 1
        setSelectedOption(options[prevIndex])
        break
      }
      case 'Enter':
        event.preventDefault()
        if (selectedOption) {
          handleSubmitAnswer()
        }
        break
    }
  }

  if (!testStarted) {
    return (
      <div className="placement-test-intro">
        <div className="test-header">
          <h2>Test de Nivel de Conjugación</h2>
          <p className="test-description">
            Test profesional que determina tu nivel CEFR en conjugación verbal española automáticamente.
          </p>
        </div>

        <div className="test-options">
          <ClickableCard
            className="test-option"
            onClick={() => handleStartTest()}
            title="Iniciar test de nivel"
          >
            <div className="option-title">🧠 Iniciar Test de Nivel</div>
            <div className="option-description">Determina tu nivel automáticamente</div>
          </ClickableCard>
        </div>

        <div className="test-info">
          <div className="info-item">
            <div className="info-label">Duración:</div>
            <div className="info-text">3-12 preguntas • ~5 minutos</div>
          </div>
          <div className="info-item">
            <div className="info-label">Niveles:</div>
            <div className="info-text">A1 (básico) hasta C1 (avanzado)</div>
          </div>
        </div>

        <div className="test-actions">
          <ClickableCard
            className="btn-secondary"
            onClick={handleCancel}
            title="Cancelar test"
          >
            Cancelar
          </ClickableCard>
        </div>
      </div>
    )
  }

  if (!currentQuestion) {
    return (
      <div className="placement-test loading">
        <div className="loading-text">Cargando pregunta...</div>
      </div>
    )
  }

  const progress = assessment.getTestProgress()
  const currentEstimate = assessment.getCurrentEstimate()

  return (
    <div className="placement-test-active" onKeyDown={handleKeyNavigation} tabIndex="0">
      <div className="test-progress">
        <div className="progress-info">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="progress-text">
            Pregunta {(currentTest?.currentIndex || 0) + 1} de máx. {currentTest?.maxQuestions || 12}
          </div>
        </div>

        <div className="current-estimate">
          <div className="estimate-level">
            <span className="estimate-label">Nivel estimado:</span>
            <span className={`level-badge level-${currentEstimate.level.toLowerCase()}`}>
              {currentEstimate.level}
            </span>
          </div>
          <div className="estimate-confidence">
            <div className="confidence-bar">
              <div
                className="confidence-fill"
                style={{ width: `${currentEstimate.confidence}%` }}
              />
            </div>
            <span className="confidence-text">
              Confianza: {Math.round(currentEstimate.confidence)}%
            </span>
          </div>
        </div>
      </div>

      <div className="question-card">
        <div className="question-header">
          <div className="question-meta">
            <div className="question-level">{currentQuestion.targetLevel}</div>
            <div className="question-difficulty">
              <span className="difficulty-label">Dificultad:</span>
              {'●'.repeat(currentQuestion.difficulty || 1)}
              {'○'.repeat(6 - (currentQuestion.difficulty || 1))}
            </div>
          </div>
          {currentQuestion.irregularityInfo && (
            <div className="irregularity-info">
              <span className="pattern-badge">{currentQuestion.irregularityInfo.family}</span>
            </div>
          )}
        </div>

        <div className="question-content">
          <div className="question-prompt">{currentQuestion.prompt}</div>

          <div className="answer-options" role="radiogroup" aria-label="Opciones de respuesta">
            {currentQuestion.options?.map((option, index) => (
              <ClickableCard
                key={index}
                className={`option-button ${selectedOption === option ? 'selected' : ''} ${
                  showExplanation && option === currentQuestion.expectedAnswer ? 'correct' : ''
                } ${
                  showExplanation && selectedOption === option && option !== currentQuestion.expectedAnswer ? 'incorrect' : ''
                }`}
                onClick={() => handleOptionSelect(option)}
                onKeyDown={(e) => handleKeyDown(e, option)}
                title={`Seleccionar opción: ${option}`}
                disabled={isSubmitting || showExplanation}
                tabIndex={0}
                role="radio"
                aria-checked={selectedOption === option}
                aria-label={`Opción ${String.fromCharCode(65 + index)}: ${option}`}
              >
                <span className="option-letter" aria-hidden="true">{String.fromCharCode(65 + index)}.</span>
                <span className="option-text">{option}</span>
              </ClickableCard>
            ))}
          </div>

          {showExplanation && currentQuestion.explanation && (
            <div className="explanation-box">
              <div className="explanation-label">Explicación:</div>
              <div className="explanation-text">{currentQuestion.explanation}</div>
            </div>
          )}
        </div>

        <div className="question-actions">
          <ClickableCard
            className="btn-secondary"
            onClick={handleCancel}
            title="Cancelar test"
          >
            Cancelar
          </ClickableCard>

          <ClickableCard
            className={`submit-button ${!selectedOption || isSubmitting || showExplanation ? 'disabled' : ''}`}
            onClick={handleSubmitAnswer}
            title="Enviar respuesta"
          >
            {isSubmitting ? 'Procesando...' : showExplanation ? 'Siguiente...' : 'Confirmar'}
          </ClickableCard>
        </div>
      </div>

      <div className="test-hints">
        <div className="hint-text">
          Selecciona la opción que complete correctamente la oración
        </div>
        <div className="adaptive-info">
          <span className="adaptive-badge">Test Adaptativo</span>
          El test progresa automáticamente según tu nivel de conjugación
        </div>
      </div>
    </div>
  )
}

export default PlacementTest