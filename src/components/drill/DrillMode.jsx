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

import React, { useState, useEffect, Suspense, lazy, useCallback } from 'react'
import DrillHeader from './DrillHeader.jsx'
const QuickSwitchPanel = lazy(() => import('./QuickSwitchPanel.jsx'))
const GamesPanel = lazy(() => import('./GamesPanel.jsx'))
const PronunciationPanel = lazy(() => import('./PronunciationPanelSafe.jsx'))
import Drill from '../../features/drill/Drill.jsx'

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
  onNavigateToProgress
}) {
  const [showQuickSwitch, setShowQuickSwitch] = useState(false)
  const [showAccentKeys, setShowAccentKeys] = useState(false)
  const [showGames, setShowGames] = useState(false)
  const [showPronunciation, setShowPronunciation] = useState(false)
  const pronunciationPanelRef = React.useRef(null)

  const closeAllPanels = () => {
    setShowQuickSwitch(false)
    setShowGames(false)
    setShowPronunciation(false)
  }

  const handleToggleQuickSwitch = useCallback((show = null) => {
    const newShow = show !== null ? show : !showQuickSwitch
    if (newShow) {
      closeAllPanels()
      setShowQuickSwitch(true)
    } else {
      setShowQuickSwitch(false)
    }
  }, [showQuickSwitch])

  const handleToggleGames = useCallback((show = null) => {
    const newShow = show !== null ? show : !showGames
    if (newShow) {
      closeAllPanels()
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
        closeAllPanels()
        setShowPronunciation(true)
      }
      return
    }

    // Lógica del click en el ícono de boca
    if (!showPronunciation) {
      // Panel cerrado → Abrir panel (la grabación se inicia automáticamente en el panel)
      closeAllPanels()
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

  // Safety net: if no item is present shortly after mount or filter changes, trigger regeneration
  useEffect(() => {
    if (!currentItem && typeof onRegenerateItem === 'function') {
      const id = setTimeout(() => {
        try { onRegenerateItem() } catch { /* Generation error ignored */ }
      }, 300)
      return () => clearTimeout(id)
    }
  }, [currentItem, onRegenerateItem])

  // Listen for navigation requests from ProgressDashboard
  useEffect(() => {
    const handler = (event) => {
      try {
        const { detail } = event
        console.log('Progress navigation event received:', detail)
        
        // Handle personalized session
        if (detail && detail.type === 'personalized_session' && detail.session) {
          console.log('Starting personalized session:', detail.session)

          // Initialize session in settings
          settings.set({
            practiceMode: 'personalized_session',
            currentSession: detail.session,
            currentActivityIndex: 0,
            sessionStartTime: Date.now()
          })

          // Start with first activity
          onRegenerateItem()
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
          console.log('Micro-drill navigation:', detail.micro)
          onRegenerateItem()
        } else if (detail && detail.focus === 'review') {
          console.log('SRS review navigation', detail.filter)
          // Don't pass filter object to onPracticeModeChange - it expects strings
          // Instead, handle review mode setup directly
          settings.set({
            practiceMode: 'review',
            reviewSessionFilter: detail.filter || { urgency: 'all' }
          })
          onRegenerateItem()
        } else {
          // Fallback: just regenerate
          onRegenerateItem()
        }
      } catch (error) {
        console.error('Error handling progress navigation:', error)
      }
    }
    
    window.addEventListener('progress:navigate', handler)
    return () => window.removeEventListener('progress:navigate', handler)
  }, [onStartSpecificPractice, onRegenerateItem, onPracticeModeChange])

  return (
    <div className="App">
      <DrillHeader
        onToggleQuickSwitch={handleToggleQuickSwitch}
        onToggleAccentKeys={handleToggleAccentKeys}
        onToggleGames={handleToggleGames}
        onTogglePronunciation={handleTogglePronunciation}
        onNavigateToProgress={onNavigateToProgress}
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
        ) : (
          <div className="loading">Cargando próxima conjugación...</div>
        )}
      </main>
    </div>
  )
}

export default DrillMode
