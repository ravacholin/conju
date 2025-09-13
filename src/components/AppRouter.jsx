/**
 * AppRouter.jsx - Componente principal de enrutamiento de la aplicación
 * 
 * Este es el componente central que maneja el enrutamiento y la navegación
 * entre diferentes modos de la aplicación de conjugaciones españolas.
 * 
 * @component
 * @description
 * Responsabilidades principales:
 * - Enrutamiento entre onboarding, drill, aprendizaje y progreso
 * - Gestión del estado global de navegación
 * - Integración con sistema de configuraciones de usuario
 * - Manejo de transiciones entre modos de práctica
 * - Optimización de rendimiento con memoización
 * 
 * Estados de la aplicación:
 * - 'onboarding': Configuración inicial del usuario
 * - 'drill': Modo de práctica rápida
 * - 'learning': Flujo de aprendizaje estructurado
 * - 'progress': Dashboard de estadísticas y progreso
 * 
 * @example
 * ```jsx
 * // Uso típico en main.jsx
 * <AppRouter />
 * ```
 * 
 * @requires useSettings - Hook de configuraciones globales
 * @requires useDrillMode - Hook para modo drill
 * @requires useOnboardingFlow - Hook para flujo de onboarding
 * @requires router - Sistema de enrutamiento interno
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useSettings } from '../state/settings.js'
import OnboardingFlow from './onboarding/OnboardingFlow.jsx'
import DrillMode from './drill/DrillMode.jsx'
import LearnTenseFlow from './learning/LearnTenseFlow.jsx';
import { lazy } from 'react'
import { lazyWithRetry } from '../utils/dynamicImportRetry.js'

const ProgressDashboard = lazy(lazyWithRetry(
  () => import('../features/progress/ProgressDashboard.jsx')
))
import { useDrillMode } from '../hooks/useDrillMode.js'
import { useOnboardingFlow } from '../hooks/useOnboardingFlow.js'
import { buildFormsForRegion } from '../lib/core/eligibility.js'
import router from '../lib/routing/Router.js'

// Conditional logging - only in development
const debugLog = (message, ...args) => {
  if (import.meta.env?.DEV && !import.meta?.vitest) {
    console.log(message, ...args)
  }
}

/**
 * Componente principal de enrutamiento de la aplicación
 * @returns {JSX.Element} El componente de enrutamiento principal
 */
function AppRouter() {
  const [currentMode, setCurrentMode] = useState('onboarding')
  const settings = useSettings()
  
  // Import hooks
  const drillMode = useDrillMode()
  const onboardingFlow = useOnboardingFlow()

  // Track previous settings to detect changes from progress navigation
  const prevSettingsRef = useRef({
    practiceMode: settings.practiceMode,
    specificMood: settings.specificMood,
    specificTense: settings.specificTense,
    verbType: settings.verbType,
    selectedFamily: settings.selectedFamily
  })

  debugLog('--- RENDER AppRouter ---', { 
    currentMode,
    onboardingStep: onboardingFlow.onboardingStep
  });

  // Compute forms for current region (memoized for performance)
  const allFormsForRegion = useMemo(() => buildFormsForRegion(settings.region), [settings.region])

  // Note: Progress system initialization is handled by autoInit.js imported in main.jsx

  // Create stable refs for hooks to avoid dependency issues
  const onboardingFlowRef = useRef(onboardingFlow)
  const drillModeRef = useRef(drillMode)
  
  // Update refs when hooks change
  useEffect(() => {
    onboardingFlowRef.current = onboardingFlow
  }, [onboardingFlow])
  
  useEffect(() => {
    drillModeRef.current = drillMode
  }, [drillMode])

  // Stable route handler function
  // Stable handleRouteChange with minimal dependencies to prevent subscription leaks
  const handleRouteChange = useCallback((route, type) => {
    debugLog('📍 Route changed:', route, 'via', type)
    setCurrentMode(route.mode)
    
    if (route.mode === 'onboarding' && route.step) {
      cleanupStateForStep(route.step)
      onboardingFlowRef.current.setOnboardingStep(route.step)
    }
    
    // Regenerate drill item if navigating to drill without current item
    if (route.mode === 'drill' && !drillModeRef.current.currentItem) {
      setTimeout(() => {
        // Use the new dynamic forms generation - no need to pass allFormsForRegion
        drillModeRef.current.generateNextItem(
          null, 
          onboardingFlowRef.current.getAvailableMoodsForLevel, 
          onboardingFlowRef.current.getAvailableTensesForLevelAndMood
        )
      }, 100)
    }
  }, []) // No dependencies - prevents router re-subscriptions

  // Initialize router and subscribe to route changes
  useEffect(() => {
    // Set initial route from router
    const initialRoute = router.getCurrentRoute()
    setCurrentMode(initialRoute.mode)
    if (initialRoute.mode === 'onboarding') {
      // If dialect not selected yet, force onboarding to start at step 1
      if (!useSettings.getState().region) {
        onboardingFlowRef.current.setOnboardingStep(1)
        try { router.navigate({ mode: 'onboarding', step: 1 }) } catch { /* Navigation error ignored */ }
      } else if (initialRoute.step) {
        onboardingFlowRef.current.setOnboardingStep(initialRoute.step)
      }
    } else if (initialRoute.step) {
      onboardingFlowRef.current.setOnboardingStep(initialRoute.step)
    }

    // Subscribe to route changes
    const unsubscribe = router.subscribe(handleRouteChange)

    return unsubscribe
  }, [handleRouteChange])

  const handleStartPractice = () => {
    debugLog('🚀 handleStartPractice called');
    router.navigate({ mode: 'drill' })
  }

  const handleHome = () => {
    debugLog('🏠 handleHome called');
    router.navigate({ mode: 'onboarding', step: 2 })
  }

  const handleGoToProgress = () => {
    debugLog('📊 handleGoToProgress called');
    router.navigate({ mode: 'progress' })
  }

  const handleStartLearningNewTense = () => {
    debugLog('🧠 handleStartLearningNewTense called');
    router.navigate({ mode: 'learning' })
  };

  // From Progress page: go to onboarding menu step 2 (no dialects)
  const handleProgressMenu = () => {
    router.navigate({ mode: 'onboarding', step: 2 })
  }

  // Generate next item when entering drill mode OR when settings change while in drill mode
  useEffect(() => {
    // Check if we're in drill mode
    if (currentMode === 'drill') {
      // Detect if specific practice settings changed
      const settingsChanged = 
        prevSettingsRef.current.practiceMode !== settings.practiceMode ||
        prevSettingsRef.current.specificMood !== settings.specificMood ||
        prevSettingsRef.current.specificTense !== settings.specificTense ||
        prevSettingsRef.current.verbType !== settings.verbType ||
        prevSettingsRef.current.selectedFamily !== settings.selectedFamily;

      // If settings changed and we have a current item, clear it first
      if (settingsChanged && drillMode.currentItem && drillMode.clearCurrentItem) {
        debugLog('🔄 Practice settings changed while in drill mode, clearing current item');
        drillMode.clearCurrentItem();
      }

      // Generate new item if we don't have one (either new entry or after clearing)
      if (!drillMode.currentItem && !drillMode.isGenerating) {
        debugLog('🎯 Generating drill item');
        drillMode.generateNextItem(null, onboardingFlow.getAvailableMoodsForLevel, onboardingFlow.getAvailableTensesForLevelAndMood)
      }

      // Update previous settings reference
      prevSettingsRef.current = {
        practiceMode: settings.practiceMode,
        specificMood: settings.specificMood,
        specificTense: settings.specificTense,
        verbType: settings.verbType,
        selectedFamily: settings.selectedFamily
      };
    }
  }, [currentMode, settings.region, settings.practiceMode, settings.specificMood, settings.specificTense, settings.verbType, settings.selectedFamily, drillMode.currentItem, drillMode.isGenerating])

  // The router now handles all popstate events

  // Enhanced state cleanup function
  const cleanupStateForStep = (targetStep) => {
    debugLog(`🧹 cleanupStateForStep called for step: ${targetStep}`);
    const updates = {}
    
    // Clear settings based on target step
    // DO NOT clear region for step 1 - it should keep selected region
    if (targetStep < 1) {
      updates.region = null
    }
    if (targetStep < 3) {
      updates.level = null
    }
    if (targetStep < 4) {
      updates.practiceMode = null
    }
    if (targetStep <= 5) {
      updates.specificMood = null
      updates.specificTense = null
    }
    if (targetStep < 6) {
      updates.verbType = null
    }
    if (targetStep < 7) {
      updates.selectedFamily = null
    }

    if (Object.keys(updates).length > 0) {
      debugLog('Applying state cleanup:', updates);
      settings.set(updates)
    }
  }


  // Handler functions for drill mode settings changes
  const handleDialectChange = (dialect) => {
    onboardingFlow.selectDialect(dialect)
    drillMode.clearHistoryAndRegenerate(onboardingFlow.getAvailableMoodsForLevel, onboardingFlow.getAvailableTensesForLevelAndMood)
  }

  const handleLevelChange = (level) => {
    onboardingFlow.selectLevel(level)
    drillMode.clearHistoryAndRegenerate(onboardingFlow.getAvailableMoodsForLevel, onboardingFlow.getAvailableTensesForLevelAndMood)
  }

  const handlePracticeModeChange = (mode, mood = null, tense = null) => {
    debugLog(`Practice mode change: ${mode}, mood: ${mood}, tense: ${tense}`)
    settings.set({ 
      practiceMode: mode,
      specificMood: mood,
      specificTense: tense
    })
    drillMode.clearHistoryAndRegenerate(onboardingFlow.getAvailableMoodsForLevel, onboardingFlow.getAvailableTensesForLevelAndMood)
  }

  const handlePronounPracticeChange = (pronoun) => {
    settings.set({ practicePronoun: pronoun })
    drillMode.clearHistoryAndRegenerate(onboardingFlow.getAvailableMoodsForLevel, onboardingFlow.getAvailableTensesForLevelAndMood)
  }

  const handleVerbTypeChange = (verbType, selectedFamily) => {
    settings.set({ 
      verbType,
      selectedFamily: verbType !== 'irregular' ? null : selectedFamily
    })
    drillMode.clearHistoryAndRegenerate(onboardingFlow.getAvailableMoodsForLevel, onboardingFlow.getAvailableTensesForLevelAndMood)
  }

  const handleStartSpecificPractice = () => {
    // Initialize block for A1/A2: one tense per tanda
    const lvl = settings.level
    if (lvl === 'A1' || lvl === 'A2') {
      settings.set({
        currentBlock: {
          combos: [{ mood: settings.specificMood, tense: settings.specificTense }],
          itemsRemaining: 8
        }
      })
    } else {
      settings.set({ currentBlock: null })
    }
    // Correct argument order: (itemToExclude, getAvailableMoodsForLevel, getAvailableTensesForLevelAndMood)
    drillMode.generateNextItem(
      null,
      onboardingFlow.getAvailableMoodsForLevel,
      onboardingFlow.getAvailableTensesForLevelAndMood
    )
  }

  const handleRegenerateItem = () => {
    drillMode.setCurrentItem(null)
    // Correct argument order: (itemToExclude, getAvailableMoodsForLevel, getAvailableTensesForLevelAndMood)
    drillMode.generateNextItem(
      null,
      onboardingFlow.getAvailableMoodsForLevel,
      onboardingFlow.getAvailableTensesForLevelAndMood
    )
  }

  if (currentMode === 'onboarding') {
    return (
      <OnboardingFlow 
        onStartPractice={handleStartPractice} 
        setCurrentMode={setCurrentMode} 
        formsForRegion={allFormsForRegion}
        // Pass all hook functions as props
        onboardingStep={onboardingFlow.onboardingStep}
        selectDialect={onboardingFlow.selectDialect}
        selectLevel={onboardingFlow.selectLevel}
        selectPracticeMode={onboardingFlow.selectPracticeMode}
        selectMood={onboardingFlow.selectMood}
        selectTense={onboardingFlow.selectTense}
        selectVerbType={onboardingFlow.selectVerbType}
        selectFamily={onboardingFlow.selectFamily}
        goBack={onboardingFlow.goBack}
        goToLevelDetails={onboardingFlow.goToLevelDetails}
        handleHome={onboardingFlow.handleHome}
        settings={onboardingFlow.settings}
        getAvailableMoodsForLevel={onboardingFlow.getAvailableMoodsForLevel}
        getAvailableTensesForLevelAndMood={onboardingFlow.getAvailableTensesForLevelAndMood}
        getModeSamples={onboardingFlow.getModeSamples}
        getConjugationExample={onboardingFlow.getConjugationExample}
        onGoToProgress={handleGoToProgress}
        onStartLearningNewTense={handleStartLearningNewTense}
      />
    )
  }

  if (currentMode === 'drill') {
    return (
      <DrillMode
        currentItem={drillMode.currentItem}
        settings={settings}
        onDrillResult={drillMode.handleDrillResult}
        onContinue={() => drillMode.handleContinue(allFormsForRegion, onboardingFlow.getAvailableMoodsForLevel, onboardingFlow.getAvailableTensesForLevelAndMood)}
        onHome={handleHome}
        onRegenerateItem={handleRegenerateItem}
        onDialectChange={handleDialectChange}
        onLevelChange={handleLevelChange}
        onPracticeModeChange={handlePracticeModeChange}
        onPronounPracticeChange={handlePronounPracticeChange}
        onVerbTypeChange={handleVerbTypeChange}
        onStartSpecificPractice={handleStartSpecificPractice}
        getAvailableMoodsForLevel={onboardingFlow.getAvailableMoodsForLevel}
        getAvailableTensesForLevelAndMood={onboardingFlow.getAvailableTensesForLevelAndMood}
        onNavigateToProgress={handleGoToProgress}
      />
    )
  }

  if (currentMode === 'learning') {
    return (
      <LearnTenseFlow 
        onHome={handleHome}
        onGoToProgress={handleGoToProgress}
      />
    )
  }

  if (currentMode === 'progress') {
    return (
      <React.Suspense fallback={<div className="loading">Cargando progreso...</div>}>
        <ProgressDashboard 
          onNavigateHome={handleProgressMenu} 
          onNavigateToDrill={() => setCurrentMode('drill')} 
        />
      </React.Suspense>
    )
  }

  return (
    <div className="App">
      <div className="loading">Cargando aplicación...</div>
    </div>
  )
}

export default AppRouter
