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

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useSettings } from '../state/settings.js'
import OnboardingFlow from './onboarding/OnboardingFlow.jsx'
import SyncStatusIndicator from './sync/SyncStatusIndicator.jsx'
import { lazy } from 'react'
import { lazyWithRetry } from '../utils/dynamicImportRetry.js'
import { useShallow } from 'zustand/react/shallow'

const ProgressDashboard = lazy(lazyWithRetry(
  () => import('../features/progress/ProgressDashboard.jsx')
))
const DrillMode = lazy(lazyWithRetry(
  () => import('./drill/DrillMode.jsx')
))
const LearnTenseFlowContainer = lazy(lazyWithRetry(
  () => import('./learning/LearnTenseFlow.jsx')
))
const StoryMode = lazy(lazyWithRetry(
  () => import('../features/story/StoryMode.jsx')
))
const TimelineMode = lazy(lazyWithRetry(
  () => import('../features/timeline/TimelineMode.jsx')
))
import { useDrillMode } from '../hooks/useDrillMode.js'
import { useOnboardingFlow } from '../hooks/useOnboardingFlow.js'
import router from '../lib/routing/Router.js'

// Centralized logger for development-only debug output
const logger = {
  debug(message, ...args) {
    if (import.meta.env?.DEV && !import.meta?.vitest) {
      console.log(message, ...args)
    }
  }
}

/**
 * Componente principal de enrutamiento de la aplicación
 * @returns {JSX.Element} El componente de enrutamiento principal
 */
function AppRouter() {
  const [currentMode, setCurrentMode] = useState('onboarding')
  const settings = useSettings(
    useShallow((state) => ({
      region: state.region,
      useVoseo: state.useVoseo,
      useTuteo: state.useTuteo,
      useVosotros: state.useVosotros,
      strict:
        state.strict ??
        !(state.useTuteo && state.useVoseo && state.useVosotros),
      practiceMode: state.practiceMode,
      specificMood: state.specificMood,
      specificTense: state.specificTense,
      practicePronoun: state.practicePronoun,
      verbType: state.verbType,
      selectedFamily: state.selectedFamily,
      level: state.level,
      set: state.set
    }))
  )

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


  // Note: Progress system initialization is handled by autoInit.js imported in main.jsx

  // Create stable refs for hooks to avoid dependency issues
  const onboardingFlowRef = useRef(onboardingFlow)
  const drillModeRef = useRef(drillMode)
  const forceFullResetRef = useRef(false)
  const drillGenTimeoutRef = useRef(null)

  // Update refs when hooks change
  useEffect(() => {
    onboardingFlowRef.current = onboardingFlow
  }, [onboardingFlow])

  useEffect(() => {
    drillModeRef.current = drillMode
  }, [drillMode])

  const clearDrillGenerationTimeout = useCallback(() => {
    if (drillGenTimeoutRef.current) {
      clearTimeout(drillGenTimeoutRef.current)
      drillGenTimeoutRef.current = null
    }
  }, [])

  const scheduleDrillGeneration = useCallback((callback, delay = 100) => {
    clearDrillGenerationTimeout()
    drillGenTimeoutRef.current = setTimeout(() => {
      drillGenTimeoutRef.current = null
      callback()
    }, delay)
  }, [clearDrillGenerationTimeout])

  // Stable route handler function
  // Stable handleRouteChange with minimal dependencies to prevent subscription leaks
  const handleRouteChange = useCallback((route, _type) => {
    setCurrentMode(route.mode)

    if (route.mode === 'onboarding' && route.step) {
      cleanupStateForStep(route.step)
      onboardingFlowRef.current.setOnboardingStep(route.step, { syncRouter: false })
    }

    // Regenerate drill item if navigating to drill without current item
    if (route.mode === 'drill' && !drillModeRef.current.currentItem) {
      scheduleDrillGeneration(() => {
        // Use the new dynamic forms generation - no need to pass cached region forms
        drillModeRef.current.generateNextItem(
          null,
          onboardingFlowRef.current.getAvailableMoodsForLevel,
          onboardingFlowRef.current.getAvailableTensesForLevelAndMood
        )
      }, 100)
    }
  }, [clearDrillGenerationTimeout, scheduleDrillGeneration]) // Stable dependencies to prevent router re-subscriptions

  // Initialize router and subscribe to route changes
  useEffect(() => {
    // Set initial route from router
    const initialRoute = router.getCurrentRoute()
    setCurrentMode(initialRoute.mode)
    if (initialRoute.mode === 'onboarding') {
      // If dialect not selected yet, force onboarding to start at step 1
      if (!useSettings.getState().region) {
        onboardingFlowRef.current.setOnboardingStep(1, { syncRouter: false })
        // Don't call router.navigate here - it will cause a loop with useOnboardingFlow useEffect
      } else if (initialRoute.step) {
        onboardingFlowRef.current.setOnboardingStep(initialRoute.step, { syncRouter: false })
      }
    } else if (initialRoute.step) {
      onboardingFlowRef.current.setOnboardingStep(initialRoute.step, { syncRouter: false })
    }

    // Subscribe to route changes
    const unsubscribe = router.subscribe(handleRouteChange)

    return unsubscribe
  }, [handleRouteChange])

  const handleStartPractice = () => {
    router.navigate({ mode: 'drill' })
  }

  const handleStartStoryMode = () => {
    router.navigate({ mode: 'story' })
  }

  const handleStartTimelineMode = () => {
    router.navigate({ mode: 'timeline' })
  }

  const handleHome = () => {
    router.navigate({ mode: 'onboarding', step: 2 })
  }

  const handleGoToProgress = () => {
    router.navigate({ mode: 'progress' })
  }

  const handleStartLearningNewTense = () => {
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
      // CRITICAL: Always read fresh settings from store to avoid stale closures
      const LATEST_SETTINGS = useSettings.getState();

      // Detect if specific practice settings changed
      const settingsChanged =
        prevSettingsRef.current.practiceMode !== LATEST_SETTINGS.practiceMode ||
        prevSettingsRef.current.specificMood !== LATEST_SETTINGS.specificMood ||
        prevSettingsRef.current.specificTense !== LATEST_SETTINGS.specificTense ||
        prevSettingsRef.current.verbType !== LATEST_SETTINGS.verbType ||
        prevSettingsRef.current.selectedFamily !== LATEST_SETTINGS.selectedFamily;

      // If settings changed and we have a current item, clear it first
      if (settingsChanged && drillMode.currentItem && drillMode.clearCurrentItem) {
        drillMode.clearCurrentItem();
      }

      // Generate new item if we don't have one (either new entry or after clearing)
      if (!drillMode.currentItem && !drillMode.isGenerating) {
        // Add a delay to ensure settings have fully propagated through all stores
        scheduleDrillGeneration(() => {
          const helpers = onboardingFlowRef.current
          if (!helpers) {
            return
          }
          drillMode.generateNextItem(
            null,
            helpers.getAvailableMoodsForLevel,
            helpers.getAvailableTensesForLevelAndMood
          )
        }, 100);
      }

      // Update previous settings reference with LATEST settings
      prevSettingsRef.current = {
        practiceMode: LATEST_SETTINGS.practiceMode,
        specificMood: LATEST_SETTINGS.specificMood,
        specificTense: LATEST_SETTINGS.specificTense,
        verbType: LATEST_SETTINGS.verbType,
        selectedFamily: LATEST_SETTINGS.selectedFamily
      };
    }
  }, [
    currentMode,
    drillMode.currentItem,
    drillMode.isGenerating,
    settings.practiceMode,
    settings.specificMood,
    settings.specificTense,
    settings.verbType,
    settings.selectedFamily,
    scheduleDrillGeneration
  ])

  useEffect(() => {
    return () => {
      clearDrillGenerationTimeout()
    }
  }, [clearDrillGenerationTimeout])

  // The router now handles all popstate events

  // Enhanced state cleanup function
  const cleanupStateForStep = (targetStep) => {
    const currentSettings = useSettings.getState()

    if (targetStep === 1) {
      forceFullResetRef.current = true
    }

    const isFullResetFlow = forceFullResetRef.current || targetStep === 1
    const shouldPreserveMenuSelections = targetStep === 2 && !isFullResetFlow

    if (!isFullResetFlow) {
      // IMPORTANT: If user has valid specific practice settings, preserve them
      // This handles navigation from drill → menu → progress correctly
      const hasValidSpecificSettings =
        currentSettings.practiceMode === 'specific' &&
        currentSettings.specificMood &&
        currentSettings.specificTense
      const hasValidThemeSettings =
        currentSettings.practiceMode === 'theme' &&
        currentSettings.specificMood &&
        currentSettings.specificTense

      if (hasValidSpecificSettings || hasValidThemeSettings) {
        return // Don't reset anything
      }
    }

    const updates = {}

    // Clear settings based on target step
    // DO NOT clear region for step 1 - it should keep selected region
    if (targetStep < 1) {
      updates.region = null
    }
    if (!shouldPreserveMenuSelections && targetStep < 3) {
      updates.level = null
    }
    if (!shouldPreserveMenuSelections && targetStep < 4) {
      updates.practiceMode = null
    }
    if (!shouldPreserveMenuSelections && targetStep <= 5) {
      updates.specificMood = null
      updates.specificTense = null
    }
    if (!shouldPreserveMenuSelections && targetStep < 6) {
      updates.verbType = null
    }
    if (!shouldPreserveMenuSelections && targetStep < 7) {
      updates.selectedFamily = null
    }

    if (Object.keys(updates).length > 0) {
      settings.set(updates)
    }

    if (targetStep >= 2 && forceFullResetRef.current) {
      forceFullResetRef.current = false
    }
  }


  // Handler functions for drill mode settings changes
  const handleDialectChange = (dialect, options = {}) => {
    const { preserveFilters = false } = options

    if (preserveFilters) {
      const variantUpdates = {
        rioplatense: {
          useVoseo: true,
          useTuteo: false,
          useVosotros: false,
          strict: true,
          region: 'rioplatense',
          practicePronoun: 'all'
        },
        la_general: {
          useTuteo: true,
          useVoseo: false,
          useVosotros: false,
          strict: true,
          region: 'la_general',
          practicePronoun: 'both'
        },
        peninsular: {
          useTuteo: true,
          useVoseo: false,
          useVosotros: true,
          strict: true,
          region: 'peninsular',
          practicePronoun: 'both'
        },
        both: {
          useTuteo: true,
          useVoseo: true,
          useVosotros: true,
          strict: false,
          region: 'la_general',
          practicePronoun: 'all'
        }
      }

      settings.set(variantUpdates[dialect] || variantUpdates.la_general)
    } else {
      onboardingFlow.selectDialect(dialect)
    }

    drillMode.clearHistoryAndRegenerate(
      null,
      onboardingFlow.getAvailableMoodsForLevel,
      onboardingFlow.getAvailableTensesForLevelAndMood
    )
  }

  const handleLevelChange = (level) => {
    onboardingFlow.selectLevel(level)
    drillMode.clearHistoryAndRegenerate(
      null,
      onboardingFlow.getAvailableMoodsForLevel,
      onboardingFlow.getAvailableTensesForLevelAndMood
    )
  }

  const handlePracticeModeChange = (mode, mood = null, tense = null) => {
    // Ensure mood names are in data format (English) for consistent filtering
    // The forms in data use English names, so settings should match
    let normalizedMood = mood
    if (mood === 'subjuntivo') normalizedMood = 'subjunctive'
    if (mood === 'indicativo') normalizedMood = 'indicative'
    if (mood === 'imperativo') normalizedMood = 'imperative'
    if (mood === 'condicional') normalizedMood = 'conditional'
    // If already in English format, keep as-is

    // CRITICAL: Ensure level is set when navigating from progress
    // If level is null but userLevel exists, sync them for proper exercise generation
    const currentSettings = useSettings.getState()
    const updates = {
      practiceMode: mode,
      specificMood: normalizedMood,
      specificTense: tense
    }

    // Fix level inconsistency: if level is null but userLevel exists, use userLevel
    if (!currentSettings.level && currentSettings.userLevel) {
      updates.level = currentSettings.userLevel
      logger.debug(
        `🔧 AppRouter: Auto-setting level=${currentSettings.userLevel} from userLevel for progress navigation`
      )
    }

    settings.set(updates)
    drillMode.clearHistoryAndRegenerate(
      null,
      onboardingFlow.getAvailableMoodsForLevel,
      onboardingFlow.getAvailableTensesForLevelAndMood
    )
  }

  const handlePronounPracticeChange = (pronoun) => {
    settings.set({ practicePronoun: pronoun })
    drillMode.clearHistoryAndRegenerate(
      null,
      onboardingFlow.getAvailableMoodsForLevel,
      onboardingFlow.getAvailableTensesForLevelAndMood
    )
  }

  const handleVerbTypeChange = (verbType, selectedFamily) => {
    settings.set({
      verbType,
      selectedFamily: verbType !== 'irregular' ? null : selectedFamily
    })
    drillMode.clearHistoryAndRegenerate(
      null,
      onboardingFlow.getAvailableMoodsForLevel,
      onboardingFlow.getAvailableTensesForLevelAndMood
    )
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
      <>
        <SyncStatusIndicator />
        <OnboardingFlow
          onStartPractice={handleStartPractice}
          setCurrentMode={setCurrentMode}
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
      </>
    )
  }

  if (currentMode === 'drill') {
    return (
      <>
        <SyncStatusIndicator />
        <React.Suspense fallback={<div className="loading">Cargando práctica...</div>}>
          <DrillMode
          currentItem={drillMode.currentItem}
          settings={settings}
          onDrillResult={drillMode.handleDrillResult}
          onContinue={() => drillMode.handleContinue(null, onboardingFlow.getAvailableMoodsForLevel, onboardingFlow.getAvailableTensesForLevelAndMood)}
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
          onNavigateToStory={handleStartStoryMode}
          onNavigateToTimeline={handleStartTimelineMode}
          getGenerationStats={drillMode.getGenerationStats}
          isGenerationViable={drillMode.isGenerationViable}
          />
        </React.Suspense>
      </>
    )
  }

  if (currentMode === 'story') {
    return (
      <>
        <SyncStatusIndicator />
        <React.Suspense fallback={<div className="loading">Cargando historias...</div>}>
          <StoryMode
            onBack={handleStartPractice}
            onHome={handleHome}
          />
        </React.Suspense>
      </>
    )
  }

  if (currentMode === 'timeline') {
    return (
      <>
        <SyncStatusIndicator />
        <React.Suspense fallback={<div className="loading">Cargando línea de tiempo...</div>}>
          <TimelineMode
            onBack={handleStartPractice}
            onHome={handleHome}
          />
        </React.Suspense>
      </>
    )
  }

  if (currentMode === 'learning') {
    return (
      <>
        <SyncStatusIndicator />
        <React.Suspense fallback={<div className="loading">Cargando aprendizaje...</div>}>
          <LearnTenseFlowContainer
            onHome={handleHome}
            onGoToProgress={handleGoToProgress}
          />
        </React.Suspense>
      </>
    )
  }

  if (currentMode === 'progress') {
    return (
      <>
        <SyncStatusIndicator />
        <React.Suspense fallback={<div className="loading">Cargando progreso...</div>}>
          <ProgressDashboard
            onNavigateHome={handleProgressMenu}
            onNavigateToDrill={() => {
              // Navigate first, let the AppRouter's useEffect handle drill regeneration
              // This ensures settings are fully applied before regeneration
              router.navigate({ mode: 'drill' })
            }}
            onNavigateToStory={handleStartStoryMode}
            onNavigateToTimeline={handleStartTimelineMode}
          />
        </React.Suspense>
      </>
    )
  }

  return (
    <div className="App">
      <SyncStatusIndicator />
      <div className="loading">Cargando aplicación...</div>
    </div>
  )
}

export default AppRouter
