import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useSettings } from '../state/settings.js'
import OnboardingFlow from './onboarding/OnboardingFlow.jsx'
import DrillMode from './drill/DrillMode.jsx'
import LearnTenseFlow from './learning/LearnTenseFlow.jsx';
import { lazy } from 'react'

const ProgressDashboard = lazy(() => import('../features/progress/ProgressDashboard.jsx'))
import { useDrillMode } from '../hooks/useDrillMode.js'
import { useOnboardingFlow } from '../hooks/useOnboardingFlow.js'
import { buildFormsForRegion } from '../lib/core/eligibility.js'
import router from '../lib/routing/Router.js'

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

  console.log('--- RENDER AppRouter ---', { 
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
  const handleRouteChange = useCallback((route, type) => {
    console.log('📍 Route changed:', route, 'via', type)
    setCurrentMode(route.mode)
    
    if (route.mode === 'onboarding' && route.step) {
      cleanupStateForStep(route.step)
      onboardingFlowRef.current.setOnboardingStep(route.step)
    }
    
    // Regenerate drill item if navigating to drill without current item
    if (route.mode === 'drill' && !drillModeRef.current.currentItem) {
      setTimeout(() => {
        drillModeRef.current.generateNextItem(
          null, 
          allFormsForRegion, 
          onboardingFlowRef.current.getAvailableMoodsForLevel, 
          onboardingFlowRef.current.getAvailableTensesForLevelAndMood
        )
      }, 100)
    }
  }, [allFormsForRegion])

  // Initialize router and subscribe to route changes
  useEffect(() => {
    // Set initial route from router
    const initialRoute = router.getCurrentRoute()
    setCurrentMode(initialRoute.mode)
    if (initialRoute.step) {
      onboardingFlowRef.current.setOnboardingStep(initialRoute.step)
    }

    // Subscribe to route changes
    const unsubscribe = router.subscribe(handleRouteChange)

    return unsubscribe
  }, [handleRouteChange])

  const handleStartPractice = () => {
    console.log('🚀 handleStartPractice called');
    router.navigate({ mode: 'drill' })
  }

  const handleHome = () => {
    console.log('🏠 handleHome called');
    router.navigate({ mode: 'onboarding', step: 2 })
  }

  const handleGoToProgress = () => {
    console.log('📊 handleGoToProgress called');
    router.navigate({ mode: 'progress' })
  }

  const handleStartLearningNewTense = () => {
    console.log('🧠 handleStartLearningNewTense called');
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
        console.log('🔄 Practice settings changed while in drill mode, clearing current item');
        drillMode.clearCurrentItem();
      }

      // Generate new item if we don't have one (either new entry or after clearing)
      if (!drillMode.currentItem) {
        console.log('🎯 Generating drill item');
        drillMode.generateNextItem(null, allFormsForRegion, onboardingFlow.getAvailableMoodsForLevel, onboardingFlow.getAvailableTensesForLevelAndMood)
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
  }, [currentMode, settings.region, settings.practiceMode, settings.specificMood, settings.specificTense, settings.verbType, settings.selectedFamily, allFormsForRegion, drillMode, onboardingFlow])

  // The router now handles all popstate events

  // Enhanced state cleanup function
  const cleanupStateForStep = (targetStep) => {
    console.log(`🧹 cleanupStateForStep called for step: ${targetStep}`);
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
      console.log('Applying state cleanup:', updates);
      settings.set(updates)
    }
  }


  // Handler functions for drill mode settings changes
  const handleDialectChange = (dialect) => {
    onboardingFlow.selectDialect(dialect)
    drillMode.clearHistoryAndRegenerate(allFormsForRegion, onboardingFlow.getAvailableMoodsForLevel, onboardingFlow.getAvailableTensesForLevelAndMood)
  }

  const handleLevelChange = (level) => {
    onboardingFlow.selectLevel(level)
    drillMode.clearHistoryAndRegenerate(allFormsForRegion, onboardingFlow.getAvailableMoodsForLevel, onboardingFlow.getAvailableTensesForLevelAndMood)
  }

  const handlePracticeModeChange = (mode, mood = null, tense = null) => {
    console.log(`Practice mode change: ${mode}, mood: ${mood}, tense: ${tense}`)
    settings.set({ 
      practiceMode: mode,
      specificMood: mood,
      specificTense: tense
    })
    drillMode.clearHistoryAndRegenerate(allFormsForRegion, onboardingFlow.getAvailableMoodsForLevel, onboardingFlow.getAvailableTensesForLevelAndMood)
  }

  const handlePronounPracticeChange = (pronoun) => {
    settings.set({ practicePronoun: pronoun })
    drillMode.clearHistoryAndRegenerate(allFormsForRegion, onboardingFlow.getAvailableMoodsForLevel, onboardingFlow.getAvailableTensesForLevelAndMood)
  }

  const handleVerbTypeChange = (verbType, selectedFamily) => {
    settings.set({ 
      verbType,
      selectedFamily: verbType !== 'irregular' ? null : selectedFamily
    })
    drillMode.clearHistoryAndRegenerate(allFormsForRegion, onboardingFlow.getAvailableMoodsForLevel, onboardingFlow.getAvailableTensesForLevelAndMood)
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
    drillMode.generateNextItem(null, allFormsForRegion, onboardingFlow.getAvailableMoodsForLevel, onboardingFlow.getAvailableTensesForLevelAndMood)
  }

  const handleRegenerateItem = () => {
    drillMode.setCurrentItem(null)
    drillMode.generateNextItem(null, allFormsForRegion, onboardingFlow.getAvailableMoodsForLevel, onboardingFlow.getAvailableTensesForLevelAndMood)
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
