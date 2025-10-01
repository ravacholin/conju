import React, { useState, useEffect } from 'react'
import { useSettings } from '../../state/settings.js'
import { getGlobalAssessment } from '../../lib/levels/levelAssessment.js'
import ClickableCard from '../shared/ClickableCard.jsx'

function PlacementTest({ onComplete, onCancel }) {
  const settings = useSettings()
  const [assessment] = useState(() => getGlobalAssessment())
  const [currentTest, setCurrentTest] = useState(null)
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [userAnswer, setUserAnswer] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [testStarted, setTestStarted] = useState(false)

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
      setCurrentQuestion(test.questions[0])
      setTestStarted(true)
    } catch (error) {
      console.error('Failed to start placement test:', error)
    }
  }

  const handleSubmitAnswer = async () => {
    if (!userAnswer.trim() || !currentQuestion || isSubmitting) return

    try {
      setIsSubmitting(true)
      const result = await assessment.submitAnswer(currentQuestion.id, userAnswer.trim())

      if (result.completed) {
        // Test completed
        settings.setUserLevel(result.determinedLevel)
        settings.setPlacementTestCompleted(true)
        onComplete && onComplete(result)
      } else {
        // Move to next question
        setCurrentQuestion(result.nextQuestion)
        setUserAnswer('')
      }
    } catch (error) {
      console.error('Failed to submit answer:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    assessment.abortTest()
    onCancel && onCancel()
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isSubmitting) {
      e.preventDefault()
      handleSubmitAnswer()
    }
  }

  if (!testStarted) {
    return (
      <div className="placement-test-intro">
        <div className="test-header">
          <h2>Test de Nivel</h2>
          <p className="test-description">
            Evalúa tu conocimiento del español para determinar tu nivel CEFR automáticamente.
          </p>
        </div>

        <div className="test-options">
          <ClickableCard
            className="test-option"
            onClick={() => handleStartTest(10)}
            title="Test rápido (10 preguntas)"
          >
            <div className="option-title">Test Rápido</div>
            <div className="option-description">10 preguntas • ~5 minutos</div>
          </ClickableCard>

          <ClickableCard
            className="test-option"
            onClick={() => handleStartTest(15)}
            title="Test completo (15 preguntas)"
          >
            <div className="option-title">Test Completo</div>
            <div className="option-description">15 preguntas • ~8 minutos</div>
          </ClickableCard>
        </div>

        <div className="test-info">
          <div className="info-item">
            <div className="info-label">Qué evalúa:</div>
            <div className="info-text">Presente, pasados, subjuntivo, condicional</div>
          </div>
          <div className="info-item">
            <div className="info-label">Resultado:</div>
            <div className="info-text">Nivel automático A1-C2</div>
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

  return (
    <div className="placement-test-active">
      <div className="test-progress">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="progress-text">
          {currentTest?.currentIndex + 1} de {currentTest?.questions?.length}
        </div>
      </div>

      <div className="question-card">
        <div className="question-header">
          <div className="question-level">{currentQuestion.targetLevel}</div>
          <div className="question-difficulty">
            {'●'.repeat(currentQuestion.difficulty)}
            {'○'.repeat(6 - currentQuestion.difficulty)}
          </div>
        </div>

        <div className="question-content">
          <div className="question-prompt">{currentQuestion.prompt}</div>

          <div className="answer-input-section">
            <input
              type="text"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escribe tu respuesta..."
              className="answer-input"
              autoFocus
              disabled={isSubmitting}
            />
          </div>
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
            className={`submit-button ${!userAnswer.trim() || isSubmitting ? 'disabled' : ''}`}
            onClick={handleSubmitAnswer}
            title="Enviar respuesta"
          >
            {isSubmitting ? 'Enviando...' : 'Enviar'}
          </ClickableCard>
        </div>
      </div>

      <div className="test-hints">
        <div className="hint-text">
          Escribe la forma verbal que complete la oración correctamente
        </div>
      </div>
    </div>
  )
}

export default PlacementTest