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
      setCurrentTest(assessment.currentTest)
      setCurrentQuestion(assessment.getCurrentQuestion())
      setTestStarted(true)
    }
  }, [assessment])

  const handleStartTest = async (questionCount = 15) => {
    try {
      const test = await assessment.startPlacementTest(questionCount)
      setCurrentTest(test)
      setCurrentQuestion(test.currentQuestion)
      setTestStarted(true)
    } catch (error) {
      console.error('Failed to start placement test:', error)
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

  if (!testStarted) {
    return (
      <div className="placement-test-intro">
        <div className="test-header">
          <h2>Test de Nivel Adaptativo</h2>
          <p className="test-description">
            Test profesional con algoritmo CAT (Computerized Adaptive Testing) que determina tu nivel CEFR automáticamente.
          </p>
        </div>

        <div className="test-options">
          <ClickableCard
            className="test-option"
            onClick={() => handleStartTest(12)}
            title="Test adaptativo estándar"
          >
            <div className="option-title">Test Estándar</div>
            <div className="option-description">8-12 preguntas • Adaptativo • ~6 minutos</div>
            <div className="option-features">
              <div className="feature">Algoritmo CAT profesional</div>
              <div className="feature">Selección inteligente de preguntas</div>
              <div className="feature">Termina cuando converge</div>
            </div>
          </ClickableCard>

          <ClickableCard
            className="test-option"
            onClick={() => handleStartTest(8)}
            title="Test adaptativo rápido"
          >
            <div className="option-title">Test Rápido</div>
            <div className="option-description">6-8 preguntas • Adaptativo • ~4 minutos</div>
            <div className="option-features">
              <div className="feature">Evaluación eficiente</div>
              <div className="feature">Resultado aproximado</div>
            </div>
          </ClickableCard>
        </div>

        <div className="test-info">
          <div className="info-item">
            <div className="info-label">Metodología:</div>
            <div className="info-text">IRT + Estimación bayesiana • Estándar CEFR 2025</div>
          </div>
          <div className="info-item">
            <div className="info-label">Evalúa:</div>
            <div className="info-text">Presente, pasados, subjuntivo, condicional • Verbos regulares e irregulares</div>
          </div>
          <div className="info-item">
            <div className="info-label">Precisión:</div>
            <div className="info-text">±1 subnivel CEFR • Confianza estadística 85%+</div>
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
    <div className="placement-test-active">
      <div className="test-progress">
        <div className="progress-info">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="progress-text">
            Pregunta {currentTest?.currentIndex + 1} de máx. {currentTest?.maxQuestions}
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
              {'●'.repeat(currentQuestion.difficulty)}
              {'○'.repeat(6 - currentQuestion.difficulty)}
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

          <div className="answer-options">
            {currentQuestion.options?.map((option, index) => (
              <ClickableCard
                key={index}
                className={`option-button ${selectedOption === option ? 'selected' : ''} ${
                  showExplanation && option === currentQuestion.expectedAnswer ? 'correct' : ''
                } ${
                  showExplanation && selectedOption === option && option !== currentQuestion.expectedAnswer ? 'incorrect' : ''
                }`}
                onClick={() => handleOptionSelect(option)}
                title={`Seleccionar opción: ${option}`}
                disabled={isSubmitting || showExplanation}
              >
                <span className="option-letter">{String.fromCharCode(65 + index)}.</span>
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
          El algoritmo selecciona las preguntas más informativas para tu nivel
        </div>
      </div>
    </div>
  )
}

export default PlacementTest