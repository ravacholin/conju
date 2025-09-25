import React, { useState, useMemo } from 'react'
import { ERROR_TAGS } from '../../lib/progress/dataModels.js'
import './PersonalizedErrorCoach.css'

export default function PersonalizedErrorCoach({
  attempts = [],
  userProgress = {},
  onStartPractice,
  currentFlowState = 'neutral',
  currentMomentum = 'steady'
}) {
  const [coachingSession, setCoachingSession] = useState(null)
  const [coachPersonality, setCoachPersonality] = useState('encouraging') // encouraging, analytical, motivational
  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false)

  const coachingInsights = useMemo(() => {
    return generatePersonalizedCoaching(attempts, userProgress, currentFlowState, currentMomentum)
  }, [attempts, userProgress, currentFlowState, currentMomentum])

  const adaptiveStrategies = useMemo(() => {
    return generateAdaptiveStrategies(coachingInsights, currentFlowState, currentMomentum)
  }, [coachingInsights, currentFlowState, currentMomentum])

  function startCoachingSession(insight) {
    setCoachingSession({
      insight,
      startTime: new Date(),
      personalizedPlan: generatePersonalizedPlan(insight, coachPersonality),
      emotionalSupport: generateEmotionalSupport(insight, currentFlowState),
      practiceRecommendations: generatePracticeRecommendations(insight, userProgress)
    })
  }

  function endCoachingSession() {
    setCoachingSession(null)
  }

  return (
    <div className="personalized-error-coach">
      <div className="coach-header">
        <div className="coach-avatar">
          <div className="avatar-icon"></div>
          <div className="coach-info">
            <h2>Tu Coach Personal de Errores</h2>
            <p>Análisis inteligente adaptado a tu estilo de aprendizaje</p>
          </div>
        </div>

        <div className="coach-personality-selector">
          <label>Estilo del Coach:</label>
          <select
            value={coachPersonality}
            onChange={(e) => setCoachPersonality(e.target.value)}
          >
            <option value="encouraging"> Motivador</option>
            <option value="analytical"> Analítico</option>
            <option value="supportive">🤗 Empático</option>
            <option value="strategic">♟️ Estratégico</option>
          </select>
        </div>
      </div>

      {coachingSession ? (
        <CoachingSessionView
          session={coachingSession}
          personality={coachPersonality}
          onEndSession={endCoachingSession}
          onStartPractice={onStartPractice}
        />
      ) : (
        <CoachingDashboard
          insights={coachingInsights}
          strategies={adaptiveStrategies}
          personality={coachPersonality}
          currentFlowState={currentFlowState}
          currentMomentum={currentMomentum}
          onStartSession={startCoachingSession}
          onStartPractice={onStartPractice}
          showDetailed={showDetailedAnalysis}
          onToggleDetailed={() => setShowDetailedAnalysis(!showDetailedAnalysis)}
        />
      )}
    </div>
  )
}

function CoachingDashboard({
  insights,
  strategies,
  personality,
  currentFlowState,
  currentMomentum,
  onStartSession,
  onStartPractice,
  showDetailed,
  onToggleDetailed
}) {
  return (
    <div className="coaching-dashboard">
      {/* Estado Emocional Actual */}
      <div className="current-state-panel">
        <h3> Tu Estado Actual</h3>
        <div className="state-indicators">
          <div className="state-item">
            <span className="state-label">Flow:</span>
            <span className={`state-value flow-${currentFlowState}`}>
              {getFlowStateEmoji(currentFlowState)} {formatFlowState(currentFlowState)}
            </span>
          </div>
          <div className="state-item">
            <span className="state-label">Momentum:</span>
            <span className={`state-value momentum-${currentMomentum}`}>
              {getMomentumEmoji(currentMomentum)} {formatMomentum(currentMomentum)}
            </span>
          </div>
        </div>
        <div className="state-recommendation">
          {generateStateBasedRecommendation(currentFlowState, currentMomentum, personality)}
        </div>
      </div>

      {/* Insights Principales */}
      <div className="primary-insights">
        <div className="insights-header">
          <h3> Insights Principales</h3>
          <button
            className="toggle-detailed-btn"
            onClick={onToggleDetailed}
          >
            {showDetailed ? '️ Vista Simple' : ' Vista Detallada'}
          </button>
        </div>

        <div className="insights-grid">
          {insights.slice(0, showDetailed ? insights.length : 3).map((insight, index) => (
            <InsightCard
              key={insight.id}
              insight={insight}
              personality={personality}
              priority={index === 0 ? 'primary' : index === 1 ? 'secondary' : 'tertiary'}
              onStartSession={onStartSession}
              onStartPractice={onStartPractice}
            />
          ))}
        </div>
      </div>

      {/* Estrategias Adaptativas */}
      <div className="adaptive-strategies">
        <h3> Estrategias Personalizadas</h3>
        <div className="strategies-container">
          {strategies.map(strategy => (
            <StrategyCard
              key={strategy.id}
              strategy={strategy}
              personality={personality}
              onApply={(strategy) => onStartPractice(strategy.practiceConfig)}
            />
          ))}
        </div>
      </div>

      {/* Mini-lecciones */}
      <div className="mini-lessons">
        <h3> Mini-Lecciones Personalizadas</h3>
        <div className="lessons-grid">
          {generateMiniLessons(insights).map(lesson => (
            <MiniLessonCard
              key={lesson.id}
              lesson={lesson}
              personality={personality}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function InsightCard({ insight, personality, priority, onStartSession, onStartPractice }) {
  const message = getPersonalizedMessage(insight, personality)

  return (
    <div className={`insight-card ${priority} ${insight.urgency}`}>
      <div className="insight-header">
        <div className="insight-icon">{insight.icon}</div>
        <div className="insight-title-section">
          <h4>{insight.title}</h4>
          <span className={`urgency-badge ${insight.urgency}`}>
            {formatUrgency(insight.urgency)}
          </span>
        </div>
      </div>

      <div className="insight-message">
        {message}
      </div>

      <div className="insight-stats">
        {Object.entries(insight.stats).map(([key, value]) => (
          <div key={key} className="stat-item">
            <span className="stat-label">{formatStatLabel(key)}:</span>
            <span className="stat-value">{formatStatValue(key, value)}</span>
          </div>
        ))}
      </div>

      <div className="insight-prediction">
        <strong> Predicción:</strong> {insight.prediction}
      </div>

      <div className="insight-actions">
        <button
          className="primary-action-btn"
          onClick={() => onStartSession(insight)}
        >
           Sesión de Coaching
        </button>
        {insight.quickPractice && (
          <button
            className="quick-action-btn"
            onClick={() => onStartPractice(insight.quickPractice)}
          >
             Práctica Rápida
          </button>
        )}
      </div>
    </div>
  )
}

function StrategyCard({ strategy, personality, onApply }) {
  return (
    <div className={`strategy-card ${strategy.effectiveness}`}>
      <div className="strategy-header">
        <div className="strategy-icon">{strategy.icon}</div>
        <div className="strategy-info">
          <h4>{strategy.name}</h4>
          <div className="effectiveness-indicator">
            <span className="effectiveness-label">Efectividad:</span>
            <div className="effectiveness-bars">
              {Array.from({length: 5}, (_, i) => (
                <div
                  key={i}
                  className={`bar ${i < strategy.effectivenessLevel ? 'filled' : ''}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="strategy-description">
        {getPersonalizedStrategyDescription(strategy, personality)}
      </div>

      <div className="strategy-benefits">
        <h5> Beneficios:</h5>
        <ul>
          {strategy.benefits.map((benefit, index) => (
            <li key={index}>{benefit}</li>
          ))}
        </ul>
      </div>

      <div className="strategy-implementation">
        <h5>️ Cómo implementar:</h5>
        <ol>
          {strategy.steps.map((step, index) => (
            <li key={index}>{step}</li>
          ))}
        </ol>
      </div>

      <button
        className="apply-strategy-btn"
        onClick={() => onApply(strategy)}
      >
         Aplicar Estrategia
      </button>
    </div>
  )
}

function MiniLessonCard({ lesson, personality }) {
  return (
    <div className="mini-lesson-card">
      <div className="lesson-header">
        <div className="lesson-icon">{lesson.icon}</div>
        <div className="lesson-info">
          <h4>{lesson.title}</h4>
          <span className="lesson-duration">⏱️ {lesson.duration} min</span>
        </div>
      </div>

      <div className="lesson-content">
        <div className="lesson-explanation">
          {getPersonalizedExplanation(lesson, personality)}
        </div>

        <div className="lesson-examples">
          <h5> Ejemplos:</h5>
          {lesson.examples.map((example, index) => (
            <div key={index} className="example-item">
              <span className="incorrect">❌ {example.incorrect}</span>
              <span className="correct">✅ {example.correct}</span>
              <span className="reason"> {example.reason}</span>
            </div>
          ))}
        </div>

        <div className="lesson-tips">
          <h5> Tips para recordar:</h5>
          <ul>
            {lesson.memoryTips.map((tip, index) => (
              <li key={index}>{tip}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

function CoachingSessionView({ session, personality, onEndSession, onStartPractice }) {
  const [sessionStep, setSessionStep] = useState('analysis') // analysis, plan, practice, reflection

  return (
    <div className="coaching-session">
      <div className="session-header">
        <h2> Sesión de Coaching: {session.insight.title}</h2>
        <div className="session-progress">
          <div className={`step ${sessionStep === 'analysis' ? 'active' : sessionStep === 'plan' || sessionStep === 'practice' || sessionStep === 'reflection' ? 'completed' : ''}`}>
             Análisis
          </div>
          <div className={`step ${sessionStep === 'plan' ? 'active' : sessionStep === 'practice' || sessionStep === 'reflection' ? 'completed' : ''}`}>
             Plan
          </div>
          <div className={`step ${sessionStep === 'practice' ? 'active' : sessionStep === 'reflection' ? 'completed' : ''}`}>
             Práctica
          </div>
          <div className={`step ${sessionStep === 'reflection' ? 'active' : ''}`}>
            🤔 Reflexión
          </div>
        </div>
        <button className="close-session-btn" onClick={onEndSession}>✕</button>
      </div>

      <div className="session-content">
        {sessionStep === 'analysis' && (
          <AnalysisStep
            insight={session.insight}
            personality={personality}
            onNext={() => setSessionStep('plan')}
          />
        )}

        {sessionStep === 'plan' && (
          <PlanStep
            personalizedPlan={session.personalizedPlan}
            personality={personality}
            onNext={() => setSessionStep('practice')}
            onBack={() => setSessionStep('analysis')}
          />
        )}

        {sessionStep === 'practice' && (
          <PracticeStep
            recommendations={session.practiceRecommendations}
            personality={personality}
            onStartPractice={onStartPractice}
            onNext={() => setSessionStep('reflection')}
            onBack={() => setSessionStep('plan')}
          />
        )}

        {sessionStep === 'reflection' && (
          <ReflectionStep
            session={session}
            personality={personality}
            onFinish={onEndSession}
            onBack={() => setSessionStep('practice')}
          />
        )}
      </div>
    </div>
  )
}

function AnalysisStep({ insight, personality, onNext }) {
  return (
    <div className="analysis-step">
      <div className="coach-message">
        <div className="coach-avatar-mini"></div>
        <div className="message-bubble">
          {getPersonalizedAnalysisMessage(insight, personality)}
        </div>
      </div>

      <div className="analysis-details">
        <div className="problem-breakdown">
          <h4> Desglose del Problema</h4>
          <div className="breakdown-items">
            {insight.breakdown.map((item, index) => (
              <div key={index} className="breakdown-item">
                <div className="item-icon">{item.icon}</div>
                <div className="item-content">
                  <h5>{item.aspect}</h5>
                  <p>{item.description}</p>
                  <div className="severity-indicator">
                    <span>Severidad: </span>
                    <div className={`severity-level ${item.severity}`}>
                      {item.severity}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="root-cause-analysis">
          <h4> Análisis de Causa Raíz</h4>
          <div className="cause-chain">
            {insight.rootCauses.map((cause, index) => (
              <div key={index} className="cause-item">
                <div className="cause-level">Nivel {index + 1}</div>
                <div className="cause-description">{cause}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <button className="next-step-btn" onClick={onNext}>
        Continuar al Plan 
      </button>
    </div>
  )
}

function PlanStep({ personalizedPlan, personality, onNext, onBack }) {
  return (
    <div className="plan-step">
      <div className="coach-message">
        <div className="coach-avatar-mini"></div>
        <div className="message-bubble">
          {getPersonalizedPlanMessage(personalizedPlan, personality)}
        </div>
      </div>

      <div className="plan-details">
        <div className="plan-phases">
          {personalizedPlan.phases.map((phase, index) => (
            <div key={index} className="phase-card">
              <div className="phase-header">
                <div className="phase-number">{index + 1}</div>
                <h4>{phase.name}</h4>
                <span className="phase-duration">{phase.duration}</span>
              </div>
              <div className="phase-objectives">
                <h5> Objetivos:</h5>
                <ul>
                  {phase.objectives.map((objective, i) => (
                    <li key={i}>{objective}</li>
                  ))}
                </ul>
              </div>
              <div className="phase-activities">
                <h5> Actividades:</h5>
                <ul>
                  {phase.activities.map((activity, i) => (
                    <li key={i}>{activity}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="step-navigation">
        <button className="back-btn" onClick={onBack}>
          ← Volver al Análisis
        </button>
        <button className="next-step-btn" onClick={onNext}>
          Empezar Práctica 
        </button>
      </div>
    </div>
  )
}

function PracticeStep({ recommendations, personality, onStartPractice, onNext, onBack }) {
  return (
    <div className="practice-step">
      <div className="coach-message">
        <div className="coach-avatar-mini"></div>
        <div className="message-bubble">
          {getPersonalizedPracticeMessage(recommendations, personality)}
        </div>
      </div>

      <div className="practice-options">
        {recommendations.map((rec, index) => (
          <div key={index} className="practice-option">
            <div className="option-header">
              <div className="option-icon">{rec.icon}</div>
              <h4>{rec.name}</h4>
              <span className="difficulty">{rec.difficulty}</span>
            </div>
            <p>{rec.description}</p>
            <div className="option-benefits">
              <strong>Beneficios:</strong> {rec.benefits.join(', ')}
            </div>
            <button
              className="start-practice-btn"
              onClick={() => onStartPractice(rec.config)}
            >
               Comenzar
            </button>
          </div>
        ))}
      </div>

      <div className="step-navigation">
        <button className="back-btn" onClick={onBack}>
          ← Revisar Plan
        </button>
        <button className="skip-btn" onClick={onNext}>
          Saltar a Reflexión →
        </button>
      </div>
    </div>
  )
}

function ReflectionStep({ session, personality, onFinish, onBack }) {
  return (
    <div className="reflection-step">
      <div className="coach-message">
        <div className="coach-avatar-mini"></div>
        <div className="message-bubble">
          {getPersonalizedReflectionMessage(session, personality)}
        </div>
      </div>

      <div className="reflection-content">
        <div className="session-summary">
          <h4> Resumen de la Sesión</h4>
          <div className="summary-stats">
            <div className="stat">
              <span className="stat-label">Duración:</span>
              <span className="stat-value">
                {Math.round((Date.now() - new Date(session.startTime)) / 60000)} min
              </span>
            </div>
            <div className="stat">
              <span className="stat-label">Problema Principal:</span>
              <span className="stat-value">{session.insight.title}</span>
            </div>
          </div>
        </div>

        <div className="key-takeaways">
          <h4> Puntos Clave</h4>
          <ul>
            {session.insight.keyTakeaways.map((takeaway, index) => (
              <li key={index}>{takeaway}</li>
            ))}
          </ul>
        </div>

        <div className="next-steps">
          <h4> Próximos Pasos</h4>
          <ol>
            {session.personalizedPlan.nextSteps.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ol>
        </div>
      </div>

      <div className="step-navigation">
        <button className="back-btn" onClick={onBack}>
          ← Volver a Práctica
        </button>
        <button className="finish-btn" onClick={onFinish}>
          ✅ Finalizar Sesión
        </button>
      </div>
    </div>
  )
}

// Funciones de generación de contenido personalizado
function generatePersonalizedCoaching(attempts, userProgress, currentFlowState, currentMomentum) {
  const insights = []

  // Análisis de errores recurrentes
  const errorAnalysis = analyzeRecurringErrors(attempts)
  if (errorAnalysis.length > 0) {
    insights.push({
      id: 'recurring-errors',
      icon: '',
      title: 'Errores Recurrentes Detectados',
      urgency: 'high',
      stats: {
        errorCount: errorAnalysis.length,
        frequency: errorAnalysis[0].frequency,
        trend: 'increasing'
      },
      prediction: `Si no abordas estos patrones, podrían convertirse en hábitos permanentes en 2-3 semanas`,
      breakdown: errorAnalysis.map(error => ({
        icon: getErrorIcon(error.type),
        aspect: getErrorTagLabel(error.type),
        description: `Aparece en ${error.frequency}% de tus errores recientes`,
        severity: error.frequency > 30 ? 'high' : 'medium'
      })),
      rootCauses: [
        'Falta de práctica específica en este patrón',
        'Posible interferencia con la lengua materna',
        'Aplicación incorrecta de reglas generales'
      ],
      keyTakeaways: [
        'Los errores recurrentes requieren práctica dirigida',
        'La identificación temprana previene la fosilización',
        'Cada tipo de error necesita una estrategia específica'
      ],
      quickPractice: {
        errorType: errorAnalysis[0].type,
        targetCount: 10
      }
    })
  }

  // Análisis de estado emocional
  if (currentFlowState === 'frustrated' || currentMomentum === 'declining') {
    insights.push({
      id: 'emotional-barrier',
      icon: '',
      title: 'Barrera Emocional Detectada',
      urgency: 'critical',
      stats: {
        flowState: currentFlowState,
        momentum: currentMomentum,
        confidenceLevel: 'low'
      },
      prediction: `Tu estado emocional actual podría impactar negativamente tu aprendizaje por los próximos días`,
      breakdown: [{
        icon: '',
        aspect: 'Estado Mental',
        description: 'Frustración o momentum negativo afecta la retención',
        severity: 'high'
      }],
      rootCauses: [
        'Secuencia de errores ha afectado la confianza',
        'Expectativas muy altas para el nivel actual',
        'Falta de retroalimentación positiva reciente'
      ],
      keyTakeaways: [
        'El estado emocional es tan importante como la técnica',
        'Pequeños éxitos construyen confianza',
        'El descanso puede ser productivo'
      ]
    })
  }

  // Análisis de plateau
  const plateauAnalysis = detectLearningPlateau(attempts)
  if (plateauAnalysis.isInPlateau) {
    insights.push({
      id: 'learning-plateau',
      icon: '',
      title: 'Plateau de Aprendizaje',
      urgency: 'medium',
      stats: {
        duration: plateauAnalysis.duration,
        avgAccuracy: plateauAnalysis.avgAccuracy,
        variation: plateauAnalysis.variation
      },
      prediction: `Un cambio de estrategia podría acelerar tu progreso significativamente`,
      breakdown: [{
        icon: '',
        aspect: 'Progreso Estancado',
        description: 'Tu precisión se mantiene estable sin mejora',
        severity: 'medium'
      }],
      rootCauses: [
        'Zona de confort: practicas solo lo que dominas',
        'Falta de variedad en ejercicios',
        'Necesidad de mayor complejidad'
      ],
      keyTakeaways: [
        'Los plateaus son normales y temporales',
        'La variedad reaviva el aprendizaje',
        'Pequeños cambios pueden generar grandes saltos'
      ]
    })
  }

  return insights.sort((a, b) => {
    const urgencyOrder = { critical: 3, high: 2, medium: 1, low: 0 }
    return urgencyOrder[b.urgency] - urgencyOrder[a.urgency]
  })
}

function generateAdaptiveStrategies(insights, currentFlowState, _currentMomentum) {
  const strategies = []

  // Estrategia para errores recurrentes
  const recurringErrorInsight = insights.find(i => i.id === 'recurring-errors')
  if (recurringErrorInsight) {
    strategies.push({
      id: 'pattern-interruption',
      name: 'Interrupción de Patrones',
      icon: '',
      effectiveness: 'high',
      effectivenessLevel: 4,
      description: 'Rompe el ciclo de errores recurrentes con práctica específica y consciente',
      benefits: [
        'Interrumpe la formación de malos hábitos',
        'Crea nuevas conexiones neuronales',
        'Aumenta la conciencia metalingüística'
      ],
      steps: [
        'Identifica el momento exacto donde ocurre el error',
        'Practica la forma correcta 10 veces seguidas',
        'Introduce variaciones del mismo patrón',
        'Practica en contextos diferentes'
      ],
      practiceConfig: {
        focusMode: 'error-specific',
        targetError: recurringErrorInsight.breakdown[0]?.aspect,
        repetitions: 15,
        intensity: 'high'
      }
    })
  }

  // Estrategia para estado emocional
  if (currentFlowState === 'frustrated') {
    strategies.push({
      id: 'confidence-rebuild',
      name: 'Reconstrucción de Confianza',
      icon: '',
      effectiveness: 'high',
      effectivenessLevel: 5,
      description: 'Recupera la confianza con éxitos graduales y celebración de progreso',
      benefits: [
        'Restaura la confianza perdida',
        'Genera momentum positivo',
        'Mejora la actitud hacia el aprendizaje'
      ],
      steps: [
        'Empieza con ejercicios que domines (80%+ precisión)',
        'Celebra cada pequeño éxito',
        'Aumenta dificultad muy gradualmente',
        'Lleva un diario de logros diarios'
      ],
      practiceConfig: {
        focusMode: 'confidence-building',
        difficultyLevel: 'easy',
        successThreshold: 0.9,
        celebrationMode: true
      }
    })
  }

  // Estrategia para plateau
  if (insights.some(i => i.id === 'learning-plateau')) {
    strategies.push({
      id: 'variety-injection',
      name: 'Inyección de Variedad',
      icon: '',
      effectiveness: 'medium',
      effectivenessLevel: 3,
      description: 'Introduce variedad y complejidad para superar el estancamiento',
      benefits: [
        'Estimula el cerebro de nuevas formas',
        'Previene el aburrimiento',
        'Acelera el aprendizaje por novedad'
      ],
      steps: [
        'Cambia el tipo de ejercicio cada día',
        'Introduce verbos de nueva familia irregular',
        'Practica en diferentes contextos temporales',
        'Alterna entre modos y tiempos'
      ],
      practiceConfig: {
        focusMode: 'variety-boost',
        exerciseTypes: ['mixed', 'contextual', 'speed'],
        newContent: true
      }
    })
  }

  return strategies
}

function generateMiniLessons(insights) {
  const lessons = []

  insights.forEach(insight => {
    if (insight.breakdown) {
      insight.breakdown.forEach(breakdown => {
        lessons.push({
          id: `lesson-${breakdown.aspect.toLowerCase().replace(/\s+/g, '-')}`,
          icon: breakdown.icon,
          title: `Domina: ${breakdown.aspect}`,
          duration: 3,
          examples: generateExamplesForError(breakdown.aspect),
          memoryTips: generateMemoryTips(breakdown.aspect)
        })
      })
    }
  })

  return lessons.slice(0, 3) // Límite de 3 mini-lecciones
}

// Funciones auxiliares para personalización
function getPersonalizedMessage(insight, personality) {
  const messages = {
    encouraging: {
      'recurring-errors': "¡Hey! He notado un patrón en tus errores, pero esto es genial - significa que ya sé exactamente cómo ayudarte a mejorar! ",
      'emotional-barrier': "Entiendo que puede ser frustrante, pero recuerda que cada error es un paso hacia el dominio. ¡Estás más cerca de lo que piensas! ",
      'learning-plateau': "¡Es hora de un breakthrough! Los plateaus son señal de que estás listo para el siguiente nivel. "
    },
    analytical: {
      'recurring-errors': "Análisis: detecté un patrón específico que requiere intervención dirigida. Los datos muestran una correlación clara. ",
      'emotional-barrier': "Estado emocional subóptimo detectado. Recomiendo ajuste de estrategia para optimizar condiciones de aprendizaje. ",
      'learning-plateau': "Métricas indican estabilización de progreso. Análisis sugiere necesidad de incrementar variabilidad de estímulos. "
    },
    supportive: {
      'recurring-errors': "Está bien, todos tenemos nuestros desafíos. Vamos a trabajar juntos para superar esto paso a paso. 🤗",
      'emotional-barrier': "Siento que estés pasando por esto. Es completamente normal. Vamos a encontrar una forma que funcione mejor para ti. ",
      'learning-plateau': "No te preocupes por el plateau. Es parte natural del aprendizaje. Te voy a acompañar para salir de aquí. "
    },
    strategic: {
      'recurring-errors': "Patrón identificado. Estrategia: práctica dirigida con refuerzo positivo. Plan de acción definido. ♟️",
      'emotional-barrier': "Estado emocional impacta performance. Estrategia: recalibración mediante éxitos tempranos. ",
      'learning-plateau': "Plateau detectado. Estrategia: diversificación de ejercicios y aumento de complejidad gradual. "
    }
  }

  return messages[personality]?.[insight.id] || messages.encouraging[insight.id] || "Te ayudo a mejorar este aspecto."
}

// Más funciones auxiliares...
function analyzeRecurringErrors(attempts) {
  const errorCounts = {}
  const recentAttempts = attempts.slice(-100).filter(a => !a.correct)

  recentAttempts.forEach(attempt => {
    if (Array.isArray(attempt.errorTags)) {
      attempt.errorTags.forEach(tag => {
        errorCounts[tag] = (errorCounts[tag] || 0) + 1
      })
    }
  })

  return Object.entries(errorCounts)
    .filter(([, count]) => count >= 5)
    .map(([type, count]) => ({
      type,
      frequency: Math.round((count / recentAttempts.length) * 100)
    }))
    .sort((a, b) => b.frequency - a.frequency)
}

function detectLearningPlateau(attempts) {
  const recentAttempts = attempts.slice(-50)
  if (recentAttempts.length < 20) return { isInPlateau: false }

  const accuracyByDay = {}
  recentAttempts.forEach(attempt => {
    const day = new Date(attempt.createdAt).toDateString()
    if (!accuracyByDay[day]) {
      accuracyByDay[day] = { correct: 0, total: 0 }
    }
    accuracyByDay[day].total++
    if (attempt.correct) accuracyByDay[day].correct++
  })

  const dailyAccuracies = Object.values(accuracyByDay)
    .map(day => day.correct / day.total)
    .slice(-7) // última semana

  if (dailyAccuracies.length < 5) return { isInPlateau: false }

  const avg = dailyAccuracies.reduce((a, b) => a + b, 0) / dailyAccuracies.length
  const variance = dailyAccuracies.reduce((sum, acc) => sum + Math.pow(acc - avg, 2), 0) / dailyAccuracies.length

  return {
    isInPlateau: variance < 0.01, // Muy poca variación
    duration: dailyAccuracies.length,
    avgAccuracy: Math.round(avg * 100),
    variation: Math.round(Math.sqrt(variance) * 100)
  }
}

function generateExamplesForError(errorType) {
  // Simplificado - en implementación real sería más extenso
  const examples = {
    'Acentuación': [
      { incorrect: 'comio', correct: 'comió', reason: 'Hiato requiere tilde' },
      { incorrect: 'vivió', correct: 'vivió', reason: 'Diptongo no lleva tilde' }
    ],
    'Terminaciones Verbales': [
      { incorrect: 'habla', correct: 'hablé', reason: 'Primera persona pretérito' },
      { incorrect: 'comimos', correct: 'comimos', reason: 'Forma correcta' }
    ]
  }
  return examples[errorType] || []
}

function generateMemoryTips(errorType) {
  const tips = {
    'Acentuación': [
      'Recuerda: hiatos (a-í, e-ó) siempre llevan tilde',
      'Diptongos (ai, ei, oi) no llevan tilde en la vocal débil'
    ],
    'Terminaciones Verbales': [
      'Primera persona del pretérito siempre termina en -é/-í',
      'Segunda persona familiar: -aste/-iste (sin tilde)'
    ]
  }
  return tips[errorType] || ['Practica consciente y repetitiva']
}

function getFlowStateEmoji(state) {
  const emojis = {
    flow: '',
    focused: '',
    neutral: '',
    distracted: '',
    frustrated: '',
    tired: ''
  }
  return emojis[state] || ''
}

function getMomentumEmoji(momentum) {
  const emojis = {
    accelerating: '',
    steady_progress: '',
    declining: '',
    struggling: '‍'
  }
  return emojis[momentum] || ''
}

function formatFlowState(state) {
  const labels = {
    flow: 'En Flow',
    focused: 'Concentrado',
    neutral: 'Neutral',
    distracted: 'Distraído',
    frustrated: 'Frustrado',
    tired: 'Cansado'
  }
  return labels[state] || 'Neutral'
}

function formatMomentum(momentum) {
  const labels = {
    accelerating: 'Acelerando',
    steady_progress: 'Progreso Constante',
    declining: 'Declinando',
    struggling: 'Luchando'
  }
  return labels[momentum] || 'Neutral'
}

function getErrorTagLabel(tag) {
  const labels = {
    [ERROR_TAGS.ACCENT]: 'Acentuación',
    [ERROR_TAGS.VERBAL_ENDING]: 'Terminaciones Verbales',
    [ERROR_TAGS.IRREGULAR_STEM]: 'Raíces Irregulares',
    [ERROR_TAGS.WRONG_PERSON]: 'Persona Incorrecta',
    [ERROR_TAGS.WRONG_TENSE]: 'Tiempo Incorrecto',
    [ERROR_TAGS.WRONG_MOOD]: 'Modo Incorrecto'
  }
  return labels[tag] || 'Error'
}

function getErrorIcon(errorType) {
  const icons = {
    [ERROR_TAGS.ACCENT]: '´',
    [ERROR_TAGS.VERBAL_ENDING]: '',
    [ERROR_TAGS.IRREGULAR_STEM]: '',
    [ERROR_TAGS.WRONG_PERSON]: '',
    [ERROR_TAGS.WRONG_TENSE]: '',
    [ERROR_TAGS.WRONG_MOOD]: ''
  }
  return icons[errorType] || '❌'
}

function formatUrgency(urgency) {
  const labels = {
    critical: ' Crítico',
    high: '🟠 Alto',
    medium: '🟡 Medio',
    low: '🟢 Bajo'
  }
  return labels[urgency] || 'Medio'
}

function formatStatLabel(key) {
  const labels = {
    errorCount: 'Errores',
    frequency: 'Frecuencia',
    trend: 'Tendencia',
    duration: 'Duración',
    avgAccuracy: 'Precisión Promedio'
  }
  return labels[key] || key
}

function formatStatValue(key, value) {
  if (key === 'frequency') return `${value}%`
  if (key === 'avgAccuracy') return `${value}%`
  if (key === 'duration') return `${value} días`
  return value
}

// Funciones de mensajes personalizados para cada paso del coaching
function getPersonalizedAnalysisMessage(insight, personality) {
  return `Vamos a analizar en detalle qué está pasando con ${insight.title.toLowerCase()}. ${getPersonalizedMessage(insight, personality)}`
}

function getPersonalizedPlanMessage(plan, personality) {
  const messages = {
    encouraging: "¡Perfecto! He creado un plan personalizado que te va a encantar. Vamos paso a paso hacia el éxito! ",
    analytical: "Plan optimizado generado basado en tu perfil de aprendizaje y patrones de error identificados. ",
    supportive: "He preparado un plan suave y efectivo, diseñado especialmente para ti. Iremos a tu ritmo. 🤗",
    strategic: "Estrategia definida. Plan de acción estructurado en fases para máxima efectividad. ♟️"
  }
  return messages[personality] || messages.encouraging
}

function getPersonalizedPracticeMessage(recommendations, personality) {
  const messages = {
    encouraging: "¡Es hora de brillar! Elige la opción que más te motive. ¡Estoy seguro de que lo vas a hacer genial! ",
    analytical: "Opciones de práctica optimizadas para tu perfil. Cada una tiene métricas específicas de efectividad. ",
    supportive: "Aquí tienes algunas opciones gentiles. Elige la que te haga sentir más cómodo. Estaré aquí apoyándote. ",
    strategic: "Opciones tácticas disponibles. Selecciona según tus objetivos inmediatos y capacidad actual. "
  }
  return messages[personality] || messages.encouraging
}

function getPersonalizedReflectionMessage(session, personality) {
  const messages = {
    encouraging: "¡Wow! Has completado una sesión increíble. Tomemos un momento para celebrar tu progreso y planificar el siguiente paso. ",
    analytical: "Sesión completada. Revisemos los datos y métricas para optimizar futuras sesiones de entrenamiento. ",
    supportive: "Estoy muy orgulloso de ti por completar esta sesión. Reflexionemos juntos sobre lo aprendido. ",
    strategic: "Misión cumplida. Analicemos resultados y definamos estrategia para maximizar el ROI de esta sesión. ♟️"
  }
  return messages[personality] || messages.encouraging
}

function generatePersonalizedPlan(_insight, _personality) {
  return {
    phases: [
      {
        name: "Fase 1: Identificación",
        duration: "2-3 días",
        objectives: [
          "Reconocer el patrón de error instantáneamente",
          "Desarrollar conciencia del momento del error"
        ],
        activities: [
          "Ejercicios de identificación visual",
          "Práctica de auto-corrección inmediata"
        ]
      },
      {
        name: "Fase 2: Corrección",
        duration: "3-5 días",
        objectives: [
          "Aplicar la forma correcta consistentemente",
          "Automatizar la respuesta correcta"
        ],
        activities: [
          "Repetición dirigida de formas correctas",
          "Ejercicios de contraste correcto vs incorrecto"
        ]
      },
      {
        name: "Fase 3: Automatización",
        duration: "5-7 días",
        objectives: [
          "Usar la forma correcta sin esfuerzo consciente",
          "Mantener la precisión bajo presión"
        ],
        activities: [
          "Práctica en contexto real",
          "Ejercicios de velocidad y presión"
        ]
      }
    ],
    nextSteps: [
      "Continuar monitoreando el patrón específico",
      "Introducir variaciones del mismo tema",
      "Expandir a contextos más complejos"
    ]
  }
}

function generateEmotionalSupport(_insight, _currentFlowState) {
  return {
    encouragement: "Cada error es una oportunidad de crecimiento",
    techniques: ["Respiración profunda", "Visualización positiva"],
    reminders: ["Ya has superado desafíos antes", "El progreso no siempre es lineal"]
  }
}

function generatePracticeRecommendations(insight, _userProgress) {
  return [
    {
      name: "Práctica Dirigida",
      icon: "",
      difficulty: "Específica",
      description: "Enfócate únicamente en el patrón problemático",
      benefits: ["Precisión dirigida", "Corrección específica", "Resultados rápidos"],
      config: { focusMode: 'targeted', errorType: insight.breakdown[0]?.aspect }
    },
    {
      name: "Práctica Contextual",
      icon: "",
      difficulty: "Aplicada",
      description: "Practica el patrón en situaciones reales",
      benefits: ["Aplicación práctica", "Retención mejorada", "Confianza real"],
      config: { focusMode: 'contextual', realWorldScenarios: true }
    },
    {
      name: "Práctica Gradual",
      icon: "",
      difficulty: "Progresiva",
      description: "Aumenta la complejidad paso a paso",
      benefits: ["Construcción de confianza", "Aprendizaje sólido", "Menos frustración"],
      config: { focusMode: 'gradual', startEasy: true }
    }
  ]
}

function generateStateBasedRecommendation(flowState, momentum, personality) {
  if (flowState === 'frustrated' || momentum === 'declining') {
    const messages = {
      encouraging: " Te recomiendo empezar con algo fácil para recuperar confianza. ¡Cada pequeño éxito cuenta!",
      analytical: " Datos indican estado subóptimo. Recomiendo ejercicios de baja complejidad para restablecer baseline de confianza.",
      supportive: " Sé que puede ser difícil ahora. ¿Qué tal si empezamos con algo que ya domines? Estoy aquí para apoyarte.",
      strategic: "♟️ Estrategia: revertir momentum negativo con victorias tempranas. Seleccionar ejercicios con >90% probabilidad de éxito."
    }
    return messages[personality] || messages.supportive
  } else if (flowState === 'flow' || momentum === 'accelerating') {
    const messages = {
      encouraging: " ¡Estás en racha! Es el momento perfecto para desafiarte con algo nuevo.",
      analytical: " Estado óptimo detectado. Momento ideal para introducir complejidad adicional y maximizar aprendizaje.",
      supportive: " Te ves muy bien hoy. ¿Qué tal si probamos algo un poquito más desafiante?",
      strategic: " Momentum positivo detectado. Explotar ventana de oportunidad con ejercicios de alta complejidad."
    }
    return messages[personality] || messages.encouraging
  }

  return " Tu estado actual es bueno para práctica regular. ¡Vamos a mantener el ritmo!"
}

function getPersonalizedStrategyDescription(strategy, personality) {
  const descriptions = {
    encouraging: {
      'pattern-interruption': "¡Esta es una estrategia súper efectiva! Vas a romper esos patrones molestos de una vez por todas. ",
      'confidence-rebuild': "Te va a encantar esta estrategia. Está diseñada para que te sientas exitoso desde el primer momento. ",
      'variety-injection': "¡Hora de divertirse! Esta estrategia añade emoción y novedad a tu aprendizaje. "
    },
    analytical: {
      'pattern-interruption': "Metodología basada en neuroplasticidad dirigida. Eficiencia comprobada del 85% en interrupción de patrones. ",
      'confidence-rebuild': "Protocolo de reconstrucción psicológica con refuerzo positivo gradual. Resultados medibles en 3-5 sesiones. ",
      'variety-injection': "Sistema de diversificación de estímulos para prevenir habituación neuronal y acelerar aprendizaje. "
    },
    supportive: {
      'pattern-interruption': "No te preocupes, esta estrategia es muy gentil pero efectiva. Vamos a trabajar juntos paso a paso. 🤗",
      'confidence-rebuild': "Esta estrategia está diseñada para que te sientas cómodo y seguro. Iremos a tu ritmo siempre. ",
      'variety-injection': "Una forma divertida y relajada de superar el estancamiento. Sin presión, solo exploración. "
    },
    strategic: {
      'pattern-interruption': "Táctica de disrupción neurológica. Plan de acción definido para neutralizar patrones contraproducentes. ♟️",
      'confidence-rebuild': "Estrategia de recuperación psicológica mediante victorias calculadas. ROI emocional garantizado. ",
      'variety-injection': "Diversificación de portfolio de ejercicios para optimizar curva de aprendizaje. Riesgo controlado. "
    }
  }

  return descriptions[personality]?.[strategy.id] || strategy.description
}

function getPersonalizedExplanation(lesson, personality) {
  // Implementación básica - se expandiría según la lección específica
  const explanations = {
    encouraging: "¡Perfecto! Te voy a explicar esto de una manera súper clara y fácil de recordar. ",
    analytical: "Análisis lingüístico detallado del patrón específico con ejemplos estructurales. ",
    supportive: "No te preocupes si esto parece complicado al principio. Vamos paso a paso, con paciencia. 🤗",
    strategic: "Información técnica esencial para dominar este componente específico del sistema verbal. ♟️"
  }

  return explanations[personality] || explanations.encouraging
}
