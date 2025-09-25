import React, { useMemo } from 'react'
import { ERROR_TAGS } from '../../lib/progress/dataModels.js'

export default function ErrorPatternRecognition({ attempts, mastery, onPatternAction }) {
  const patterns = useMemo(() => {
    return analyzeAdvancedPatterns(attempts, mastery)
  }, [attempts, mastery])

  return (
    <div className="error-pattern-recognition">
      <div className="patterns-header">
        <h2> Inteligencia de Patrones Avanzada</h2>
        <p className="patterns-subtitle">
          Análisis predictivo basado en comportamiento y contexto emocional
        </p>
      </div>

      <div className="patterns-categories">
        <PatternCategory
          title=" Patrones Temporales"
          patterns={patterns.temporal}
          onPatternAction={onPatternAction}
          color="#17a2b8"
        />

        <PatternCategory
          title=" Patrones Emocionales"
          patterns={patterns.emotional}
          onPatternAction={onPatternAction}
          color="#6f42c1"
        />

        <PatternCategory
          title=" Patrones Lingüísticos"
          patterns={patterns.linguistic}
          onPatternAction={onPatternAction}
          color="#dc3545"
        />

        <PatternCategory
          title=" Patrones de Progreso"
          patterns={patterns.progress}
          onPatternAction={onPatternAction}
          color="#28a745"
        />
      </div>

      <div className="pattern-insights-summary">
        <h3> Predicciones y Recomendaciones</h3>
        <div className="insights-grid">
          {generatePredictiveInsights(patterns).map((insight, index) => (
            <InsightCard key={index} insight={insight} onAction={onPatternAction} />
          ))}
        </div>
      </div>
    </div>
  )
}

function PatternCategory({ title, patterns, onPatternAction, color }) {
  if (patterns.length === 0) {
    return (
      <div className="pattern-category empty">
        <h3 >{title}</h3>
        <p className="no-patterns-message">
          ✅ No se detectaron patrones problemáticos en esta categoría
        </p>
      </div>
    )
  }

  return (
    <div className="pattern-category">
      <h3 >{title}</h3>
      <div className="patterns-list">
        {patterns.map((pattern, index) => (
          <PatternCard
            key={index}
            pattern={pattern}
            onPatternAction={onPatternAction}
            categoryColor={color}
          />
        ))}
      </div>
    </div>
  )
}

function PatternCard({ pattern, onPatternAction, categoryColor }) {
  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical': return ''
      case 'high': return ''
      case 'medium': return '🟡'
      case 'low': return '🟢'
      default: return ''
    }
  }

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return '#28a745'
    if (confidence >= 0.6) return '#ffc107'
    return '#dc3545'
  }

  return (
    <div className={`pattern-card severity-${pattern.severity}`}>
      <div className="pattern-header">
        <div className="pattern-title">
          <span className="severity-icon">{getSeverityIcon(pattern.severity)}</span>
          <h4>{pattern.title}</h4>
        </div>
        <div className="pattern-confidence">
          <span
            className="confidence-badge"
            style={{ backgroundColor: getConfidenceColor(pattern.confidence) }}
          >
            {Math.round(pattern.confidence * 100)}%
          </span>
        </div>
      </div>

      <p className="pattern-description">{pattern.description}</p>

      {pattern.data && (
        <div className="pattern-data">
          {pattern.data.frequency && (
            <div className="data-item">
              <span className="data-label">Frecuencia:</span>
              <span className="data-value">{pattern.data.frequency}</span>
            </div>
          )}
          {pattern.data.trend && (
            <div className="data-item">
              <span className="data-label">Tendencia:</span>
              <span className={`data-value trend-${pattern.data.trend}`}>
                {pattern.data.trend === 'increasing' ? ' Aumentando' :
                 pattern.data.trend === 'decreasing' ? ' Mejorando' : '➡️ Estable'}
              </span>
            </div>
          )}
          {pattern.data.contexts && (
            <div className="data-item contexts">
              <span className="data-label">Contextos:</span>
              <div className="context-tags">
                {pattern.data.contexts.map((context, i) => (
                  <span key={i} className="context-tag">{context}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="pattern-insight">
         <strong>Insight:</strong> {pattern.insight}
      </div>

      {pattern.recommendations.map((rec, index) => (
        <div key={index} className="pattern-recommendation">
           <strong>Recomendación:</strong> {rec}
        </div>
      ))}

      {pattern.actionable && (
        <div className="pattern-actions">
          {pattern.actions.map((action, index) => (
            <button
              key={index}
              className="pattern-action-btn"
              style={{ borderColor: categoryColor }}
              onClick={() => onPatternAction(action)}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function InsightCard({ insight, onAction }) {
  return (
    <div className={`insight-card priority-${insight.priority}`}>
      <div className="insight-header">
        <span className="insight-icon">{insight.icon}</span>
        <h4>{insight.title}</h4>
      </div>
      <p className="insight-description">{insight.description}</p>
      <div className="insight-prediction">
        <strong>Predicción:</strong> {insight.prediction}
      </div>
      {insight.actionable && (
        <button
          className="insight-action-btn"
          onClick={() => onAction(insight.action)}
        >
          {insight.action.label}
        </button>
      )}
    </div>
  )
}

// Análisis avanzado de patrones
function analyzeAdvancedPatterns(attempts, mastery) {
  const recentAttempts = attempts.slice(-400)
  const patterns = {
    temporal: [],
    emotional: [],
    linguistic: [],
    progress: []
  }

  // PATRONES TEMPORALES
  const temporalAnalysis = analyzeTemporalPatterns(recentAttempts)
  patterns.temporal.push(...temporalAnalysis)

  // PATRONES EMOCIONALES
  const emotionalAnalysis = analyzeEmotionalPatterns(recentAttempts)
  patterns.emotional.push(...emotionalAnalysis)

  // PATRONES LINGÜÍSTICOS
  const linguisticAnalysis = analyzeLinguisticPatterns(recentAttempts, mastery)
  patterns.linguistic.push(...linguisticAnalysis)

  // PATRONES DE PROGRESO
  const progressAnalysis = analyzeProgressPatterns(recentAttempts, mastery)
  patterns.progress.push(...progressAnalysis)

  return patterns
}

function analyzeTemporalPatterns(attempts) {
  const patterns = []

  // Análisis por hora del día
  const hourlyErrors = {}
  const hourlyTotal = {}

  attempts.forEach(attempt => {
    const hour = new Date(attempt.createdAt).getHours()
    if (!hourlyTotal[hour]) {
      hourlyTotal[hour] = 0
      hourlyErrors[hour] = 0
    }
    hourlyTotal[hour]++
    if (!attempt.correct) hourlyErrors[hour]++
  })

  // Encontrar horas problemáticas
  const hourlyRates = Object.entries(hourlyTotal)
    .filter(([_hour, total]) => total >= 10) // Mínimo 10 intentos
    .map(([hour, total]) => ({
      hour: parseInt(hour),
      rate: hourlyErrors[hour] / total,
      total,
      errors: hourlyErrors[hour]
    }))
    .sort((a, b) => b.rate - a.rate)

  if (hourlyRates.length > 0 && hourlyRates[0].rate > 0.4) {
    const problematicHour = hourlyRates[0]
    const timeLabel = getTimeLabel(problematicHour.hour)

    patterns.push({
      id: 'temporal-hour-pattern',
      title: `Errores Frecuentes ${timeLabel}`,
      description: `Cometes ${Math.round(problematicHour.rate * 100)}% más errores durante ${timeLabel.toLowerCase()}`,
      severity: problematicHour.rate > 0.5 ? 'high' : 'medium',
      confidence: Math.min(0.95, 0.6 + (problematicHour.total / 100)),
      insight: `Tu rendimiento baja significativamente en ciertos momentos del día`,
      recommendations: [
        `Evita práctica intensiva durante ${timeLabel.toLowerCase()}`,
        'Considera factores como fatiga, hambre o distracciones',
        'Programa sesiones de repaso para otros momentos'
      ],
      actionable: true,
      actions: [{
        type: 'schedule_practice',
        label: `Práctica Óptima`,
        data: { avoidHours: [problematicHour.hour] }
      }],
      data: {
        frequency: `${problematicHour.errors}/${problematicHour.total}`,
        contexts: [timeLabel]
      }
    })
  }

  // Análisis de velocidad de respuesta
  const fastResponses = attempts.filter(a => a.latencyMs && a.latencyMs < 2000)
  const fastErrors = fastResponses.filter(a => !a.correct)

  if (fastResponses.length > 20 && fastErrors.length / fastResponses.length > 0.6) {
    patterns.push({
      id: 'temporal-speed-pattern',
      title: 'Errores por Velocidad',
      description: `${Math.round((fastErrors.length / fastResponses.length) * 100)}% de errores cuando respondes muy rápido`,
      severity: 'medium',
      confidence: 0.8,
      insight: 'La impulsividad afecta tu precisión significativamente',
      recommendations: [
        'Tomate al menos 3-4 segundos antes de responder',
        'Practica técnicas de mindfulness',
        'Usa el tiempo para revisar tu respuesta mentalmente'
      ],
      actionable: true,
      actions: [{
        type: 'mindful_practice',
        label: 'Práctica Consciente',
        data: { minThinkTime: 3000 }
      }],
      data: {
        frequency: `${fastErrors.length}/${fastResponses.length}`,
        trend: 'increasing'
      }
    })
  }

  return patterns
}

function analyzeEmotionalPatterns(attempts) {
  const patterns = []

  // Análisis por estado de flow
  const flowStates = {}
  attempts.forEach(attempt => {
    const flow = attempt.flowState || 'neutral'
    if (!flowStates[flow]) {
      flowStates[flow] = { total: 0, errors: 0 }
    }
    flowStates[flow].total++
    if (!attempt.correct) flowStates[flow].errors++
  })

  // Encontrar estados problemáticos
  const problematicFlowStates = Object.entries(flowStates)
    .filter(([_state, data]) => data.total >= 15 && data.errors / data.total > 0.4)
    .sort(([,a], [,b]) => (b.errors / b.total) - (a.errors / a.total))

  problematicFlowStates.forEach(([state, data]) => {
    patterns.push({
      id: `emotional-flow-${state}`,
      title: `Errores en Estado ${state}`,
      description: `${Math.round((data.errors / data.total) * 100)}% de errores cuando estás en estado "${state}"`,
      severity: data.errors / data.total > 0.6 ? 'high' : 'medium',
      confidence: Math.min(0.9, 0.5 + (data.total / 100)),
      insight: `Tu estado emocional impacta directamente en tu rendimiento`,
      recommendations: [
        `Evita práctica cuando te sientes "${state}"`,
        'Desarrolla técnicas de regulación emocional',
        'Busca tu estado óptimo antes de practicar'
      ],
      actionable: true,
      actions: [{
        type: 'emotional_regulation',
        label: 'Regulación Emocional',
        data: { avoidStates: [state] }
      }],
      data: {
        frequency: `${data.errors}/${data.total}`,
        contexts: [state]
      }
    })
  })

  // Análisis de confianza
  const lowConfidenceErrors = attempts.filter(a =>
    !a.correct && (a.confidenceOverall || 0.5) < 0.3
  )

  if (lowConfidenceErrors.length > 15) {
    const totalErrors = attempts.filter(a => !a.correct).length
    const confidenceErrorRate = lowConfidenceErrors.length / totalErrors

    patterns.push({
      id: 'emotional-confidence-spiral',
      title: 'Espiral de Baja Confianza',
      description: `${Math.round(confidenceErrorRate * 100)}% de tus errores ocurren cuando tu confianza está baja`,
      severity: confidenceErrorRate > 0.5 ? 'high' : 'medium',
      confidence: 0.85,
      insight: 'La baja confianza crea un ciclo vicioso de más errores',
      recommendations: [
        'Empieza sesiones con ejercicios que domines',
        'Celebra pequeños éxitos para construir momentum',
        'Divide tareas difíciles en pasos más pequeños'
      ],
      actionable: true,
      actions: [{
        type: 'confidence_building',
        label: 'Construcción de Confianza',
        data: { startWithEasy: true }
      }],
      data: {
        frequency: `${lowConfidenceErrors.length}/${totalErrors}`,
        trend: 'stable'
      }
    })
  }

  return patterns
}

function analyzeLinguisticPatterns(attempts, _mastery) {
  const patterns = []

  // Análisis de errores por familia de verbos irregulares
  const errorsByFamily = {}
  const totalByFamily = {}

  attempts.forEach(attempt => {
    // Esto requeriría integración con el sistema de familias irregulares
    // Por ahora, analizamos por mood/tense combinations
    const combo = `${attempt.mood}-${attempt.tense}`
    if (!totalByFamily[combo]) {
      totalByFamily[combo] = 0
      errorsByFamily[combo] = 0
    }
    totalByFamily[combo]++
    if (!attempt.correct) errorsByFamily[combo]++
  })

  // Análisis de interferencia entre idiomas (si aplica)
  const interferencePatterns = analyzeLanguageInterference(attempts)
  patterns.push(...interferencePatterns)

  // Análisis de sobregeneralización de reglas
  const overgeneralizationPatterns = analyzeOvergeneralization(attempts)
  patterns.push(...overgeneralizationPatterns)

  return patterns
}

function analyzeProgressPatterns(attempts, mastery) {
  const patterns = []

  // Análisis de plateau (estancamiento)
  const recentMastery = mastery.slice(-50)
  if (recentMastery.length > 10) {
    const avgScores = []
    for (let i = 0; i < recentMastery.length - 5; i += 5) {
      const chunk = recentMastery.slice(i, i + 5)
      const avg = chunk.reduce((sum, m) => sum + m.score, 0) / chunk.length
      avgScores.push(avg)
    }

    // Detectar plateau (variación mínima en las últimas mediciones)
    if (avgScores.length >= 3) {
      const recentVariation = Math.max(...avgScores.slice(-3)) - Math.min(...avgScores.slice(-3))
      if (recentVariation < 5) {
        patterns.push({
          id: 'progress-plateau',
          title: 'Plateau de Aprendizaje',
          description: 'Tu progreso se ha estancado en las últimas semanas',
          severity: 'medium',
          confidence: 0.75,
          insight: 'Los plateaus son normales pero requieren cambio de estrategia',
          recommendations: [
            'Cambia tu método de práctica actual',
            'Introduce nueva complejidad gradualmente',
            'Toma un descanso corto para consolidar'
          ],
          actionable: true,
          actions: [{
            type: 'variety_boost',
            label: 'Variar Práctica',
            data: { introduceNewChallenges: true }
          }],
          data: {
            trend: 'stable'
          }
        })
      }
    }
  }

  return patterns
}

function analyzeLanguageInterference(attempts) {
  // Análisis básico de patrones que podrían indicar interferencia
  const patterns = []

  // Buscar patrones de errores que podrían ser por interferencia del inglés/otras lenguas
  const possibleInterference = attempts.filter(attempt => {
    if (!attempt.errorTags || !attempt.userAnswer || !attempt.correctAnswer) return false

    // Algunos heurísticos simples para detectar posible interferencia
    const userAnswer = attempt.userAnswer.toLowerCase()
    const correctAnswer = attempt.correctAnswer.toLowerCase()

    // Ejemplo: uso de "ed" endings (inglés) en lugar de conjugaciones españolas
    return userAnswer.includes('ed') ||
           userAnswer.includes('ing') ||
           userAnswer === correctAnswer.replace(/ó$/, 'o') // quitar acentos típico de inglés
  })

  if (possibleInterference.length > 10) {
    patterns.push({
      id: 'linguistic-interference',
      title: 'Interferencia de Lengua Materna',
      description: `Detectados ${possibleInterference.length} posibles casos de interferencia lingüística`,
      severity: 'medium',
      confidence: 0.65,
      insight: 'Tu lengua materna puede estar influyendo en tus errores de español',
      recommendations: [
        'Practica contrastes específicos entre español y tu lengua materna',
        'Aumenta exposición a input auténtico en español',
        'Desarrolla conciencia metalingüística'
      ],
      actionable: true,
      actions: [{
        type: 'contrastive_practice',
        label: 'Práctica Contrastiva',
        data: { focusOnDifferences: true }
      }],
      data: {
        frequency: `${possibleInterference.length}`,
        contexts: ['cross-linguistic']
      }
    })
  }

  return patterns
}

function analyzeOvergeneralization(attempts) {
  const patterns = []

  // Análisis básico de sobregeneralización de reglas regulares a verbos irregulares
  const regularizationErrors = attempts.filter(attempt => {
    return attempt.errorTags && attempt.errorTags.includes(ERROR_TAGS.IRREGULAR_STEM)
  })

  if (regularizationErrors.length > 20) {
    patterns.push({
      id: 'linguistic-overgeneralization',
      title: 'Sobregeneralización de Reglas',
      description: `${regularizationErrors.length} errores aplicando reglas regulares a verbos irregulares`,
      severity: 'high',
      confidence: 0.85,
      insight: 'Estás aplicando patrones regulares donde no corresponde',
      recommendations: [
        'Practica específicamente verbos irregulares frecuentes',
        'Memoriza las formas irregulares más comunes',
        'Desarrolla intuición para reconocer verbos irregulares'
      ],
      actionable: true,
      actions: [{
        type: 'irregular_focus',
        label: 'Enfoque Irregular',
        data: { irregularVerbsOnly: true }
      }],
      data: {
        frequency: `${regularizationErrors.length}`,
        trend: 'increasing'
      }
    })
  }

  return patterns
}

// Funciones de utilidad
function getTimeLabel(hour) {
  if (hour >= 5 && hour < 12) return 'Por la Mañana'
  if (hour >= 12 && hour < 18) return 'Por la Tarde'
  if (hour >= 18 && hour < 22) return 'Por la Noche'
  return 'De Madrugada'
}

function generatePredictiveInsights(patterns) {
  const insights = []

  // Generar insights predictivos basados en los patrones detectados
  const allPatterns = [
    ...patterns.temporal,
    ...patterns.emotional,
    ...patterns.linguistic,
    ...patterns.progress
  ]

  // Insight de riesgo inmediato
  const highRiskPatterns = allPatterns.filter(p => p.severity === 'high' || p.severity === 'critical')
  if (highRiskPatterns.length > 0) {
    insights.push({
      icon: '️',
      title: 'Riesgo de Frustración Alta',
      description: `${highRiskPatterns.length} patrones críticos detectados que pueden afectar tu motivación`,
      prediction: 'Alta probabilidad de abandono si no se aborda en los próximos 7 días',
      priority: 'critical',
      actionable: true,
      action: {
        type: 'emergency_intervention',
        label: 'Intervención Inmediata',
        data: { patterns: highRiskPatterns }
      }
    })
  }

  // Insight de oportunidad
  const emotionalPatterns = patterns.emotional
  if (emotionalPatterns.length > 0) {
    insights.push({
      icon: '',
      title: 'Oportunidad de Optimización',
      description: 'Tu rendimiento varía significativamente según tu estado emocional',
      prediction: 'Podrías mejorar 40-60% optimizando cuándo y cómo practicas',
      priority: 'high',
      actionable: true,
      action: {
        type: 'emotional_optimization',
        label: 'Optimizar Estado',
        data: { patterns: emotionalPatterns }
      }
    })
  }

  // Insight de progreso
  const progressPatterns = patterns.progress
  if (progressPatterns.some(p => p.id === 'progress-plateau')) {
    insights.push({
      icon: '',
      title: 'Momento de Breakthrough',
      description: 'Estás en un plateau típico antes de un gran salto de progreso',
      prediction: 'Con pequeños cambios, podrías acelerar tu progreso significativamente',
      priority: 'medium',
      actionable: true,
      action: {
        type: 'breakthrough_strategy',
        label: 'Estrategia Breakthrough',
        data: { patterns: progressPatterns }
      }
    })
  }

  return insights
}
