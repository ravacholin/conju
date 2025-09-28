import React, { useState, useEffect, useMemo } from 'react';
import { formatMoodTense } from '../../lib/utils/verbLabels.js';
import { updateSchedule } from '../../lib/progress/srs.js';
import { getCurrentUserId } from '../../lib/progress/userManager.js';
import { useProgressTracking } from '../../features/drill/useProgressTracking.js';
import { grade } from '../../lib/core/grader.js';
import { ERROR_TAGS } from '../../lib/progress/dataModels.js';

// Importar el nuevo sistema de práctica significativa
import exerciseFactory from '../../lib/meaningful-practice/exercises/ExerciseFactory.js';
import assessmentEngine from '../../lib/meaningful-practice/assessment/AssessmentEngine.js';
import { EXERCISE_TYPES } from '../../lib/meaningful-practice/core/constants.js';

import './MeaningfulPractice.css';

/**
 * MeaningfulPractice - Componente refactorizado usando la nueva arquitectura
 *
 * Utiliza el sistema modular de ejercicios, análisis avanzado y feedback inteligente
 * para proporcionar experiencias de aprendizaje contextual y significativo.
 */
function MeaningfulPractice({
  tense,
  mood,
  onComplete,
  onBack,
  onHome,
  eligibleForms = [],
  difficulty = 'intermediate',
  exerciseType = null
}) {
  const [currentExercise, setCurrentExercise] = useState(null);
  const [currentStep, setCurrentStep] = useState(null);
  const [userResponse, setUserResponse] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exerciseResults, setExerciseResults] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Usar el hook de seguimiento de progreso
  const { handleResult, handleHintShown } = useProgressTracking(
    currentStep ? {
      verb: currentStep.title || 'meaningful_practice',
      form: `${mood}_${tense}`,
      mood,
      tense,
      type: 'meaningful_practice'
    } : null,
    onComplete
  );

  // Crear configuración del ejercicio basada en props
  const exerciseConfig = useMemo(() => {
    return {
      tense,
      mood,
      difficulty,
      targetTenses: [tense],
      eligibleForms,
      includeProgressTracking: true,
      adaptToUserLevel: true
    };
  }, [tense, mood, difficulty, eligibleForms]);

  // Inicializar ejercicio al cargar el componente
  useEffect(() => {
    initializeExercise();
  }, [tense, mood, exerciseType]);

  async function initializeExercise() {
    try {
      setIsLoading(true);
      setError(null);

      // Determinar tipo de ejercicio
      const selectedExerciseType = exerciseType || determineExerciseType(tense, mood);

      // Crear ejercicio usando la factory
      const exercise = await exerciseFactory.createExercise({
        type: selectedExerciseType,
        ...exerciseConfig
      });

      if (!exercise) {
        throw new Error('No se pudo crear el ejercicio');
      }

      // Inicializar el ejercicio
      await exercise.initialize();
      setCurrentExercise(exercise);

      // Obtener el primer paso
      const firstStep = exercise.getNextStep();
      setCurrentStep(firstStep);

      console.log('✅ Ejercicio inicializado:', {
        type: selectedExerciseType,
        title: exercise.title,
        steps: exercise.getTotalSteps()
      });

    } catch (err) {
      console.error('❌ Error al inicializar ejercicio:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  function determineExerciseType(tense, mood) {
    // Mapeo inteligente de tiempos verbales a tipos de ejercicio
    const tenseToExerciseMap = {
      'pres': EXERCISE_TYPES.DAILY_ROUTINE,
      'pretIndef': EXERCISE_TYPES.TIMELINE,
      'impf': EXERCISE_TYPES.STORY_BUILDING,
      'fut': EXERCISE_TYPES.PROBLEM_SOLVING,
      'cond': EXERCISE_TYPES.ROLE_PLAYING,
      'subjPres': EXERCISE_TYPES.ROLE_PLAYING,
      'subjImpf': EXERCISE_TYPES.STORY_BUILDING
    };

    return tenseToExerciseMap[tense] || EXERCISE_TYPES.PROMPTS;
  }

  async function handleSubmit() {
    if (!currentExercise || !userResponse.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);

      // Procesar respuesta con el ejercicio
      const result = await currentExercise.processResponse(userResponse.trim());

      // Realizar análisis avanzado con AssessmentEngine
      const assessment = await assessmentEngine.assessResponse(
        userResponse.trim(),
        {
          exercise: currentExercise,
          step: currentStep,
          tense,
          mood,
          expectedElements: currentStep.expectedElements || []
        }
      );

      // Combinar resultados
      const combinedResult = {
        ...result,
        assessment,
        userResponse: userResponse.trim(),
        timestamp: Date.now()
      };

      // Guardar resultado
      setExerciseResults(prev => [...prev, combinedResult]);

      // Actualizar progreso usando el sistema SRS
      if (combinedResult.success) {
        await handleProgressUpdate(combinedResult);
      }

      // Obtener siguiente paso o completar ejercicio
      if (result.nextStep) {
        setCurrentStep(result.nextStep);
        setUserResponse('');
      } else {
        // Ejercicio completado
        await completeExercise(combinedResult);
      }

    } catch (err) {
      console.error('❌ Error al procesar respuesta:', err);
      setError('Error al procesar la respuesta. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleProgressUpdate(result) {
    try {
      const userId = getCurrentUserId();
      if (!userId) return;

      // Simular item para el sistema SRS
      const mockItem = {
        id: `meaningful_practice_${tense}_${mood}`,
        verb: currentExercise.title,
        form: `${mood}_${tense}`,
        mood,
        tense,
        type: 'meaningful_practice'
      };

      // Calcular puntuación para el sistema de progreso
      const score = calculateProgressScore(result);
      const isCorrect = score >= 0.7;

      // Actualizar SRS
      await updateSchedule(userId, mockItem.id, isCorrect);

      // Registrar con el sistema de seguimiento
      await handleResult(mockItem, {
        userAnswer: result.userResponse,
        isCorrect,
        score,
        timeSpent: Date.now() - (result.timestamp || Date.now()),
        errorTags: extractErrorTags(result.assessment),
        metadata: {
          exerciseType: currentExercise.type,
          difficulty: currentExercise.difficulty,
          wordCount: result.userResponse.split(/\s+/).length
        }
      });

    } catch (err) {
      console.error('❌ Error al actualizar progreso:', err);
    }
  }

  function calculateProgressScore(result) {
    let score = 0.5; // Base score

    // Puntuación por éxito del ejercicio
    if (result.success) score += 0.3;

    // Puntuación por calidad del assessment
    if (result.assessment) {
      const { grammarScore, creativityScore, contentScore } = result.assessment;
      score += (grammarScore * 0.1) + (creativityScore * 0.05) + (contentScore * 0.05);
    }

    // Puntuación por análisis específico del ejercicio
    if (result.analysis) {
      if (result.analysis.isCorrect || result.analysis.meetsRequirements) score += 0.2;
      if (result.analysis.qualityScore) score += result.analysis.qualityScore * 0.1;
    }

    return Math.min(score, 1.0);
  }

  function extractErrorTags(assessment) {
    if (!assessment || !assessment.errors) return [];

    const errorTags = [];

    assessment.errors.forEach(error => {
      switch (error.category) {
        case 'conjugation':
          errorTags.push(ERROR_TAGS.CONJUGATION_ERROR);
          break;
        case 'tense':
          errorTags.push(ERROR_TAGS.WRONG_TENSE);
          break;
        case 'agreement':
          errorTags.push(ERROR_TAGS.AGREEMENT_ERROR);
          break;
        default:
          errorTags.push(ERROR_TAGS.OTHER);
      }
    });

    return [...new Set(errorTags)];
  }

  async function completeExercise(finalResult) {
    try {
      // Generar resumen del ejercicio
      const exerciseStats = currentExercise.getExerciseStats();
      const summary = {
        exercise: currentExercise.title,
        type: currentExercise.type,
        totalSteps: currentExercise.getTotalSteps(),
        results: exerciseResults.length + 1, // +1 for final result
        averageScore: calculateAverageScore([...exerciseResults, finalResult]),
        timeSpent: calculateTotalTime(),
        completedAt: Date.now()
      };

      console.log('✅ Ejercicio completado:', summary);

      // Llamar callback de completación
      if (onComplete) {
        onComplete({
          success: true,
          summary,
          finalResult,
          stats: exerciseStats
        });
      }

    } catch (err) {
      console.error('❌ Error al completar ejercicio:', err);
    }
  }

  function calculateAverageScore(results) {
    if (results.length === 0) return 0;
    const totalScore = results.reduce((sum, result) => {
      return sum + calculateProgressScore(result);
    }, 0);
    return totalScore / results.length;
  }

  function calculateTotalTime() {
    if (exerciseResults.length === 0) return 0;
    const firstTimestamp = exerciseResults[0]?.timestamp || Date.now();
    return Date.now() - firstTimestamp;
  }

  function handleHint() {
    if (currentStep && currentStep.instructions) {
      handleHintShown();
      // Mostrar hint en UI (implementación específica del tipo de ejercicio)
      alert(currentStep.instructions);
    }
  }

  // Renderizado condicional basado en el estado
  if (isLoading) {
    return (
      <div className="meaningful-practice-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Preparando ejercicio de práctica...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="meaningful-practice-container">
        <div className="error-state">
          <h3>❌ Error</h3>
          <p>{error}</p>
          <button onClick={initializeExercise} className="retry-button">
            Intentar de nuevo
          </button>
        </div>
      </div>
    );
  }

  if (!currentExercise || !currentStep) {
    return (
      <div className="meaningful-practice-container">
        <div className="empty-state">
          <p>No hay ejercicios disponibles para este tiempo verbal.</p>
        </div>
      </div>
    );
  }

  // Renderizado principal del ejercicio
  return (
    <div className="meaningful-practice-container">
      {/* Navigation Header */}
      <div className="drill-header">
        <div className="header-nav">
          {onBack && (
            <button onClick={onBack} className="back-to-menu-btn" aria-label="Volver">
              <img src="/back.png" alt="Volver" className="back-icon" />
            </button>
          )}
          {onHome && (
            <button onClick={onHome} className="home-btn" aria-label="Inicio">
              <img src="/home.png" alt="Inicio" className="home-icon large-icon" />
            </button>
          )}
        </div>
        <h2>Práctica Significativa</h2>
      </div>

      <ExerciseHeader
        exercise={currentExercise}
        step={currentStep}
        tense={tense}
        mood={mood}
      />

      <ExerciseContent
        step={currentStep}
        userResponse={userResponse}
        onResponseChange={setUserResponse}
        onSubmit={handleSubmit}
        onHint={handleHint}
        isSubmitting={isSubmitting}
        results={exerciseResults}
      />

      {exerciseResults.length > 0 && (
        <ExerciseProgress
          results={exerciseResults}
          currentStep={currentStep}
          totalSteps={currentExercise.getTotalSteps()}
        />
      )}
    </div>
  );
}

// Componente para mostrar el encabezado del ejercicio
function ExerciseHeader({ exercise, step, tense, mood }) {
  return (
    <div className="exercise-header">
      <div className="exercise-info">
        <h2>{exercise.title}</h2>
        <p className="exercise-description">{exercise.description}</p>
        <div className="exercise-meta">
          <span className="tense-label">{formatMoodTense(mood, tense)}</span>
          <span className="difficulty-label">{exercise.difficulty}</span>
          <span className="exercise-type">{exercise.type}</span>
        </div>
      </div>

      {step && (
        <div className="step-info">
          <h3>{step.title || `Paso ${exercise.getCurrentStep()}`}</h3>
          {step.instructions && (
            <p className="step-instructions">{step.instructions}</p>
          )}
        </div>
      )}
    </div>
  );
}

// Componente para mostrar el contenido del ejercicio
function ExerciseContent({
  step,
  userResponse,
  onResponseChange,
  onSubmit,
  onHint,
  isSubmitting,
  results
}) {
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      onSubmit();
    }
  };

  const renderStepContent = () => {
    switch (step.type) {
      case 'timeline_input':
        return (
          <TimelineStepContent
            step={step}
            userResponse={userResponse}
            onResponseChange={onResponseChange}
            onKeyPress={handleKeyPress}
          />
        );

      case 'story_building_input':
        return (
          <StoryBuildingStepContent
            step={step}
            userResponse={userResponse}
            onResponseChange={onResponseChange}
            onKeyPress={handleKeyPress}
          />
        );

      case 'role_playing_interaction':
        return (
          <RolePlayingStepContent
            step={step}
            userResponse={userResponse}
            onResponseChange={onResponseChange}
            onKeyPress={handleKeyPress}
          />
        );

      case 'problem_solving_decision':
        return (
          <ProblemSolvingStepContent
            step={step}
            userResponse={userResponse}
            onResponseChange={onResponseChange}
            onKeyPress={handleKeyPress}
          />
        );

      default:
        return (
          <DefaultStepContent
            step={step}
            userResponse={userResponse}
            onResponseChange={onResponseChange}
            onKeyPress={handleKeyPress}
          />
        );
    }
  };

  return (
    <div className="exercise-content">
      {renderStepContent()}

      {/* Mostrar resultados anteriores */}
      {results.length > 0 && (
        <div className="previous-results">
          {results.slice(-2).map((result, index) => (
            <div key={index} className="result-feedback">
              <p className={`feedback ${result.success ? 'success' : 'needs-improvement'}`}>
                {result.feedback}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Controles del ejercicio */}
      <div className="exercise-controls">
        <button
          onClick={onHint}
          className="hint-button"
          disabled={isSubmitting}
        >
          Pista
        </button>

        <button
          onClick={onSubmit}
          className="submit-button"
          disabled={!userResponse.trim() || isSubmitting}
        >
          {isSubmitting ? 'Procesando...' : 'Enviar respuesta'}
        </button>
      </div>
    </div>
  );
}

// Componentes específicos para cada tipo de ejercicio
function TimelineStepContent({ step, userResponse, onResponseChange, onKeyPress }) {
  return (
    <div className="timeline-step">
      {step.prompts && (
        <div className="timeline-prompts">
          {step.prompts.map((prompt, index) => (
            <div key={index} className="timeline-prompt">
              <span className="prompt-icon">
                {prompt.icon?.startsWith('/') ? (
                  <img src={prompt.icon} alt="" className="icon-image" />
                ) : (
                  prompt.icon
                )}
              </span>
              <span className="prompt-text">{prompt.text}</span>
            </div>
          ))}
        </div>
      )}

      <textarea
        value={userResponse}
        onChange={(e) => onResponseChange(e.target.value)}
        onKeyPress={onKeyPress}
        placeholder={step.placeholder || "Describe la línea de tiempo usando los verbos indicados..."}
        className="response-textarea timeline-textarea"
        rows={6}
      />
    </div>
  );
}

function StoryBuildingStepContent({ step, userResponse, onResponseChange, onKeyPress }) {
  return (
    <div className="story-building-step">
      {step.elements && (
        <div className="story-elements">
          <h4>Elementos para tu historia:</h4>
          {Object.entries(step.elements).map(([category, items]) => (
            <div key={category} className="element-category">
              <h5>{category}:</h5>
              <div className="element-items">
                {items.map((item, index) => (
                  <span key={index} className="element-item">
                    {item.name || item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <textarea
        value={userResponse}
        onChange={(e) => onResponseChange(e.target.value)}
        onKeyPress={onKeyPress}
        placeholder={step.placeholder || "Escribe tu historia aquí..."}
        className="response-textarea story-textarea"
        rows={8}
      />

      {step.showWordCount && (
        <div className="word-count">
          Palabras: {userResponse.trim().split(/\s+/).length}
          {step.minLength && ` (mínimo: ${step.minLength})`}
        </div>
      )}
    </div>
  );
}

function RolePlayingStepContent({ step, userResponse, onResponseChange, onKeyPress }) {
  return (
    <div className="role-playing-step">
      {step.scenario && (
        <div className="scenario-info">
          <h4>Situación:</h4>
          <p>{step.scenario.context}</p>
          <p><strong>Tu rol:</strong> {step.scenario.userRole}</p>
        </div>
      )}

      {step.npcMessage && (
        <div className="npc-message">
          <p><strong>{step.scenario?.npcRole || 'Interlocutor'}:</strong></p>
          <p>"{step.npcMessage}"</p>
        </div>
      )}

      <textarea
        value={userResponse}
        onChange={(e) => onResponseChange(e.target.value)}
        onKeyPress={onKeyPress}
        placeholder={step.placeholder || "Escribe tu respuesta..."}
        className="response-textarea roleplay-textarea"
        rows={4}
      />
    </div>
  );
}

function ProblemSolvingStepContent({ step, userResponse, onResponseChange, onKeyPress }) {
  return (
    <div className="problem-solving-step">
      {step.problemContext && (
        <div className="problem-context">
          <h4>Situación:</h4>
          <p>{step.problemContext.situation}</p>

          {step.problemContext.constraints && (
            <div className="constraints">
              <h5>Limitaciones:</h5>
              <ul>
                {step.problemContext.constraints.map((constraint, index) => (
                  <li key={index}>{constraint}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {step.decisionPoint && (
        <div className="decision-point">
          <h4>{step.decisionPoint.question}</h4>
          {step.decisionPoint.factors && (
            <div className="factors">
              <p><strong>Factores a considerar:</strong></p>
              <ul>
                {step.decisionPoint.factors.map((factor, index) => (
                  <li key={index}>{factor}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <textarea
        value={userResponse}
        onChange={(e) => onResponseChange(e.target.value)}
        onKeyPress={onKeyPress}
        placeholder={step.placeholder || "Desarrolla tu análisis y propuesta..."}
        className="response-textarea problem-solving-textarea"
        rows={8}
      />
    </div>
  );
}

function DefaultStepContent({ step, userResponse, onResponseChange, onKeyPress }) {
  return (
    <div className="default-step">
      {step.prompts && (
        <div className="prompts">
          {step.prompts.map((prompt, index) => (
            <div key={index} className="prompt">
              {prompt.icon && (
                <span className="prompt-icon">
                  {prompt.icon?.startsWith('/') ? (
                    <img src={prompt.icon} alt="" className="icon-image" />
                  ) : (
                    prompt.icon
                  )}
                </span>
              )}
              <span className="prompt-text">{prompt.text || prompt}</span>
            </div>
          ))}
        </div>
      )}

      <textarea
        value={userResponse}
        onChange={(e) => onResponseChange(e.target.value)}
        onKeyPress={onKeyPress}
        placeholder={step.placeholder || "Escribe tu respuesta..."}
        className="response-textarea"
        rows={6}
      />
    </div>
  );
}

// Componente para mostrar el progreso del ejercicio
function ExerciseProgress({ results, currentStep, totalSteps }) {
  const completedSteps = results.length;
  const progressPercentage = (completedSteps / totalSteps) * 100;

  return (
    <div className="exercise-progress">
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
      <p className="progress-text">
        Paso {completedSteps + 1} de {totalSteps}
      </p>
    </div>
  );
}

export default MeaningfulPractice;