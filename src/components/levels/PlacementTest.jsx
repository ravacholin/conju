import React, { useState, useEffect } from 'react'
import { useSettings } from '../../state/settings.js'
import { getGlobalAssessment } from '../../lib/levels/levelAssessment.js'
import { setGlobalPlacementTestBaseline } from '../../lib/levels/userLevelProfile.js'
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
  const [testCompleted, setTestCompleted] = useState(false)
  const [testResults, setTestResults] = useState(null)
  const [feedbackResult, setFeedbackResult] = useState(null) // New state for adaptive feedback

  useEffect(() => {
    if (assessment.isActive) {
      setTestStarted(true)
    }
  }, [assessment])

  const handleStartTest = async () => {
    try {
      console.log('🚀 Starting placement test...')
      const test = assessment.startTest()
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
      const submission = assessment.submitAnswer(currentQuestion.id, selectedOption)

      // Store feedback result to show correctness/explanation
      setFeedbackResult(submission.result)
      setShowExplanation(true)

      // Wait to show explanation, then proceed
      setTimeout(async () => {
        setShowExplanation(false)
        setFeedbackResult(null)

        if (submission.completed) {
          // Process final results
          await processTestCompletion(submission)
        } else {
          // Next Question
          setCurrentTest({
            ...currentTest,
            progress: submission.progress,
            currentIndex: submission.currentIndex,
            maxQuestions: submission.maxQuestions
          })
          setCurrentQuestion(submission.nextQuestion)
          setSelectedOption('')
        }
        setIsSubmitting(false)
      }, 2000) // 2 second delay for feedback
    } catch (error) {
      console.error('Failed to submit answer:', error)
      setIsSubmitting(false)
    }
  }

  const processTestCompletion = async (result) => {
    // In the new adaptive system, result already contains determinedLevel
    setTestResults(result)
    setTestCompleted(true)

    // Update User Profile
    await setGlobalPlacementTestBaseline(result)
    // Also set in settings for immediate app usage
    settings.setUserLevel(result.determinedLevel)
    settings.setPlacementTestCompleted(true)
  }

  const handleFinish = () => {
    onComplete && onComplete(testResults)
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

  // RENDER RESULTS
  if (testCompleted && testResults) {
    return (
      <div className="placement-test-container">
        <div className="placement-results page-in">
          <div className="results-header">
            <h2 className="result-label">NIVEL ASIGNADO</h2>
            <div className="level-result-badge">
              <span className="result-level-text">{testResults.determinedLevel}</span>
            </div>
            <p className="test-subtitle">Basado en {testResults.totalQuestions} preguntas adaptativas</p>
          </div>

          <div className="results-stats-grid">
            <div className="stat-card">
              <div className="stat-value">{testResults.correctAnswers}/{testResults.totalQuestions}</div>
              <div className="stat-desc">ACIERTOS</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {Math.round((testResults.correctAnswers / testResults.totalQuestions) * 100)}%
              </div>
              <div className="stat-desc">PRECISIÓN</div>
            </div>
          </div>

          <div className="test-actions">
            <button
              className="submit-button-modern"
              onClick={handleFinish}
            >
              CONTINUAR
            </button>
          </div>
        </div>
      </div>
    )
  }

  // RENDER LOADING
  if (!testStarted) {
    return (
      <div className="placement-test-container">
        <div className="placement-test-intro page-in">
          <div className="test-header">
            <h2 className="test-title">TEST DE NIVEL</h2>
            <p className="test-subtitle">
              SISTEMA ADAPTATIVO
            </p>
          </div>

          <div
            className="test-start-card"
            onClick={handleStartTest}
          >
            <div className="start-content">
              <span className="start-title">INICIAR EVALUACIÓN</span>
              <span className="start-description">DETERMINA TU NIVEL CEFR (A1-C2)</span>
            </div>
            <div className="start-arrow">→</div>
          </div>

          <div className="test-info-grid">
            <div className="info-card">
              <div className="info-label">DURACIÓN</div>
              <div className="info-value">~5 MIN</div>
            </div>
            <div className="info-card">
              <div className="info-label">NIVELES</div>
              <div className="info-value">A1 - C2</div>
            </div>
            <div className="info-card">
              <div className="info-label">MÉTODO</div>
              <div className="info-value">ADAPTATIVO</div>
            </div>
          </div>

          <div className="test-actions" style={{ marginTop: '3rem' }}>
            <button
              className="btn-secondary-modern"
              onClick={onCancel}
            >
              CANCELAR
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!currentQuestion) {
    return <div className="placement-test-container">CARGANDO...</div>
  }

  // RENDER ACTIVE TEST
  return (
    <div className="placement-test-container">
      <div className="placement-test-active page-in">

        {/* PROGRESS Header */}
        <div className="test-progress-section">
          <div className="progress-info">
            <div className="progress-text">
              PREGUNTA {currentTest.currentIndex + 1} / {currentTest.maxQuestions}
            </div>
            <div className="progress-bar-container">
              <div
                className="progress-fill"
                style={{ width: `${currentTest.progress}%` }}
              />
            </div>
          </div>

          <div className="current-estimate">
            <span className="estimate-label">ESTIMACIÓN ACTUAL</span>
            <span className="level-badge">
              {currentTest.currentEstimate?.level || '...'}
            </span>
          </div>
        </div>

        {/* QUESTION */}
        <div className="question-area">
          <div className="question-meta">
            <span className="question-level-badge">{currentQuestion.targetLevel}</span>
          </div>

          <div className="question-prompt">
            {currentQuestion.prompt.split('____').map((part, i, arr) => (
              <React.Fragment key={i}>
                {part}
                {i < arr.length - 1 && <span style={{ borderBottom: '2px solid #fff', display: 'inline-block', width: '50px', margin: '0 10px' }}></span>}
              </React.Fragment>
            ))}
          </div>

          <div className="answer-options">
            {currentQuestion.options.map((option, index) => {
              // Determine state class
              let stateClass = ''
              if (selectedOption === option) stateClass = 'selected'

              // Feedback Logic
              if (showExplanation && feedbackResult) {
                if (option === feedbackResult.correctAnswer) stateClass = 'correct'
                else if (selectedOption === option && !feedbackResult.isCorrect) stateClass = 'incorrect'
              }

              return (
                <div
                  key={index}
                  className={`option-card ${stateClass}`}
                  onClick={() => handleOptionSelect(option)}
                  onKeyDown={(e) => handleKeyDown(e, option)}
                  tabIndex={0}
                >
                  <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                  <span className="option-text">{option}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* ACTIONS */}
        <div className="question-actions">
          <button
            className="btn-secondary-modern"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            SALIR
          </button>

          <button
            className={`submit-button-modern ${!selectedOption || isSubmitting ? 'disabled' : ''}`}
            onClick={handleSubmitAnswer}
          >
            {isSubmitting ? '...' : showExplanation ? 'SIGUIENTE' : 'CONFIRMAR'}
          </button>
        </div>

        {/* EXPLANATION / FEEDBACK OVERLAY or INLINE */}
        {showExplanation && feedbackResult && (
          <div style={{ marginTop: '2rem', borderTop: '2px solid #333', paddingTop: '1rem', textAlign: 'left' }}>
            <span style={{ color: feedbackResult.isCorrect ? '#4ade80' : '#ef4444', fontWeight: 'bold', textTransform: 'uppercase' }}>
              {feedbackResult.isCorrect ? '¡CORRECTO!' : 'INCORRECTO'}
            </span>
            <p style={{ color: '#888', marginTop: '0.5rem' }}>
              {currentQuestion.explanation}
            </p>
          </div>
        )}

      </div>
    </div>
  )
}

export default PlacementTest