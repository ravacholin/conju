/**
 * DrillMode.jsx - Componente principal del modo práctica rápida
 * 
 * Este componente orquesta la interfaz de práctica rápida con paneles dinámicos,
 * integración de progreso y manejo avanzado de eventos de navegación.
 * 
 * @component
 * @description
 * Responsabilidades principales:
 * - Renderizado del componente Drill principal con gestión de estado de ítems
 * - Gestión de paneles overlay: QuickSwitch, Games (carga lazy)
 * - Integración con sistema de navegación desde ProgressDashboard
 * - Manejo de configuraciones rápidas y regeneración de ítems
 * - Safety net para regeneración automática cuando no hay ítem disponible
 * 
 * Paneles dinámicos:
 * - QuickSwitchPanel: Cambios rápidos de configuración sin perder progreso
 * - GamesPanel: Acceso a modos de juego alternativos
 * 
 * Eventos de navegación soportados:
 * - progress:navigate con mood/tense → práctica específica
 * - progress:navigate con micro → micro-drills
 * - progress:navigate con focus=review → revisión SRS
 * 
 * @example
 * ```jsx
 * // Uso típico desde AppRouter
 * <DrillMode
 *   currentItem={drillMode.currentItem}
 *   settings={settings}
 *   onDrillResult={drillMode.handleDrillResult}
 *   onContinue={() => drillMode.handleContinue(...)}
 *   onHome={handleHome}
 *   onRegenerateItem={handleRegenerateItem}
 *   // ... otros handlers
 * />
 * ```
 * 
 * @param {Object} props - Propiedades del componente
 * @param {Object} props.currentItem - Ítem de práctica actual generado por DrillItemGenerator
 * @param {Object} props.settings - Configuraciones globales de usuario (Zustand store)
 * @param {Function} props.onDrillResult - Handler para procesar resultados de práctica
 * @param {Function} props.onContinue - Handler para continuar a siguiente ítem
 * @param {Function} props.onHome - Navegación al menú principal
 * @param {Function} props.onRegenerateItem - Forzar generación de nuevo ítem
 * @param {Function} props.onDialectChange - Cambiar dialecto regional
 * @param {Function} props.onPracticeModeChange - Cambiar modo de práctica (mixed/specific)
 * @param {Function} props.onStartSpecificPractice - Iniciar práctica específica configurada
 * @param {Function} props.getAvailableMoodsForLevel - Obtener modos disponibles por nivel
 * @param {Function} props.getAvailableTensesForLevelAndMood - Obtener tiempos por nivel/modo
 * @param {Function} props.onNavigateToProgress - Navegar al dashboard de progreso
 * @param {Function} props.onNavigateToStory - Lanzar el modo historias
 * @param {Function} props.onNavigateToTimeline - Lanzar el modo línea de tiempo
 * @param {Function} props.getGenerationStats - Obtener estadísticas de generación (diagnóstico)
 * @param {Function} props.isGenerationViable - Verificar si la generación es viable
 * 
 * @requires Drill - Componente core de práctica de conjugaciones
 * @requires DrillHeader - Header con botones de navegación y paneles
 * @requires QuickSwitchPanel - Panel de cambios rápidos (lazy)
 * @requires GamesPanel - Panel de modos de juego (lazy)
 * 
 * @see {@link ../../features/drill/Drill.jsx} - Componente core de práctica
 * @see {@link ./DrillHeader.jsx} - Header de navegación
 * @see {@link ./QuickSwitchPanel.jsx} - Panel de configuración rápida
 */

import React, { useState, useEffect, Suspense, useCallback } from 'react'
import DrillHeader from './DrillHeader.jsx'
import { safeLazy } from '../../lib/utils/lazyImport.js';
import { useSessionStore } from '../../state/session.js'
import { createLogger } from '../../lib/utils/logger.js'
import { buildGenerationDetail, buildGenerationSuggestions } from './generationDiagnostics.js'

const QuickSwitchPanel = safeLazy(() => import('./QuickSwitchPanel.jsx'))
const GamesPanel = safeLazy(() => import('./GamesPanel.jsx'))
const PronunciationPanel = safeLazy(() => import('./PronunciationPanelSafe.jsx'))
import Drill from '../../features/drill/Drill.jsx'

const logger = createLogger('drill:mode')

/**
 * Componente principal del modo práctica rápida
 * 
 * @param {Object} props - Propiedades del componente según la documentación JSDoc superior
 * @returns {JSX.Element} El componente de modo drill
 */
function DrillMode({
  currentItem,
  settings,
  onDrillResult,
  onContinue,
  onHome,
  onRegenerateItem,
  onDialectChange,
  onPracticeModeChange,
  onStartSpecificPractice,
  getAvailableMoodsForLevel,
  getAvailableTensesForLevelAndMood,
  onNavigateToProgress,
  onNavigateToStory,
  onNavigateToTimeline,
  getGenerationStats,
  isGenerationViable
}) {
  const [showQuickSwitch, setShowQuickSwitch] = useState(false)
  const [showAccentKeys, setShowAccentKeys] = useState(false)
  const [showGames, setShowGames] = useState(false)
  const [showPronunciation, setShowPronunciation] = useState(false)
  const [loadingError, setLoadingError] = useState(null)
  const [loadingTimeout, setLoadingTimeout] = useState(false)
  const [generationIssue, setGenerationIssue] = useState(null)
  const pronunciationPanelRef = React.useRef(null)
  const LOADING_TIMEOUT_REF = React.useRef(null)
  const startPersonalizedSession = useSessionStore((state) => state.startPersonalizedSession)
  const setDrillRuntimeContext = useSessionStore((state) => state.setDrillRuntimeContext)

  const handleToggleQuickSwitch = useCallback((show = null) => {
    const newShow = show !== null ? show : !showQuickSwitch
    if (newShow) {
      setShowGames(false)
      setShowPronunciation(false)
      setShowQuickSwitch(true)
    } else {
      setShowQuickSwitch(false)
    }
  }, [showQuickSwitch])

  const handleToggleGames = useCallback((show = null) => {
    const newShow = show !== null ? show : !showGames
    if (newShow) {
      setShowQuickSwitch(false)
      setShowPronunciation(false)
      setShowGames(true)
    } else {
      setShowGames(false)
    }
  }, [showGames])

  const handleTogglePronunciation = useCallback((show = null) => {
    // Si el show es explícito (desde botón cerrar), úsalo
    if (show !== null) {
      if (show === false) {
        setShowPronunciation(false)
      } else {
        setShowQuickSwitch(false)
        setShowGames(false)
        setShowPronunciation(true)
      }
      return
    }

    // Lógica del click en el ícono de boca
    if (!showPronunciation) {
      // Panel cerrado → Abrir panel (la grabación se inicia automáticamente en el panel)
      setShowQuickSwitch(false)
      setShowGames(false)
      setShowPronunciation(true)
    } else {
      // Panel abierto → Toggle grabación (NO cerrar panel)
      if (pronunciationPanelRef.current?.toggleRecording) {
        pronunciationPanelRef.current.toggleRecording()
      }
    }
  }, [showPronunciation])

  const handleToggleAccentKeys = () => {
    setShowAccentKeys(prev => !prev)
  }


  const handleQuickSwitchApply = () => {
    onRegenerateItem()
    setShowQuickSwitch(false)
  }

  const buildGenerationDiagnostics = useCallback(async () => {
    if (typeof getGenerationStats !== 'function' || typeof isGenerationViable !== 'function') {
      return null
    }

    try {
      const [stats, viable] = await Promise.all([
        getGenerationStats(),
        isGenerationViable()
      ])

      if (viable) {
        return null
      }

      const totalForms = Number(stats?.totalForms || 0)
      const eligibleForms = Number(stats?.eligibleForms || 0)
      const filteringReport = stats?.lastFilteringReport || null
      const suggestions = buildGenerationSuggestions(settings, filteringReport)
      const detail = buildGenerationDetail(totalForms, filteringReport)

      return {
        detail,
        totalForms,
        eligibleForms,
        filteringReport,
        suggestions,
        error: stats?.error || null
      }
    } catch (error) {
      return {
        detail: 'No pudimos diagnosticar la generación en este momento.',
        error: error?.message || String(error)
      }
    }
  }, [getGenerationStats, isGenerationViable, settings.practiceMode, settings.practicePronoun, settings.selectedFamily, settings.specificMood, settings.specificTense, settings.verbType])

  const applyGenerationSuggestion = useCallback((suggestionId) => {
    if (!suggestionId) {
      return
    }

    switch (suggestionId) {
      case 'switch-to-mixed':
      case 'switch-theme-to-mixed':
        if (typeof onPracticeModeChange === 'function') {
          onPracticeModeChange('mixed')
        } else {
          settings.set({
            practiceMode: 'mixed',
            specificMood: null,
            specificTense: null
          })
        }
        break
      case 'verb-type-all':
        settings.set({ verbType: 'all' })
        break
      case 'clear-family':
        settings.set({ selectedFamily: null })
        break
      case 'pronoun-all':
        settings.set({ practicePronoun: 'all' })
        break
      default:
        return
    }

    setLoadingError(null)
    setLoadingTimeout(false)
    setGenerationIssue(null)
    onRegenerateItem()
  }, [onPracticeModeChange, onRegenerateItem, settings])

  // Enhanced safety net: if no item is present, trigger regeneration with escalating timeouts
  useEffect(() => {
    if (!currentItem && typeof onRegenerateItem === 'function') {
      // Clear any previous error states
      setLoadingError(null)
      setLoadingTimeout(false)
      setGenerationIssue(null)

      // First attempt after 300ms (quick retry)
      const quickRetryId = setTimeout(() => {
        try {
          logger.debug('🔄 DrillMode: Quick retry for missing currentItem')
          onRegenerateItem()
        } catch (error) {
          logger.error('Quick retry failed', error)
        }
      }, 300)

      // Timeout warning after 8 seconds
      const timeoutWarningId = setTimeout(() => {
        if (!currentItem) {
          logger.warn('Item generation taking longer than expected')
          setLoadingTimeout(true)
          buildGenerationDiagnostics().then(setGenerationIssue)
        }
      }, 8000)

      // Final timeout and error after 15 seconds
      const finalTimeoutId = setTimeout(() => {
        if (!currentItem) {
          logger.error('Item generation failed - timeout after 15 seconds')
          setLoadingError('La generación de ejercicios está tardando más de lo esperado. Esto puede deberse a una configuración muy restrictiva.')
          buildGenerationDiagnostics().then(setGenerationIssue)
        }
      }, 15000)

      return () => {
        clearTimeout(quickRetryId)
        clearTimeout(timeoutWarningId)
        clearTimeout(finalTimeoutId)
      }
    } else {
      // Clear error states when we have an item
      setLoadingError(null)
      setLoadingTimeout(false)
      setGenerationIssue(null)
    }
  }, [buildGenerationDiagnostics, currentItem, onRegenerateItem])

  // Listen for navigation requests from ProgressDashboard
  useEffect(() => {
    const handler = (event) => {
      try {
        const { detail } = event
        logger.debug('Progress navigation event received:', detail)

        // Handle personalized session
        if (detail && detail.type === 'personalized_session' && detail.session) {
          logger.debug('Starting personalized session:', detail.session)

          // Initialize session in settings
          settings.set({
            practiceMode: 'personalized_session'
          })
          startPersonalizedSession(detail.session)

          // Start with first activity
          onRegenerateItem()
        }
        // Handle immediate practice from recommendations
        else if (detail && detail.type === 'immediate_practice') {
          logger.debug('Starting immediate practice:', detail.recommendation)

          // Configure practice based on recommendation
          if (detail.mood && detail.tense) {
            // Specific mood/tense practice
            if (typeof onPracticeModeChange === 'function') {
              onPracticeModeChange('specific', detail.mood, detail.tense)
            }

            if (typeof onStartSpecificPractice === 'function') {
              onStartSpecificPractice()
            } else {
              setTimeout(() => onRegenerateItem(), 100)
            }
          } else if (detail.focus) {
            // Focus-based practice
            const focusSettings = {
              practiceMode: 'mixed'
            }

            switch (detail.focus) {
              case 'weak_areas':
                focusSettings.verbType = 'irregular' // More challenging
                break
              case 'review':
                focusSettings.practiceMode = 'review'
                break
              case 'new_content':
                focusSettings.verbType = 'regular' // Easier start
                break
              case 'balanced':
              default:
                // Use current settings
                break
            }

            settings.set(focusSettings)
            onRegenerateItem()
          } else {
            // Fallback to general practice
            onRegenerateItem()
          }
        }
        // If we have mood/tense data, set specific practice mode
        else if (detail && detail.mood && detail.tense) {
          // Set specific practice mode
          if (typeof onPracticeModeChange === 'function') {
            onPracticeModeChange('specific', detail.mood, detail.tense)
          }

          // Start specific practice
          if (typeof onStartSpecificPractice === 'function') {
            onStartSpecificPractice()
          } else {
            // Fallback: regenerate item after settings change
            setTimeout(() => onRegenerateItem(), 100)
          }
        } else if (detail && detail.micro) {
          // Handle micro-drill navigation
          logger.debug('Micro-drill navigation:', detail.micro)
          onRegenerateItem()
        } else if (detail && detail.focus === 'review') {
          logger.debug('SRS review navigation', detail.filter)
          // Don't pass filter object to onPracticeModeChange - it expects strings
          // Instead, handle review mode setup directly
          settings.set({ practiceMode: 'review' })
          setDrillRuntimeContext({
            reviewSessionType: detail.sessionType || 'due',
            reviewSessionFilter: detail.filter || { urgency: 'all' }
          })
          onRegenerateItem()
        } else {
          // Fallback: just regenerate
          onRegenerateItem()
        }
      } catch (error) {
        logger.error('Error handling progress navigation', error)
      }
    }

    window.addEventListener('progress:navigate', handler)
    return () => window.removeEventListener('progress:navigate', handler)
  }, [setDrillRuntimeContext, onStartSpecificPractice, onRegenerateItem, onPracticeModeChange, settings])

  return (
    <div className="App">
      <DrillHeader
        onToggleQuickSwitch={handleToggleQuickSwitch}
        onToggleAccentKeys={handleToggleAccentKeys}
        onToggleGames={handleToggleGames}
        onTogglePronunciation={handleTogglePronunciation}
        onNavigateToProgress={onNavigateToProgress}
        onNavigateToStory={onNavigateToStory}
        onNavigateToTimeline={onNavigateToTimeline}
        onHome={onHome}
        showQuickSwitch={showQuickSwitch}
        showGames={showGames}
        showPronunciation={showPronunciation}
      />

      {showQuickSwitch && (
        <Suspense fallback={<div className="loading">Cargando opciones rápidas...</div>}>
          <QuickSwitchPanel
            settings={settings}
            onApply={handleQuickSwitchApply}
            onClose={() => handleToggleQuickSwitch(false)}
            getAvailableMoodsForLevel={getAvailableMoodsForLevel}
            getAvailableTensesForLevelAndMood={getAvailableTensesForLevelAndMood}
            onDialectChange={onDialectChange}
          />
        </Suspense>
      )}

      {showGames && (
        <Suspense fallback={<div className="loading">Cargando juegos...</div>}>
          <GamesPanel
            settings={settings}
            onClose={() => handleToggleGames(false)}
            onRegenerateItem={onRegenerateItem}
          />
        </Suspense>
      )}

      {showPronunciation && (
        <Suspense fallback={<div className="loading">Cargando pronunciación...</div>}>
          <PronunciationPanel
            ref={pronunciationPanelRef}
            currentItem={currentItem}
            onClose={() => handleTogglePronunciation(false)}
            handleResult={onDrillResult}
            onContinue={onContinue}
          />
        </Suspense>
      )}

      <main className="main-content">
        {currentItem ? (
          <Drill
            currentItem={currentItem}
            onResult={onDrillResult}
            onContinue={onContinue}
            showAccentKeys={showAccentKeys}
          />
        ) : loadingError ? (
          <div className="loading-error">
            <div className="error-message">
              <h3>⚠️ Error de generación</h3>
              <p>{loadingError}</p>
              {generationIssue && (
                <div className="generation-diagnostics">
                  <p><strong>Diagnóstico:</strong> {generationIssue.detail}</p>
                  {typeof generationIssue.totalForms === 'number' && typeof generationIssue.eligibleForms === 'number' && (
                    <p>Formas totales: {generationIssue.totalForms} · Elegibles: {generationIssue.eligibleForms}</p>
                  )}
                  {generationIssue.filteringReport?.emptyReason && (
                    <p>Causa detectada: {generationIssue.filteringReport.emptyReason}</p>
                  )}
                  {generationIssue.error && (
                    <p>Detalle técnico: {generationIssue.error}</p>
                  )}
                  {Array.isArray(generationIssue.suggestions) && generationIssue.suggestions.length > 0 && (
                    <ul>
                      {generationIssue.suggestions.map((suggestion) => (
                        <li key={suggestion.id}>
                          {suggestion.reason}
                          <button
                            type="button"
                            onClick={() => applyGenerationSuggestion(suggestion.id)}
                            style={{ marginLeft: '8px' }}
                          >
                            {suggestion.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              <div className="error-actions">
                <button
                  onClick={() => {
                    setLoadingError(null)
                    setLoadingTimeout(false)
                    setGenerationIssue(null)
                    onRegenerateItem()
                  }}
                  className="retry-button"
                >
                  🔄 Intentar de nuevo
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="reload-button"
                >
                  🔄 Recargar página
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="loading">
            {loadingTimeout ? (
              <div>
                <div>⏳ Generando ejercicio...</div>
                <div style={{ fontSize: '0.9em', marginTop: '10px', opacity: 0.7 }}>
                  Esto está tardando más de lo esperado. Si el problema persiste, intenta cambiar la configuración.
                </div>
                {generationIssue && (
                  <div style={{ marginTop: '12px', fontSize: '0.9em', opacity: 0.85 }}>
                    <div><strong>Diagnóstico:</strong> {generationIssue.detail}</div>
                    {typeof generationIssue.totalForms === 'number' && typeof generationIssue.eligibleForms === 'number' && (
                      <div>Formas totales: {generationIssue.totalForms} · Elegibles: {generationIssue.eligibleForms}</div>
                    )}
                    {generationIssue.filteringReport?.emptyReason && (
                      <div>Causa detectada: {generationIssue.filteringReport.emptyReason}</div>
                    )}
                    {Array.isArray(generationIssue.suggestions) && generationIssue.suggestions.length > 0 && (
                      <ul style={{ marginTop: '8px' }}>
                        {generationIssue.suggestions.map((suggestion) => (
                          <li key={suggestion.id}>
                            {suggestion.reason}
                            <button
                              type="button"
                              onClick={() => applyGenerationSuggestion(suggestion.id)}
                              style={{ marginLeft: '8px' }}
                            >
                              {suggestion.label}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
                <button
                  onClick={() => {
                    logger.debug('🔄 DrillMode: Manual retry triggered by user')
                    onRegenerateItem()
                  }}
                  style={{ marginTop: '15px', padding: '8px 16px' }}
                >
                  Forzar regeneración
                </button>
              </div>
            ) : (
              'Cargando próxima conjugación...'
            )}
          </div>
        )}
      </main>
    </div>
  )
}

export default DrillMode
