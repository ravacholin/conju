import React, { useState, useEffect } from 'react'
import { useSettings } from '../../state/settings.js'
import { getGlobalAssessment } from '../../lib/levels/levelAssessment.js'
import { setGlobalPlacementTestBaseline } from '../../lib/levels/userLevelProfile.js'
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
          // Test completed - process results and establish baseline
          const enhancedResult = await processTestCompletion(result)

          if (enhancedResult) {
            settings.setUserLevel(enhancedResult.determinedLevel)
            settings.setPlacementTestCompleted(true)
            if (settings.setPlacementTestReport && enhancedResult.report) {
              settings.setPlacementTestReport(enhancedResult.report)
            }
            onComplete && onComplete(enhancedResult)
          } else {
            settings.setUserLevel(result.determinedLevel)
            settings.setPlacementTestCompleted(true)
            onComplete && onComplete(result)
          }
        } else {
          // Move to next question and update test state
          setCurrentTest({
            ...currentTest,
            currentIndex: result.currentIndex,
            maxQuestions: result.maxQuestions
          })
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

  // Process test completion and establish competency baseline
  const processTestCompletion = async (result) => {
    try {
      // Analyze test results to create competency baseline
      const competencyBaseline = analyzeTestResults(result)

      const generatedAt = Date.now()
      const testId = `placement-${generatedAt}`
      const placementReport = buildPlacementReport(result, competencyBaseline, { generatedAt, testId })

      // Enhanced result object with baseline data
      const enhancedResult = {
        ...result,
        testId,
        competencyBaseline,
        testMetadata: {
          totalQuestions: result.totalQuestions,
          correctAnswers: result.correctAnswers,
          accuracy: result.correctAnswers / result.totalQuestions,
          levelDistribution: getLevelDistribution(result.results),
          timestamp: generatedAt
        },
        report: placementReport
      }

      // Set baseline in user profile for future dynamic evaluations
      await setGlobalPlacementTestBaseline(enhancedResult)

      console.log('✅ Placement test baseline established:', competencyBaseline)
      return enhancedResult
    } catch (error) {
      console.warn('⚠️ Error establishing test baseline:', error)
      return null
    }
  }

  // Analyze test results to extract competency insights
  const analyzeTestResults = (result) => {
    const competencies = {}
    const levelAccuracy = {}

    // Process each answer to build competency profile
    result.results.forEach(answer => {
      const level = answer.level

      if (!levelAccuracy[level]) {
        levelAccuracy[level] = { correct: 0, total: 0 }
      }

      levelAccuracy[level].total += 1
      if (answer.isCorrect) {
        levelAccuracy[level].correct += 1
      }

      // Extract competency info if available in question metadata
      if (answer.competencyInfo) {
        const { mood, tense } = answer.competencyInfo
        const key = `${mood}_${tense}`

        if (!competencies[key]) {
          competencies[key] = { correct: 0, total: 0, level }
        }

        competencies[key].total += 1
        if (answer.isCorrect) {
          competencies[key].correct += 1
        }
      }
    })

    // Calculate accuracy per level and competency
    Object.keys(levelAccuracy).forEach(level => {
      const data = levelAccuracy[level]
      data.accuracy = data.correct / data.total
    })

    Object.keys(competencies).forEach(key => {
      const data = competencies[key]
      data.accuracy = data.correct / data.total
    })

    return {
      levelAccuracy,
      competencies,
      overallAccuracy: result.correctAnswers / result.totalQuestions,
      strongestLevel: findStrongestLevel(levelAccuracy),
      weakestLevel: findWeakestLevel(levelAccuracy),
      estimatedLevelRange: calculateLevelRange(levelAccuracy, result.determinedLevel)
    }
  }

  // Helper function to find strongest level
  const findStrongestLevel = (levelAccuracy) => {
    let bestLevel = null
    let bestAccuracy = 0

    Object.entries(levelAccuracy).forEach(([level, data]) => {
      if (data.total >= 2 && data.accuracy > bestAccuracy) {
        bestLevel = level
        bestAccuracy = data.accuracy
      }
    })

    return { level: bestLevel, accuracy: bestAccuracy }
  }

  // Helper function to find weakest level
  const findWeakestLevel = (levelAccuracy) => {
    let worstLevel = null
    let worstAccuracy = 1

    Object.entries(levelAccuracy).forEach(([level, data]) => {
      if (data.total >= 2 && data.accuracy < worstAccuracy) {
        worstLevel = level
        worstAccuracy = data.accuracy
      }
    })

    return { level: worstLevel, accuracy: worstAccuracy }
  }

  // Calculate estimated level range based on performance
  const calculateLevelRange = (levelAccuracy, determinedLevel) => {
    const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
    const determinedIndex = levels.indexOf(determinedLevel)

    let minLevel = determinedLevel
    let maxLevel = determinedLevel

    // Check levels below - if high accuracy, user could be underestimated
    for (let i = determinedIndex - 1; i >= 0; i--) {
      const level = levels[i]
      const data = levelAccuracy[level]
      if (data && data.accuracy >= 0.9 && data.total >= 2) {
        minLevel = level
      } else {
        break
      }
    }

    // Check levels above - if moderate accuracy, user could handle higher
    for (let i = determinedIndex + 1; i < levels.length; i++) {
      const level = levels[i]
      const data = levelAccuracy[level]
      if (data && data.accuracy >= 0.6 && data.total >= 2) {
        maxLevel = level
      } else {
        break
      }
    }

    return { min: minLevel, max: maxLevel, confidence: 0.8 }
  }

  // Get distribution of questions by level
  const getLevelDistribution = (results) => {
    const distribution = {}

    results.forEach(answer => {
      const level = answer.level
      if (!distribution[level]) {
        distribution[level] = { total: 0, correct: 0 }
      }
      distribution[level].total += 1
      if (answer.isCorrect) {
        distribution[level].correct += 1
      }
    })

    return distribution
  }

  const buildPlacementReport = (result, competencyBaseline, { generatedAt, testId }) => {
    const responseTimes = (result.results || []).map(answer => answer.responseTime || 0)
    const totalResponseTime = responseTimes.reduce((sum, time) => sum + time, 0)
    const averageResponseTime = responseTimes.length ? totalResponseTime / responseTimes.length : 0
    const sortedTimes = [...responseTimes].sort((a, b) => a - b)
    const medianResponseTime = sortedTimes.length
      ? sortedTimes[Math.floor(sortedTimes.length / 2)]
      : 0

    const accuracyByLevel = Object.entries(competencyBaseline.levelAccuracy || {}).map(([level, data]) => ({
      level,
      correct: data.correct,
      total: data.total,
      accuracy: data.accuracy || 0
    }))

    const focusAreas = identifyFocusAreas(competencyBaseline.competencies || {})
    const recommendations = generateRecommendations(competencyBaseline, focusAreas, averageResponseTime)

    return {
      testId,
      generatedAt,
      determinedLevel: result.determinedLevel,
      summary: {
        totalQuestions: result.totalQuestions,
        correctAnswers: result.correctAnswers,
        incorrectAnswers: (result.totalQuestions || 0) - result.correctAnswers,
        accuracy: result.totalQuestions ? result.correctAnswers / result.totalQuestions : 0,
        estimatedRange: competencyBaseline.estimatedLevelRange,
        strongestLevel: competencyBaseline.strongestLevel,
        weakestLevel: competencyBaseline.weakestLevel
      },
      timings: {
        averageMs: Math.round(averageResponseTime),
        medianMs: Math.round(medianResponseTime),
        fastestMs: sortedTimes.length ? sortedTimes[0] : 0,
        slowestMs: sortedTimes.length ? sortedTimes[sortedTimes.length - 1] : 0
      },
      accuracyByLevel,
      focusAreas,
      recommendations,
      responses: (result.results || []).map((answer, index) => ({
        index: index + 1,
        level: answer.level,
        isCorrect: answer.isCorrect,
        responseTime: answer.responseTime,
        competency: answer.competencyInfo || null
      }))
    }
  }

  const identifyFocusAreas = (competencies) => {
    const entries = Object.entries(competencies).map(([key, data]) => ({
      key,
      correct: data.correct,
      total: data.total,
      accuracy: data.accuracy || 0,
      level: data.level
    }))

    const weaknesses = entries
      .filter(entry => entry.total >= 2 && entry.accuracy < 0.6)
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 5)

    const strengths = entries
      .filter(entry => entry.accuracy >= 0.8)
      .sort((a, b) => b.accuracy - a.accuracy)
      .slice(0, 5)

    return { strengths, weaknesses }
  }

  const generateRecommendations = (baseline, focusAreas, averageResponseTime) => {
    const recommendations = []

    if (baseline.overallAccuracy < 0.6) {
      recommendations.push('Consolidá los tiempos más básicos antes de avanzar a nuevos niveles.')
    }

    if (baseline.weakestLevel?.level) {
      recommendations.push(`Reforzá ejercicios del nivel ${baseline.weakestLevel.level} para apuntalar tu base.`)
    }

    if (focusAreas.weaknesses.length > 0) {
      const area = focusAreas.weaknesses[0]
      if (area && area.key) {
        const [mood, tense] = area.key.split('_')
        recommendations.push(`Dedicá prácticas específicas al ${tense} del modo ${mood} (precisión ${(area.accuracy * 100).toFixed(0)}%).`)
      }
    }

    if (averageResponseTime > 12000) {
      recommendations.push('Tus tiempos de respuesta son altos; practicá en sesiones cortas para ganar velocidad.')
    }

    if (recommendations.length === 0) {
      recommendations.push('Excelente desempeño. Podés avanzar gradualmente a ejercicios más desafiantes.')
    }

    return recommendations
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
      <div className="placement-test-container">
        <div className="placement-test-intro page-transition page-in">
          <div className="test-header">
            <div className="header-icon">
              <img src="/icons/brain.png" alt="Test de nivel" className="inline-icon lg" />
            </div>
            <h2 className="test-title">Test de Nivel de Conjugación</h2>
            <p className="test-subtitle">
              Test profesional que determina tu nivel CEFR en conjugación verbal española automáticamente.
            </p>
          </div>

          <div className="test-options">
            <div
              className="test-start-card"
              onClick={() => handleStartTest()}
              title="Iniciar test de nivel"
            >
              <div className="start-card-content">
                <div className="start-icon-wrapper">
                  <img src="/play.png" alt="Comenzar" className="start-icon" />
                </div>
                <div className="start-text">
                  <div className="start-title">Iniciar Test Adaptativo</div>
                  <div className="start-description">Determina tu nivel automáticamente</div>
                </div>
                <div className="start-arrow">
                  <img src="/next.png" alt="Continuar" className="arrow-icon" />
                </div>
              </div>
            </div>
          </div>

          <div className="test-info-grid">
            <div className="info-card">
              <img src="/crono.png" alt="Tiempo" className="inline-icon" />
              <div className="info-content">
                <div className="info-label">Duración</div>
                <div className="info-value">3-15 preguntas</div>
                <div className="info-sub">~5 minutos</div>
              </div>
            </div>
            <div className="info-card">
              <img src="/icons/chart.png" alt="Preguntas" className="inline-icon" />
              <div className="info-content">
                <div className="info-label">Niveles</div>
                <div className="info-value">A1 - C1</div>
                <div className="info-sub">CEFR oficial</div>
              </div>
            </div>
            <div className="info-card">
              <img src="/diana.png" alt="Precisión" className="inline-icon" />
              <div className="info-content">
                <div className="info-label">Precisión</div>
                <div className="info-value">Adaptativo</div>
                <div className="info-sub">IA avanzada</div>
              </div>
            </div>
          </div>

          <div className="test-actions">
            <div
              className="btn-secondary-modern"
              onClick={handleCancel}
              title="Cancelar test"
            >
              <span className="btn-text">Cancelar</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!currentQuestion) {
    return (
      <div className="placement-test-container">
        <div className="placement-test-loading page-transition page-in">
          <div className="loading-content">
            <div className="loading-animation">
              <div className="loading-spinner"></div>
              <div className="loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
            <div className="loading-text">Generando pregunta adaptativa...</div>
            <div className="loading-subtitle">Analizando tu progreso</div>
          </div>
        </div>
      </div>
    )
  }

  const progress = assessment.getTestProgress()
  const currentEstimate = assessment.getCurrentEstimate()

  return (
    <div className="placement-test-container">
      <div className="placement-test-active page-transition page-in" onKeyDown={handleKeyNavigation} tabIndex="0">
        <div className="test-progress-section">
          <div className="progress-header">
            <div className="progress-title">
              <img src="/icons/chart.png" alt="Progreso" className="inline-icon" />
              <span>Progreso del Test</span>
            </div>
            <div className="adaptive-badge">
              <img src="/icons/sparks.png" alt="Adaptativo" className="inline-icon" />
              <span>Adaptativo</span>
            </div>
          </div>

          <div className="progress-info">
            <div className="progress-bar-container">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${progress}%` }}
                />
                <div className="progress-glow" style={{ width: `${progress}%` }} />
              </div>
              <div className="progress-text">
                Pregunta {(currentTest?.currentIndex || 0) + 1} de máx. {currentTest?.maxQuestions || 15}
              </div>
            </div>

          </div>

          <div className="current-estimate">
            <div className="estimate-level">
              <span className="estimate-label">Nivel estimado</span>
              <div className="level-badge-container">
                <span className={`level-badge level-${currentEstimate.level.toLowerCase()}`}>
                  <span className="level-text">{currentEstimate.level}</span>
                  <span className="level-shine"></span>
                </span>
              </div>
            </div>
            <div className="estimate-confidence">
              <div className="confidence-wrapper">
                <div className="confidence-bar">
                  <div
                    className="confidence-fill"
                    style={{ width: `${currentEstimate.confidence}%` }}
                  />
                  <div className="confidence-glow" style={{ width: `${currentEstimate.confidence}%` }} />
                </div>
                <span className="confidence-text">
                  {Math.round(currentEstimate.confidence)}% confianza
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="question-card">
          <div className="question-header">
            <div className="question-meta">
              <div className="question-level-badge">
                <img src="/diana.png" alt="Nivel" className="inline-icon" />
                <span>{currentQuestion.targetLevel}</span>
              </div>
              <div className="question-difficulty">
                <span className="difficulty-label">Dificultad</span>
                <div className="difficulty-dots">
                  {Array.from({ length: 5 }, (_, i) => (
                    <span
                      key={i}
                      className={`difficulty-dot ${
                        i < (currentQuestion.difficulty || 1) ? 'active' : 'inactive'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
            {currentQuestion.irregularityInfo && (
              <div className="irregularity-info">
                <div className="pattern-badge">
                  <img src="/icons/bolt.png" alt="Patrón" className="inline-icon" />
                  <span>{currentQuestion.irregularityInfo.family}</span>
                </div>
              </div>
            )}
          </div>

          <div className="question-content">
            <div className="question-prompt-container">
              <div className="question-prompt">{currentQuestion.prompt}</div>
              <div className="prompt-decoration"></div>
            </div>

            <div className="answer-options" role="radiogroup" aria-label="Opciones de respuesta">
              {currentQuestion.options?.map((option, index) => (
                <div
                  key={index}
                  className={`option-card ${
                    selectedOption === option ? 'selected' : ''
                  } ${
                    showExplanation && option === currentQuestion.expectedAnswer ? 'correct' : ''
                  } ${
                    showExplanation && selectedOption === option && option !== currentQuestion.expectedAnswer ? 'incorrect' : ''
                  }`}
                  onClick={() => handleOptionSelect(option)}
                  onKeyDown={(e) => handleKeyDown(e, option)}
                  title={`Seleccionar opción: ${option}`}
                  tabIndex={0}
                  role="radio"
                  aria-checked={selectedOption === option}
                  aria-label={`Opción ${String.fromCharCode(65 + index)}: ${option}`}
                >
                  <div className="option-content">
                    <div className="option-letter-container">
                      <span className="option-letter" aria-hidden="true">{String.fromCharCode(65 + index)}</span>
                    </div>
                    <span className="option-text">{option}</span>
                    <div className="option-indicator">
                      {selectedOption === option && !showExplanation && (
                        <img src="/next.png" alt="Seleccionado" className="option-icon" />
                      )}
                      {showExplanation && option === currentQuestion.expectedAnswer && (
                        <img src="/next.png" alt="Correcto" className="option-icon correct" />
                      )}
                      {showExplanation && selectedOption === option && option !== currentQuestion.expectedAnswer && (
                        <img src="/back.png" alt="Incorrecto" className="option-icon incorrect" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {showExplanation && currentQuestion.explanation && (
              <div className="explanation-container">
                <div className="explanation-box">
                  <div className="explanation-header">
                    <img src="/icons/lightbulb.png" alt="Explicación" className="inline-icon" />
                    <span className="explanation-label">Explicación</span>
                  </div>
                  <div className="explanation-text">{currentQuestion.explanation}</div>
                </div>
              </div>
            )}
          </div>

          <div className="question-actions">
            <div
              className="btn-secondary-modern"
              onClick={handleCancel}
              title="Cancelar test"
            >
              <img src="/back.png" alt="Volver" className="btn-icon" />
              <span className="btn-text">Cancelar</span>
            </div>

            <div
              className={`submit-button-modern ${
                !selectedOption || isSubmitting || showExplanation ? 'disabled' : 'enabled'
              }`}
              onClick={handleSubmitAnswer}
              title="Enviar respuesta"
            >
              <div className="submit-content">
                {isSubmitting && (
                  <div className="loading-spinner"></div>
                )}
                <span className="submit-text">
                  {isSubmitting ? 'Procesando...' : showExplanation ? 'Siguiente' : 'Confirmar'}
                </span>
                {!isSubmitting && !showExplanation && (
                  <img src="/next.png" alt="Continuar" className="submit-icon" />
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="test-hints">
          <div className="hint-card">
            <img src="/openbook.png" alt="Consejos" className="inline-icon" />
            <div className="hint-content">
              <div className="hint-text">
                Selecciona la opción que complete correctamente la oración
              </div>
              <div className="adaptive-info">
                <img src="/icons/sparks.png" alt="Adaptativo" className="inline-icon" />
                <span className="adaptive-text">
                  El test se adapta automáticamente a tu nivel de conjugación
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PlacementTest