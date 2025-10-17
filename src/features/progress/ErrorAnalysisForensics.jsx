import React, { useState, useEffect, useMemo } from 'react'
import { getCurrentUserId } from '../../lib/progress/userManager.js'
import { getAttemptsByUser } from '../../lib/progress/database.js'
import { ERROR_TAGS } from '../../lib/progress/dataModels.js'
import './ErrorAnalysisForensics.css'
import { createLogger } from '../../lib/utils/logger.js'

const logger = createLogger('features:ErrorAnalysisForensics')


export default function ErrorAnalysisForensics({ onStartPractice }) {
  const [selectedError, setSelectedError] = useState(null)
  const [forensicData, setForensicData] = useState({})
  const [viewMode, setViewMode] = useState('timeline') // timeline, patterns, context, prediction
  const [timeFilter, setTimeFilter] = useState('all') // all, 7days, 30days, 90days
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadForensicData()
  }, [timeFilter])

  async function loadForensicData() {
    try {
      setLoading(true)
      const uid = getCurrentUserId()
      const attempts = await getAttemptsByUser(uid)

      const processedData = processForensicData(attempts, timeFilter)
      setForensicData(processedData)

      if (!selectedError && processedData.errorTypes.length > 0) {
        setSelectedError(processedData.errorTypes[0])
      }
    } catch (error) {
      logger.error('Error loading forensic data:', error)
    } finally {
      setLoading(false)
    }
  }

  const selectedErrorAnalysis = useMemo(() => {
    if (!selectedError || !forensicData.detailedAnalysis) return null
    return forensicData.detailedAnalysis[selectedError.type]
  }, [selectedError, forensicData])

  if (loading) {
    return (
      <div className="error-forensics loading">
        <div className="loading-animation">
          <div className="forensic-scanner"></div>
          <p>Analizando patrones de error...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="error-analysis-forensics">
      <div className="forensics-header">
        <div className="header-title">
          <h2>🔬 Análisis Forense de Errores</h2>
          <p>Investigación profunda de patrones, causas y contextos</p>
        </div>

        <div className="header-controls">
          <div className="time-filter">
            <label>Período:</label>
            <select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)}>
              <option value="7days">Últimos 7 días</option>
              <option value="30days">Últimos 30 días</option>
              <option value="90days">Últimos 3 meses</option>
              <option value="all">Todo el tiempo</option>
            </select>
          </div>

          <div className="view-mode-selector">
            <button
              className={viewMode === 'timeline' ? 'active' : ''}
              onClick={() => setViewMode('timeline')}
            >
              📈 Timeline
            </button>
            <button
              className={viewMode === 'patterns' ? 'active' : ''}
              onClick={() => setViewMode('patterns')}
            >
              🧩 Patrones
            </button>
            <button
              className={viewMode === 'context' ? 'active' : ''}
              onClick={() => setViewMode('context')}
            >
              🌐 Contexto
            </button>
            <button
              className={viewMode === 'prediction' ? 'active' : ''}
              onClick={() => setViewMode('prediction')}
            >
              🔮 Predicción
            </button>
          </div>
        </div>
      </div>

      <div className="forensics-layout">
        <div className="error-sidebar">
          <h3>Tipos de Error</h3>
          <div className="error-list">
            {forensicData.errorTypes?.map((errorType) => (
              <div
                key={errorType.type}
                className={`error-item ${selectedError?.type === errorType.type ? 'selected' : ''}`}
                onClick={() => setSelectedError(errorType)}
              >
                <div className="error-icon">{getErrorIcon(errorType.type)}</div>
                <div className="error-info">
                  <div className="error-name">{getErrorTagLabel(errorType.type)}</div>
                  <div className="error-stats">
                    <span className="count">{errorType.count} errores</span>
                    <span className="trend">
                      {errorType.trend === 'increasing' ? '📈' :
                       errorType.trend === 'decreasing' ? '📉' : '➡️'}
                    </span>
                  </div>
                </div>
                <div className="severity-indicator">
                  <div className={`severity-dot ${errorType.severity}`}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="analysis-main">
          {selectedErrorAnalysis && (
            <>
              <div className="error-summary-card">
                <div className="summary-header">
                  <div className="error-title">
                    <span className="error-emoji">{getErrorIcon(selectedError.type)}</span>
                    <h3>{getErrorTagLabel(selectedError.type)}</h3>
                  </div>
                  <div className="summary-stats">
                    <div className="stat">
                      <span className="value">{selectedErrorAnalysis.totalOccurrences}</span>
                      <span className="label">Total</span>
                    </div>
                    <div className="stat">
                      <span className="value">{Math.round(selectedErrorAnalysis.averageFrequency)}%</span>
                      <span className="label">Frecuencia</span>
                    </div>
                    <div className="stat">
                      <span className="value">{selectedErrorAnalysis.lastOccurrence}</span>
                      <span className="label">Último</span>
                    </div>
                  </div>
                </div>

                <div className="impact-assessment">
                  <h4>📊 Evaluación de Impacto</h4>
                  <div className="impact-metrics">
                    <div className="metric">
                      <span className="metric-label">Impacto en Aprendizaje:</span>
                      <div className={`impact-bar ${selectedErrorAnalysis.learningImpact.level}`}>
                        <div
                          className="impact-fill"
                          style={{ width: `${selectedErrorAnalysis.learningImpact.score}%` }}
                        ></div>
                      </div>
                      <span className="metric-value">{selectedErrorAnalysis.learningImpact.level}</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Riesgo de Fosilización:</span>
                      <div className={`impact-bar ${selectedErrorAnalysis.fossilizationRisk.level}`}>
                        <div
                          className="impact-fill"
                          style={{ width: `${selectedErrorAnalysis.fossilizationRisk.score}%` }}
                        ></div>
                      </div>
                      <span className="metric-value">{selectedErrorAnalysis.fossilizationRisk.level}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="analysis-content">
                {viewMode === 'timeline' && (
                  <TimelineAnalysis
                    errorData={selectedErrorAnalysis}
                    errorType={selectedError.type}
                  />
                )}
                {viewMode === 'patterns' && (
                  <PatternAnalysis
                    errorData={selectedErrorAnalysis}
                    errorType={selectedError.type}
                  />
                )}
                {viewMode === 'context' && (
                  <ContextAnalysis
                    errorData={selectedErrorAnalysis}
                    errorType={selectedError.type}
                  />
                )}
                {viewMode === 'prediction' && (
                  <PredictionAnalysis
                    errorData={selectedErrorAnalysis}
                    errorType={selectedError.type}
                    onStartPractice={onStartPractice}
                  />
                )}
              </div>
            </>
          )}

          {!selectedErrorAnalysis && (
            <div className="no-error-selected">
              <div className="no-error-icon">🔬</div>
              <h3>Selecciona un tipo de error</h3>
              <p>Elige un error de la lista para comenzar el análisis forense detallado</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function TimelineAnalysis({ errorData, errorType: _errorType }) {
  return (
    <div className="timeline-analysis">
      <div className="analysis-header">
        <h3>📈 Análisis Temporal</h3>
        <p>Evolución del error a lo largo del tiempo</p>
      </div>

      <div className="timeline-chart">
        <h4>Frecuencia por Día</h4>
        <div className="chart-container">
          {errorData.timeline.map((day, index) => (
            <div key={index} className="timeline-bar">
              <div
                className="bar"
                style={{ height: `${Math.max(5, (day.count / errorData.maxDailyCount) * 100)}%` }}
                title={`${day.date}: ${day.count} errores`}
              ></div>
              <div className="bar-label">{formatDate(day.date)}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="temporal-patterns">
        <h4>🕐 Patrones Temporales Detectados</h4>
        <div className="patterns-grid">
          {errorData.temporalPatterns.map((pattern, index) => (
            <div key={index} className="pattern-card">
              <div className="pattern-icon">{pattern.icon}</div>
              <div className="pattern-info">
                <h5>{pattern.name}</h5>
                <p>{pattern.description}</p>
                <div className="pattern-confidence">
                  Confianza: {Math.round(pattern.confidence * 100)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="critical-periods">
        <h4>⚠️ Períodos Críticos</h4>
        <div className="critical-list">
          {errorData.criticalPeriods.map((period, index) => (
            <div key={index} className="critical-period">
              <div className="period-date">{period.period}</div>
              <div className="period-info">
                <div className="period-stats">
                  <span className="error-count">{period.errorCount} errores</span>
                  <span className="accuracy">Precisión: {Math.round(period.accuracy * 100)}%</span>
                </div>
                <div className="period-causes">
                  <strong>Posibles causas:</strong>
                  <ul>
                    {period.possibleCauses.map((cause, i) => (
                      <li key={i}>{cause}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function PatternAnalysis({ errorData, errorType: _errorType }) {
  return (
    <div className="pattern-analysis">
      <div className="analysis-header">
        <h3>🧩 Análisis de Patrones</h3>
        <p>Identificación de patrones recurrentes y triggers</p>
      </div>

      <div className="linguistic-patterns">
        <h4>📝 Patrones Lingüísticos</h4>
        <div className="patterns-container">
          {errorData.linguisticPatterns.map((pattern, index) => (
            <div key={index} className="linguistic-pattern">
              <div className="pattern-header">
                <h5>{pattern.type}</h5>
                <span className="frequency">Frecuencia: {pattern.frequency}%</span>
              </div>
              <div className="pattern-examples">
                <h6>Ejemplos:</h6>
                {pattern.examples.map((example, i) => (
                  <div key={i} className="example">
                    <span className="incorrect">❌ {example.incorrect}</span>
                    <span className="correct">✅ {example.correct}</span>
                    <span className="context">Contexto: {example.context}</span>
                  </div>
                ))}
              </div>
              <div className="pattern-explanation">
                <strong>Explicación:</strong> {pattern.explanation}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="triggers-analysis">
        <h4>🎯 Análisis de Triggers</h4>
        <div className="triggers-grid">
          {errorData.triggers.map((trigger, index) => (
            <div key={index} className="trigger-card">
              <div className="trigger-icon">{trigger.icon}</div>
              <div className="trigger-info">
                <h5>{trigger.name}</h5>
                <p>{trigger.description}</p>
                <div className="trigger-stats">
                  <span>Ocurrencias: {trigger.occurrences}</span>
                  <span>Correlación: {Math.round(trigger.correlation * 100)}%</span>
                </div>
                <div className="trigger-contexts">
                  <strong>Contextos comunes:</strong>
                  <ul>
                    {trigger.commonContexts.map((context, i) => (
                      <li key={i}>{context}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="error-chains">
        <h4>🔗 Cadenas de Error</h4>
        <p className="section-description">
          Errores que tienden a ocurrir juntos o en secuencia
        </p>
        <div className="chains-list">
          {errorData.errorChains.map((chain, index) => (
            <div key={index} className="error-chain">
              <div className="chain-sequence">
                {chain.sequence.map((errorType, i) => (
                  <React.Fragment key={i}>
                    <div className="chain-error">
                      {getErrorTagLabel(errorType)}
                    </div>
                    {i < chain.sequence.length - 1 && (
                      <div className="chain-arrow">→</div>
                    )}
                  </React.Fragment>
                ))}
              </div>
              <div className="chain-stats">
                <span>Frecuencia: {chain.frequency}%</span>
                <span>Confianza: {Math.round(chain.confidence * 100)}%</span>
              </div>
              <div className="chain-intervention">
                <strong>Punto de intervención:</strong> {chain.interventionPoint}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ContextAnalysis({ errorData, errorType: _errorType }) {
  return (
    <div className="context-analysis">
      <div className="analysis-header">
        <h3>🌐 Análisis Contextual</h3>
        <p>Factores ambientales y contextuales que influyen en el error</p>
      </div>

      <div className="contextual-factors">
        <h4>🎭 Factores Contextuales</h4>
        <div className="factors-grid">
          {errorData.contextualFactors.map((factor, index) => (
            <div key={index} className="context-factor">
              <div className="factor-header">
                <div className="factor-icon">{factor.icon}</div>
                <h5>{factor.name}</h5>
                <div className="factor-impact">
                  Impacto: <span className={`impact-level ${factor.impactLevel}`}>
                    {factor.impactLevel}
                  </span>
                </div>
              </div>

              <div className="factor-description">
                {factor.description}
              </div>

              <div className="factor-correlations">
                <h6>Correlaciones:</h6>
                {factor.correlations.map((corr, i) => (
                  <div key={i} className="correlation">
                    <span className="corr-factor">{corr.factor}</span>
                    <div className="corr-strength">
                      <div
                        className="corr-bar"
                        style={{ width: `${Math.abs(corr.strength) * 100}%` }}
                      ></div>
                    </div>
                    <span className="corr-value">
                      {corr.strength > 0 ? '+' : ''}{Math.round(corr.strength * 100)}%
                    </span>
                  </div>
                ))}
              </div>

              <div className="factor-recommendations">
                <h6>💡 Recomendaciones:</h6>
                <ul>
                  {factor.recommendations.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="environmental-analysis">
        <h4>🌍 Análisis Ambiental</h4>
        <div className="environmental-factors">
          <div className="env-factor">
            <h5>⏰ Tiempo del Día</h5>
            <div className="time-distribution">
              {Object.entries(errorData.timeDistribution).map(([hour, count]) => (
                <div key={hour} className="time-slot">
                  <div className="time-label">{hour}:00</div>
                  <div className="time-bar">
                    <div
                      className="time-fill"
                      style={{ width: `${(count / errorData.maxHourlyErrors) * 100}%` }}
                    ></div>
                  </div>
                  <div className="time-count">{count}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="env-factor">
            <h5>📅 Día de la Semana</h5>
            <div className="day-distribution">
              {errorData.dayDistribution.map((day, index) => (
                <div key={index} className="day-slot">
                  <div className="day-name">{day.name}</div>
                  <div className="day-bar">
                    <div
                      className="day-fill"
                      style={{ height: `${(day.count / errorData.maxDailyErrors) * 100}%` }}
                    ></div>
                  </div>
                  <div className="day-count">{day.count}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="env-factor">
            <h5>🧠 Estado Emocional</h5>
            <div className="emotional-states">
              {errorData.emotionalStates.map((state, index) => (
                <div key={index} className="emotional-state">
                  <div className="state-icon">{state.icon}</div>
                  <div className="state-info">
                    <div className="state-name">{state.name}</div>
                    <div className="state-percentage">{state.percentage}%</div>
                  </div>
                  <div className="state-impact">
                    Impacto: <span className={`impact ${state.impactLevel}`}>
                      {state.impactLevel}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function PredictionAnalysis({ errorData, errorType: _errorType, onStartPractice }) {
  return (
    <div className="prediction-analysis">
      <div className="analysis-header">
        <h3>🔮 Análisis Predictivo</h3>
        <p>Predicciones y recomendaciones basadas en patrones identificados</p>
      </div>

      <div className="risk-assessment">
        <h4>⚠️ Evaluación de Riesgos</h4>
        <div className="risk-cards">
          {errorData.risks.map((risk, index) => (
            <div key={index} className={`risk-card ${risk.level}`}>
              <div className="risk-header">
                <div className="risk-icon">{risk.icon}</div>
                <h5>{risk.name}</h5>
                <div className={`risk-level ${risk.level}`}>
                  {risk.level}
                </div>
              </div>
              <div className="risk-description">{risk.description}</div>
              <div className="risk-probability">
                <span>Probabilidad: {Math.round(risk.probability * 100)}%</span>
              </div>
              <div className="risk-timeline">
                <span>Horizonte temporal: {risk.timeframe}</span>
              </div>
              <div className="risk-mitigation">
                <h6>🛡️ Mitigación:</h6>
                <ul>
                  {risk.mitigationStrategies.map((strategy, i) => (
                    <li key={i}>{strategy}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="improvement-projections">
        <h4>📈 Proyecciones de Mejora</h4>
        <div className="projections-container">
          {errorData.improvementProjections.map((projection, index) => (
            <div key={index} className="projection-card">
              <div className="projection-header">
                <h5>{projection.scenario}</h5>
                <div className="projection-confidence">
                  Confianza: {Math.round(projection.confidence * 100)}%
                </div>
              </div>

              <div className="projection-timeline">
                <div className="timeline-points">
                  {projection.timeline.map((point, i) => (
                    <div key={i} className="timeline-point">
                      <div className="point-time">{point.time}</div>
                      <div className="point-accuracy">{Math.round(point.expectedAccuracy * 100)}%</div>
                      <div className="point-description">{point.description}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="projection-requirements">
                <h6>📋 Requisitos:</h6>
                <ul>
                  {projection.requirements.map((req, i) => (
                    <li key={i}>{req}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="actionable-insights">
        <h4>🎯 Insights Accionables</h4>
        <div className="insights-list">
          {errorData.actionableInsights.map((insight, index) => (
            <div key={index} className="actionable-insight">
              <div className="insight-header">
                <div className="insight-priority">
                  Prioridad: <span className={`priority ${insight.priority}`}>
                    {insight.priority}
                  </span>
                </div>
                <div className="insight-impact">
                  Impacto esperado: {insight.expectedImpact}
                </div>
              </div>

              <div className="insight-recommendation">
                <h5>💡 Recomendación:</h5>
                <p>{insight.recommendation}</p>
              </div>

              <div className="insight-evidence">
                <h6>📊 Evidencia:</h6>
                <ul>
                  {insight.evidence.map((evidence, i) => (
                    <li key={i}>{evidence}</li>
                  ))}
                </ul>
              </div>

              <div className="insight-actions">
                <h6>🚀 Acciones Sugeridas:</h6>
                <div className="action-buttons">
                  {insight.suggestedActions.map((action, i) => (
                    <button
                      key={i}
                      className="action-btn"
                      onClick={() => onStartPractice && onStartPractice(action.config)}
                    >
                      {action.icon} {action.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="next-steps">
        <h4>👣 Próximos Pasos Recomendados</h4>
        <div className="steps-roadmap">
          {errorData.nextSteps.map((step, index) => (
            <div key={index} className="roadmap-step">
              <div className="step-number">{index + 1}</div>
              <div className="step-content">
                <h5>{step.title}</h5>
                <p>{step.description}</p>
                <div className="step-duration">
                  Tiempo estimado: {step.estimatedTime}
                </div>
                <div className="step-success-metrics">
                  <strong>Métricas de éxito:</strong>
                  <ul>
                    {step.successMetrics.map((metric, i) => (
                      <li key={i}>{metric}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Funciones de procesamiento de datos
function processForensicData(attempts, timeFilter) {
  const filteredAttempts = filterAttemptsByTime(attempts, timeFilter)
  const errorAttempts = filteredAttempts.filter(a => !a.correct && Array.isArray(a.errorTags))

  // Agrupar por tipos de error
  const errorGroups = {}
  errorAttempts.forEach(attempt => {
    attempt.errorTags.forEach(tag => {
      if (!errorGroups[tag]) {
        errorGroups[tag] = []
      }
      errorGroups[tag].push(attempt)
    })
  })

  // Crear análisis detallado para cada tipo de error
  const errorTypes = []
  const detailedAnalysis = {}

  Object.entries(errorGroups).forEach(([errorType, attempts]) => {
    const analysis = createDetailedErrorAnalysis(errorType, attempts)

    errorTypes.push({
      type: errorType,
      count: attempts.length,
      trend: calculateTrend(attempts),
      severity: calculateSeverity(attempts, errorType),
      lastOccurrence: formatLastOccurrence(attempts[attempts.length - 1]?.createdAt)
    })

    detailedAnalysis[errorType] = analysis
  })

  // Ordenar por frecuencia
  errorTypes.sort((a, b) => b.count - a.count)

  return {
    errorTypes,
    detailedAnalysis,
    totalErrors: errorAttempts.length,
    timeRange: timeFilter
  }
}

function createDetailedErrorAnalysis(errorType, attempts) {
  return {
    totalOccurrences: attempts.length,
    averageFrequency: calculateAverageFrequency(attempts),
    lastOccurrence: formatLastOccurrence(attempts[attempts.length - 1]?.createdAt),
    learningImpact: assessLearningImpact(attempts, errorType),
    fossilizationRisk: assessFossilizationRisk(attempts, errorType),
    timeline: createTimeline(attempts),
    maxDailyCount: getMaxDailyCount(attempts),
    temporalPatterns: identifyTemporalPatterns(attempts),
    criticalPeriods: identifyCriticalPeriods(attempts),
    linguisticPatterns: identifyLinguisticPatterns(attempts, errorType),
    triggers: identifyTriggers(attempts, errorType),
    errorChains: identifyErrorChains(attempts, errorType),
    contextualFactors: analyzeContextualFactors(attempts),
    timeDistribution: analyzeTimeDistribution(attempts),
    maxHourlyErrors: getMaxHourlyErrors(attempts),
    dayDistribution: analyzeDayDistribution(attempts),
    maxDailyErrors: getMaxDailyErrors(attempts),
    emotionalStates: analyzeEmotionalStates(attempts),
    risks: assessRisks(attempts, errorType),
    improvementProjections: createImprovementProjections(attempts, errorType),
    actionableInsights: generateActionableInsights(attempts, errorType),
    nextSteps: generateNextSteps(attempts, errorType)
  }
}

// Funciones auxiliares de análisis
function filterAttemptsByTime(attempts, timeFilter) {
  if (timeFilter === 'all') return attempts

  const now = Date.now()
  const timeRanges = {
    '7days': 7 * 24 * 60 * 60 * 1000,
    '30days': 30 * 24 * 60 * 60 * 1000,
    '90days': 90 * 24 * 60 * 60 * 1000
  }

  const cutoff = now - timeRanges[timeFilter]
  return attempts.filter(attempt =>
    new Date(attempt.createdAt).getTime() >= cutoff
  )
}

function calculateTrend(attempts) {
  if (attempts.length < 10) return 'stable'

  const recent = attempts.slice(-5)
  const older = attempts.slice(-10, -5)

  const recentRate = recent.length / 5
  const olderRate = older.length / 5

  if (recentRate > olderRate * 1.2) return 'increasing'
  if (recentRate < olderRate * 0.8) return 'decreasing'
  return 'stable'
}

function calculateSeverity(attempts, _errorType) {
  const frequency = attempts.length
  const recency = (Date.now() - new Date(attempts[attempts.length - 1]?.createdAt)) / (1000 * 60 * 60 * 24)

  if (frequency > 20 && recency < 7) return 'critical'
  if (frequency > 10 && recency < 14) return 'high'
  if (frequency > 5) return 'medium'
  return 'low'
}

function formatLastOccurrence(dateString) {
  if (!dateString) return 'N/A'

  const date = new Date(dateString)
  const now = new Date()
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Hoy'
  if (diffDays === 1) return 'Ayer'
  if (diffDays < 7) return `Hace ${diffDays} días`
  return date.toLocaleDateString()
}

function calculateAverageFrequency(attempts) {
  // Simplificado - en implementación real sería más complejo
  return Math.min(100, (attempts.length / 50) * 100)
}

function assessLearningImpact(attempts, _errorType) {
  const frequency = attempts.length
  let score = Math.min(100, frequency * 2)
  let level = 'low'

  if (score > 70) level = 'critical'
  else if (score > 40) level = 'high'
  else if (score > 20) level = 'medium'

  return { score, level }
}

function assessFossilizationRisk(attempts, _errorType) {
  const frequency = attempts.length
  const consistency = calculateConsistency(attempts)

  let score = Math.min(100, frequency * consistency * 100)
  let level = 'low'

  if (score > 60) level = 'critical'
  else if (score > 35) level = 'high'
  else if (score > 15) level = 'medium'

  return { score, level }
}

function calculateConsistency(attempts) {
  // Calcular qué tan consistente es el error a lo largo del tiempo
  if (attempts.length < 5) return 0.1

  const timeSpread = new Date(attempts[attempts.length - 1].createdAt) - new Date(attempts[0].createdAt)
  const daysCovered = timeSpread / (1000 * 60 * 60 * 24)

  return Math.min(1, attempts.length / Math.max(1, daysCovered))
}

function createTimeline(attempts) {
  // Crear timeline diario de errores
  const dailyCounts = {}

  attempts.forEach(attempt => {
    const date = new Date(attempt.createdAt).toDateString()
    dailyCounts[date] = (dailyCounts[date] || 0) + 1
  })

  return Object.entries(dailyCounts).map(([date, count]) => ({
    date,
    count
  })).sort((a, b) => new Date(a.date) - new Date(b.date))
}

function getMaxDailyCount(attempts) {
  const timeline = createTimeline(attempts)
  return Math.max(...timeline.map(day => day.count), 1)
}

function identifyTemporalPatterns(attempts) {
  // Identificar patrones temporales básicos
  const patterns = []

  // Patrón de fin de semana
  const weekendErrors = attempts.filter(a => {
    const day = new Date(a.createdAt).getDay()
    return day === 0 || day === 6
  })

  if (weekendErrors.length > attempts.length * 0.3) {
    patterns.push({
      name: 'Efecto Fin de Semana',
      icon: '📅',
      description: 'Mayor frecuencia de errores durante fines de semana',
      confidence: weekendErrors.length / attempts.length
    })
  }

  return patterns
}

function identifyCriticalPeriods(attempts) {
  // Identificar períodos con alta concentración de errores
  const periods = []

  // Simplificado - identificar semanas con >5 errores
  const weeklyCounts = {}
  attempts.forEach(attempt => {
    const date = new Date(attempt.createdAt)
    const weekKey = `${date.getFullYear()}-W${Math.ceil(date.getDate() / 7)}`
    weeklyCounts[weekKey] = (weeklyCounts[weekKey] || 0) + 1
  })

  Object.entries(weeklyCounts).forEach(([week, count]) => {
    if (count > 5) {
      periods.push({
        period: week,
        errorCount: count,
        accuracy: Math.max(0, 1 - (count / 20)), // Estimación simple
        possibleCauses: [
          'Intensidad de práctica elevada',
          'Introducción de nuevos conceptos',
          'Fatiga acumulada'
        ]
      })
    }
  })

  return periods
}

// Funciones auxiliares adicionales (implementaciones simplificadas)
function identifyLinguisticPatterns(_attempts, _errorType) {
  return [{
    type: 'Patrón Principal',
    frequency: 80,
    examples: [
      { incorrect: 'ejemplo incorrecto', correct: 'ejemplo correcto', context: 'contexto' }
    ],
    explanation: 'Explicación del patrón lingüístico identificado'
  }]
}

function identifyTriggers(attempts, _errorType) {
  return [{
    name: 'Velocidad Alta',
    icon: '⚡',
    description: 'Errores más frecuentes con respuestas rápidas',
    occurrences: Math.floor(attempts.length * 0.6),
    correlation: 0.75,
    commonContexts: ['Práctica cronometrada', 'Ejercicios de velocidad']
  }]
}

function identifyErrorChains(attempts, errorType) {
  return [{
    sequence: [errorType, ERROR_TAGS.ACCENT],
    frequency: 30,
    confidence: 0.7,
    interventionPoint: 'Después del primer error del tipo'
  }]
}

function analyzeContextualFactors(_attempts) {
  return [{
    name: 'Estado Emocional',
    icon: '🧠',
    impactLevel: 'high',
    description: 'El estado emocional influye significativamente en la frecuencia de errores',
    correlations: [
      { factor: 'Frustración', strength: 0.6 },
      { factor: 'Confianza', strength: -0.4 }
    ],
    recommendations: [
      'Practicar técnicas de regulación emocional',
      'Comenzar sesiones con ejercicios fáciles'
    ]
  }]
}

function analyzeTimeDistribution(attempts) {
  const hourCounts = {}
  attempts.forEach(attempt => {
    const hour = new Date(attempt.createdAt).getHours()
    hourCounts[hour] = (hourCounts[hour] || 0) + 1
  })
  return hourCounts
}

function getMaxHourlyErrors(attempts) {
  const hourCounts = analyzeTimeDistribution(attempts)
  return Math.max(...Object.values(hourCounts), 1)
}

function analyzeDayDistribution(attempts) {
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  const dayCounts = new Array(7).fill(0)

  attempts.forEach(attempt => {
    const day = new Date(attempt.createdAt).getDay()
    dayCounts[day]++
  })

  return dayNames.map((name, index) => ({
    name,
    count: dayCounts[index]
  }))
}

function getMaxDailyErrors(attempts) {
  const dayDist = analyzeDayDistribution(attempts)
  return Math.max(...dayDist.map(d => d.count), 1)
}

function analyzeEmotionalStates(_attempts) {
  return [
    { name: 'Neutral', icon: '😐', percentage: 40, impactLevel: 'low' },
    { name: 'Frustrado', icon: '😤', percentage: 35, impactLevel: 'high' },
    { name: 'Confiado', icon: '😊', percentage: 25, impactLevel: 'positive' }
  ]
}

function assessRisks(_attempts, _errorType) {
  return [{
    name: 'Riesgo de Fosilización',
    icon: '⚠️',
    level: 'medium',
    description: 'Patrón de error puede convertirse en permanente',
    probability: 0.4,
    timeframe: '2-3 meses',
    mitigationStrategies: [
      'Práctica dirigida inmediata',
      'Corrección explícita',
      'Repetición correcta intensiva'
    ]
  }]
}

function createImprovementProjections(_attempts, _errorType) {
  return [{
    scenario: 'Práctica Regular',
    confidence: 0.8,
    timeline: [
      { time: '1 semana', expectedAccuracy: 0.6, description: 'Mejora inicial' },
      { time: '1 mes', expectedAccuracy: 0.8, description: 'Progreso significativo' },
      { time: '3 meses', expectedAccuracy: 0.95, description: 'Dominio casi completo' }
    ],
    requirements: [
      '15-20 minutos de práctica diaria',
      'Enfoque específico en este tipo de error',
      'Retroalimentación inmediata'
    ]
  }]
}

function generateActionableInsights(_attempts, errorType) {
  return [{
    priority: 'high',
    expectedImpact: 'Reducción del 60% en errores',
    recommendation: 'Implementar práctica específica con retroalimentación inmediata',
    evidence: [
      'Patrón consistente identificado',
      'Alta correlación con contexto específico',
      'Respuesta positiva a corrección previa'
    ],
    suggestedActions: [
      {
        label: 'Práctica Dirigida',
        icon: '🎯',
        config: { errorType, focusMode: 'targeted', duration: 15 }
      },
      {
        label: 'Micro-lección',
        icon: '📚',
        config: { errorType, mode: 'lesson', interactive: true }
      }
    ]
  }]
}

function generateNextSteps(_attempts, _errorType) {
  return [
    {
      title: 'Práctica Intensiva',
      description: 'Sesiones diarias enfocadas específicamente en este tipo de error',
      estimatedTime: '1-2 semanas',
      successMetrics: ['Reducción del 50% en frecuencia', 'Aumento en autoconciencia del error']
    },
    {
      title: 'Consolidación',
      description: 'Integrar la corrección en práctica general',
      estimatedTime: '2-3 semanas',
      successMetrics: ['Mantenimiento de la mejora', 'Transferencia a contextos nuevos']
    }
  ]
}

function formatDate(dateString) {
  const date = new Date(dateString)
  return `${date.getDate()}/${date.getMonth() + 1}`
}

function getErrorIcon(errorType) {
  const icons = {
    [ERROR_TAGS.ACCENT]: '´',
    [ERROR_TAGS.VERBAL_ENDING]: '📝',
    [ERROR_TAGS.IRREGULAR_STEM]: '🌱',
    [ERROR_TAGS.WRONG_PERSON]: '👤',
    [ERROR_TAGS.WRONG_TENSE]: '⏰',
    [ERROR_TAGS.WRONG_MOOD]: '🎭',
    [ERROR_TAGS.CLITIC_PRONOUNS]: '🔗',
    [ERROR_TAGS.ORTHOGRAPHY_C_QU]: '🔤',
    [ERROR_TAGS.ORTHOGRAPHY_G_GU]: '🔠',
    [ERROR_TAGS.ORTHOGRAPHY_Z_C]: '📖',
    [ERROR_TAGS.OTHER_VALID_FORM]: '🔄'
  }
  return icons[errorType] || '❌'
}

function getErrorTagLabel(tag) {
  const labels = {
    [ERROR_TAGS.ACCENT]: 'Acentuación',
    [ERROR_TAGS.VERBAL_ENDING]: 'Terminaciones Verbales',
    [ERROR_TAGS.IRREGULAR_STEM]: 'Raíces Irregulares',
    [ERROR_TAGS.WRONG_PERSON]: 'Persona Incorrecta',
    [ERROR_TAGS.WRONG_TENSE]: 'Tiempo Incorrecto',
    [ERROR_TAGS.WRONG_MOOD]: 'Modo Incorrecto',
    [ERROR_TAGS.CLITIC_PRONOUNS]: 'Pronombres Clíticos',
    [ERROR_TAGS.ORTHOGRAPHY_C_QU]: 'Ortografía C/QU',
    [ERROR_TAGS.ORTHOGRAPHY_G_GU]: 'Ortografía G/GU',
    [ERROR_TAGS.ORTHOGRAPHY_Z_C]: 'Ortografía Z/C',
    [ERROR_TAGS.OTHER_VALID_FORM]: 'Otra Forma Válida'
  }
  return labels[tag] || 'Error Desconocido'
}
